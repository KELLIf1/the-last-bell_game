import React, { useState } from 'react';
import { EndingDefinition, TaskDecisionRecord } from '../types/game';

interface EndingResponsibilityOverlayProps {
  ending: EndingDefinition | null;
  decisions: TaskDecisionRecord[];
  onReplay: () => void;
  onReturnToMenu: () => void;
}

type EndingStep = 'ending' | 'responsibility';

export const EndingResponsibilityOverlay: React.FC<EndingResponsibilityOverlayProps> = ({
  ending,
  decisions,
  onReplay,
  onReturnToMenu,
}) => {
  const [step, setStep] = useState<EndingStep>('ending');

  const adamLines =
    ending?.adamLines && ending.adamLines.length > 0
      ? ending.adamLines
      : (ending?.textAr ?? []);

  return (
    <div
      dir="rtl"
      className="pointer-events-auto flex h-full w-full flex-col items-center justify-center bg-[#04070D]/94 p-4 sm:p-6"
    >
      {step === 'ending' ? (
        <div
          data-ending-id={ending?.id ?? 'ending_break'}
          className="w-full max-w-2xl rounded border border-slate-700/85 bg-[#0B1220]/96 p-6 text-center shadow-2xl sm:p-8"
        >
          <h1 className="font-ar text-2xl font-bold text-slate-100 sm:text-3xl">
            {ending?.titleAr ?? 'الباب الذي لم يفتح'}
          </h1>

          <div className="mt-6 space-y-3 text-right">
            {adamLines.map((line, idx) => (
              <div
                key={idx}
                className="rounded border border-slate-800 bg-[#080E1A]/90 px-4 py-3"
              >
                <div className="font-ar text-xs font-bold text-slate-400">آدم مراد</div>
                <p className="font-ar mt-1 text-base leading-relaxed text-slate-100">{line}</p>
              </div>
            ))}
          </div>

          {ending?.epilogueAr && (
            <p className="font-ar mt-5 border-t border-slate-800 pt-4 text-sm leading-relaxed text-slate-300">
              {ending.epilogueAr}
            </p>
          )}

          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={() => setStep('responsibility')}
              className="min-h-[46px] rounded border border-slate-500 bg-slate-900 px-8 py-2.5 font-ar text-sm font-bold text-white transition-colors hover:border-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
            >
              متابعة
            </button>
          </div>
        </div>
      ) : (
        <div
          data-screen="responsibility"
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded border border-slate-700/85 bg-[#0B1220]/96 shadow-2xl"
        >
          <div className="border-b border-slate-800 px-6 py-4 text-center">
            <h1 className="font-ar text-2xl font-bold text-white">ما الذي اخترتَه</h1>
          </div>

          <div className="tlb-scroll flex-1 space-y-2.5 overflow-y-auto p-5 sm:p-6">
            {decisions.length === 0 ? (
              <div className="rounded border border-slate-800 bg-[#080E1A] p-4 text-center font-ar text-sm text-slate-300">
                لم يكتمل أي قرار قبل انتهاء الوقت.
              </div>
            ) : (
              decisions.map((dec, idx) => (
                <div
                  key={`${dec.taskId}-${dec.choiceId}-${idx}`}
                  data-decision-index={idx}
                  className="rounded border border-slate-800 bg-[#080E1A]/90 px-4 py-3 text-right"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="font-ar font-bold text-slate-300">
                      <span className="font-mono-num ml-1.5 text-slate-400">{idx + 1}.</span>
                      {dec.taskTitleAr ?? dec.taskId}
                    </span>
                    <span className="font-mono-num">{dec.timestamp}</span>
                  </div>
                  <p className="font-ar mt-1.5 text-sm font-semibold leading-relaxed text-slate-100">
                    {dec.choiceTextAr}
                  </p>
                  {dec.outcomeLineAr && (
                    <p className="font-ar mt-1 text-xs leading-relaxed text-slate-400">
                      {dec.outcomeLineAr}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-800 bg-[#070B15] px-6 py-5 text-center">
            <p className="font-ar text-sm font-semibold leading-relaxed text-slate-200 sm:text-base">
              «لم يعرف أحد أنك كنتَ هنا. لكن ما حدث لهم حدث بسبب ما اخترتَه.»
            </p>

            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onReplay}
                className="min-h-[46px] rounded border border-slate-500 bg-slate-900 px-6 py-2 font-ar text-sm font-semibold text-white transition-colors hover:border-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
              >
                العب مرة أخرى
              </button>
              <button
                type="button"
                onClick={onReturnToMenu}
                className="min-h-[46px] rounded border border-slate-700 bg-[#080E1A] px-6 py-2 font-ar text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-white"
              >
                العودة إلى القائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
