import {
  DialogueChoice,
  DialogueConversation,
  DialogueHistoryEntry,
  DialogueLine,
} from '../types/game';
import { audioManager } from './AudioManager';
import { EventBus } from './EventBus';
import { evidenceSystem } from './EvidenceSystem';
import { storyManager } from './StoryManager';
import { timerManager } from './TimerManager';

export class DialogueSystem {
  private conversations: Map<string, DialogueConversation> = new Map();
  private activeConversation: DialogueConversation | null = null;
  private activeNode: DialogueLine | null = null;
  private history: DialogueHistoryEntry[] = [];
  private onCompleteCallback: (() => void) | null = null;

  loadConversations(list: DialogueConversation[]): void {
    this.conversations.clear();
    list.forEach((c) => this.conversations.set(c.id, c));
  }

  reset(): void {
    this.activeConversation = null;
    this.activeNode = null;
    this.history = [];
    this.onCompleteCallback = null;
    EventBus.emit('dialogue:state', { active: false, line: null, choices: [] });
  }

  isActive(): boolean {
    return this.activeNode !== null;
  }

  startConversation(conversationId: string, onComplete?: () => void): boolean {
    const conv = this.conversations.get(conversationId);
    if (!conv) {
      console.warn(`[DialogueSystem] Conversation not found: ${conversationId}`);
      onComplete?.();
      return false;
    }

    this.activeConversation = conv;
    this.onCompleteCallback = onComplete ?? null;
    this.goToNode(conv.entryNodeId);
    return true;
  }

  private resolveNextValidNode(startNodeId?: string): DialogueLine | null {
    if (!this.activeConversation || !startNodeId) return null;

    let currentId: string | undefined = startNodeId;
    let safety = 0;

    while (currentId && safety < 50) {
      safety++;
      const node: DialogueLine | undefined = this.activeConversation.nodes[currentId];
      if (!node) return null;

      if (storyManager.evaluateCondition(node.condition)) {
        return node;
      }
      currentId = node.nextNodeId;
    }
    return null;
  }

  private goToNode(nodeId?: string): void {
    const node = this.resolveNextValidNode(nodeId);
    if (!node || !this.activeConversation) {
      this.endConversation();
      return;
    }

    this.activeNode = node;

    if (node.setFlags) {
      storyManager.setFlags(node.setFlags);
    }
    if (node.unlockClueIds) {
      node.unlockClueIds.forEach((clueId) => evidenceSystem.collect(clueId));
    }

    this.history.push({
      conversationId: this.activeConversation.id,
      speakerNameAr: node.speakerNameAr,
      speakerNameEn: node.speakerNameEn,
      textAr: node.textAr,
      textEn: node.textEn,
      timestamp: timerManager.getState().started ? timerManager.getFormatted() : '16:20',
    });

    const visibleChoices = (node.choices ?? []).filter((ch) =>
      storyManager.evaluateCondition(ch.condition)
    );

    EventBus.emit('dialogue:state', {
      active: true,
      line: node,
      choices: visibleChoices,
    });
    EventBus.emit('dialogue:history_updated', this.getHistory());
  }

  advance(): void {
    if (!this.activeNode) return;
    const visibleChoices = (this.activeNode.choices ?? []).filter((ch) =>
      storyManager.evaluateCondition(ch.condition)
    );
    if (visibleChoices.length > 0) {
      return; // Wait for explicit choice selection
    }
    audioManager.playClick();
    this.goToNode(this.activeNode.nextNodeId);
  }

  selectChoice(choiceId: string): void {
    if (!this.activeNode) return;
    const choice: DialogueChoice | undefined = this.activeNode.choices?.find(
      (c) => c.id === choiceId
    );
    if (!choice) return;

    audioManager.playClick();

    if (choice.setFlags) {
      storyManager.setFlags(choice.setFlags);
    }
    if (choice.relationshipDelta) {
      Object.entries(choice.relationshipDelta).forEach(([charId, delta]) => {
        if (typeof delta === 'number') {
          storyManager.adjustRelationship(charId as keyof typeof choice.relationshipDelta, delta);
        }
      });
    }
    if (choice.unlockClueIds) {
      choice.unlockClueIds.forEach((id) => evidenceSystem.collect(id));
    }

    this.goToNode(choice.nextNodeId);
  }

  private endConversation(): void {
    this.activeConversation = null;
    this.activeNode = null;
    const cb = this.onCompleteCallback;
    this.onCompleteCallback = null;
    EventBus.emit('dialogue:state', { active: false, line: null, choices: [] });
    cb?.();
  }

  getHistory(): DialogueHistoryEntry[] {
    return [...this.history];
  }

  loadHistory(entries: DialogueHistoryEntry[]): void {
    this.history = [...entries];
    EventBus.emit('dialogue:history_updated', this.getHistory());
  }
}

export const dialogueSystem = new DialogueSystem();
