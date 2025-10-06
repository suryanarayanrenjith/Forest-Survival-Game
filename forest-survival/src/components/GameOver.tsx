interface GameOverProps {
  isVictory: boolean;
  score: number;
  enemiesKilled: number;
  wave: number;
  onRestart: () => void;
  onMainMenu: () => void;
  t: (key: string) => string;
}

const GameOver = ({ isVictory, score, enemiesKilled, wave, onRestart, onMainMenu, t }: GameOverProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-sm">
      <div className="text-center max-w-2xl" style={{ animation: 'scaleIn 0.5s ease-out' }}>
        {/* Title */}
        <h1 className={`text-8xl font-bold mb-8 ${isVictory ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600'}`}>
          {isVictory ? '🏆 ' + t('youSurvived') : '💀 ' + t('gameOver')}
        </h1>

        {/* Subtitle */}
        {isVictory && (
          <p className="text-2xl text-green-300 mb-8 animate-pulse">You are a true survivor!</p>
        )}

        {/* Stats Container */}
        <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-gray-700 p-10 rounded-2xl mb-10 backdrop-blur-md">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 border-b border-gray-700 pb-4">📊 FINAL STATISTICS</h2>

          <div className="grid grid-cols-1 gap-4 text-xl">
            {/* Score */}
            <div className="bg-black bg-opacity-50 p-4 rounded-lg border border-yellow-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-2">
                  <span>⭐</span>
                  <span>{t('finalScore')}</span>
                </span>
                <span className="text-yellow-400 font-bold text-3xl font-mono">{score.toLocaleString()}</span>
              </div>
            </div>

            {/* Enemies Killed */}
            <div className="bg-black bg-opacity-50 p-4 rounded-lg border border-red-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-2">
                  <span>💀</span>
                  <span>Enemies Eliminated</span>
                </span>
                <span className="text-red-400 font-bold text-3xl font-mono">{enemiesKilled}</span>
              </div>
            </div>

            {/* Waves Survived */}
            <div className="bg-black bg-opacity-50 p-4 rounded-lg border border-purple-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 flex items-center gap-2">
                  <span>🌊</span>
                  <span>Waves Survived</span>
                </span>
                <span className="text-purple-400 font-bold text-3xl font-mono">{wave}</span>
              </div>
            </div>
          </div>

          {/* Performance Rating */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-lg text-gray-400">
              {score >= 500 && <p className="text-green-400 font-bold">🌟 LEGENDARY PERFORMANCE! 🌟</p>}
              {score >= 300 && score < 500 && <p className="text-blue-400 font-bold">⚡ EXCELLENT PERFORMANCE! ⚡</p>}
              {score >= 150 && score < 300 && <p className="text-yellow-400 font-bold">✨ GOOD PERFORMANCE ✨</p>}
              {score < 150 && <p className="text-orange-400">Keep practicing!</p>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 justify-center">
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-10 rounded-xl text-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xl border-2 border-green-400"
          >
            🔄 {t('restart')}
          </button>
          <button
            onClick={onMainMenu}
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-10 rounded-xl text-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xl border-2 border-gray-500"
          >
            🏠 {t('mainMenu')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
