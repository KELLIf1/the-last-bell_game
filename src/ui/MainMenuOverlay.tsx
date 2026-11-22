import React, { useState } from 'react';
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
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const handleNewGameClick = () => {
    if (hasSave) {
      setConfirmOverwrite(true);
    } else {
      onNewGame();
    }
  };

  return (
    <div className="pointer-events-auto absolute inset-0 flex flex-col justify-between p-6 md:p-12">
      {/* Top quiet utility */}
      <div className="flex items-center justify-between gap-3">
        <span dir="rtl" className="font-ar text-xs text-slate-400">
          أكاديمية أوريون · الفصل الأول
        </span>
        <button
          type="button"
          onClick={onToggleMute}
          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700/80 bg-[#0B1220]/90 px-3 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-slate-200"
          aria-label={audioSettings.muted ? 'تشغيل الصوت' : 'كتم الصوت'}
        >
          {audioSettings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Right-aligned RTL Title Lockup + Actions */}
      <div
        dir="rtl"
        className="my-auto mr-0 ml-auto flex w-full max-w-md flex-col items-start gap-6 rounded border border-slate-700/50 bg-[#080E1A]/90 p-7"
      >
        <div className="w-full">
          <img
            src="/assets/ui/title_lockup.svg"
            alt="آخر جرس"
            className="h-auto w-full max-w-[360px]"
          />
        </div>

        <p className="font-ar text-sm leading-relaxed text-slate-300">
          الساعة 16:20. ستة طلاب، سبعة مقاعد، وقفل إلكتروني لا يُفتح إلا بكشف أول كذبة قيلت في هذا
          الفصل.
        </p>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={handleNewGameClick}
            className="min-h-[44px] w-full rounded border border-red-500/70 bg-red-700 px-5 py-2.5 text-center font-ar text-base font-semibold text-white transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-white"
          >
            لعبة جديدة
          </button>

          {hasSave && (
            <button
              type="button"
              onClick={onContinue}
              className="min-h-[44px] w-full rounded border border-slate-600 bg-slate-800/90 px-5 py-2.5 text-center font-ar text-base font-medium text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-white"
            >
              متابعة
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[44px] w-full rounded border border-slate-700 bg-[#0F172A] px-5 py-2.5 text-center font-ar text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
          >
            الإعدادات
          </button>
        </div>
      </div>

      {/* Single flat control-hint line */}
      <div dir="rtl" className="text-center font-ar text-xs text-slate-400">
        انقر على العناصر للتفاعل · N سجل الملاحظات · Esc إيقاف مؤقت
      </div>

      {/* Overwrite Save Confirmation Dialog */}
      {confirmOverwrite && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-sm rounded border border-slate-700 bg-[#080E1A] p-6 shadow-2xl">
            <h3 className="font-ar text-lg font-bold text-white">بدء لعبة جديدة</h3>
            <p className="font-ar mt-2 text-sm leading-relaxed text-slate-300">
              سيُستبدل تقدمك المحفوظ. هل تريد المتابعة والبدء من جديد؟
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmOverwrite(false);
                  onNewGame();
                }}
                className="min-h-[44px] flex-1 rounded border border-red-500/70 bg-red-700 px-4 py-2 font-ar text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                تأكيد البدء
              </button>
              <button
                type="button"
                onClick={() => setConfirmOverwrite(false)}
                className="min-h-[44px] flex-1 rounded border border-slate-700 bg-slate-900 px-4 py-2 font-ar text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
