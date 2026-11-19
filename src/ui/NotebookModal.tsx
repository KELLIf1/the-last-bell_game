import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DialogueHistoryEntry, EvidenceItem } from '../types/game';

interface NotebookModalProps {
  evidence: EvidenceItem[];
  clues: EvidenceItem[];
  history: DialogueHistoryEntry[];
  onClose: () => void;
}

type NotebookTab = 'evidence' | 'clues' | 'history';

export const NotebookModal: React.FC<NotebookModalProps> = ({
  evidence,
  clues,
  history,
  onClose,
}) => {
  const [tab, setTab] = useState<NotebookTab>('evidence');
  const [selectedId, setSelectedId] = useState<string | null>(
    evidence[0]?.id ?? clues[0]?.id ?? null
  );

  const activeList = tab === 'evidence' ? evidence : clues;
  const selectedItem =
    activeList.find((item) => item.id === selectedId) ?? activeList[0] ?? null;

  return (
    <div
      dir="rtl"
      className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="flex h-[min(86vh,620px)] w-full max-w-[960px] flex-col rounded border border-slate-700 bg-[#080E1A]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
          <div>
            <h2 className="font-ar text-lg font-bold text-slate-100">
              دفتر التحقيق · Investigation Notebook
            </h2>
            <p className="font-ar text-xs text-slate-400">
              الأدلة المجمعة ({evidence.length}) · الاستنتاجات ({clues.length}) · سجل الحوارات ({history.length})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            aria-label="Close Notebook"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 px-5 py-2.5">
          <button
            type="button"
            onClick={() => {
              setTab('evidence');
              setSelectedId(evidence[0]?.id ?? null);
            }}
            className={`min-h-[40px] rounded px-4 py-1.5 font-ar text-sm font-semibold transition-colors ${
              tab === 'evidence'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الأدلة المادية ({evidence.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('clues');
              setSelectedId(clues[0]?.id ?? null);
            }}
            className={`min-h-[40px] rounded px-4 py-1.5 font-ar text-sm font-semibold transition-colors ${
              tab === 'clues'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الاستنتاجات ({clues.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`min-h-[40px] rounded px-4 py-1.5 font-ar text-sm font-semibold transition-colors ${
              tab === 'history'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            سجل الحوارات ({history.length})
          </button>
        </div>

        {/* Body */}
        {tab === 'history' ? (
          <div className="tlb-scroll flex-1 space-y-3 overflow-y-auto p-5">
            {history.length === 0 ? (
              <p className="font-ar text-sm text-slate-400">لا توجد حوارات مسجلة بعد.</p>
            ) : (
              history.map((entry, i) => (
                <div key={`${entry.conversationId}-${i}`} className="border-b border-slate-800/80 pb-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-ar font-semibold text-slate-200">
                      {entry.speakerNameAr} · {entry.speakerNameEn}
                    </span>
                    <span className="font-mono-num">{entry.timestamp}</span>
                  </div>
                  <p className="font-ar mt-1 text-sm text-slate-100">{entry.textAr}</p>
                  <p dir="ltr" className="font-sans-en mt-0.5 text-left text-xs text-slate-400">
                    {entry.textEn}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
            {/* List Column */}
            <div className="tlb-scroll overflow-y-auto border-b border-slate-800 p-3 md:col-span-5 md:border-b-0 md:border-l">
              {activeList.length === 0 ? (
                <p className="p-3 font-ar text-sm text-slate-400">
                  لم يُجمع أي عنصر في هذا القسم بعد. تفقّد عناصر الفصل وتحدّث مع زملائك.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {activeList.map((item) => {
                    const active = selectedItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`flex min-h-[44px] w-full items-center gap-3 rounded border px-3.5 py-2.5 text-right transition-colors ${
                          active
                            ? 'border-slate-500 bg-slate-800 text-white'
                            : 'border-transparent bg-slate-900/50 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <img
                          src={`/assets/ui/icons/${item.icon}.svg`}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded border border-slate-700/70 bg-slate-950/80 p-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-ar truncate text-sm font-semibold">{item.nameAr}</div>
                          <div className="font-sans-en truncate text-xs text-slate-400">{item.nameEn}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail Column */}
            <div className="tlb-scroll overflow-y-auto p-5 md:col-span-7">
              {selectedItem ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={`/assets/ui/icons/${selectedItem.icon}.svg`}
                      alt={selectedItem.nameEn}
                      className="h-14 w-14 shrink-0 rounded border border-slate-700 bg-slate-950 p-1.5"
                    />
                    <div className="min-w-0">
                      <div className="font-ar text-xs text-slate-400">
                        {selectedItem.locationAr} · {selectedItem.locationEn}
                      </div>
                      <h3 className="font-ar mt-1 text-xl font-bold text-white">
                        {selectedItem.nameAr}
                      </h3>
                      <div className="font-sans-en text-sm text-slate-400">{selectedItem.nameEn}</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3">
                    <p className="font-ar text-sm leading-relaxed text-slate-100">
                      {selectedItem.descriptionAr}
                    </p>
                    <p dir="ltr" className="font-sans-en mt-2 text-left text-xs leading-relaxed text-slate-400">
                      {selectedItem.descriptionEn}
                    </p>
                  </div>

                  <div className="border-t border-slate-800 pt-3">
                    <div className="font-ar text-xs font-semibold text-amber-300">
                      الرابط التحقيقي
                    </div>
                    <p className="font-ar mt-1 text-sm text-slate-200">
                      {selectedItem.storyConnectionsAr}
                    </p>
                    <p dir="ltr" className="font-sans-en mt-1 text-left text-xs text-slate-400">
                      {selectedItem.storyConnectionsEn}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="font-ar text-sm text-slate-400">اختر عنصرًا لعرض تفاصيله.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
