import Phaser from 'phaser';
import { EventBus } from '../../systems/EventBus';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scale.on('resize', () => {
      EventBus.emit('viewport:resized', {
        width: this.scale.width,
        height: this.scale.height,
      });
    });

    this.scene.start('PreloadScene');
  }
}
