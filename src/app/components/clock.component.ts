import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { formatTime } from '../domain/board/coordinates';
import { TIME_STEP } from '../domain/game-state';
import { GameStore } from '../state/game.store';

/**
 * Pixel clock widget (mirrors the clickable sprite painted on the canvas).
 * Reads the store for display; dispatches pure time intents on click.
 */
@Component({
  selector: 'app-clock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <div class="clockbox">
      <button
        type="button"
        class="face"
        data-testid="clock-button"
        [title]="'Click: +' + step() + ' years'"
        (click)="store.forward()"
      >
        <span class="hand" [style.transform]="'rotate(' + handAngle() + 'deg)'"></span>
        <span class="tick n"></span><span class="tick e"></span><span class="tick s"></span><span class="tick w"></span>
      </button>
      <div class="readout">{{ label() }}</div>
      <div class="btns">
        <button type="button" data-testid="back-btn" (click)="store.backward()">◀ −{{ step() }}y</button>
        <button type="button" data-testid="fwd-btn" (click)="store.forward()">+{{ step() }}y ▶</button>
      </div>
      </div>
    `,
  styles: `
:host {
  display: block;
}
.clockbox {
  text-align: center;
  font-family: 'Courier New', monospace;
}
.face {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 4px solid #a86408;
  background: radial-gradient(circle at 35% 30%, #fff3ae, #e8a020 70%);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.7);
  cursor: pointer;
  position: relative;
  padding: 0;
}
.face:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
.hand {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 16px;
  background: #14141e;
  transform-origin: 50% 100%;
  translate: -50% -100%;
}
.tick {
  position: absolute;
  width: 3px;
  height: 5px;
  background: #4d2f16;
}
.tick.n {
  top: 2px;
  left: 50%;
  translate: -50%;
}
.tick.s {
  bottom: 2px;
  left: 50%;
  translate: -50%;
}
.tick.e {
  right: 2px;
  top: 50%;
  translate: 0 -50%;
  width: 5px;
  height: 3px;
}
.tick.w {
  left: 2px;
  top: 50%;
  translate: 0 -50%;
  width: 5px;
  height: 3px;
}
.readout {
  margin-top: 3px;
  color: #ffe9a0;
  background: #000a;
  font-weight: bold;
  font-size: 12px;
  padding: 1px 4px;
}
.btns {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-top: 4px;
}
.btns button {
  font-family: inherit;
  font-weight: bold;
  font-size: 11px;
  background: #141420;
  color: #7fd0ff;
  border: 2px solid #2a6fdc;
  padding: 2px 6px;
  cursor: pointer;
}
.btns button:active {
  transform: translate(1px, 1px);
}
`,
})
export class ClockComponent {
  protected readonly store = inject(GameStore);

  protected readonly step = () => TIME_STEP;
  protected readonly label = computed(() => formatTime(this.store.time()));

  /** Hour hand sweeps one full turn across the whole 150-year window. */
  protected readonly handAngle = computed(() => ((this.store.time() + 100) / 150) * 360);
}
