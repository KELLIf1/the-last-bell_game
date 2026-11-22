import React, { useEffect, useRef } from 'react';
import { DoorClosed, X } from 'lucide-react';
import { dialogueSystem } from '../systems/DialogueSystem';
import { TaskChoice } from '../types/game';

interface DoorChoiceModalProps {
  titleAr?: string;
  choices: TaskChoice[];
  onClose: () => void;
  onSelectChoice: (choiceId: string) => void;
}

export const DoorChoiceModal: React.FC<DoorChoiceModalProps> = ({
  titleAr = 'المهمة الأخيرة: الباب',
  choices,
  onClose,
  onSelectChoice,
}) => {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    buttonRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        const target = choices[idx];
        if (target) {
          e.preventDefault();
          onSelectChoice(target.id);
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focusedIdx = buttonRefs.current.findIndex((el) => el === document.activeElement);
        if (choices.length > 0) {
          e.preventDefault();
          const base = focusedIdx === -1 ? 0 : focusedIdx;
          const delta = e.key === 'ArrowDown' ? 1 : -1;
          const nextIdx = (base + delta + choices.length) % choices.length;
          buttonRefs.current[nextIdx]?.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choices, onClose, onSelectChoice]);

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="door-choice-title"
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/82 p-3 sm:p-4"
    >
      <div className="flex max-h-[92vh] w-full max-w-[780px] flex-col overflow-hidden rounded border border-slate-700 bg-[#080E1A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <DoorClosed className="h-5 w-5 text-red-400" />
            <h2 id="door-choice-title" className="font-ar text-lg font-bold text-white">
              {titleAr}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
            aria-label="إغلاق قرار الباب"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="tlb-scroll space-y-4 overflow-y-auto p-4 sm:p-5">
          <div className="relative aspect-[16/6.5] w-full overflow-hidden rounded border border-slate-800 bg-[#050912]">
            <img
              src="/assets/backgrounds/classroom_door_closeup.webp"
              alt="الباب المقفل"
              className="h-full w-full object-cover object-center opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080E1A] via-transparent to-black/25" />
          </div>

          <p className="font-ar text-sm leading-relaxed text-slate-200">
            ما الذي سيفعله الطلاب أمام الباب الآن؟
          </p>

          {/* Actions rendered in exact config order — never shuffle, never mark right/wrong */}
          <div className="space-y-2.5">
            {choices.map((ch, idx) => {
              const speakerNameAr = dialogueSystem.getSpeakerNameAr(ch.proposedBy);
              return (
                <button
                  key={ch.id}
                  ref={(el) => {
                    buttonRefs.current[idx] = el;
                  }}
                  type="button"
                  data-choice-id={ch.id}
                  onClick={() => onSelectChoice(ch.id)}
                  className="flex min-h-[60px] w-full items-center gap-3.5 rounded border border-slate-700/90 bg-[#0F172A]/90 px-4 py-3 text-right transition-colors hover:border-slate-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <img
                    src={`/assets/characters/portraits/${ch.proposedBy}/neutral.webp`}
                    alt={speakerNameAr}
                    className="h-11 w-11 shrink-0 rounded border border-slate-700 object-cover object-top"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-ar text-xs font-bold text-slate-300">
                      اقتراح {speakerNameAr}
                    </div>
                    <div className="font-ar mt-0.5 text-sm font-medium leading-relaxed text-slate-100">
                      {ch.textAr}
                    </div>
                  </div>
                  <span className="font-mono-num shrink-0 text-xs text-slate-400">{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
