import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameScreenComponent } from './components/game-screen.component';

/** Root shell: renders the game screen and nothing else. */
@Component({
  selector: 'app-root',
  imports: [GameScreenComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<app-game-screen />',
})
export class App {}
