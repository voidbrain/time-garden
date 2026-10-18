import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { formatTime } from '../domain/board/coordinates';
import { GameStore } from '../state/game.store';

/** Scrolling chronicle of the last game messages (read-only view of the log). */
@Component({
  selector: 'app-log-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel">
      <div class="msg" data-testid="message">▸ {{ store.message() }}</div>
      <ul class="log">
        @for (entry of store.log(); track $index) {
          <li><span class="t">[{{ fmt(entry.time) }}]</span> {{ entry.text }}</li>
        }
      </ul>
    </div>
  ],
  styles: [`
    :host {
      display: block;
    }
    .panel {
      background: #0c0f1a;
      border: 3px solid #2a6e2c;
      box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.7), inset 0 0 24px rgba(87, 192, 79, 0.12);
      padding: 8px 10px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      min-height: 120px;
    }
    .msg {
      color: #cbffab;
      font-weight: bold;
      margin-bottom: 6px;
    }
    ul.log {
      list-style: none;
      margin: 0;
      padding: 0;
      color: #8fa9bd;
    }
    li {
      padding: 1px 0;
      white-space: pre-wrap;
    }
    .t {
      color: #7b3fa0;
      font-weight: bold;
    }
  ],
})
export class LogPanelComponent {
  protected readonly store = inject(GameStore);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // auto-scroll to newest entry without touching zones
    toObservable(this.store.log)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {});
  }

  protected readonly fmt = formatTime;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
