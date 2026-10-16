import { useState, useCallback } from 'react';
import ThreeScene from './components/ThreeScene';

type TreeStage = 'empty' | 'seed' | 'sprout' | 'flowering' | 'adult' | 'old';

const STAGE_INFO: { stage: TreeStage; emoji: string; label: string; desc: string }[] = [
  { stage: 'empty', emoji: '⬜', label: 'Empty Soil', desc: 'Plant a seed to begin your journey through time!' },
  { stage: 'seed', emoji: '🌰', label: 'Seed Planted', desc: 'A tiny seed rests in the earth, waiting for water...' },
  { stage: 'sprout', emoji: '🌱', label: 'Sprouting', desc: 'Life emerges! A small sprout reaches for the sky.' },
  { stage: 'flowering', emoji: '🌸', label: 'In Bloom', desc: 'Beautiful flowers bloom on the young tree!' },
  { stage: 'adult', emoji: '🌳', label: 'Full Growth', desc: 'A mighty tree stands tall and proud.' },
  { stage: 'old', emoji: '🪵', label: 'Ancient & Dead', desc: 'The tree has lived its full life. Stairs appear!' },
];

function getStageFromTime(time: number): TreeStage {
  if (time === 0) return 'empty';
  if (time <= 20) return 'seed';
  if (time <= 40) return 'sprout';
  if (time <= 60) return 'flowering';
  if (time <= 80) return 'adult';
  return 'old';
}

function getStageInfo(time: number) {
  const stage = getStageFromTime(time);
  return STAGE_INFO.find(s => s.stage === stage) || STAGE_INFO[0];
}

