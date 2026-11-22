export type StudentId = 'samer' | 'layan' | 'yacine' | 'nour' | 'karim' | 'mariam';

export type CharacterId = StudentId | 'adam' | 'elena';

export type ExpressionKey = 'neutral' | 'worried' | 'angry' | 'sad';

export type SceneId =
  | 'academy_exterior'
  | 'academy_entrance'
  | 'classroom_day'
  | 'classroom_dark'
  | 'classroom_emergency'
  | 'desk7_closeup'
  | 'projector_closeup'
  | 'door_closeup'
  | 'puzzle_seating'
  | 'ending';

export type PhaserSceneKey =
  | 'BootScene'
  | 'PreloadScene'
  | 'MainMenuScene'
  | 'IntroScene'
  | 'ClassroomScene'
  | 'PuzzleScene'
  | 'EndingScene';

export type GameScreenMode =
  | 'MAIN_MENU'
  | 'CHAPTER_TITLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'ENDING';

export type StoryFlagValue = boolean | number | string;

export interface FlagCondition {
  flag?: string;
  equals?: StoryFlagValue;
  notEquals?: StoryFlagValue;
  allOf?: FlagCondition[];
  anyOf?: FlagCondition[];
  not?: FlagCondition;
}

export interface WalkablePoint {
  x: number;
  y: number;
}

export interface NormalizedBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SceneObjectConfig {
  id: string;
  label: string;
  layer?: string;
  textureKey?: string;
  visualMode?: 'sprite' | 'baked';
  flipX?: boolean;
  shadow?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  origin?: [number, number];
  depth?: number;
  depthMode?: 'by_y' | 'fixed';
  interactive?: boolean;
  interactionZone?: NormalizedBox;
  evidenceId?: string;
  conditionFlag?: string;
}

export interface SceneCharacterConfig {
  id: CharacterId;
  label: string;
  pose?: 'standing' | 'seated';
  x: number;
  y: number;
  scale?: number;
  normHeight?: number;
  origin?: [number, number];
  depthMode?: 'by_y' | 'fixed';
  depth?: number;
  facing?: 'left' | 'right';
  interactive?: boolean;
  interactionZone?: NormalizedBox;
  conditionFlag?: string;
  hiddenWhenFlag?: string;
}

export interface SceneLayoutConfig {
  sceneId: SceneId;
  titleAr: string;
  titleEn: string;
  purpose: string;
  baseResolution: { width: number; height: number };
  lighting: {
    state: string;
    ambientColor: string;
    direction?: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      label: string;
    };
    weather?: string;
  };
  camera: {
    framing: string;
    startZoom: number;
    endZoom: number;
    focusTarget: { x: number; y: number };
    panDurationMs?: number;
  };
  floorLineY: number;
  walkableArea: WalkablePoint[];
  uiSafeAreas: Record<string, NormalizedBox>;
  depthLayers: Array<{
    id: string;
    depth?: number;
    depthMode?: string;
    minDepth?: number;
    maxDepth?: number;
  }>;
  objects: SceneObjectConfig[];
  characters: SceneCharacterConfig[];
  evidence: string[];
  dialogueTriggers: string[];
  transitions: Array<{
    to: SceneId;
    condition: FlagCondition;
    type: string;
    durationMs?: number;
  }>;
}

export interface EvidenceItem {
  id: string;
  type: 'evidence' | 'clue';
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  locationAr: string;
  locationEn: string;
  icon: string;
  relevantCharacters: CharacterId[];
  storyConnectionsAr: string;
  storyConnectionsEn: string;
  unlockCondition?: FlagCondition;
  setsFlag?: string;
}

export interface DialogueChoice {
  id: string;
  textAr: string;
  textEn: string;
  proposedBy?: StudentId;
  proposedByNameAr?: string;
  condition?: FlagCondition;
  nextNodeId?: string;
  setFlags?: Record<string, StoryFlagValue>;
  relationshipDelta?: Partial<Record<CharacterId, number>>;
  unlockClueIds?: string[];
}

export type CameraAngleId =
  | 'wide_master'
  | 'board'
  | 'teacher_desk'
  | 'wall_photos'
  | 'door'
  | 'angle_clock_1620'
  | 'angle_window_rain'
  | 'angle_seat7_empty'
  | 'angle_board_cipher'
  | 'angle_door_lock'
  | 'angle_teachers_desk'
  | 'closeup_layan'
  | 'closeup_yacine'
  | 'closeup_nour'
  | 'closeup_mariam'
  | 'closeup_karim'
  | 'closeup_samer'
  | 'two_shot_conversation';

