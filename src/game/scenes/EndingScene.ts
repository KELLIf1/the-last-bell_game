import Phaser from 'phaser';
import { audioManager } from '../../systems/AudioManager';
import { EventBus } from '../../systems/EventBus';
import { storyManager } from '../../systems/StoryManager';
import { timerManager } from '../../systems/TimerManager';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndingScene' });
  }

  create(): void {
    timerManager.pause();
    audioManager.stopAllLoops();
    audioManager.playSchoolBell();
    storyManager.setFlag('ch1_bell_rung', true);
    storyManager.setFlag('ch1_completed', true);

    const g = this.add.graphics();
    g.fillStyle(0x04070d, 1);
    g.fillRect(0, 0, 1280, 720);

    EventBus.emit('screen:mode', 'ENDING');
    EventBus.emit('scene:changed', 'ending');
  }
}
