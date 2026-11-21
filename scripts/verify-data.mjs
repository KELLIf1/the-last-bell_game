#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_ASSETS = path.join(ROOT, 'public', 'assets');
const DATA_DIR = path.join(PUBLIC_ASSETS, 'config', 'data');
const SCENES_DIR = path.join(PUBLIC_ASSETS, 'config', 'scenes');
const STORY_MANAGER_PATH = path.join(ROOT, 'src', 'systems', 'StoryManager.ts');
const PRELOAD_SCENE_PATH = path.join(ROOT, 'src', 'game', 'scenes', 'PreloadScene.ts');

const errors = [];

function fail(msg) {
  errors.push(msg);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    fail(`Invalid JSON in ${path.relative(ROOT, filePath)}: ${err.message}`);
    return null;
  }
}

function assetExists(relFromPublicAssets) {
  const clean = relFromPublicAssets.replace(/^\/?assets\//, '');
  return fs.existsSync(path.join(PUBLIC_ASSETS, clean));
}

// 1. Parse DEFAULT_FLAGS from src/systems/StoryManager.ts
const storySrc = fs.readFileSync(STORY_MANAGER_PATH, 'utf8');
const defaultFlagsMatch = storySrc.match(/const DEFAULT_FLAGS[^=]*=\s*\{([\s\S]*?)\};/);
if (!defaultFlagsMatch) {
  fail('Could not locate DEFAULT_FLAGS in src/systems/StoryManager.ts');
}
const declaredFlags = new Set();
if (defaultFlagsMatch) {
  for (const m of defaultFlagsMatch[1].matchAll(/^\s*([a-zA-Z0-9_]+)\s*:/gm)) {
    declaredFlags.add(m[1]);
  }
}

function checkConditionFlags(cond, contextLabel) {
  if (!cond || typeof cond !== 'object') return;
  if (typeof cond.flag === 'string' && !declaredFlags.has(cond.flag)) {
    fail(`[Flags] ${contextLabel}: undeclared condition flag "${cond.flag}"`);
  }
  if (Array.isArray(cond.allOf)) {
    cond.allOf.forEach((sub, idx) => checkConditionFlags(sub, `${contextLabel}.allOf[${idx}]`));
  }
  if (Array.isArray(cond.anyOf)) {
    cond.anyOf.forEach((sub, idx) => checkConditionFlags(sub, `${contextLabel}.anyOf[${idx}]`));
  }
  if (cond.not) {
    checkConditionFlags(cond.not, `${contextLabel}.not`);
  }
}

// 2. Parse preloaded texture keys & file paths from src/game/scenes/PreloadScene.ts
const preloadSrc = fs.readFileSync(PRELOAD_SCENE_PATH, 'utf8');
const preloadedTextures = new Map();

for (const m of preloadSrc.matchAll(/this\.load\.(?:image|svg)\(\s*['"]([^'"]+)['"]\s*,\s*['"](\/assets\/[^'"]+)['"]\s*\)/g)) {
  preloadedTextures.set(m[1], m[2]);
}
for (const m of preloadSrc.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"](\/assets\/[^'"]+)['"]\s*\]/g)) {
  preloadedTextures.set(m[1], m[2]);
}

// Verify all static asset URLs in PreloadScene exist on disk
for (const [key, urlPath] of preloadedTextures.entries()) {
  if (!assetExists(urlPath)) {
    fail(`[PreloadScene] Texture "${key}" points to missing file "${urlPath}"`);
  }
}

// 3. Load evidence, dialogues, puzzles
const evidenceList = readJson(path.join(DATA_DIR, 'evidence.json')) ?? [];
const dialoguesList = readJson(path.join(DATA_DIR, 'dialogues.json')) ?? [];
const puzzleData = readJson(path.join(DATA_DIR, 'puzzles.json'));

const evidenceById = new Map();
for (const item of evidenceList) {
  if (!item?.id) {
    fail('[evidence.json] Entry missing "id"');
    continue;
  }
  if (evidenceById.has(item.id)) {
    fail(`[evidence.json] Duplicate evidence id "${item.id}"`);
  }
  evidenceById.set(item.id, item);

  if (item.setsFlag && !declaredFlags.has(item.setsFlag)) {
    fail(`[Flags] evidence.json "${item.id}" setsFlag "${item.setsFlag}" is not in StoryManager DEFAULT_FLAGS`);
  }
  if (item.icon) {
    const iconRel = `ui/icons/${item.icon}.svg`;
    if (!assetExists(iconRel)) {
      fail(`[evidence.json] Icon missing for "${item.id}": /assets/${iconRel}`);
    }
  }
}

