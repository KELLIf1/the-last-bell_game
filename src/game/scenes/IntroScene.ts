import Phaser from 'phaser';
import { audioManager } from '../../systems/AudioManager';
import { CameraDirector } from '../../systems/CameraDirector';
import { dialogueSystem } from '../../systems/DialogueSystem';
import { EventBus } from '../../systems/EventBus';
import { InteractionSystem } from '../../systems/InteractionSystem';
import { SceneAssembler } from '../../systems/SceneAssembler';
import { storyManager } from '../../systems/StoryManager';
import { timerManager } from '../../systems/TimerManager';
import { uiSettings } from '../../systems/UiSettings';
import { DialogueLine, SceneLayoutConfig } from '../../types/game';

interface RainStreak {
  line: Phaser.GameObjects.Line;
  speed: number;
}

interface DustMote {
  dot: Phaser.GameObjects.Arc;
  baseX: number;
  phase: number;
  speedY: number;
}

export class IntroScene extends Phaser.Scene {
  private interactionSystem = new InteractionSystem();
  private rainStreaks: RainStreak[] = [];
  private dustMotes: DustMote[] = [];
  private dialogueUnsub: (() => void) | null = null;
  private skipUnsub: (() => void) | null = null;
  private cameraDirectorDetach: (() => void) | null = null;
  private isShuttingDown = false;
  private skippedToBroadcast = false;

  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    this.isShuttingDown = false;
    this.skippedToBroadcast = false;
    this.interactionSystem.clear();
    this.clearFx();

    const configs = this.registry.get('sceneConfigs') as Record<string, SceneLayoutConfig>;

    this.skipUnsub?.();
    this.skipUnsub = EventBus.on('intro:skip_requested', () => {
      this.skipToAdamBroadcast(configs);
    });

    this.events.once('shutdown', () => {
      this.isShuttingDown = true;
      this.dialogueUnsub?.();
      this.dialogueUnsub = null;
      this.skipUnsub?.();
      this.skipUnsub = null;
      this.cameraDirectorDetach?.();
      this.cameraDirectorDetach = null;
      this.clearFx();
      this.interactionSystem.clear();
    });

