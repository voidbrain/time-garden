import { vec, type Vec } from './coordinates';

/** Board side length: the garden is exactly 12x12 squares. */
export const BOARD_SIZE = 12;

export type CellType = 'grass' | 'path';

/** Compass direction in *screen* space of the isometric view. */
export type Dir = 'N' | 'S' | 'E' | 'W';

/** Screen-axis deltas: W moves up-right on screen, D moves down-right. */
export const DIR_DELTA: Record<Dir, Vec> = Object.freeze({
  N: vec(1, 0),
  S: vec(-1, 0),
  E: vec(0, 1),
  W: vec(0, -1),
});

// ---------------------------------------------------------------------------
// Landmark positions (winding path with curves and two crossroads)
// ---------------------------------------------------------------------------
export const START_POS: Vec = vec(1, 10);
export const SPINGER_POS: Vec = vec(6, 6); // water spinger — spur off crossroad #1
export const SEEDBAG_POS: Vec = vec(8, 9); // bag of seeds — spur off crossroad #2
export const PLANT_POS: Vec = vec(5, 8); // soil patch on the row-8 road
export const GOAL_POS: Vec = vec(10, 10); // goal tile beyond the wall
export const WALL_X = 9; // wall column…
export const WALL_ROW = 10; // …on the east road row

/** The winding road: north leg, NW curve, east ridge, NE curve, south leg,
 *  west cross-spur to the spinger, crossing row, SW curve, goal row + seed spur. */
const PATH_CELLS: ReadonlyArray<readonly [number, number]> = Object.freeze([
  [1, 10], [1, 9], [1, 8], [1, 7], [1, 6], [1, 5], [1, 4], [1, 3],
  [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2],
  [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8],
  [9, 6], [8, 6], [7, 6], [6, 6],
  [9, 8], [8, 8], [7, 8], [6, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8],
  [1, 9],
  [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10],
  [8, 9],
]);

/** Build the immutable cell grid (row-major: grid[y][x]). */
export function buildBoard(): ReadonlyArray<ReadonlyArray<CellType>> {
  const grid: CellType[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 'grass' as CellType),
  );
  for (const [x, y] of PATH_CELLS) grid[y][x] = 'path';
  return grid.map((row) => Object.freeze(row));
}

export const isWalkable = (_board: ReadonlyArray<ReadonlyArray<CellType>>, p: Vec): boolean =>
  p.x >= 0 && p.y >= 0 && p.x < BOARD_SIZE && p.y < BOARD_SIZE;
