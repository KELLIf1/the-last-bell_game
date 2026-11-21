import { TimerWarningLevel } from '../types/game';
import { audioManager } from './AudioManager';
import { EventBus } from './EventBus';
import { storyManager } from './StoryManager';

/**
 * سرعة تقدّم العداد الوهمي (59:59 = 3599 ثانية).
 * القيمة 4.3 تعني أن كل ثانية حقيقية = 4.3 ثانية في القصة (~13.95 دقيقة حقيقية إجمالاً).
 * عدّل هذا الثابت هنا فقط لتغيير مدة الفصل الزمنية.
 */
export const DEFAULT_TIMER_PACE_FACTOR = 4.3;

export class TimerManager {
  private readonly initialSeconds = 59 * 60 + 59; // 59:59
  private remainingSeconds = 59 * 60 + 59;
  private paceFactor = DEFAULT_TIMER_PACE_FACTOR;
  private running = false;
  private started = false;
  private expiredEmitted = false;
  private lastWarningLevel: TimerWarningLevel = 'normal';
  private tickAccumulator = 0;

  reset(): void {
    this.remainingSeconds = this.initialSeconds;
    this.running = false;
    this.started = false;
    this.expiredEmitted = false;
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
    if (this.started && this.remainingSeconds > 0 && !this.expiredEmitted) {
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
        audioManager.playTimerWarningCue(level);
      } else if (level === 'critical' && this.remainingSeconds > 0 && this.remainingSeconds % 8 === 0) {
        audioManager.playClockTick();
      }

      if (this.remainingSeconds <= 0) {
        this.running = false;
        this.handleTimeout();
      }
      this.emitUpdate();
    }
  }

  penalize(seconds: number): number {
    if (!this.started || this.remainingSeconds <= 0 || this.expiredEmitted) {
      return 0;
    }

    const deducted = Math.min(this.remainingSeconds, Math.max(0, Math.floor(seconds)));
    if (deducted <= 0) return 0;

    this.remainingSeconds = Math.max(0, this.remainingSeconds - deducted);

    const level = this.getWarningLevel();
    if (level !== this.lastWarningLevel) {
      this.lastWarningLevel = level;
      EventBus.emit('timer:warning_changed', level);
      audioManager.playTimerWarningCue(level);
    }

    if (this.remainingSeconds <= 0) {
      this.running = false;
      this.handleTimeout();
    }
    this.emitUpdate();
    return deducted;
  }

  private handleTimeout(): void {
    if (this.expiredEmitted) return;
    if (storyManager.getFlag('ch1_finale_started') === true) return;
    this.expiredEmitted = true;
    storyManager.setFlag('puzzle_01_failed_timeout', true);
    EventBus.emit('timer:expired', {
      consequence:
        storyManager.getFlag('puzzle_01_solved') === true
          ? 'timeout_before_conversations'
          : 'timeout_before_puzzle',
    });
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
    this.expiredEmitted = started && this.remainingSeconds <= 0;
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
