import {
  CameraAngleId,
  DialogueChoice,
  DialogueLine,
  EndingDefinition,
  StudentId,
  TaskChoice,
  TaskDefinition,
  TaskExecutionType,
  TaskPenalty,
  TaskPhase,
} from '../types/game';
import { audioManager } from './AudioManager';
import { dialogueSystem } from './DialogueSystem';
import { EventBus } from './EventBus';
import { saveManager } from './SaveManager';
import { storyManager } from './StoryManager';
import { taskDataLoader } from './TaskDataLoader';
import { timerManager } from './TimerManager';

export interface ActiveTaskExecution {
  taskId: string;
  executionType: TaskExecutionType;
  config?: TaskDefinition['executionConfig'];
  choices?: TaskChoice[];
}

function resolveSceneObjectId(taskObjectId: string): string {
  if (taskObjectId === 'classroom_door') return 'door';
  return taskObjectId;
}

export class TaskEngine {
  private active = false;
  private doorDelayRemainingSec = 0;
  private lightsOutRemainingSec = 0;
  private cameraCutRemainingSec = 0;
  private activeCameraCutId: CameraAngleId | null = null;
  private tickAccumMs = 0;

  reset(): void {
    this.active = false;
    this.doorDelayRemainingSec = 0;
    this.lightsOutRemainingSec = 0;
    this.cameraCutRemainingSec = 0;
    this.activeCameraCutId = null;
    this.tickAccumMs = 0;
    EventBus.emit('task:waiting_object', null);
    EventBus.emit('task:execution_cleared', {});
    EventBus.emit('penalty:cleared_all', {});
  }

  startOrResume(forceStart = false): void {
    if (!taskDataLoader.isLoaded()) {
      console.warn('[TaskEngine] Task data not loaded yet.');
      return;
    }

    this.active = true;
    const progress = storyManager.getTaskProgress();

    if (forceStart || !progress.currentTaskId) {
      const firstTask = taskDataLoader.getFirstTask();
      if (!firstTask) {
        storyManager.setTaskProgress(null, 'completed', null);
        this.emitTaskState(null, 'completed');
        return;
      }
      if (!progress.currentTaskId) {
        storyManager.setTaskProgress(firstTask.id, 'adam_intro', null);
      }
    }

    this.resumeCurrentPhase();
  }

  loadPenaltyTimers(doorDelayRemainingSec = 0): void {
    this.doorDelayRemainingSec = Math.max(0, Math.floor(doorDelayRemainingSec));
    if (this.doorDelayRemainingSec > 0) {
      EventBus.emit('penalty:door_delay', { seconds: this.doorDelayRemainingSec });
    }
  }

  getDoorDelayRemainingSec(): number {
    return this.doorDelayRemainingSec;
  }

  isDoorBlocked(): boolean {
    return this.doorDelayRemainingSec > 0;
  }

  isCameraCutActive(): boolean {
    return this.cameraCutRemainingSec > 0;
  }

  getActiveCameraCutId(): CameraAngleId | null {
    return this.cameraCutRemainingSec > 0 ? this.activeCameraCutId : null;
  }

  getActiveExecution(): ActiveTaskExecution | null {
    const progress = storyManager.getTaskProgress();
    if (!progress.currentTaskId) return null;
    const task = taskDataLoader.getTaskById(progress.currentTaskId);
    if (!task || !task.execution) return null;

    if (task.execution === 'door_choice' && (progress.taskPhase === 'choice' || progress.taskPhase === 'execution')) {
      return {
        taskId: task.id,
        executionType: 'door_choice',
        config: task.executionConfig,
        choices: task.choices,
      };
    }

    if (progress.taskPhase !== 'execution') {
      return null;
    }

    return {
      taskId: task.id,
      executionType: task.execution,
      config: task.executionConfig,
    };
  }

  requestReopenExecution(): boolean {
    const activeExec = this.getActiveExecution();
    if (!activeExec) return false;
    const task = taskDataLoader.getTaskById(activeExec.taskId);
    if (!task) return false;
    EventBus.emit('task:execution_requested', {
      taskId: task.id,
      executionType: activeExec.executionType,
      config: task.executionConfig,
      choices: activeExec.choices,
    });
    return true;
  }

