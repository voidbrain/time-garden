// ============================================================================
// Fine-pixel billboard sprites for the isometric garden stage.
// Character-grid painting system with a richer palette (flowers, trees,
// hero, fountain, wall). '.' = transparent.
// ============================================================================

export const TILE = 26; // world-unit size used for sprite scaling math

const PAL: Record<string, string> = {
  '.': '',
  // ---- grass / leaves (5-tone) ----
  g: '#3e9d44',
  G: '#57c04f',
  h: '#79e06a',
  l: '#a8ef7c',
  d: '#2a6e2c',
  D: '#1c4d22',
  k: '#12331a',
  // ---- wood / earth ----
  e: '#8a5a2b',
  E: '#a9743c',
  f: '#6b4423',
  F: '#4d2f16',
  n: '#331e0e',
  m: '#caa27a',
  t: '#e8cba0',
  T: '#f7e6c2',
  // ---- stone ----
  s: '#9aa0ae',
  S: '#c2c8d6',
  q: '#6b7080',
  Q: '#464b5c',
  z: '#2b2e3c',
  Z: '#191b26',
  // ---- water / ice ----
  w: '#2a6fdc',
  W: '#4fa8f0',
  u: '#7fd0ff',
  U: '#cdefff',
  c: '#17408f',
  C: '#0e2a63',
  // ---- gold / clock ----
  y: '#ffd94a',
  Y: '#fff3ae',
  o: '#e8a020',
  O: '#a86408',
  // ---- reds / pinks / flowers ----
  r: '#d84040',
  R: '#f07068',
  p: '#a82830',
  P: '#ff9d9d',
  i: '#e06aa8', // petal pink
  I: '#ffb3d9', // petal light
  v: '#9b6fd0', // violet flower
  V: '#c9a2ec',
  // ---- magic purples (hero robe) ----
  j: '#7b3fa0',
  J: '#a86ad0',
  x2: '#4e2470',
  X2: '#cda4ec',
  // ---- misc ----
  x: '#14141e',
  b: '#e8f4ff',
  B: '#b8dcf4',
  M: '#841018',
  N: '#c25a50',
  K: '#5a4a3a',
  H: '#8a7458',
};

export type SpriteDef = { w: number; h: number; rows: string[] };

// ---------------------------------------------------------------------------
// Decorations scatter on GRASS only — flowers & tufts (never on paths)
// ---------------------------------------------------------------------------
export const TUFT: SpriteDef = {
  w: 12,
  h: 10,
  rows: [
    '..h...h..h..',
    '.hh..hh.hh..',
    '.hGh.hGhh...',
    'hhGhhhhGhh..',
    'hGGhhGghGh..',
    '.GGdGGdGG...',
    '..ddd..dd...',
    '...d........',
    '............',
    '............',
  ],
};
export const FLOWER_R: SpriteDef = {
  w: 12,
  h: 12,
  rows: [
    '....rr......',
    '...rRRr.....',
    '...rPRr.....',
    '....rr......',
    '.....g......',
    '....hgh.....',
    '..h.g.gg....',
    '.hh.g.hh....',
    '....d.......',
    '....d.......',
    '............',
    '............',
  ],
};
export const FLOWER_Y: SpriteDef = {
  w: 12,
  h: 12,
  rows: [
    '....yy......',
    '...yYYy.....',
    '...yYoy.....',
    '....yy......',
    '.....g......',
    '....hgh.....',
    '..h.g.gg....',
    '.hh.g.hh....',
    '....d.......',
    '....d.......',
    '............',
    '............',
  ],
};
export const FLOWER_P: SpriteDef = {
  w: 12,
  h: 12,
  rows: [
    '....ii......',
    '...iIPIi....',
    '...iPPIi....',
    '....ii......',
    '.....g......',
    '....hgh.....',
    '..d.g.dd....',
    '.hh.g.hh....',
    '....d.......',
    '....d.......',
    '............',
    '............',
  ],
};
export const FLOWER_V: SpriteDef = {
  w: 12,
  h: 12,
  rows: [
    '....vv......',
    '...vVvV.....',
    '...vVVv.....',
    '....vv......',
    '.....g......',
    '....hgh.....',
    '..d.g.dd....',
    '.hh.g.hh....',
    '....d.......',
    '....d.......',
    '............',
    '............',
  ],
};

