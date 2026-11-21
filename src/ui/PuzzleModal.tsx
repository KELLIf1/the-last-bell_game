import React, { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { puzzleManager } from '../systems/PuzzleManager';
import { PuzzleSeatingConfig } from '../types/game';

interface PuzzleModalProps {
  config: PuzzleSeatingConfig;
  showEnglish: boolean;
  onClose: () => void;
  onSolved: () => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  config,
  showEnglish,
  onClose,
  onSolved,
}) => {
  const [slots, setSlots] = useState<Array<string | null>>(Array(7).fill(null));
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    textAr: string;
    textEn: string;
    hintAr?: string;
    hintEn?: string;
  } | null>(null);

  const placedIds = new Set(slots.filter((s): s is string => Boolean(s)));
  const revealedSequence = puzzleManager.getRevealedBoardSequence();

  const assignToSlot = (slotIdx: number, labelId: string) => {
    setSlots((prev) => {
      const next = [...prev];
      const prevIdx = next.findIndex((id) => id === labelId);
      if (prevIdx !== -1) next[prevIdx] = null;
      next[slotIdx] = labelId;
      return next;
    });
    setSelectedLabelId(null);
    setFeedback(null);
  };

  const clearSlot = (slotIdx: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
    setFeedback(null);
  };

  const handleConfirm = () => {
    if (slots.some((s) => s === null)) {
      setFeedback({
        type: 'error',
        textAr: 'يرجى ملء جميع الخانات السبع قبل التأكيد.',
        textEn: 'Please fill all seven slots before confirming.',
      });
      return;
    }

    const res = puzzleManager.submitSolution(slots);
    if (res.solved) {
      setFeedback({
        type: 'success',
        textAr: res.revealAr ?? config.successRevealAr,
        textEn: res.revealEn ?? config.successRevealEn,
      });
      window.setTimeout(() => {
        onSolved();
      }, 1500);
    } else if (res.blockedReason === 'locked') {
      setFeedback({
        type: 'error',
        textAr: 'لا تزال بعض الشواهد الأساسية ناقصة لفتح الاستنتاج.',
        textEn: 'Required classroom clues are still missing to verify this deduction.',
      });
    } else {
      const penaltyAr =
        res.penaltyApplied && res.penaltyApplied > 0
          ? ` · خُصم ${res.penaltyApplied} ثانية`
          : '';
      const penaltyEn =
        res.penaltyApplied && res.penaltyApplied > 0
          ? ` · -${res.penaltyApplied}s penalty`
          : '';
      setFeedback({
        type: 'error',
        textAr: `الترتيب غير مطابق للشواهد (محاولة #${res.attempts}${penaltyAr}).`,
        textEn: `Order does not match the clues (Attempt #${res.attempts}${penaltyEn}).`,
        hintAr: res.hintAr,
        hintEn: res.hintEn,
      });
    }
  };

  return (
    <div
      dir="rtl"
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden rounded border border-slate-700 bg-[#080E1A]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div>
            <h2 className="font-ar text-lg font-bold text-white">{config.titleAr}</h2>
            {showEnglish && (
              <p className="font-sans-en text-xs text-slate-400">{config.titleEn}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            aria-label="إغلاق اللغز"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workspace */}
        <div className="tlb-scroll grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 lg:grid-cols-12">
          {/* Reference Panel: Old Seating Chart + Revealed Board Sequence */}
          <div className="space-y-4 rounded border border-slate-800 bg-[#0F172A]/80 p-4 lg:col-span-4">
            <div>
              <div className="font-ar text-xs font-semibold text-amber-300">
                تسلسل السبورة المكشوف (من اليسار إلى اليمين)
              </div>
              <div
                dir="ltr"
                className="font-mono-num mt-1.5 flex items-center justify-center gap-1.5 rounded border border-slate-700 bg-[#080E1A] px-3 py-2 text-lg font-bold text-slate-100"
              >
                {revealedSequence.map((num, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-600">-</span>}
                    <span className={num === null ? 'text-red-400' : 'text-slate-100'}>
                      {num === null ? '؟' : num}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <p className="font-ar mt-1.5 text-[11px] leading-relaxed text-slate-400">
                استنتج صاحب الموضع المجهول (؟) بمقارنة الأرقام الظاهرة مع جدول الجلوس.
              </p>
            </div>

            <div>
              <div className="font-ar text-xs font-semibold text-slate-300">
                جدول الجلوس القديم (قبل 3 سنوات)
              </div>
              <div className="mt-2 space-y-1.5">
                {config.seatingChart.map((row) => (
                  <div
                    key={row.seatNumber}
                    className={`flex items-center justify-between rounded border px-3 py-1.5 text-sm ${
                      row.damaged
                        ? 'border-red-900/70 bg-red-950/30 text-red-200'
                        : 'border-slate-800 bg-[#080E1A]/80 text-slate-200'
                    }`}
                  >
                    <span className="font-mono-num text-xs text-slate-400">#{row.seatNumber}</span>
                    <span className="font-ar font-semibold">{row.studentNameAr}</span>
                    {showEnglish && (
                      <span className="font-sans-en text-xs text-slate-400">
                        {row.studentNameEn}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Photo Slots + Name Labels */}
          <div className="flex flex-col justify-between gap-5 lg:col-span-8">
            <div className="space-y-2">
              <p className="font-ar text-sm text-slate-200">{config.instructionsAr}</p>
              {showEnglish && (
                <p dir="ltr" className="font-sans-en text-left text-xs text-slate-400">
                  {config.instructionsEn}
                </p>
              )}
            </div>

            {/* 7 Photo Slots Left -> Right */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span className="font-ar">خانات الصورة القديمة (يسار → يمين)</span>
                {showEnglish && (
                  <span className="font-sans-en">Left → Right Photo Order</span>
                )}
              </div>

              <div dir="ltr" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-7">
                {slots.map((placedId, idx) => {
                  const label = config.labels.find((l) => l.id === placedId);
                  const isCutSlot = idx === 2;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragged = e.dataTransfer.getData('text/plain');
                        if (dragged) assignToSlot(idx, dragged);
                      }}
                      onClick={() => {
                        if (selectedLabelId) {
                          assignToSlot(idx, selectedLabelId);
                        } else if (placedId) {
                          clearSlot(idx);
                        }
                      }}
                      className={`flex min-h-[104px] flex-col items-center justify-between rounded border p-2.5 text-center transition-colors ${
                        placedId
                          ? 'border-sky-500/70 bg-slate-800/90 text-white'
                          : isCutSlot
                            ? 'border-dashed border-red-500/60 bg-red-950/20 text-red-200 hover:border-red-400'
                            : 'border-dashed border-slate-600 bg-slate-900/70 text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <span className="font-ar text-[11px] text-slate-400">
                        {showEnglish ? `موضع ${idx + 1} · Pos ${idx + 1}` : `موضع ${idx + 1}`}
                      </span>
                      {label ? (
                        <div className="my-auto">
                          <div className="font-ar text-sm font-bold">{label.textAr}</div>
                          {showEnglish && (
                            <div className="font-sans-en text-[11px] text-slate-400">
                              {label.textEn}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="font-ar my-auto text-xs text-slate-500">
                          {isCutSlot ? 'موضع مقصوص' : 'اسحب أو انقر'}
                        </span>
                      )}
                      <span className="font-ar text-[10px] text-slate-500">
                        {placedId
                          ? showEnglish
                            ? 'Click to clear'
                            : 'انقر للإفراغ'
                          : showEnglish
                            ? 'Drop here'
                            : 'أفلت هنا'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Draggable / Clickable Name Labels */}
            <div>
              <div className="font-ar mb-2 text-xs text-slate-400">
                بطاقات الأسماء (اسحب للخانة أو انقر البطاقة ثم انقر الخانة):
              </div>
              <div className="flex flex-wrap gap-2">
                {config.labels.map((label) => {
                  const used = placedIds.has(label.id);
                  const selected = selectedLabelId === label.id;
                  return (
                    <button
                      key={label.id}
                      type="button"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', label.id)}
                      onClick={() => setSelectedLabelId(selected ? null : label.id)}
                      className={`min-h-[44px] rounded border px-4 py-2 transition-colors ${
                        selected
                          ? 'border-amber-400 bg-amber-950/70 text-amber-100'
                          : used
                            ? 'border-slate-800 bg-slate-900/40 text-slate-500'
                            : 'border-slate-600 bg-slate-800 text-slate-100 hover:border-slate-400'
                      }`}
                    >
                      <span className="font-ar text-sm font-semibold">{label.textAr}</span>
                      {showEnglish && (
                        <span className="font-sans-en mr-2 text-xs text-slate-400">
                          {label.textEn}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback & Progressive Hint */}
            {feedback && (
              <div
                className={`rounded border p-3.5 ${
                  feedback.type === 'success'
                    ? 'border-emerald-500/70 bg-emerald-950/50 text-emerald-100'
                    : 'border-red-500/60 bg-red-950/40 text-red-100'
                }`}
              >
                <div className="font-ar text-sm font-bold">{feedback.textAr}</div>
                {showEnglish && (
                  <div dir="ltr" className="font-sans-en mt-0.5 text-left text-xs opacity-90">
                    {feedback.textEn}
                  </div>
                )}
                {feedback.hintAr && (
                  <div className="mt-2 border-t border-red-800/60 pt-2 text-xs text-amber-200">
                    <div className="font-ar">{feedback.hintAr}</div>
                    {showEnglish && feedback.hintEn && (
                      <div dir="ltr" className="font-sans-en mt-0.5 text-left opacity-80">
                        {feedback.hintEn}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => {
                  setSlots(Array(7).fill(null));
                  setSelectedLabelId(null);
                  setFeedback(null);
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded border border-slate-700 bg-slate-900 px-4 py-2 font-ar text-sm text-slate-200 hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
                <span>إعادة ضبط</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="min-h-[44px] rounded border border-red-500/70 bg-red-700 px-6 py-2 font-ar text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                {showEnglish ? 'تأكيد الترتيب · Confirm Order' : 'تأكيد الترتيب'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
