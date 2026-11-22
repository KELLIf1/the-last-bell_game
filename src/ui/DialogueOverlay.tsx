import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../systems/AudioManager';
import { EventBus } from '../systems/EventBus';
import { CharacterId, DialogueChoice, DialogueLine, StudentId } from '../types/game';

interface DialogueOverlayProps {
  line: DialogueLine;
  choices: DialogueChoice[];
  onAdvance: () => void;
  onSelectChoice: (choiceId: string) => void;
}

const PORTRAIT_ACCENTS: Record<CharacterId | 'narrator' | 'system', string> = {
  samer: '#38BDF8',
  layan: '#94A3B8',
  yacine: '#9F1239',
  nour: '#F43F5E',
  karim: '#7DD3FC',
  mariam: '#64748B',
  adam: '#DC2626',
  elena: '#E2E8F0',
  narrator: '#475569',
  system: '#DC2626',
};

function resolvePortraitSrc(line: DialogueLine): string | null {
  if (line.speaker === 'narrator' || line.speaker === 'system') return null;
  if (line.speaker === 'elena') {
    return '/assets/characters/portraits/elena/archival.webp';
  }
  if (line.speaker === 'adam') {
    const state =
      line.expression === 'angry' || line.expression === 'worried' ? 'intense' : 'neutral';
    return `/assets/characters/portraits/adam/${state}.webp`;
  }
  const expr = line.expression ?? 'neutral';
  const fileState = line.speaking && expr === 'neutral' ? 'speaking' : expr;
  return `/assets/characters/portraits/${line.speaker}/${fileState}.webp`;
}

function resolveStudentPortraitSrc(studentId: StudentId): string {
  return `/assets/characters/portraits/${studentId}/neutral.webp`;
}

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({
  line,
  choices,
  onAdvance,
  onSelectChoice,
}) => {
  const accent = PORTRAIT_ACCENTS[line.speaker] ?? '#94A3B8';
  const portraitSrc = resolvePortraitSrc(line);
  const [imgFailed, setImgFailed] = useState(false);

  const [typedAr, setTypedAr] = useState('');
  const [isFullyTyped, setIsFullyTyped] = useState(false);
  const timerRef = useRef<number | null>(null);

  const stopTypingTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    stopTypingTimer();
    setImgFailed(false);
    setTypedAr('');

    const textAr = line.textAr ?? '';
    if (textAr.length === 0) {
      setIsFullyTyped(true);
      return;
    }

    setIsFullyTyped(false);
    let idxAr = 0;

    timerRef.current = window.setInterval(() => {
      if (idxAr < textAr.length) {
        idxAr += 1;
        setTypedAr(textAr.slice(0, idxAr));
        const ch = textAr[idxAr - 1];
        if (ch && ch !== ' ' && idxAr % 3 === 1) {
          audioManager.playKeyTick();
        }
      }

      if (idxAr >= textAr.length) {
        setTypedAr(textAr);
        setIsFullyTyped(true);
        stopTypingTimer();
      }
    }, 18);

    return () => {
      stopTypingTimer();
    };
  }, [line, stopTypingTimer]);

  const handleBoxClick = useCallback(() => {
    if (choices.length > 0) return;
    if (!isFullyTyped) {
      stopTypingTimer();
      setTypedAr(line.textAr ?? '');
      setIsFullyTyped(true);
      return;
    }
    onAdvance();
  }, [choices.length, isFullyTyped, line.textAr, onAdvance, stopTypingTimer]);

  useEffect(() => {
    return EventBus.on('dialogue:advance_or_reveal', () => {
      handleBoxClick();
    });
  }, [handleBoxClick]);

  return (
    <div
      dir="rtl"
      className="pointer-events-auto absolute inset-x-0 bottom-4 mx-auto w-[calc(100%-2rem)] max-w-[960px]"
    >
      {/* Student-proposed choices (voiced by proposing student, never player speaking) */}
      {choices.length > 0 && (
        <div className="mb-2.5 flex flex-col gap-2">
          {choices.map((choice) => {
            const proposer = choice.proposedBy;
            const proposerAccent = proposer ? PORTRAIT_ACCENTS[proposer] : '#64748B';
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onSelectChoice(choice.id)}
                className="flex min-h-[54px] w-full items-center gap-3 rounded border border-slate-600/85 bg-[#0B1220]/96 px-3.5 py-2 text-right transition-colors hover:border-amber-400/80 hover:bg-slate-800/95 focus-visible:outline-2 focus-visible:outline-white"
              >
                {proposer && (
                  <div
                    className="h-11 w-11 shrink-0 overflow-hidden rounded border bg-[#0F172A]"
                    style={{ borderColor: proposerAccent }}
                  >
                    <img
                      src={resolveStudentPortraitSrc(proposer)}
                      alt={choice.proposedByNameAr ?? proposer}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {proposer && choice.proposedByNameAr && (
                    <div className="font-ar mb-0.5 text-xs font-bold text-amber-300">
                      {choice.proposedByNameAr}
                    </div>
                  )}
                  <div className="font-ar text-sm font-semibold text-slate-100">
                    {choice.textAr}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Dialogue Panel */}
      <div
        onClick={handleBoxClick}
        role={choices.length === 0 ? 'button' : undefined}
        tabIndex={choices.length === 0 ? 0 : undefined}
        onKeyDown={(e) => {
          if (choices.length === 0 && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            e.stopPropagation();
            handleBoxClick();
          }
        }}
        className={`flex items-stretch gap-4 rounded border border-slate-700/80 bg-[#080E1A]/95 p-4 ${
          choices.length === 0 ? 'cursor-pointer' : ''
        }`}
      >
        {portraitSrc && (
          <div
            className="relative flex h-24 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded border bg-[#0F172A] sm:h-28 sm:w-28"
            style={{
              borderColor: accent,
              boxShadow: line.speaking ? `0 0 0 1px ${accent}55` : undefined,
            }}
          >
            {!imgFailed ? (
              <img
                src={portraitSrc}
                alt={line.speakerNameAr}
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <span className="font-ar text-lg font-bold text-slate-100">
                  {line.speakerNameAr}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-800 pb-1.5">
            <span className="font-ar text-base font-bold text-white">{line.speakerNameAr}</span>
            {choices.length === 0 && (
              <span className="font-ar text-[11px] text-sky-300/80">
                {isFullyTyped ? 'انقر أو مسافة للمتابعة ↵' : 'جاري العرض...'}
              </span>
            )}
          </div>

          <p className="font-ar text-base leading-relaxed text-slate-100 sm:text-[17px]">
            {typedAr}
            {!isFullyTyped && (
              <span className="mr-1 inline-block h-[1.05em] w-[7px] animate-pulse bg-sky-400 align-middle" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
