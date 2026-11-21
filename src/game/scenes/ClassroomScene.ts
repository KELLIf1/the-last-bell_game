import Phaser from 'phaser';
import { audioManager } from '../../systems/AudioManager';
import { CameraDirector } from '../../systems/CameraDirector';
import { dialogueSystem } from '../../systems/DialogueSystem';
import { EventBus } from '../../systems/EventBus';
import { evidenceSystem } from '../../systems/EvidenceSystem';
import { InteractionSystem } from '../../systems/InteractionSystem';
import { puzzleManager } from '../../systems/PuzzleManager';
import { saveManager } from '../../systems/SaveManager';
import { AssembledScene, getObjectLabelAr, SceneAssembler } from '../../systems/SceneAssembler';
import { storyManager } from '../../systems/StoryManager';
import { timerManager } from '../../systems/TimerManager';
import { uiSettings } from '../../systems/UiSettings';
import {
  DialogueLine,
  SceneCharacterConfig,
  SceneId,
  SceneLayoutConfig,
  SceneObjectConfig,
} from '../../types/game';

interface ClassroomSceneData {
  sceneId?: SceneId;
  playerPosition?: { x: number; y: number };
}

export class ClassroomScene extends Phaser.Scene {
  private currentSceneId: SceneId = 'classroom_emergency';
  private assembled: AssembledScene | null = null;
  private interactionSystem = new InteractionSystem();
  private moveTarget: { x: number; y: number } | null = null;
  private keys: {
    up?: Phaser.Input.Keyboard.Key;
    down?: Phaser.Input.Keyboard.Key;
    left?: Phaser.Input.Keyboard.Key;
    right?: Phaser.Input.Keyboard.Key;
    w?: Phaser.Input.Keyboard.Key;
    a?: Phaser.Input.Keyboard.Key;
    s?: Phaser.Input.Keyboard.Key;
    d?: Phaser.Input.Keyboard.Key;
    e?: Phaser.Input.Keyboard.Key;
  } = {};
  private pausedModal = false;
  private finaleTriggered = false;
  private projectorActivated = false;
  private projectorBeacon: Phaser.GameObjects.Arc | null = null;
  private endingTransitioned = false;

  constructor() {
    super({ key: 'ClassroomScene' });
  }

  init(data?: ClassroomSceneData): void {
    this.currentSceneId = data?.sceneId ?? 'classroom_emergency';
    this.moveTarget = null;
    this.pausedModal = false;
    this.finaleTriggered = false;
    this.projectorActivated = false;
    this.projectorBeacon = null;
    this.endingTransitioned = false;
    if (data?.playerPosition) {
      this.registry.set('restorePlayerPos', data.playerPosition);
    } else {
      this.registry.remove('restorePlayerPos');
    }
  }

