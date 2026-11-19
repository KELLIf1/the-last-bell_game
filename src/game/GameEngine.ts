import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { dialogueSystem } from '../systems/DialogueSystem';
import { evidenceSystem } from '../systems/EvidenceSystem';
import { puzzleManager } from '../systems/PuzzleManager';
import { saveManager } from '../systems/SaveManager';
import { storyManager } from '../systems/StoryManager';
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

  mount(parentElement: HTMLElement): void {
    if (this.game) return;

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
    storyManager.reset();
    evidenceSystem.reset();
    dialogueSystem.reset();
    timerManager.reset();
    puzzleManager.reset();

    this.stopActiveGameplayScenes();
    this.game.scene.start('IntroScene');
  }

  continueGame(): boolean {
    if (!this.game) return false;
    const saved = saveManager.load();
    if (!saved) return false;

    audioManager.unlock();
    saveManager.applySave(saved);
    this.stopActiveGameplayScenes();

    if (saved.currentSceneId === 'ending') {
      this.game.scene.start('EndingScene');
    } else {
      this.game.scene.start('ClassroomScene', {
        sceneId: saved.currentSceneId === 'academy_exterior' ? 'classroom_emergency' : saved.currentSceneId,
        playerPosition: saved.playerPosition,
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
    timerManager.pause();
    audioManager.stopAllLoops();
    dialogueSystem.reset();
    this.stopActiveGameplayScenes();
    this.game.scene.start('MainMenuScene');
  }

  saveCurrentProgress(): boolean {
    if (!this.game) return false;
    const lastPos = this.game.registry.get('lastPlayerPos') as { x: number; y: number } | undefined;
    return saveManager.save('classroom_emergency', lastPos ?? { x: 471, y: 588 });
  }

  private stopActiveGameplayScenes(): void {
    if (!this.game) return;
    ['MainMenuScene', 'IntroScene', 'ClassroomScene', 'PuzzleScene', 'EndingScene'].forEach(
      (key) => {
        if (this.game?.scene.isActive(key) || this.game?.scene.isPaused(key)) {
          this.game.scene.stop(key);
        }
      }
    );
  }

  destroy(): void {
    audioManager.stopAllLoops();
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

export const gameEngine = new GameEngine();