export interface DialogueLine {
  id: string;
  speaker: CharacterId | 'narrator' | 'system';
  speakerNameAr: string;
  speakerNameEn: string;
  expression?: ExpressionKey;
  speaking?: boolean;
  cameraShot?: CameraAngleId;
  proposedBy?: StudentId;
  textAr: string;
  textEn: string;
  condition?: FlagCondition;
  setFlags?: Record<string, StoryFlagValue>;
  unlockClueIds?: string[];
  choices?: DialogueChoice[];
  nextNodeId?: string;
}

export interface DialogueConversation {
  id: string;
  characterId?: CharacterId;
  titleAr: string;
  titleEn: string;
  entryNodeId: string;
  nodes: Record<string, DialogueLine>;
}

export interface DialogueHistoryEntry {
  conversationId: string;
  speakerId?: CharacterId | 'narrator' | 'system';
  speakerNameAr: string;
  speakerNameEn: string;
  textAr: string;
  textEn: string;
  timestamp: string;
}

// ============================================================
// Batch 2: Task Engine, Clues, Endings, Story State & Save v2
// ============================================================

export type TaskPhase =
  | 'adam_intro'
  | 'waiting_for_click'
  | 'adam_on_click'
  | 'students_debate'
  | 'choice'
  | 'execution'
  | 'outcome'
  | 'after_clue'
  | 'next'
  | 'completed';

export type TaskExecutionType =
  | 'seating_puzzle'
  | 'register_inspection'
  | 'photo_inspection'
  | 'door_choice';

export interface RegisterInspectionLine {
  id: string;
  textAr: string;
  isAltered: boolean;
}

export interface RegisterInspectionConfig {
  titleAr: string;
  instructionsAr: string;
  lines: RegisterInspectionLine[];
}

export interface PhotoInspectionHotspot {
  id: 'cut_edge' | 'date_stamp' | 'photo_back';
  labelAr: string;
  isCorrect: boolean;
  wrongFeedbackAr?: string;
  revealTextAr?: string;
}

export interface PhotoInspectionConfig {
  titleAr: string;
  instructionsAr: string;
  imageUrl: string;
  cutSlotIndex: number;
  hotspots: PhotoInspectionHotspot[];
}

export type EndingFlagType = 'confession' | 'force' | 'apology';

export type TaskResultType = 'success' | 'partial' | 'fail';

export type TaskPenalty =
  | { type: 'lights_out'; params: { seconds: number } }
  | { type: 'time_loss'; params: { seconds: number } }
  | { type: 'expose_secret'; params: { studentId: StudentId; adamLineAr?: string } }
  | { type: 'door_delay'; params: { seconds: number } }
  | { type: 'camera_cut'; params: { cameraId: CameraAngleId; seconds: number } };

export interface TaskDialogueBeat {
  speaker?: CharacterId | 'system';
  textAr: string;
  expression?: ExpressionKey;
  cameraShot?: CameraAngleId;
}

export interface TaskChoiceEffects {
  fear: Partial<Record<StudentId, number>>;
  trust: Partial<Record<StudentId, number>>;
  adamAnger: number;
  understanding: number;
  timerDeltaSec: number;
  flags: Record<string, StoryFlagValue>;
  exposeSecretOf: StudentId | null;
}

export interface TaskOutcome {
  result: TaskResultType;
  executeAfterOutcome?: boolean;
  studentLines: Array<{
    speaker: StudentId;
    textAr: string;
    expression?: ExpressionKey;
    cameraShot?: CameraAngleId;
  }>;
  adamLines: Array<{
    textAr: string;
    expression?: ExpressionKey;
    cameraShot?: CameraAngleId;
  }>;
  penalty: TaskPenalty | null;
}

export interface TaskChoice {
  id: string;
  proposedBy: StudentId;
  textAr: string;
  endingFlag?: EndingFlagType;
  effects: TaskChoiceEffects;
  outcome: TaskOutcome;
}

