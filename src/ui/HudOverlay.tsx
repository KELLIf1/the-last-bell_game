import React from 'react';
import { BookOpen, Pause, Puzzle, Volume2, VolumeX } from 'lucide-react';
import { AudioSettings, TimerWarningLevel } from '../types/game';

interface HudOverlayProps {
  timerFormatted: string;
  timerStarted: boolean;
  warningLevel: TimerWarningLevel;
  timeLossFlashSec: number | null;
  lightsOutActive: boolean;
  doorDelayRemainingSec: number;
  cameraCutActive: boolean;
  exposedSecretNameAr: string | null;
  objectiveAr: string;
  evidenceCount: number;
  totalEvidence: number;
  puzzleUnlocked: boolean;
  puzzleSolved: boolean;
  pendingExecutionLabelAr: string | null;
  interactionPrompt: { labelAr: string } | null;
  audioSettings: AudioSettings;
  onOpenNotebook: () => void;
  onOpenPuzzle: () => void;
  onResumeExecution: () => void;
  onPause: () => void;
  onToggleMute: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  timerFormatted,
  timerStarted,
  warningLevel,
  timeLossFlashSec,
  lightsOutActive,
  doorDelayRemainingSec,
  cameraCutActive,
  exposedSecretNameAr,
  objectiveAr,
  evidenceCount,
  totalEvidence,
  puzzleUnlocked,
  puzzleSolved,
  pendingExecutionLabelAr,
  interactionPrompt,
  audioSettings,
  onOpenNotebook,
  onOpenPuzzle,
  onResumeExecution,
  onPause,
  onToggleMute,
}) => {
  const timerColorClass =
    timeLossFlashSec !== null
      ? 'border-red-500 bg-red-950/95 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.55)] animate-pulse'
      : warningLevel === 'critical' || warningLevel === 'expired'
        ? 'border-red-500/80 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.28)]'
        : warningLevel === 'warning'
          ? 'border-amber-500/75 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.18)]'
          : 'border-slate-700/80 text-slate-100';

  const statusText =
    warningLevel === 'expired'
      ? 'انتهى الوقت'
      : warningLevel === 'critical'
        ? 'تحذير حرج'
        : warningLevel === 'warning'
          ? 'الوقت ينفد'
          : 'الوقت المتبقي';

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
      {/* Penalty Full-Frame Emergency/Cut Visual Effects */}
      {lightsOutActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-red-950/35 ring-4 ring-inset ring-red-600/65 animate-pulse"
        />
      )}
      {cameraCutActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 border-2 border-red-500/70 bg-slate-950/25 shadow-[inset_0_0_80px_rgba(0,0,0,0.75)]"
        />
      )}

      {/* Top Perimeter Bar */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left: Timer & System Controls */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPause}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700/80 bg-[#0B1220]/92 px-3 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="إيقاف مؤقت"
          >
            <Pause className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700/80 bg-[#0B1220]/92 px-3 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
            aria-label={audioSettings.muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {audioSettings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {timerStarted && (
            <div
              className={`flex items-center gap-2 rounded border bg-[#0B1220]/92 px-3 py-1.5 transition-colors duration-300 sm:gap-2.5 sm:px-3.5 ${timerColorClass}`}
            >
              {(warningLevel === 'warning' || warningLevel === 'critical' || timeLossFlashSec !== null) && (
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full motion-safe:animate-pulse ${
                    warningLevel === 'critical' || timeLossFlashSec !== null ? 'bg-red-500' : 'bg-amber-400'
                  }`}
                />
              )}
              <span className="font-mono-num text-base font-bold tracking-wider sm:text-lg">
                {timerFormatted}
              </span>
              <span className="font-ar text-[11px] text-slate-300 sm:text-xs">{statusText}</span>
              {timeLossFlashSec !== null && (
                <span dir="rtl" className="font-ar rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  -{timeLossFlashSec} ث
                </span>
              )}
            </div>
          )}

          {/* Active Gameplay Penalty Indicators */}
          {lightsOutActive && (
            <div dir="rtl" className="rounded border border-red-500/80 bg-red-950/92 px-3 py-1.5 font-ar text-xs font-bold text-red-200">
              انقطاع الإضاءة — وضع الطوارئ
            </div>
          )}
          {doorDelayRemainingSec > 0 && (
            <div dir="rtl" className="rounded border border-red-500/80 bg-red-950/92 px-3 py-1.5 font-ar text-xs font-bold text-red-200">
              تأخير الباب: {doorDelayRemainingSec} ث
            </div>
          )}
          {cameraCutActive && (
            <div dir="rtl" className="rounded border border-red-500/80 bg-red-950/92 px-3 py-1.5 font-ar text-xs font-bold text-red-200">
              تبديل زاوية المراقبة القسري
            </div>
          )}
          {exposedSecretNameAr && (
            <div dir="rtl" className="rounded border border-amber-500/80 bg-red-950/92 px-3 py-1.5 font-ar text-xs font-bold text-amber-200">
              كُشف سر: {exposedSecretNameAr}
            </div>
          )}
        </div>

        {/* Top-Right: Persistent Objective + Notebook + Puzzle Shortcut */}
        <div dir="rtl" className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
          <div className="max-w-[260px] rounded border border-slate-700/80 bg-[#0B1220]/92 px-3 py-1.5 sm:max-w-md sm:px-3.5 sm:py-2">
            <div className="font-ar text-xs font-semibold text-slate-100">{objectiveAr}</div>
          </div>

          {pendingExecutionLabelAr ? (
            <button
              type="button"
              onClick={onResumeExecution}
              className="inline-flex min-h-[40px] items-center gap-2 rounded border border-amber-500/70 bg-amber-950/90 px-3 py-1.5 font-ar text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-900 sm:px-3.5 sm:py-2"
            >
              <Puzzle className="h-4 w-4" />
              <span className="whitespace-nowrap">{pendingExecutionLabelAr}</span>
            </button>
          ) : (
            puzzleUnlocked &&
            !puzzleSolved && (
              <button
                type="button"
                onClick={onOpenPuzzle}
                className="inline-flex min-h-[40px] items-center gap-2 rounded border border-amber-500/70 bg-amber-950/90 px-3 py-1.5 font-ar text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-900 sm:px-3.5 sm:py-2"
              >
                <Puzzle className="h-4 w-4" />
                <span className="whitespace-nowrap">اللغز الأول</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={onOpenNotebook}
            className="inline-flex min-h-[40px] items-center gap-2 rounded border border-slate-700/80 bg-[#0B1220]/92 px-3 py-1.5 font-ar text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white sm:px-3.5 sm:py-2"
          >
            <BookOpen className="h-4 w-4 text-slate-300" />
            <span className="whitespace-nowrap">سجل الملاحظات</span>
            <span className="font-mono-num text-slate-400">
              {evidenceCount}/{totalEvidence}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Interaction Indicator (when no dialogue is open) */}
      {interactionPrompt && (
        <div
          dir="rtl"
          className="relative z-10 mb-3 self-center rounded border border-slate-500/70 bg-[#080E1A]/94 px-4 py-2 text-center"
        >
          <span className="font-ar text-sm font-semibold text-slate-100">
            {interactionPrompt.labelAr}
          </span>
        </div>
      )}
    </div>
  );
};