// ---------------------------------------------------------------------------
// WATER SPINGER — mossy stone fountain (16x18)
// ---------------------------------------------------------------------------
export const SPINGER: SpriteDef = {
  w: 16,
  h: 18,
  rows: [
    '......uu........',
    '.....uUu..u.....',
    '..u..uWu.uUu....',
    '.uUu.uWuuUWu....',
    '.uWuuuWWWwu.....',
    '..uUUWWWWu......',
    '...uWWWWu.......',
    '..qqSSSqqq......',
    '.qSSShSSSq......',
    '.qwWWWWWWq......',
    '.qSWuuuWSq......',
    '.qWWuuuWWq......',
    'QQSSSSSSSSQQ....',
    'QShSSSSSSShSQ...',
    'zQQQQQQQQQQQz...',
    '.zzzzzzzzzzz....',
    '..gdgdggdggd....',
    '................',
  ],
};

// BAG OF SEEDS (16x16) --------------------------------------------------------
export const SEEDBAG: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    '................',
    '.....mmmm.......',
    '....mTttTm......',
    '.....mttm..y....',
    '....exxxxe.y....',
    '...etTttTe......',
    '..ettTtttety....',
    '..etttttttte....',
    '.etttMttttte....',
    '.ettMtttttye....',
    '.ettttttttte....',
    '.etttttttte.y...',
    '.FettttttFe.....',
    '..FFeeeeF...y...',
    '....FFF.........',
    '..y..y...y..y...',
  ],
};

// GOAL PORTAL (16x16) ---------------------------------------------------------
export const GOAL: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    '..OOOOOOOOOOOO..',
    '.OyyyyyyyyyyyyO.',
    'OyWWuuuuuuuuWWyO',
    'OyuJJJJJJJJJuUyO',
    'OyJVVVVVVVVVVuyO',
    'OyJVYYYyyVVJVuyO',
    'OyJVYxxYYVVJVuyO',
    'OyJVYxxxxVVJVuyO',
    'OyJVYxxxxVVJVuyO',
    'OyJVYxYYxVVJVuyO',
    'OyJVYYyyYYVJVuyO',
    'OyJVVVVVVVVVJVyo',
    'OyuuJJJJJJJuuuyo',
    'Oyuuuuuuuuuuuuyo',
    '.OOooooooOOoooO.',
    '..zzzzzzzzzzzz..',
  ],
};

// CLOCK (canvas overlay sprite, 16x16) ---------------------------------------
export const CLOCK: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    '.....oooo.......',
    '.....oooo.......',
    '...ooYYYYoo.....',
    '..oYYYYYYYYo....',
    '.oYYYxxxxxYYo...',
    'oYYxTTTxTTTxYo..',
    'oYxTTTTxTTTTxO..',
    'oYxTTTxTTTxTTxO.',
    'oYxTTxTTxTTxTTxO',
    'oYxTTTTxTTTTxTO.',
    'oYYxTTTxTTTxTTO.',
    '.oYYxxxxxxxYYO..',
    '..oYYYYYYYYo....',
    '...ooYYYYoo.....',
    '.....oooo.......',
    '.....oooo.......',
  ],
};

// ---------------------------------------------------------------------------
// HERO — gardener with straw hat & watering can (16x20 fine pixels)
// ---------------------------------------------------------------------------
export const HERO_IDLE: SpriteDef = {
  w: 16,
  h: 20,
  rows: [
    '.....mmmm.......',
    '...mmTTTTmm.....',
    '..mTTTTTTTTm....',
    '..mmmmmmmmmm....',
    '....xTTx........',
    '...xTbbTx.......',
    '...xbxxbx.......',
    '...xbbbbx.......',
    '....xttx........',
    '...jjJJJj.......',
    '..jJJJJJJj......',
    '..jJJXTXJJj.....',
    '..jJJJJJJjw.....',
    '..xjjjjjjx.w....',
    '...xFFxFx.uw....',
    '...xFFxFx..W....',
    '...xx..xx.......',
    '..xFF.xFF.......',
    '..xFx.xFx.......',
    '..xx...xx.......',
  ],
};
export const HERO_WALK: SpriteDef = {
  w: 16,
  h: 20,
  rows: [
    '.....mmmm.......',
    '...mmTTTTmm.....',
    '..mTTTTTTTTm....',
    '..mmmmmmmmmm....',
    '....xTTx........',
    '...xTbbTx.......',
    '...xbxxbx.......',
    '...xbbbbx.......',
    '....xttx........',
    '...jjJJJj.......',
    '..jJJJJJJj......',
    '..jJJXTXJJj.....',
    '..jJJJJJJjw.....',
    '..xjjjjjjx.w....',
    '...xFFxFx.uw....',
    '...xFFxFx..W....',
    '...xx..xx.......',
    '.xFF....xFF.....',
    '.xFx.....xFx....',
    '.xx.......xx....',
  ],
};

