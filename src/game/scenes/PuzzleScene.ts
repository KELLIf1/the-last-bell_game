import Phaser from 'phaser';
import { EventBus } from '../../systems/EventBus';
import { timerManager } from '../../systems/TimerManager';

export class PuzzleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PuzzleScene' });
  }

  create(): void {
    EventBus.emit('puzzle:open', true);

    const unsubClose = EventBus.on('puzzle:close', () => {
      EventBus.emit('puzzle:open', false);
      this.scene.resume('ClassroomScene');
      this.scene.stop();
    });

    this.events.once('shutdown', unsubClose);
  }

  update(_time: number, delta: number): void {
    timerManager.update(delta);
  }
}
