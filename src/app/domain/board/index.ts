// Barrel re-export for the board module. The playground (native browser ESM,
// no bundler) imports paths like '/src/app/domain/board/index.js'; under TS
// resolution this same specifier maps to this file. Keep it a pure re-export.
export * from './coordinates';
export * from './board';
