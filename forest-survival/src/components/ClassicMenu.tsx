import { useState } from 'react';

interface ClassicMenuProps {
  onStartGame: (difficulty: 'easy' | 'medium' | 'hard', timeOfDay: 'day' | 'night') => void;
  onBack: () => void;
  t: (key: string) => string;
}

const ClassicMenu = ({ onStartGame, onBack, t }: ClassicMenuProps) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<'day' | 'night'>('day');

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-green-900 to-black flex items-center justify-center z-50 p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="text-center z-10 space-y-4 md:space-y-6 py-8 px-4 max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-white hover:text-gray-300 transition-colors flex items-center gap-2"
        >
          ← Back
        </button>

        {/* Title */}
        <div style={{ animation: 'fadeIn 1s ease-out' }}>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 mb-2 tracking-wider drop-shadow-2xl">
            {t('gameTitle')} - Classic Mode
          </h1>
          <p className="text-gray-400 text-base md:text-lg font-light tracking-wide">Traditional Survival Experience</p>
        </div>

        {/* Game Mode Info */}
        <div className="bg-black bg-opacity-60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-green-500 max-w-md mx-auto" style={{ animation: 'scaleIn 0.8s ease-out 0.3s both' }}>
          <p className="text-green-300 text-lg md:text-xl mb-1">♾️ ENDLESS SURVIVAL</p>
          <p className="text-white text-base md:text-lg">Survive as long as you can</p>
          <p className="text-gray-400 text-xs md:text-sm mt-1">Face infinite waves of enemies</p>
          <p className="text-yellow-400 text-xs md:text-sm mt-1">Unlock weapons by earning score!</p>
        </div>

        {/* Difficulty Selection */}
        <div className="bg-black bg-opacity-60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-purple-500 max-w-lg mx-auto" style={{ animation: 'scaleIn 0.8s ease-out 0.4s both' }}>
          <p className="text-purple-300 text-base md:text-lg mb-3">⚔️ SELECT DIFFICULTY</p>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <button
              onClick={() => setSelectedDifficulty('easy')}
              className={`py-2 md:py-3 px-2 md:px-4 rounded-xl text-sm md:text-base font-bold transition-all transform hover:scale-105 ${
                selectedDifficulty === 'easy'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-400 scale-105'
                  : 'bg-gray-800 text-gray-400 border-2 border-gray-600 hover:border-green-400'
              }`}
            >
              😊 EASY
              <div className="text-[10px] md:text-xs mt-1">Challenging</div>
            </button>
            <button
              onClick={() => setSelectedDifficulty('medium')}
              className={`py-2 md:py-3 px-2 md:px-4 rounded-xl text-sm md:text-base font-bold transition-all transform hover:scale-105 ${
                selectedDifficulty === 'medium'
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white border-2 border-yellow-400 scale-105'
                  : 'bg-gray-800 text-gray-400 border-2 border-gray-600 hover:border-yellow-400'
              }`}
            >
              😐 MEDIUM
              <div className="text-[10px] md:text-xs mt-1">Brutal</div>
            </button>
            <button
              onClick={() => setSelectedDifficulty('hard')}
              className={`py-2 md:py-3 px-2 md:px-4 rounded-xl text-sm md:text-base font-bold transition-all transform hover:scale-105 ${
                selectedDifficulty === 'hard'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-2 border-red-400 scale-105'
                  : 'bg-gray-800 text-gray-400 border-2 border-gray-600 hover:border-red-400'
              }`}
            >
              😈 HARD
              <div className="text-[10px] md:text-xs mt-1">Nightmare</div>
            </button>
          </div>
        </div>

        {/* Time of Day Selection */}
        <div className="bg-black bg-opacity-60 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-cyan-500 max-w-lg mx-auto" style={{ animation: 'scaleIn 0.8s ease-out 0.45s both' }}>
          <p className="text-cyan-300 text-base md:text-lg mb-3">🎨 ATMOSPHERE</p>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button
              onClick={() => setSelectedTimeOfDay('day')}
              className={`py-3 md:py-4 px-3 md:px-6 rounded-xl text-sm md:text-base font-bold transition-all transform hover:scale-105 ${
                selectedTimeOfDay === 'day'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-2 border-yellow-300 scale-105'
                  : 'bg-gray-800 text-gray-400 border-2 border-gray-600 hover:border-yellow-300'
              }`}
            >
              ☀️ DAY MODE
              <div className="text-[10px] md:text-xs mt-1">Golden Hour</div>
              <div className="text-[9px] md:text-[10px] text-yellow-200 mt-0.5">Volumetric Lighting</div>
            </button>
            <button
              onClick={() => setSelectedTimeOfDay('night')}
              className={`py-3 md:py-4 px-3 md:px-6 rounded-xl text-sm md:text-base font-bold transition-all transform hover:scale-105 ${
                selectedTimeOfDay === 'night'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-400 scale-105'
                  : 'bg-gray-800 text-gray-400 border-2 border-gray-600 hover:border-indigo-400'
              }`}
            >
              🌙 NIGHT MODE
              <div className="text-[10px] md:text-xs mt-1">Neon Dreams</div>
              <div className="text-[9px] md:text-[10px] text-purple-200 mt-0.5">Moonlight Rays</div>
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex gap-3 md:gap-4 justify-center" style={{ animation: 'scaleIn 0.8s ease-out 0.5s both' }}>
          <button
            onClick={() => onStartGame(selectedDifficulty, selectedTimeOfDay)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 md:py-5 px-8 md:px-12 rounded-2xl text-xl md:text-2xl transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-2xl border-2 border-green-400"
          >
            ▶️ {t('startGame')}
          </button>
        </div>

        {/* Version Info */}
        <p className="text-gray-600 text-xs md:text-sm mt-4" style={{ animation: 'fadeIn 1.5s ease-out 1s both' }}>
          Version 4.0 - Classic Mode
        </p>
      </div>
    </div>
  );
};

export default ClassicMenu;