export default function App() {
  const [timeValue, setTimeValue] = useState(0);
  const [hasSeeded, setHasSeeded] = useState(false);
  const [hasWater, setHasWater] = useState(false);
  const [showStairs, setShowStairs] = useState(false);
  const [characterPos, setCharacterPos] = useState({ x: -2, z: 2 });
  const [gameMessage, setGameMessage] = useState('Welcome to Chrono Garden! 🌿');
  const [hasPassedWall, setHasPassedWall] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const treeStage = getStageFromTime(timeValue);
  const stageInfo = getStageInfo(timeValue);

  const handleSeed = useCallback(() => {
    if (!hasSeeded) {
      setHasSeeded(true);
      setTimeValue(1);
      setGameMessage('🌰 You planted a seed! Now water it to help it grow...');
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1500);
    }
  }, [hasSeeded]);

  const handleWater = useCallback(() => {
    if (hasSeeded && timeValue > 0) {
      setHasWater(true);
      setGameMessage('💧 Watering... Use the time slider to grow the tree!');
      setTimeout(() => setHasWater(false), 2500);
    }
  }, [hasSeeded, timeValue]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (hasSeeded || newValue === 0) {
      setTimeValue(newValue);
      
      const stage = getStageFromTime(newValue);
      if (stage === 'old' && !showStairs) {
        setShowStairs(true);
        setGameMessage('🪵 The tree is old and dead! Wooden stairs appeared! Climb the wall!');
      } else if (stage !== 'old') {
        setShowStairs(false);
      }
      
      const info = getStageInfo(newValue);
      setGameMessage(`${info.emoji} ${info.desc}`);
    }
  }, [hasSeeded, showStairs]);

  const handleCrossWall = useCallback(() => {
    if (showStairs && !hasPassedWall) {
      setCharacterPos({ x: 1.5, z: -3.5 });
      setHasPassedWall(true);
      setGameMessage('🎉 You crossed the wall! You mastered the 4th dimension!');
    }
  }, [showStairs, hasPassedWall]);

  const handleReset = useCallback(() => {
    setTimeValue(0);
    setHasSeeded(false);
    setHasWater(false);
    setShowStairs(false);
    setCharacterPos({ x: -2, z: 2 });
    setGameMessage('🔄 Time rewound! A new cycle begins...');
    setHasPassedWall(false);
  }, []);

  const progressPercent = (timeValue / 100) * 100;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Three.js Scene */}
      <ThreeScene
        timeValue={timeValue}
        treeStage={treeStage}
        hasWater={hasWater}
        showStairs={showStairs}
        characterPos={characterPos}
      />

      {/* Sparkle effects */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${35 + Math.random() * 30}%`,
                top: `${25 + Math.random() * 40}%`,
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: '1.2s',
              }}
            >
              <span className="text-xl">✨</span>
            </div>
          ))}
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5">
        {/* Top bar */}
        <div className="pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 max-w-md mx-auto border border-white/50 shadow-xl shadow-pink-200/30">
            <h1 className="text-xl sm:text-2xl font-black text-center bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              ⏰ Chrono Garden
            </h1>
            <p className="text-center text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">Navigate through time ✨</p>
          </div>
        </div>

        {/* Game message bubble */}
        <div className="pointer-events-auto absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 w-[90%] max-w-sm">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-pink-200/50 shadow-lg shadow-pink-100/50">
            <p className="text-gray-700 text-center text-xs sm:text-sm font-semibold">{gameMessage}</p>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="pointer-events-auto">
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-4 sm:p-5 max-w-lg mx-auto border border-white/50 shadow-2xl shadow-purple-200/30">
            {/* Stage indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-xl shadow-inner">
                  {stageInfo.emoji}
                </div>
                <div>
                  <p className="text-gray-800 font-bold text-sm">{stageInfo.label}</p>
                  <p className="text-gray-400 text-[11px]">Stage {STAGE_INFO.findIndex(s => s.stage === treeStage) + 1}/6</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-transparent bg-gradient-to-r from-purple-500 to-pink-500 font-black text-xl">{timeValue}</p>
                <p className="text-gray-400 text-[10px] font-medium">TIME UNITS</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-amber-400 via-green-400 to-purple-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Time Slider */}
            <div className="mb-4">
              <label className="text-gray-600 text-xs mb-1.5 block font-bold">
                🕐 Drag to flow through time
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={timeValue}
                onChange={handleTimeChange}
                disabled={!hasSeeded}
                className="w-full h-4 rounded-full appearance-none cursor-pointer
                  bg-gradient-to-r from-amber-200 via-green-200 via-50% to-gray-300
                  disabled:opacity-40 disabled:cursor-not-allowed
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-7
                  [&::-webkit-slider-thumb]:h-7
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gradient-to-br
                  [&::-webkit-slider-thumb]:from-yellow-300
                  [&::-webkit-slider-thumb]:to-pink-400
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-pink-300/50
                  [&::-webkit-slider-thumb]:border-3
                  [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing
                  [&::-webkit-slider-thumb]:active:scale-110
                  [&::-moz-range-thumb]:w-7
                  [&::-moz-range-thumb]:h-7
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-gradient-to-br
                  [&::-moz-range-thumb]:from-yellow-300
                  [&::-moz-range-thumb]:to-pink-400
                  [&::-moz-range-thumb]:border-3
                  [&::-moz-range-thumb]:border-white
                  [&::-moz-range-thumb]:cursor-grab"
              />
              {/* Stage markers */}
              <div className="flex justify-between mt-1 px-0.5">
                {STAGE_INFO.map((s) => (
                  <span key={s.stage} className="text-[10px]">
                    {s.emoji}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSeed}
                disabled={hasSeeded}
                className="flex-1 min-w-[90px] px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm
                  bg-gradient-to-br from-amber-300 to-orange-400 text-white
                  hover:from-amber-200 hover:to-orange-300 hover:shadow-lg hover:shadow-orange-200/50
                  disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400
                  transition-all duration-200 active:scale-95"
              >
                🌰 Plant
              </button>
              
              <button
                onClick={handleWater}
                disabled={!hasSeeded || timeValue === 0}
                className="flex-1 min-w-[90px] px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm
                  bg-gradient-to-br from-cyan-300 to-blue-400 text-white
                  hover:from-cyan-200 hover:to-blue-300 hover:shadow-lg hover:shadow-blue-200/50
                  disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400
                  transition-all duration-200 active:scale-95"
              >
                💧 Water
              </button>

              {showStairs && !hasPassedWall && (
                <button
                  onClick={handleCrossWall}
                  className="flex-1 min-w-[90px] px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm
                    bg-gradient-to-br from-green-300 to-emerald-400 text-white
                    hover:from-green-200 hover:to-emerald-300 hover:shadow-lg hover:shadow-green-200/50
                    transition-all duration-200 active:scale-95 animate-bounce"
                >
                  🧗 Climb!
                </button>
              )}

              <button
                onClick={handleReset}
                className="px-3 py-2.5 rounded-2xl font-bold text-xs sm:text-sm
                  bg-gradient-to-br from-purple-300 to-pink-400 text-white
                  hover:from-purple-200 hover:to-pink-300 hover:shadow-lg hover:shadow-pink-200/50
                  transition-all duration-200 active:scale-95"
              >
                🔄
              </button>
            </div>

            {/* Win state */}
            {hasPassedWall && (
              <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50">
                <p className="text-green-700 text-center font-bold text-xs sm:text-sm">
                  🏆 You mastered time! The tree's lifecycle became your bridge!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions panel */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto hidden sm:block">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 border border-white/50 shadow-lg max-w-[180px]">
          <h3 className="text-gray-700 font-bold text-xs mb-1.5">📖 How to Play</h3>
          <ol className="text-gray-500 text-[10px] space-y-0.5 list-decimal list-inside leading-relaxed">
            <li>Plant a seed</li>
            <li>Water it</li>
            <li>Slide time forward</li>
            <li>When tree dies → stairs!</li>
            <li>Climb the wall!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
