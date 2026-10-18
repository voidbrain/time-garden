// ============================================================================
// 8-BIT PIXEL PAINTING SYSTEM
// Every sprite is a grid of characters, each mapped to a NES-palette color.
// Sprites are painted onto an HTMLCanvasElement at 1 world-unit = TILE px,
// Painted directly onto a 2D canvas for a crisp pixel look.
// ============================================================================

export const TILE = 26; // canvas pixels per world unit (bigger = chunkier pixels)

// NES-flavored palette. '.' = transparent
const PAL: Record<string, string> = {
  '.': '',
  // greens (grass / leaves)
  g: '#3e9d44',
  G: '#57c04f',
  h: '#79e06a',
  d: '#2a6e2c',
  D: '#1c4d22',
  k: '#12331a',
  l: '#a8ef7c',
  L: '#cbffab',
  // earth / wood
  e: '#8a5a2b',
  E: '#a9743c',
  f: '#6b4423',
  F: '#4d2f16',
  n: '#331e0e',
  m: '#caa27a',
  t: '#e8cba0',
  T: '#f7e6c2',
  // stone / wall
  s: '#9aa0ae',
  S: '#c2c8d6',
  q: '#6b7080',
  Q: '#464b5c',
  z: '#2b2e3c',
  Z: '#191b26',
  // water / ice
  w: '#2a6fdc',
  W: '#4fa8f0',
  u: '#7fd0ff',
  U: '#cdefff',
  c: '#17408f',
  C: '#0e2a63',
  // gold / clock / goal
  y: '#ffd94a',
  Y: '#fff3ae',
  o: '#e8a020',
  O: '#a86408',
  // reds / pinks
  r: '#d84040',
  R: '#f07068',
  p: '#a82830',
  P: '#ff9d9d',
  // purples (character + magic)
  v: '#7b3fa0',
  V: '#a86ad0',
  j: '#4e2470',
  J: '#cda4ec',
  // misc
  x: '#14141e', // near-black outline
  b: '#e8f4ff',
  B: '#b8dcf4',
  M: '#841018', // dark crimson (mossy wall bricks)
  N: '#c25a50', // brick highlight
  // dead tree
  K: '#5a4a3a',
  H: '#8a7458',
};

export type SpriteDef = { w: number; h: number; rows: string[] };

// ---------------------------------------------------------------------------
// SPRITES
// ---------------------------------------------------------------------------

// 1x1 grass variants ---------------------------------------------------------
export const GRASS_A: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    'ggggghggggggDggg',
    'ggghgggggDgggggD',
    'gDggggghggggDggg',
    'ggggDggggggghggg',
    'ghgggggDghgggggg',
    'gggghgggggggDggg',
    'ggDgggghgggggggD',
    'ggggDgggggghgggg',
    'hgggggDggggggghg',
    'ggghggggggDggggg',
    'gDgggghgggggggDg',
    'ggggggDggghggggg',
    'ghggggggDggggghg',
    'gggDghgggggDgggg',
    'ggggggggghgggDgg',
    'gghggDggggggghgg',
  ],
};
export const GRASS_B: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    'ggDgggghgggggggD',
    'gggghgggggDggghg',
    'ghgggggDgggggghg',
    'ggggggghggDggggg',
    'gDghgggggggghgDg',
    'gggghggDgggggggg',
    'gggggggghgggDghg',
    'hgDgggghgggggggg',
    'gggghgggggDggghg',
    'gggggDghgggggggh',
    'gghgggggggghgDgg',
    'ggggDghggggggghg',
    'ghgggggDghgggggg',
    'gggghgggggggDghg',
    'gDgggggghggggggh',
    'gggghggDggghgggg',
  ],
};

// path tiles -----------------------------------------------------------------
export const PATH_TILE: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    'eeeeEeeeeeEeeeee',
    'eEteeEEtteEetEee',
    'teEeEetteeEetEtt',
    'eeEtteEeEtteeEee',
    'EteeEeEtteeEeEtE',
    'eeEtteeEeeEettee',
    'teEeEetteeEetEtt',
    'eeEetteEeEtteeEe',
    'EteeEeEtteeEeEtE',
    'eeEtteeEeeEettEe',
    'teEeEetteeEetEtt',
    'eeEetteEeEtteeEe',
    'EteeEeEtteeEeEtE',
    'eeEtteeEeeEettee',
    'eEteeEEtteEetEee',
    'eeeeEeeeeeEeeeee',
  ],
};

