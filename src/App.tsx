import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, FastForward, X } from 'lucide-react';
import type { GameEngine } from './game/GameEngine';
import { audioManager } from './systems/AudioManager';
import { dialogueSystem } from './systems/DialogueSystem';
import { EventBus } from './systems/EventBus';
import { puzzleManager } from './systems/PuzzleManager';
import { saveManager } from './systems/SaveManager';
import { storyManager } from './systems/StoryManager';
import { taskDataLoader } from './systems/TaskDataLoader';
import { taskEngine } from './systems/TaskEngine';
import { uiSettings } from './systems/UiSettings';
import {
  AudioSettings,
  DialogueChoice,
  DialogueHistoryEntry,
  DialogueLine,
  EndingDefinition,
  EvidenceItem,
  GameScreenMode,
  StoryState,
  TaskChoice,
  TaskDefinition,
  TaskExecutionType,
  TimerWarningLevel,
} from './types/game';
import { DialogueOverlay } from './ui/DialogueOverlay';
import { DoorChoiceModal } from './ui/DoorChoiceModal';
import { EndingResponsibilityOverlay } from './ui/EndingResponsibilityOverlay';
import { HudOverlay } from './ui/HudOverlay';
import { MainMenuOverlay } from './ui/MainMenuOverlay';
import { NotebookModal } from './ui/NotebookModal';
import { PauseSettingsModal } from './ui/PauseSettingsModal';
import { PhotoInspectionModal } from './ui/PhotoInspectionModal';
import { PuzzleModal } from './ui/PuzzleModal';
import { RegisterInspectionModal } from './ui/RegisterInspectionModal';

interface ToastMessage {
  id: number;
  titleAr: string;
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

  const [objectiveAr, setObjectiveAr] = useState('تفقّد الفصل');
  const [storyState, setStoryState] = useState<StoryState>(() => storyManager.getState());

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

  // Batch 2 Penalty Visual States
  const [timeLossFlashSec, setTimeLossFlashSec] = useState<number | null>(null);
  const [lightsOutActive, setLightsOutActive] = useState(false);
  const [doorDelayRemainingSec, setDoorDelayRemainingSec] = useState(0);
  const [cameraCutActive, setCameraCutActive] = useState(false);
  const [exposedSecretNameAr, setExposedSecretNameAr] = useState<string | null>(null);

  const [puzzleUnlocked, setPuzzleUnlocked] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [controlsHintVisible, setControlsHintVisible] = useState(false);
  const [desk7CloseupOpen, setDesk7CloseupOpen] = useState(false);

  const [interactionPrompt, setInteractionPrompt] = useState<{
    labelAr: string;
  } | null>(null);

