import { useCallback, useEffect, useRef, useState } from 'react';
import IsoGarden from './game/IsoGarden';
import Hud from './components/Hud';
import {
  initialState, tryMove, advanceTime, interactPlant, resetState,
  TIME_STEP, type GameState, type Dir,
} from './game/logic';

export default function App() {
  const [state, setState] = useState<GameState>(() => initialState());
  const stateRef = useRef(state);
  stateRef.current = state;

  const move = useCallback((dir: Dir) => setState(s => tryMove(s, dir)), []);
  const timeJump = useCallback((d: number) => setState(s => advanceTime(s, d)), []);
  const act = useCallback(() => setState(s => interactPlant(s)), []);
  const reset = useCallback(() => setState(resetState()), []);

  // keyboard controls : WASD (screen axes) + arrows (time) + space/E + R
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // WASD mapped to SCREEN directions of the iso view:
      //   W = up-right (+x), S = down-left (-x), D = down-right (+y), A = up-left (-y)
      if (k === 'w') { e.preventDefault(); move('N'); }
      else if (k === 's') { e.preventDefault(); move('S'); }
      else if (k === 'd') { e.preventDefault(); move('E'); }
      else if (k === 'a') { e.preventDefault(); move('W'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); timeJump(+TIME_STEP); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); timeJump(-TIME_STEP); }
      else if (k === ' ' || k === 'e' || e.key === 'Enter') { e.preventDefault(); act(); }
      else if (k === 'r') { e.preventDefault(); reset(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, timeJump, act, reset]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1bc46e]">
      <IsoGarden state={state} />
      <Hud
        state={state}
        onClockFwd={() => timeJump(+TIME_STEP)}
        onClockBack={() => timeJump(-TIME_STEP)}
      />
    </div>
  );
}
