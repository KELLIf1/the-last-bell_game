import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, FastForward, X } from 'lucide-react';
import type { GameEngine } from './game/GameEngine';
import { audioManager } from './systems/AudioManager';
import { dialogueSystem } from './systems/DialogueSystem';
import { EventBus } from './systems/EventBus';
import { evidenceSystem } from './systems/EvidenceSystem';
import { puzzleManager } from './systems/PuzzleManager';
import { saveManager } from './systems/SaveManager';
import { storyManager } from './systems/StoryManager';
import { uiSettings } from './systems/UiSettings';
import {
  AudioSettings,
  DialogueChoice,
  DialogueHistoryEntry,
  DialogueLine,
  EvidenceItem,
  GameScreenMode,
  TimerWarningLevel,
  UiSettings,
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

const SKIPPABLE_INTRO_SCENES = new Set([
  'academy_exterior',
  'academy_entrance',
  'classroom_day',
  'classroom_dark',
]);

let enginePromise: Promise<GameEngine> | null = null;
function loadGameEngine(): Promise<GameEngine> {
  if (!enginePromise) {
    enginePromise = import('./game/GameEngine').then((mod) => mod.gameEngine);
  }
  return enginePromise;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [screenMode, setScreenMode] = useState<GameScreenMode>('MAIN_MENU');
  const [currentSceneId, setCurrentSceneId] = useState<string>('main_menu');
  const [hasSave, setHasSave] = useState<boolean>(() => saveManager.hasSave());
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean>(() => uiSettings.hasSeenIntro());
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
  const [isTimeoutEnding, setIsTimeoutEnding] = useState(false);
  const [room0TeaserSeen, setRoom0TeaserSeen] = useState(false);
  const [controlsHintVisible, setControlsHintVisible] = useState(false);
  const [desk7CloseupOpen, setDesk7CloseupOpen] = useState(false);

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
  const [uiPrefs, setUiPrefs] = useState<UiSettings>(() => uiSettings.getSettings());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const withEngine = useCallback((action: (engine: GameEngine) => void) => {
    void loadGameEngine().then((engine) => {
      engineRef.current = engine;
      if (containerRef.current) {
        engine.mount(containerRef.current);
      }
      action(engine);
    });
  }, []);

  // Dynamically load & mount Phaser canvas right after initial Main Menu paint
  useEffect(() => {
    let disposed = false;
    const mountTimer = window.setTimeout(() => {
      void loadGameEngine().then((engine) => {
        if (disposed || !containerRef.current) return;
        engineRef.current = engine;
        engine.mount(containerRef.current);
      });
    }, 0);

    const unsubs = [
      EventBus.on<GameScreenMode>('screen:mode', (mode) => {
        setScreenMode(mode);
        setHasSave(saveManager.hasSave());
      }),
      EventBus.on<string>('scene:changed', (sceneId) => {
        setCurrentSceneId(sceneId);
      }),
      EventBus.on<boolean>('intro:seen_updated', (seen) => {
        setHasSeenIntro(seen);
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
        setIsTimeoutEnding(storyManager.getFlag('puzzle_01_failed_timeout') === true);
        setRoom0TeaserSeen(storyManager.getFlag('ch1_room0_teaser_seen') === true);
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
      EventBus.on<boolean>('controls_hint:show', (visible) => {
        setControlsHintVisible(visible);
      }),
      EventBus.on<boolean>('closeup:desk7', (open) => {
        setDesk7CloseupOpen(open);
      }),
      EventBus.on<AudioSettings>('audio:updated', (s) => {
        setAudioSettings(s);
      }),
      EventBus.on<UiSettings>('ui_settings:updated', (s) => {
        setUiPrefs(s);
      }),
      EventBus.on<{
        titleAr: string;
        titleEn: string;
        tone?: ToastMessage['tone'];
        durationMs?: number;
      }>('toast:show', (t) => {
        const id = Date.now() + Math.random();
        const duration = t.durationMs ?? 3600;
        setToasts((prev) => [
          ...prev.slice(-2),
          { id, titleAr: t.titleAr, titleEn: t.titleEn, tone: t.tone ?? 'info' },
        ]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }, duration);
      }),
    ];

    return () => {
      disposed = true;
      window.clearTimeout(mountTimer);
      unsubs.forEach((u) => u());
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  // Pause gameplay timer when DOM modals open
  useEffect(() => {
    const anyModal = notebookOpen || modalMode !== null;
    EventBus.emit('game:modal_open', anyModal);
  }, [notebookOpen, modalMode]);

  // Global keyboard shortcuts (N for Notebook, Esc for Pause/Dismiss, Space/Enter for Dialogue)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (desk7CloseupOpen) {
          return;
        } else if (notebookOpen) {
          setNotebookOpen(false);
        } else if (puzzleOpen) {
          EventBus.emit('puzzle:close');
        } else if (modalMode) {
          setModalMode(null);
        } else if (controlsHintVisible) {
          EventBus.emit('controls_hint:dismiss');
        } else if (screenMode === 'PLAYING') {
          setModalMode('pause');
        }
      } else if (
        (e.key === 'n' || e.key === 'N') &&
        screenMode === 'PLAYING' &&
        !puzzleOpen &&
        !desk7CloseupOpen
      ) {
        setNotebookOpen((prev) => !prev);
      } else if (
        (e.key === ' ' || e.key === 'Enter') &&
        screenMode === 'PLAYING' &&
        !notebookOpen &&
        !puzzleOpen &&
        !modalMode &&
        !desk7CloseupOpen &&
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
  }, [
    screenMode,
    notebookOpen,
    puzzleOpen,
    modalMode,
    dialogueState,
    controlsHintVisible,
    desk7CloseupOpen,
  ]);

  const puzzleConfig = puzzleManager.getConfig();
  const canSkipIntro =
    hasSeenIntro &&
    SKIPPABLE_INTRO_SCENES.has(currentSceneId) &&
    screenMode !== 'MAIN_MENU' &&
    !modalMode;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#080E1A]">
      {/* Isolated Phaser Canvas Mount */}
      <div ref={containerRef} className="h-full w-full" />

      {/* DOM Overlay Layer (Arabic RTL + Crisp Typography) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Visible Non-Fatal Missing Asset Warning Badge */}
        {missingWarnings.length > 0 && (
          <div
            dir="rtl"
            className="pointer-events-auto absolute bottom-3 left-3 z-50 flex max-w-sm items-center gap-2 rounded border border-amber-500/60 bg-[#0B1220]/95 px-3 py-1.5 text-xs text-amber-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="truncate font-ar">
              أصول بصرية قيد الاستكمال ({missingWarnings.length}) — العرض البديل نشط
            </span>
          </div>
        )}

        {/* Toast Stack */}
        <div
          dir="rtl"
          className="absolute top-20 left-1/2 z-40 flex -translate-x-1/2 flex-col gap-2 sm:top-16"
        >
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
              {uiPrefs.showEnglish && (
                <div className="font-sans-en text-[11px] text-slate-400">{t.titleEn}</div>
              )}
            </div>
          ))}
        </div>

        {/* Skip Intro Button (visible if player previously saw the intro) */}
        {canSkipIntro && (
          <div dir="rtl" className="pointer-events-auto absolute top-16 left-4 z-30">
            <button
              type="button"
              onClick={() => EventBus.emit('intro:skip_requested')}
              className="inline-flex min-h-[40px] items-center gap-2 rounded border border-slate-600/80 bg-[#0B1220]/92 px-3.5 py-1.5 font-ar text-xs font-semibold text-slate-100 transition-colors hover:border-amber-500/70 hover:bg-slate-800"
            >
              <FastForward className="h-3.5 w-3.5 text-amber-300" />
              <span>تخطّي المقدمة</span>
            </button>
          </div>
        )}

        {/* Main Menu */}
        {screenMode === 'MAIN_MENU' && (
          <MainMenuOverlay
            hasSave={hasSave}
            audioSettings={audioSettings}
            showEnglish={uiPrefs.showEnglish}
            onNewGame={() => {
              withEngine((engine) => {
                engine.startNewGame();
                setHasSave(saveManager.hasSave());
              });
            }}
            onContinue={() => {
              withEngine((engine) => {
                engine.continueGame();
              });
            }}
            onOpenSettings={() => setModalMode('settings')}
            onToggleMute={() => audioManager.toggleMute()}
            onToggleEnglish={(show) => uiSettings.updateSettings({ showEnglish: show })}
          />
        )}

        {/* Chapter Title Card */}
        {screenMode === 'CHAPTER_TITLE' && (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black/35 px-6 text-center">
            <div dir="rtl" className="font-ar text-3xl font-bold text-slate-100 sm:text-5xl">
              آخر جرس
            </div>
            <div dir="rtl" className="font-ar mt-4 text-xl font-semibold text-red-400 sm:text-2xl">
              الفصل الأول — الفصل المغلق
            </div>
            {uiPrefs.showEnglish && (
              <>
                <div className="font-display mt-3 text-lg tracking-[0.26em] text-slate-300">
                  THE LAST BELL
                </div>
                <div className="font-sans-en mt-1 text-xs tracking-[0.2em] text-slate-400 uppercase">
                  Chapter 01 — The Locked Classroom
                </div>
              </>
            )}
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
            showEnglish={uiPrefs.showEnglish}
            evidenceCount={evidenceState.evidence.length}
            totalEvidence={evidenceState.totalEvidence || 5}
            puzzleUnlocked={puzzleUnlocked}
            puzzleSolved={puzzleSolved}
            interactionPrompt={dialogueState.active ? null : interactionPrompt}
            audioSettings={audioSettings}
            onOpenNotebook={() => setNotebookOpen(true)}
            onOpenPuzzle={() => withEngine((engine) => engine.openPuzzle())}
            onPause={() => setModalMode('pause')}
            onToggleMute={() => audioManager.toggleMute()}
          />
        )}

        {/* First-Time Classroom Controls Onboarding Panel */}
        {screenMode === 'PLAYING' &&
          controlsHintVisible &&
          !desk7CloseupOpen &&
          !puzzleOpen &&
          !notebookOpen &&
          !modalMode && (
            <div
              dir="rtl"
              className="pointer-events-auto absolute right-4 bottom-16 z-20 flex max-w-md items-center gap-3 rounded border border-amber-500/60 bg-[#0B1220]/95 px-4 py-2.5 shadow-xl"
            >
              <span className="font-ar text-xs leading-relaxed font-medium text-slate-100">
                تحرّك بـ WASD أو بالنقر • تفاعل بـ E أو بالنقر • الدفتر بـ N • الإيقاف المؤقت Esc
              </span>
              <button
                type="button"
                onClick={() => EventBus.emit('controls_hint:dismiss')}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                aria-label="إغلاق إرشاد التحكم"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        {/* Desk 7 Closeup DOM Caption & Close Control (replaces Phaser Canvas Arabic text) */}
        {desk7CloseupOpen && (
          <div
            dir="rtl"
            className="pointer-events-auto absolute bottom-5 left-1/2 z-[35] flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 items-center justify-between gap-4 rounded border border-amber-500/60 bg-[#080E1A]/95 px-4 py-2.5 shadow-2xl"
          >
            <span className="font-ar text-sm font-semibold text-slate-100">
              المقعد السابع الفارغ — دفتر إيلينا القديم والصورة المقصوصة
            </span>
            <button
              type="button"
              onClick={() => EventBus.emit('closeup:desk7_close')}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded border border-slate-600 bg-slate-800 px-3 py-1 font-ar text-xs font-semibold text-slate-100 hover:bg-slate-700"
            >
              <span>إغلاق</span>
              <span className="font-mono-num text-[11px] text-slate-300">[E / Esc]</span>
            </button>
          </div>
        )}

        {/* Dialogue Overlay */}
        {screenMode === 'PLAYING' && dialogueState.active && dialogueState.line && (
          <DialogueOverlay
            line={dialogueState.line}
            choices={dialogueState.choices}
            showEnglish={uiPrefs.showEnglish}
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
            showEnglish={uiPrefs.showEnglish}
            onClose={() => setNotebookOpen(false)}
          />
        )}

        {/* Puzzle 01 Workspace */}
        {puzzleOpen && puzzleConfig && (
          <PuzzleModal
            config={puzzleConfig}
            showEnglish={uiPrefs.showEnglish}
            onClose={() => EventBus.emit('puzzle:close')}
            onSolved={() => EventBus.emit('puzzle:close')}
          />
        )}

        {/* Pause / Settings Modal */}
        {modalMode && (
          <PauseSettingsModal
            mode={modalMode}
            audioSettings={audioSettings}
            showEnglish={uiPrefs.showEnglish}
            onUpdateAudio={(partial) => audioManager.updateSettings(partial)}
            onToggleEnglish={(show) => uiSettings.updateSettings({ showEnglish: show })}
            onSaveGame={
              modalMode === 'pause'
                ? () => {
                    const ok = engineRef.current?.saveCurrentProgress() ?? false;
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
                    withEngine((engine) => engine.returnToMainMenu());
                  }
                : undefined
            }
            onClose={() => setModalMode(null)}
          />
        )}

        {/* Chapter Ending Overlay */}
        {screenMode === 'ENDING' && (
          <div
            dir="rtl"
            className="pointer-events-auto flex h-full w-full flex-col items-center justify-center bg-[#04070D]/92 p-6 text-center"
          >
            <div className="w-full max-w-xl rounded-lg border border-slate-700/80 bg-[#0B1220]/95 p-6 shadow-2xl sm:p-8">
              <div
                className={`mx-auto inline-block rounded border px-3 py-1 font-ar text-xs font-semibold ${
                  isTimeoutEnding
                    ? 'border-red-500/60 bg-red-950/60 text-red-300'
                    : 'border-amber-500/60 bg-amber-950/50 text-amber-200'
                }`}
              >
                {isTimeoutEnding
                  ? 'نهاية انتهاء الوقت — استدعاء مبكر'
                  : 'نهاية الفصل الأول — المسار المكتمل'}
              </div>

              {uiPrefs.showEnglish && (
                <div className="font-display mt-4 text-2xl tracking-[0.22em] text-slate-100 sm:text-3xl">
                  TO BE CONTINUED
                </div>
              )}
              <div className="font-ar mt-3 text-xl font-bold text-red-400">
                يتبع — الفصل الثاني: الأرشيف المنسي
              </div>
              {uiPrefs.showEnglish && (
                <div className="font-sans-en mt-1 text-xs tracking-[0.2em] text-slate-400 uppercase">
                  Chapter 02: The Forgotten Archive
                </div>
              )}

              <p className="font-ar mt-4 text-sm leading-relaxed text-slate-300">
                {isTimeoutEnding
                  ? 'انقضى العدّ التنازلي قبل إتمام كل الاستجوابات؛ استُدعي كريم مبكراً وغادر الفصل تاركاً أسئلة معلّقة.'
                  : 'تم حلّ لغز المقاعد السبعة ومحاورة جميع الطلاب الحاضرين قبل استدعاء كريم الأول.'}
              </p>

              {room0TeaserSeen && !isTimeoutEnding && (
                <div className="font-ar mt-3 rounded border border-red-900/60 bg-[#060A13] px-3 py-2 text-xs text-red-300">
                  الغرفة 0 — مشروع الصدى — تم رفض الوصول إلى الأرشيف.
                  {uiPrefs.showEnglish && (
                    <div dir="ltr" className="font-mono-num mt-0.5 text-[11px] opacity-80">
                      ROOM 0 — PROJECT ECHO — ARCHIVE ACCESS DENIED.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded border border-slate-700/80 bg-[#080E1A] px-3 py-3">
                  <div className="font-ar text-[11px] text-slate-400">الوقت المتبقي</div>
                  <div className="font-mono-num mt-1 text-lg font-bold text-slate-100">
                    {timerState.formatted}
                  </div>
                </div>
                <div className="rounded border border-slate-700/80 bg-[#080E1A] px-3 py-3">
                  <div className="font-ar text-[11px] text-slate-400">الأدلة المجمّعة</div>
                  <div className="font-mono-num mt-1 text-lg font-bold text-sky-300">
                    {evidenceState.evidence.length}/{evidenceState.totalEvidence || 5}
                  </div>
                </div>
                <div className="rounded border border-slate-700/80 bg-[#080E1A] px-3 py-3">
                  <div className="font-ar text-[11px] text-slate-400">الخيوط</div>
                  <div className="font-mono-num mt-1 text-lg font-bold text-amber-300">
                    {evidenceState.clues.length}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => withEngine((engine) => engine.startNewGame())}
                  className="min-h-[44px] rounded border border-amber-500/70 bg-amber-950/70 px-6 py-2 font-ar text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-900/80"
                >
                  {uiPrefs.showEnglish ? 'إعادة الفصل · Replay Chapter' : 'إعادة الفصل'}
                </button>
                <button
                  type="button"
                  onClick={() => withEngine((engine) => engine.returnToMainMenu())}
                  className="min-h-[44px] rounded border border-slate-600 bg-slate-900 px-6 py-2 font-ar text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800"
                >
                  {uiPrefs.showEnglish ? 'العودة إلى القائمة الرئيسية · Main Menu' : 'العودة إلى القائمة الرئيسية'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
