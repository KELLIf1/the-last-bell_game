import {
  CharacterId,
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
  private speakerNamesAr: Map<string, string> = new Map();
  private activeConversation: DialogueConversation | null = null;
  private activeNode: DialogueLine | null = null;
  private history: DialogueHistoryEntry[] = [];
  private onCompleteCallback: (() => void) | null = null;
  private customChoiceHandler: ((choiceId: string) => void) | null = null;
  private recordCurrentNodeInHistory = true;

  loadConversations(list: DialogueConversation[]): void {
    this.conversations.clear();
    this.speakerNamesAr.clear();
    list.forEach((c) => {
      this.conversations.set(c.id, c);
      Object.values(c.nodes ?? {}).forEach((node) => {
        if (node.speaker && node.speakerNameAr) {
          this.speakerNamesAr.set(node.speaker, node.speakerNameAr);
        }
      });
    });
  }

  getSpeakerNameAr(speakerId: CharacterId | 'narrator' | 'system'): string {
    return this.speakerNamesAr.get(speakerId) ?? speakerId;
  }

  reset(): void {
    this.activeConversation = null;
    this.activeNode = null;
    this.history = [];
    this.onCompleteCallback = null;
    this.customChoiceHandler = null;
    this.recordCurrentNodeInHistory = true;
    EventBus.emit('dialogue:state', { active: false, line: null, choices: [] });
    EventBus.emit('dialogue:history_updated', []);
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

    this.customChoiceHandler = null;
    this.recordCurrentNodeInHistory = true;
    this.activeConversation = conv;
    this.onCompleteCallback = onComplete ?? null;
    this.goToNode(conv.entryNodeId);
    return true;
  }

  /**
   * Plays an ordered list of dialogue lines supplied dynamically by TaskEngine.
   */
  playScriptedSequence(
    sequenceId: string,
    lines: DialogueLine[],
    onComplete?: () => void
  ): boolean {
    if (lines.length === 0) {
      onComplete?.();
      return false;
    }

    const nodes: Record<string, DialogueLine> = {};
    lines.forEach((line, idx) => {
      const next = lines[idx + 1];
      nodes[line.id] = {
        ...line,
        nextNodeId: next ? next.id : undefined,
      };
    });

    const dynamicConv: DialogueConversation = {
      id: sequenceId,
      titleAr: sequenceId,
      titleEn: '',
      entryNodeId: lines[0].id,
      nodes,
    };

    this.customChoiceHandler = null;
    this.recordCurrentNodeInHistory = true;
    this.activeConversation = dynamicConv;
    this.onCompleteCallback = onComplete ?? null;
    this.goToNode(dynamicConv.entryNodeId);
    return true;
  }

  /**
   * Presents student-proposed choices without treating the unseen player as a speaker.
   */
  presentChoicePrompt(
    promptId: string,
    promptLine: DialogueLine,
    choices: DialogueChoice[],
    onSelectChoice: (choiceId: string) => void
  ): void {
    const promptConv: DialogueConversation = {
      id: promptId,
      titleAr: promptId,
      titleEn: '',
      entryNodeId: promptLine.id,
      nodes: {
        [promptLine.id]: {
          ...promptLine,
          choices,
        },
      },
    };

    this.activeConversation = promptConv;
    this.activeNode = promptConv.nodes[promptLine.id];
    this.onCompleteCallback = null;
    this.customChoiceHandler = onSelectChoice;
    this.recordCurrentNodeInHistory = false;

    const visibleChoices = choices.filter((ch) => storyManager.evaluateCondition(ch.condition));
    EventBus.emit('dialogue:state', {
      active: true,
      line: this.activeNode,
      choices: visibleChoices,
    });
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

    if (this.recordCurrentNodeInHistory && node.textAr.trim().length > 0) {
      this.history.push({
        conversationId: this.activeConversation.id,
        speakerId: node.speaker,
        speakerNameAr: node.speakerNameAr,
        speakerNameEn: node.speakerNameEn,
        textAr: node.textAr,
        textEn: node.textEn,
        timestamp: timerManager.getState().started ? timerManager.getFormatted() : '16:20',
      });
      EventBus.emit('dialogue:history_updated', this.getHistory());
    }

    const visibleChoices = (node.choices ?? []).filter((ch) =>
      storyManager.evaluateCondition(ch.condition)
    );

    EventBus.emit('dialogue:state', {
      active: true,
      line: node,
      choices: visibleChoices,
    });
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

    if (this.customChoiceHandler) {
      const handler = this.customChoiceHandler;
      this.customChoiceHandler = null;
      this.activeConversation = null;
      this.activeNode = null;
      this.recordCurrentNodeInHistory = true;
      EventBus.emit('dialogue:state', { active: false, line: null, choices: [] });
      handler(choiceId);
      return;
    }

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
    this.customChoiceHandler = null;
    this.recordCurrentNodeInHistory = true;
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
