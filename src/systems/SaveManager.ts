import { SaveData, SceneId } from '../types/game';
import { dialogueSystem } from './DialogueSystem';
import { evidenceSystem } from './EvidenceSystem';
import { puzzleManager } from './PuzzleManager';
import { storyManager } from './StoryManager';
import { timerManager } from './TimerManager';

export const SAVE_STORAGE_KEY_V2 = 'the_last_bell_ch01_save_v2';
export const SAVE_STORAGE_KEY_V1 = 'the_last_bell_ch01_save_v1';
export const CURRENT_SAVE_VERSION = 2;

export class SaveManager {
  private purgeLegacyOrCorruptSaves(): void {
    try {
      // Always reject and clear v1 saves cleanly
      if (localStorage.getItem(SAVE_STORAGE_KEY_V1) !== null) {
        localStorage.removeItem(SAVE_STORAGE_KEY_V1);
      }

      const rawV2 = localStorage.getItem(SAVE_STORAGE_KEY_V2);
      if (rawV2 !== null) {
        const parsed = JSON.parse(rawV2) as Partial<SaveData> | null;
        if (!this.isValidV2Save(parsed)) {
          localStorage.removeItem(SAVE_STORAGE_KEY_V2);
        }
      }
    } catch {
      try {
        localStorage.removeItem(SAVE_STORAGE_KEY_V1);
        localStorage.removeItem(SAVE_STORAGE_KEY_V2);
      } catch {
        // Ignore storage errors
      }
    }
  }

  private isValidV2Save(candidate: unknown): candidate is SaveData {
    if (!candidate || typeof candidate !== 'object') return false;
    const data = candidate as Partial<SaveData>;
    if (data.version !== CURRENT_SAVE_VERSION) return false;
    if (!data.currentSceneId || !data.storyState || typeof data.storyState !== 'object') {
      return false;
    }
    const st = data.storyState;
    if (
      !st.fear ||
      !st.trust ||
      typeof st.adamAnger !== 'number' ||
      !Array.isArray(st.secretsExposed) ||
      typeof st.understanding !== 'number' ||
      !Array.isArray(st.cluesFound) ||
      !Array.isArray(st.decisions) ||
      typeof st.taskPhase !== 'string'
    ) {
      return false;
    }
    return true;
  }

  hasSave(): boolean {
    this.purgeLegacyOrCorruptSaves();
    try {
      return Boolean(localStorage.getItem(SAVE_STORAGE_KEY_V2));
    } catch {
      return false;
    }
  }

  save(
    currentSceneId: SceneId,
    playerPosition: { x: number; y: number } = { x: 0, y: 0 },
    doorDelayRemainingSec = 0
  ): boolean {
    try {
      // Remove any lingering v1 key whenever saving v2
      localStorage.removeItem(SAVE_STORAGE_KEY_V1);

      const storyState = storyManager.getState();
      const ev = evidenceSystem.getState();
      const timer = timerManager.getState();

      const payload: SaveData = {
        version: CURRENT_SAVE_VERSION,
        savedAt: new Date().toISOString(),
        currentSceneId,
        playerPosition,
        storyState,
        collectedEvidenceIds: ev.collectedEvidenceIds,
        unlockedClueIds: ev.unlockedClueIds,
        dialogueHistory: dialogueSystem.getHistory(),
        timerRemainingSec: timer.remainingSeconds,
        timerStarted: timer.started,
        puzzleAttempts: puzzleManager.getAttempts(),
        registerAttempts: storyManager.getRegisterAttempts(),
        photoAttempts: storyManager.getPhotoAttempts(),
        doorDelayRemainingSec: Math.max(0, Math.floor(doorDelayRemainingSec)),
      };

      localStorage.setItem(SAVE_STORAGE_KEY_V2, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.error('[SaveManager] Failed to save game (v2):', err);
      return false;
    }
  }

  load(): SaveData | null {
    this.purgeLegacyOrCorruptSaves();
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY_V2);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (!this.isValidV2Save(parsed)) {
        localStorage.removeItem(SAVE_STORAGE_KEY_V2);
        return null;
      }
      return parsed;
    } catch (err) {
      console.error('[SaveManager] Failed to parse v2 save data:', err);
      this.clear();
      return null;
    }
  }

  applySave(data: SaveData): void {
    storyManager.loadState(data.storyState);
    evidenceSystem.loadState(data.collectedEvidenceIds ?? [], data.unlockedClueIds ?? []);
    dialogueSystem.loadHistory(data.dialogueHistory ?? []);
    timerManager.loadState(data.timerRemainingSec, data.timerStarted);
    puzzleManager.loadAttempts(data.puzzleAttempts ?? 0);
  }

  clear(): void {
    try {
      localStorage.removeItem(SAVE_STORAGE_KEY_V1);
      localStorage.removeItem(SAVE_STORAGE_KEY_V2);
    } catch {
      // ignore
    }
  }
}

export const saveManager = new SaveManager();