  completeExecution(taskId?: string): void {
    const progress = storyManager.getTaskProgress();
    if (progress.taskPhase !== 'execution' || !progress.currentTaskId) return;
    if (taskId && progress.currentTaskId !== taskId) return;

    const task = taskDataLoader.getTaskById(progress.currentTaskId);
    if (!task) return;

    EventBus.emit('task:execution_cleared', {});
    EventBus.emit('task:execution_completed', { taskId: task.id });

    const picked =
      task.choices.find((c) => c.id === progress.activeOutcomeChoiceId) ??
      this.findRecordedChoice(task);

    if (!picked) {
      this.unlockTaskClueAndAdvance(task);
      return;
    }

    if (picked.outcome.executeAfterOutcome) {
      // Outcome + penalty already executed (e.g. t1c2 refusal), now unlock clue & continue
      this.unlockTaskClueAndAdvance(task);
    } else {
      // Standard flow: choice -> execution -> outcome -> clue -> after_clue -> next
      this.enterOutcome(task, picked);
    }
  }

  update(deltaMs: number): void {
    if (
      !this.active &&
      this.doorDelayRemainingSec <= 0 &&
      this.lightsOutRemainingSec <= 0 &&
      this.cameraCutRemainingSec <= 0
    ) {
      return;
    }

    this.tickAccumMs += Math.min(deltaMs, 100);
    if (this.tickAccumMs < 1000) return;
    const elapsedSec = Math.floor(this.tickAccumMs / 1000);
    this.tickAccumMs -= elapsedSec * 1000;

    if (this.doorDelayRemainingSec > 0) {
      this.doorDelayRemainingSec = Math.max(0, this.doorDelayRemainingSec - elapsedSec);
      EventBus.emit('penalty:door_delay_tick', { remainingSec: this.doorDelayRemainingSec });
      if (this.doorDelayRemainingSec === 0) {
        EventBus.emit('penalty:door_delay_cleared', {});
      }
    }

    if (this.lightsOutRemainingSec > 0) {
      this.lightsOutRemainingSec = Math.max(0, this.lightsOutRemainingSec - elapsedSec);
      EventBus.emit('penalty:lights_out_tick', { remainingSec: this.lightsOutRemainingSec });
      if (this.lightsOutRemainingSec === 0) {
        EventBus.emit('penalty:lights_out_cleared', {});
      }
    }

    if (this.cameraCutRemainingSec > 0) {
      this.cameraCutRemainingSec = Math.max(0, this.cameraCutRemainingSec - elapsedSec);
      EventBus.emit('penalty:camera_cut_tick', {
        cameraId: this.activeCameraCutId,
        remainingSec: this.cameraCutRemainingSec,
      });
      if (this.cameraCutRemainingSec === 0) {
        this.activeCameraCutId = null;
        EventBus.emit('penalty:camera_cut_cleared', {});
      }
    }
  }

  handleObjectClick(objectId: string): boolean {
    const progress = storyManager.getTaskProgress();
    if (!progress.currentTaskId) return false;

    const task = taskDataLoader.getTaskById(progress.currentTaskId);
    if (!task || resolveSceneObjectId(task.objectId) !== objectId) {
      return false;
    }

    if (
      (progress.taskPhase === 'execution' && task.execution) ||
      (progress.taskPhase === 'choice' && task.execution === 'door_choice')
    ) {
      audioManager.playClick();
      return this.requestReopenExecution();
    }

    if (progress.taskPhase !== 'waiting_for_click') {
      return false;
    }

    audioManager.playClick();
    EventBus.emit('task:waiting_object', null);
    if (task.onClickFx) {
      EventBus.emit('task:on_click_fx', { taskId: task.id, fx: task.onClickFx });
    }
    this.transitionToPhase(task, 'adam_on_click');
    return true;
  }

  getWaitingObjectId(): string | null {
    const progress = storyManager.getTaskProgress();
    if (progress.taskPhase !== 'waiting_for_click' || !progress.currentTaskId) {
      return null;
    }
    const objId = taskDataLoader.getTaskById(progress.currentTaskId)?.objectId;
    return objId ? resolveSceneObjectId(objId) : null;
  }

