# AGENTS.md — Working Guide for AI Coding Agents

This file is the authoritative playbook for automated agents (and humans)
working in this repository. Read it fully before making changes.

## What this project is

**Chrono Garden** — a time-travel gardening puzzle game.
Angular ^22.2, standalone components, **zoneless** change detection, TypeScript
~6.0 strict mode, Vitest ^5 via the `@angular/build:unit-test` builder,
Prettier 3, canvas-based isometric pixel-art rendering. `"private": true` —
no publishing.

## Architecture rules (must be respected)

1. **The domain layer (`src/app/domain/**`) is pure.**
   - No Angular imports, no DOM/canvas APIs, no services, no side effects.
   - Rules are total functions `(state, input) => { state, events }` over
     **immutable** `GameState`. Never mutate; always spread + `Object.freeze`
     new objects (match existing style).
   - All game constants live in the domain (`board.ts`, `tree.model.ts`,
     `game-state.ts`). Do not hardcode magic numbers in components.
2. **Components never import domain rules directly.** They inject `GameStore`
   (`src/app/state/game.store.ts`) and dispatch intents (`move`, `timeJump`,
   `interact`, `reset`). Derived data flows through the store's `computed`
   signals only.
3. **Side effects belong to services / presentation**: sound, particles and FX
   react to `GameEvent`s emitted by the reducer (see `services/`,
   `toObservable` usage in `input-layer.component.ts`). New event types must be
   added to the `GameEvent` union in `game-rules.ts` and handled where events
   are consumed.
4. **Rendering** is isolated in `src/app/rendering/`. Tile art is generated
   base64 PNG data — regenerate with `node tools/generate-tiles.mjs`, never
   hand-edit `tile-art.ts`.
5. Components use `ChangeDetectionStrategy.OnPush` and inline templates.
   Zoneless: rely on signals, never assume `ApplicationRef.tick()` or zones.

## Repository map

```
src/app/domain/board/        Vec coords, 12x12 board, landmark positions, DIR_DELTA
src/app/domain/tree/         TreeModel lifecycle (seedling→growing→grown | stunted | dead)
src/app/domain/rules/        The reducer: applyMove / applyInteract / applyTimeTravel / applyReset
src/app/domain/game-state.ts GameState, TIME_STEP=10, T_MIN=-100, T_MAX=50
src/app/state/               GameStore (signals) — single source of truth
src/app/components/          UI widgets + input layer (keyboard → intents)
src/app/rendering/           Canvas renderer, sprites, generated tile art
src/app/services/            Sound + event fan-out
playground/                  Zero-dependency browser sandbox for the pure domain
tests/                       Cross-cutting scenario tests (full win walkthrough)
tools/                       Asset generators & preview scripts (plain node)
```

## Key game mechanics (invariants encoded in tests)

- Plant deadline: seed must be planted at `T <= PLANT_DEADLINE (-50)` or the
  tree is permanently `stunted`.
- Watering rhythm: `WATER_INTERVAL = 10` years; exceeding it (either by gap at
  travel, or by leaving the patch unwatered while `manhattan(pos, PLANT_POS) > 1`)
  kills the tree. Watering when `time > 0` kills it (frozen stream).
- Maturity: `MATURE_AGE = 48` years since planting ⇒ `grown`.
- Stairs appear **only at exactly T-0** if a living tree was planted ≤ -50y;
  leaving T-0 forward removes them. Crossing the wall row/column with
  `stairsReady` wins (`crossedWall`).
- Time clamps to `[-100, +50]`; movement is walkable anywhere inside 12×12.

## Commands

```bash
npm ci                 # install (package-lock.json is committed)
npm start              # ng serve (dev)
npm run build          # production build (budgets enforced: 500kB warn/1MB err initial)
npm test               # ALL specs — jsdom browser runner (canvas polyfill installed)
npm run test:domain    # pure domain specs on the Node runner (fast, no DOM)
npm run test:playground# playground module smoke test (Node runner)
npm run playground     # static-serve playground/ on http://localhost:8080
npx prettier --write . # formatting (printWidth 100, singleQuote; see .prettierrc)
```

Spec files are discovered from `tsconfig.spec.json` (`src/**/*.spec.ts`) plus
the `tests/` include configured in `angular.json`. If you add a spec outside
those globs, update `tsconfig.spec.json` / the test target's `include`.

## Definition of done

Before declaring any task complete, run **all** of these and fix failures:

1. `npm run build` — compiles clean under strict TS.
2. `npm test` — every suite passes (including `tests/walkthrough.spec.ts`).
3. `npx prettier --check src tools playground tests *.md` — formatted.

## Change protocol

- Behavior changes in `game-rules.ts` **require** updating/adding specs
  (domain unit specs near the code, scenario specs in `tests/`). The walkthrough
  test is the mechanical turk for rule regressions — keep it passing or update
  it deliberately with a comment explaining the intended rule change.
- Keep diffs minimal and idiomatic; follow existing naming (`applyXxx` reducers,
  `withLog` messages carry emoji, `SCREAMING_SNAKE` constants).
- Do not add new dependencies without strong justification (bundle budgets).
- Never commit secrets; never edit `package-lock.json` by hand.
- Log strings shown to players live in the domain (`withLog`); UI copy belongs
  with its component.

## Playground

`playground/index.html` is a zero-build sandbox for experimenting with the game
mechanics outside Angular. It imports the **real** domain modules
(`/src/app/domain/...`) which `tools/serve-playground.mjs` transpiles on the fly
with the local TypeScript package (`npm run playground`, port 8080). The page
also runs a live win-path simulation (`playground/simulate.mjs`) that shares its
path-walking logic with `tests/walkthrough.spec.ts`. Use it to prototype rule
tweaks quickly; anything adopted must land in `src/app/domain` with tests.

## Known pitfalls

- `vitest/globals` types are enabled in `tsconfig.spec.json`; don't import
  `describe/it` explicitly in specs.
- The default test runner is jsdom with the `canvas` npm package; component
  specs that create canvases work, but pixel assertions are brittle — prefer
  behavior assertions.
- Board coordinates: grid `(x, y)` maps to screen diagonals; WASD is resolved
  through stage rotation in `input-layer.component.ts` — do not "fix" axis
  math in the domain, it is intentional.