// flowers / tufts decorations (8x8) ------------------------------------------
export const TUFT: SpriteDef = {
  w: 8,
  h: 8,
  rows: [
    '..h..h..',
    '.hh.hh..',
    '.hh.hhh.',
    'hhhhhhh.',
    '.GhGhG..',
    '..GGG...',
    '..dGd...',
    '...d....',
  ],
};
export const FLOWER_R: SpriteDef = {
  w: 8,
  h: 8,
  rows: [
    '..rr....',
    '.rRRr...',
    '.rRPr...',
    '..rr....',
    '..gg....',
    '.hGh....',
    '..d.....',
    '..d.....',
  ],
};
export const FLOWER_Y: SpriteDef = {
  w: 8,
  h: 8,
  rows: [
    '..yy....',
    '.yYYy...',
    '.yYyY...',
    '..yy....',
    '..gg....',
    '.hGh....',
    '..d.....',
    '..d.....',
  ],
};

// WATER SPINGER : pixel fountain (16 wide x 16 tall) -------------------------
export const SPINGER: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    '......uu........',
    '.....uUu..u.....',
    '..u..uWu.uUu....',
    '.uUu.uWuuUWu....',
    '.uWuuuWWWwu.....',
    '..uUUWWWWu......',
    '...uWWWWu.......',
    '..qqSSSqqq......',
    '.qSSSSSSSq......',
    '.qwWWWWWWq......',
    '.qSWuuuWSq......',
    '.qWWuuuWWq......',
    'QQSSSSSSSSQQ....',
    'QSSSSSSSSSSSQ...',
    'zQQQQQQQQQQQz...',
    '.zzzzzzzzzzz....',
  ],
};

// BAG OF SEEDS : drawstring pouch with spilling seeds (16x16) ----------------
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

// GOAL PORTAL (16x16) --------------------------------------------------------
export const GOAL: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    '..OOOOOOOOOOOO..',
    '.OyyyyyyyyyyyyO.',
    'OyWWuuuuuuuuWWyO',
    'OyuVVVVVVVVVuUyO',
    'OyVJJJJJJJJJVuyO',
    'OyVJYYYyyJJJVuyO',
    'OyVJYxxYYJJJVuyO',
    'OyVJYxxxxJJJVuyO',
    'OyVJYxxxxJJJVuyO',
    'OyVJYxYYxJJJVuyO',
    'OyVJYYyyYYJJVuyO',
    'OyVJJJJJJJJJJVyo',
    'OyuuVVVVVVVuuuyo',
    'Oyuuuuuuuuuuuuyo',
    '.OOooooooOOoooO.',
    '..zzzzzzzzzzzz..',
  ],
};

// CLOCK (HUD sprite, 16x16) --------------------------------------------------
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

// DEAD TREE (billboard 16x24) ------------------------------------------------
export const DEADTREE: SpriteDef = {
  w: 16,
  h: 24,
  rows: [
    '.....HH.........',
    '..H..HH....H....',
    '..HH.HH...HH....',
    '...HKHHK.KH.....',
    '....KKHHKH......',
    '..H.KKHKk.......',
    '.HH..KK.........',
    '...H.KK..H......',
    '.....KKK..HH....',
    '....kKKk...H....',
    '.....KK.........',
    '.....KK....k....',
    '.....KK.........',
    '....kKKk........',
    '.....KK.........',
    '.....KK.........',
    '.....KK.........',
    '.....KK.........',
    '.....KK.........',
    '.....KK.........',
    '....FKKf........',
    '...FFKKFF.......',
    '....ffff........',
    '...nnnnnn.......',
  ],
};

// STAIRS : wooden staircase leaning toward the wall top (16 wide x 24 tall)
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
    'f.................'.slice(0, 16),
    'ff..............',
    '.FF.............',
    '..nn..............'.slice(0, 16),
  ],
};

// WALLSEG : mossy brick tower (16 wide x 24 tall)
export const WALLSEG: SpriteDef = {
  w: 16,
  h: 24,
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
    'zSqqqqqqqqqqqqqz',
    'zzzzzzzzzzzzzzzz',
  ],
};

// CHARACTER idle (16x16) ------------------------------------------------------
export const HERO_IDLE: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    '....xxxxxx......',
    '...xjjjjjjx.....',
    '..xjVVVVVVx.....',
    '..xvxxxxxx......',
    '..xvxTTTvx......',
    '..xvxTxtvx......',
    '..xvTTTTTv......',
    '...xxTTTxx......',
    '..xvvvvvvx......',
    '.xvVVVVVVvx.....',
    '.xvVTXTTVvx.....',
    '.xvVVVVVVvx.....',
    '..xvvvvvvx......',
    '...xx..xx.......',
    '..xFF.xFF.......',
    '..xFx.xFx.......',
  ],
};
export const HERO_WALK: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    '....xxxxxx......',
    '...xjjjjjjx.....',
    '..xjVVVVVVx.....',
    '..xvxxxxxx......',
    '..xvxTTTvx......',
    '..xvxTxtvx......',
    '..xvTTTTTv......',
    '...xxTTTxx......',
    '..xvvvvvvx......',
    '.xvVVVVVVvx.....',
    '.xvVTXTTVvx.....',
    '.xvVVVVVVvx.....',
    '..xvvvvvvx......',
    '...xx..xx.......',
    '.xFF...xFF......',
    '.xFx....xFx.....',
  ],
};

