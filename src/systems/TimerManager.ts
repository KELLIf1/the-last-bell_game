import { TimerWarningLevel } from '../types/game';
import { EventBus } from './EventBus';
import { storyManager } from './StoryManager';

/**
 * Fictional 60-minute (3600s) countdown with configurable acceleration.
 * Default paceFactor = 3.0 (1 real second = 3 fictional seconds => 20 min real playthrough cap).
 */
export class TimerManager {
  private readonly initialSeconds = 59 * 60 + 59; // 59:59
  private remainingSeconds = 59 * 60 + 59;
  private paceFactor = 3.0;
  private running = false;
  private started = false;
  private lastWarningLevel: TimerWarningLevel = 'normal';
  private tickAccumulator = 0;

  reset(): void {
    this.remainingSeconds = this.initialSeconds;
    this.running = false;
    this.started = false;
    this.lastWarningLevel = 'normal';
    this.tickAccumulator = 0;
    this.emitUpdate();
  }

  start(): void {
    this.started = true;
    this.running = true;
    this.emitUpdate();
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    if (this.started && this.remainingSeconds > 0) {
      this.running = true;
    }
  }

  setPaceFactor(factor: number): void {
    this.paceFactor = Math.max(0.5, Math.min(20, factor));
  }

  update(deltaMs: number): void {
    if (!this.running || !this.started || this.remainingSeconds <= 0) return;

    const clampedDtSec = Math.min(deltaMs / 1000, 0.05);
    this.tickAccumulator += clampedDtSec * this.paceFactor;

    if (this.tickAccumulator >= 1) {
      const whole = Math.floor(this.tickAccumulator);
      this.tickAccumulator -= whole;
      this.remainingSeconds = Math.max(0, this.remainingSeconds - whole);

      const level = this.getWarningLevel();
      if (level !== this.lastWarningLevel) {
        this.lastWarningLevel = level;
        EventBus.emit('timer:warning_changed', level);
      }

      if (this.remainingSeconds <= 0) {
        this.running = false;
        this.handleTimeout();
      }
      this.emitUpdate();
    }
  }

  private handleTimeout(): void {
    if (storyManager.getFlag('puzzle_01_solved') !== true) {
      storyManager.setFlag('puzzle_01_failed_timeout', true);
      EventBus.emit('timer:expired', {
        consequence: 'timeout_before_puzzle',
      });
    }
  }

  getWarningLevel(): TimerWarningLevel {
    if (this.remainingSeconds <= 0) return 'expired';
    if (this.remainingSeconds <= 180) return 'critical'; // < 03:00
    if (this.remainingSeconds <= 600) return 'warning'; // < 10:00
    return 'normal';
  }

  getFormatted(): string {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = Math.floor(this.remainingSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  getState(): { remainingSeconds: number; started: boolean; running: boolean } {
    return {
      remainingSeconds: this.remainingSeconds,
      started: this.started,
      running: this.running,
    };
  }

  loadState(remainingSeconds: number, started: boolean): void {
    this.remainingSeconds = Math.max(0, Math.min(this.initialSeconds, remainingSeconds));
    this.started = started;
    this.running = false;
    this.lastWarningLevel = this.getWarningLevel();
    this.emitUpdate();
  }

  private emitUpdate(): void {
    EventBus.emit('timer:updated', {
      formatted: this.getFormatted(),
      remainingSeconds: this.remainingSeconds,
      started: this.started,
      warningLevel: this.getWarningLevel(),
    });
  }
}

export const timerManager = new TimerManager();
