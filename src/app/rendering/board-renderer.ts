import { Injectable, signal } from '@angular/core';
import {
  BOARD_SIZE,
  buildBoard,
  PLANT_POS,
  SEEDBAG_POS,
  SPINGER_POS,
  GOAL_POS,
  WALL_ROW,
  WALL_X,
} from '../domain/board/board';
import { formatTime } from '../domain/board/coordinates';
import type { GameState } from '../domain/game-state';
import { MATURE_AGE, treeAge, treeScaleAt } from '../domain/tree/tree.model';
import {
  CLOCK,
  DEADTREE,
  GOAL,
  HERO_IDLE,
  HERO_WALK,
  SEEDBAG,
  SPARK,
  SPINGER,
  STAIRS,
  T_BIG,
  T_SEED,
  T_SPROUT,
  T_STAIRS,
  T_YOUNG,
  TUFT,
  WALLSEG,
  FLOWER_R,
  FLOWER_Y,
  FLOWER_P,
  FLOWER_V,
  hash2,
  paintScaled,
  TILE,
  type SpriteDef,
} from './sprites';
import {
  GRASS_A,
  GRASS_B,
  GRASS_C,
  SOIL,
  SPRITE_H,
  STONE_A,
  STONE_B,
  STONE_C,
  TILE_H,
  TILE_W,
} from './tile-art';

const N = BOARD_SIZE;
// Canvas is authored at native tile resolution: a 12x12 iso board fits in
// (2N * TILE_W/2) x (2N * TILE_H/2 + margin). CSS upscales it pixelated.
const CANVAS_W = N * TILE_W + TILE_W / 2; // 500
const CANVAS_H = N * TILE_H + SPRITE_H + 60; // ~312
const HW = TILE_W / 2; // 20 px half-diamond width
const HH = TILE_H / 2; // 10 px half-diamond height
const ISO_SCALE = 2; // billboard world-units -> canvas px (TILE 26 ≈ 2*HH*… )

export type RotationStep = 0 | 1 | 2 | 3;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  def: SpriteDef;
}

/**
 * Pure-ish canvas renderer for the fine-pixel isometric stage.
 * - Ground = pre-baked 2:1 diamond PNG tiles with extruded sides.
 * - The whole stage can be spun in 90° steps (Q key / ◀ ▶ buttons): grid
 *   coordinates are rotated before projection, so paths, props and the hero
 *   all turn together while WASD keeps following the *screen* axes.
 * - Painter's order guarantees correct depth for billboards at any rotation.
 */
