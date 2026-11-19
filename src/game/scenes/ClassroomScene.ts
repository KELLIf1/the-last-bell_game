import Phaser from 'phaser';
import { audioManager } from '../../systems/AudioManager';
import { CameraDirector } from '../../systems/CameraDirector';
import { dialogueSystem } from '../../systems/DialogueSystem';
import { EventBus } from '../../systems/EventBus';
import { evidenceSystem } from '../../systems/EvidenceSystem';
import { InteractionSystem } from '../../systems/InteractionSystem';
import { puzzleManager } from '../../systems/PuzzleManager';
import { saveManager } from '../../systems/SaveManager';
import { AssembledScene, SceneAssembler } from '../../systems/SceneAssembler';
import { storyManager } from '../../systems/StoryManager';
import { timerManager } from '../../systems/TimerManager';
import {
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

  constructor() {
    super({ key: 'ClassroomScene' });
  }

  init(data?: ClassroomSceneData): void {
    this.currentSceneId = data?.sceneId ?? 'classroom_emergency';
    this.moveTarget = null;
    this.pausedModal = false;
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
    const unsubPuzzleSolved = EventBus.on('puzzle:solved', () => {
      this.syncObjectiveText();
      this.autoSave();
    });
    const onSceneResume = () => {
      this.syncObjectiveText();
      this.autoSave();
    };
    this.events.on('resume', onSceneResume);
    this.events.once('shutdown', () => {
      unsubPause();
      unsubPuzzleSolved();
      this.events.off('resume', onSceneResume);
    });

    EventBus.emit('screen:mode', 'PLAYING');
    EventBus.emit('scene:changed', this.currentSceneId);
    audioManager.setRainActive(true);
    audioManager.setAmbienceActive(true);
    audioManager.setTensionMusic(true);

    this.syncObjectiveText();
    if (storyManager.getFlag('ch1_first_exploration_toast') !== true) {
      storyManager.setFlag('ch1_first_exploration_toast', true);
      EventBus.emit('toast:show', {
        titleAr: 'تم إغلاق الفصل 3B — تفقّد الأدلة الخمسة وتحدّث مع زملائك',
        titleEn: 'Classroom 3B locked — Inspect all 5 clues and question your classmates',
        tone: 'warning',
      });
    }
    this.cameras.main.fadeIn(400, 4, 7, 13);
  }

  private syncObjectiveText(): void {
    const solved = storyManager.getFlag('puzzle_01_solved') === true;
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

    if (solved) {
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

  private showDesk7Closeup(): void {
    if (!this.textures.exists('bg_desk7_closeup')) return;
    this.pausedModal = true;
    const overlay = this.add.container(640, 360).setDepth(980);
    const dimmer = this.add.rectangle(0, 0, 1280, 720, 0x04070d, 0.88).setInteractive();
    const img = this.add.image(0, -14, 'bg_desk7_closeup').setDisplaySize(920, 518);
    const frame = this.add.rectangle(0, -14, 924, 522).setStrokeStyle(2, 0xd6a65d, 0.85);
    const caption = this.add
      .text(0, 274, 'المقعد السابع الفارغ — دفتر إيلينا القديم والصورة المقصوصة  [انقر أو اضغط E للإغلاق]', {
        fontFamily: 'Cairo, sans-serif',
        fontSize: '18px',
        color: '#E9E4D8',
      })
      .setOrigin(0.5);

    overlay.add([dimmer, img, frame, caption]);
    let closed = false;
    const closeOverlay = () => {
      if (closed) return;
      closed = true;
      audioManager.playClick();
      this.input.keyboard?.off('keydown-E', closeOverlay);
      this.input.keyboard?.off('keydown-ESC', closeOverlay);
      overlay.destroy();
      this.pausedModal = false;
    };
    dimmer.once('pointerdown', closeOverlay);
    this.input.keyboard?.on('keydown-E', closeOverlay);
    this.input.keyboard?.on('keydown-ESC', closeOverlay);
  }

  private handleObjectInteract(obj: SceneObjectConfig): void {
    if (this.pausedModal || dialogueSystem.isActive()) return;
    audioManager.playClick();

    if (obj.evidenceId) {
      const newlyCollected = evidenceSystem.collect(obj.evidenceId);
      if (obj.id === 'class_photo') {
        this.showDesk7Closeup();
      } else if (!newlyCollected && !(obj.id === 'board' && puzzleManager.isUnlocked() && storyManager.getFlag('puzzle_01_solved') !== true)) {
        EventBus.emit('toast:show', {
          titleAr: `تم فحص: ${obj.label}`,
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
    audioManager.playClick();
    const convId = `conv_${ch.id}`;
    dialogueSystem.startConversation(convId, () => {
      this.syncObjectiveText();
      this.autoSave();
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
