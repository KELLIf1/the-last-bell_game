import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { AudioSettings } from '../types/game';

interface MainMenuOverlayProps {
  hasSave: boolean;
  audioSettings: AudioSettings;
  onNewGame: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
}

export const MainMenuOverlay: React.FC<MainMenuOverlayProps> = ({
  hasSave,
  audioSettings,
  onNewGame,
  onContinue,
  onOpenSettings,
  onToggleMute,
}) => {
  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col justify-between p-6 md:p-12">
      {/* Top quiet utility */}
      <div className="flex items-center justify-between">
        <span className="font-sans-en text-xs tracking-[0.2em] text-slate-400 uppercase">
          Orion Academy · Chapter 01
        </span>
        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700/80 bg-[#0B1220]/90 px-3 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-slate-200"
          aria-label={audioSettings.muted ? 'Unmute audio' : 'Mute audio'}
        >
          {audioSettings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Right-aligned RTL Title Lockup + Actions (leaves left/center skyline calm) */}
      <div dir="rtl" className="my-auto mr-0 ml-auto flex w-full max-w-md flex-col items-start gap-6 rounded border border-slate-700/50 bg-[#080E1A]/90 p-7">
        {/* Custom SVG Title Lockup */}
        <div className="w-full">
          <img
            src="/assets/ui/title_lockup.svg"
            alt="آخر جرس - The Last Bell"
            className="h-auto w-full max-w-[360px]"
          />
        </div>

        <p className="font-ar text-sm leading-relaxed text-slate-300">
          الساعة 16:20. ستة طلاب، سبعة مقاعد، وقفل إلكتروني لا يُفتح إلا بكشف أول كذبة قيلت في هذا الفصل.
        </p>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onNewGame}
            className="min-h-[44px] w-full rounded border border-red-500/70 bg-red-700 px-5 py-2.5 text-center font-ar text-base font-semibold text-white transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-white"
          >
            لعبة جديدة · New Game
          </button>

          {hasSave && (
            <button
              type="button"
              onClick={onContinue}
              className="min-h-[44px] w-full rounded border border-slate-600 bg-slate-800/90 px-5 py-2.5 text-center font-ar text-base font-medium text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-white"
            >
              متابعة التحقيق · Continue
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[44px] w-full rounded border border-slate-700 bg-[#0F172A] px-5 py-2.5 text-center font-ar text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
          >
            الإعدادات · Settings
          </button>
        </div>
      </div>

      {/* Single flat control-hint line */}
      <div dir="rtl" className="text-center font-ar text-xs text-slate-400">
        انقر أو استخدم WASD / الأسهم للحركة · E للتفاعل · N دفتر التحقيق · Esc إيقاف مؤقت
      </div>
    </div>
  );
};
