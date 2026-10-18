// ============================================================================
// CHRONO GARDEN 8-BIT — NES-style HUD (pixel canvas clock, CRT overlay,
// inventory, message box, key hints). All pixel art drawn on tiny canvases.
// ============================================================================
import { useEffect, useRef } from 'react';
import { CLOCK, spriteTexture, TILE } from '../game/pixel';
import type { GameState } from '../game/logic';

// draw a SpriteDef into a standalone canvas element (for DOM HUD)
export function PixelSprite({ def, px = 4, className = '', onClick, title }: {
  def: { w: number; h: number; rows: string[] };
  px?: number;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    // reuse the three texture painter logic manually for DOM:
    const PAL: Record<string, string> = {
      '.': '', g: '#3e9d44', G: '#57c04f', h: '#79e06a', d: '#2a6e2c', D: '#1c4d22', k: '#12331a', l: '#a8ef7c', L: '#cbffab',
      e: '#8a5a2b', E: '#a9743c', f: '#6b4423', F: '#4d2f16', n: '#331e0e', m: '#caa27a', t: '#e8cba0', T: '#f7e6c2',
      s: '#9aa0ae', S: '#c2c8d6', q: '#6b7080', Q: '#464b5c', z: '#2b2e3c', Z: '#191b26',
      w: '#2a6fdc', W: '#4fa8f0', u: '#7fd0ff', U: '#cdefff', c: '#17408f', C: '#0e2a63',
      y: '#ffd94a', Y: '#fff3ae', o: '#e8a020', O: '#a86408',
      r: '#d84040', R: '#f07068', p: '#a82830', P: '#ff9d9d',
      v: '#7b3fa0', V: '#a86ad0', j: '#4e2470', J: '#cda4ec',
      x: '#14141e', b: '#e8f4ff', B: '#b8dcf4', M: '#841018', N: '#c25a50', K: '#5a4a3a', H: '#8a7458',
    };
    cv.width = def.w * px;
    cv.height = def.h * px;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let yy = 0; yy < def.h; yy++) {
      const row = def.rows[yy] || '';
      for (let xx = 0; xx < def.w; xx++) {
        const chh = row[xx];
        if (!chh || chh === '.') continue;
        const col = PAL[chh];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(xx * px, yy * px, px, px);
      }
    }
  }, [def, px]);
  return <canvas ref={ref} onClick={onClick} title={title} className={`pixelated ${onClick ? 'cursor-pointer' : ''} ${className}`} />;
}

void TILE; void spriteTexture;

export function ClockHUD({ time, onForward, onBack }: { time: number; onForward: () => void; onBack: () => void }) {
  return (
    <div className="nes-panel flex flex-col items-center gap-1 select-none">
      <div className="relative">
        <PixelSprite def={CLOCK} px={5} onClick={onForward} title="Click: +10 years" className="hover:brightness-125 transition-all" />
        {/* pendulum button */}
        <button
          onClick={onBack}
          title="Rewind -10 years"
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#e8a020] border-2 border-[#4d2f16] rounded-sm hover:bg-[#ffd94a] active:translate-y-[2px]"
        />
      </div>
      <div className="mt-2 text-[#ffd94a] font-pixel text-[10px] tracking-widest text-center leading-tight">
        T{time >= 0 ? '+' : '-'}{Math.abs(time)}Y
        <div className="text-[#7fd0ff] text-[8px]">CLICK +10Y</div>
      </div>
    </div>
  );
}

export default function Hud({ state, onClockFwd, onClockBack }: { state: GameState; onClockFwd: () => void; onClockBack: () => void }) {
  return (
    <>
      {/* CRT scanlines + vignette */}
      <div className="crt pointer-events-none fixed inset-0 z-40" />

      {/* Title */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-30 select-none">
        <div className="nes-panel px-4 py-2">
          <h1 className="font-pixel text-[13px] sm:text-base text-[#7fd0ff] glow-cyan tracking-wider text-center">
            CHRONO&nbsp;GARDEN
          </h1>
          <p className="font-pixel text-[8px] text-[#ffd94a] text-center mt-1">★ 8-BIT TIME-FARMER ★</p>
        </div>
      </div>

      {/* CLOCK top-right */}
      <div className="fixed top-2 right-2 z-30">
        <ClockHUD time={state.time} onForward={onClockFwd} onBack={onClockBack} />
      </div>

      {/* Inventory top-left */}
      <div className="fixed top-2 left-2 z-30 hidden sm:flex flex-col gap-2">
        <div className="nes-panel px-2 py-1 flex items-center gap-2">
          <span className="font-pixel text-[8px] text-[#c2c8d6]">ITEMS</span>
        </div>
        <div className={`nes-chip ${state.hasSeeds ? '' : 'dim'}`}>🌰 SEEDS</div>
        <div className={`nes-chip ${state.hasWaterCan ? '' : 'dim'}`}>💧 CAN</div>
        <div className={`nes-chip ${state.stairsReady ? 'sparkle' : 'dim'}`}>🪜 STAIRS</div>
        <div className={`nes-chip ${state.crossedWall ? 'sparkle' : 'dim'}`}>🏆 GOAL</div>
      </div>

      {/* Message box bottom */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30 w-[min(680px,94vw)]">
        <div className="nes-msgbox">
          <p className="font-pixel text-[10px] sm:text-xs text-white leading-relaxed">{state.message}</p>
        </div>
      </div>

      {/* Controls hint bottom-left */}
      <div className="fixed bottom-2 left-2 z-30 hidden md:block">
        <div className="nes-panel px-3 py-2 space-y-1">
          <p className="font-pixel text-[8px] text-[#a8ef7c]">WASD · MOVE PATH</p>
          <p className="font-pixel text-[8px] text-[#a8ef7c]">↑↓ · TIME ±10Y</p>
          <p className="font-pixel text-[8px] text-[#a8ef7c]">SPACE/E · PLANT/WATER</p>
          <p className="font-pixel text-[8px] text-[#ff9d9d]">R · RESET CYCLE</p>
        </div>
      </div>

      {/* mini log bottom-right */}
      <div className="fixed bottom-2 right-2 z-30 hidden lg:block max-w-[260px]">
        <div className="nes-panel px-2 py-1">
          {state.log.slice(-3).map((l, i) => (
            <p key={i} className="font-pixel text-[7px] text-[#7fd0ff] truncate">{l}</p>
          ))}
        </div>
      </div>

      {/* win banner */}
      {state.crossedWall && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 animate-bounce">
          <div className="nes-panel px-4 py-2 border-4 border-[#ffd94a]">
            <p className="font-pixel text-[10px] sm:text-sm text-[#ffd94a] glow-gold">★ YOU PASSED THE WALL! ★</p>
          </div>
        </div>
      )}
    </>
  );
}
