import {
  CharacterId,
  EndingFlagType,
  FlagCondition,
  FoundObjectRecord,
  StoryFlagValue,
  StoryState,
  StudentId,
  TaskChoiceEffects,
  TaskDecisionRecord,
  TaskPhase,
} from '../types/game';
import { EventBus } from './EventBus';

export const STUDENT_IDS: readonly StudentId[] = [
  'samer',
  'layan',
  'yacine',
  'nour',
  'karim',
  'mariam',
];

const DEFAULT_FLAGS: Record<string, StoryFlagValue> = {
  ch1_exterior_pan_done: false,
  ch1_entrance_seen: false,
  ch1_opening_dialogue_done: false,
  ch1_intro_completed: false,
  ch1_blackout_triggered: false,
  ch1_adam_broadcast_seen: false,
  ch1_opening_reactions_done: false,
  ch1_controls_hint_seen: false,
  ch1_return_from_door: false,
  ch1_first_exploration_toast: false,
  ev_board_examined: false,
  ev_desk_examined: false,
  ev_clock_examined: false,
  ev_photo_examined: false,
  ev_register_examined: false,
  puzzle_01_unlocked: false,
  puzzle_01_attempts: 0,
  puzzle_01_solved: false,
  puzzle_01_solved_at: '',
  puzzle_01_failed_timeout: false,
  talked_layan: false,
  talked_yacine: false,
  talked_nour: false,
  talked_mariam: false,
  talked_karim: false,
  asked_nour_photo: false,
  clue_second_figure: false,
  clue_yacine_avoids_elena: false,
  clue_elena_personality: false,
  clue_adam_elena_bond: false,
  clue_project_echo: false,
  ch1_finale_started: false,
  ch1_bell_rung: false,
  ch1_completed: false,
  endingFlag: '',
  demo_board_checked: false,
  demo_board_defied: false,
};

function createDefaultStudentMap(initialValue: number): Record<StudentId, number> {
  return {
    samer: initialValue,
    layan: initialValue,
    yacine: initialValue,
    nour: initialValue,
    karim: initialValue,
    mariam: initialValue,
  };
}

function clampStat(val: number): number {
  return Math.max(0, Math.min(10, Math.round(val)));
}

function isStudentId(id: string): id is StudentId {
  return (STUDENT_IDS as readonly string[]).includes(id);
}

function createInitialState(): StoryState {
  const initialTrust = createDefaultStudentMap(5);
  return {
    fear: createDefaultStudentMap(2),
    trust: initialTrust,
    adamAnger: 1,
    secretsExposed: [],
    understanding: 0,
    cluesFound: [],
    foundObjects: [],
    decisions: [],
    currentTaskId: null,
    taskPhase: 'adam_intro',
    activeOutcomeChoiceId: null,
    registerAttempts: 0,
    photoAttempts: 0,
    endingFlag: null,
    endingId: null,
    flags: { ...DEFAULT_FLAGS },
    relationships: { ...initialTrust },
  };
}

export class StoryManager {
  private state: StoryState = createInitialState();

  reset(): void {
    this.state = createInitialState();
    this.emitUpdate();
  }

  setFlag(key: string, value: StoryFlagValue): void {
    const prev = this.state.flags[key];
    this.state.flags[key] = value;

    if (
      this.state.flags.ev_board_examined === true &&
      this.state.flags.ev_desk_examined === true &&
      this.state.flags.ev_photo_examined === true &&
      this.state.flags.puzzle_01_unlocked !== true
    ) {
      this.state.flags.puzzle_01_unlocked = true;
      EventBus.emit('toast:show', {
        titleAr: 'تم فتح اللغز الأول',
        titleEn: '',
        tone: 'info',
      });
    }

    if (prev !== value) {
      this.emitUpdate();
    }
  }

  setFlags(updates: Record<string, StoryFlagValue>): void {
    Object.entries(updates).forEach(([k, v]) => this.setFlag(k, v));
  }

  getFlag<T extends StoryFlagValue = StoryFlagValue>(key: string): T | undefined {
    return this.state.flags[key] as T | undefined;
  }

  adjustFear(studentId: StudentId, delta: number): number {
    const next = clampStat((this.state.fear[studentId] ?? 0) + delta);
    this.state.fear[studentId] = next;
    this.emitUpdate();
    return next;
  }

  getFear(studentId: StudentId): number {
    return this.state.fear[studentId] ?? 0;
  }

  adjustTrust(studentId: StudentId, delta: number): number {
    const next = clampStat((this.state.trust[studentId] ?? 5) + delta);
    this.state.trust[studentId] = next;
    this.state.relationships[studentId] = next;
    this.emitUpdate();
    return next;
  }

  getTrust(studentId: StudentId): number {
    return this.state.trust[studentId] ?? 5;
  }

  /**
   * Uses the unified student trust scale (0-10) so existing relationship deltas
   * directly update StoryManager's active state instead of sitting unused.
   */
  adjustRelationship(characterId: CharacterId, delta: number): void {
    if (isStudentId(characterId)) {
      this.adjustTrust(characterId, delta);
      return;
    }
    const current = this.state.relationships[characterId] ?? 0;
    this.state.relationships[characterId] = clampStat(current + delta);
    this.emitUpdate();
  }