  private resumeCurrentPhase(): void {
    const progress = storyManager.getTaskProgress();
    const task = taskDataLoader.getTaskById(progress.currentTaskId);

    if (!task || progress.taskPhase === 'completed') {
      storyManager.setTaskProgress(progress.currentTaskId, 'completed', null);
      this.emitTaskState(task, 'completed');
      EventBus.emit('task:waiting_object', null);
      EventBus.emit('task:execution_cleared', {});
      return;
    }

    this.runPhase(task, progress.taskPhase, progress.activeOutcomeChoiceId);
  }

  private transitionToPhase(
    task: TaskDefinition,
    nextPhase: TaskPhase,
    activeOutcomeChoiceId: string | null = null
  ): void {
    const prevPhase = storyManager.getTaskProgress().taskPhase;
    storyManager.setTaskProgress(task.id, nextPhase, activeOutcomeChoiceId);
    EventBus.emit('task:phase_changed', {
      taskId: task.id,
      previousPhase: prevPhase,
      phase: nextPhase,
    });
    this.runPhase(task, nextPhase, activeOutcomeChoiceId);
  }

  private runPhase(
    task: TaskDefinition,
    phase: TaskPhase,
    activeOutcomeChoiceId: string | null = null
  ): void {
    this.emitTaskState(task, phase);

    switch (phase) {
      case 'adam_intro': {
        EventBus.emit('task:waiting_object', null);
        EventBus.emit('task:execution_cleared', {});
        EventBus.emit('camera:focus_shot', { cameraShot: task.cameraId });
        const lines = this.buildAdamLines(task, 'intro', task.adamIntroLines);
        dialogueSystem.playScriptedSequence(`${task.id}_adam_intro`, lines, () => {
          this.transitionToPhase(task, 'waiting_for_click');
        });
        break;
      }

      case 'waiting_for_click': {
        EventBus.emit('task:waiting_object', {
          taskId: task.id,
          objectId: resolveSceneObjectId(task.objectId),
        });
        if (task.titleAr) {
          EventBus.emit('objective:updated', {
            textAr: task.titleAr,
            textEn: '',
          });
        }
        break;
      }

      case 'adam_on_click': {
        EventBus.emit('task:waiting_object', null);
        EventBus.emit('camera:focus_shot', { cameraShot: task.cameraId });
        const lines = this.buildAdamLines(task, 'click', task.adamOnClickLines);
        dialogueSystem.playScriptedSequence(`${task.id}_adam_click`, lines, () => {
          this.transitionToPhase(task, 'students_debate');
        });
        break;
      }

      case 'students_debate': {
        const lines = this.buildStudentLines(task, 'debate', task.studentDialogue);
        dialogueSystem.playScriptedSequence(`${task.id}_debate`, lines, () => {
          this.transitionToPhase(task, 'choice');
        });
        break;
      }

      case 'choice': {
        if (task.execution === 'door_choice') {
          EventBus.emit('task:execution_requested', {
            taskId: task.id,
            executionType: 'door_choice',
            config: task.executionConfig,
            choices: task.choices,
          });
          return;
        }

        const promptLine: DialogueLine = {
          id: `${task.id}_choice_prompt`,
          speaker: 'system',
          speakerNameAr: 'توجيه المجموعة',
          speakerNameEn: '',
          speaking: false,
          cameraShot: task.cameraId,
          textAr: task.titleAr ?? '',
          textEn: '',
        };

        // Always keep choices in exact data order (never shuffle choices)
        const choices: DialogueChoice[] = task.choices.map((ch) => ({
          id: ch.id,
          textAr: ch.textAr,
          textEn: '',
          proposedBy: ch.proposedBy,
          proposedByNameAr: dialogueSystem.getSpeakerNameAr(ch.proposedBy),
        }));

        dialogueSystem.presentChoicePrompt(`${task.id}_choice`, promptLine, choices, (choiceId) => {
          const picked = task.choices.find((c) => c.id === choiceId);
          if (!picked) return;
          this.handleChoiceSelected(task, picked);
        });
        break;
      }

      case 'execution': {
        const execType = task.execution;
        if (!execType) {
          this.completeExecution(task.id);
          return;
        }
        if (execType === 'door_choice') {
          EventBus.emit('task:execution_requested', {
            taskId: task.id,
            executionType: 'door_choice',
            config: task.executionConfig,
            choices: task.choices,
          });
          return;
        }
        if (execType === 'seating_puzzle' && storyManager.getFlag('ev_board_examined') !== true) {
          storyManager.setFlag('ev_board_examined', true);
        }
        if (execType === 'photo_inspection' && storyManager.getFlag('ev_photo_examined') !== true) {
          storyManager.setFlag('ev_photo_examined', true);
        }
        EventBus.emit('task:execution_requested', {
          taskId: task.id,
          executionType: execType,
          config: task.executionConfig,
        });
        break;
      }

      case 'outcome': {
        const chosen =
          task.choices.find((c) => c.id === activeOutcomeChoiceId) ??
          this.findRecordedChoice(task);
        if (!chosen) {
          this.unlockTaskClueAndAdvance(task);
          return;
        }
        this.playOutcomeLinesAndAdvance(task, chosen);
        break;
      }

      case 'after_clue': {
        const beats = task.afterClueDialogue ?? [];
        if (beats.length === 0) {
          this.transitionToPhase(task, 'next');
          return;
        }
        const lines = this.buildStudentLines(task, 'after_clue', beats);
        dialogueSystem.playScriptedSequence(`${task.id}_after_clue`, lines, () => {
          this.autosaveCurrentState();
          this.transitionToPhase(task, 'next');
        });
        break;
      }

      case 'next': {
        EventBus.emit('task:completed', { taskId: task.id });
        if (task.nextTaskId) {
          const nextTask = taskDataLoader.getTaskById(task.nextTaskId);
          if (nextTask) {
            storyManager.setTaskProgress(nextTask.id, 'adam_intro', null);
            this.autosaveCurrentState();
            this.runPhase(nextTask, 'adam_intro', null);
            return;
          }
        }

        const resolvedEnding = this.resolveAndStoreEnding();
        storyManager.setTaskProgress(task.id, 'completed', null);
        this.emitTaskState(task, 'completed');
        this.autosaveCurrentState();
        EventBus.emit('task:all_completed', {
          lastTaskId: task.id,
          endingId: resolvedEnding?.id ?? null,
        });
        break;
      }

      case 'completed': {
        EventBus.emit('task:waiting_object', null);
        EventBus.emit('task:execution_cleared', {});
        break;
      }
    }
  }

