/** Pure tree lifecycle model — no Angular, no DOM. */

export type TreeStatus =
  | 'none' // nothing planted
  | 'seedling' // planted, waiting for water
  | 'growing' // sprout -> sapling -> big (stage derived from age)
  | 'grown' // fully alive & big, still needs watering
  | 'stunted' // planted too late (-40y..-1y): tiny sad tree forever
  | 'dead'; // missed a watering decade, or froze past T-0

export interface TreeModel {
  readonly plantedAt: number | null;
  readonly lastWateredAt: number | null;
  readonly status: TreeStatus;
}

export const EMPTY_TREE: TreeModel = Object.freeze({
  plantedAt: null,
  lastWateredAt: null,
  status: 'none',
});

/** Years elapsed since planting (0 when nothing is planted). */
export function treeAge(tree: TreeModel, time: number): number {
  return tree.plantedAt === null ? 0 : Math.max(0, time - tree.plantedAt);
}

/** A tree is considered FULLY GROWN after this many years of life. */
export const MATURE_AGE = 48;

/** Watering interval in years — miss it and the tree dies. */
export const WATER_INTERVAL = 10;

/** Seedling must be planted at this year offset or earlier, else stunted/dead. */
export const PLANT_DEADLINE = -50;

/** Visual scale factor 0..1 at a given year offset. */
export function treeScaleAt(tree: TreeModel, time: number): number {
  switch (tree.status) {
    case 'seedling':
      return 0.18;
    case 'dead':
      return 0.8;
    case 'stunted':
      return 0.32;
    case 'growing':
      return Math.min(1, 0.2 + treeAge(tree, time) / 60); // full size after ~48y
    case 'grown':
      return 1;
    default:
      return 0;
  }
}

export const isAlive = (tree: TreeModel): boolean =>
  tree.status === 'seedling' || tree.status === 'growing' || tree.status === 'grown';
