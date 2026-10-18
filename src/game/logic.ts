// ============================================================================
// CHRONO GARDEN 8-BIT — GAME LOGIC (pure, headless-testable)
// ----------------------------------------------------------------------------
// The player walks a winding path across a 12x12 isometric board.
//   * WASD moves along the SCREEN axes (W = up-right on screen, D = down-right)
//     so the controls feel natural in the isometric view.
//   * Arrow Up / Down move through TIME, one step = 10 years.
//   * A pixel CLOCK (top-right of the HUD) also advances +10y per click;
//     clicking its little pendulum rewinds -10y.
//
// WIN RECIPE (all must hold when arriving back at T-0):
//   1. Grab the BAG OF SEEDS and plant the seedling at a time <= -50y
//      (planting later => no tree at all, or a stunted tiny tree).
//   2. Visit the WATER SPINGER to fill the can, then water the tree at least
//      once every 10 years until it is grown (miss a decade => dead tree).
//   3. Walk back to T-0: if both rules were respected, a living tree with
//      built-in stairs stands before the wall => the wall can be passed.
// ============================================================================

export const N = 12; // board is N x N squares

export type CellType = 'grass' | 'path';

export interface Vec { x: number; y: number }

// ---------------------------------------------------------------------------
// PATH LAYOUT — winding road with curves and two crossroads
// ---------------------------------------------------------------------------
const PATH_CELLS: [number, number][] = [
  // start plaza at (1,10) -> north leg along col 1
  [1, 10], [1, 9], [1, 8], [1, 7], [1, 6], [1, 5], [1, 4], [1, 3],
  // CURVE at the NW corner -> east along row 2
  [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2],
  // CURVE at the NE corner -> south along col 10
  [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8],
  // CROSSROAD #1 : spur west along row 6 to the WATER SPINGER at (6,6)
  [9, 6], [8, 6], [7, 6], [6, 6],
  // continue: row 8 westwards — it CROSSES the col-1 leg at (1,8)
  [9, 8], [8, 8], [7, 8], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8],
  // CURVE at SW -> south along col 1 back to start row
  [1, 9],
  // east along row 10 toward the GOAL ; the WALL stands in front of it
  [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10],
  // CROSSROAD #2 : spur north from (8,10) to the BAG OF SEEDS at (8,9)
  [8, 9],
];

export function buildBoard(): CellType[][] {
  const grid: CellType[][] = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => 'grass' as CellType)
  );
  for (const [x, y] of PATH_CELLS) grid[y][x] = 'path';
  return grid;
}

export const START: Vec = { x: 1, y: 10 };
export const SPINGER_POS: Vec = { x: 6, y: 6 };   // water fountain (crossroad #1 spur)
export const SEEDBAG_POS: Vec = { x: 8, y: 9 };   // bag of seeds (crossroad #2 spur)
export const PLANT_POS: Vec = { x: 5, y: 8 };     // planting soil patch on row-8 road
export const GOAL_POS: Vec = { x: 10, y: 10 };    // goal beyond the wall
export const WALL_ROW_Y = 10;                     // wall stands on row y=10, col x=9
export const WALL_X = 9;                          // blocked crossing tile

// ---------------------------------------------------------------------------
// TIME
// ---------------------------------------------------------------------------
export const TIME_STEP = 10; // one clock click / arrow press = 10 years
export const T_MIN = -100;
export const T_MAX = 50;
export const PLANT_DEADLINE = -50; // seedling must be done at -50y or earlier

// ---------------------------------------------------------------------------
// STATE MACHINE
// ---------------------------------------------------------------------------
export type TreeStatus =
  | 'none'          // nothing planted
  | 'seedling'      // planted, waiting for water
  | 'growing'       // sprout -> sapling -> big tree (stage from age)
  | 'grown'         // fully alive & big, but still needs watering
  | 'stunted'       // planted too late (-40y..-10y): tiny sad tree forever
  | 'dead';         // missed a watering decade, or frozen at t > 0

export interface GameState {
  pos: Vec;
  time: number;               // current year offset
  hasSeeds: boolean;          // picked up the bag
  hasWaterCan: boolean;       // filled at the spinger
  waterFxUntil: number;       // ms timestamp for splash fx
  plantedAt: number | null;   // time when seed went into soil
  lastWateredAt: number | null;
  tree: TreeStatus;
  stairsReady: boolean;       // living tree + stairs appeared at T-0
  crossedWall: boolean;       // reached goal past the wall
  message: string;
  log: string[];
}

export function initialState(): GameState {
  return {
    pos: { ...START },
    time: 0,
    hasSeeds: false,
    hasWaterCan: false,
    waterFxUntil: 0,
    plantedAt: null,
    lastWateredAt: null,
    tree: 'none',
    stairsReady: false,
    crossedWall: false,
    message: 'Walk the path! Find the SEEDS 🌰 and the SPINGER 💧.',
    log: [],
  };
}

