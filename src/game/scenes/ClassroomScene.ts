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
import { taskDataLoader } from '../../systems/TaskDataLoader';
import { taskEngine } from '../../systems/TaskEngine';
import { timerManager } from '../../systems/TimerManager';
import { uiSettings } from '../../systems/UiSettings';
import {
  DialogueLine,
  SceneId,
  SceneLayoutConfig,
  SceneObjectConfig,
} from '../../types/game';

interface ClassroomSceneData {
  sceneId?: SceneId;
}

export class ClassroomScene extends Phaser.Scene {
  private currentSceneId: SceneId = 'classroom_emergency';
  private assembled: AssembledScene | null = null;
  private interactionSystem = new InteractionSystem();
  private keyE?: Phaser.Input.Keyboard.Key;
  private pausedModal = false;
  private timeoutTriggered = false;
  private endingTransitioned = false;

  // Visual penalty layers
  private lightsOutOverlay: Phaser.GameObjects.Rectangle | null = null;
  private lightsOutTween: Phaser.Tweens.Tween | null = null;
  private cameraCutOverlay: Phaser.GameObjects.Rectangle | null = null;
  private cameraCutTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super({ key: 'ClassroomScene' });
  }

  init(data?: ClassroomSceneData): void {
    this.currentSceneId = data?.sceneId ?? 'classroom_emergency';
    this.pausedModal = false;
    this.timeoutTriggered = false;
    this.endingTransitioned = false;
    this.lightsOutOverlay = null;
    this.lightsOutTween = null;
    this.cameraCutOverlay = null;
    this.cameraCutTween = null;
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
      onCharacterInteract: () => {},
    });

    CameraDirector.attach(this, {
      layout,
      getCharacterContainers: () => this.assembled?.characterContainers,
    });

    if (this.input.keyboard) {
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    const onBlur = () => {
      this.input.keyboard?.resetKeys();
    };
    window.addEventListener('blur', onBlur);

    const unsubPause = EventBus.on<boolean>('game:modal_open', (isOpen) => {
      this.pausedModal = isOpen;
      this.interactionSystem.setBlocked(isOpen || dialogueSystem.isActive());
      if (isOpen) {
        timerManager.pause();
      } else if (
        !dialogueSystem.isActive() &&
        !this.timeoutTriggered &&
        !this.endingTransitioned
      ) {
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

    // TaskEngine waiting target highlight & completion sync
    const unsubWaitingObject = EventBus.on<{ taskId: string; objectId: string } | null>(
      'task:waiting_object',
      (payload) => {
        this.interactionSystem.setGoalHighlight(payload?.objectId ?? null);
      }
    );
    const unsubTaskAllCompleted = EventBus.on('task:all_completed', () => {
      this.syncObjectiveText();
      this.autoSave();
      this.transitionToEnding();
    });
    const unsubOnClickFx = EventBus.on<{ taskId: string; fx: string }>(
      'task:on_click_fx',
      (payload) => {
        if (payload.fx === 'school_bell_flicker') {
          audioManager.playSchoolBell();
          this.triggerSubtleLightFlicker();
        } else if (payload.fx === 'faint_bell_double_flicker') {
          audioManager.playFaintSchoolBell();
          this.triggerDoubleLightFlicker();
        }
      }
    );

    // Penalty visuals
    const unsubLightsOut = EventBus.on<{ seconds: number }>('penalty:lights_out', () => {
      this.activateLightsOutVisual();
    });
    const unsubLightsOutCleared = EventBus.on('penalty:lights_out_cleared', () => {
      this.clearLightsOutVisual();
    });
    const unsubCameraCut = EventBus.on<{ cameraId: string; seconds: number }>(
      'penalty:camera_cut',
      () => {
        this.activateCameraCutVisual();
      }
    );
    const unsubCameraCutCleared = EventBus.on('penalty:camera_cut_cleared', () => {
      this.clearCameraCutVisual();
    });
    const unsubDoorDelay = EventBus.on<{ seconds: number }>('penalty:door_delay', (p) => {
      this.interactionSystem.setDisabledReason('door', `مقفل ${p.seconds} ث`);
    });
    const unsubDoorDelayTick = EventBus.on<{ remainingSec: number }>(
      'penalty:door_delay_tick',
      (p) => {
        if (p.remainingSec > 0) {
          this.interactionSystem.setDisabledReason('door', `مقفل ${p.remainingSec} ث`);
        }
      }
    );
    const unsubDoorDelayCleared = EventBus.on('penalty:door_delay_cleared', () => {
      this.interactionSystem.setDisabledReason('door', undefined);
    });
    const unsubTimeLoss = EventBus.on('penalty:time_loss', () => {
      this.cameras.main.shake(220, 0.004);
      this.triggerCrimsonPulse();
    });
    const unsubExposeSecret = EventBus.on('penalty:expose_secret', () => {
      this.triggerCrimsonPulse();
    });
    const unsubClearedAll = EventBus.on('penalty:cleared_all', () => {
      this.clearLightsOutVisual();
      this.clearCameraCutVisual();
      this.interactionSystem.setDisabledReason('door', undefined);
    });

    const unsubDialogueBeat = EventBus.on<{ active: boolean; line: DialogueLine | null }>(
      'dialogue:state',
      (state) => {
        this.interactionSystem.setBlocked(state.active || this.pausedModal);
        if (
          !state.active &&
          !this.pausedModal &&
          !this.timeoutTriggered &&
          !this.endingTransitioned
        ) {
          timerManager.resume();
        }
      }
    );

    const unsubOutcomeApplied = EventBus.on<{ choiceId: string }>(
      'task:outcome_applied',
      (payload) => {
        if (payload.choiceId === 't5c2') {
          this.handleYacineLeaves();
        }
      }
    );

    const onSceneResume = () => {
      this.interactionSystem.clearHover();
      if (this.registry.get('pendingTimeoutEnding')) {
        this.registry.remove('pendingTimeoutEnding');
        this.handleTimeoutConsequence();
        return;
      }
      this.syncObjectiveText();
      this.autoSave();
      if (
        storyManager.getTaskProgress().taskPhase === 'completed' &&
        storyManager.getEndingId()
      ) {
        this.transitionToEnding();
        return;
      }
      if (
        !this.pausedModal &&
        !dialogueSystem.isActive() &&
        !this.timeoutTriggered &&
        !this.endingTransitioned
      ) {
        timerManager.resume();
      }
    };
    this.events.on('resume', onSceneResume);

    this.events.once('shutdown', () => {
      window.removeEventListener('blur', onBlur);
      this.interactionSystem.clear();
      unsubPause();
      unsubControlsDismiss();
      unsubPuzzleSolved();
      unsubTimerExpired();
      unsubWaitingObject();
      unsubTaskAllCompleted();
      unsubOnClickFx();
      unsubLightsOut();
      unsubLightsOutCleared();
      unsubCameraCut();
      unsubCameraCutCleared();
      unsubDoorDelay();
      unsubDoorDelayTick();
      unsubDoorDelayCleared();
      unsubTimeLoss();
      unsubExposeSecret();
      unsubClearedAll();
      unsubDialogueBeat();
      unsubOutcomeApplied();
      this.clearLightsOutVisual();
      this.clearCameraCutVisual();
      EventBus.emit('controls_hint:show', false);
      EventBus.emit('closeup:desk7', false);
      this.events.off('resume', onSceneResume);
    });

    EventBus.emit('screen:mode', 'PLAYING');
    EventBus.emit('scene:changed', this.currentSceneId);
    audioManager.setRainActive(true);
    audioManager.setAmbienceActive(true);
    audioManager.setTensionMusic(true);

    uiSettings.markIntroSeen();

    this.syncObjectiveText();
    if (storyManager.getFlag('ch1_first_exploration_toast') !== true) {
      storyManager.setFlag('ch1_first_exploration_toast', true);
      EventBus.emit('toast:show', {
        titleAr: 'تم إغلاق الفصل 3ب — استمع للحوارات وانقر على عناصر الفصل',
        titleEn: '',
        tone: 'warning',
        durationMs: 6500,
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
      return;
    }

    if (taskEngine.isDoorBlocked()) {
      this.interactionSystem.setDisabledReason(
        'door',
        `مقفل ${taskEngine.getDoorDelayRemainingSec()} ث`
      );
    }

    const taskProgress = storyManager.getTaskProgress();
    if (taskProgress.taskPhase === 'completed' && storyManager.getEndingId()) {
      this.transitionToEnding();
      return;
    }

    if (
      storyManager.getFlag('ch1_opening_reactions_done') !== true &&
      !taskProgress.currentTaskId
    ) {
      EventBus.emit('camera:focus_shot', { cameraShot: 'board' });
      dialogueSystem.startConversation('ch1_opening_reactions', () => {
        this.autoSave();
        taskEngine.startOrResume();
      });
    } else {
      // Start or resume TaskEngine loop from current state/phase
      taskEngine.startOrResume();
    }

    const timerSnap = timerManager.getState();
    if (timerSnap.started && timerSnap.remainingSeconds <= 0) {
      this.handleTimeoutConsequence();
      return;
    }

    if (
      !this.pausedModal &&
      !dialogueSystem.isActive() &&
      !this.timeoutTriggered &&
      !this.endingTransitioned
    ) {
      timerManager.resume();
    }
  }

  private activateLightsOutVisual(): void {
    this.clearLightsOutVisual();
    const overlay = this.add
      .rectangle(640, 360, 1280, 720, 0x2b0509, 0.72)
      .setDepth(975)
      .setScrollFactor(0);
    this.lightsOutOverlay = overlay;
    this.lightsOutTween = this.tweens.add({
      targets: overlay,
      alpha: { from: 0.56, to: 0.84 },
      duration: 240,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private clearLightsOutVisual(): void {
    if (this.lightsOutTween) {
      this.lightsOutTween.stop();
      this.lightsOutTween = null;
    }
    if (this.lightsOutOverlay) {
      this.lightsOutOverlay.destroy();
      this.lightsOutOverlay = null;
    }
  }

  private activateCameraCutVisual(): void {
    this.clearCameraCutVisual();
    const overlay = this.add
      .rectangle(640, 360, 1280, 720, 0x020617, 0.34)
      .setDepth(974)
      .setScrollFactor(0);
    this.cameraCutOverlay = overlay;
    this.cameraCutTween = this.tweens.add({
      targets: overlay,
      alpha: { from: 0.22, to: 0.48 },
      duration: 130,
      yoyo: true,
      repeat: -1,
      ease: 'Stepped',
    });
  }

  private clearCameraCutVisual(): void {
    if (this.cameraCutTween) {
      this.cameraCutTween.stop();
      this.cameraCutTween = null;
    }
    if (this.cameraCutOverlay) {
      this.cameraCutOverlay.destroy();
      this.cameraCutOverlay = null;
    }
  }

  private triggerCrimsonPulse(): void {
    const pulse = this.add
      .rectangle(640, 360, 1280, 720, 0x7f1d1d, 0)
      .setDepth(972)
      .setScrollFactor(0);
    this.tweens.add({
      targets: pulse,
      alpha: 0.36,
      duration: 160,
      yoyo: true,
      repeat: 1,
      onComplete: () => pulse.destroy(),
    });
  }

  private dismissControlsHint(): void {
    if (storyManager.getFlag('ch1_controls_hint_seen') !== true) {
      storyManager.setFlag('ch1_controls_hint_seen', true);
    }
    uiSettings.markControlsHintSeen();
    EventBus.emit('controls_hint:show', false);
  }

  private syncObjectiveText(): void {
    const taskProg = storyManager.getTaskProgress();
    if (taskProg.taskPhase === 'completed') {
      EventBus.emit('objective:updated', {
        textAr: 'النهاية تقترب — انتظر المشهد الأخير',
        textEn: '',
      });
      return;
    }

    if (taskProg.currentTaskId) {
      const task = taskDataLoader.getTaskById(taskProg.currentTaskId);
      if (task?.titleAr) {
        EventBus.emit('objective:updated', {
          textAr: task.titleAr,
          textEn: '',
        });
        return;
      }
    }

    EventBus.emit('objective:updated', {
      textAr: 'تفقّد عناصر الفصل واستمع إلى الطلاب',
      textEn: '',
    });
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

  private triggerDoubleLightFlicker(): void {
    this.triggerSubtleLightFlicker();
    this.time.delayedCall(280, () => {
      if (this.scene.isActive('ClassroomScene')) {
        this.triggerSubtleLightFlicker();
      }
    });
  }

  private handleTimeoutConsequence(): void {
    if (this.timeoutTriggered || this.endingTransitioned) return;
    if (!this.scene.isActive('ClassroomScene')) return;

    this.timeoutTriggered = true;
    this.pausedModal = false;
    timerManager.pause();

    // Clear active execution & force-close any open DOM modals so Adam's timeout line is visible
    EventBus.emit('task:execution_cleared', {});
    EventBus.emit('task:waiting_object', null);
    EventBus.emit('game:force_close_modals', {});

    storyManager.setFlags({
      puzzle_01_failed_timeout: true,
    });

    this.triggerDoubleLightFlicker();
    audioManager.playDoorLock(false);
    EventBus.emit('camera:focus_shot', { cameraShot: 'door' });

    const timeoutLine: DialogueLine = {
      id: 'timeout_adam_1',
      speaker: 'adam',
      speakerNameAr: dialogueSystem.getSpeakerNameAr('adam'),
      speakerNameEn: '',
      expression: 'neutral',
      speaking: true,
      cameraShot: 'door',
      textAr: 'انتهى الوقت. لكن الباب لم يكن يومًا مرتبطًا بالوقت.',
      textEn: '',
    };

    dialogueSystem.playScriptedSequence('timeout_adam_sequence', [timeoutLine], () => {
      // Understanding remains capped at its exact current value
      taskEngine.resolveAndStoreEnding();
      this.autoSave();
      this.transitionToEnding();
    });
  }

  private transitionToEnding(): void {
    if (this.endingTransitioned) return;
    this.endingTransitioned = true;
    timerManager.pause();
    if (!storyManager.getEndingId()) {
      taskEngine.resolveAndStoreEnding();
    }
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

    const isTaskDoorTarget =
      taskEngine.getWaitingObjectId() === 'door' ||
      taskEngine.getActiveExecution()?.taskId === 'task_05';

    // Enforce door_delay penalty on ambient exploration, never blocking task_05 progression
    if (obj.id === 'door' && taskEngine.isDoorBlocked() && !isTaskDoorTarget) {
      audioManager.playDoorLock(false);
      EventBus.emit('toast:show', {
        titleAr: `الباب معطّل بسبب القفل المؤقت (${taskEngine.getDoorDelayRemainingSec()} ثانية متبقية)`,
        titleEn: '',
        tone: 'warning',
      });
      return;
    }

    // Record raw object inspection in listener's log ("ما وجدته")
    const timestamp = timerManager.getState().started ? timerManager.getFormatted() : '16:20';
    const evCatalogItem = obj.evidenceId
      ? evidenceSystem.getCatalogItem(obj.evidenceId)
      : undefined;
    storyManager.recordFoundObject({
      objectId: obj.id,
      evidenceId: obj.evidenceId,
      titleAr: evCatalogItem?.nameAr ?? getObjectLabelAr(obj.id, obj.label),
      rawTextAr: evCatalogItem?.descriptionAr ?? getObjectLabelAr(obj.id, obj.label),
      timestamp,
    });

    // Let TaskEngine handle target object click if waiting_for_click or reopening execution
    if (taskEngine.handleObjectClick(obj.id)) {
      if (obj.evidenceId) {
        evidenceSystem.collect(obj.evidenceId);
      }
      return;
    }

    audioManager.playClick();

    if (obj.evidenceId) {
      const newlyCollected = evidenceSystem.collect(obj.evidenceId);
      if (obj.id === 'class_photo') {
        this.showDesk7Closeup();
      } else if (
        !newlyCollected &&
        !(
          obj.id === 'board' &&
          puzzleManager.isUnlocked() &&
          storyManager.getFlag('puzzle_01_solved') !== true
        )
      ) {
        const labelAr = getObjectLabelAr(obj.id, obj.label);
        EventBus.emit('toast:show', {
          titleAr: `تم فحص: ${labelAr}`,
          titleEn: '',
          tone: 'info',
        });
      }
      this.syncObjectiveText();
      this.autoSave();
      return;
    }

    if (obj.id === 'projector') {
      EventBus.emit('toast:show', {
        titleAr: 'جهاز العرض صامت الآن والعدسة باردة.',
        titleEn: '',
        tone: 'info',
      });
      return;
    }

    if (obj.id === 'door') {
      audioManager.playDoorLock(false);
      EventBus.emit('toast:show', {
        titleAr: 'الباب الإلكتروني مقفل بإحكام — ضوء التحذير الأحمر مضاء',
        titleEn: '',
        tone: 'warning',
      });
    }
  }

  private handleYacineLeaves(): void {
    const yacineContainer = this.assembled?.characterContainers.get('yacine');
    if (!yacineContainer) return;
    this.tweens.add({
      targets: yacineContainer,
      x: yacineContainer.x + 140,
      alpha: 0,
      duration: 650,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        yacineContainer.setVisible(false);
      },
    });
  }

  private autoSave(): void {
    saveManager.save(
      this.currentSceneId,
      { x: 0, y: 0 },
      taskEngine.getDoorDelayRemainingSec()
    );
  }

  update(_time: number, delta: number): void {
    if (this.pausedModal) return;

    timerManager.update(delta);
    taskEngine.update(delta);

    if (dialogueSystem.isActive()) return;

    if (this.keyE && Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.interactionSystem.triggerActive();
    }
  }
}