  getRelationship(characterId: CharacterId): number {
    if (isStudentId(characterId)) {
      return this.getTrust(characterId);
    }
    return this.state.relationships[characterId] ?? 0;
  }

  adjustAdamAnger(delta: number): number {
    this.state.adamAnger = clampStat(this.state.adamAnger + delta);
    this.emitUpdate();
    return this.state.adamAnger;
  }

  getAdamAnger(): number {
    return this.state.adamAnger;
  }

  exposeSecret(studentId: StudentId): boolean {
    if (this.state.secretsExposed.includes(studentId)) {
      return false;
    }
    this.state.secretsExposed.push(studentId);
    this.emitUpdate();
    return true;
  }

  hasSecretExposed(studentId: StudentId): boolean {
    return this.state.secretsExposed.includes(studentId);
  }

  addUnderstanding(delta: number): number {
    this.state.understanding = Math.max(0, this.state.understanding + delta);
    this.emitUpdate();
    return this.state.understanding;
  }

  getUnderstanding(): number {
    return this.state.understanding;
  }

  addClueFound(clueFragmentId: string): boolean {
    if (!clueFragmentId || this.state.cluesFound.includes(clueFragmentId)) {
      return false;
    }
    this.state.cluesFound.push(clueFragmentId);
    this.emitUpdate();
    return true;
  }

  recordFoundObject(record: FoundObjectRecord): boolean {
    if (this.state.foundObjects.some((item) => item.objectId === record.objectId)) {
      return false;
    }
    this.state.foundObjects.push(record);
    this.emitUpdate();
    return true;
  }

  recordDecision(decision: TaskDecisionRecord): void {
    this.state.decisions.push(decision);
    this.emitUpdate();
  }

  applyTaskEffects(effects: TaskChoiceEffects): void {
    if (effects.fear) {
      for (const [id, delta] of Object.entries(effects.fear)) {
        if (isStudentId(id) && typeof delta === 'number' && delta !== 0) {
          this.state.fear[id] = clampStat((this.state.fear[id] ?? 0) + delta);
        }
      }
    }
    if (effects.trust) {
      for (const [id, delta] of Object.entries(effects.trust)) {
        if (isStudentId(id) && typeof delta === 'number' && delta !== 0) {
          const next = clampStat((this.state.trust[id] ?? 5) + delta);
          this.state.trust[id] = next;
          this.state.relationships[id] = next;
        }
      }
    }
    if (typeof effects.adamAnger === 'number' && effects.adamAnger !== 0) {
      this.state.adamAnger = clampStat(this.state.adamAnger + effects.adamAnger);
    }
    if (typeof effects.understanding === 'number' && effects.understanding !== 0) {
      this.state.understanding = Math.max(0, this.state.understanding + effects.understanding);
    }
    if (effects.exposeSecretOf && !this.state.secretsExposed.includes(effects.exposeSecretOf)) {
      this.state.secretsExposed.push(effects.exposeSecretOf);
    }
    if (effects.flags) {
      for (const [key, val] of Object.entries(effects.flags)) {
        this.state.flags[key] = val;
      }
    }
    this.emitUpdate();
  }

  setTaskProgress(
    currentTaskId: string | null,
    taskPhase: TaskPhase,
    activeOutcomeChoiceId: string | null = null
  ): void {
    this.state.currentTaskId = currentTaskId;
    this.state.taskPhase = taskPhase;
    this.state.activeOutcomeChoiceId = activeOutcomeChoiceId;
    this.emitUpdate();
  }

  getTaskProgress(): {
    currentTaskId: string | null;
    taskPhase: TaskPhase;
    activeOutcomeChoiceId: string | null;
  } {
    return {
      currentTaskId: this.state.currentTaskId,
      taskPhase: this.state.taskPhase,
      activeOutcomeChoiceId: this.state.activeOutcomeChoiceId,
    };
  }

  incrementRegisterAttempts(): number {
    this.state.registerAttempts = Math.max(0, this.state.registerAttempts) + 1;
    this.emitUpdate();
    return this.state.registerAttempts;
  }

  getRegisterAttempts(): number {
    return this.state.registerAttempts ?? 0;
  }

  incrementPhotoAttempts(): number {
    this.state.photoAttempts = Math.max(0, this.state.photoAttempts) + 1;
    this.emitUpdate();
    return this.state.photoAttempts;
  }

  getPhotoAttempts(): number {
    return this.state.photoAttempts ?? 0;
  }

  setEndingFlag(flag: EndingFlagType | null): void {
    this.state.endingFlag = flag;
    this.state.flags.endingFlag = flag ?? '';
    this.emitUpdate();
  }

  getEndingFlag(): EndingFlagType | null {
    return this.state.endingFlag ?? null;
  }

