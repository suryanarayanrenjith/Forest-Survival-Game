import { useState } from 'react';
import SettingsMenu from './SettingsMenu';

interface MainMenuProps {
  onStartGame: () => void;
  t: (key: string) => string;
}

const MainMenu = ({ onStartGame, t }: MainMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-gray-900 via-green-900 to-black flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="text-center z-10 space-y-8">
        {/* Title */}
        <div style={{ animation: 'fadeIn 1s ease-out' }}>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 mb-2 tracking-wider drop-shadow-2xl">
            {t('gameTitle')}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide">Survive the Nightmare</p>
        </div>

        {/* Objective */}
        <div className="bg-black bg-opacity-60 backdrop-blur-md p-6 rounded-2xl border border-green-500 max-w-md mx-auto" style={{ animation: 'scaleIn 0.8s ease-out 0.3s both' }}>
          <p className="text-green-300 text-xl mb-2">🎯 MISSION OBJECTIVE</p>
          <p className="text-white text-lg">Eliminate 50 enemies to win</p>
          <p className="text-gray-400 text-sm mt-2">Face increasingly difficult waves</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center" style={{ animation: 'scaleIn 0.8s ease-out 0.5s both' }}>
          <button
            onClick={onStartGame}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 px-16 rounded-2xl text-3xl transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-2xl border-2 border-green-400"
          >
            ▶️ {t('startGame')}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-6 px-8 rounded-2xl text-2xl transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-2xl border-2 border-gray-500"
          >
            ⚙️
          </button>
        </div>

        {/* Version Info */}
        <p className="text-gray-600 text-sm mt-8" style={{ animation: 'fadeIn 1.5s ease-out 1s both' }}>
          Version 2.0 - Enhanced Edition
        </p>
      </div>

      {/* Settings Menu */}
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default MainMenu;
