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
  onInteract: () => void;
}

export class InteractionSystem {
  private targets: InteractableTarget[] = [];
  private hoveredId: string | null = null;
  private nearestId: string | null = null;

  clear(): void {
    this.targets.forEach((t) => {
      t.zone.destroy();
      t.highlightRect?.destroy();
    });
    this.targets = [];
    this.hoveredId = null;
    this.nearestId = null;
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
    if (this.nearestId === id) this.nearestId = null;
    this.syncVisuals();
  }

  setMaxDist(id: string, maxDistPx?: number): void {
    const found = this.targets.find((t) => t.id === id);
    if (found) {
      found.maxDistPx = maxDistPx;
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

  updateProximity(playerX: number, playerY: number, maxDistPx = 155): void {
    let bestId: string | null = null;
    let bestDist = Infinity;

    for (const t of this.targets) {
      if (!t.zone.active) continue;
      const limit = t.maxDistPx ?? maxDistPx;
      const d = Phaser.Math.Distance.Between(playerX, playerY, t.x, t.y);
      if (d < limit && d < bestDist) {
        bestDist = d;
        bestId = t.id;
      }
    }

    if (bestId !== this.nearestId) {
      this.nearestId = bestId;
      this.syncVisuals();
    }
  }

  triggerActive(): boolean {
    const activeId = this.hoveredId ?? this.nearestId;
    if (!activeId) return false;
    const found = this.targets.find((t) => t.id === activeId && t.zone.active);
    if (!found) return false;
    found.onInteract();
    return true;
  }

  private syncVisuals(): void {
    const activeId = this.hoveredId ?? this.nearestId;
    let activeTarget: InteractableTarget | null = null;

    for (const t of this.targets) {
      const isSelected = t.id === activeId && t.zone.active;
      if (isSelected) activeTarget = t;
      if (t.highlightRect) {
        t.highlightRect.setVisible(isSelected);
      }
    }

    if (activeTarget) {
      EventBus.emit('interaction:prompt', {
        id: activeTarget.id,
        labelAr: activeTarget.labelAr,
        labelEn: activeTarget.labelEn,
        xNorm: activeTarget.x / 1280,
        yNorm: activeTarget.y / 720,
      });
    } else {
      EventBus.emit('interaction:prompt', null);
    }
  }
}