@Injectable()
export class BoardRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private frame = 0;
  private heroAnim: { from: number; to: number; t: number } = { from: -1, to: -1, t: 1 };
  private particles: Particle[] = [];
  private readonly board = buildBoard();
  private readonly images = new Map<string, HTMLImageElement>();

  /** 0..3 quarter-turns of the stage around its centre. */
  readonly rotation = signal<RotationStep>(0);

  /** set by the component when the store emits a water/win event */
  readonly splashRequested = signal(0);

  attach(canvas: HTMLCanvasElement): void {
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) this.ctx.imageSmoothingEnabled = false;
    for (const [name, src] of Object.entries(TILE_SOURCES)) {
      if (this.images.has(name)) continue;
      const img = new Image();
      img.src = src;
      this.images.set(name, img);
    }
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

  rotate(by: 1 | -1): void {
    const next = ((this.rotation() + by + 4) % 4) as RotationStep;
    this.rotation.set(next);
  }

  burst(kind: 'water' | 'win' | 'magic', at: { x: number; y: number }): void {
    const c = this.iso(at.x + 0.5, at.y + 0.5);
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: c.sx,
        y: c.sy,
        vx: (Math.random() - 0.5) * 1.6,
        vy: -Math.random() * 1.8 - 0.4,
        life: 30 + Math.random() * 20,
        def: SPARK,
      });
    }
    void kind;
  }

  // -------------------------------------------------------------------------
  // Isometric projection helpers (rotation-aware)
  // -------------------------------------------------------------------------

  /** Rotate a grid cell (float ok) around the board centre by the current step. */
  private rotXY(px: number, py: number): { x: number; y: number } {
    const c = (N - 1) / 2;
    let x = px - c;
    let y = py - c;
    switch (this.rotation()) {
      case 1:
        [x, y] = [-y, x];
        break;
      case 2:
        [x, y] = [-x, -y];
        break;
      case 3:
        [x, y] = [y, -x];
        break;
      default:
        break;
    }
    return { x: x + c, y: y + c };
  }

  /** Project *grid* coords (cell-centre style) to canvas px through rotation. */
  private iso(px: number, py: number): { sx: number; sy: number } {
    const r = this.rotXY(px, py);
    return {
      sx: (r.x - r.y) * HW + CANVAS_W / 2,
      sy: (r.x + r.y - (N - 1)) * HH + 70,
    };
  }

  /** Grid depth key used for painter sorting at the current rotation. */
  private depthOf(px: number, py: number): number {
    const r = this.rotXY(px, py);
    return r.x + r.y;
  }

  // -------------------------------------------------------------------------
  // Frame painting
  // -------------------------------------------------------------------------
  private paint(state: GameState): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = state.time;
    const frozen = t > 0;

    // ---- sky gradient ------------------------------------------------------
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
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
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // ---- stars in the past epochs -----------------------------------------
    if (t <= -50) {
      ctx.fillStyle = '#fff3ae';
      for (let i = 0; i < 24; i++) {
        const sx = (i * 97) % CANVAS_W;
        const sy = ((i * 53) % 60) + 4;
        if ((this.frame >> 4) % 3 !== i % 3) ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // ---- floating-island slab silhouette under the board ------------------
    this.paintSlab(ctx, frozen);

    // ---- ground tiles + props, strict painter order -----------------------
    const cells: { gx: number; gy: number }[] = [];
    for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) cells.push({ gx, gy });
    cells.sort((a, b) => this.depthOf(a.gx + 0.5, a.gy + 0.5) - this.depthOf(b.gx + 0.5, b.gy + 0.5));

    for (const { gx, gy } of cells) this.paintTile(ctx, gx, gy, state);

    // ---- particles ----------------------------------------------------------
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.life--;
      paintScaled(ctx, p.def, p.x - 3, p.y - 3, 0.24, 0.24);
    }

    // ---- clickable pixel clock, top-right ---------------------------------
    this.paintClockOverlay(ctx, state.time);
  }

  /** Chunky rock mass below the tile field — the "floating island" look. */
  private paintSlab(ctx: CanvasRenderingContext2D, frozen: boolean): void {
    const corners = [
      this.iso(0, 0),
      this.iso(N, 0),
      this.iso(N, N),
      this.iso(0, N),
    ];
    ctx.beginPath();
    ctx.moveTo(corners[0].sx, corners[0].sy - HH);
    for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].sx, corners[i].sy - HH);
    ctx.closePath();
    ctx.save();
    ctx.clip();
    // vertical rock gradient inside the diamond footprint
    const rg = ctx.createLinearGradient(0, corners[0].sy, 0, corners[2].sy + SPRITE_H);
    if (frozen) {
      rg.addColorStop(0, '#4a5a72');
      rg.addColorStop(1, '#20263a');
    } else {
      rg.addColorStop(0, '#6b4d2c');
      rg.addColorStop(0.5, '#4d3418');
      rg.addColorStop(1, '#241509');
    }
    ctx.fillStyle = rg;
    const bottom = corners[2].sy + SPRITE_H + 40;
    ctx.fillRect(0, corners[0].sy, CANVAS_W, bottom);
    // jagged rock striations (deterministic)
    for (let i = 0; i < 40; i++) {
      const rx = hash2(i, 3) * CANVAS_W;
      const ry = corners[0].sy + hash2(i, 9) * (bottom - corners[0].sy);
      ctx.fillStyle = hash2(i, 5) > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,220,160,0.08)';
      ctx.fillRect(Math.round(rx), Math.round(ry), 4 + Math.round(hash2(i, 7) * 8), 2);
    }
    ctx.restore();
  }

  private tileImage(kind: 'grass' | 'stone' | 'soil', gx: number, gy: number): HTMLImageElement | undefined {
    let name: string;
    if (kind === 'soil') name = 'SOIL';
    else if (kind === 'stone') name = ['STONE_A', 'STONE_B', 'STONE_C'][(gx + 2 * gy) % 3];
    else name = ['GRASS_A', 'GRASS_B', 'GRASS_C'][(gx * 2 + gy + (gx * gy) % 2) % 3];
    return this.images.get(name);
  }

  private paintTile(ctx: CanvasRenderingContext2D, gx: number, gy: number, state: GameState): void {
    const cell = this.board[gy][gx];
    const isPlant = gx === PLANT_POS.x && gy === PLANT_POS.y;
    const isWall = gx === WALL_X && gy === WALL_ROW && !state.stairsReady;

    const kind: 'grass' | 'stone' | 'soil' = isPlant ? 'soil' : cell === 'path' ? 'stone' : 'grass';
    const img = this.tileImage(kind, gx, gy);
    const c = this.iso(gx + 0.5, gy + 0.5);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, Math.round(c.sx - HW), Math.round(c.sy - HH));
    }

    // ---- decorations: flowers & tufts live ONLY on grass -------------------
    if (kind === 'grass' && !isPlant) {
      const h = hash2(gx, gy);
      if (h < 0.1) {
        paintScaled(ctx, FLOWER_R, c.sx - 8, c.sy - 14, 0.62, 0.62);
      } else if (h < 0.18) {
        paintScaled(ctx, FLOWER_Y, c.sx - 2, c.sy - 12, 0.62, 0.62);
      } else if (h < 0.26) {
        paintScaled(ctx, FLOWER_P, c.sx - 7, c.sy - 8, 0.55, 0.55);
      } else if (h < 0.33) {
        paintScaled(ctx, FLOWER_V, c.sx + 1, c.sy - 15, 0.55, 0.55);
      } else if (h < 0.52) {
        paintScaled(ctx, TUFT, c.sx - 6 + hash2(gy, gx) * 8, c.sy - 10, 0.6, 0.5);
      }
    }

    // ---- props drawn "on" this tile ----------------------------------------
    const bob = Math.sin((this.frame + gx * 9 + gy * 5) / 22) * 1.2;

    if (gx === SPINGER_POS.x && gy === SPINGER_POS.y) {
      paintScaled(ctx, SPINGER, c.sx - TILE * 0.55, c.sy - TILE * 1.3 + bob * 0.3, 1.15, 1.3);
    }
    if (gx === SEEDBAG_POS.x && gy === SEEDBAG_POS.y && !state.hasSeeds) {
      paintScaled(ctx, SEEDBAG, c.sx - TILE * 0.45, c.sy - TILE * 0.95 + bob, 0.9, 0.9);
    }
    if (gx === GOAL_POS.x && gy === GOAL_POS.y) {
      paintScaled(ctx, GOAL, c.sx - TILE * 0.55, c.sy - TILE * 1.1 + bob * 0.5, 1.1, 1.1);
    }

    // wall across the goal row at x=9
    if (isWall) {
      paintScaled(ctx, WALLSEG, c.sx - TILE * 0.5, c.sy - TILE * 1.5, 1.0, 1.5);
    }

    // ---- the tree -----------------------------------------------------------
    if (isPlant) this.paintTree(ctx, state, c.sx, c.sy);

    // ---- hero ----------------------------------------------------------------
    if (gx === state.pos.x && gy === state.pos.y) {
      const walking = this.heroAnim.t < 1;
      const def = walking && (this.frame >> 2) % 2 === 0 ? HERO_WALK : HERO_IDLE;
      paintScaled(
        ctx,
        def,
        c.sx - TILE * 0.42,
        c.sy - TILE * 1.25 + (walking ? -2 : bob * 0.4),
        0.85,
        1.06,
      );
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
      paintScaled(ctx, T_STAIRS, sx - w / 2 - TILE * 0.9, sy - TILE * 0.6, 1.0, 1.25);
      paintScaled(ctx, STAIRS, sx + w * 0.2, sy - TILE * 0.35, 0.8, 1.0);
    }
  }

  /** Called by the component on pos change to trigger walk animation. */
  noteMove(from: number, to: number): void {
    this.heroAnim = { from, to, t: 0 };
  }

  /** Rectangle (in canvas pixels) of the clock painted at the top-right. */
  clockRect(): { x: number; y: number; w: number; h: number } {
    return { x: CANVAS_W - 58, y: 6, w: 50, h: 50 };
  }

  /** Hit-test a canvas-pixel point against the clock sprite. */
  isClockHit(px: number, py: number): boolean {
    const r = this.clockRect();
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h + 12;
  }

  /** Inverse projection: canvas pixel -> grid cell honouring current rotation. */
  screenToCell(px: number, py: number): { x: number; y: number } {
    const c = (N - 1) / 2;
    // un-project (ignore rotation first): sx=(u-v)*HW+W/2, sy=(u+v-(N-1))*HH+70
    const u = (px - CANVAS_W / 2) / HW + (py - 70) / HH + (N - 1);
    const v = (py - 70) / HH - (px - CANVAS_W / 2) / HW + (N - 1);
    let x = u / 2 - c;
    let y = v / 2 - c;
    // undo the stage rotation (inverse of rotXY)
    switch (this.rotation()) {
      case 1:
        [x, y] = [y, -x];
        break;
      case 2:
        [x, y] = [-x, -y];
        break;
      case 3:
        [x, y] = [-y, x];
        break;
      default:
        break;
    }
    return { x: Math.floor(x + c), y: Math.floor(y + c) };
  }

  /** Paints the clickable pixel-clock (top-right corner). */
  paintClockOverlay(ctx: CanvasRenderingContext2D, time: number): void {
    const r = this.clockRect();
    paintScaled(ctx, CLOCK, r.x, r.y, r.w / TILE, r.h / TILE);
    ctx.fillStyle = '#000a';
    ctx.fillRect(r.x - 1, r.y + r.h + 2, r.w + 2, 11);
    ctx.fillStyle = '#ffe9a0';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formatTime(time), r.x + r.w / 2, r.y + r.h + 10);
    ctx.textAlign = 'left';
  }
}

const TILE_SOURCES: Record<string, string> = {
  GRASS_A,
  GRASS_B,
  GRASS_C,
  STONE_A,
  STONE_B,
  STONE_C,
  SOIL,
};

export const RENDER_DEFAULTS = Object.freeze({ ISO_SCALE });
