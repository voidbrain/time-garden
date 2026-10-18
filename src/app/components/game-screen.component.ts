import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BoardComponent } from './board.component';
import { ClockComponent } from './clock.component';
import { ControlsComponent } from './controls.component';
import { HudComponent } from './hud.component';
import { InputLayerComponent } from './input-layer.component';
import { LogPanelComponent } from './log-panel.component';

/** Pure layout shell — no store access, children own their data needs. */
@Component({
  selector: 'app-game-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BoardComponent,
    ClockComponent,
    ControlsComponent,
    HudComponent,
    InputLayerComponent,
    LogPanelComponent,
  ],
  template: `
    <main class="screen">
      <header class="title">
        <h1>⌛ CHRONO GARDEN ⌚</h1>
        <p class="sub">★ 8-BIT ISOMETRIC TIME FARMER ★</p>
      </header>

      <app-hud />

      <div class="stage">
        <app-board />
        <app-clock class="clock-corner" />
      </div>

      <app-controls />
      <app-log-panel />

      <app-input-layer />
    </main>
  ],
  styles: [
    `
    :host {
      display: block;
    }
    .screen {
      max-width: 680px;
      margin: 0 auto;
      padding: 10px 12px 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .title {
      text-align: center;
      font-family: 'Courier New', monospace;
    }
    .title h1 {
      margin: 0;
      font-size: clamp(18px, 4vw, 30px);
      color: #ffd94a;
      text-shadow: 3px 3px 0 #a82830, 6px 6px 0 #14141e;
      letter-spacing: 2px;
    }
    .sub {
      margin: 2px 0 0;
      color: #7fd0ff;
      font-size: 11px;
      letter-spacing: 4px;
    }
    .stage {
      position: relative;
      align-self: center;
    }
    .clock-corner {
      position: absolute;
      top: 6px;
      right: -70px;
    }
    @media (max-width: 820px) {
      .clock-corner {
        right: 4px;
        top: auto;
        bottom: -8px;
        transform: translateY(100%);
      }
    }
    .victory {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      text-align: center;
      color: #14141e;
      background: repeating-linear-gradient(45deg, #ffd94a 0 12px, #fff3ae 12px 24px);
      border: 4px solid #a86408;
      padding: 8px;
      animation: blink 0.8s steps(2) infinite;
    }
    @keyframes blink {
      50% {
        filter: invert(1);
      }
    }
    `,
  ],
})
export class GameScreenComponent {}