  const [notebookOpen, setNotebookOpen] = useState(false);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [doorChoiceOpen, setDoorChoiceOpen] = useState(false);
  const [resolvedEnding, setResolvedEnding] = useState<EndingDefinition | null>(null);
  const [activeExecution, setActiveExecution] = useState<{
    taskId: string;
    executionType: TaskExecutionType;
    config?: TaskDefinition['executionConfig'];
    choices?: TaskChoice[];
  } | null>(null);
  const [modalMode, setModalMode] = useState<'pause' | 'settings' | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    audioManager.getSettings()
  );
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

  useEffect(() => {
    let disposed = false;
    let timeLossTimer: number | null = null;
    let secretTimer: number | null = null;

    // Expose internal test/inspection reference cleanly without affecting UI
    (window as unknown as Record<string, unknown>).__TLB__ = {
      storyManager,
      taskEngine,
      saveManager,
      taskDataLoader,
      dialogueSystem,
    };

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
        if (mode === 'MAIN_MENU' || mode === 'CHAPTER_TITLE') {
          setResolvedEnding(null);
          setActiveExecution(null);
          setRegisterOpen(false);
          setPhotoOpen(false);
          setDoorChoiceOpen(false);
          setNotebookOpen(false);
          setModalMode(null);
        }
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
      EventBus.on<{ seconds: number }>('timer:penalized', (p) => {
        if (timeLossTimer) window.clearTimeout(timeLossTimer);
        setTimeLossFlashSec(p.seconds);
        timeLossTimer = window.setTimeout(() => {
          setTimeLossFlashSec(null);
        }, 3200);
      }),
      EventBus.on('penalty:lights_out', () => {
        setLightsOutActive(true);
      }),
      EventBus.on('penalty:lights_out_cleared', () => {
        setLightsOutActive(false);
      }),
      EventBus.on<{ seconds: number }>('penalty:door_delay', (p) => {
        setDoorDelayRemainingSec(p.seconds);
      }),
      EventBus.on<{ remainingSec: number }>('penalty:door_delay_tick', (p) => {
        setDoorDelayRemainingSec(p.remainingSec);
      }),
      EventBus.on('penalty:door_delay_cleared', () => {
        setDoorDelayRemainingSec(0);
      }),
      EventBus.on('penalty:camera_cut', () => {
        setCameraCutActive(true);
      }),
      EventBus.on('penalty:camera_cut_cleared', () => {
        setCameraCutActive(false);
      }),
      EventBus.on<{ studentNameAr: string }>('penalty:expose_secret', (p) => {
        if (secretTimer) window.clearTimeout(secretTimer);
        setExposedSecretNameAr(p.studentNameAr);
        secretTimer = window.setTimeout(() => {
          setExposedSecretNameAr(null);
        }, 5500);
      }),
      EventBus.on('penalty:cleared_all', () => {
        setLightsOutActive(false);
        setDoorDelayRemainingSec(0);
        setCameraCutActive(false);
        setTimeLossFlashSec(null);
        setExposedSecretNameAr(null);
      }),
      EventBus.on<{ textAr: string }>('objective:updated', (obj) => {
        setObjectiveAr(obj.textAr);
      }),
      EventBus.on<{
        evidence: EvidenceItem[];
        clues: EvidenceItem[];
        totalEvidence: number;
      }>('evidence:updated', (ev) => {
        setEvidenceState(ev);
      }),
      EventBus.on<StoryState>('story:updated', (snapshot) => {
        const nextState = snapshot ?? storyManager.getState();
        setStoryState(nextState);
        setPuzzleUnlocked(nextState.flags.puzzle_01_unlocked === true);
        setPuzzleSolved(nextState.flags.puzzle_01_solved === true);
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
      EventBus.on<{ labelAr: string } | null>('interaction:prompt', (prompt) => {
        setInteractionPrompt(prompt ? { labelAr: prompt.labelAr } : null);
      }),
      EventBus.on<boolean>('puzzle:open', (open) => {
        setPuzzleOpen(open);
      }),
      EventBus.on<{
        taskId: string;
        executionType: TaskExecutionType;
        config?: TaskDefinition['executionConfig'];
        choices?: TaskChoice[];
      }>('task:execution_requested', (payload) => {
        setActiveExecution(payload);
        if (payload.executionType === 'seating_puzzle') {
          withEngine((engine) => engine.openPuzzle());
        } else if (payload.executionType === 'register_inspection') {
          setRegisterOpen(true);
        } else if (payload.executionType === 'photo_inspection') {
          setPhotoOpen(true);
        } else if (payload.executionType === 'door_choice') {
          setDoorChoiceOpen(true);
        }
      }),
      EventBus.on('task:execution_cleared', () => {
        setActiveExecution(null);
        setRegisterOpen(false);
        setPhotoOpen(false);
        setDoorChoiceOpen(false);
      }),
      EventBus.on<EndingDefinition | null>('ending:loaded', (ending) => {
        setResolvedEnding(ending);
      }),
      EventBus.on('game:force_close_modals', () => {
        setNotebookOpen(false);
        setRegisterOpen(false);
        setPhotoOpen(false);
        setDoorChoiceOpen(false);
        setModalMode(null);
        setActiveExecution(null);
        EventBus.emit('puzzle:close');
        EventBus.emit('closeup:desk7_close');
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
      EventBus.on<{
        titleAr: string;
        tone?: ToastMessage['tone'];
        durationMs?: number;
      }>('toast:show', (t) => {
        const id = Date.now() + Math.random();
        const duration = t.durationMs ?? 3600;
        setToasts((prev) => [
          ...prev.slice(-2),
          { id, titleAr: t.titleAr, tone: t.tone ?? 'info' },
        ]);
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id));
        }, duration);
      }),
    ];

    return () => {
      disposed = true;
      window.clearTimeout(mountTimer);
      if (timeLossTimer) window.clearTimeout(timeLossTimer);
      if (secretTimer) window.clearTimeout(secretTimer);
      unsubs.forEach((u) => u());
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const anyModal = notebookOpen || modalMode !== null;
    EventBus.emit('game:modal_open', anyModal);
  }, [notebookOpen, modalMode]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (desk7CloseupOpen) {
          return;
        } else if (notebookOpen) {
          setNotebookOpen(false);
        } else if (puzzleOpen) {
          EventBus.emit('puzzle:close');
        } else if (registerOpen) {
          setRegisterOpen(false);
        } else if (photoOpen) {
          setPhotoOpen(false);
        } else if (doorChoiceOpen) {
          setDoorChoiceOpen(false);
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
        !registerOpen &&
        !photoOpen &&
        !doorChoiceOpen &&
        !desk7CloseupOpen
      ) {
        setNotebookOpen((prev) => !prev);
      } else if (
        (e.key === ' ' || e.key === 'Enter') &&
        screenMode === 'PLAYING' &&
        !notebookOpen &&
        !puzzleOpen &&
        !registerOpen &&
        !photoOpen &&
        !doorChoiceOpen &&
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
    registerOpen,
    photoOpen,
    doorChoiceOpen,
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

  const activeEnding =
    resolvedEnding ??
    (taskDataLoader.isLoaded()
      ? (taskDataLoader.getEndingById(storyState.endingId) ??
        taskDataLoader.resolveEnding(storyState, (c) => storyManager.evaluateCondition(c)))
      : null);

  const canResumeExecution =
    !puzzleOpen &&
    !registerOpen &&
    !photoOpen &&
    !doorChoiceOpen &&
    Boolean(activeExecution) &&
    (storyState.taskPhase === 'execution' ||
      (storyState.taskPhase === 'choice' && activeExecution?.executionType === 'door_choice'));

  const pendingExecutionLabelAr = canResumeExecution
    ? activeExecution?.executionType === 'seating_puzzle'
      ? 'استكمال ترتيب المقاعد'
      : activeExecution?.executionType === 'register_inspection'
        ? 'استكمال فحص سجل الحضور'
        : activeExecution?.executionType === 'photo_inspection'
          ? 'استكمال فحص الصورة'
          : activeExecution?.executionType === 'door_choice'
            ? 'اتخاذ القرار عند الباب'
            : null
    : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#080E1A]">
      {/* Isolated Phaser Canvas Mount */}
      <div ref={containerRef} className="h-full w-full" />

      {/* DOM Overlay Layer (Arabic RTL Only) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Missing Asset Warning */}
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
          className="absolute top-20 left-1/2 z-20 flex -translate-x-1/2 flex-col gap-2 sm:top-16"
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
            </div>
          ))}
        </div>

        {/* Skip Intro Button */}
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
          </div>
        )}

        {/* Active Gameplay HUD */}
        {screenMode === 'PLAYING' && (
          <HudOverlay
            timerFormatted={timerState.formatted}
            timerStarted={timerState.started}
            warningLevel={timerState.warningLevel}
            timeLossFlashSec={timeLossFlashSec}
            lightsOutActive={lightsOutActive}
            doorDelayRemainingSec={doorDelayRemainingSec}
            cameraCutActive={cameraCutActive}
            exposedSecretNameAr={exposedSecretNameAr}
            objectiveAr={objectiveAr}
            evidenceCount={evidenceState.evidence.length}
            totalEvidence={evidenceState.totalEvidence || 5}
            puzzleUnlocked={puzzleUnlocked}
            puzzleSolved={puzzleSolved}
            pendingExecutionLabelAr={pendingExecutionLabelAr}
            interactionPrompt={dialogueState.active ? null : interactionPrompt}
            audioSettings={audioSettings}
            onOpenNotebook={() => setNotebookOpen(true)}
            onOpenPuzzle={() => withEngine((engine) => engine.openPuzzle())}
            onResumeExecution={() => taskEngine.requestReopenExecution()}
            onPause={() => setModalMode('pause')}
            onToggleMute={() => audioManager.toggleMute()}
          />
        )}

        {/* Controls Hint Panel */}
        {screenMode === 'PLAYING' &&
          controlsHintVisible &&
          !dialogueState.active &&
          !desk7CloseupOpen &&
          !puzzleOpen &&
          !registerOpen &&
          !photoOpen &&
          !doorChoiceOpen &&
          !notebookOpen &&
          !modalMode && (
            <div
              dir="rtl"
              className="pointer-events-auto absolute right-4 bottom-16 z-20 flex max-w-md items-center gap-3 rounded border border-amber-500/60 bg-[#0B1220]/95 px-4 py-2.5 shadow-xl"
            >
              <span className="font-ar text-xs leading-relaxed font-medium text-slate-100">
                انقر على عناصر الفصل أو الطلاب للتفاعل • الدفتر بـ N • الإيقاف المؤقت Esc
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

        {/* Desk 7 Closeup DOM Caption & Close Control */}
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
            onAdvance={() => dialogueSystem.advance()}
            onSelectChoice={(choiceId) => dialogueSystem.selectChoice(choiceId)}
          />
        )}

        {/* Listener's Notebook Modal */}
        {notebookOpen && (
          <NotebookModal
            history={dialogueHistory}
            foundObjects={storyState.foundObjects}
            evidence={evidenceState.evidence}
            cluesFound={storyState.cluesFound}
            decisions={storyState.decisions}
            onClose={() => setNotebookOpen(false)}
          />
        )}

        {/* Puzzle 01 Workspace */}
        {puzzleOpen && puzzleConfig && (
          <PuzzleModal
            config={puzzleConfig}
            onClose={() => EventBus.emit('puzzle:close')}
            onSolved={() => {
              EventBus.emit('puzzle:close');
              taskEngine.completeExecution();
            }}
          />
        )}

        {/* Register Inspection Modal (Task 03 execution) */}
        {registerOpen && activeExecution?.config?.registerInspection && (
          <RegisterInspectionModal
            config={activeExecution.config.registerInspection}
            onClose={() => setRegisterOpen(false)}
            onSolved={() => {
              setRegisterOpen(false);
              taskEngine.completeExecution();
            }}
          />
        )}

        {/* Photo Inspection Modal (Task 04 execution) */}
        {photoOpen && activeExecution?.config?.photoInspection && (
          <PhotoInspectionModal
            config={activeExecution.config.photoInspection}
            onClose={() => setPhotoOpen(false)}
            onSolved={() => {
              setPhotoOpen(false);
              taskEngine.completeExecution();
            }}
          />
        )}

        {/* Door Choice Modal (Task 05 final decision) */}
        {doorChoiceOpen && activeExecution?.choices && (
          <DoorChoiceModal
            choices={activeExecution.choices}
            onClose={() => setDoorChoiceOpen(false)}
            onSelectChoice={(choiceId) => {
              setDoorChoiceOpen(false);
              taskEngine.selectDoorChoice(choiceId);
            }}
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
                    const ok = engineRef.current?.saveCurrentProgress() ?? false;
                    setHasSave(ok);
                    EventBus.emit('toast:show', {
                      titleAr: ok ? 'تم حفظ التقدم بنجاح' : 'تعذر حفظ التقدم',
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

        {/* Chapter Ending + Responsibility Screen ("ما الذي اخترتَه") */}
        {screenMode === 'ENDING' && (
          <EndingResponsibilityOverlay
            ending={activeEnding}
            decisions={storyState.decisions}
            onReplay={() => {
              setResolvedEnding(null);
              setActiveExecution(null);
              setNotebookOpen(false);
              setModalMode(null);
              withEngine((engine) => engine.startNewGame());
            }}
            onReturnToMenu={() => {
              setResolvedEnding(null);
              setActiveExecution(null);
              setNotebookOpen(false);
              setModalMode(null);
              withEngine((engine) => engine.returnToMainMenu());
            }}
          />
        )}
      </div>
    </div>
  );
}
