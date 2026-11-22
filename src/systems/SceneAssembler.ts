import Phaser from 'phaser';
import {
  CharacterId,
  SceneCharacterConfig,
  SceneLayoutConfig,
  SceneObjectConfig,
  WalkablePoint,
} from '../types/game';
import { InteractionSystem } from './InteractionSystem';
import { storyManager } from './StoryManager';

export interface AssembledScene {
  layout: SceneLayoutConfig;
  playerSprite: Phaser.GameObjects.Container | null;
  characterContainers: Map<CharacterId, Phaser.GameObjects.Container>;
  objectNodes: Map<string, Phaser.GameObjects.GameObject>;
  walkablePolygonPx: Phaser.Geom.Polygon | null;
  clampToWalkable: (x: number, y: number) => { x: number; y: number };
  updateDepthsByY: () => void;
}

const CHARACTER_COLORS: Record<CharacterId, number> = {
  samer: 0x38bdf8,
  layan: 0x94a3b8,
  yacine: 0x9f1239,
  nour: 0xf43f5e,
  karim: 0x7dd3fc,
  mariam: 0x64748b,
  adam: 0xdc2626,
  elena: 0xe2e8f0,
};

export const OBJECT_LABELS_AR: Record<string, string> = {
  board: 'السبورة الذكية والأرقام المشفرة',
  wall_clock: 'ساعة الحائط (16:20)',
  teachers_desk: 'مكتب الأستاذ وجدول الجلوس',
  class_photo: 'المقعد السابع الفارغ والصورة المقصوصة',
  attendance_register: 'خزانة الكتب وسجل الحضور التالف',
  door: 'الباب الإلكتروني المغلق',
  projector: 'جهاز العرض (البروجيكتور)',
  broadcast_message_slot: 'شاشة البث',
  door_panel: 'الباب الفولاذي',
  electronic_keypad: 'لوحة القفل الإلكتروني',
};

export function getObjectLabelAr(objectId: string, fallback?: string): string {
  return OBJECT_LABELS_AR[objectId] ?? fallback ?? 'عنصر الفصل';
}

const CHARACTER_LABELS_AR: Record<CharacterId, string> = {
  samer: 'سامر',
  layan: 'التحدث مع ليان',
  yacine: 'التحدث مع ياسين',
  nour: 'التحدث مع نور',
  karim: 'التحدث مع كريم',
  mariam: 'التحدث مع مريم',
  adam: 'آدم مراد',
  elena: 'إيلينا مراد',
};

function getSceneTint(sceneId: string, kind: 'prop' | 'character'): number | null {
  if (sceneId === 'classroom_dark') {
    return kind === 'prop' ? 0x4f6885 : 0x556d88;
  }
  if (sceneId === 'classroom_emergency') {
    return kind === 'prop' ? 0x8ea6c2 : 0xa3b7d0;
  }
  if (sceneId === 'classroom_day') {
    return kind === 'prop' ? 0xeef3f8 : 0xf2f4f8;
  }
  return null;
}

