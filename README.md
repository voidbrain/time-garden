# 🌳⏳ Chrono Garden

A tiny time-travel gardening puzzle game built with **Angular 22** (standalone,
zoneless) and rendered as an **isometric pixel-art garden** on HTML5 canvas.

Plant a seed in the past, keep it watered across the decades, and watch — or
fail to watch — it grow into the tree that becomes your staircase over the wall.

## How to play

You start at **T-0** on a 12×12 isometric island guarded by a mossy WALL.

1. **Find the BAG OF SEEDS** (north-east spur off the second crossroad).
2. **Visit the WATER SPINGER** (west spur off the first crossroad) to fill your can.
3. **Travel back in time** (`↑` / `↓`, ±10 years per press) and **plant the seed
   at T ≤ -50y** on the SOIL PATCH. Plant later than that and only a stunted
   shrub will ever grow.
4. **Water the tree every 10 years.** Miss a decade of watering while you are
   away from the patch and the tree dies. Watering after T+0 freezes the stream
   and kills it too.
5. After ~48 watered years the tree is fully grown. **Return to exactly T-0**:
   a living tree grows stairs over the wall — walk through them to the GOAL.
6. Press `R` at any time to rewind the whole cycle.

### Controls

| Key           | Action                                        |
| ------------- | --------------------------------------------- |
| `W A S D`     | Walk along the screen diagonals of the iso view |
| `↑` / `↓`     | Time travel +10 / −10 years                   |
| `Space` / `E` | Plant (if unplanted) / water (if planted)     |
| `R`           | Reset the cycle                               |
| Mouse wheel / on-screen buttons | Rotate the stage & click the clock |

## Project layout

```
src/
  app/
    domain/               # Pure game logic — NO Angular, NO DOM
      board/              #   coordinates (Vec), 12x12 board & landmarks
      tree/               #   tree lifecycle model (ages, statuses, scale)
      rules/              #   immutable reducer: applyMove / applyInteract / applyTimeTravel
      game-state.ts       #   GameState snapshot + initial state
    state/game.store.ts   # Angular signal store; components dispatch intents only
    rendering/            # Canvas renderer, tile art, sprites (painter's algorithm)
    components/           # Board, HUD, clock, controls, log, input layer
    services/             # Sound + game-event fan-out for FX
  styles.css              # Global styles
tools/
  generate-tiles.mjs      # Regenerates base64 pixel-art tiles into src/app/rendering/tile-art.ts
playground/
  index.html              # Zero-dependency browser sandbox for the pure domain
                          # (open directly, or `npm run playground`)
tests/
  walkthrough.spec.ts     # Full win-path scenario against the real rule engine
```

## Development

```bash
npm ci
npm start          # ng serve → http://localhost:4200
npm run build      # production build into dist/
npm test           # all unit tests (browser runner: jsdom)
npm run test:domain# pure domain tests only (Node runner, no DOM)
npm run playground # serve the playground at http://localhost:8080
```

The playground lets you exercise the rule engine (move, plant, water, time
travel, reset) in a plain console page without building the Angular app — ideal
for quick mechanics experiments.

## Tech notes

- **Angular ^22.2**, standalone components, `ChangeDetectionStrategy.OnPush`,
  zoneless change detection via signals.
- Game rules are **pure functions** returning `{ state, events }`; UI side
  effects (sound, particles) subscribe to emitted events.
- Tests run on **Vitest** through the `@angular/build:unit-test` builder
  (jsdom by default, Node for the pure domain suite).
- Deployed to GitHub Pages via `.github/workflows/deploy.yml`.

## License

Private / educational project scaffold — see `package.json` (`"private": true`).
