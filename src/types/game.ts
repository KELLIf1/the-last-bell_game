export type CharacterId =
  | 'samer'
  | 'layan'
  | 'yacine'
  | 'nour'
  | 'karim'
  | 'mariam'
  | 'adam'
  | 'elena';

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
  condition?: FlagCondition;
  nextNodeId?: string;
  setFlags?: Record<string, StoryFlagValue>;
  relationshipDelta?: Partial<Record<CharacterId, number>>;
  unlockClueIds?: string[];
}

export type CameraAngleId =
  | 'wide_master'
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
  speakerNameAr: string;
  speakerNameEn: string;
  textAr: string;
  textEn: string;
  timestamp: string;
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
  version: number;
  savedAt: string;
  currentSceneId: SceneId;
  playerPosition: { x: number; y: number };
  flags: Record<string, StoryFlagValue>;
  relationships: Record<string, number>;
  collectedEvidenceIds: string[];
  unlockedClueIds: string[];
  dialogueHistory: DialogueHistoryEntry[];
  timerRemainingSec: number;
  timerStarted: boolean;
  puzzleAttempts: number;
}
