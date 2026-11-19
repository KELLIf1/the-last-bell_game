import Phaser from 'phaser';
import { audioManager } from '../../systems/AudioManager';
import { EventBus } from '../../systems/EventBus';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const W = 1280;
    const H = 720;

    if (this.textures.exists('bg_academy_exterior')) {
      const bg = this.add.image(W / 2, H / 2, 'bg_academy_exterior').setDisplaySize(W, H);
      this.tweens.add({
        targets: bg,
        scaleX: bg.scaleX * 1.05,
        scaleY: bg.scaleY * 1.05,
        duration: 12000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // Atmospheric dark rainy academy silhouette backdrop while Milestone 5 backdrop awaits
      const g = this.add.graphics();
      g.fillGradientStyle(0x060b14, 0x060b14, 0x0f172a, 0x0b1220, 1);
      g.fillRect(0, 0, W, H);
      // Distant academy facade silhouette
      g.fillStyle(0x090f1d, 0.95);
      g.fillRect(160, 190, 620, 410);
      g.fillRect(220, 140, 500, 50);
      // Warm single Classroom 3B window glow on left/center away from menu text
      g.fillStyle(0xd97706, 0.72);
      g.fillRect(460, 270, 54, 72);
      g.fillStyle(0xfef3c7, 0.35);
      g.fillRect(452, 262, 70, 88);
    }

    // Gentle rain lines in background
    const rainDrops: Phaser.GameObjects.Line[] = [];
    for (let i = 0; i < 42; i++) {
      const rx = Phaser.Math.Between(0, W);
      const ry = Phaser.Math.Between(0, H);
      const line = this.add.line(0, 0, rx, ry, rx - 8, ry + 24, 0x94a3b8, 0.22).setOrigin(0);
      rainDrops.push(line);
    }

    this.events.on('update', (_time: number, delta: number) => {
      const step = Math.min(delta, 50) * 0.45;
      for (const drop of rainDrops) {
        drop.y += step;
        drop.x -= step * 0.3;
        if (drop.y > H) {
          drop.y = -30;
          drop.x = Phaser.Math.Between(0, W + 120);
        }
      }
    });

    EventBus.emit('screen:mode', 'MAIN_MENU');
    EventBus.emit('scene:changed', 'main_menu');
    audioManager.setTensionMusic(false);
    audioManager.setAmbienceActive(false);
  }
}