  selectDoorChoice(choiceId: string): void {
    const progress = storyManager.getTaskProgress();
    if (!progress.currentTaskId) return;
    const task = taskDataLoader.getTaskById(progress.currentTaskId);
    if (!task || task.execution !== 'door_choice') return;
    const picked = task.choices.find((c) => c.id === choiceId);
    if (!picked) return;

    audioManager.playClick();
    EventBus.emit('task:execution_cleared', {});
    EventBus.emit('task:execution_completed', { taskId: task.id });
    this.handleChoiceSelected(task, picked);
  }

  resolveAndStoreEnding(): EndingDefinition | null {
    const resolved = taskDataLoader.resolveEnding(storyManager.getState(), (cond) =>
      storyManager.evaluateCondition(cond)
    );
    if (resolved) {
      storyManager.setEndingId(resolved.id);
    }
    return resolved;
  }

  private handleChoiceSelected(task: TaskDefinition, picked: TaskChoice): void {
    // 1. Apply state deltas & timer delta once on choice selection
    storyManager.applyTaskEffects(picked.effects);
    if (picked.endingFlag) {
      storyManager.setEndingFlag(picked.endingFlag);
    }

    if (picked.effects.timerDeltaSec < 0) {
      timerManager.penalize(Math.abs(picked.effects.timerDeltaSec));
    } else if (picked.effects.timerDeltaSec > 0) {
      timerManager.addSeconds(picked.effects.timerDeltaSec);
    }

    // 2. Record decision in StoryManager ("قراراتي" & Responsibility screen)
    const timestamp = timerManager.getState().started ? timerManager.getFormatted() : '16:20';
    const firstOutcomeBeat = picked.outcome.studentLines[0];
    const outcomeLineAr = firstOutcomeBeat
      ? `${dialogueSystem.getSpeakerNameAr(firstOutcomeBeat.speaker)}: ${firstOutcomeBeat.textAr}`
      : picked.outcome.adamLines[0]?.textAr;

    storyManager.recordDecision({
      taskId: task.id,
      taskTitleAr: task.titleAr,
      choiceId: picked.id,
      proposedBy: picked.proposedBy,
      proposedByNameAr: dialogueSystem.getSpeakerNameAr(picked.proposedBy),
      choiceTextAr: picked.textAr,
      outcomeLineAr,
      result: picked.outcome.result,
      effects: picked.effects,
      timestamp,
    });

    // 3. Route to optional execution before outcome unless door_choice (already executed) or executeAfterOutcome
    if (task.execution && task.execution !== 'door_choice' && !picked.outcome.executeAfterOutcome) {
      this.autosaveCurrentState();
      this.transitionToPhase(task, 'execution', picked.id);
      return;
    }

    this.enterOutcome(task, picked);
  }

