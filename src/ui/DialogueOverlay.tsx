import React, { useCallback, useEffect, useRef, useState } from 'react';
import { audioManager } from '../systems/AudioManager';
import { EventBus } from '../systems/EventBus';
import { CharacterId, DialogueChoice, DialogueLine } from '../types/game';

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
    return '/assets/characters/portraits/elena/archival.png';
  }
  if (line.speaker === 'adam') {
    const state = line.expression === 'angry' || line.expression === 'worried' ? 'intense' : 'neutral';
    return `/assets/characters/portraits/adam/${state}.png`;
  }
  const expr = line.expression ?? 'neutral';
  const fileState = line.speaking && expr === 'neutral' ? 'speaking' : expr;
  return `/assets/characters/portraits/${line.speaker}/${fileState}.png`;
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
  const [typedEn, setTypedEn] = useState('');
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
    setTypedEn('');

    const textAr = line.textAr ?? '';
    const textEn = line.textEn ?? '';
    if (textAr.length === 0 && textEn.length === 0) {
      setIsFullyTyped(true);
      return;
    }

    setIsFullyTyped(false);
    let idxAr = 0;
    let enProgress = 0;
    const enStep = textAr.length > 0 ? Math.max(1, textEn.length / textAr.length) : 1.5;

    timerRef.current = window.setInterval(() => {
      if (idxAr < textAr.length) {
        idxAr += 1;
        setTypedAr(textAr.slice(0, idxAr));
        const ch = textAr[idxAr - 1];
        if (ch && ch !== ' ' && idxAr % 3 === 1) {
          audioManager.playKeyTick();
        }
      }

      if (enProgress < textEn.length) {
        enProgress = Math.min(textEn.length, enProgress + enStep);
        setTypedEn(textEn.slice(0, Math.floor(enProgress)));
      }

      if (idxAr >= textAr.length && enProgress >= textEn.length) {
        setTypedAr(textAr);
        setTypedEn(textEn);
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
      setTypedEn(line.textEn ?? '');
      setIsFullyTyped(true);
      return;
    }
    onAdvance();
  }, [choices.length, isFullyTyped, line.textAr, line.textEn, onAdvance, stopTypingTimer]);

  // Ensure global Space/Enter in App finishes typewriter first before advancing
  useEffect(() => {
    return EventBus.on('dialogue:advance_or_reveal', () => {
      handleBoxClick();
    });
  }, [handleBoxClick]);

  return (
    <div dir="rtl" className="pointer-events-auto absolute inset-x-0 bottom-4 mx-auto w-[calc(100%-2rem)] max-w-[960px]">
      {/* Choices list above dialogue box if present */}
      {choices.length > 0 && (
        <div className="mb-2.5 flex flex-col gap-2">
          {choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => onSelectChoice(choice.id)}
              className="min-h-[44px] w-full rounded border border-slate-600/80 bg-[#0B1220]/96 px-4 py-2.5 text-right transition-colors hover:border-slate-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-white"
            >
              <div className="font-ar text-sm font-semibold text-slate-100">{choice.textAr}</div>
              <div dir="ltr" className="font-sans-en mt-0.5 text-left text-xs text-slate-400">
                {choice.textEn}
              </div>
            </button>
          ))}
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
                alt={line.speakerNameEn}
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-2 text-center">
                <span className="font-ar text-lg font-bold text-slate-100">{line.speakerNameAr}</span>
                <span className="font-sans-en mt-1 text-[11px] text-slate-400">
                  {line.expression ?? 'neutral'}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-800 pb-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-ar text-base font-bold text-white">{line.speakerNameAr}</span>
              <span className="text-slate-600">·</span>
              <span className="font-sans-en text-xs text-slate-400">{line.speakerNameEn}</span>
            </div>
            {choices.length === 0 && (
              <span className="font-mono-num text-[11px] text-sky-300/80">
                {isFullyTyped ? 'انقر أو Space للمتابعة ↵' : 'KEYBOARD INPUT...'}
              </span>
            )}
          </div>

          <p className="font-ar text-base leading-relaxed text-slate-100 sm:text-[17px]">
            {typedAr}
            {!isFullyTyped && (
              <span className="mr-1 inline-block h-[1.05em] w-[7px] animate-pulse bg-sky-400 align-middle" />
            )}
          </p>
          <p dir="ltr" className="font-sans-en text-left text-xs leading-snug text-slate-400">
            {typedEn}
            {!isFullyTyped && (
              <span className="ml-1 inline-block h-[1em] w-[5px] animate-pulse bg-slate-400 align-middle" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
