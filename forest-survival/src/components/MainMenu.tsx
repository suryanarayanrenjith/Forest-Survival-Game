import { useState } from 'react';
import SettingsMenu from './SettingsMenu';

interface MainMenuProps {
  onStartGame: (prompt: string) => void;
  t: (key: string) => string;
}

const MainMenu = ({ onStartGame, t }: MainMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [gameplayPrompt, setGameplayPrompt] = useState('');
  return (
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden bg-gradient-to-b from-gray-900 via-green-900 to-black flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="text-center z-10 space-y-4 md:space-y-6 py-8 px-4 max-w-4xl mx-auto">
        {/* Title */}
        <div style={{ animation: 'fadeIn 1s ease-out' }}>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 mb-2 tracking-wider drop-shadow-2xl">
            {t('gameTitle')} 🤖 AI
          </h1>
          <p className="text-gray-400 text-base md:text-lg font-light tracking-wide">AI-Powered Adaptive Gameplay</p>
        </div>

        {/* AI Feature Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 bg-opacity-60 backdrop-blur-md p-4 md:p-5 rounded-2xl border-2 border-purple-400 max-w-2xl mx-auto" style={{ animation: 'scaleIn 0.8s ease-out 0.3s both' }}>
          <p className="text-purple-300 text-xl md:text-2xl mb-2 font-bold">🤖 GPT-Powered Game Director</p>
          <p className="text-white text-sm md:text-base">Describe your ideal gameplay experience and let AI create it</p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div className="bg-black bg-opacity-30 p-2 rounded-lg">
              <span className="text-green-400">✓</span> Dynamic difficulty
            </div>
            <div className="bg-black bg-opacity-30 p-2 rounded-lg">
              <span className="text-green-400">✓</span> Smart enemy spawns
            </div>
            <div className="bg-black bg-opacity-30 p-2 rounded-lg">
              <span className="text-green-400">✓</span> Real-time adaptation
            </div>
            <div className="bg-black bg-opacity-30 p-2 rounded-lg">
              <span className="text-green-400">✓</span> Personalized challenge
            </div>
          </div>
        </div>

        {/* Gameplay Prompt Input */}
        <div className="bg-black bg-opacity-60 backdrop-blur-md p-6 rounded-2xl border-2 border-cyan-500 max-w-2xl mx-auto" style={{ animation: 'scaleIn 0.8s ease-out 0.4s both' }}>
          <p className="text-cyan-300 text-lg md:text-xl mb-3 font-semibold">💭 Describe Your Perfect Game</p>
          <textarea
            value={gameplayPrompt}
            onChange={(e) => setGameplayPrompt(e.target.value)}
            placeholder="Example: I want a challenging but fair experience with mostly fast enemies and occasional tank bosses. Make it intense and exciting, with night atmosphere for extra tension..."
            className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border-2 border-gray-700 focus:border-cyan-500 focus:outline-none transition-all resize-none h-32"
          />
          <div className="mt-3 text-xs text-gray-400 space-y-1">
            <p>💡 <strong>Tips:</strong></p>
            <p>• Specify difficulty: "easy/relaxing", "challenging", "brutal/nightmare"</p>
            <p>• Choose atmosphere: "day" or "night"</p>
            <p>• Define enemies: "lots of weak enemies" or "fewer but stronger foes"</p>
            <p>• Set pace: "slow and tactical" or "fast-paced chaos"</p>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="bg-black bg-opacity-60 backdrop-blur-md p-4 rounded-2xl border border-yellow-500 max-w-2xl mx-auto" style={{ animation: 'scaleIn 0.8s ease-out 0.45s both' }}>
          <p className="text-yellow-300 text-sm mb-2">📝 Quick Prompts:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setGameplayPrompt("I want a relaxing daytime experience with moderate enemy waves. Nothing too intense, just want to enjoy the scenery and shooting.")}
              className="bg-gray-800 hover:bg-gray-700 text-left p-2 rounded-lg transition-colors border border-gray-600"
            >
              <span className="text-green-400">🌿</span> Chill Mode
            </button>
            <button
              onClick={() => setGameplayPrompt("Give me the most brutal nightmare difficulty possible. Constant waves of fast and tank enemies. I want to barely survive. Night time with maximum intensity.")}
              className="bg-gray-800 hover:bg-gray-700 text-left p-2 rounded-lg transition-colors border border-gray-600"
            >
              <span className="text-red-400">💀</span> Nightmare Mode
            </button>
            <button
              onClick={() => setGameplayPrompt("Balanced challenge with a mix of all enemy types. Start moderate and gradually increase difficulty as I progress. Day time with good visibility.")}
              className="bg-gray-800 hover:bg-gray-700 text-left p-2 rounded-lg transition-colors border border-gray-600"
            >
              <span className="text-blue-400">⚖️</span> Balanced Experience
            </button>
            <button
              onClick={() => setGameplayPrompt("I want to face lots of weak enemies that I can mow down easily and feel powerful. Occasional tough boss to keep it interesting. Fast paced action.")}
              className="bg-gray-800 hover:bg-gray-700 text-left p-2 rounded-lg transition-colors border border-gray-600"
            >
              <span className="text-yellow-400">⚡</span> Power Fantasy
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 md:gap-4 justify-center" style={{ animation: 'scaleIn 0.8s ease-out 0.5s both' }}>
          <button
            onClick={() => gameplayPrompt.trim() && onStartGame(gameplayPrompt)}
            disabled={!gameplayPrompt.trim()}
            className={`font-bold py-4 md:py-5 px-8 md:px-12 rounded-2xl text-xl md:text-2xl transition-all transform shadow-2xl border-2 ${
              gameplayPrompt.trim()
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-purple-400 hover:scale-110 active:scale-95 cursor-pointer'
                : 'bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            🚀 {t('startGame')}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 md:py-5 px-6 md:px-8 rounded-2xl text-xl md:text-2xl transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-2xl border-2 border-gray-500"
          >
            ⚙️
          </button>
        </div>

        {/* Version Info */}
        <p className="text-gray-600 text-xs md:text-sm mt-4" style={{ animation: 'fadeIn 1.5s ease-out 1s both' }}>
          Version 4.0 - AI Edition | GPT-Powered Gameplay
        </p>
      </div>

      {/* Settings Menu */}
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default MainMenu;