// ---------------------------------------------------------------------------
// TREES — billboards with layered leaf clumps
// ---------------------------------------------------------------------------
export const T_SEED: SpriteDef = {
  w: 16,
  h: 10,
  rows: [
    '................',
    '................',
    '....ffnnnnff....',
    '...fnnnnnnnnf...',
    '...fnneEennnf...',
    '....feEEeef.....',
    '.....eEEe.......',
    '......e.........',
    '................',
    '................',
  ],
};
export const T_SPROUT: SpriteDef = {
  w: 16,
  h: 14,
  rows: [
    '..h......h......',
    '.hhG....Ghh.....',
    '.hGGh..hGGh.....',
    '..hGGhhGGh......',
    '...hhGGhh.......',
    '....hdgdh.......',
    '.....gdg........',
    '.....gdg........',
    '.....gdg........',
    '....ffnnff......',
    '...fnnnnnnf.....',
    '................',
    '................',
    '................',
  ],
};
export const T_YOUNG: SpriteDef = {
  w: 20,
  h: 22,
  rows: [
    '.....dDDDDd.........',
    '...dDGGGGGDd........',
    '..DGhhGGGhGGD.......',
    '.DGhGGlGGGGhGD......',
    '.dGGGGkGGGGGDd......',
    'dGGGkkkGGGGGGd......',
    'dGGGkdkGGGGGGd......',
    '.dGGGkGGGDd.........',
    '..dDGGGGGDd.........',
    '....ddDDDdd.........',
    '.....dfed...........',
    '.....feef...........',
    '.....fef............',
    '....dffef...........',
    '.....feef...........',
    '.....fef............',
    '....ffnnff..........',
    '...fnnnnnnf.........',
    '...nnnnnnnn.........',
    '....nnnnnn..........',
    '....................',
    '....................',
  ],
};
export const T_BIG: SpriteDef = {
  w: 24,
  h: 30,
  rows: [
    '....ddDDDDdd..........',
    '..dDGGGGGGGDdd........',
    '.dGGhhGGGhhGGDd.......',
    'dGGhGGlGGGlGGhGGd.....',
    'dGhGGGGkkGGGGhGd......',
    'dGGGGkkXkkGGGGGd......'.replace(/X/g, 'x'),
    'dGGGkdkxkdkGGGGd......',
    '.dGGkkxkkGGGDd........',
    '..dDGGkkGGGGDd........',
    '...ddDGGGGDdd.........',
    '.....ddDdd............',
    '......fef.............',
    '.....feef.............',
    '.....fef..............',
    '....dfeef.............',
    '....ffeef.............',
    '.....fef..............',
    '.....feef.............',
    '.....fef..............',
    '....dffef.............',
    '....ffnnff............',
    '...fnnnnnnf...........',
    '...nnnnnnnn...........',
    '..fnnnnnnnnf..........',
    '...nnnnnnnn...........',
    '....nnnnnn............',
    '......................',
    '......................',
    '......................',
    '......................',
  ].map((r) => r.padEnd(24, '.').slice(0, 24)),
};
export const DEADTREE: SpriteDef = {
  w: 20,
  h: 26,
  rows: [
    '.....HH...........',
    '..H..HH....H......',
    '..HH.HH...HH......',
    '...HKHHK.KH.......',
    '....KKHHKH........',
    '..H.KKHKk.........',
    '.HH..KK...........',
    '...H.KK..H........',
    '.....KKK..HH......',
    '....kKKk...H......',
    '.....KK...........',
    '.....KK....k......',
    '.....KK...........',
    '....kKKk..........',
    '.....KK...........',
    '.....KK...........',
    '.....KK...........',
    '.....KK...........',
    '.....KK...........',
    '....FKKf..........',
    '...FFKKFF.........',
    '....ffff..........',
    '...nnnnnn.........',
    '..................',
    '..................',
    '..................',
  ],
};
// living tree WITH STAIRS built against the trunk (24x30)
export const T_STAIRS: SpriteDef = {
  w: 24,
  h: 30,
  rows: [
    '....ddDDDDdd..........',
    '..dDGGGGGGGDdd........',
    '.dGGhhGGGhhGGDd.......',
    'dGGhGGlGGGlGGhGGd.....',
    'dGhGGGGkkGGGGhGd......',
    'dGGGGkkxkkGGGGGd......',
    'dGGGkdkxkdkGGGGd......',
    '.dGGkkxkkGGGDd........',
    '..dDGGkkGGGGDd........',
    '...ddDGGGGDdd.........',
    '..Fttt.ddDdd..........',
    '..FEFt..fef...........',
    '..Ftt..feef...........',
    '..FEF...fef...........',
    '..Ftt..dffef..........',
    '..FEF..ffeef..........',
    '..Ftt...fef...........',
    '..FEF..feef...........',
    '..Ftt...fef...........',
    '..FEFdffef............',
    '..Fttffnnnff..........',
    '..FEFfnnnnnnf.........',
    '..Fttnnnnnnnn.........',
    '..FEFnnnnnnnn.........',
    '..Ftttnnnnnnn.........',
    '...nnnnnnn............',
    '......................',
    '......................',
    '......................',
    '......................',
  ].map((r) => r.padEnd(24, '.').slice(0, 24)),
};
// standalone wooden stairs prop (leaning) 16x24
export const STAIRS: SpriteDef = {
  w: 16,
  h: 24,
  rows: [
    '............tFFF',
    '...........ttFeF',
    '..........tttFeF',
    '.........tttFeFF',
    '........tttFeFF.',
    '.......tttFeFF..',
    '......tttFeFF...',
    '.....tttFeFF....',
    '....tttFeFF.....',
    '...tttFeFF......',
    '..tttFeFF.......',
    '.tttFeFF........',
    'tttFeFF.........',
    'ttFeFF..........',
    'teFFFF..........',
    'teFF............',
    'teF.............',
    'ee..............',
    'fe..............',
    'fe..............',
    'f...............',
    'ff..............',
    '.FF.............',
    '..nn..............'.slice(0, 16),
  ],
};

