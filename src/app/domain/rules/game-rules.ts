import { vecEquals, formatTime, manhattan, type Vec } from '../board/coordinates';
import { DIR_DELTA, GOAL_POS, PLANT_POS, SEEDBAG_POS, SPINGER_POS, START_POS, WALL_ROW, WALL_X, isWalkable, type Dir } from '../board/board';
import type { GameState, LogEntry } from '../game-state';
import { MATURE_AGE, PLANT_DEADLINE, WATER_INTERVAL, EMPTY_TREE, isAlive, type TreeModel } from '../tree/tree.model';

/** Pure result of a rules transition: state + events for the presentation layer. */
export interface RulesResult {
  readonly state: GameState;
  readonly events: ReadonlyArray<GameEvent>;
}

export type GameEvent =
  | { type: 'pickup-seeds' }
  | { type: 'fill-can' }
  | { type: 'plant'; ok: boolean; stunted: boolean }
  | { type: 'water'; ok: boolean }
  | { type: 'time-travel'; delta: number; clamped: boolean }
  | { type: 'blocked-wall' }
  | { type: 'stairs-appear' }
  | { type: 'win' }
  | { type: 'tree-died' }
  | { type: 'bump-edge' };

const withLog = (s: GameState, message: string): GameState => {
  const entry: LogEntry = { time: s.time, text: message };
  return { ...s, message, log: [...s.log.slice(-5), entry] };
};

// ---------------------------------------------------------------------------
// MOVEMENT — WASD mapped to screen axes of the iso view
// ---------------------------------------------------------------------------
export function applyMove(state: GameState, dir: Dir): RulesResult {
  const d = DIR_DELTA[dir];
  const next: Vec = { x: state.pos.x + d.x, y: state.pos.y + d.y };

  if (!isWalkable([], next)) {
    return { state: withLog(state, 'Edge of the garden...'), events: [{ type: 'bump-edge' }] };
  }

  // THE WALL guards the goal; only the stairs-tree lets you pass, at T-0.
  const crossesWall = next.y === WALL_ROW && next.x === WALL_X && state.pos.x !== WALL_X;
  if (crossesWall && !state.stairsReady) {
    return {
      state: withLog(state, `🧱 A mossy WALL blocks the way! Grow the tree, come back to ${formatTime(0)}.`),
      events: [{ type: 'blocked-wall' }],
    };
  }

  let s: GameState = { ...state, pos: Object.freeze(next) };
  const events: GameEvent[] = [];
  if (crossesWall) {
    s = { ...s, crossedWall: true };
    events.push({ type: 'win' });
    s = withLog(s, '🎉 You climbed the STAIRS-TREE and passed the WALL! GOAL!!');
    return { state: s, events };
  }

  // ---- tile interactions ---------------------------------------------------
  if (vecEquals(next, SEEDBAG_POS) && !s.hasSeeds) {
    s = { ...s, hasSeeds: true };
    s = withLog(s, '🌰 Found the BAG OF SEEDS! Plant it at the soil patch, at T<=-50y.');
    events.push({ type: 'pickup-seeds' });
  } else if (vecEquals(next, SPINGER_POS)) {
    if (!s.hasWaterCan) {
      s = { ...s, hasWaterCan: true };
      s = withLog(s, '💧 The WATER SPINGER fills your can! Water the tree every 10 years.');
      events.push({ type: 'fill-can' });
    } else {
      s = withLog(s, '💧 The spinger hums softly. Refreshed!');
    }
  } else if (vecEquals(next, PLANT_POS)) {
    return applyInteract(s);
  } else {
    s = withLog(s, describeTile(s));
  }
  return { state: s, events };
}

function describeTile(s: GameState): string {
  if (s.crossedWall) return '🏆 Beyond the wall! Chrono Gardener!';
  if (vecEquals(s.pos, GOAL_POS)) return '🌀 GOAL reached!';
  return `You are at (${s.pos.x},${s.pos.y}) · ${formatTime(s.time)}`;
}

