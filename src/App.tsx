import { useState, useCallback } from 'react';
import ThreeScene from './components/ThreeScene';

type TreeStage = 'empty' | 'seed' | 'sprout' | 'flowering' | 'adult' | 'old';

const STAGE_THRESHOLDS: { stage: TreeStage; min: number; max: number; label: string }[] = [
  { stage: 'empty', min: 0, max: 0, label: 'Empty Soil' },
  { stage: 'seed', min: 1, max: 20, label: '🌰 Seed' },
  { stage: 'sprout', min: 21, max: 40, label: '🌱 Sprout' },
  { stage: 'flowering', min: 41, max: 60, label: '🌸 Flowering' },
  { stage: 'adult', min: 61, max: 80, label: '🌳 Adult Tree' },
  { stage: 'old', min: 81, max: 100, label: '🪵 Old & Dead' },
];

function getStageFromTime(time: number): TreeStage {
  if (time === 0) return 'empty';
  if (time <= 20) return 'seed';
  if (time <= 40) return 'sprout';
  if (time <= 60) return 'flowering';
  if (time <= 80) return 'adult';
  return 'old';
}

function getStageLabel(time: number): string {
  const stage = getStageFromTime(time);
  const info = STAGE_THRESHOLDS.find(s => s.stage === stage);
  return info?.label || 'Unknown';
}

function getStageDescription(stage: TreeStage): string {
  switch (stage) {
    case 'empty': return 'The soil is bare. Plant a seed to begin!';
    case 'seed': return 'A tiny seed rests in the earth, waiting for water...';
    case 'sprout': return 'Life emerges! A small sprout reaches for the sky.';
    case 'flowering': return 'Beautiful flowers bloom! The tree is in its prime youth.';
    case 'adult': return 'A mighty tree stands tall, providing shade and shelter.';
    case 'old': return 'The tree has lived its full life. Its wood can now serve as stairs!';
  }
}

