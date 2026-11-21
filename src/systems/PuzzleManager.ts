import { PuzzleSeatingConfig } from '../types/game';
import { audioManager } from './AudioManager';
import { EventBus } from './EventBus';
import { storyManager } from './StoryManager';
import { timerManager } from './TimerManager';

export interface PuzzleValidationResult {
  solved: boolean;
  attempts: number;
  penaltyApplied?: number;
  blockedReason?: 'locked';
  hintAr?: string;
  hintEn?: string;
  revealAr?: string;
  revealEn?: string;
}

export class PuzzleManager {
  private config: PuzzleSeatingConfig | null = null;
  private attempts = 0;

  loadConfig(config: PuzzleSeatingConfig): void {
    this.config = config;
  }

  getConfig(): PuzzleSeatingConfig | null {
    return this.config;
  }

  isUnlocked(): boolean {
    if (!this.config) return false;
    return storyManager.evaluateCondition(this.config.unlockCondition);
  }

  getRevealedBoardSequence(): Array<number | null> {
    if (!this.config) return Array(7).fill(null);
    const revealSlots = this.config.boardSequenceReveal;
    if (!revealSlots || revealSlots.length === 0) {
      return Array(this.config.boardSequence.length).fill(null);
    }
    return [...revealSlots]
      .sort((a, b) => a.position - b.position)
      .map((slot) => {
        if (slot.seatNumber === null) return null;
        const hasAllFlags = slot.requiredFlags.every(
          (flag) => storyManager.getFlag(flag) === true
        );
        return hasAllFlags ? slot.seatNumber : null;
      });
  }

  reset(): void {
    this.attempts = 0;
    storyManager.setFlag('puzzle_01_attempts', 0);
  }

  getAttempts(): number {
    return this.attempts;
  }

  loadAttempts(attempts: number): void {
    this.attempts = attempts;
    storyManager.setFlag('puzzle_01_attempts', attempts);
  }

  submitSolution(placedSlotIds: Array<string | null>): PuzzleValidationResult {
    if (!this.config) {
      return { solved: false, attempts: this.attempts };
    }

    if (!this.isUnlocked()) {
      return { solved: false, attempts: this.attempts, blockedReason: 'locked' };
    }

    const expected = this.config.photoSlotsOrder;
    const isExactMatch =
      placedSlotIds.length === expected.length &&
      expected.every((expectedId, idx) => placedSlotIds[idx] === expectedId);

    if (isExactMatch) {
      const timestamp = timerManager.getState().started ? timerManager.getFormatted() : '59:59';
      storyManager.setFlag('puzzle_01_solved', true);
      storyManager.setFlag('puzzle_01_solved_at', timestamp);
      audioManager.playEvidence();

      EventBus.emit('puzzle:solved', {
        puzzleId: this.config.puzzleId,
        solvedAt: timestamp,
        revealAr: this.config.successRevealAr,
        revealEn: this.config.successRevealEn,
      });

      return {
        solved: true,
        attempts: this.attempts,
        revealAr: this.config.successRevealAr,
        revealEn: this.config.successRevealEn,
      };
    }

    this.attempts += 1;
    storyManager.setFlag('puzzle_01_attempts', this.attempts);
    audioManager.playDoorLock(false);

    const configuredPenalty = Math.max(0, this.config.penaltySeconds ?? 120);
    const penaltyApplied = timerManager.penalize(configuredPenalty);
    if (penaltyApplied > 0) {
      EventBus.emit('toast:show', {
        titleAr: `ترتيب خاطئ — خُصم ${penaltyApplied} ثانية من الوقت`,
        titleEn: `Incorrect order — -${penaltyApplied}s penalty`,
        tone: 'warning',
      });
    }

    // Progressive hint matching threshold
    const applicableHints = this.config.hints.filter(
      (h) => this.attempts >= h.attemptThreshold
    );
    const activeHint = applicableHints[applicableHints.length - 1];

    return {
      solved: false,
      attempts: this.attempts,
      penaltyApplied,
      hintAr: activeHint?.textAr,
      hintEn: activeHint?.textEn,
    };
  }
}

export const puzzleManager = new PuzzleManager();
