import React, { useEffect, useRef, useState } from 'react';
import { Camera, Scissors, X } from 'lucide-react';
import { audioManager } from '../systems/AudioManager';
import { evidenceSystem } from '../systems/EvidenceSystem';
import { storyManager } from '../systems/StoryManager';
import { PhotoInspectionConfig, PhotoInspectionHotspot } from '../types/game';

interface PhotoInspectionModalProps {
  config: PhotoInspectionConfig;
  onClose: () => void;
  onSolved: () => void;
}

const TOTAL_SLOTS = 7;

export const PhotoInspectionModal: React.FC<PhotoInspectionModalProps> = ({
  config,
  onClose,
  onSolved,
}) => {
  const [attempts, setAttempts] = useState<number>(() => storyManager.getPhotoAttempts());
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    textAr: string;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);

  const hotspotRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const continueBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (revealed) {
      continueBtnRef.current?.focus();
    }
  }, [revealed]);

  const inspectHotspot = (hotspot: PhotoInspectionHotspot) => {
    setActiveHotspotId(hotspot.id);

    if (hotspot.isCorrect) {
      if (!revealed) {
        audioManager.playEvidence();
        evidenceSystem.collect('ev_cut_photo');
        setRevealed(true);
      }
      setFeedback({
        type: 'success',
        textAr:
          hotspot.revealTextAr ??
          'خلف الصورة تاريخ اليوم الأخير: «الموضع الثالث في الصورة — المقعد السابع — كان لسامر».',
      });
      return;
    }

    if (revealed) return;
    audioManager.playDoorLock(false);
    const nextAttempts = storyManager.incrementPhotoAttempts();
    setAttempts(nextAttempts);
    setFeedback({
      type: 'error',
      textAr:
        hotspot.wrongFeedbackAr ??
        'لا توجد إجابة حاسمة في هذا الموضع — جرّب موضعاً آخر في الصورة.',
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (!revealed && (e.key === '1' || e.key === '2' || e.key === '3')) {
        const idx = Number(e.key) - 1;
        const target = config.hotspots[idx];
        if (target) {
          e.preventDefault();
          hotspotRefs.current[idx]?.focus();
          inspectHotspot(target);
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const focusedIdx = hotspotRefs.current.findIndex((el) => el === document.activeElement);
        if (focusedIdx !== -1 && config.hotspots.length > 0) {
          e.preventDefault();
          const dir = e.key === 'ArrowLeft' ? 1 : -1;
          const nextIdx =
            (focusedIdx + dir + config.hotspots.length) % config.hotspots.length;
          hotspotRefs.current[nextIdx]?.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-inspection-title"
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/82 p-3 sm:p-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded border border-slate-700 bg-[#080E1A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Camera className="h-5 w-5 text-slate-300" />
            <h2 id="photo-inspection-title" className="font-ar text-lg font-bold text-white">
              {config.titleAr}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="إغلاق فحص الصورة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="tlb-scroll space-y-4 overflow-y-auto p-4 sm:p-5">
          <p className="font-ar text-sm leading-relaxed text-slate-200">
            {config.instructionsAr}
          </p>

          {/* Existing Class Photo Asset + 7-Position Strip (Position 3 cut out) */}
          <div className="overflow-hidden rounded border border-slate-700/90 bg-[#050912]">
            <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-slate-800">
              <img
                src={config.imageUrl}
                alt={config.titleAr}
                className="h-full w-full object-cover object-center opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050912] via-transparent to-black/35" />
            </div>

            {/* 7 Photo Positions: Slot 3 (index 2) is torn/cut */}
            <div className="p-3 sm:p-4">
              <div className="mb-2 font-ar text-xs text-slate-400">
                ترتيب مواضع الصورة السبع (من اليسار إلى اليمين):
              </div>
              <div dir="ltr" className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {Array.from({ length: TOTAL_SLOTS }, (_, idx) => {
                  const isCut = idx === config.cutSlotIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex min-h-[56px] flex-col items-center justify-center rounded border px-1 py-2 text-center ${
                        isCut
                          ? 'border-dashed border-red-500/80 bg-red-950/35 text-red-200'
                          : 'border-slate-700 bg-slate-900/80 text-slate-200'
                      }`}
                    >
                      <span className="font-mono-num text-xs font-bold">{idx + 1}</span>
                      {isCut ? (
                        <span className="mt-1 inline-flex items-center gap-0.5 font-ar text-[11px] font-semibold text-red-300">
                          <Scissors className="h-3 w-3 shrink-0" />
                          <span>مقصوص</span>
                        </span>
                      ) : (
                        <span className="mt-1 font-ar text-[11px] text-slate-400">وجه</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3 Inspection Hotspots — Uniform Styling, Keyboard + Touch Accessible */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {config.hotspots.map((hotspot, idx) => {
              const isSelected = activeHotspotId === hotspot.id;
              return (
                <button
                  key={hotspot.id}
                  ref={(el) => {
                    hotspotRefs.current[idx] = el;
                  }}
                  type="button"
                  data-hotspot-id={hotspot.id}
                  disabled={revealed && !hotspot.isCorrect}
                  onClick={() => inspectHotspot(hotspot)}
                  className={`flex min-h-[52px] items-center justify-between gap-2 rounded border px-4 py-3 text-right transition-colors focus-visible:outline-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-60 ${
                    isSelected && revealed && hotspot.isCorrect
                      ? 'border-emerald-500/80 bg-emerald-950/50 text-emerald-100'
                      : isSelected
                        ? 'border-amber-500/75 bg-slate-800 text-white'
                        : 'border-slate-700/90 bg-[#0F172A]/85 text-slate-100 hover:border-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-ar text-sm font-semibold">{hotspot.labelAr}</span>
                  <span className="font-mono-num text-xs text-slate-400">{idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Neutral Feedback or Revealed Backside Note */}
          {feedback && (
            <div
              role="status"
              className={`rounded border p-3.5 ${
                feedback.type === 'success'
                  ? 'border-emerald-500/70 bg-emerald-950/45 text-emerald-100'
                  : 'border-slate-600 bg-[#0F172A] text-slate-200'
              }`}
            >
              <p className="font-ar text-sm leading-relaxed">{feedback.textAr}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
            <span className="font-ar text-xs text-slate-400">
              محاولات الفحص الإضافية: <span className="font-mono-num">{attempts}</span>
            </span>

            {revealed ? (
              <button
                ref={continueBtnRef}
                type="button"
                onClick={onSolved}
                className="min-h-[44px] rounded border border-amber-500/80 bg-amber-950/70 px-6 py-2 font-ar text-sm font-bold text-amber-100 transition-colors hover:bg-amber-900/80 focus-visible:outline-2 focus-visible:outline-white"
              >
                متابعة
              </button>
            ) : (
              <span className="font-ar text-xs text-slate-400">
                اختر أحد المواضع الثلاثة لفحص الصورة
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