  private enterOutcome(task: TaskDefinition, picked: TaskChoice): void {
    if (picked.outcome.penalty) {
      this.applyPenalty(picked.outcome.penalty);
    }

    EventBus.emit('task:outcome_applied', {
      taskId: task.id,
      choiceId: picked.id,
      result: picked.outcome.result,
      penalty: picked.outcome.penalty,
    });

    this.transitionToPhase(task, 'outcome', picked.id);
  }

  private playOutcomeLinesAndAdvance(task: TaskDefinition, picked: TaskChoice): void {
    const studentBeats = this.buildStudentLines(
      task,
      `out_s_${picked.id}`,
      picked.outcome.studentLines
    );
    const adamBeatsRaw = [...picked.outcome.adamLines];
    if (
      picked.outcome.penalty?.type === 'expose_secret' &&
      picked.outcome.penalty.params.adamLineAr
    ) {
      adamBeatsRaw.push({
        textAr: picked.outcome.penalty.params.adamLineAr,
        expression: 'neutral',
        cameraShot: task.cameraId,
      });
    }
    const adamBeats = this.buildAdamLines(task, `out_a_${picked.id}`, adamBeatsRaw);
    const combined = [...studentBeats, ...adamBeats];

    dialogueSystem.playScriptedSequence(`${task.id}_outcome_${picked.id}`, combined, () => {
      this.autosaveCurrentState();
      if (picked.outcome.executeAfterOutcome && task.execution) {
        this.transitionToPhase(task, 'execution', picked.id);
        return;
      }
      this.unlockTaskClueAndAdvance(task);
    });
  }

  private unlockTaskClueAndAdvance(task: TaskDefinition): void {
    if (task.clueFragmentId) {
      const added = storyManager.addClueFound(task.clueFragmentId);
      if (added) {
        const frag = taskDataLoader.getClueFragmentById(task.clueFragmentId);
        if (frag) {
          audioManager.playEvidence();
          EventBus.emit('toast:show', {
            titleAr: `ملاحظة مسجّلة: ${frag.titleAr ?? frag.textAr}`,
            titleEn: '',
            tone: 'evidence',
          });
        }
      }
    }

    if (task.afterClueDialogue && task.afterClueDialogue.length > 0) {
      this.transitionToPhase(task, 'after_clue', null);
    } else {
      this.transitionToPhase(task, 'next', null);
    }
  }

