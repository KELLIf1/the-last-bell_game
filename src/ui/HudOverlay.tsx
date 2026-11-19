import React from 'react';
import { BookOpen, Pause, Puzzle, Volume2, VolumeX } from 'lucide-react';
import { AudioSettings, TimerWarningLevel } from '../types/game';

interface HudOverlayProps {
  timerFormatted: string;
  timerStarted: boolean;
  warningLevel: TimerWarningLevel;
  objectiveAr: string;
  objectiveEn: string;
  evidenceCount: number;
  totalEvidence: number;
  puzzleUnlocked: boolean;
  puzzleSolved: boolean;
  interactionPrompt: { labelAr: string; labelEn: string } | null;
  audioSettings: AudioSettings;
  onOpenNotebook: () => void;
  onOpenPuzzle: () => void;
  onPause: () => void;
  onToggleMute: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  timerFormatted,
  timerStarted,
  warningLevel,
  objectiveAr,
  objectiveEn,
  evidenceCount,
  totalEvidence,
  puzzleUnlocked,
  puzzleSolved,
  interactionPrompt,
  audioSettings,
  onOpenNotebook,
  onOpenPuzzle,
  onPause,
  onToggleMute,
}) => {
  const timerColorClass =
    warningLevel === 'critical' || warningLevel === 'expired'
      ? 'border-red-500/80 text-red-400'
      : warningLevel === 'warning'
        ? 'border-amber-500/70 text-amber-300'
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
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
      {/* Top Perimeter Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Timer & System Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onPause}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700/80 bg-[#0B1220]/92 px-3 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Pause"
          >
            <Pause className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700/80 bg-[#0B1220]/92 px-3 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Toggle Mute"
          >
            {audioSettings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {timerStarted && (
            <div
              className={`flex items-center gap-3 rounded border bg-[#0B1220]/92 px-3.5 py-1.5 ${timerColorClass}`}
            >
              <span className="font-mono-num text-lg font-bold tracking-wider">{timerFormatted}</span>
              <span className="font-ar text-xs text-slate-300">{statusText}</span>
            </div>
          )}
        </div>

        {/* Top-Right: Objective + Notebook + Puzzle Shortcut */}
        <div dir="rtl" className="pointer-events-auto flex items-center gap-2">
          <div className="hidden rounded border border-slate-700/80 bg-[#0B1220]/92 px-3.5 py-2 sm:block">
            <div className="font-ar text-xs font-semibold text-slate-100">{objectiveAr}</div>
            <div className="font-sans-en text-[11px] text-slate-400">{objectiveEn}</div>
          </div>

          {puzzleUnlocked && !puzzleSolved && (
            <button
              type="button"
              onClick={onOpenPuzzle}
              className="inline-flex min-h-[40px] items-center gap-2 rounded border border-amber-500/70 bg-amber-950/90 px-3.5 py-2 font-ar text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-900"
            >
              <Puzzle className="h-4 w-4" />
              <span className="whitespace-nowrap">اللغز الأول</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNotebook}
            className="inline-flex min-h-[40px] items-center gap-2 rounded border border-slate-700/80 bg-[#0B1220]/92 px-3.5 py-2 font-ar text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
          >
            <BookOpen className="h-4 w-4 text-slate-300" />
            <span className="whitespace-nowrap">دفتر التحقيق</span>
            <span className="font-mono-num text-slate-400">
              {evidenceCount}/{totalEvidence}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Interaction Indicator (when no dialogue is open) */}
      {interactionPrompt && (
        <div dir="rtl" className="mb-3 self-center rounded border border-slate-500/70 bg-[#080E1A]/94 px-4 py-2 text-center">
          <span className="font-ar text-sm font-semibold text-slate-100">
            [E] {interactionPrompt.labelAr}
          </span>
          <span className="mx-2 text-slate-500">·</span>
          <span className="font-sans-en text-xs text-slate-400">{interactionPrompt.labelEn}</span>
        </div>
      )}
    </div>
  );
};
