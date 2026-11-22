import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { audioManager } from '../systems/AudioManager';
import { evidenceSystem } from '../systems/EvidenceSystem';
import { storyManager } from '../systems/StoryManager';
import { RegisterInspectionConfig, RegisterInspectionLine } from '../types/game';

interface RegisterInspectionModalProps {
  config: RegisterInspectionConfig;
  onClose: () => void;
  onSolved: () => void;
}

export const RegisterInspectionModal: React.FC<RegisterInspectionModalProps> = ({
  config,
  onClose,
  onSolved,
}) => {
  const [attempts, setAttempts] = useState<number>(() => storyManager.getRegisterAttempts());
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    textAr: string;
  } | null>(null);

  const handleSelectLine = (line: RegisterInspectionLine) => {
    if (solved) return;

    if (line.isAltered) {
      audioManager.playEvidence();
      evidenceSystem.collect('ev_attendance_register');
      setSolved(true);
      setFeedback({
        type: 'success',
        textAr: 'تم تحديد السطر المعدّل في سجل الحضور.',
      });
      window.setTimeout(() => {
        onSolved();
      }, 950);
      return;
    }

    audioManager.playDoorLock(false);
    const nextAttempts = storyManager.incrementRegisterAttempts();
    setAttempts(nextAttempts);
    setFeedback({
      type: 'error',
      textAr: `هذا السطر لا يظهر فيه أثر تعديل — حاول مجدداً (محاولات خاطئة: ${nextAttempts}).`,
    });
  };

  return (
    <div
      dir="rtl"
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="flex max-h-[90vh] w-full max-w-[780px] flex-col overflow-hidden rounded border border-slate-700 bg-[#080E1A] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-slate-300" />
            <h2 className="font-ar text-lg font-bold text-white">{config.titleAr}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            aria-label="إغلاق سجل الحضور"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="tlb-scroll space-y-4 overflow-y-auto p-5">
          <p className="font-ar text-sm leading-relaxed text-slate-200">
            {config.instructionsAr}
          </p>

          {/* 5 Uniform Register Lines — never reveal which one is altered */}
          <div className="space-y-2.5">
            {config.lines.map((line) => (
              <button
                key={line.id}
                type="button"
                disabled={solved}
                onClick={() => handleSelectLine(line)}
                className="flex min-h-[54px] w-full items-center justify-between rounded border border-slate-700/85 bg-[#0F172A]/85 px-4 py-3 text-right transition-colors hover:border-slate-400 hover:bg-slate-800/90 focus-visible:outline-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-80"
              >
                <span className="font-ar text-sm font-medium leading-relaxed text-slate-100">
                  {line.textAr}
                </span>
              </button>
            ))}
          </div>

          {feedback && (
            <div
              className={`rounded border p-3.5 ${
                feedback.type === 'success'
                  ? 'border-emerald-500/70 bg-emerald-950/50 text-emerald-100'
                  : 'border-red-500/60 bg-red-950/40 text-red-100'
              }`}
            >
              <div className="font-ar text-sm font-bold">{feedback.textAr}</div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
            <span className="font-ar">المحاولات الخاطئة المسجّلة: {attempts}</span>
            <span className="font-ar">اختر السطر المعدّل للمتابعة</span>
          </div>
        </div>
      </div>
    </div>
  );
};
