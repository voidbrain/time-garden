import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import { PLANT_POS } from '../domain/board/board';
import { GameStore } from '../state/game.store';
import { BoardRenderer } from '../rendering/board-renderer';

/**
 * Presentational board component.
 * Owns ONLY: canvas lifecycle, click hit-testing (clock / tile splash), and
 * feeding the renderer with store snapshots. All game rules live in domain/,
 * all state transitions in the store — nothing else is decided here.
 */
@Component({
  selector: 'app-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame">
      <canvas #canvas (click)="onClick($event)" aria-label="Chrono Garden isometric board"></canvas>
      <div class="scanlines" aria-hidden="true"></div>
      <div class="rot-hint" aria-hidden="true">Q / E ⟳ rotate stage</div>
    </div>
  `,
  styles: `
:host {
  display: block;
}
.frame {
  position: relative;
  line-height: 0;
  border: 4px solid #1c4d22;
  outline: 4px solid #0c0f1a;
  box-shadow: 0 0 0 2px #57c04f, 8px 8px 0 rgba(0, 0, 0, 0.6);
}
canvas {
  width: min(94vw, 660px);
  aspect-ratio: 500 / 312;
  height: auto;
  image-rendering: pixelated;
  cursor: crosshair;
  display: block;
}
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(rgba(0, 0, 0, 0.12) 0 3px, transparent 3px 6px);
}
.rot-hint {
  position: absolute;
  left: 6px;
  bottom: 4px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #fff3ae;
  text-shadow: 1px 1px 0 #000;
  pointer-events: none;
}
`,
})
export class BoardComponent implements OnDestroy {
  private readonly store = inject(GameStore);
  private readonly renderer = inject(BoardRenderer);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // attach once the canvas exists, then keep painting from store snapshots
    toObservable(this.canvasRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.renderer.attach(this.canvasRef().nativeElement);
        this.renderer.start(() => this.store.state());
      });

    // particle bursts when the store emits water / win events (intents only here)
    toObservable(this.store.lastEvents)
      .pipe(takeUntil(this.destroy$))
      .subscribe((events) => {
        if (events.some((e) => e.type === 'water' && e.ok)) this.renderer.burst('water', PLANT_POS);
        if (events.some((e) => e.type === 'stairs-appear' || e.type === 'win')) {
          this.renderer.burst('win', PLANT_POS);
        }
      });

    // walk animation trigger on position change
    toObservable(this.store.pos)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.renderer.noteMove(-1, -1));
  }

  /** Clock clicks advance time +10y; other clicks splash at the clicked cell
   *  (the inverse projection honours the current stage rotation). */
  protected onClick(event: MouseEvent): void {
    const canvas = this.canvasRef().nativeElement;
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (this.renderer.isClockHit(px, py)) {
      this.store.forward();
      this.renderer.burst('magic', PLANT_POS);
    } else {
      this.renderer.burst('water', this.renderer.screenToCell(px, py));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.renderer.stop();
  }
}
