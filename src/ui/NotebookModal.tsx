import React, { useState } from 'react';
import { X } from 'lucide-react';
import { taskDataLoader } from '../systems/TaskDataLoader';
import {
  DialogueHistoryEntry,
  EvidenceItem,
  FoundObjectRecord,
  TaskDecisionRecord,
} from '../types/game';

interface NotebookModalProps {
  history: DialogueHistoryEntry[];
  foundObjects: FoundObjectRecord[];
  evidence: EvidenceItem[];
  cluesFound: string[];
  decisions: TaskDecisionRecord[];
  onClose: () => void;
}

type NotebookTab = 'heard' | 'found' | 'decisions';

export const NotebookModal: React.FC<NotebookModalProps> = ({
  history,
  foundObjects,
  evidence,
  cluesFound,
  decisions,
  onClose,
}) => {
  const [tab, setTab] = useState<NotebookTab>('heard');

  const resolvedFragments = cluesFound
    .map((id) => taskDataLoader.getClueFragmentById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  // Merge clicked room objects and raw collected evidence items without adding interpretation
  const objectEntries: Array<{ id: string; titleAr: string; rawTextAr: string; timestamp?: string }> = [];
  const seenObjectIds = new Set<string>();

  for (const obj of foundObjects) {
    seenObjectIds.add(obj.objectId);
    if (obj.evidenceId) {
      seenObjectIds.add(obj.evidenceId);
    }
    objectEntries.push({
      id: obj.objectId,
      titleAr: obj.titleAr,
      rawTextAr: obj.rawTextAr,
      timestamp: obj.timestamp,
    });
  }
  for (const ev of evidence) {
    if (!seenObjectIds.has(ev.id)) {
      seenObjectIds.add(ev.id);
      objectEntries.push({
        id: ev.id,
        titleAr: ev.nameAr,
        rawTextAr: ev.descriptionAr,
      });
    }
  }

  const TOTAL_TASKS = 5;
  const foundCount = resolvedFragments.length;

  return (
    <div
      dir="rtl"
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="flex h-[min(86vh,620px)] w-full max-w-[960px] flex-col rounded border border-slate-700 bg-[#080E1A]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div>
            <h2 className="font-ar text-lg font-bold text-slate-100">سجل الملاحظات</h2>
            <p className="font-ar text-xs text-slate-400">
              ما سمعته ({history.length}) · ما وجدته ({foundCount}/{TOTAL_TASKS}) · قراراتي ({decisions.length})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            aria-label="إغلاق الدفتر"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Three Pure Arabic Tabs */}
        <div className="flex gap-2 border-b border-slate-800 px-5 py-2.5">
          <button
            type="button"
            onClick={() => setTab('heard')}
            className={`min-h-[40px] rounded px-4 py-1.5 font-ar text-sm font-semibold transition-colors ${
              tab === 'heard'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ما سمعته ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('found')}
            className={`min-h-[40px] rounded px-4 py-1.5 font-ar text-sm font-semibold transition-colors ${
              tab === 'found'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ما وجدته ({foundCount}/{TOTAL_TASKS})
          </button>
          <button
            type="button"
            onClick={() => setTab('decisions')}
            className={`min-h-[40px] rounded px-4 py-1.5 font-ar text-sm font-semibold transition-colors ${
              tab === 'decisions'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            قراراتي ({decisions.length})
          </button>
        </div>

        {/* Body */}
        <div className="tlb-scroll flex-1 space-y-3 overflow-y-auto p-5">
          {tab === 'heard' && (
            <>
              {history.length === 0 ? (
                <p className="font-ar text-sm text-slate-400">لم تُسجّل أقوال بعد.</p>
              ) : (
                history.map((entry, i) => (
                  <div
                    key={`${entry.conversationId}-${i}`}
                    className="rounded border border-slate-800/80 bg-[#0B1220]/70 p-3.5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-ar font-bold text-slate-200">
                        {entry.speakerNameAr}
                      </span>
                      <span className="font-mono-num">{entry.timestamp}</span>
                    </div>
                    <p className="font-ar mt-1.5 text-sm leading-relaxed text-slate-100">
                      {entry.textAr}
                    </p>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'found' && (
            <>
              {resolvedFragments.length === 0 && objectEntries.length === 0 ? (
                <p className="font-ar text-sm text-slate-400">
                  لم يُسجّل أي عنصر أو نص بعد.
                </p>
              ) : (
                <div className="space-y-3">
                  {resolvedFragments.map((frag) => (
                    <div
                      key={frag.id}
                      className="rounded border border-slate-700/80 bg-[#0B1220]/80 p-3.5"
                    >
                      {frag.titleAr && (
                        <div className="font-ar text-xs font-bold text-slate-300">
                          {frag.titleAr}
                        </div>
                      )}
                      <p className="font-ar mt-1 text-sm leading-relaxed text-slate-100">
                        {frag.textAr}
                      </p>
                    </div>
                  ))}
                  {objectEntries.map((obj) => (
                    <div
                      key={obj.id}
                      className="rounded border border-slate-800/80 bg-[#0B1220]/60 p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-ar text-xs font-bold text-slate-300">
                          {obj.titleAr}
                        </div>
                        {obj.timestamp && (
                          <span className="font-mono-num text-[11px] text-slate-500">
                            {obj.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="font-ar mt-1 text-sm leading-relaxed text-slate-100">
                        {obj.rawTextAr}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'decisions' && (
            <>
              {decisions.length === 0 ? (
                <p className="font-ar text-sm text-slate-400">لم يُتخذ أي قرار بعد.</p>
              ) : (
                decisions.map((dec, i) => (
                  <div
                    key={`${dec.taskId}-${dec.choiceId}-${i}`}
                    className="flex items-start gap-3 rounded border border-slate-800/90 bg-[#0B1220]/80 p-3.5"
                  >
                    <img
                      src={`/assets/characters/portraits/${dec.proposedBy}/neutral.webp`}
                      alt={dec.proposedByNameAr}
                      className="h-11 w-11 shrink-0 rounded border border-slate-700 object-cover object-top"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span className="font-ar font-bold text-amber-300">
                          {dec.proposedByNameAr}
                          {dec.taskTitleAr ? ` · ${dec.taskTitleAr}` : ''}
                        </span>
                        <span className="font-mono-num">{dec.timestamp}</span>
                      </div>
                      <p className="font-ar mt-1.5 text-sm leading-relaxed text-slate-100">
                        {dec.choiceTextAr}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
