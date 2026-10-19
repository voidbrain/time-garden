import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BoardRenderer } from '../rendering/board-renderer';
import { GameStore } from '../state/game.store';

/** Static control legend + rotate / reset buttons (intents only, no rules). */
@Component({
  selector: 'app-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <div class="controls" data-testid="controls">
      <span><b>WASD</b> walk</span>
      <span><b>↑↓</b> ±10 years</span>
      <span><b>SPACE</b> plant & water</span>
      <span><b>Q/E</b> rotate stage</span>
      <button type="button" data-testid="rot-ccw" (click)="renderer.rotate(-1)">⟲ Q</button>
      <button type="button" data-testid="rot-cw" (click)="renderer.rotate(1)">E ⟳</button>
      <button type="button" data-testid="reset-btn" (click)="store.reset()">⟲ R RESET</button>
      </div>
    `,
  styles: `
:host {
  display: block;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #b8dcf4;
}
b {
  color: #ffd94a;
}
button {
  font-family: inherit;
  font-weight: bold;
  background: #2b2e3c;
  color: #f07068;
  border: 2px solid #d84040;
  padding: 3px 8px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.7);
}
button:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
`,
})
export class ControlsComponent {
  protected readonly store = inject(GameStore);
  protected readonly renderer = inject(BoardRenderer);
}