// 4. Validate dialogues.json (nextNodeId, unlockClueIds, conditions, setFlags, portraits)
const conversationIds = new Set();
for (const conv of dialoguesList) {
  if (!conv?.id || !conv.nodes || typeof conv.nodes !== 'object') {
    fail(`[dialogues.json] Invalid conversation structure: ${JSON.stringify(conv?.id)}`);
    continue;
  }
  conversationIds.add(conv.id);

  if (!conv.entryNodeId || !conv.nodes[conv.entryNodeId]) {
    fail(`[dialogues.json] Conversation "${conv.id}" entryNodeId "${conv.entryNodeId}" not found in nodes`);
  }

  for (const [nodeKey, node] of Object.entries(conv.nodes)) {
    if (node.id !== nodeKey) {
      fail(`[dialogues.json] "${conv.id}.${nodeKey}": node.id ("${node.id}") mismatches key "${nodeKey}"`);
    }
    if (node.nextNodeId && !conv.nodes[node.nextNodeId]) {
      fail(`[dialogues.json] "${conv.id}.${nodeKey}": nextNodeId "${node.nextNodeId}" does not exist`);
    }
    if (Array.isArray(node.unlockClueIds)) {
      for (const clueId of node.unlockClueIds) {
        if (!evidenceById.has(clueId)) {
          fail(`[dialogues.json] "${conv.id}.${nodeKey}": unlockClueId "${clueId}" not found in evidence.json`);
        }
      }
    }
    if (node.condition) {
      checkConditionFlags(node.condition, `dialogues.json:${conv.id}.${nodeKey}.condition`);
    }
    if (node.setFlags && typeof node.setFlags === 'object') {
      for (const flagName of Object.keys(node.setFlags)) {
        if (!declaredFlags.has(flagName)) {
          fail(`[Flags] dialogues.json "${conv.id}.${nodeKey}" setFlags "${flagName}" is not in StoryManager DEFAULT_FLAGS`);
        }
      }
    }
    if (Array.isArray(node.choices)) {
      for (const choice of node.choices) {
        if (choice.nextNodeId && !conv.nodes[choice.nextNodeId]) {
          fail(`[dialogues.json] "${conv.id}.${nodeKey}" choice "${choice.id}": nextNodeId "${choice.nextNodeId}" does not exist`);
        }
        if (Array.isArray(choice.unlockClueIds)) {
          for (const clueId of choice.unlockClueIds) {
            if (!evidenceById.has(clueId)) {
              fail(`[dialogues.json] "${conv.id}.${nodeKey}" choice "${choice.id}": unlockClueId "${clueId}" not found in evidence.json`);
            }
          }
        }
        if (choice.condition) {
          checkConditionFlags(choice.condition, `dialogues.json:${conv.id}.${nodeKey}.choices[${choice.id}].condition`);
        }
        if (choice.setFlags && typeof choice.setFlags === 'object') {
          for (const flagName of Object.keys(choice.setFlags)) {
            if (!declaredFlags.has(flagName)) {
              fail(`[Flags] dialogues.json "${conv.id}.${nodeKey}" choice "${choice.id}" setFlags "${flagName}" is not in StoryManager DEFAULT_FLAGS`);
            }
          }
        }
      }
    }

    // Check dialogue portrait file existence on disk
    if (node.speaker && node.speaker !== 'narrator' && node.speaker !== 'system') {
      let portraitRel;
      if (node.speaker === 'elena') {
        portraitRel = 'characters/portraits/elena/archival.webp';
      } else if (node.speaker === 'adam') {
        const st = node.expression === 'angry' || node.expression === 'worried' ? 'intense' : 'neutral';
        portraitRel = `characters/portraits/adam/${st}.webp`;
      } else {
        const expr = node.expression ?? 'neutral';
        const st = node.speaking && expr === 'neutral' ? 'speaking' : expr;
        portraitRel = `characters/portraits/${node.speaker}/${st}.webp`;
      }
      if (!assetExists(portraitRel)) {
        fail(`[dialogues.json] "${conv.id}.${nodeKey}": portrait missing at /assets/${portraitRel}`);
      }
    }
  }
}

// 5. Validate puzzles.json
if (puzzleData) {
  if (puzzleData.unlockCondition) {
    checkConditionFlags(puzzleData.unlockCondition, 'puzzles.json:unlockCondition');
  }
  if (Array.isArray(puzzleData.boardSequenceReveal)) {
    for (const slot of puzzleData.boardSequenceReveal) {
      if (Array.isArray(slot.requiredFlags)) {
        for (const f of slot.requiredFlags) {
          if (!declaredFlags.has(f)) {
            fail(`[Flags] puzzles.json boardSequenceReveal position ${slot.position} requiredFlag "${f}" is not in StoryManager DEFAULT_FLAGS`);
          }
        }
      }
    }
  }
  const labelIds = new Set((puzzleData.labels ?? []).map((l) => l.id));
  for (const slotId of puzzleData.photoSlotsOrder ?? []) {
    if (!labelIds.has(slotId)) {
      fail(`[puzzles.json] photoSlotsOrder id "${slotId}" missing from labels`);
    }
  }
}

