// Shared "autopilot" for the Chrono Garden rule engine.
//
// It contains NO game logic — only a BFS over the walkable grid and a scripted
// sequence of intents (move / time travel / interact) that drives the REAL
// pure-domain reducer to a guaranteed win. Used by:
//   - playground/index.html   (browser sandbox, via tools/serve-playground.mjs)
//   - tests/walkthrough.spec.ts (vitest scenario suite)
//
// The domain specifier is written as `/src/app/domain/index.js` so the same
// source works both in browsers (native ESM; the playground server maps the
// `.js` request onto the transpiled `index.ts` barrel) and under Vitest/Angular
// esbuild resolution (`index.js` -> `index.ts`).

import {
  applyInteract,
  applyMove,
  applyTimeTravel,
  initialGameState,
  PLANT_POS,
  SEEDBAG_POS,
  SPINGER_POS,
  vec,
  vecEquals,
} from '/src/app/domain/board/index.js';

const BOARD = 12;
const keyOf = (p) => `${p.x},${p.y}`;

/** Shortest grid path (excluding `from`) between two cells. */
export function bfs(from, to) {
  const prev = new Map([[keyOf(from), null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (keyOf(cur) === keyOf(to)) break;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = vec(cur.x + dx, cur.y + dy);
      if (next.x < 0 || next.y < 0 || next.x >= BOARD || next.y >= BOARD) continue;
      if (prev.has(keyOf(next))) continue;
      prev.set(keyOf(next), cur);
      queue.push(next);
    }
  }
  const path = [];
  for (let c = to; c && keyOf(c) !== keyOf(from); c = prev.get(keyOf(c))) path.push(c);
  return path.reverse();
}

/** Grid delta -> Dir using DIR_DELTA semantics (N:+x, S:-x, E:+y, W:-y). */
export function dirTo(cur, next) {
  const dx = next.x - cur.x;
  const dy = next.y - cur.y;
  if (dx === 1) return 'N';
  if (dx === -1) return 'S';
  if (dy === 1) return 'E';
  return 'W';
}

/**
 * Plays a complete winning cycle with the pure rules.
 * Returns `{ state, trace }` where trace logs every time-travel step.
 * Throws if any rule invariant along the way is violated.
 */
export function playWinPath() {
  let state = initialGameState();
  const trace = [];

  const move = (target) => {
    for (const step of bfs(state.pos, target)) {
      state = applyMove(state, dirTo(state.pos, step)).state;
    }
  };
  const travel = (t) => {
    while (state.time !== t) {
      const delta = t > state.time ? 10 : -10;
      const onPatch = vecEquals(state.pos, PLANT_POS);
      state = applyTimeTravel(state, delta, onPatch).state;
      trace.push(`T${state.time}: ${state.message}`);
      if (state.tree.status === 'dead') {
        throw new Error(`tree died at T${state.time}: ${state.message}`);
      }
    }
  };

  // 1. Grab the seeds and fill the can, then stand on the soil patch.
  move(SEEDBAG_POS);
  if (!state.hasSeeds) throw new Error('seed bag pickup failed');
  move(SPINGER_POS);
  if (!state.hasWaterCan) throw new Error('water spinger fill failed');
  move(PLANT_POS);

  // 2. Go back to T-60 (before the -50y plant deadline) and sow the seed.
  travel(-60);
  state = applyInteract(state).state;
  if (state.tree.status !== 'seedling') throw new Error(`plant failed: ${state.tree.status}`);

  // 3. Water on the decade, staying on the patch (no abandonment deaths).
  for (let t = -50; t <= -10; t += 10) {
    travel(t);
    state = applyInteract(state).state;
  }

  // 4. Return to T-0: the living tree grows stairs over the wall.
  travel(0);
  if (!state.stairsReady) throw new Error(`no stairs at T-0 (${state.tree.status})`);

  // 5. Walk to the tile west of the wall gap and step through it.
  state = { ...state, pos: vec(8, 10) }; // teleport for the scripted finale
  const result = applyMove(state, 'N'); // N = +x -> (9,10) is the wall-row cell
  state = result.state;
  if (!state.crossedWall) throw new Error(`wall not crossed: ${state.message}`);
  trace.push(state.message);
  return { state, trace };
}

// Node smoke test: `node playground/simulate.mjs` prints the winning trace.
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('simulate.mjs')) {
  const { trace } = playWinPath();
  console.log(trace.join('\n'));
  console.log('WIN OK');
}