  setEndingId(endingId: string | null): void {
    this.state.endingId = endingId;
    this.emitUpdate();
  }

  getEndingId(): string | null {
    return this.state.endingId ?? null;
  }

  evaluateCondition(cond?: FlagCondition): boolean {
    if (!cond) return true;

    if (cond.allOf) {
      return cond.allOf.every((c) => this.evaluateCondition(c));
    }
    if (cond.anyOf) {
      return cond.anyOf.some((c) => this.evaluateCondition(c));
    }
    if (cond.not) {
      return !this.evaluateCondition(cond.not);
    }
    if (cond.flag) {
      const val = this.state.flags[cond.flag];
      if (cond.equals !== undefined) {
        return val === cond.equals;
      }
      if (cond.notEquals !== undefined) {
        return val !== cond.notEquals;
      }
      return Boolean(val);
    }
    return true;
  }

  getState(): StoryState {
    return {
      fear: { ...this.state.fear },
      trust: { ...this.state.trust },
      adamAnger: this.state.adamAnger,
      secretsExposed: [...this.state.secretsExposed],
      understanding: this.state.understanding,
      cluesFound: [...this.state.cluesFound],
      foundObjects: this.state.foundObjects.map((o) => ({ ...o })),
      decisions: this.state.decisions.map((d) => ({
        ...d,
        effects: {
          ...d.effects,
          fear: { ...d.effects.fear },
          trust: { ...d.effects.trust },
          flags: { ...d.effects.flags },
        },
      })),
      currentTaskId: this.state.currentTaskId,
      taskPhase: this.state.taskPhase,
      activeOutcomeChoiceId: this.state.activeOutcomeChoiceId,
      registerAttempts: this.state.registerAttempts ?? 0,
      photoAttempts: this.state.photoAttempts ?? 0,
      endingFlag: this.state.endingFlag ?? null,
      endingId: this.state.endingId ?? null,
      flags: { ...this.state.flags },
      relationships: { ...this.state.trust },
    };
  }

  getSnapshot(): StoryState {
    return this.getState();
  }

  loadState(incoming: Partial<StoryState>): void {
    const base = createInitialState();
    const trustMerged = { ...base.trust };
    if (incoming.trust) {
      for (const id of STUDENT_IDS) {
        if (typeof incoming.trust[id] === 'number') {
          trustMerged[id] = clampStat(incoming.trust[id]);
        }
      }
    }
    const fearMerged = { ...base.fear };
    if (incoming.fear) {
      for (const id of STUDENT_IDS) {
        if (typeof incoming.fear[id] === 'number') {
          fearMerged[id] = clampStat(incoming.fear[id]);
        }
      }
    }

    const validEndingFlags = new Set<EndingFlagType>(['confession', 'force', 'apology']);
    const incomingEndingFlag =
      typeof incoming.endingFlag === 'string' && validEndingFlags.has(incoming.endingFlag as EndingFlagType)
        ? (incoming.endingFlag as EndingFlagType)
        : null;

    const incomingFlags = { ...DEFAULT_FLAGS, ...(incoming.flags ?? {}) };
    delete incomingFlags.ch1_karim_summoned;

    this.state = {
      fear: fearMerged,
      trust: trustMerged,
      adamAnger:
        typeof incoming.adamAnger === 'number' ? clampStat(incoming.adamAnger) : base.adamAnger,
      secretsExposed: Array.isArray(incoming.secretsExposed)
        ? incoming.secretsExposed.filter((id): id is StudentId => isStudentId(id))
        : [],
      understanding:
        typeof incoming.understanding === 'number'
          ? Math.max(0, incoming.understanding)
          : base.understanding,
      cluesFound: Array.isArray(incoming.cluesFound)
        ? incoming.cluesFound.filter((id): id is string => typeof id === 'string')
        : [],
      foundObjects: Array.isArray(incoming.foundObjects)
        ? incoming.foundObjects.map((o) => ({ ...o }))
        : [],
      decisions: Array.isArray(incoming.decisions)
        ? incoming.decisions.map((d) => ({ ...d }))
        : [],
      currentTaskId: incoming.currentTaskId ?? null,
      taskPhase: incoming.taskPhase ?? 'adam_intro',
      activeOutcomeChoiceId: incoming.activeOutcomeChoiceId ?? null,
      registerAttempts:
        typeof incoming.registerAttempts === 'number'
          ? Math.max(0, Math.floor(incoming.registerAttempts))
          : 0,
      photoAttempts:
        typeof incoming.photoAttempts === 'number'
          ? Math.max(0, Math.floor(incoming.photoAttempts))
          : 0,
      endingFlag: incomingEndingFlag,
      endingId: typeof incoming.endingId === 'string' ? incoming.endingId : null,
      flags: incomingFlags,
      relationships: { ...trustMerged },
    };

    this.emitUpdate();
  }

  loadSnapshot(snapshot: Partial<StoryState>): void {
    this.loadState(snapshot);
  }

  private emitUpdate(): void {
    EventBus.emit('story:updated', this.getState());
  }
}

export const storyManager = new StoryManager();
