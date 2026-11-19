import { SaveData, SceneId } from '../types/game';
import { dialogueSystem } from './DialogueSystem';
import { evidenceSystem } from './EvidenceSystem';
import { puzzleManager } from './PuzzleManager';
import { storyManager } from './StoryManager';
import { timerManager } from './TimerManager';

const SAVE_STORAGE_KEY = 'the_last_bell_ch01_save_v1';

export class SaveManager {
  hasSave(): boolean {
    try {
      return Boolean(localStorage.getItem(SAVE_STORAGE_KEY));
    } catch {
      return false;
    }
  }

  save(currentSceneId: SceneId, playerPosition: { x: number; y: number }): boolean {
    try {
      const story = storyManager.getSnapshot();
      const ev = evidenceSystem.getState();
      const timer = timerManager.getState();

      const payload: SaveData = {
        version: 1,
        savedAt: new Date().toISOString(),
        currentSceneId,
        playerPosition,
        flags: story.flags,
        relationships: story.relationships,
        collectedEvidenceIds: ev.collectedEvidenceIds,
        unlockedClueIds: ev.unlockedClueIds,
        dialogueHistory: dialogueSystem.getHistory(),
        timerRemainingSec: timer.remainingSeconds,
        timerStarted: timer.started,
        puzzleAttempts: puzzleManager.getAttempts(),
      };

      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.error('[SaveManager] Failed to save game:', err);
      return false;
    }
  }

  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveData;
      if (!parsed || parsed.version !== 1) return null;
      return parsed;
    } catch (err) {
      console.error('[SaveManager] Failed to parse save data:', err);
      return null;
    }
  }

  applySave(data: SaveData): void {
    storyManager.loadSnapshot({
      flags: data.flags,
      relationships: data.relationships,
    });
    evidenceSystem.loadState(data.collectedEvidenceIds, data.unlockedClueIds);
    dialogueSystem.loadHistory(data.dialogueHistory ?? []);
    timerManager.loadState(data.timerRemainingSec, data.timerStarted);
    puzzleManager.loadAttempts(data.puzzleAttempts ?? 0);
  }

  clear(): void {
    try {
      localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const saveManager = new SaveManager();