// ---------------------------------------------------------------------------
// PLANT / WATER — Space or E while standing on the soil patch
// ---------------------------------------------------------------------------
export function applyInteract(state: GameState): RulesResult {
  if (!vecEquals(state.pos, PLANT_POS)) {
    return { state: withLog(state, 'Stand on the SOIL PATCH (brown tiles) to plant or water.'), events: [] };
  }
  if (state.tree.plantedAt !== null) return applyWater(state);
  return applyPlant(state);
}

function applyPlant(state: GameState): RulesResult {
  if (!state.hasSeeds) {
    return {
      state: withLog(state, 'Empty hands... find the BAG OF SEEDS first! (north-east spur)'),
      events: [{ type: 'plant', ok: false, stunted: false }],
    };
  }
  if (state.time >= 0) {
    return {
      state: withLog(state, '❄️ Frozen ground at T>=0 — the seed will never wake here.'),
      events: [{ type: 'plant', ok: false, stunted: false }],
    };
  }
  const stunted = state.time > PLANT_DEADLINE;
  const tree: TreeModel = Object.freeze({
    plantedAt: state.time,
    lastWateredAt: state.time,
    status: stunted ? 'stunted' : 'seedling',
  });
  const s = { ...state, tree };
  const msg = stunted
    ? `🥀 Planted at ${formatTime(state.time)} — TOO LATE! Only a STUNTED shrub will grow.`
    : `🌱 Seedling planted at ${formatTime(state.time)}. Keep it watered EVERY ${WATER_INTERVAL} YEARS!`;
  return { state: withLog(s, msg), events: [{ type: 'plant', ok: true, stunted }] };
}

function applyWater(state: GameState): RulesResult {
  const tree = state.tree;
  if (tree.status === 'dead') {
    return { state: withLog(state, '🪦 The tree is gone. Press R to rewind the whole cycle.'), events: [{ type: 'water', ok: false }] };
  }
  if (!state.hasWaterCan) {
    return { state: withLog(state, '🚱 No water! Visit the WATER SPINGER (west crossroad spur).'), events: [{ type: 'water', ok: false }] };
  }
  if (state.time > 0) {
    const s = { ...state, tree: Object.freeze({ ...tree, status: 'dead' as const }) };
    return { state: withLog(s, '❄️ The stream is frozen past T-0... you waited too long!'), events: [{ type: 'water', ok: false }, { type: 'tree-died' }] };
  }
  if (tree.status === 'stunted') {
    const s = { ...state, tree: Object.freeze({ ...tree, lastWateredAt: state.time }) };
    return { state: withLog(s, '💧 Watering the stunted shrub... it sadly stays tiny.'), events: [{ type: 'water', ok: true }] };
  }

  const age = state.time - (tree.plantedAt ?? 0);
  const grown = age >= MATURE_AGE;
  const tree2: TreeModel = Object.freeze({
    ...tree,
    lastWateredAt: state.time,
    status: grown ? 'grown' : 'growing',
  });
  const s = { ...state, tree: tree2 };
  const msg = grown
    ? '🌳 The tree is FULLY GROWN and happy! Return to T-0 now!'
    : `💧 Watered at ${formatTime(state.time)} (age ${age}y). Keep the rhythm: every ${WATER_INTERVAL}y!`;
  return { state: withLog(s, msg), events: [{ type: 'water', ok: true }] };
}

