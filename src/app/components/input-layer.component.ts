import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import type { Dir } from '../domain/board/board';
import { GameStore } from '../state/game.store';
import { SoundService } from '../services/sound.service';

/** Key → screen-direction map for the isometric view (WASD moves along axes). */
const MOVE_KEYS: Record<string, Dir> = {
  KeyW: 'N',
  KeyS: 'S',
  KeyA: 'W',
  KeyD: 'E',
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly destroy$ = new Subject<void>();

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

  /** WASD move · ↑↓ time travel ±10y · Space/E plant & water · R reset. */
  private handleKey(event: KeyboardEvent): void {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    const dir = MOVE_KEYS[event.code];
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
      case 'KeyE':
        event.preventDefault();
        this.store.interact();
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