    this.playExteriorShot(configs);
  }

  private skipToAdamBroadcast(configs: Record<string, SceneLayoutConfig>): void {
    if (this.isShuttingDown || this.skippedToBroadcast) return;
    this.skippedToBroadcast = true;

    this.tweens.killAll();
    this.cameras.main.off(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE);
    this.cameras.main.resetFX();
    this.cameraDirectorDetach?.();
    this.cameraDirectorDetach = null;

    dialogueSystem.reset();

    storyManager.setFlags({
      ch1_exterior_pan_done: true,
      ch1_entrance_seen: true,
      ch1_opening_dialogue_done: true,
      ch1_blackout_triggered: true,
    });

    audioManager.setRainActive(true);
    audioManager.setAmbienceActive(true);
    EventBus.emit('screen:mode', 'PLAYING');
    EventBus.emit('objective:updated', {
      textAr: 'الاستماع إلى رسالة البث',
      textEn: '',
    });

    this.playAdamBroadcast(configs);
  }

  private clearFx(): void {
    this.rainStreaks.forEach((r) => r.line.destroy());
    this.rainStreaks = [];
    this.dustMotes.forEach((m) => m.dot.destroy());
    this.dustMotes = [];
  }

  private spawnRain(count = 48): void {
    this.rainStreaks.forEach((r) => r.line.destroy());
    this.rainStreaks = [];
    for (let i = 0; i < count; i++) {
      const rx = Phaser.Math.Between(0, 1280);
      const ry = Phaser.Math.Between(0, 720);
      const len = Phaser.Math.Between(18, 30);
      const line = this.add
        .line(0, 0, rx, ry, rx - 7, ry + len, 0x94a3b8, 0.24)
        .setOrigin(0)
        .setDepth(900);
      this.rainStreaks.push({
        line,
        speed: Phaser.Math.FloatBetween(0.45, 0.72),
      });
    }
  }

  private playExteriorShot(configs: Record<string, SceneLayoutConfig>): void {
    if (this.isShuttingDown) return;
    const exteriorLayout = configs?.academy_exterior;

    EventBus.emit('screen:mode', 'CHAPTER_TITLE');
    EventBus.emit('scene:changed', 'academy_exterior');
    audioManager.setRainActive(true);
    audioManager.setAmbienceActive(false);
    audioManager.setTensionMusic(false);

    if (exteriorLayout) {
      SceneAssembler.build(this, exteriorLayout, this.interactionSystem, {
        onObjectInteract: () => {},
        onCharacterInteract: () => {},
      });
    }
    this.spawnRain(54);

    this.cameras.main.setZoom(1.0);
    this.cameras.main.centerOn(640, 360);
    this.cameras.main.fadeIn(700, 4, 7, 13);

    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.13,
      scrollX: -20,
      scrollY: -12,
      duration: 3300,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.isShuttingDown) return;
        storyManager.setFlag('ch1_exterior_pan_done', true);
        this.cameras.main.fadeOut(450, 4, 7, 13);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.playEntranceShot(configs);
        });
      },
    });
  }

  private playEntranceShot(configs: Record<string, SceneLayoutConfig>): void {
    if (this.isShuttingDown) return;
    this.clearFx();
    this.children.removeAll(true);
    this.interactionSystem.clear();

    const entranceLayout = configs?.academy_entrance;
    if (entranceLayout) {
      SceneAssembler.build(this, entranceLayout, this.interactionSystem, {
        onObjectInteract: () => {},
        onCharacterInteract: () => {},
      });
    }
    this.spawnRain(40);

    EventBus.emit('scene:changed', 'academy_entrance');
    this.cameras.main.setZoom(1.0);
    this.cameras.main.centerOn(640, 360);
    this.cameras.main.fadeIn(450, 4, 7, 13);

    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.09,
      duration: 2100,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (this.isShuttingDown) return;
        storyManager.setFlag('ch1_entrance_seen', true);
        this.cameras.main.fadeOut(450, 4, 7, 13);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.playClassroomDayOpening(configs);
        });
      },
    });
  }

  private playClassroomDayOpening(configs: Record<string, SceneLayoutConfig>): void {
    if (this.isShuttingDown) return;
    this.cameraDirectorDetach?.();
    this.cameraDirectorDetach = null;
    this.clearFx();
    this.children.removeAll(true);
    this.interactionSystem.clear();

    const dayLayout = configs?.classroom_day;
    const assembled = dayLayout
      ? SceneAssembler.build(this, dayLayout, this.interactionSystem, {
          onObjectInteract: () => {},
          onCharacterInteract: () => {},
        })
      : null;

    if (!dayLayout) {
      this.cameras.main.setZoom(1.0);
      this.cameras.main.centerOn(640, 360);
    } else {
      this.cameraDirectorDetach = CameraDirector.attach(this, {
        layout: dayLayout,
        getPlayer: () => assembled?.playerSprite,
        getCharacterContainers: () => assembled?.characterContainers,
      });
    }

    this.cameras.main.fadeIn(500, 4, 7, 13);
    EventBus.emit('screen:mode', 'PLAYING');
    EventBus.emit('scene:changed', 'classroom_day');
    EventBus.emit('objective:updated', {
      textAr: 'الاستماع إلى المجموعة (الساعة 16:20)',
      textEn: '',
    });

    dialogueSystem.startConversation('ch1_opening_classroom', () => {
      this.triggerBlackoutBeat(configs);
    });
  }

  private triggerBlackoutBeat(configs: Record<string, SceneLayoutConfig>): void {
    if (this.isShuttingDown) return;
    this.cameraDirectorDetach?.();
    this.cameraDirectorDetach = null;
    this.clearFx();
    this.children.removeAll(true);
    this.interactionSystem.clear();

    const darkLayout = configs?.classroom_dark;
    const assembled = darkLayout
      ? SceneAssembler.build(this, darkLayout, this.interactionSystem, {
          onObjectInteract: () => {},
          onCharacterInteract: () => {},
        })
      : null;

    if (!darkLayout) {
      this.cameras.main.setZoom(1.0);
      this.cameras.main.centerOn(640, 360);
    } else {
      this.cameraDirectorDetach = CameraDirector.attach(this, {
        layout: darkLayout,
        getPlayer: () => assembled?.playerSprite,
        getCharacterContainers: () => assembled?.characterContainers,
      });
    }

    // Subtle dust motes drifting inside projector cone onto centered blackboard
    for (let i = 0; i < 24; i++) {
      const mx = Phaser.Math.Between(520, 785);
      const my = Phaser.Math.Between(95, 360);
      const dot = this.add
        .circle(mx, my, Phaser.Math.FloatBetween(1.0, 2.2), 0xe2e8f0, Phaser.Math.FloatBetween(0.18, 0.48))
        .setDepth(900);
      this.dustMotes.push({
        dot,
        baseX: mx,
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        speedY: Phaser.Math.FloatBetween(0.008, 0.02),
      });
    }

    this.cameras.main.flash(220, 4, 7, 14);
    EventBus.emit('scene:changed', 'classroom_dark');
    audioManager.playDoorLock(false);
    audioManager.setAmbienceActive(true);

    dialogueSystem.startConversation('ch1_blackout_reaction', () => {
      if (this.isShuttingDown) return;
      this.cameraDirectorDetach?.();
      this.cameraDirectorDetach = null;
      storyManager.setFlag('ch1_blackout_triggered', true);
      this.tweens.add({
        targets: this.cameras.main,
        zoom: 1.22,
        scrollY: this.cameras.main.scrollY - 28,
        duration: 650,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.playAdamBroadcast(configs);
        },
      });
    });
  }

  private playAdamBroadcast(configs: Record<string, SceneLayoutConfig>): void {
    if (this.isShuttingDown) return;
    this.skippedToBroadcast = true;
    uiSettings.markIntroSeen();
    this.clearFx();
    this.children.removeAll(true);
    this.interactionSystem.clear();

    this.cameras.main.setZoom(1.0);
    this.cameras.main.centerOn(640, 360);
    EventBus.emit('screen:mode', 'PLAYING');

    const projLayout = configs?.projector_closeup;
    if (projLayout) {
      SceneAssembler.build(this, projLayout, this.interactionSystem, {
        onObjectInteract: () => {},
        onCharacterInteract: () => {},
      });
    }

    // Diegetic broadcast projection overlay aligned directly onto the glowing digital blackboard frame
    // Blackboard center on bg_classroom_projector_v3: (~663, 333), interior bounds ~650x336
    const screenCx = 663;
    const screenCy = 333;

    const feedPanel = this.add.container(screenCx, screenCy).setDepth(30);

    const feedBorder = this.add
      .rectangle(0, 0, 620, 304, 0x0b1526, 0.24)
      .setStrokeStyle(1.5, 0x334155, 0.45);

    const headerBg = this.add.rectangle(0, -130, 600, 26, 0x0f172a, 0.72);

    const recDot = this.add.circle(268, -130, 5, 0xc64b50, 0.95);
    this.tweens.add({
      targets: recDot,
      alpha: 0.25,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Portrait frame on left side of projected feed
    const frameBg = this.add
      .rectangle(-160, 14, 210, 224, 0x080e1a, 0.85)
      .setStrokeStyle(2, 0x526477, 0.8);

    const feedPortraitKey = this.textures.exists('portrait_adam_neutral')
      ? 'portrait_adam_neutral'
      : undefined;
    const portraitSprite = feedPortraitKey
      ? this.add.image(-160, 14, feedPortraitKey).setDisplaySize(196, 196)
      : null;

    const countdownDisplay = this.add
      .text(115, 2, '59:59', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '58px',
        color: '#991B1B',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.18);

    feedPanel.add(
      [feedBorder, headerBg, recDot, frameBg, portraitSprite, countdownDisplay].filter(
        Boolean
      ) as Phaser.GameObjects.GameObject[]
    );

    // Switch projected portrait & ignite 59:59 dynamically during Adam's broadcast speech
    this.dialogueUnsub?.();
    this.dialogueUnsub = EventBus.on<{ active: boolean; line: DialogueLine | null }>(
      'dialogue:state',
      (state) => {
        if (!state.active || !state.line) return;
        const id = state.line.id;
        if (id === 'adam_1' || id === 'adam_2' || id === 'adam_3' || id === 'adam_5') {
          if (portraitSprite && this.textures.exists('portrait_adam_neutral')) {
            portraitSprite.setTexture('portrait_adam_neutral').setDisplaySize(196, 196);
          }
        } else if (id === 'adam_4') {
          if (portraitSprite && this.textures.exists('portrait_adam_neutral')) {
            portraitSprite.setTexture('portrait_adam_neutral').setDisplaySize(196, 196);
          }
          countdownDisplay.setAlpha(1);
          timerManager.start();
          audioManager.playClockTick();
          audioManager.setTensionMusic(true);
        }
      }
    );

    EventBus.emit('scene:changed', 'projector_closeup');
    this.cameras.main.fadeIn(350, 4, 7, 13);

    dialogueSystem.startConversation('ch1_adam_broadcast', () => {
      this.dialogueUnsub?.();
      this.dialogueUnsub = null;
      if (!timerManager.getState().started) {
        timerManager.start();
      }
      audioManager.setTensionMusic(true);
      audioManager.playDoorLock(false);

      this.cameras.main.fadeOut(400, 4, 7, 13);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('ClassroomScene', { sceneId: 'classroom_emergency' });
      });
    });
  }

  update(time: number, delta: number): void {
    if (timerManager.getState().started) {
      timerManager.update(delta);
    }

    if (this.rainStreaks.length > 0) {
      const step = Math.min(delta, 50);
      for (const r of this.rainStreaks) {
        const dy = step * r.speed;
        r.line.y += dy;
        r.line.x -= dy * 0.25;
        if (r.line.y > 740) {
          r.line.y = -40;
          r.line.x = Phaser.Math.Between(0, 1360);
        }
      }
    }

    if (this.dustMotes.length > 0) {
      for (const m of this.dustMotes) {
        m.dot.y -= delta * m.speedY;
        m.dot.x = m.baseX + Math.sin(time * 0.0014 + m.phase) * 10;
        if (m.dot.y < 90) m.dot.y = 360;
      }
    }
  }
}
