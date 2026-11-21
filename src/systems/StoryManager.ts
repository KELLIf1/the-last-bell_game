import { CharacterId, FlagCondition, StoryFlagValue } from '../types/game';
import { EventBus } from './EventBus';

const DEFAULT_FLAGS: Record<string, StoryFlagValue> = {
  ch1_exterior_pan_done: false,
  ch1_entrance_seen: false,
  ch1_opening_dialogue_done: false,
  ch1_intro_completed: false,
  ch1_blackout_triggered: false,
  ch1_adam_broadcast_seen: false,
  ch1_controls_hint_seen: false,
  ch1_return_from_door: false,
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
  ch1_karim_summoned: false,
  ch1_inspect_final_projector: false,
  ch1_room0_teaser_seen: false,
  ch1_bell_rung: false,
  ch1_completed: false,
};

const DEFAULT_RELATIONSHIPS: Record<string, number> = {
  layan: 0,
  yacine: 0,
  nour: 0,
  karim: 0,
  mariam: 0,
};

export class StoryManager {
  private flags: Record<string, StoryFlagValue> = { ...DEFAULT_FLAGS };
  private relationships: Record<string, number> = { ...DEFAULT_RELATIONSHIPS };

  reset(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.relationships = { ...DEFAULT_RELATIONSHIPS };
    EventBus.emit('story:updated', this.getSnapshot());
  }

  setFlag(key: string, value: StoryFlagValue): void {
    const prev = this.flags[key];
    this.flags[key] = value;

    // Auto-derive puzzle_01_unlocked when the three required clues are examined
    if (
      this.flags.ev_board_examined === true &&
      this.flags.ev_desk_examined === true &&
      this.flags.ev_photo_examined === true &&
      this.flags.puzzle_01_unlocked !== true
    ) {
      this.flags.puzzle_01_unlocked = true;
      EventBus.emit('toast:show', {
        titleAr: 'تم فتح اللغز الأول',
        titleEn: 'Puzzle 01 Unlocked: The Seating Order',
        tone: 'info',
      });
    }

    if (prev !== value) {
      EventBus.emit('story:updated', this.getSnapshot());
    }
  }

  setFlags(updates: Record<string, StoryFlagValue>): void {
    Object.entries(updates).forEach(([k, v]) => this.setFlag(k, v));
  }

  getFlag<T extends StoryFlagValue = StoryFlagValue>(key: string): T | undefined {
    return this.flags[key] as T | undefined;
  }

  adjustRelationship(characterId: CharacterId, delta: number): void {
    const current = this.relationships[characterId] ?? 0;
    this.relationships[characterId] = current + delta;
    EventBus.emit('story:updated', this.getSnapshot());
  }

  getRelationship(characterId: CharacterId): number {
    return this.relationships[characterId] ?? 0;
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
      const val = this.flags[cond.flag];
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

  getSnapshot(): {
    flags: Record<string, StoryFlagValue>;
    relationships: Record<string, number>;
  } {
    return {
      flags: { ...this.flags },
      relationships: { ...this.relationships },
    };
  }

  loadSnapshot(snapshot: {
    flags: Record<string, StoryFlagValue>;
    relationships: Record<string, number>;
  }): void {
    this.flags = { ...DEFAULT_FLAGS, ...snapshot.flags };
    this.relationships = { ...DEFAULT_RELATIONSHIPS, ...snapshot.relationships };
    EventBus.emit('story:updated', this.getSnapshot());
  }
}

export const storyManager = new StoryManager();
