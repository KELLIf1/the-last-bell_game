import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { dialogueSystem } from '../systems/DialogueSystem';
import { EventBus } from '../systems/EventBus';
import { evidenceSystem } from '../systems/EvidenceSystem';
import { puzzleManager } from '../systems/PuzzleManager';
import { saveManager } from '../systems/SaveManager';
import { storyManager } from '../systems/StoryManager';
import { taskEngine } from '../systems/TaskEngine';
import { timerManager } from '../systems/TimerManager';
import { BootScene } from './scenes/BootScene';
import { ClassroomScene } from './scenes/ClassroomScene';
import { EndingScene } from './scenes/EndingScene';
import { IntroScene } from './scenes/IntroScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { PuzzleScene } from './scenes/PuzzleScene';

export class GameEngine {
  private game: Phaser.Game | null = null;
  private preloadReady = false;
  private pendingStartAction: (() => void) | null = null;
  private unsubPreload: (() => void) | null = null;

  mount(parentElement: HTMLElement): void {
    if (this.game) return;

    this.preloadReady = false;
    this.pendingStartAction = null;
    this.unsubPreload?.();
    this.unsubPreload = EventBus.on('preload:complete', () => {
      this.preloadReady = true;
      if (this.pendingStartAction) {
        const action = this.pendingStartAction;
        this.pendingStartAction = null;
        queueMicrotask(action);
      }
    });

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentElement,
      width: 1280,
      height: 720,
      backgroundColor: '#080E1A',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [
        BootScene,
        PreloadScene,
        MainMenuScene,
        IntroScene,
        ClassroomScene,
        PuzzleScene,
        EndingScene,
      ],
    });
  }

  startNewGame(): void {
    if (!this.game) return;
    audioManager.unlock();

    if (!this.preloadReady) {
      this.game.registry.set('skipAutoMainMenu', true);
      this.pendingStartAction = () => this.startNewGame();
      return;
    }

    saveManager.clear();
    storyManager.reset();
    evidenceSystem.reset();
    dialogueSystem.reset();
    timerManager.reset();
    puzzleManager.reset();
    taskEngine.reset();

    this.stopActiveGameplayScenes();
    this.game.scene.start('IntroScene');
  }

  continueGame(): boolean {
    if (!this.game) return false;
    const saved = saveManager.load();
    if (!saved) return false;

    audioManager.unlock();

    if (!this.preloadReady) {
      this.game.registry.set('skipAutoMainMenu', true);
      this.pendingStartAction = () => {
        this.continueGame();
      };
      return true;
    }

    taskEngine.reset();
    saveManager.applySave(saved);
    taskEngine.loadPenaltyTimers(saved.doorDelayRemainingSec ?? 0);
    this.stopActiveGameplayScenes();

    if (saved.currentSceneId === 'ending') {
      this.game.scene.start('EndingScene');
    } else {
      this.game.scene.start('ClassroomScene', {
        sceneId:
          saved.currentSceneId === 'academy_exterior'
            ? 'classroom_emergency'
            : saved.currentSceneId,
      });
    }
    return true;
  }

  openPuzzle(): void {
    if (!this.game) return;
    const classroom = this.game.scene.getScene('ClassroomScene');
    if (classroom && this.game.scene.isActive('ClassroomScene')) {
      classroom.scene.pause();
      classroom.scene.launch('PuzzleScene');
    }
  }

  returnToMainMenu(): void {
    if (!this.game) return;
    this.pendingStartAction = null;
    timerManager.pause();
    audioManager.stopAllLoops();
    dialogueSystem.reset();
    taskEngine.reset();
    this.stopActiveGameplayScenes();
    this.game.scene.start('MainMenuScene');
  }

  saveCurrentProgress(): boolean {
    if (!this.game) return false;
    return saveManager.save(
      'classroom_emergency',
      { x: 0, y: 0 },
      taskEngine.getDoorDelayRemainingSec()
    );
  }

  private stopActiveGameplayScenes(): void {
    if (!this.game) return;
    [
      'PreloadScene',
      'MainMenuScene',
      'IntroScene',
      'ClassroomScene',
      'PuzzleScene',
      'EndingScene',
    ].forEach((key) => {
      if (this.game?.scene.isActive(key) || this.game?.scene.isPaused(key)) {
        this.game.scene.stop(key);
      }
    });
  }

  destroy(): void {
    this.unsubPreload?.();
    this.unsubPreload = null;
    this.pendingStartAction = null;
    this.preloadReady = false;
    audioManager.stopAllLoops();
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

export const gameEngine = new GameEngine();
