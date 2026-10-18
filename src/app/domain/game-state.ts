import type { Vec } from './board/coordinates';
import { EMPTY_TREE, type TreeModel } from './tree/tree.model';

/** One entry of the in-game chronicle. */
export interface LogEntry {
  readonly time: number;
  readonly text: string;
}

/** Complete immutable snapshot of a running game. */
export interface GameState {
  readonly pos: Vec;
  readonly time: number; // current year offset (T-100 .. T+50)
  readonly hasSeeds: boolean; // picked up the bag of seeds
  readonly hasWaterCan: boolean; // filled at the spinger
  readonly tree: TreeModel;
  readonly stairsReady: boolean; // living tree + stairs appeared at T-0
  readonly crossedWall: boolean; // reached the goal past the wall
  readonly message: string;
  readonly log: ReadonlyArray<LogEntry>;
}

export const TIME_STEP = 10; // one arrow press / clock click = 10 years
export const T_MIN = -100;
export const T_MAX = 50;

export function initialGameState(): GameState {
  return Object.freeze({
    pos: Object.freeze({ x: 1, y: 10 }),
    time: 0,
    hasSeeds: false,
    hasWaterCan: false,
    tree: EMPTY_TREE,
    stairsReady: false,
    crossedWall: false,
    message: 'Walk the path! Find the BAG OF SEEDS and the WATER SPINGER.',
    log: [],
  });
}
