import { computed, signal } from '@angular/core';
import { initialGameState, TIME_STEP, type GameState } from '../domain/game-state';
import { applyInteract, applyMove, applyReset, applyTimeTravel, type GameEvent } from '../domain/rules/game-rules';
import type { Dir } from '../domain/board/board';

/**
 * GameStore — the single source of truth for game state.
 *
 * Components NEVER mutate state and never import domain rules directly;
 * they dispatch intents (`move`, `timeJump`, ...) which run the pure
 * reducer and expose the new immutable snapshot plus emitted events.
 * Zoneless change detection is driven by these readonly signals.
 */
export class GameStore {
  private readonly _state = signal<GameState>(initialGameState());
  private readonly _events = signal<ReadonlyArray<GameEvent>>([]);

  /** Current immutable snapshot. */
  readonly state = this._state.asReadonly();

  /** Events emitted by the last dispatched action (for FX services). */
  readonly lastEvents = this._events.asReadonly();

  // ---- derived slices so components subscribe to the smallest possible data
  readonly pos = computed(() => this._state().pos);
  readonly time = computed(() => this._state().time);
  readonly hasSeeds = computed(() => this._state().hasSeeds);
  readonly hasWaterCan = computed(() => this._state().hasWaterCan);
  readonly tree = computed(() => this._state().tree);
  readonly stairsReady = computed(() => this._state().stairsReady);
  readonly crossedWall = computed(() => this._state().crossedWall);
  readonly message = computed(() => this._state().message);
  readonly log = computed(() => this._state().log);

  move(dir: Dir): void {
    this.dispatch((s) => applyMove(s, dir));
  }

  /** Arrow keys / clock clicks: one step = 10 years. */
  timeJump(deltaYears: number): void {
    this.dispatch((s) => applyTimeTravel(s, deltaYears, false));
  }

  forward(): void {
    this.timeJump(TIME_STEP);
  }

  backward(): void {
    this.timeJump(-TIME_STEP);
  }

  interact(): void {
    this.dispatch((s) => applyInteract(s));
  }

  reset(): void {
    this.dispatch(() => applyReset());
  }

  private dispatch(reduce: (s: GameState) => { state: GameState; events: ReadonlyArray<GameEvent> }): void {
    const result = reduce(this._state());
    this._state.set(result.state);
    this._events.set(result.events);
  }
}
