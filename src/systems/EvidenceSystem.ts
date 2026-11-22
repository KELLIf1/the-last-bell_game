import { EvidenceItem } from '../types/game';
import { audioManager } from './AudioManager';
import { EventBus } from './EventBus';
import { storyManager } from './StoryManager';

export class EvidenceSystem {
  private catalog: Map<string, EvidenceItem> = new Map();
  private collectedEvidenceIds: Set<string> = new Set();
  private unlockedClueIds: Set<string> = new Set();

  loadCatalog(items: EvidenceItem[]): void {
    this.catalog.clear();
    items.forEach((item) => this.catalog.set(item.id, item));
  }

  reset(): void {
    this.collectedEvidenceIds.clear();
    this.unlockedClueIds.clear();
    this.emitUpdate();
  }

  collect(itemId: string): boolean {
    const item = this.catalog.get(itemId);
    if (!item) {
      console.warn(`[EvidenceSystem] Unknown evidence/clue id: ${itemId}`);
      return false;
    }

    const isClue = item.type === 'clue';
    const targetSet = isClue ? this.unlockedClueIds : this.collectedEvidenceIds;

    if (targetSet.has(itemId)) {
      return false; // Already collected
    }

    targetSet.add(itemId);
    if (item.setsFlag) {
      storyManager.setFlag(item.setsFlag, true);
    }

    audioManager.playEvidence();
    EventBus.emit('toast:show', {
      titleAr: isClue ? `ملاحظة مسموعة: ${item.nameAr}` : `تم فحص: ${item.nameAr}`,
      titleEn: '',
      tone: 'evidence',
    });

    this.emitUpdate();
    return true;
  }

  getCatalogItem(itemId: string): EvidenceItem | undefined {
    return this.catalog.get(itemId);
  }

  hasItem(itemId: string): boolean {
    return this.collectedEvidenceIds.has(itemId) || this.unlockedClueIds.has(itemId);
  }

  getCollectedEvidence(): EvidenceItem[] {
    return Array.from(this.collectedEvidenceIds)
      .map((id) => this.catalog.get(id))
      .filter((x): x is EvidenceItem => Boolean(x));
  }

  getUnlockedClues(): EvidenceItem[] {
    return Array.from(this.unlockedClueIds)
      .map((id) => this.catalog.get(id))
      .filter((x): x is EvidenceItem => Boolean(x));
  }

  getTotalEvidenceCount(): number {
    let count = 0;
    this.catalog.forEach((item) => {
      if (item.type === 'evidence') count++;
    });
    return count;
  }

  getState(): { collectedEvidenceIds: string[]; unlockedClueIds: string[] } {
    return {
      collectedEvidenceIds: Array.from(this.collectedEvidenceIds),
      unlockedClueIds: Array.from(this.unlockedClueIds),
    };
  }

  loadState(collectedEvidenceIds: string[], unlockedClueIds: string[]): void {
    this.collectedEvidenceIds = new Set(collectedEvidenceIds);
    this.unlockedClueIds = new Set(unlockedClueIds);
    this.collectedEvidenceIds.forEach((id) => {
      const item = this.catalog.get(id);
      if (item?.setsFlag) {
        storyManager.setFlag(item.setsFlag, true);
      }
    });
    this.emitUpdate();
  }

  private emitUpdate(): void {
    EventBus.emit('evidence:updated', {
      evidence: this.getCollectedEvidence(),
      clues: this.getUnlockedClues(),
      totalEvidence: this.getTotalEvidenceCount(),
    });
  }
}

export const evidenceSystem = new EvidenceSystem();