function pushLog(s: GameState, msg: string) {
  s.message = msg;
  s.log = [...s.log.slice(-5), `T${s.time >= 0 ? '+' : ''}${s.time}y :: ${msg}`];
}

// tree growth stage derived from tree age (years elapsed since planting)
export function treeAge(state: GameState): number {
  if (state.plantedAt === null) return 0;
  return state.time - state.plantedAt;
}

export function treeScale(state: GameState): number {
  switch (state.tree) {
    case 'seedling': return 0.18;
    case 'dead': return 0.8;
    case 'stunted': return 0.32;
    case 'growing': {
      const a = Math.max(0, treeAge(state));
      return Math.min(1, 0.2 + a / 60); // full size after ~48y
    }
    case 'grown': return 1;
    default: return 0;
  }
}

// ---------------------------------------------------------------------------
// MOVEMENT (WASD = screen axes on the iso board)
// W -> (+1, 0) screen-up-right | S -> (-1, 0)
// D -> (0, +1) screen-down-right | A -> (0, -1)
// ---------------------------------------------------------------------------
export type Dir = 'N' | 'S' | 'E' | 'W';

export function tryMove(state: GameState, dir: Dir): GameState {
  const s = { ...state, pos: { ...state.pos } };
  const delta: Record<Dir, Vec> = {
    N: { x: 1, y: 0 }, S: { x: -1, y: 0 }, E: { x: 0, y: 1 }, W: { x: 0, y: -1 },
  };
  const d = delta[dir];
  const nx = s.pos.x + d.x;
  const ny = s.pos.y + d.y;

  if (nx < 0 || ny < 0 || nx >= N || ny >= N) {
    pushLog(s, 'Edge of the garden...');
    return s;
  }

  // THE WALL guards the goal (only passable with stairs / living tree)
  const crossesWall = ny === WALL_ROW_Y && nx === WALL_X && s.pos.x !== WALL_X;
  if (crossesWall && !s.stairsReady) {
    pushLog(s, '🧱 A mossy WALL blocks the way! Grow the tree, come back to T-0.');
    return s;
  }
  if (crossesWall && s.stairsReady && !s.crossedWall) {
    // climbing the tree-stairs over the wall
    s.crossedWall = true;
    pushLog(s, '🎉 You climbed the STAIRS-TREE and passed the WALL! GOAL!!');
  }

  s.pos.x = nx;
  s.pos.y = ny;

  // ---- pickups / interactions on the tile we stepped onto -----------------
  if (nx === SEEDBAG_POS.x && ny === SEEDBAG_POS.y && !s.hasSeeds) {
    s.hasSeeds = true;
    pushLog(s, '🌰 Found the BAG OF SEEDS! Plant it at the soil patch, at T<=-50y.');
  } else if (nx === SPINGER_POS.x && ny === SPINGER_POS.y) {
    if (!s.hasWaterCan) {
      s.hasWaterCan = true;
      pushLog(s, '💧 The WATER SPINGER fills your can! Water the tree every 10 years.');
    } else {
      pushLog(s, '💧 The spinger hums softly. Refreshed!');
    }
  } else if (nx === PLANT_POS.x && ny === PLANT_POS.y) {
    return interactPlant(s);
  } else {
    pushLog(s, describeTile(s));
  }
  return s;
}

function describeTile(s: GameState): string {
  if (s.crossedWall) return '🏆 Beyond the wall! Chrono Gardener!';
  if (s.pos.x === GOAL_POS.x && s.pos.y === GOAL_POS.y) return '🌀 GOAL reached!';
  return `You are at (${s.pos.x},${s.pos.y}) · T${s.time >= 0 ? '+' : ''}${s.time}y`;
}

// ---------------------------------------------------------------------------
// PLANT / WATER (Space or E on the soil patch)
// ---------------------------------------------------------------------------
export function interactPlant(state: GameState): GameState {
  const s = { ...state, pos: { ...state.pos } };
  if (s.plantedAt !== null) {
    // already planted -> this is the WATER action
    return waterTree(s);
  }
  if (!s.hasSeeds) {
    pushLog(s, 'Empty hands... find the BAG OF SEEDS first! (north-east spur)');
    return s;
  }
  if (s.time > PLANT_DEADLINE) {
    // too late: stunted or nothing
    if (s.time >= 0) {
      pushLog(s, '❄️ Frozen ground at T>=0 — the seed will never wake here.');
      return s;
    }
    s.plantedAt = s.time;
    s.tree = 'stunted';
    s.lastWateredAt = s.time;
    pushLog(s, `🥀 Planted at T${s.time}y — TOO LATE! Only a STUNTED shrub will grow.`);
    return s;
  }
  s.plantedAt = s.time;
  s.tree = 'seedling';
  s.lastWateredAt = s.time;
  pushLog(s, `🌱 Seedling planted at T${s.time}y. Keep it watered EVERY 10 YEARS!`);
  return s;
}

