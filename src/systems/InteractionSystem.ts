import Phaser from 'phaser';
import { EventBus } from './EventBus';

export interface InteractableTarget {
  id: string;
  labelAr: string;
  labelEn: string;
  x: number;
  y: number;
  maxDistPx?: number;
  zone: Phaser.GameObjects.Zone;
  highlightRect?: Phaser.GameObjects.Rectangle;
  disabledReasonAr?: string;
  onInteract: () => void;
}

export class InteractionSystem {
  private targets: InteractableTarget[] = [];
  private hoveredId: string | null = null;
  private highlightedGoalId: string | null = null;
  private blocked = false;

  clear(): void {
    this.targets.forEach((t) => {
      t.zone.destroy();
      t.highlightRect?.destroy();
    });
    this.targets = [];
    this.hoveredId = null;
    this.highlightedGoalId = null;
    this.blocked = false;
    EventBus.emit('interaction:prompt', null);
  }

  hasTarget(id: string): boolean {
    return this.targets.some((t) => t.id === id);
  }

  remove(id: string): void {
    const idx = this.targets.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const [removed] = this.targets.splice(idx, 1);
    removed.zone.destroy();
    removed.highlightRect?.destroy();
    if (this.hoveredId === id) this.hoveredId = null;
    if (this.highlightedGoalId === id) this.highlightedGoalId = null;
    this.syncVisuals();
  }

  setMaxDist(id: string, maxDistPx?: number): void {
    const found = this.targets.find((t) => t.id === id);
    if (found) {
      found.maxDistPx = maxDistPx;
    }
  }

  setGoalHighlight(id: string | null): void {
    this.highlightedGoalId = id;
    this.syncVisuals();
  }

  setBlocked(blocked: boolean): void {
    if (this.blocked !== blocked) {
      this.blocked = blocked;
      if (blocked) {
        this.hoveredId = null;
      }
      this.syncVisuals();
    }
  }

  clearHover(): void {
    if (this.hoveredId !== null) {
      this.hoveredId = null;
      this.syncVisuals();
    }
  }

  setDisabledReason(id: string, reasonAr?: string): void {
    const found = this.targets.find((t) => t.id === id);
    if (found) {
      found.disabledReasonAr = reasonAr;
      this.syncVisuals();
    }
  }

  register(target: InteractableTarget): void {
    target.zone.setInteractive({ useHandCursor: true });

    target.zone.on('pointerover', () => {
      this.hoveredId = target.id;
      this.syncVisuals();
    });

    target.zone.on('pointerout', () => {
      if (this.hoveredId === target.id) {
        this.hoveredId = null;
        this.syncVisuals();
      }
    });

    target.zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        target.onInteract();
      }
    });

    this.targets.push(target);
  }

  triggerActive(): boolean {
    if (this.blocked) return false;
    const activeId = this.hoveredId ?? this.highlightedGoalId;
    if (!activeId) return false;
    const found = this.targets.find((t) => t.id === activeId && t.zone.active);
    if (!found) return false;
    found.onInteract();
    return true;
  }

  private syncVisuals(): void {
    if (this.blocked) {
      for (const t of this.targets) {
        t.highlightRect?.setVisible(false);
      }
      EventBus.emit('interaction:prompt', null);
      return;
    }

    const activeId = this.hoveredId;
    let activeTarget: InteractableTarget | null = null;

    for (const t of this.targets) {
      const isHovered = t.id === activeId && t.zone.active;
      const isGoal = t.id === this.highlightedGoalId && t.zone.active;
      if (isHovered) activeTarget = t;
      if (t.highlightRect) {
        t.highlightRect.setVisible(isHovered || isGoal);
        if (isGoal && !isHovered) {
          t.highlightRect.setStrokeStyle(2.5, 0xfbbf24, 0.95);
        } else if (t.disabledReasonAr) {
          t.highlightRect.setStrokeStyle(2, 0xef4444, 0.9);
        } else {
          t.highlightRect.setStrokeStyle(2, 0xd6a65d, 0.85);
        }
      }
    }

    if (activeTarget) {
      EventBus.emit('interaction:prompt', {
        id: activeTarget.id,
        labelAr: activeTarget.disabledReasonAr
          ? `${activeTarget.labelAr} (${activeTarget.disabledReasonAr})`
          : activeTarget.labelAr,
        labelEn: '',
        xNorm: activeTarget.x / 1280,
        yNorm: activeTarget.y / 720,
      });
    } else {
      EventBus.emit('interaction:prompt', null);
    }
  }
}
