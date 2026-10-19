// ============================================================================
// Offline tile-sprite generator for the fine-pixel isometric garden.
//
// Renders every ground tile ONCE into a transparent 2:1 isometric diamond
// sprite (top face + extruded rock/dirt sides, like a floating-island edge)
// and embeds them as base64 PNGs in src/app/rendering/tile-art.ts.
//
//   node tools/generate-tiles.mjs
//
// Deterministic PRNG => identical output on every run.
// ============================================================================
import { createCanvas } from 'canvas';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/app/rendering/tile-art.ts');

// ---- tile geometry (fine pixel art: 40px wide diamonds @2:1) --------------
export const TILE_W = 40; // full diamond width  in sprite px
export const TILE_H = 20; // full diamond height in sprite px (2:1 iso)
export const DEPTH = 12; // extruded side height (the "3D" of the slab)

// deterministic PRNG (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

function mix(c1, c2, t) {
  return [0, 1, 2].map((i) => Math.round(c1[i] + (c2[i] - c1[i]) * t));
}

/**
 * Paint one iso-tile: top diamond filled by `shade(x,y)` plus extruded
 * left/right side faces. All pixels snap to the integer grid => crisp.
 */
function makeTile({ top, sideRight, sideLeft, shade, seed, outline = '#141a12' }) {
  const W = TILE_W;
  const H = TILE_H + DEPTH;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const put = (x, y, rgb, a = 255) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    img.data[i] = rgb[0];
    img.data[i + 1] = rgb[1];
    img.data[i + 2] = rgb[2];
    img.data[i + 3] = a;
  };
  const rand = rng(seed);
  const cx = W / 2;
  const cy = TILE_H / 2;
  const o = hex(outline);

  // --- side faces (extrusion below the two lower diamond edges) -----------
  const sr = hex(sideRight);
  const sl = hex(sideLeft);
  for (let d = 0; d < DEPTH; d++) {
    for (let x = 0; x <= cx; x++) {
      // left-lower edge runs from (0, cy) to (cx, TILE_H): slope 0.5
      const edgeY = Math.round(cy + x * 0.5);
      const jitter = rand() < 0.18 ? 1 : 0; // rough rocky silhouette
      put(x, edgeY + d - 1 + jitter, mix(sl, [0, 0, 0], rand() * 0.22));
    }
    for (let x = cx; x < W; x++) {
      const edgeY = Math.round(TILE_H - (x - cx) * 0.5);
      const jitter = rand() < 0.18 ? 1 : 0;
      put(x, edgeY + d - 1 + jitter, mix(sr, [0, 0, 0], rand() * 0.22));
    }
  }
  // grass fringe overhanging the soil sides (for tiles that want it)
  if (shade.fringe) {
    const fr = hex(shade.fringe);
    for (let x = 0; x < W; x++) {
      const edgeY = Math.round(cy + Math.abs(x - cx) * 0.5);
      for (let t = 0; t < 2; t++) {
        if (rand() < 0.75) put(x, edgeY + t, mix(fr, [0, 0, 0], rand() * 0.3));
      }
    }
  }

  // --- top face -------------------------------------------------------------
  for (let y = 0; y < TILE_H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x + 0.5 - cx) / cx;
      const dy = Math.abs(y + 0.5 - cy) / cy;
      const s = dx + dy;
      if (s > 1) continue;
      const col = shade(x, y, rand);
      if (!col) continue;
      let rgb = typeof col === 'string' ? hex(col) : col;
      // subtle AO toward the rim + dark outline pixel
      if (s > 0.93) rgb = mix(rgb, o, 0.55);
      else if (s > 0.82) rgb = mix(rgb, o, 0.18);
      put(x, y, rgb);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer('image/png').toString('base64');
}

// ---------------------------------------------------------------------------
// Shade functions per surface type
// ---------------------------------------------------------------------------
const C = {
  g1: '#3e9d44', // grass mid
  g2: '#57c04f', // grass light
  g3: '#79e06a', // grass highlight
  g4: '#2a6e2c', // grass dark
  g5: '#1c4d22', // grass shadow
  dg1: '#8a5a2b', // dirt/rock mid
  dg2: '#6b4423',
  dg3: '#4d2f16',
  dg4: '#a9743c',
  st1: '#9aa0ae', // stone mid
  st2: '#c2c8d6', // stone light
  st3: '#6b7080', // stone dark
  st4: '#464b5c', // grout
  st5: '#7f8698',
  so1: '#6b4423', // soil mid
  so2: '#4d2f16',
  so3: '#8a5a2b',
  so4: '#331e0e',
};