// 6. Validate scenes/*.json
const sceneFiles = fs.readdirSync(SCENES_DIR).filter((f) => f.endsWith('.json')).sort();
const knownSceneIds = new Set(sceneFiles.map((f) => f.replace(/\.json$/, '')));

const bgFileMap = {
  projector_closeup: 'classroom_projector_closeup.webp',
  door_closeup: 'classroom_door_closeup.webp',
  desk7_closeup: 'classroom_desk7_closeup.webp',
};

for (const file of sceneFiles) {
  const scenePath = path.join(SCENES_DIR, file);
  const cfg = readJson(scenePath);
  if (!cfg) continue;

  const sceneId = cfg.sceneId;
  if (`${sceneId}.json` !== file) {
    fail(`[scenes/${file}] sceneId "${sceneId}" does not match filename`);
  }

  // Check scene background asset (skip puzzle_seating modal scene and visual workspace if headless)
  if (sceneId !== 'puzzle_seating') {
    const bgFile = bgFileMap[sceneId] ?? `${sceneId}.webp`;
    if (!assetExists(`backgrounds/${bgFile}`)) {
      fail(`[scenes/${file}] Missing background asset /assets/backgrounds/${bgFile}`);
    }
  }

  // Check scene evidence array
  for (const evId of cfg.evidence ?? []) {
    if (!evidenceById.has(evId)) {
      fail(`[scenes/${file}] evidence[] references unknown id "${evId}"`);
    }
  }

  // Check scene objects
  for (const obj of cfg.objects ?? []) {
    if (obj.conditionFlag && !declaredFlags.has(obj.conditionFlag)) {
      fail(`[Flags] scenes/${file} object "${obj.id}" conditionFlag "${obj.conditionFlag}" is not in StoryManager DEFAULT_FLAGS`);
    }
    if (obj.evidenceId && !evidenceById.has(obj.evidenceId)) {
      fail(`[scenes/${file}] object "${obj.id}" references unknown evidenceId "${obj.evidenceId}"`);
    }
    // Check asset availability for non-baked objects in non-UI scenes
    if (obj.visualMode !== 'baked' && sceneId !== 'puzzle_seating') {
      const texKey = obj.textureKey ?? `obj_${obj.id}`;
      const preloadedPath = preloadedTextures.get(texKey);
      if (!preloadedPath) {
        fail(`[scenes/${file}] non-baked object "${obj.id}" requires textureKey "${texKey}" which is not preloaded in PreloadScene.ts`);
      } else if (!assetExists(preloadedPath)) {
        fail(`[scenes/${file}] object "${obj.id}" textureKey "${texKey}" -> missing file "${preloadedPath}"`);
      }
    }
  }

  // Check scene characters
  for (const ch of cfg.characters ?? []) {
    if (ch.conditionFlag && !declaredFlags.has(ch.conditionFlag)) {
      fail(`[Flags] scenes/${file} character "${ch.id}" conditionFlag "${ch.conditionFlag}" is not in StoryManager DEFAULT_FLAGS`);
    }
    if (ch.hiddenWhenFlag && !declaredFlags.has(ch.hiddenWhenFlag)) {
      fail(`[Flags] scenes/${file} character "${ch.id}" hiddenWhenFlag "${ch.hiddenWhenFlag}" is not in StoryManager DEFAULT_FLAGS`);
    }
    const worldRel = `characters/world/${ch.id}_world.webp`;
    const seatedRel = `characters/world/${ch.id}_seated.webp`;
    if (ch.pose === 'seated') {
      if (!assetExists(seatedRel) && !assetExists(worldRel)) {
        fail(`[scenes/${file}] seated character "${ch.id}" missing sprite at /assets/${seatedRel} or /assets/${worldRel}`);
      }
    } else {
      if (!assetExists(worldRel)) {
        fail(`[scenes/${file}] standing character "${ch.id}" missing sprite at /assets/${worldRel}`);
      }
    }
  }

  // Check transitions
  for (const tr of cfg.transitions ?? []) {
    if (tr.to && tr.to !== 'ending' && !knownSceneIds.has(tr.to)) {
      fail(`[scenes/${file}] transition target scene "${tr.to}" does not exist`);
    }
    if (tr.condition) {
      checkConditionFlags(tr.condition, `scenes/${file}:transitions[${tr.to}]`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\n[verify-data] FAILED with ${errors.length} error(s):\n`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `[verify-data] OK — verified ${sceneFiles.length} scenes, ${dialoguesList.length} conversations, ${evidenceList.length} evidence/clue entries, 1 puzzle config, and ${declaredFlags.size} declared StoryManager flags.`
);