// WALLSEG : mossy brick tower (16 wide x 28 tall, finer mortar lines)
export const WALLSEG: SpriteDef = {
  w: 16,
  h: 28,
  rows: [
    'zzzzzzzzzzzzzzzz',
    'zSSSSSSSSSSSSSSz',
    'zSqMMMMMMMMMMMSz',
    'zqNMrMMMMMMMNNqz',
    'zNrMMMrMMMMMMMqz',
    'zzzzzzzNrMMMMMqz',
    'zMrMMMMMMNMrMMMz',
    'zMMMMMMMMMMMrMMz',
    'zNrMMMMMrMMMMMMz',
    'zzzzzzzzzzzzzzrz',
    'zMMMMNrMMMMMMMrz',
    'zMMMMMMMMrMMMMNz',
    'zMMyMMMMMMMMMMrz',
    'zNrMMMMMMMrMMMMz',
    'zzzzzzzzzzzzzzqz',
    'zMMMMMMMMNrMMMMz',
    'zMMMrMMMMMMMMMrz',
    'zMMMMMMMrMMMMMNz',
    'zNrMMMMMMMMMMMMz',
    'zzzzzzzzzzzzzzqz',
    'zMMMMNrMMMMMrMMz',
    'zMMMMMMMMMMMMMMz',
    'zhMMhMMMMhMMMMMz',
    'zzzzzzzzzzzzzzqz',
    'zMMMMMhMMMMMMMrz',
    'zSrMMMMMMMMMMNSz',
    'zSqqqqqqqqqqqqqz',
    'zzzzzzzzzzzzzzzz',
  ],
};

// little drop particle (4x4) & sparkly star (5x5) -----------------------------
export const DROP: SpriteDef = {
  w: 4,
  h: 4,
  rows: ['..u.', '.uWu', 'uWWu', '.Wu.'],
};
export const SPARK: SpriteDef = {
  w: 5,
  h: 5,
  rows: ['..Y..', '..y..', 'YyyyY', '..y..', '..Y..'],
};
export const ARROW: SpriteDef = {
  w: 8,
  h: 8,
  rows: [
    '...yy...',
    '..yyyy..',
    '.yyyyyy.',
    'yyyyyyyy',
    '..yyyy..',
    '..yyyy..',
    '..yyyy..',
    '..yyyy..',
  ],
};

// ---------------------------------------------------------------------------
// painting helpers
// ---------------------------------------------------------------------------

/** Paint a sprite scaled so its grid fills `wUnits` x `hUnits` world units. */
export function paintScaled(
  ctx: CanvasRenderingContext2D,
  def: SpriteDef,
  px: number,
  py: number,
  wUnits: number,
  hUnits: number,
) {
  const W = Math.round(wUnits * TILE),
    H = Math.round(hUnits * TILE);
  const cw = Math.max(1, Math.floor(W / def.w)),
    chh = Math.max(1, Math.floor(H / def.h));
  for (let y = 0; y < def.h; y++) {
    const row = def.rows[y] || '';
    for (let x = 0; x < def.w; x++) {
      const c = row[x];
      if (!c || c === '.') continue;
      const col = PAL[c];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(px + x * cw, py + y * chh, cw, chh);
    }
  }
}

/** Deterministic hash in [0,1) for scatter decisions (stable across frames). */
export function hash2(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