/** grass: soft speckle noise + blade flecks */
function grassShade(_variant) {
  const fn = (x, y, rand) => {
    const v = rand();
    if (v < 0.4) return C.g1;
    if (v < 0.68) return C.g2;
    if (v < 0.8) return C.g3;
    if (v < 0.94) return C.g4;
    return C.g5;
  };
  fn.fringe = C.g4;
  return fn;
}

/** stone path: cobbles aligned to the iso axes with grout between them */
function stoneShade(variant) {
  const fn = (x, y, rand) => {
    // iso-aligned cobble lattice: u along (1,0.5), v along (-1,0.5) screen dirs
    const u = x + 2 * y;
    const v = x - 2 * y + 80;
    const cellU = Math.floor(u / 10);
    const cellV = Math.floor(v / 8);
    const mu = ((u % 10) + 10) % 10;
    const mv = ((v % 8) + 8) % 8;
    const grout = mu === 0 || mv === 0;
    const hash = ((cellU * 73856093) ^ (cellV * 19349663) ^ (variant * 8321)) >>> 0;
    const r = (hash % 97) / 97;
    if (grout) return rand() < 0.3 ? mix(hex(C.st4), [0, 0, 0], 0.25) : C.st4;
    // per-cobble tone + top-light / bottom-shade gradient
    const base = r < 0.35 ? C.st1 : r < 0.62 ? C.st5 : r < 0.85 ? C.st2 : C.st3;
    const lum = (mu + mv) / 18; // brighter near top of cobble
    let rgb = hex(base);
    rgb = mix(rgb, [255, 255, 255], Math.max(0, 0.16 - lum * 0.16));
    rgb = mix(rgb, [0, 0, 0], Math.max(0, lum * 0.22 - 0.04));
    if (rand() < 0.05) rgb = mix(rgb, [0, 0, 0], 0.35); // chips
    return rgb;
  };
  return fn;
}

/** soil patch: dark tilled earth with furrows running along an iso axis */
function soilShade() {
  const fn = (x, y, rand) => {
    const furrow = (x + 2 * y) % 8 < 2;
    if (furrow) return rand() < 0.5 ? C.so4 : C.so2;
    const v = rand();
    if (v < 0.45) return C.so1;
    if (v < 0.72) return C.so2;
    if (v < 0.9) return C.so3;
    return C.so4;
  };
  return fn;
}

// ---------------------------------------------------------------------------
// Build all variants (two alternating variants per type for organic look)
// ---------------------------------------------------------------------------
const specs = {
  GRASS_A: { top: null, sideRight: C.dg1, sideLeft: C.dg2, shade: grassShade(0), seed: 101 },
  GRASS_B: { top: null, sideRight: C.dg1, sideLeft: C.dg2, shade: grassShade(1), seed: 202 },
  GRASS_C: { top: null, sideRight: C.dg1, sideLeft: C.dg2, shade: grassShade(2), seed: 303 },
  STONE_A: { top: null, sideRight: C.st3, sideLeft: C.st4, shade: stoneShade(0), seed: 404 },
  STONE_B: { top: null, sideRight: C.st3, sideLeft: C.st4, shade: stoneShade(1), seed: 505 },
  STONE_C: { top: null, sideRight: C.st3, sideLeft: C.st4, shade: stoneShade(2), seed: 606 },
  SOIL: { top: null, sideRight: C.dg3, sideLeft: C.dg2, shade: soilShade(), seed: 707 },
};

const out = [];
out.push(`// AUTO-GENERATED by tools/generate-tiles.mjs — DO NOT EDIT BY HAND.`);
out.push(`// Fine-pixel isometric ground tiles: 2:1 diamonds with extruded sides.`);
out.push(`export const TILE_W = ${TILE_W};`);
out.push(`export const TILE_H = ${TILE_H};`);
out.push(`export const TILE_DEPTH = ${DEPTH};`);
out.push(`export const SPRITE_H = ${TILE_H + DEPTH};`);
for (const [name, spec] of Object.entries(specs)) {
  const b64 = makeTile(spec);
  out.push(`export const ${name} =\n  'data:image/png;base64,${b64}';`);
}
writeFileSync(OUT, out.join('\n') + '\n');
console.log('wrote', OUT);