export function waterTree(state: GameState): GameState {
  const s = { ...state, pos: { ...state.pos } };
  if (s.plantedAt === null) {
    pushLog(s, 'Nothing to water here yet — plant the seedling first!');
    return s;
  }
  if (!s.hasWaterCan) {
    pushLog(s, '🚱 No water! Visit the WATER SPINGER (west crossroad spur).');
    return s;
  }
  if (s.tree === 'dead') {
    pushLog(s, '🪦 The tree is gone. Press R to rewind the whole cycle.');
    return s;
  }
  if (s.time > 0) {
    pushLog(s, '❄️ The stream is frozen past T-0... you waited too long!');
    s.tree = 'dead';
    return s;
  }
  if (s.tree === 'stunted') {
    pushLog(s, '💧 Watering the stunted shrub... it sadly stays tiny.');
    s.lastWateredAt = s.time;
    s.waterFxUntil = Date.now() + 1200;
    return s;
  }
  s.lastWateredAt = s.time;
  s.waterFxUntil = Date.now() + 1200;
  const age = s.time - (s.plantedAt ?? 0);
  if (age >= 48 && s.tree !== 'grown') {
    s.tree = 'grown';
    pushLog(s, '🌳 The tree is FULLY GROWN and happy! Return to T-0 now!');
  } else {
    s.tree = 'growing';
    pushLog(s, `💧 Watered at T${s.time}y (age ${age}y). Keep the rhythm: every 10y!`);
  }
  return s;
}

// ---------------------------------------------------------------------------
// TIME TRAVEL — arrows up/down or clock clicks (±10 years)
// ---------------------------------------------------------------------------
export function advanceTime(state: GameState, deltaYears: number): GameState {
  const s = { ...state, pos: { ...state.pos } };
  const nt = Math.max(T_MIN, Math.min(T_MAX, s.time + deltaYears));
  if (nt === s.time) {
    pushLog(s, deltaYears > 0 ? '⏩ End of time (T+50y).' : '⏪ Start of time (T-100y).');
    return s;
  }
  const prev = s.time;
  s.time = nt;

  // ---- if you wandered off while time jumped >10y past the last watering,
  //      nobody was there to water it => the tree dies (unless already at T-0 win state)
  if (
    s.plantedAt !== null &&
    (s.tree === 'seedling' || s.tree === 'growing') &&
    !s.stairsReady
  ) {
    const lastW = s.lastWateredAt ?? s.plantedAt;
    const away = Math.abs(s.pos.x - PLANT_POS.x) + Math.abs(s.pos.y - PLANT_POS.y);
    if (away > 1 && Math.max(nt, prev) > lastW + 10) {
      s.tree = 'dead';
      pushLog(s, '☠️ You left it unwatered for more than 10 YEARS — the tree died!');
      return s;
    }
  }

  // ---- watering deadline check: each crossed 10-year mark without water kills
  if (s.plantedAt !== null && (s.tree === 'seedling' || s.tree === 'growing')) {
    const lastW = s.lastWateredAt ?? s.plantedAt;
    const gap = Math.abs(nt - lastW);
    if (gap > 10) {
      s.tree = 'dead';
      pushLog(s, '☠️ MORE THAN 10 YEARS WITHOUT WATER — the tree died!');
      return s;
    }
    const age = nt - s.plantedAt;
    if (age >= 48 && nt <= 0) {
      s.tree = 'grown';
    } else if (age > 0) {
      s.tree = 'growing';
    }
  }

  // ---- arriving back at T-0 : evaluate the whole lifecycle
  if (nt === 0) {
    if (
      s.plantedAt !== null &&
      s.plantedAt <= PLANT_DEADLINE &&
      (s.tree === 'seedling' || s.tree === 'growing' || s.tree === 'grown')
    ) {
      s.tree = 'grown';
      s.stairsReady = true;
      pushLog(s, '✨ T-0 : A LIVING TREE WITH STAIRS rose before the wall! Pass it!');
    } else if (s.plantedAt !== null && s.tree === 'stunted') {
      s.stairsReady = false;
      pushLog(s, '🌿 T-0 : The stunted shrub is far too small... the wall stands firm.');
    } else if (s.plantedAt !== null && s.tree === 'dead') {
      pushLog(s, '🪵 T-0 : Only a DEAD tree remains. No stairs. (R to retry)');
    } else {
      pushLog(s, 'T-0 : Nothing was planted. The wall keeps its secret.');
    }
  } else {
    // leaving T-0 again clears the stair-window unless still grown at t<=0
    if (s.stairsReady && nt > 0) {
      // the magic window only exists AT T-0; walking past the wall must happen there
      s.stairsReady = false;
      pushLog(s, '⏳ The stairs shimmer out of time... return to T-0 to use them.');
    }
  }
  return s;
}

export function resetState(): GameState {
  const s = initialState();
  s.message = '🔄 Cycle rewound. Plant <= -50y, water every 10y, return to T-0!';
  return s;
}