export default function App() {
  const [timeValue, setTimeValue] = useState(0);
  const [hasSeeded, setHasSeeded] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [showStairs, setShowStairs] = useState(false);
  const [characterPos, setCharacterPos] = useState({ x: -5, z: 2 });
  const [gameMessage, setGameMessage] = useState('Welcome to Chrono Garden! 🌿');
  const [hasPassedWall, setHasPassedWall] = useState(false);
  const [showTimeParticles, setShowTimeParticles] = useState(false);

  const treeStage = getStageFromTime(timeValue);

  const handleSeed = useCallback(() => {
    if (!hasSeeded) {
      setHasSeeded(true);
      setTimeValue(1);
      setGameMessage('🌰 You planted a seed! Now water it to help it grow...');
      setShowTimeParticles(true);
      setTimeout(() => setShowTimeParticles(false), 1000);
    }
  }, [hasSeeded]);

  const handleWater = useCallback(() => {
    if (hasSeeded && timeValue > 0) {
      setHasWater(true);
      setGameMessage('💧 Watering the tree... Watch it grow with the time slider!');
      setTimeout(() => setHasWater(false), 2000);
    }
  }, [hasSeeded, timeValue]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (hasSeeded || newValue === 0) {
      setTimeValue(newValue);
      
      const stage = getStageFromTime(newValue);
      if (stage === 'old' && !showStairs) {
        setShowStairs(true);
        setGameMessage('🪵 The tree is old and dead! Wooden stairs have appeared! You can now climb over the wall!');
      } else if (stage !== 'old') {
        setShowStairs(false);
      }
      
      setGameMessage(`⏳ Time flows... ${getStageLabel(newValue)}`);
    }
  }, [hasSeeded, showStairs]);

  const handleCrossWall = useCallback(() => {
    if (showStairs && !hasPassedWall) {
      setCharacterPos({ x: 3, z: -5 });
      setHasPassedWall(true);
      setGameMessage('🎉 Congratulations! You crossed the wall using the dead tree stairs! Time magic!');
    }
  }, [showStairs, hasPassedWall]);

  const handleReset = useCallback(() => {
    setTimeValue(0);
    setHasSeeded(false);
    setHasWater(false);
    setShowStairs(false);
    setCharacterPos({ x: -5, z: 2 });
    setGameMessage('🔄 Time rewound! A new cycle begins...');
    setHasPassedWall(false);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Three.js Scene */}
      <ThreeScene
        timeValue={timeValue}
        treeStage={treeStage}
        hasWater={hasWater}
        showStairs={showStairs}
        characterPos={characterPos}
      />

      {/* Time particles effect */}
      {showTimeParticles && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-300 animate-ping"
              style={{
                left: `${40 + Math.random() * 20}%`,
                top: `${30 + Math.random() * 30}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
        {/* Top bar */}
        <div className="pointer-events-auto">
          <div className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 backdrop-blur-md rounded-2xl p-4 max-w-lg mx-auto border border-purple-400/30 shadow-lg shadow-purple-500/20">
            <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
              ⏰ Chrono Garden
            </h1>
            <p className="text-center text-purple-200 text-sm mt-1">Navigate through time to overcome obstacles</p>
          </div>
        </div>

        {/* Game message */}
        <div className="pointer-events-auto absolute top-28 left-1/2 -translate-x-1/2">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20 shadow-xl max-w-md">
            <p className="text-white text-center text-sm font-medium">{gameMessage}</p>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="pointer-events-auto">
          <div className="bg-gradient-to-t from-gray-900/90 to-gray-900/70 backdrop-blur-md rounded-2xl p-5 max-w-2xl mx-auto border border-gray-600/30 shadow-2xl">
            {/* Stage indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {treeStage === 'empty' && '⬜'}
                  {treeStage === 'seed' && '🌰'}
                  {treeStage === 'sprout' && '🌱'}
                  {treeStage === 'flowering' && '🌸'}
                  {treeStage === 'adult' && '🌳'}
                  {treeStage === 'old' && '🪵'}
                </span>
                <div>
                  <p className="text-white font-bold text-sm">{getStageLabel(timeValue)}</p>
                  <p className="text-gray-400 text-xs">{getStageDescription(treeStage)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-cyan-300 font-mono text-lg font-bold">{timeValue}</p>
                <p className="text-gray-500 text-xs">Time Units</p>
              </div>
            </div>

            {/* Time Slider */}
            <div className="mb-4">
              <label className="text-gray-300 text-xs mb-1 block font-medium">
                🕐 Time Slider — Drag to flow through time
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={timeValue}
                  onChange={handleTimeChange}
                  disabled={!hasSeeded}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer
                    bg-gradient-to-r from-amber-800 via-green-600 via-50% to-gray-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-gradient-to-br
                    [&::-webkit-slider-thumb]:from-yellow-300
                    [&::-webkit-slider-thumb]:to-orange-500
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-orange-500/50
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-white
                    [&::-webkit-slider-thumb]:cursor-grab
                    [&::-webkit-slider-thumb]:active:cursor-grabbing
                    [&::-moz-range-thumb]:w-6
                    [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-gradient-to-br
                    [&::-moz-range-thumb]:from-yellow-300
                    [&::-moz-range-thumb]:to-orange-500
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-white
                    [&::-moz-range-thumb]:cursor-grab"
                />
                {/* Stage markers */}
                <div className="flex justify-between mt-1 px-1">
                  {STAGE_THRESHOLDS.map((s) => (
                    <span key={s.stage} className="text-[10px] text-gray-500">
                      {s.stage === 'empty' && '·'}
                      {s.stage === 'seed' && '🌰'}
                      {s.stage === 'sprout' && '🌱'}
                      {s.stage === 'flowering' && '🌸'}
                      {s.stage === 'adult' && '🌳'}
                      {s.stage === 'old' && '🪵'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSeed}
                disabled={hasSeeded}
                className="flex-1 min-w-[100px] px-4 py-2.5 rounded-xl font-bold text-sm
                  bg-gradient-to-br from-amber-500 to-orange-600 text-white
                  hover:from-amber-400 hover:to-orange-500
                  disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400
                  transition-all duration-200 shadow-lg shadow-orange-500/30
                  disabled:shadow-none active:scale-95"
              >
                🌰 Plant Seed
              </button>
              
              <button
                onClick={handleWater}
                disabled={!hasSeeded || timeValue === 0}
                className="flex-1 min-w-[100px] px-4 py-2.5 rounded-xl font-bold text-sm
                  bg-gradient-to-br from-cyan-400 to-blue-600 text-white
                  hover:from-cyan-300 hover:to-blue-500
                  disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400
                  transition-all duration-200 shadow-lg shadow-blue-500/30
                  disabled:shadow-none active:scale-95"
              >
                💧 Water
              </button>

              {showStairs && !hasPassedWall && (
                <button
                  onClick={handleCrossWall}
                  className="flex-1 min-w-[100px] px-4 py-2.5 rounded-xl font-bold text-sm
                    bg-gradient-to-br from-green-400 to-emerald-600 text-white
                    hover:from-green-300 hover:to-emerald-500
                    transition-all duration-200 shadow-lg shadow-green-500/30
                    active:scale-95 animate-pulse"
                >
                  🧗 Climb Wall!
                </button>
              )}

              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl font-bold text-sm
                  bg-gradient-to-br from-purple-500 to-indigo-600 text-white
                  hover:from-purple-400 hover:to-indigo-500
                  transition-all duration-200 shadow-lg shadow-purple-500/30
                  active:scale-95"
              >
                🔄 Reset
              </button>
            </div>

            {/* Win state */}
            {hasPassedWall && (
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-400/30">
                <p className="text-green-300 text-center font-bold text-sm">
                  🏆 You mastered the 4th dimension! The tree's lifecycle became your bridge through time!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions panel */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 border border-white/10 max-w-[200px]">
          <h3 className="text-white font-bold text-xs mb-2">📖 How to Play</h3>
          <ol className="text-gray-300 text-[11px] space-y-1 list-decimal list-inside">
            <li>Plant a seed near the wall</li>
            <li>Water it to start growth</li>
            <li>Use the time slider to age the tree</li>
            <li>When the tree dies, stairs appear</li>
            <li>Climb over the wall!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
