import Phaser from 'phaser';
import {
  CameraAngleId,
  CharacterId,
  DialogueChoice,
  DialogueLine,
  SceneLayoutConfig,
} from '../types/game';
import { EventBus } from './EventBus';

interface CameraPreset {
  zoom: number;
  x: number; // normalized [0..1]
  y: number; // normalized [0..1]
  durationMs: number;
}

export interface CameraDirectorOptions {
  layout?: SceneLayoutConfig;
  getPlayer?: () => Phaser.GameObjects.Container | null | undefined;
  getCharacterContainers?: () => Map<CharacterId, Phaser.GameObjects.Container> | undefined;
}

const ROOM_W = 1280;
const ROOM_H = 720;

const CAMERA_SHOT_PRESETS: Record<
  Exclude<CameraAngleId, 'wide_master' | 'closeup_samer' | 'two_shot_conversation'>,
  CameraPreset
> = {
  angle_clock_1620: { zoom: 2.35, x: 0.655, y: 0.340, durationMs: 650 },
  angle_window_rain: { zoom: 2.05, x: 0.244, y: 0.560, durationMs: 650 },
  angle_seat7_empty: { zoom: 2.25, x: 0.270, y: 0.680, durationMs: 650 },
  angle_board_cipher: { zoom: 2.05, x: 0.511, y: 0.425, durationMs: 620 },
  angle_door_lock: { zoom: 2.15, x: 0.767, y: 0.515, durationMs: 650 },
  angle_teachers_desk: { zoom: 2.15, x: 0.662, y: 0.535, durationMs: 620 },
  closeup_layan: { zoom: 2.30, x: 0.285, y: 0.605, durationMs: 560 },
  closeup_yacine: { zoom: 2.25, x: 0.538, y: 0.595, durationMs: 560 },
  closeup_nour: { zoom: 2.15, x: 0.233, y: 0.695, durationMs: 560 },
  closeup_mariam: { zoom: 2.20, x: 0.688, y: 0.690, durationMs: 560 },
  closeup_karim: { zoom: 2.20, x: 0.746, y: 0.765, durationMs: 560 },
};

const SPEAKER_FALLBACK_SHOTS: Partial<Record<CharacterId, CameraAngleId>> = {
  layan: 'closeup_layan',
  yacine: 'closeup_yacine',
  nour: 'closeup_nour',
  mariam: 'closeup_mariam',
  karim: 'closeup_karim',
  samer: 'closeup_samer',
};

function clampCenter(cx: number, cy: number, zoom: number, width: number, height: number): { x: number; y: number } {
  const halfW = width / (2 * Math.max(zoom, 1));
  const halfH = height / (2 * Math.max(zoom, 1));
  const clampedX = halfW >= width / 2 ? width / 2 : Phaser.Math.Clamp(cx, halfW, width - halfW);
  const clampedY = halfH >= height / 2 ? height / 2 : Phaser.Math.Clamp(cy, halfH, height - halfH);
  return { x: clampedX, y: clampedY };
}

export class CameraDirector {
  static attach(scene: Phaser.Scene, options: CameraDirectorOptions = {}): () => void {
    const W = options.layout?.baseResolution.width ?? ROOM_W;
    const H = options.layout?.baseResolution.height ?? ROOM_H;
    const masterShot: CameraPreset = {
      zoom: options.layout?.camera?.startZoom ?? 1.15,
      x: options.layout?.camera?.focusTarget?.x ?? 0.515,
      y: options.layout?.camera?.focusTarget?.y ?? 0.545,
      durationMs: 620,
    };

    let activeTween: Phaser.Tweens.Tween | null = null;
    let lastPartnerId: CharacterId | null = null;
    let disposed = false;

    const tweenToPreset = (preset: CameraPreset) => {
      if (disposed || !scene.sys || !scene.cameras?.main) return;
      const cam = scene.cameras.main;

      if (activeTween) {
        activeTween.stop();
        activeTween = null;
      }

      const startZoom = cam.zoom;
      const startCx = cam.scrollX + cam.width * 0.5;
      const startCy = cam.scrollY + cam.height * 0.5;
      const target = clampCenter(preset.x * W, preset.y * H, preset.zoom, W, H);

      const proxy = { zoom: startZoom, cx: startCx, cy: startCy };

      activeTween = scene.tweens.add({
        targets: proxy,
        zoom: preset.zoom,
        cx: target.x,
        cy: target.y,
        duration: preset.durationMs,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          if (disposed || !scene.sys || !scene.cameras?.main) return;
          const clamped = clampCenter(proxy.cx, proxy.cy, proxy.zoom, W, H);
          cam.setZoom(proxy.zoom);
          cam.centerOn(clamped.x, clamped.y);
        },
        onComplete: () => {
          activeTween = null;
        },
      });
    };

    const resolveDynamicPreset = (shotId: CameraAngleId): CameraPreset => {
      if (shotId === 'wide_master') {
        return masterShot;
      }

      if (shotId === 'closeup_samer') {
        const player = options.getPlayer?.();
        const px = player ? player.x : 0.388 * W;
        const py = player ? player.y : 0.788 * H;
        return {
          zoom: 2.05,
          x: px / W,
          y: (py - 90) / H,
          durationMs: 540,
        };
      }

      if (shotId === 'two_shot_conversation') {
        const player = options.getPlayer?.();
        const containers = options.getCharacterContainers?.();
        const partner = lastPartnerId ? containers?.get(lastPartnerId) : undefined;
        if (player && partner) {
          return {
            zoom: 1.72,
            x: ((player.x + partner.x) * 0.5) / W,
            y: (((player.y - 84) + (partner.y - 68)) * 0.5) / H,
            durationMs: 600,
          };
        }
        if (lastPartnerId && SPEAKER_FALLBACK_SHOTS[lastPartnerId]) {
          const fallback = SPEAKER_FALLBACK_SHOTS[lastPartnerId]!;
          if (fallback !== 'wide_master' && fallback !== 'closeup_samer' && fallback !== 'two_shot_conversation') {
            return { ...CAMERA_SHOT_PRESETS[fallback], zoom: 1.72 };
          }
        }
        return masterShot;
      }

      return CAMERA_SHOT_PRESETS[shotId] ?? masterShot;
    };

    const unsubDialogue = EventBus.on<{
      active: boolean;
      line: DialogueLine | null;
      choices?: DialogueChoice[];
    }>('dialogue:state', (state) => {
      if (disposed) return;

      if (!state.active || !state.line) {
        lastPartnerId = null;
        tweenToPreset(masterShot);
        return;
      }

      const line = state.line;
      if (
        line.speaker === 'layan' ||
        line.speaker === 'yacine' ||
        line.speaker === 'nour' ||
        line.speaker === 'mariam' ||
        line.speaker === 'karim'
      ) {
        lastPartnerId = line.speaker;
      }

      let chosenShot: CameraAngleId | undefined = line.cameraShot;
      if (!chosenShot) {
        if ((state.choices && state.choices.length > 0) || line.speaker === 'samer') {
          chosenShot = 'closeup_samer';
        } else if (line.speaker !== 'narrator' && line.speaker !== 'system') {
          chosenShot = SPEAKER_FALLBACK_SHOTS[line.speaker] ?? 'wide_master';
        } else {
          chosenShot = 'wide_master';
        }
      }

      tweenToPreset(resolveDynamicPreset(chosenShot));
    });

    const detach = () => {
      if (disposed) return;
      disposed = true;
      unsubDialogue();
      if (activeTween) {
        activeTween.stop();
        activeTween = null;
      }
    };

    scene.events.once('shutdown', detach);
    return detach;
  }
}
