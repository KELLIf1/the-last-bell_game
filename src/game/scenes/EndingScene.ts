import Phaser from 'phaser';
import { audioManager } from '../../systems/AudioManager';
import { EventBus } from '../../systems/EventBus';
import { saveManager } from '../../systems/SaveManager';
import { storyManager } from '../../systems/StoryManager';
import { taskDataLoader } from '../../systems/TaskDataLoader';
import { taskEngine } from '../../systems/TaskEngine';
import { timerManager } from '../../systems/TimerManager';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EndingScene' });
  }

  create(): void {
    timerManager.pause();
    audioManager.stopAllLoops();
    audioManager.playFaintSchoolBell();
    storyManager.setFlag('ch1_bell_rung', true);
    storyManager.setFlag('ch1_completed', true);

    if (!storyManager.getEndingId()) {
      taskEngine.resolveAndStoreEnding();
    }

    const endingId = storyManager.getEndingId();
    const ending =
      taskDataLoader.getEndingById(endingId) ??
      taskDataLoader.resolveEnding(storyManager.getState(), (cond) =>
        storyManager.evaluateCondition(cond)
      );

    saveManager.save('ending', { x: 0, y: 0 }, 0);

    const g = this.add.graphics();
    g.fillStyle(0x04070d, 1);
    g.fillRect(0, 0, 1280, 720);

    EventBus.emit('ending:loaded', ending);
    EventBus.emit('screen:mode', 'ENDING');
    EventBus.emit('scene:changed', 'ending');
  }
}
