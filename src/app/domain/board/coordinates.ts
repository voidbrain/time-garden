/** Immutable grid coordinate on the 12x12 isometric board. */
export interface Vec {
  readonly x: number;
  readonly y: number;
}

export const vec = (x: number, y: number): Vec => Object.freeze({ x, y });

export const vecEquals = (a: Vec, b: Vec): boolean => a.x === b.x && a.y === b.y;

export const vecAdd = (a: Vec, b: Vec): Vec => vec(a.x + b.x, a.y + b.y);

/** Manhattan distance between two cells. */
export const manhattan = (a: Vec, b: Vec): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export const formatTime = (t: number): string => `T${t >= 0 ? '+' : ''}${t}y`;