export interface TaskDefinition {
  id: string;
  order: number;
  isPlaceholder?: boolean;
  titleAr?: string;
  objectId: string;
  cameraId: CameraAngleId;
  execution?: TaskExecutionType | null;
  executionConfig?: {
    registerInspection?: RegisterInspectionConfig;
    photoInspection?: PhotoInspectionConfig;
  };
  onClickFx?: 'school_bell_flicker' | 'faint_bell_double_flicker';
  adamIntroLines: TaskDialogueBeat[];
  adamOnClickLines: TaskDialogueBeat[];
  studentDialogue: Array<{
    speaker: StudentId;
    textAr: string;
    expression?: ExpressionKey;
    cameraShot?: CameraAngleId;
  }>;
  choices: TaskChoice[];
  clueFragmentId: string | null;
  afterClueDialogue?: Array<{
    speaker: StudentId;
    textAr: string;
    expression?: ExpressionKey;
    cameraShot?: CameraAngleId;
  }>;
  nextTaskId: string | null;
}

export interface ClueFragment {
  id: string;
  isPlaceholder?: boolean;
  titleAr?: string;
  sourceObjectId?: string;
  textAr: string;
  answersQuestions: string[];
}

export interface BigQuestion {
  id: string;
  isPlaceholder?: boolean;
  textAr: string;
}

export interface CluesConfig {
  clueFragments: ClueFragment[];
  bigQuestions: BigQuestion[];
}

export interface EndingCondition {
  endingFlags?: EndingFlagType[];
  minUnderstanding?: number;
  maxUnderstanding?: number;
  minAdamAnger?: number;
  maxAdamAnger?: number;
  minSecretsExposed?: number;
  flagCondition?: FlagCondition;
}

export interface EndingDefinition {
  id: string;
  isPlaceholder?: boolean;
  titleAr: string;
  conditions: EndingCondition;
  adamLines?: string[];
  epilogueAr?: string;
  textAr: string[];
}

export interface TaskDecisionRecord {
  taskId: string;
  taskTitleAr?: string;
  choiceId: string;
  proposedBy: StudentId;
  proposedByNameAr: string;
  choiceTextAr: string;
  outcomeLineAr?: string;
  result: TaskResultType;
  effects: TaskChoiceEffects;
  timestamp: string;
}

export interface FoundObjectRecord {
  objectId: string;
  evidenceId?: string;
  titleAr: string;
  rawTextAr: string;
  timestamp: string;
}

export interface StoryState {
  fear: Record<StudentId, number>;
  trust: Record<StudentId, number>;
  adamAnger: number;
  secretsExposed: StudentId[];
  understanding: number;
  cluesFound: string[];
  foundObjects: FoundObjectRecord[];
  decisions: TaskDecisionRecord[];
  currentTaskId: string | null;
  taskPhase: TaskPhase;
  activeOutcomeChoiceId: string | null;
  registerAttempts: number;
  photoAttempts: number;
  endingFlag: EndingFlagType | null;
  endingId: string | null;
  flags: Record<string, StoryFlagValue>;
  relationships: Record<string, number>;
}

export interface SeatingChartEntry {
  seatNumber: number;
  studentNameAr: string;
  studentNameEn: string;
  damaged?: boolean;
}

export interface BoardSequenceRevealSlot {
  position: number; // 1..7 left-to-right
  seatNumber: number | null; // null if scraped/unknown (deduced by elimination)
  requiredFlags: string[];
}

export interface PuzzleSeatingConfig {
  puzzleId: string;
  titleAr: string;
  titleEn: string;
  instructionsAr: string;
  instructionsEn: string;
  unlockCondition: FlagCondition;
  penaltySeconds: number;
  boardSequence: number[];
  boardSequenceReveal: BoardSequenceRevealSlot[];
  seatingChart: SeatingChartEntry[];
  photoSlotsOrder: string[]; // expected student ids or 'unknown' left-to-right
  labels: Array<{ id: string; textAr: string; textEn: string }>;
  hints: Array<{ attemptThreshold: number; textAr: string; textEn: string }>;
  successRevealAr: string;
  successRevealEn: string;
}

export type TimerWarningLevel = 'normal' | 'warning' | 'critical' | 'expired';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

export interface UiSettings {
  showEnglish: boolean;
}

export interface SaveData {
  version: 2;
  savedAt: string;
  currentSceneId: SceneId;
  playerPosition: { x: number; y: number };
  storyState: StoryState;
  collectedEvidenceIds: string[];
  unlockedClueIds: string[];
  dialogueHistory: DialogueHistoryEntry[];
  timerRemainingSec: number;
  timerStarted: boolean;
  puzzleAttempts: number;
  registerAttempts?: number;
  photoAttempts?: number;
  doorDelayRemainingSec?: number;
}