// ---------------------------------------------------------------------------
// TIME TRAVEL — arrows up/down or clock clicks (±10 years)
// ---------------------------------------------------------------------------
export function applyTimeTravel(state: GameState, deltaYears: number, playerOnPatch: boolean): RulesResult {
  const clampedTime = Math.max(-100, Math.min(50, state.time + deltaYears));
  const clamped = clampedTime === state.time;
  if (clamped) {
    const msg = deltaYears > 0 ? '⏩ End of time (T+50y).' : '⏪ Start of time (T-100y).';
    return { state: withLog(state, msg), events: [{ type: 'time-travel', delta: deltaYears, clamped: true }] };
  }

  const prev = state.time;
  let s: GameState = { ...state, time: clampedTime };
  const events: GameEvent[] = [{ type: 'time-travel', delta: deltaYears, clamped: false }];
  const tree = s.tree;

  // ---- abandonment: left the patch unwatered across a decade => death -----
  if (tree.plantedAt !== null && isAlive(tree) && !s.stairsReady) {
    const lastW = tree.lastWateredAt ?? tree.plantedAt;
    const away = manhattan(s.pos, PLANT_POS);
    const crossedDeadline = Math.max(clampedTime, prev) > lastW + WATER_INTERVAL;
    if (!playerOnPatch && away > 1 && crossedDeadline) {
      s = { ...s, tree: Object.freeze({ ...tree, status: 'dead' }) };
      s = withLog(s, `☠️ You left it unwatered for more than ${WATER_INTERVAL} YEARS — the tree died!`);
      events.push({ type: 'tree-died' });
      return { state: s, events };
    }
  }

  // ---- watering deadline & growth progression ------------------------------
  if (tree.plantedAt !== null && (tree.status === 'seedling' || tree.status === 'growing')) {
    const lastW = tree.lastWateredAt ?? tree.plantedAt;
    const gap = Math.abs(clampedTime - lastW);
    if (gap > WATER_INTERVAL) {
      s = { ...s, tree: Object.freeze({ ...tree, status: 'dead' }) };
      s = withLog(s, `☠️ MORE THAN ${WATER_INTERVAL} YEARS WITHOUT WATER — the tree died!`);
      events.push({ type: 'tree-died' });
      return { state: s, events };
    }
    const age = clampedTime - tree.plantedAt;
    const status = age >= MATURE_AGE && clampedTime <= 0 ? 'grown' : age > 0 ? 'growing' : tree.status;
    s = { ...s, tree: Object.freeze({ ...tree, status: status as TreeModel['status'] }) };
  }

  // ---- arriving back at T-0: evaluate the whole lifecycle ------------------
  if (clampedTime === 0) {
    if (tree.plantedAt !== null && tree.plantedAt <= PLANT_DEADLINE && isAlive(s.tree)) {
      s = { ...s, tree: Object.freeze({ ...s.tree, status: 'grown' }), stairsReady: true };
      s = withLog(s, '✨ T-0 : A LIVING TREE WITH STAIRS rose before the wall! Pass it!');
      events.push({ type: 'stairs-appear' });
    } else if (tree.plantedAt !== null && s.tree.status === 'stunted') {
      s = { ...s, stairsReady: false };
      s = withLog(s, '🌿 T-0 : The stunted shrub is far too small... the wall stands firm.');
    } else if (tree.plantedAt !== null && s.tree.status === 'dead') {
      s = withLog(s, '🪵 T-0 : Only a DEAD tree remains. No stairs. (R to retry)');
    } else {
      s = withLog(s, 'T-0 : Nothing was planted. The wall keeps its secret.');
    }
  } else if (s.stairsReady && clampedTime > 0) {
    // the stair-window only exists AT T-0
    s = { ...s, stairsReady: false };
    s = withLog(s, '⏳ The stairs shimmer out of time... return to T-0 to use them.');
  }
  return { state: s, events };
}

export function applyReset(): RulesResult {
  // lazy import avoided: build fresh initial state via same constants
  const s: GameState = {
    pos: START_POS,
    time: 0,
    hasSeeds: false,
    hasWaterCan: false,
    tree: EMPTY_TREE,
    stairsReady: false,
    crossedWall: false,
    message: '🔄 Cycle rewound. Plant <= -50y, water every 10y, return to T-0!',
    log: [],
  };
  return { state: s, events: [] };
}
