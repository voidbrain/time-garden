import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { BoardRenderer } from './rendering/board-renderer';
import { GameStore } from './state/game.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // Singleton game state + renderer for the whole session.
    GameStore,
    BoardRenderer,
  ],
};
