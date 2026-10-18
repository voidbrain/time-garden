import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, share } from 'rxjs';
import type { GameEvent } from '../domain/rules/game-rules';
import { GameStore } from '../state/game.store';

/**
 * Bridges store events to presentation side-effects (sound, particles).
 * Components stay free of cross-cutting concerns; they only dispatch intents.
 */
@Injectable({ providedIn: 'root' })
export class GameEventsService {
  private readonly store = inject(GameStore);

  /** Hot stream of every game event emitted by the store. */
  readonly events$ = toObservable(this.store.lastEvents).pipe(
    filter((events) => events.length > 0),
    map((events) => [...events]),
    share(),
  );

  ofType<K extends GameEvent['type']>(type: K) {
    return this.events$.pipe(
      filter((evts): evts is Extract<GameEvent, { type: K }>[] =>
        evts.some((e) => e.type === type),
      ),
    );
  }
}
