import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import type { Dir } from '../domain/board/board';
import { BoardRenderer } from '../rendering/board-renderer';
import { GameStore } from '../state/game.store';
import { SoundService } from '../services/sound.service';

/**
 * Key → grid direction map. WASD always walks along the SCREEN diagonals of
 * the isometric view; when the stage is rotated the mapping is re-derived so
 * "W" keeps pointing up-right on screen no matter which way the island faces.
 */
const ROT_GRID_DIRS: Record<'N' | 'S' | 'E' | 'W', ('N' | 'S' | 'E' | 'W')[]> = {
  // grid dir that currently points screen-N / S / E / W for rotations 0..3
  N: ['N', 'E', 'S', 'W'],
  E: ['E', 'S', 'W', 'N'],
  S: ['S', 'W', 'N', 'E'],
  W: ['W', 'N', 'E', 'S'],
};

/**
 * Orchestrator component: wires child widgets together and translates raw
 * input (keyboard / pointer) into store intents. Contains zero game rules —
 * every key simply dispatches one intent; the domain decides consequences.
 */
@Component({
  selector: 'app-input-layer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class InputLayerComponent implements OnDestroy {
  private readonly store = inject(GameStore);
  private readonly sound = inject(SoundService);
  private readonly renderer = inject(BoardRenderer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly destroy$ = new Subject<void>();

  /** WASD key -> screen axis, resolved through the current stage rotation. */
  private screenDir(code: string): Dir | undefined {
    const rot = this.renderer.rotation();
    switch (code) {
      case 'KeyW':
        return ROT_GRID_DIRS.N[rot];
      case 'KeyS':
        return ROT_GRID_DIRS.S[rot];
      case 'KeyA':
        return ROT_GRID_DIRS.W[rot];
      case 'KeyD':
        return ROT_GRID_DIRS.E[rot];
      default:
        return undefined;
    }
  }

  constructor() {
    // Keyboard lives on window so focus never blocks gameplay.
    const onKeydown = (event: KeyboardEvent): void => this.handleKey(event);
    window.addEventListener('keydown', onKeydown);
    this.destroyRef.onDestroy(() => window.removeEventListener('keydown', onKeydown));

    // 8-bit blips react to store events — no component reaches into rules.
    toObservable(this.store.lastEvents)
      .pipe(takeUntil(this.destroy$))
      .subscribe((events) => {
        for (const e of events) {
          switch (e.type) {
            case 'water':
              this.sound.play(e.ok ? 'water' : 'blip');
              break;
            case 'plant':
              this.sound.play(e.ok ? 'magic' : 'blip');
              break;
            case 'time-travel':
              this.sound.play('blip');
              break;
            case 'stairs-appear':
            case 'win':
              this.sound.play('win');
              break;
            case 'tree-died':
              this.sound.play('dead');
              break;
            case 'pickup-seeds':
            case 'fill-can':
              this.sound.play('magic');
              break;
            default:
              break;
          }
        }
      });
  }

  /** WASD walk (rotation-aware) · ↑↓ time ±10y · SPACE plant/water · E/Q rotate · R reset. */
  private handleKey(event: KeyboardEvent): void {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    const dir = this.screenDir(event.code);
    if (dir) {
      event.preventDefault();
      this.store.move(dir);
      this.sound.play('step');
      return;
    }
    switch (event.code) {
      case 'ArrowUp':
        event.preventDefault();
        this.store.backward(); // up the arrow = back in time
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.store.forward(); // down the arrow = forward in time
        break;
      case 'Space':
        event.preventDefault();
        this.store.interact();
        break;
      case 'KeyQ':
        event.preventDefault();
        this.renderer.rotate(-1);
        this.sound.play('blip');
        break;
      case 'KeyE':
        event.preventDefault();
        this.renderer.rotate(1);
        this.sound.play('blip');
        break;
      case 'KeyR':
        this.store.reset();
        break;
      default:
        break;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