  create(): void {
    this.interactionSystem.clear();
    const configs = this.registry.get('sceneConfigs') as Record<string, SceneLayoutConfig>;
    const layout = configs?.[this.currentSceneId];
    if (!layout) {
      console.error(`[ClassroomScene] Missing scene layout: ${this.currentSceneId}`);
      return;
    }

    this.assembled = SceneAssembler.build(this, layout, this.interactionSystem, {
      onObjectInteract: (obj) => this.handleObjectInteract(obj),
      onCharacterInteract: (ch) => this.handleCharacterInteract(ch),
    });

    CameraDirector.attach(this, {
      layout,
      getPlayer: () => this.assembled?.playerSprite,
      getCharacterContainers: () => this.assembled?.characterContainers,
    });

    const restorePos = this.registry.get('restorePlayerPos') as { x: number; y: number } | undefined;
    if (restorePos && this.assembled.playerSprite) {
      const clamped = this.assembled.clampToWalkable(restorePos.x, restorePos.y);
      this.assembled.playerSprite.setPosition(clamped.x, clamped.y);
      this.assembled.updateDepthsByY();
      this.registry.remove('restorePlayerPos');
    }

    // Point-and-click walk on floor area
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (this.pausedModal || dialogueSystem.isActive()) return;
      if (currentlyOver.length > 0) return; // Clicked an interactive hotspot
      if (!this.assembled?.playerSprite) return;
      const clamped = this.assembled.clampToWalkable(pointer.worldX, pointer.worldY);
      this.moveTarget = clamped;
    });

    // Keyboard setup + blur safety
    if (this.input.keyboard) {
      this.keys = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        e: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      };
    }

    const onBlur = () => {
      this.moveTarget = null;
      this.input.keyboard?.resetKeys();
    };
    window.addEventListener('blur', onBlur);
    this.events.once('shutdown', () => {
      window.removeEventListener('blur', onBlur);
      this.interactionSystem.clear();
    });

    const unsubPause = EventBus.on<boolean>('game:modal_open', (isOpen) => {
      this.pausedModal = isOpen;
      if (isOpen) {
        timerManager.pause();
      } else {
        timerManager.resume();
      }
    });
    const unsubControlsDismiss = EventBus.on('controls_hint:dismiss', () => {
      this.dismissControlsHint();
    });
    const unsubPuzzleSolved = EventBus.on('puzzle:solved', () => {
      this.syncObjectiveText();
      this.autoSave();
    });
    const unsubTimerExpired = EventBus.on('timer:expired', () => {
      this.handleTimeoutConsequence();
    });
    const unsubDialogueBeat = EventBus.on<{ active: boolean; line: DialogueLine | null }>(
      'dialogue:state',
      (state) => {
        if (!state.active || !state.line) return;
        const id = state.line.id;
        if (id === 'fin_1' || id === 'to_1') {
          this.triggerSubtleLightFlicker();
        } else if (id === 'fin_2' || id === 'to_2') {
          audioManager.playDoorLock(true);
          this.hideKarimAfterSummons();
        } else if (id === 'fin_4') {
          this.activateFinaleProjector(true);
        }
      }
    );
    const onSceneResume = () => {
      if (this.registry.get('pendingTimeoutEnding')) {
        this.registry.remove('pendingTimeoutEnding');
        this.handleTimeoutConsequence();
        return;
      }
      this.syncObjectiveText();
      this.autoSave();
      this.checkChapterEnd();
    };
    this.events.on('resume', onSceneResume);
    this.events.once('shutdown', () => {
      unsubPause();
      unsubControlsDismiss();
      unsubPuzzleSolved();
      unsubTimerExpired();
      unsubDialogueBeat();
      EventBus.emit('controls_hint:show', false);
      EventBus.emit('closeup:desk7', false);
      this.projectorBeacon?.destroy();
      this.projectorBeacon = null;
      this.events.off('resume', onSceneResume);
    });

    EventBus.emit('screen:mode', 'PLAYING');
    EventBus.emit('scene:changed', this.currentSceneId);
    audioManager.setRainActive(true);
    audioManager.setAmbienceActive(true);
    audioManager.setTensionMusic(true);

    uiSettings.markIntroSeen();

    if (storyManager.getFlag('ch1_finale_started') === true) {
      this.finaleTriggered = true;
    }
    if (
      storyManager.getFlag('ch1_karim_summoned') === true &&
      storyManager.getFlag('ch1_room0_teaser_seen') !== true &&
      storyManager.getFlag('puzzle_01_failed_timeout') !== true
    ) {
      this.activateFinaleProjector(false);
    }

    this.syncObjectiveText();
    if (storyManager.getFlag('ch1_first_exploration_toast') !== true) {
      storyManager.setFlag('ch1_first_exploration_toast', true);
      EventBus.emit('toast:show', {
        titleAr: 'تم إغلاق الفصل 3B — تفقّد الأدلة الخمسة وتحدّث مع زملائك',
        titleEn: 'Classroom 3B locked — Inspect all 5 clues and question your classmates',
        tone: 'warning',
        durationMs: 7500,
      });
    }
    if (
      storyManager.getFlag('ch1_controls_hint_seen') !== true &&
      !uiSettings.hasSeenControlsHint()
    ) {
      EventBus.emit('controls_hint:show', true);
    }
    this.cameras.main.fadeIn(400, 4, 7, 13);

    if (this.registry.get('pendingTimeoutEnding')) {
      this.registry.remove('pendingTimeoutEnding');
      this.handleTimeoutConsequence();
    } else {
      this.checkChapterEnd();
    }
  }

  private dismissControlsHint(): void {
    if (storyManager.getFlag('ch1_controls_hint_seen') !== true) {
      storyManager.setFlag('ch1_controls_hint_seen', true);
    }
    uiSettings.markControlsHintSeen();
    EventBus.emit('controls_hint:show', false);
  }

  private syncObjectiveText(): void {
    const solved = storyManager.getFlag('puzzle_01_solved') === true;
    const karimSummoned = storyManager.getFlag('ch1_karim_summoned') === true;
    const room0Seen = storyManager.getFlag('ch1_room0_teaser_seen') === true;
    const failedTimeout = storyManager.getFlag('puzzle_01_failed_timeout') === true;

    if (!solved && puzzleManager.isUnlocked()) {
      if (storyManager.getFlag('puzzle_01_unlocked') !== true) {
        storyManager.setFlag('puzzle_01_unlocked', true);
        EventBus.emit('toast:show', {
          titleAr: 'تم فتح اللغز الأول: اضغط على السبورة أو زر «اللغز الأول» أعلى الشاشة',
          titleEn: 'Puzzle 01 unlocked: Click the Whiteboard or Puzzle button',
          tone: 'evidence',
        });
      }
    }

    if (karimSummoned && !room0Seen && !failedTimeout) {
      EventBus.emit('objective:updated', {
        textAr: 'افحص جهاز العرض المضاء في السقف',
        textEn: 'Inspect the glowing ceiling projector',
      });
    } else if (solved) {
      EventBus.emit('objective:updated', {
        textAr: 'تم حل اللغز — تحدّث مع الطلاب المتبقين وتابع التحقيق',
        textEn: 'Puzzle solved — Question the remaining students',
      });
    } else if (puzzleManager.isUnlocked()) {
      EventBus.emit('objective:updated', {
        textAr: 'حل لغز ترتيب المقاعد (اضغط على السبورة أو زر اللغز)',
        textEn: 'Solve Puzzle 01: The Seating Order',
      });
    } else {
      EventBus.emit('objective:updated', {
        textAr: 'تفقّد الفصل واجمع الأدلة الخمسة',
        textEn: 'Investigate the classroom and collect 5 evidence items',
      });
    }
  }

  private triggerSubtleLightFlicker(): void {
    const flickerRect = this.add.rectangle(640, 360, 1280, 720, 0x04070d, 0).setDepth(970);
    this.tweens.add({
      targets: flickerRect,
      alpha: 0.42,
      duration: 110,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => flickerRect.destroy(),
    });
  }

  private hideKarimAfterSummons(): void {
    const karimContainer = this.assembled?.characterContainers.get('karim');
    if (karimContainer && karimContainer.visible) {
      this.tweens.add({
        targets: karimContainer,
        alpha: 0,
        duration: 380,
        onComplete: () => {
          karimContainer.setVisible(false);
        },
      });
    }
    this.interactionSystem.remove('char_karim');
  }

  private activateFinaleProjector(showHighlightFlash: boolean): void {
    if (this.projectorActivated) return;
    this.projectorActivated = true;

    const layout = this.assembled?.layout;
    const W = layout?.baseResolution.width ?? 1280;
    const H = layout?.baseResolution.height ?? 720;
    const projObj = layout?.objects.find((o) => o.id === 'projector');
    const iz = projObj?.interactionZone ?? { x: 0.47, y: 0.102, w: 0.085, h: 0.07 };
    const zx = (iz.x + iz.w / 2) * W;
    const zy = (iz.y + iz.h / 2) * H;

    if (this.interactionSystem.hasTarget('projector')) {
      this.interactionSystem.setMaxDist('projector', 620);
    } else if (projObj) {
      const zw = Math.max(iz.w * W, 118);
      const zh = Math.max(iz.h * H, 68);
      const zone = this.add.zone(zx, zy, zw, zh).setDepth(950);
      const highlight = this.add
        .rectangle(zx, zy, zw, zh)
        .setStrokeStyle(2, 0xd6a65d, 0.9)
        .setFillStyle(0x38bdf8, 0.1)
        .setVisible(false)
        .setDepth(940);

      this.interactionSystem.register({
        id: 'projector',
        labelAr: getObjectLabelAr('projector', projObj.label),
        labelEn: projObj.label,
        x: zx,
        y: zy,
        maxDistPx: 620,
        zone,
        highlightRect: highlight,
        onInteract: () => this.handleObjectInteract(projObj),
      });
    }

    if (!this.projectorBeacon) {
      const beacon = this.add.circle(zx, zy, 22, 0x38bdf8, 0.18).setStrokeStyle(2, 0xd6a65d, 0.85).setDepth(920);
      this.tweens.add({
        targets: beacon,
        scale: 1.24,
        alpha: 0.42,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.projectorBeacon = beacon;
    }

    if (showHighlightFlash) {
      audioManager.playClockTick();
    }
  }

  private checkChapterEnd(): void {
    if (this.finaleTriggered || storyManager.getFlag('ch1_finale_started') === true) return;
    if (storyManager.getFlag('puzzle_01_failed_timeout') === true) return;
    if (this.pausedModal || dialogueSystem.isActive() || !this.scene.isActive('ClassroomScene')) return;

    const allTalked =
      storyManager.getFlag('talked_layan') === true &&
      storyManager.getFlag('talked_yacine') === true &&
      storyManager.getFlag('talked_nour') === true &&
      storyManager.getFlag('talked_mariam') === true &&
      storyManager.getFlag('talked_karim') === true;

    if (storyManager.getFlag('puzzle_01_solved') !== true || !allTalked) {
      return;
    }

    this.finaleTriggered = true;
    this.moveTarget = null;
    timerManager.pause();
    storyManager.setFlag('ch1_finale_started', true);
    this.autoSave();

    dialogueSystem.startConversation('ch1_finale', () => {
      this.activateFinaleProjector(true);
      this.syncObjectiveText();
      this.autoSave();
      EventBus.emit('toast:show', {
        titleAr: 'انظر إلى السقف: اضغط على جهاز العرض المضاء أو اضغط E',
        titleEn: 'Look up: Click the glowing ceiling projector or press E',
        tone: 'warning',
      });
    });
  }

  private handleTimeoutConsequence(): void {
    if (this.finaleTriggered || storyManager.getFlag('ch1_finale_started') === true) return;
    if (!this.scene.isActive('ClassroomScene')) return;

    this.finaleTriggered = true;
    this.moveTarget = null;
    this.pausedModal = false;
    timerManager.pause();
    storyManager.setFlags({
      puzzle_01_failed_timeout: true,
      ch1_finale_started: true,
    });

    this.triggerSubtleLightFlicker();
    audioManager.playDoorLock(false);

    dialogueSystem.startConversation('ch1_timeout', () => {
      this.transitionToEnding();
    });
  }

  private transitionToEnding(): void {
    if (this.endingTransitioned) return;
    this.endingTransitioned = true;
    timerManager.pause();
    this.cameras.main.fadeOut(450, 4, 7, 13);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('EndingScene');
    });
  }

  private showDesk7Closeup(): void {
    if (!this.textures.exists('bg_desk7_closeup')) return;
    this.pausedModal = true;
    const overlay = this.add.container(640, 360).setDepth(980);
    const dimmer = this.add.rectangle(0, 0, 1280, 720, 0x04070d, 0.88).setInteractive();
    const img = this.add.image(0, -14, 'bg_desk7_closeup').setDisplaySize(920, 518);
    const frame = this.add.rectangle(0, -14, 924, 522).setStrokeStyle(2, 0xd6a65d, 0.85);

    overlay.add([dimmer, img, frame]);
    EventBus.emit('closeup:desk7', true);

    let closed = false;
    let unsubDomClose: (() => void) | null = null;
    const closeOverlay = () => {
      if (closed) return;
      closed = true;
      audioManager.playClick();
      unsubDomClose?.();
      unsubDomClose = null;
      this.input.keyboard?.off('keydown-E', closeOverlay);
      this.input.keyboard?.off('keydown-ESC', closeOverlay);
      overlay.destroy();
      this.pausedModal = false;
      EventBus.emit('closeup:desk7', false);
    };
    unsubDomClose = EventBus.on('closeup:desk7_close', closeOverlay);
    dimmer.once('pointerdown', closeOverlay);
    this.input.keyboard?.on('keydown-E', closeOverlay);
    this.input.keyboard?.on('keydown-ESC', closeOverlay);
  }

  private handleObjectInteract(obj: SceneObjectConfig): void {
    if (this.pausedModal || dialogueSystem.isActive()) return;
    this.dismissControlsHint();
    audioManager.playClick();

    if (obj.evidenceId) {
      const newlyCollected = evidenceSystem.collect(obj.evidenceId);
      if (obj.id === 'class_photo') {
        this.showDesk7Closeup();
      } else if (!newlyCollected && !(obj.id === 'board' && puzzleManager.isUnlocked() && storyManager.getFlag('puzzle_01_solved') !== true)) {
        const labelAr = getObjectLabelAr(obj.id, obj.label);
        EventBus.emit('toast:show', {
          titleAr: `تم فحص: ${labelAr}`,
          titleEn: `Already inspected: ${obj.label} (view in Notebook)`,
          tone: 'info',
        });
      }
      this.syncObjectiveText();
      if (obj.id === 'board' && puzzleManager.isUnlocked() && storyManager.getFlag('puzzle_01_solved') !== true) {
        this.scene.launch('PuzzleScene');
        this.scene.pause();
      }
      this.autoSave();
      return;
    }

    if (obj.id === 'projector') {
      if (storyManager.getFlag('ch1_karim_summoned') !== true) {
        EventBus.emit('toast:show', {
          titleAr: 'الشاشة معطلة الآن... لعلها تعمل لاحقاً',
          titleEn: 'The projector screen is inactive right now... maybe later.',
          tone: 'info',
        });
        return;
      }
      if (storyManager.getFlag('ch1_room0_teaser_seen') === true) {
        EventBus.emit('toast:show', {
          titleAr: 'تم فحص البث الأخير لجهاز العرض',
          titleEn: 'The final projector broadcast has already been inspected.',
          tone: 'info',
        });
        return;
      }
      dialogueSystem.startConversation('ch1_projector_teaser', () => {
        this.autoSave();
        this.transitionToEnding();
      });
      return;
    }

    if (obj.id === 'door') {
      audioManager.playDoorLock(false);
      EventBus.emit('toast:show', {
        titleAr: 'الباب الإلكتروني مقفل بإحكام — ضوء التحذير الأحمر مضاء',
        titleEn: 'Electronic door is locked from outside.',
        tone: 'warning',
      });
    }
  }

  private handleCharacterInteract(ch: SceneCharacterConfig): void {
    if (this.pausedModal || dialogueSystem.isActive()) return;
    this.dismissControlsHint();
    audioManager.playClick();
    const convId = `conv_${ch.id}`;
    dialogueSystem.startConversation(convId, () => {
      this.syncObjectiveText();
      this.autoSave();
      this.checkChapterEnd();
    });
  }

  private autoSave(): void {
    const px = this.assembled?.playerSprite?.x ?? 471;
    const py = this.assembled?.playerSprite?.y ?? 588;
    this.registry.set('lastPlayerPos', { x: px, y: py });
    saveManager.save(this.currentSceneId, { x: px, y: py });
  }

  update(_time: number, delta: number): void {
    if (this.pausedModal) return;

    timerManager.update(delta);

    if (dialogueSystem.isActive() || !this.assembled?.playerSprite) return;

    if (this.keys.e && Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      this.interactionSystem.triggerActive();
    }

    const dtSec = Math.min(delta / 1000, 0.05);
    const speed = 220;
    const player = this.assembled.playerSprite;

    let vx = 0;
    let vy = 0;
    if (this.keys.left?.isDown || this.keys.a?.isDown) vx -= 1;
    if (this.keys.right?.isDown || this.keys.d?.isDown) vx += 1;
    if (this.keys.up?.isDown || this.keys.w?.isDown) vy -= 1;
    if (this.keys.down?.isDown || this.keys.s?.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      this.moveTarget = null;
      const len = Math.hypot(vx, vy);
      const next = this.assembled.clampToWalkable(
        player.x + (vx / len) * speed * dtSec,
        player.y + (vy / len) * speed * dtSec
      );
      player.setPosition(next.x, next.y);
      this.assembled.updateDepthsByY();
    } else if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, this.moveTarget.x, this.moveTarget.y);
      if (dist < 6) {
        this.moveTarget = null;
      } else {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, this.moveTarget.x, this.moveTarget.y);
        const next = this.assembled.clampToWalkable(
          player.x + Math.cos(angle) * speed * dtSec,
          player.y + Math.sin(angle) * speed * dtSec
        );
        player.setPosition(next.x, next.y);
        this.assembled.updateDepthsByY();
      }
    }

    this.interactionSystem.updateProximity(player.x, player.y);
  }
}
