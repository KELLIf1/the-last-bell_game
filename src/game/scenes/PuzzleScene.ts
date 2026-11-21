import Phaser from 'phaser';
import { EventBus } from '../../systems/EventBus';
import { timerManager } from '../../systems/TimerManager';

export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PuzzleScene' });
  }

  create(): void {
    EventBus.emit('puzzle:open', true);

    const closePuzzle = () => {
      EventBus.emit('puzzle:open', false);
      this.scene.resume('ClassroomScene');
      this.scene.stop();
    };

    const unsubClose = EventBus.on('puzzle:close', closePuzzle);
    const unsubExpired = EventBus.on('timer:expired', () => {
      this.registry.set('pendingTimeoutEnding', true);
      closePuzzle();
    });

    this.events.once('shutdown', () => {
      unsubClose();
      unsubExpired();
    });
  }

  update(_time: number, delta: number): void {
    timerManager.update(delta);
  }
}
