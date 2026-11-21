import Phaser from 'phaser';
import { dialogueSystem } from '../../systems/DialogueSystem';
import { EventBus } from '../../systems/EventBus';
import { evidenceSystem } from '../../systems/EvidenceSystem';
import { puzzleManager } from '../../systems/PuzzleManager';
import {
  DialogueConversation,
  EvidenceItem,
  PuzzleSeatingConfig,
  SceneLayoutConfig,
} from '../../types/game';

const SCENE_IDS = [
  'academy_exterior',
  'academy_entrance',
  'classroom_day',
  'classroom_dark',
  'classroom_emergency',
  'desk7_closeup',
  'projector_closeup',
  'door_closeup',
  'puzzle_seating',
] as const;

export class PreloadScene extends Phaser.Scene {
  private missingAssets: string[] = [];

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.missingAssets = [];

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      this.missingAssets.push(file.key);
      console.warn(`[PreloadScene] Missing or failed asset: ${file.key} (${file.url})`);
    });

    this.load.on('progress', (value: number) => {
      EventBus.emit('preload:progress', Math.round(value * 100));
    });

    // Required JSON configs
    SCENE_IDS.forEach((id) => {
      this.load.json(`scene_${id}`, `/assets/config/scenes/${id}.json`);
    });
    this.load.json('data_evidence', '/assets/config/data/evidence.json');
    this.load.json('data_dialogues', '/assets/config/data/dialogues.json');
    this.load.json('data_puzzles', '/assets/config/data/puzzles.json');

    // Master 1280x720 backgrounds
    SCENE_IDS.filter((id) => id !== 'puzzle_seating').forEach((id) => {
      const fileMap: Record<string, string> = {
        projector_closeup: 'classroom_projector_closeup.webp',
        door_closeup: 'classroom_door_closeup.webp',
        desk7_closeup: 'classroom_desk7_closeup.webp',
      };
      const file = fileMap[id] ?? `${id}.webp`;
      this.load.image(`bg_${id}`, `/assets/backgrounds/${file}`);
    });

    // Furniture & prop WebP assets (extracted RGBA)
    this.load.image('obj_desk_wooden', '/assets/objects/desk_wooden.webp');
    this.load.image('obj_chair_wooden', '/assets/objects/chair_wooden.webp');
    this.load.image('obj_chair_board', '/assets/objects/chair_board.webp');

    const objectAssets: Array<[string, string]> = [
      ['obj_board', '/assets/objects/board.svg'],
      ['obj_wall_clock', '/assets/objects/wall_clock.svg'],
      ['obj_teachers_desk', '/assets/objects/teachers_desk.svg'],
      ['obj_class_photo', '/assets/objects/class_photo.svg'],
      ['obj_desk_slot_7', '/assets/objects/class_photo.svg'],
      ['obj_attendance_register', '/assets/objects/attendance_register.svg'],
      ['obj_side_table', '/assets/objects/attendance_register.svg'],
      ['obj_door', '/assets/objects/door.svg'],
      ['obj_door_panel', '/assets/objects/door.svg'],
      ['obj_electronic_keypad', '/assets/objects/electronic_keypad.svg'],
      ['obj_projector', '/assets/objects/projector.svg'],
      ['obj_dropped_bottle', '/assets/objects/dropped_bottle.svg'],
    ];

    objectAssets.forEach(([key, url]) => {
      this.load.svg(key, url);
    });

    // Standing + seated character world sprites (alpha-transparent WebP)
    const worldCharIds = ['samer', 'layan', 'yacine', 'nour', 'karim', 'mariam'] as const;
    worldCharIds.forEach((cid) => {
      this.load.image(`char_${cid}_body`, `/assets/characters/world/${cid}_world.webp`);
    });
    const seatedCharIds = ['layan', 'yacine', 'karim', 'mariam'] as const;
    seatedCharIds.forEach((cid) => {
      this.load.image(`char_${cid}_seated`, `/assets/characters/world/${cid}_seated.webp`);
    });
    this.load.image('portrait_adam_neutral', '/assets/characters/portraits/adam/neutral.webp');
    this.load.image('portrait_adam_intense', '/assets/characters/portraits/adam/intense.webp');
    this.load.image('portrait_elena_archival', '/assets/characters/portraits/elena/archival.webp');
    this.load.svg('ui_interact_prompt', '/assets/ui/interact_prompt.svg');
  }

  create(): void {
    // Hydrate scene layout cache into registry
    const sceneConfigs: Record<string, SceneLayoutConfig> = {};
    SCENE_IDS.forEach((id) => {
      const cfg = this.cache.json.get(`scene_${id}`) as SceneLayoutConfig | undefined;
      if (cfg) {
        sceneConfigs[id] = cfg;
      } else {
        this.missingAssets.push(`scene_${id}.json`);
      }
    });
    this.registry.set('sceneConfigs', sceneConfigs);

    // Hydrate gameplay systems
    const evidence = this.cache.json.get('data_evidence') as EvidenceItem[] | undefined;
    if (evidence) evidenceSystem.loadCatalog(evidence);

    const dialogues = this.cache.json.get('data_dialogues') as DialogueConversation[] | undefined;
    if (dialogues) dialogueSystem.loadConversations(dialogues);

    const puzzle = this.cache.json.get('data_puzzles') as PuzzleSeatingConfig | undefined;
    if (puzzle) puzzleManager.loadConfig(puzzle);

    if (this.missingAssets.length > 0) {
      EventBus.emit('warning:assets_missing', this.missingAssets);
    }

    EventBus.emit('preload:complete', { missingCount: this.missingAssets.length });
    this.scene.start('MainMenuScene');
  }
}
