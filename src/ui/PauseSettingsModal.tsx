import React from 'react';
import { X } from 'lucide-react';
import { AudioSettings } from '../types/game';

interface PauseSettingsModalProps {
  mode: 'pause' | 'settings';
  audioSettings: AudioSettings;
  showEnglish: boolean;
  onUpdateAudio: (partial: Partial<AudioSettings>) => void;
  onToggleEnglish: (show: boolean) => void;
  onSaveGame?: () => void;
  onReturnToMenu?: () => void;
  onClose: () => void;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  mode,
  audioSettings,
  showEnglish,
  onUpdateAudio,
  onToggleEnglish,
  onSaveGame,
  onReturnToMenu,
  onClose,
}) => {
  return (
    <div
      dir="rtl"
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="w-full max-w-md rounded border border-slate-700 bg-[#080E1A] p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-ar text-lg font-bold text-white">
            {mode === 'pause'
              ? showEnglish
                ? 'إيقاف مؤقت · Paused'
                : 'إيقاف مؤقت'
              : showEnglish
                ? 'الإعدادات · Settings'
                : 'الإعدادات'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="font-ar">
                {showEnglish ? 'الصوت العام · Master' : 'الصوت العام'}
              </span>
              <span className="font-mono-num">{Math.round(audioSettings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioSettings.masterVolume}
              onChange={(e) => onUpdateAudio({ masterVolume: parseFloat(e.target.value) })}
              className="w-full accent-red-600"
            />
          </label>

          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="font-ar">
                {showEnglish ? 'الموسيقى والأجواء · Ambience' : 'الموسيقى والأجواء'}
              </span>
              <span className="font-mono-num">{Math.round(audioSettings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioSettings.musicVolume}
              onChange={(e) => onUpdateAudio({ musicVolume: parseFloat(e.target.value) })}
              className="w-full accent-red-600"
            />
          </label>

          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="font-ar">
                {showEnglish ? 'المؤثرات · SFX' : 'المؤثرات الصوتية'}
              </span>
              <span className="font-mono-num">{Math.round(audioSettings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioSettings.sfxVolume}
              onChange={(e) => onUpdateAudio({ sfxVolume: parseFloat(e.target.value) })}
              className="w-full accent-red-600"
            />
          </label>

          <label className="flex min-h-[40px] cursor-pointer items-center justify-between border-t border-slate-800 pt-3">
            <span className="font-ar text-sm text-slate-200">
              {showEnglish ? 'كتم الصوت بالكامل · Mute All' : 'كتم الصوت بالكامل'}
            </span>
            <input
              type="checkbox"
              checked={audioSettings.muted}
              onChange={(e) => onUpdateAudio({ muted: e.target.checked })}
              className="h-4 w-4 accent-red-600"
            />
          </label>

          <label className="flex min-h-[40px] cursor-pointer items-center justify-between border-t border-slate-800 pt-3">
            <span className="font-ar text-sm text-slate-200">
              {showEnglish ? 'إظهار الإنجليزية · Show English' : 'إظهار الإنجليزية'}
            </span>
            <input
              type="checkbox"
              checked={showEnglish}
              onChange={(e) => onToggleEnglish(e.target.checked)}
              className="h-4 w-4 accent-red-600"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] w-full rounded border border-red-500/70 bg-red-700 px-4 py-2 font-ar text-sm font-semibold text-white hover:bg-red-600"
          >
            {mode === 'pause'
              ? showEnglish
                ? 'استئناف اللعب · Resume'
                : 'استئناف اللعب'
              : showEnglish
                ? 'حفظ وإغلاق · Done'
                : 'حفظ وإغلاق'}
          </button>

          {mode === 'pause' && onSaveGame && (
            <button
              type="button"
              onClick={onSaveGame}
              className="min-h-[44px] w-full rounded border border-slate-600 bg-slate-800 px-4 py-2 font-ar text-sm font-medium text-slate-100 hover:bg-slate-700"
            >
              {showEnglish ? 'حفظ التقدم يدويًا · Save Progress' : 'حفظ التقدم يدويًا'}
            </button>
          )}

          {mode === 'pause' && onReturnToMenu && (
            <button
              type="button"
              onClick={onReturnToMenu}
              className="min-h-[44px] w-full rounded border border-slate-700 bg-[#0F172A] px-4 py-2 font-ar text-sm text-slate-300 hover:bg-slate-800"
            >
              {showEnglish ? 'العودة إلى القائمة الرئيسية · Main Menu' : 'العودة إلى القائمة الرئيسية'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
