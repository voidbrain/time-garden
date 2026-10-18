import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { formatTime } from '../domain/board/coordinates';
import { WATER_INTERVAL, treeAge } from '../domain/tree/tree.model';
import { GameStore } from '../state/game.store';

/** Heads-up display: reads store slices via computeds, dispatches nothing. */
@Component({
  selector: 'app-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hud" data-testid="hud">
      <span class="chip time" [class.frozen]="frozen()" [class.past]="deepPast()">⏱ {{ timeLabel() }}</span>
      <span class="chip" [class.off]="!store.hasSeeds()">🌰 SEEDS</span>
      <span class="chip" [class.off]="!store.hasWaterCan()">💧 CAN</span>
      <span class="chip tree" [attr.data-tree-status]="treeStatus()">🌳 {{ treeLabel() }}</span>
      @if (nextDue() !== null) {
        <span class="chip next">NEXT 💧 IN {{ nextDue() }}y</span>
      }
      @if (store.stairsReady()) {
        <span class="chip win">✨ STAIRS-TREE AT T-0!</span>
      }
      @if (store.crossedWall()) {
        <span class="chip win">🏆 BEYOND THE WALL!</span>
      }
    </div>
  ],
  styles: [
    `
    :host {
      display: block;
    }
    .hud {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 13px;
      letter-spacing: 1px;
    }
    .chip {
      background: #141420;
      color: #cbffab;
      border: 2px solid #57c04f;
      padding: 4px 8px;
      box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.7);
    }
    .chip.off {
      opacity: 0.35;
      filter: grayscale(1);
    }
    .chip.time {
      color: #fff3ae;
      border-color: #e8a020;
    }
    .chip.time.frozen {
      color: #cdefff;
      border-color: #4fa8f0;
    }
    .chip.time.past {
      color: #cda4ec;
      border-color: #7b3fa0;
    }
    .chip.next {
      color: #7fd0ff;
      border-color: #2a6fdc;
      animation: blink 1s steps(2) infinite;
    }
    .chip.win {
      color: #ffd94a;
      border-color: #fff3ae;
      animation: blink 0.6s steps(2) infinite;
    }
    @keyframes blink {
      50% {
        opacity: 0.55;
      }
    }
    `,
  ],
})
export class HudComponent {
  protected readonly store = inject(GameStore);

  protected readonly timeLabel = computed(() => formatTime(this.store.time()));
  protected readonly frozen = computed(() => this.store.time() > 0);
  protected readonly deepPast = computed(() => this.store.time() <= -50);

  protected readonly treeStatus = computed(() => this.store.tree().status);
  protected readonly treeLabel = computed(() => {
    const tree = this.store.tree();
    switch (tree.status) {
      case 'none':
        return 'NOT PLANTED';
      case 'dead':
        return 'DEAD';
      case 'stunted':
        return 'STUNTED';
      case 'grown':
        return `MATURE ${treeAge(tree, this.store.time())}y`;
      default:
        return `AGE ${treeAge(tree, this.store.time())}y`;
    }
  });

  /** Years until the next mandatory watering (null when irrelevant). */
  protected readonly nextDue = computed(() => {
    const tree = this.store.tree();
    const t = this.store.time();
    if (tree.plantedAt === null || tree.status === 'dead' || tree.status === 'stunted') return null;
    const last = tree.lastWateredAt ?? tree.plantedAt;
    return Math.max(0, last + WATER_INTERVAL - t);
  });
}
