import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { gameEngine } from './game/GameEngine';
import { audioManager } from './systems/AudioManager';
import { dialogueSystem } from './systems/DialogueSystem';
import { EventBus } from './systems/EventBus';
import { evidenceSystem } from './systems/EvidenceSystem';
import { puzzleManager } from './systems/PuzzleManager';
import { saveManager } from './systems/SaveManager';
import { storyManager } from './systems/StoryManager';
import {
  AudioSettings,
  DialogueChoice,
  DialogueHistoryEntry,
  DialogueLine,
  EvidenceItem,
  GameScreenMode,
  TimerWarningLevel,
} from './types/game';
import { DialogueOverlay } from './ui/DialogueOverlay';
import { HudOverlay } from './ui/HudOverlay';
import { MainMenuOverlay } from './ui/MainMenuOverlay';
import { NotebookModal } from './ui/NotebookModal';
import { PauseSettingsModal } from './ui/PauseSettingsModal';
import { PuzzleModal } from './ui/PuzzleModal';

interface ToastMessage {
  id: number;
  titleAr: string;
  titleEn: string;
  tone: 'info' | 'evidence' | 'warning';
}

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [screenMode, setScreenMode] = useState<GameScreenMode>('MAIN_MENU');
  const [hasSave, setHasSave] = useState<boolean>(() => saveManager.hasSave());
  const [missingWarnings, setMissingWarnings] = useState<string[]>([]);

  const [timerState, setTimerState] = useState<{
    formatted: string;
    started: boolean;
    warningLevel: TimerWarningLevel;
  }>({
    formatted: '59:59',
    started: false,
    warningLevel: 'normal',
  });

  const [objective, setObjective] = useState({
    textAr: 'تفقّد الفصل',
    textEn: 'Investigate the classroom',
  });

  const [evidenceState, setEvidenceState] = useState<{
    evidence: EvidenceItem[];
    clues: EvidenceItem[];
    totalEvidence: number;
  }>({
    evidence: [],
    clues: [],
    totalEvidence: 5,
  });

  const [dialogueHistory, setDialogueHistory] = useState<DialogueHistoryEntry[]>([]);
  const [dialogueState, setDialogueState] = useState<{
    active: boolean;
    line: DialogueLine | null;
    choices: DialogueChoice[];
  }>({
    active: false,
    line: null,
    choices: [],
  });

  const [puzzleUnlocked, setPuzzleUnlocked] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const [interactionPrompt, setInteractionPrompt] = useState<{
    labelAr: string;
    labelEn: string;
  } | null>(null);

  const [notebookOpen, setNotebookOpen] = useState(false);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pause' | 'settings' | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    audioManager.getSettings()
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Mount isolated Phaser canvas once
  useEffect(() => {
    if (!containerRef.current) return;
    gameEngine.mount(containerRef.current);

    const unsubs = [
      EventBus.on<GameScreenMode>('screen:mode', (mode) => {
        setScreenMode(mode);
        setHasSave(saveManager.hasSave());
      }),
      EventBus.on<string[]>('warning:assets_missing', (keys) => {
        setMissingWarnings(keys);
      }),
      EventBus.on<{
        formatted: string;
        started: boolean;
        warningLevel: TimerWarningLevel;
      }>('timer:updated', (data) => {
        setTimerState({
          formatted: data.formatted,
          started: data.started,
          warningLevel: data.warningLevel,
        });
      }),
      EventBus.on<{ textAr: string; textEn: string }>('objective:updated', (obj) => {
        setObjective(obj);
      }),
      EventBus.on<{
        evidence: EvidenceItem[];
        clues: EvidenceItem[];
        totalEvidence: number;
      }>('evidence:updated', (ev) => {
        setEvidenceState(ev);
      }),
      EventBus.on('story:updated', () => {
        setPuzzleUnlocked(storyManager.getFlag('puzzle_01_unlocked') === true);
        setPuzzleSolved(storyManager.getFlag('puzzle_01_solved') === true);
      }),
      EventBus.on<DialogueHistoryEntry[]>('dialogue:history_updated', (hist) => {
        setDialogueHistory(hist);
      }),
      EventBus.on<{
        active: boolean;
        line: DialogueLine | null;
        choices: DialogueChoice[];
      }>('dialogue:state', (dlg) => {
        setDialogueState(dlg);
      }),
      EventBus.on<{ labelAr: string; labelEn: string } | null>(
        'interaction:prompt',
        (prompt) => {
          setInteractionPrompt(prompt);
        }
      ),
      EventBus.on<boolean>('puzzle:open', (open) => {
        setPuzzleOpen(open);
      }),
      EventBus.on<AudioSettings>('audio:updated', (s) => {
        setAudioSettings(s);
      }),
      EventBus.on<{ titleAr: string; titleEn: string; tone?: ToastMessage['tone'] }>(
        'toast:show',
        (t) => {
          const id = Date.now() + Math.random();
          setToasts((prev) => [
            ...prev.slice(-2),
            { id, titleAr: t.titleAr, titleEn: t.titleEn, tone: t.tone ?? 'info' },
          ]);
          window.setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
          }, 3600);
        }
      ),
    ];

    return () => {
      unsubs.forEach((u) => u());
      gameEngine.destroy();
    };
  }, []);

  // Pause gameplay timer when DOM modals open
  useEffect(() => {
    const anyModal = notebookOpen || modalMode !== null;
    EventBus.emit('game:modal_open', anyModal);
  }, [notebookOpen, modalMode]);

  // Global keyboard shortcuts (N for Notebook, Esc for Pause, Space/Enter for Dialogue)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (notebookOpen) {
          setNotebookOpen(false);
        } else if (puzzleOpen) {
          EventBus.emit('puzzle:close');
        } else if (modalMode) {
          setModalMode(null);
        } else if (screenMode === 'PLAYING') {
          setModalMode('pause');
        }
      } else if ((e.key === 'n' || e.key === 'N') && screenMode === 'PLAYING' && !puzzleOpen) {
        setNotebookOpen((prev) => !prev);
      } else if (
        (e.key === ' ' || e.key === 'Enter') &&
        screenMode === 'PLAYING' &&
        !notebookOpen &&
        !puzzleOpen &&
        !modalMode &&
        dialogueState.active &&
        dialogueState.choices.length === 0
      ) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag !== 'BUTTON' && tag !== 'INPUT') {
          e.preventDefault();
          EventBus.emit('dialogue:advance_or_reveal');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screenMode, notebookOpen, puzzleOpen, modalMode, dialogueState]);

  const puzzleConfig = puzzleManager.getConfig();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#080E1A]">
      {/* Isolated Phaser Canvas Mount */}
      <div ref={containerRef} className="h-full w-full" />

      {/* DOM Overlay Layer (Arabic RTL + Crisp Typography) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Visible Non-Fatal Missing Asset Warning Badge */}
        {missingWarnings.length > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-3 z-50 flex max-w-sm items-center gap-2 rounded border border-amber-500/60 bg-[#0B1220]/95 px-3 py-1.5 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="truncate font-sans-en">
              Pending artwork assets ({missingWarnings.length}) — fallback rendering active
            </span>
          </div>
        )}

        {/* Toast Stack */}
        <div dir="rtl" className="absolute top-16 left-1/2 z-40 flex -translate-x-1/2 flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded border px-4 py-2 text-center ${
                t.tone === 'evidence'
                  ? 'border-sky-500/70 bg-[#0B1220]/95 text-sky-100'
                  : t.tone === 'warning'
                    ? 'border-red-500/70 bg-red-950/95 text-red-100'
                    : 'border-slate-600 bg-[#0B1220]/95 text-slate-100'
              }`}
            >
              <div className="font-ar text-sm font-semibold">{t.titleAr}</div>
              <div className="font-sans-en text-[11px] text-slate-400">{t.titleEn}</div>
            </div>
          ))}
        </div>

        {/* Main Menu */}
        {screenMode === 'MAIN_MENU' && (
          <MainMenuOverlay
            hasSave={hasSave}
            audioSettings={audioSettings}
            onNewGame={() => gameEngine.startNewGame()}
            onContinue={() => gameEngine.continueGame()}
            onOpenSettings={() => setModalMode('settings')}
            onToggleMute={() => audioManager.toggleMute()}
          />
        )}

        {/* Chapter Title Card */}
        {screenMode === 'CHAPTER_TITLE' && (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black/35 px-6 text-center">
            <div className="font-display text-3xl tracking-[0.28em] text-slate-100 sm:text-5xl">
              THE LAST BELL
            </div>
            <div dir="rtl" className="font-ar mt-4 text-xl font-semibold text-red-400 sm:text-2xl">
              الفصل الأول — الفصل المغلق
            </div>
            <div className="font-sans-en mt-1 text-xs tracking-[0.2em] text-slate-400 uppercase">
              Chapter 01 — The Locked Classroom
            </div>
          </div>
        )}

        {/* Active Gameplay HUD */}
        {screenMode === 'PLAYING' && (
          <HudOverlay
            timerFormatted={timerState.formatted}
            timerStarted={timerState.started}
            warningLevel={timerState.warningLevel}
            objectiveAr={objective.textAr}
            objectiveEn={objective.textEn}
            evidenceCount={evidenceState.evidence.length}
            totalEvidence={evidenceState.totalEvidence || 5}
            puzzleUnlocked={puzzleUnlocked}
            puzzleSolved={puzzleSolved}
            interactionPrompt={dialogueState.active ? null : interactionPrompt}
            audioSettings={audioSettings}
            onOpenNotebook={() => setNotebookOpen(true)}
            onOpenPuzzle={() => gameEngine.openPuzzle()}
            onPause={() => setModalMode('pause')}
            onToggleMute={() => audioManager.toggleMute()}
          />
        )}

        {/* Dialogue Overlay */}
        {screenMode === 'PLAYING' && dialogueState.active && dialogueState.line && (
          <DialogueOverlay
            line={dialogueState.line}
            choices={dialogueState.choices}
            onAdvance={() => dialogueSystem.advance()}
            onSelectChoice={(choiceId) => dialogueSystem.selectChoice(choiceId)}
          />
        )}

        {/* Investigation Notebook Modal */}
        {notebookOpen && (
          <NotebookModal
            evidence={evidenceState.evidence}
            clues={evidenceState.clues}
            history={dialogueHistory}
            onClose={() => setNotebookOpen(false)}
          />
        )}

        {/* Puzzle 01 Workspace */}
        {puzzleOpen && puzzleConfig && (
          <PuzzleModal
            config={puzzleConfig}
            onClose={() => EventBus.emit('puzzle:close')}
            onSolved={() => EventBus.emit('puzzle:close')}
          />
        )}

        {/* Pause / Settings Modal */}
        {modalMode && (
          <PauseSettingsModal
            mode={modalMode}
            audioSettings={audioSettings}
            onUpdateAudio={(partial) => audioManager.updateSettings(partial)}
            onSaveGame={
              modalMode === 'pause'
                ? () => {
                    const ok = gameEngine.saveCurrentProgress();
                    setHasSave(ok);
                    EventBus.emit('toast:show', {
                      titleAr: ok ? 'تم حفظ التقدم بنجاح' : 'تعذر حفظ التقدم',
                      titleEn: ok ? 'Progress saved' : 'Failed to save progress',
                      tone: ok ? 'info' : 'warning',
                    });
                  }
                : undefined
            }
            onReturnToMenu={
              modalMode === 'pause'
                ? () => {
                    setModalMode(null);
                    setNotebookOpen(false);
                    gameEngine.returnToMainMenu();
                  }
                : undefined
            }
            onClose={() => setModalMode(null)}
          />
        )}

        {/* Chapter Ending Overlay */}
        {screenMode === 'ENDING' && (
          <div className="pointer-events-auto flex h-full w-full flex-col items-center justify-center bg-black/85 p-6 text-center">
            <div className="font-display text-2xl tracking-[0.22em] text-slate-200 sm:text-4xl">
              TO BE CONTINUED
            </div>
            <div dir="rtl" className="font-ar mt-4 text-xl font-bold text-red-400">
              يتبع — الفصل الثاني: الأرشيف المنسي
            </div>
            <div className="font-sans-en mt-1 text-xs tracking-[0.2em] text-slate-400 uppercase">
              Chapter 02: The Forgotten Archive
            </div>
            <button
              type="button"
              onClick={() => gameEngine.returnToMainMenu()}
              className="mt-8 min-h-[44px] rounded border border-slate-600 bg-slate-900 px-6 py-2 font-ar text-sm font-semibold text-slate-100 hover:bg-slate-800"
            >
              العودة إلى القائمة الرئيسية · Main Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
