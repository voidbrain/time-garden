import { computed, effect, inject, signal } from '@angular/core';
import { BOARD_SIZE, buildBoard, PLANT_POS, SPINGER_POS, WALL_ROW, WALL_X } from '../domain/board/board';
import { formatTime } from '../domain/board/coordinates';
import type { GameState } from '../domain/game-state';
import { MATURE_AGE, treeAge, treeScaleAt } from '../domain/tree/tree.model';
import { GameStore } from '../state/game.store';
import {
  CLOCK,
  DEADTREE,
  GOAL,
  GRASS_A,
  GRASS_B,
  HERO_IDLE,
  HERO_WALK,
  PATH_TILE,
  SEEDBAG,
  SPARK,
  SPINGER,
  STAIRS,
  T_BIG,
  T_SEED,
  T_SPROUT,
  T_STAIRS,
  T_YOUNG,
  TILE,
  TUFT,
  WALLSEG,
  FLOWER_R,
  FLOWER_Y,
  paintScaled,
  type SpriteDef,
} from './sprites';

const N = BOARD_SIZE;
const CANVAS_PX = N * TILE; // 12 * 26 = 312 world px, upscaled by CSS pixelate

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  def: SpriteDef;
}

/**
 * Pure-ish canvas renderer. It reads the store snapshot through a computed
 * and paints on requestAnimationFrame — no Angular zone involved (zoneless).
 */