export class SceneAssembler {
  static build(
    scene: Phaser.Scene,
    layout: SceneLayoutConfig,
    interactionSystem: InteractionSystem,
    callbacks: {
      onObjectInteract: (obj: SceneObjectConfig) => void;
      onCharacterInteract: (char: SceneCharacterConfig) => void;
    }
  ): AssembledScene {
    const W = layout.baseResolution.width;
    const H = layout.baseResolution.height;

    // 0. Apply scene camera zoom and focus framing cleanly
    const cam = scene.cameras.main;
    const camZoom = layout.camera?.startZoom ?? 1.0;
    const focusX = (layout.camera?.focusTarget?.x ?? 0.5) * W;
    const focusY = (layout.camera?.focusTarget?.y ?? 0.5) * H;
    cam.setZoom(camZoom);
    cam.centerOn(focusX, focusY);

    // 1. Background image or clean atmospheric fallback
    const bgTextureKey = `bg_${layout.sceneId}`;
    if (scene.textures.exists(bgTextureKey)) {
      scene.add
        .image(W / 2, H / 2, bgTextureKey)
        .setDisplaySize(W, H)
        .setDepth(0);
    } else {
      const ambientHex = parseInt(layout.lighting.ambientColor.replace('#', ''), 16) || 0x0b1220;
      const g = scene.add.graphics().setDepth(0);
      g.fillStyle(ambientHex, 1);
      g.fillRect(0, 0, W, H);
      const floorY = layout.floorLineY * H;
      g.fillStyle(0x0f172a, 0.85);
      g.fillRect(0, floorY, W, H - floorY);
      g.lineStyle(1, 0x334155, 0.6);
      g.lineBetween(0, floorY, W, floorY);
    }

    // 2. Walkable polygon
    let walkablePolygonPx: Phaser.Geom.Polygon | null = null;
    if (layout.walkableArea.length >= 3) {
      const pts = layout.walkableArea.map((p: WalkablePoint) => new Phaser.Math.Vector2(p.x * W, p.y * H));
      walkablePolygonPx = new Phaser.Geom.Polygon(pts);
    }

    const propTint = getSceneTint(layout.sceneId, 'prop');
    const charTint = getSceneTint(layout.sceneId, 'character');

    // 3. Objects (baked architectural zones vs foreground depth-sorted props)
    const objectNodes = new Map<string, Phaser.GameObjects.GameObject>();
    for (const obj of layout.objects) {
      if (obj.conditionFlag && storyManager.getFlag(obj.conditionFlag) !== true) {
        continue;
      }

      const ox = obj.origin?.[0] ?? 0.5;
      const oy = obj.origin?.[1] ?? 0.5;
      const px = obj.x * W;
      const py = obj.y * H;
      const pw = obj.w * W;
      const ph = obj.h * H;
      const depth = obj.depthMode === 'by_y' ? Math.round(py) : (obj.depth ?? 10);

      if (obj.visualMode !== 'baked') {
        const objTextureKey = obj.textureKey ?? `obj_${obj.id}`;
        let node: Phaser.GameObjects.GameObject;
        if (scene.textures.exists(objTextureKey)) {
          if (obj.shadow) {
            const shadowBasisW = pw > 0 ? pw : ph * 0.82;
            scene.add
              .ellipse(px, py - 2, Math.max(64, shadowBasisW * 0.85), Math.max(12, ph * 0.14), 0x030712, 0.44)
              .setDepth(depth - 1);
          }
          const img = scene.add
            .image(px, py, objTextureKey)
            .setOrigin(ox, oy)
            .setDepth(depth);
          if (obj.w > 0 && obj.h > 0) {
            img.setDisplaySize(pw, ph);
          } else if (obj.h > 0) {
            const scale = ph / Math.max(img.height, 1);
            img.setScale(scale);
          }
          if (obj.flipX) img.setFlipX(true);
          if (propTint !== null) img.setTint(propTint);
          node = img;
        } else {
          const rect = scene.add
            .rectangle(px, py, pw, ph, 0x1e293b, 0.72)
            .setOrigin(ox, oy)
            .setStrokeStyle(1.5, obj.interactive ? 0x64748b : 0x334155, 0.9)
            .setDepth(depth);
          node = rect;
        }
        objectNodes.set(obj.id, node);
      }

      if (obj.interactive && obj.interactionZone) {
        const iz = obj.interactionZone;
        const zx = (iz.x + iz.w / 2) * W;
        const zy = (iz.y + iz.h / 2) * H;
        const zw = iz.w * W;
        const zh = iz.h * H;

        const zone = scene.add.zone(zx, zy, zw, zh).setDepth(950);
        const highlight = scene.add
          .rectangle(zx, zy, zw, zh)
          .setStrokeStyle(2, 0xd6a65d, 0.85)
          .setFillStyle(0x38bdf8, 0.08)
          .setVisible(false)
          .setDepth(940);

        interactionSystem.register({
          id: obj.id,
          labelAr: getObjectLabelAr(obj.id, obj.label),
          labelEn: obj.label,
          x: zx,
          y: zy,
          zone,
          highlightRect: highlight,
          onInteract: () => callbacks.onObjectInteract(obj),
        });
      }
    }

    // 4. Characters (origin [0.5, 1.0], depth by_y, standing or seated sprite)
    const characterContainers = new Map<CharacterId, Phaser.GameObjects.Container>();
    let playerSprite: Phaser.GameObjects.Container | null = null;

    for (const ch of layout.characters) {
      if (ch.conditionFlag && storyManager.getFlag(ch.conditionFlag) !== true) {
        continue;
      }
      if (ch.hiddenWhenFlag && storyManager.getFlag(ch.hiddenWhenFlag) === true) {
        continue;
      }

      const cx = ch.x * W;
      const cy = ch.y * H;
      const charH = (ch.normHeight ?? 0.30) * H;
      const charW = charH * 0.34;
      const container = scene.add.container(cx, cy);

      const seatedKey = `char_${ch.id}_seated`;
      const bodyKey = `char_${ch.id}_body`;
      const spriteKey =
        ch.pose === 'seated' && scene.textures.exists(seatedKey) ? seatedKey : bodyKey;

      if (scene.textures.exists(spriteKey)) {
        const shadowW = ch.pose === 'seated' ? charW * 1.45 : charW * 1.15;
        const shadow = scene.add.ellipse(0, 0, shadowW, 12, 0x020617, 0.55);
        const img = scene.add.image(0, 0, spriteKey).setOrigin(0.5, 1.0);
        const scale = charH / Math.max(img.height, 1);
        img.setScale(scale);
        if (ch.facing === 'left' && ch.pose !== 'seated') {
          img.setFlipX(true);
        }
        if (charTint !== null) {
          img.setTint(charTint);
        }
        container.add([shadow, img]);
      } else {
        const accent = CHARACTER_COLORS[ch.id] ?? 0xe2e8f0;
        const body = scene.add
          .rectangle(0, -charH * 0.42, charW, charH * 0.78, 0x162238, 0.96)
          .setStrokeStyle(2, accent, 0.9);
        const head = scene.add
          .circle(0, -charH * 0.88, charW * 0.32, 0x1e293b, 1)
          .setStrokeStyle(2, accent, 0.9);
        const shadow = scene.add.ellipse(0, 0, charW * 1.05, 12, 0x020617, 0.55);
        container.add([shadow, body, head]);
      }

      const depthVal = ch.depthMode === 'fixed' ? (ch.depth ?? 40) : Math.round(cy);
      container.setDepth(depthVal);
      characterContainers.set(ch.id, container);

      if (ch.id === 'samer') {
        playerSprite = container;
      }

      if (ch.interactive && ch.interactionZone) {
        const iz = ch.interactionZone;
        const zx = (iz.x + iz.w / 2) * W;
        const zy = (iz.y + iz.h / 2) * H;
        const zw = iz.w * W;
        const zh = iz.h * H;

        const zone = scene.add.zone(zx, zy, zw, zh).setDepth(950);
        const highlight = scene.add
          .rectangle(zx, zy, zw, zh)
          .setStrokeStyle(2, 0xd6a65d, 0.85)
          .setFillStyle(0xd6a65d, 0.06)
          .setVisible(false)
          .setDepth(940);

        interactionSystem.register({
          id: `char_${ch.id}`,
          labelAr: CHARACTER_LABELS_AR[ch.id] ?? ch.label,
          labelEn: `Talk to ${ch.label}`,
          x: cx,
          y: cy - charH * 0.45,
          zone,
          highlightRect: highlight,
          onInteract: () => callbacks.onCharacterInteract(ch),
        });
      }
    }

    const clampToWalkable = (targetX: number, targetY: number): { x: number; y: number } => {
      if (!walkablePolygonPx || layout.walkableArea.length < 3) {
        return { x: targetX, y: targetY };
      }
      if (Phaser.Geom.Polygon.Contains(walkablePolygonPx, targetX, targetY)) {
        return { x: targetX, y: targetY };
      }
      const ys = layout.walkableArea.map((p) => p.y * H);
      const xs = layout.walkableArea.map((p) => p.x * W);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      return {
        x: Phaser.Math.Clamp(targetX, minX + 14, maxX - 14),
        y: Phaser.Math.Clamp(targetY, minY + 4, maxY - 4),
      };
    };

    const updateDepthsByY = (): void => {
      layout.characters.forEach((ch) => {
        if (ch.depthMode === 'by_y') {
          const container = characterContainers.get(ch.id);
          if (container) {
            container.setDepth(Math.round(container.y));
          }
        }
      });
    };

    return {
      layout,
      playerSprite,
      characterContainers,
      objectNodes,
      walkablePolygonPx,
      clampToWalkable,
      updateDepthsByY,
    };
  }
}