  applyPenalty(penalty: TaskPenalty): void {
    switch (penalty.type) {
      case 'lights_out': {
        const seconds = Math.max(1, Math.floor(penalty.params.seconds));
        this.lightsOutRemainingSec = seconds;
        audioManager.playDoorLock(false);
        EventBus.emit('penalty:lights_out', { seconds });
        break;
      }
      case 'time_loss': {
        const seconds = Math.max(1, Math.floor(penalty.params.seconds));
        const deducted = timerManager.penalize(seconds);
        audioManager.playClockTick();
        EventBus.emit('penalty:time_loss', { seconds: deducted || seconds });
        break;
      }
      case 'expose_secret': {
        const studentId: StudentId = penalty.params.studentId;
        storyManager.exposeSecret(studentId);
        const studentNameAr = dialogueSystem.getSpeakerNameAr(studentId);
        audioManager.playClockTick();
        EventBus.emit('penalty:expose_secret', {
          studentId,
          studentNameAr,
          adamLineAr: penalty.params.adamLineAr,
        });
        if (penalty.params.adamLineAr && !dialogueSystem.isActive()) {
          dialogueSystem.playScriptedSequence(`penalty_secret_${studentId}`, [
            {
              id: `secret_line_${studentId}`,
              speaker: 'adam',
              speakerNameAr: dialogueSystem.getSpeakerNameAr('adam'),
              speakerNameEn: '',
              expression: 'neutral',
              speaking: true,
              cameraShot: 'wide_master',
              textAr: penalty.params.adamLineAr,
              textEn: '',
            },
          ]);
        }
        break;
      }
      case 'door_delay': {
        const seconds = Math.max(1, Math.floor(penalty.params.seconds));
        this.doorDelayRemainingSec = seconds;
        audioManager.playDoorLock(false);
        EventBus.emit('penalty:door_delay', { seconds });
        break;
      }
      case 'camera_cut': {
        const seconds = Math.max(1, Math.floor(penalty.params.seconds));
        this.cameraCutRemainingSec = seconds;
        this.activeCameraCutId = penalty.params.cameraId;
        audioManager.playClockTick();
        EventBus.emit('penalty:camera_cut', {
          cameraId: penalty.params.cameraId,
          seconds,
        });
        break;
      }
    }
  }

  private findRecordedChoice(task: TaskDefinition): TaskChoice | undefined {
    const decisions = storyManager.getState().decisions;
    for (let i = decisions.length - 1; i >= 0; i--) {
      if (decisions[i].taskId === task.id) {
        const match = task.choices.find((c) => c.id === decisions[i].choiceId);
        if (match) return match;
      }
    }
    return undefined;
  }

  private buildAdamLines(
    task: TaskDefinition,
    prefix: string,
    beats: Array<{
      textAr: string;
      expression?: DialogueLine['expression'];
      cameraShot?: CameraAngleId;
    }>
  ): DialogueLine[] {
    const adamNameAr = dialogueSystem.getSpeakerNameAr('adam');
    return beats.map((b, idx) => ({
      id: `${task.id}_${prefix}_${idx + 1}`,
      speaker: 'adam',
      speakerNameAr: adamNameAr,
      speakerNameEn: '',
      expression: b.expression ?? 'neutral',
      speaking: true,
      cameraShot: b.cameraShot ?? task.cameraId,
      textAr: b.textAr,
      textEn: '',
    }));
  }

  private buildStudentLines(
    task: TaskDefinition,
    prefix: string,
    beats: Array<{
      speaker: StudentId;
      textAr: string;
      expression?: DialogueLine['expression'];
      cameraShot?: CameraAngleId;
    }>
  ): DialogueLine[] {
    return beats.map((b, idx) => ({
      id: `${task.id}_${prefix}_${idx + 1}`,
      speaker: b.speaker,
      speakerNameAr: dialogueSystem.getSpeakerNameAr(b.speaker),
      speakerNameEn: '',
      expression: b.expression ?? 'neutral',
      speaking: true,
      cameraShot: b.cameraShot ?? (`closeup_${b.speaker}` as CameraAngleId),
      textAr: b.textAr,
      textEn: '',
    }));
  }

  private emitTaskState(task: TaskDefinition | null, phase: TaskPhase): void {
    const resolvedObjId = task?.objectId ? resolveSceneObjectId(task.objectId) : null;
    EventBus.emit('task:state', {
      taskId: task?.id ?? null,
      titleAr: task?.titleAr ?? '',
      phase,
      targetObjectId: resolvedObjId,
      waitingObjectId: phase === 'waiting_for_click' ? resolvedObjId : null,
      cameraId: task?.cameraId ?? 'wide_master',
      executionType: task?.execution ?? null,
    });
  }

  private autosaveCurrentState(): void {
    saveManager.save('classroom_emergency', { x: 0, y: 0 }, this.doorDelayRemainingSec);
  }
}

export const taskEngine = new TaskEngine();