export class BoardRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private frame = 0;
  private heroAnim: { from: number; to: number; t: number } = { from: -1, to: -1, t: 1 };
  private particles: Particle[] = [];
  private readonly board = buildBoard();

  /** set by the component when the store emits a water/win event */
  readonly splashRequested = signal(0);

  attach(canvas: HTMLCanvasElement): void {
    canvas.width = CANVAS_PX;
    canvas.height = CANVAS_PX;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  }

  start(getState: () => GameState): void {
    const loop = (): void => {
      this.frame++;
      this.paint(getState());
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  burst(kind: 'water' | 'win' | 'magic', at: { x: number; y: number }): void {
    const defs = kind === 'water' ? [SPARK] : [SPARK];
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: at.x * TILE + TILE / 2,
        y: at.y * TILE + TILE / 2,
        vx: (Math.random() - 0.5) * 2.4,
        vy: -Math.random() * 2.6 - 0.4,
        life: 30 + Math.random() * 20,
        def: defs[i % defs.length],
      });
    }
  }

  // -------------------------------------------------------------------------
  // Isometric projection helpers
  // -------------------------------------------------------------------------
  private iso(px: number, py: number): { sx: number; sy: number } {
    // classic 2:1 isometric tile placement, centered in the canvas
    const cx = N / 2;
    const cy = N / 2;
    return {
      sx: (px - py) * (TILE * 0.86) + CANVAS_PX / 2,
      sy: (px + py - cx - cy) * (TILE * 0.5) + CANVAS_PX / 2 + 10,
    };
  }

  private diamondPath(ctx: CanvasRenderingContext2D, gx: number, gy: number, inset = 0): void {
    const hw = TILE * 0.86 - inset;
    const hh = TILE * 0.5 - inset * 0.58;
    const c = this.iso(gx + 0.5, gy + 0.5);
    ctx.beginPath();
    ctx.moveTo(c.sx, c.sy - hh);
    ctx.lineTo(c.sx + hw, c.sy);
    ctx.lineTo(c.sx, c.sy + hh);
    ctx.lineTo(c.sx - hw, c.sy);
    ctx.closePath();
  }

  private paint(state: GameState): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = state.time;
    const frozen = t > 0;

    // ---- sky gradient ------------------------------------------------------
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_PX);
    if (frozen) {
      g.addColorStop(0, '#1b2a4a');
      g.addColorStop(1, '#3a4f7a');
    } else if (t <= -50) {
      g.addColorStop(0, '#241a3e');
      g.addColorStop(1, '#4a2f5f');
    } else {
      g.addColorStop(0, '#1d2f5e');
      g.addColorStop(1, '#3f6fbf');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

    // ---- stars in the past epochs -----------------------------------------
    if (t <= -50) {
      ctx.fillStyle = '#fff3ae';
      for (let i = 0; i < 24; i++) {
        const sx = ((i * 97) % CANVAS_PX);
        const sy = ((i * 53) % 90) + 6;
        if ((this.frame >> 4) % 3 !== i % 3) ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // ---- ground tiles (painter's order) ------------------------------------
    for (let sum = 0; sum <= 2 * (N - 1); sum++) {
      for (let gx = 0; gx < N; gx++) {
        const gy = sum - gx;
        if (gy < 0 || gy >= N) continue;
        this.paintTile(ctx, gx, gy, state);
      }
    }

    // ---- particles ----------------------------------------------------------
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life--;
      paintScaled(ctx, p.def, p.x - 3, p.y - 3, 0.24, 0.24);
    }
  }

  private paintTile(ctx: CanvasRenderingContext2D, gx: number, gy: number, state: GameState): void {
    const cell = this.board[gy][gx];
    const isWall = gx === WALL_X && gy === WALL_ROW && !state.stairsReady;
    const isPlant = gx === PLANT_POS.x && gy === PLANT_POS.y;

    // base diamond
    this.diamondPath(ctx, gx, gy);
    if (cell === 'path') {
      ctx.fillStyle = '#8a6b3f';
    } else if (isPlant) {
      ctx.fillStyle = '#4d2f16';
    } else {
      const alt = (gx + gy) % 2 === 0;
      ctx.fillStyle = state.time > 0 ? (alt ? '#9fb6c9' : '#8fa9bd') : alt ? '#3ea34a' : '#379a41';
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // path speckles
    if (cell === 'path') {
      const c = this.iso(gx + 0.5, gy + 0.5);
      ctx.fillStyle = '#6d5430';
      ctx.fillRect(c.sx - 6, c.sy - 2, 3, 2);
      ctx.fillRect(c.sx + 2, c.sy + 1, 3, 2);
    }
    if (isPlant) {
      const c = this.iso(gx + 0.5, gy + 0.5);
      ctx.fillStyle = '#331e0e';
      for (let i = 0; i < 4; i++) ctx.fillRect(c.sx - 8 + i * 5, c.sy - 3 + (i % 2) * 5, 3, 3);
    }

    // grass tufts (deterministic scatter)
    if (cell === 'grass' && !isPlant && (gx * 7 + gy * 13) % 5 === 0) {
      const def = (gx + gy) % 3 === 0 ? FLOWER_R : (gx * gy) % 7 === 0 ? FLOWER_Y : TUFT;
      const c = this.iso(gx + 0.5, gy + 0.5);
      paintScaled(ctx, def, c.sx - 5, c.sy - 9, 0.42, 0.42);
    }

    // ---- props drawn "on" this tile ----------------------------------------
    const c = this.iso(gx + 0.5, gy + 0.5);
    const bob = Math.sin((this.frame + gx * 9 + gy * 5) / 22) * 1.5;

    if (gx === SPINGER_POS.x && gy === SPINGER_POS.y) {
      paintScaled(ctx, SPINGER, c.sx - TILE * 0.55, c.sy - TILE * 1.25 + bob * 0.4, 1.15, 1.15);
    }
    if (gx === 8 && gy === 9 && !state.hasSeeds) {
      paintScaled(ctx, SEEDBAG, c.sx - TILE * 0.45, c.sy - TILE * 0.95 + bob, 0.9, 0.9);
    }
    if (gx === 10 && gy === 10) {
      paintScaled(ctx, GOAL, c.sx - TILE * 0.55, c.sy - TILE * 1.1 + bob * 0.6, 1.1, 1.1);
    }

    // wall across the goal row at x=9
    if (isWall && gy === WALL_ROW) {
      for (let k = 0; k < 2; k++) {
        paintScaled(ctx, WALLSEG, c.sx - TILE * 0.5 + k * 4, c.sy - TILE * 1.35 - k * 10, 1.0, 1.0);
      }
    }

    // ---- the tree -----------------------------------------------------------
    if (isPlant && gx === PLANT_POS.x && gy === PLANT_POS.y) {
      this.paintTree(ctx, state, c.sx, c.sy);
    }

    // ---- hero ----------------------------------------------------------------
    if (gx === state.pos.x && gy === state.pos.y) {
      const walking = this.heroAnim.t < 1;
      const def = walking && (this.frame >> 2) % 2 === 0 ? HERO_WALK : HERO_IDLE;
      paintScaled(ctx, def, c.sx - TILE * 0.42, c.sy - TILE * 1.15 + (walking ? -2 : bob * 0.4), 0.85, 0.85);
    }
  }

  private paintTree(ctx: CanvasRenderingContext2D, state: GameState, sx: number, sy: number): void {
    const tree = state.tree;
    if (tree.plantedAt === null) return;
    const age = treeAge(tree, state.time);
    const scale = treeScaleAt(tree, state.time);
    const h = TILE * (1.2 + scale * 3.2);
    const w = h * 0.8;

    let def: SpriteDef = T_SEED;
    if (tree.status === 'dead') def = DEADTREE;
    else if (tree.status === 'stunted') def = T_SPROUT;
    else if (age < 16) def = T_SEED;
    else if (age < 32) def = T_SPROUT;
    else if (age < MATURE_AGE) def = T_YOUNG;
    else def = T_BIG;

    paintScaled(ctx, def, sx - w / 2, sy - h - TILE * 0.2, w / TILE, h / TILE);

    // sparkles around a happy growing tree
    if ((tree.status === 'growing' || tree.status === 'grown') && this.frame % 26 < 13) {
      paintScaled(ctx, SPARK, sx + w * 0.3, sy - h * 0.8, 0.2, 0.2);
    }

    // the stairs-tree at T-0 glows and shows climbable steps
    if (state.stairsReady) {
      paintScaled(ctx, T_STAIRS, sx - w / 2 - TILE * 0.9, sy - TILE * 0.6, 1.0, 1.0);
      paintScaled(ctx, STAIRS, sx + w * 0.2, sy - TILE * 0.35, 0.8, 0.8);
    }
  }

  /** Called by the component on pos change to trigger walk animation. */
  noteMove(from: number, to: number): void {
    this.heroAnim = { from, to, t: 0 };
  }

  clockRect(): { x: number; y: number; w: number; h: number } {
    return { x: CANVAS_PX - 46, y: 6, w: 40, h: 40 };
  }

  paintClockOverlay(ctx: CanvasRenderingContext2D, time: number): void {
    const r = this.clockRect();
    paintScaled(ctx, CLOCK, r.x, r.y, r.w / TILE, r.h / TILE);
    ctx.fillStyle = '#000';
    ctx.font = '8px monospace';
    ctx.fillText(formatTime(time), r.x, r.y + r.h + 9);
  }
}

export const RENDER_DEFAULTS = Object.freeze({ GRASS_A, GRASS_B });