// TREE STAGES : billboards 16 wide x H tall ----------------------------------
// seed in soil (16x8)
export const T_SEED: SpriteDef = {
  w: 16,
  h: 8,
  rows: [
    '................',
    '................',
    '....ffnnnnff....',
    '...fnnnnnnnnf...',
    '...fnneEennnf...',
    '....feEEeef.....',
    '.....eEEe.......',
    '......e.........',
  ],
};
// sprout (16x10)
export const T_SPROUT: SpriteDef = {
  w: 16,
  h: 10,
  rows: [
    '..h......h......',
    '.hhG....Ghh.....',
    '.hGGh..hGGh.....',
    '..hGGhhGGh......',
    '...hhGGhh.......',
    '....hdgdh.......',
    '.....gdg........',
    '.....gdg........',
    '....ffnnff......',
    '...fnnnnnnf.....',
  ],
};
// young tree (16x16)
export const T_YOUNG: SpriteDef = {
  w: 16,
  h: 16,
  rows: [
    '....dDDDDd......',
    '..dDGGGGGDd.....',
    '.DGhhGGGhGGD....',
    '.DGhGGGGGhGD....',
    'dGGGGkGGGGGDd...',
    'dGGGkkkGGGG D...'.replace(/ /g, 'G'),
    '.dGGGkGGGDd.....',
    '..dDGGGGDd......',
    '....dfdfd.......',
    '.....fff........',
    '.....fef........',
    '.....ffe........',
    '.....fef........',
    '....ffnnff......',
    '...fnnnnnnf.....',
    '....nnnnnn......',
  ],
};
// big tree (16x24)
export const T_BIG: SpriteDef = {
  w: 16,
  h: 24,
  rows: [
    '...dDDDDDd......',
    '..dDGGGGGDdd....',
    '.dGGhhGGGhGDd...',
    'dGGhGGGGGGhGGd..',
    'dGhGGGkGGGGhGd..',
    'dGGGGkkkGGGGd...',
    '.dGGGkdkGGGDd...',
    '..dDGGGGGGDd....',
    '...ddDGGDdd.....',
    '.....dfed.......',
    '.....feef.......',
    '.....fef........',
    '....dffed.......',
    '.....feef.......',
    '.....fef........',
    '.....feef.......',
    '.....fef........',
    '....dfeef.......',
    '....ffnnff......',
    '...fnnnnnnf.....',
    '...nnnnnnnn.....',
    '....nnnnnn......',
    '................',
    '................',
  ],
};
// living tree WITH STAIRS built against the trunk (16x24)
export const T_STAIRS: SpriteDef = {
  w: 16,
  h: 24,
  rows: [
    '...dDDDDDd......',
    '..dDGGGGGDdd....',
    '.dGGhhGGGhGDd...',
    'dGGhGGGGGGhGGd..',
    'dGhGGGkGGGGhGd..',
    'dGGGGkkkGGGGd...',
    '.dGGGkdkGGGDd...',
    '..dDGGGGGGDd....',
    '...ddDGGDdd.....',
    '..Fttt.dfed.....',
    '..FEFt.feef.....',
    '..Ftt.fef.......',
    '..FEF.dffed.....',
    '..Ftt.feef......',
    '..FEF.fef.......',
    '..Ftt.feef......',
    '..FEF.fef.......',
    '..Fttdfeef......',
    '..FEFFFnnff.....',
    '..Fttfnnnnnf....',
    '..FEFnnnnnnn....',
    '..Ftttnnnnnn....',
    '................',
    '................',
  ],
};

// little drop particle (4x4) for watering fx
export const DROP: SpriteDef = {
  w: 4,
  h: 4,
  rows: ['..u.', '.uWu', 'uWWu', '.Wu.'],
};

// sparkly star (5x5)
export const SPARK: SpriteDef = {
  w: 5,
  h: 5,
  rows: ['..Y..', '..y..', 'YyyyY', '..y..', '..Y..'],
};

// pixel arrow for HUD keys (8x8)
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

// Paint a full sprite scaled so its grid fills `wUnits` x `hUnits` world
// units inside the ground canvas located at (px, py) canvas pixels.
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
