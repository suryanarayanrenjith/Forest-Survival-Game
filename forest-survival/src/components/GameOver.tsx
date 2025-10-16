interface GameOverProps {
  isVictory: boolean;
  score: number;
  enemiesKilled: number;
  wave: number;
  onRestart: () => void;
  onMainMenu: () => void;
  t: (key: string) => string;
}

const GameOver = ({ isVictory, score, enemiesKilled, wave, onRestart, onMainMenu }: GameOverProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4" style={{ background: 'linear-gradient(to bottom, #0a0e0a, #1a2e1a, #0d1f0d)' }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-70" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl w-full py-8" style={{ animation: 'scaleIn 0.5s ease-out' }}>
        {/* Title */}
        <h1
          className={`text-5xl md:text-6xl lg:text-7xl font-black mb-8 ${isVictory ? 'text-green-400' : 'text-red-400'}`}
          style={{
            textShadow: isVictory
              ? '0 0 40px rgba(34, 197, 94, 0.8), 0 0 80px rgba(34, 197, 94, 0.4)'
              : '0 0 40px rgba(239, 68, 68, 0.8), 0 0 80px rgba(239, 68, 68, 0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          {isVictory ? '🏆 VICTORY!' : '💀 GAME OVER'}
        </h1>

        {/* Subtitle */}
        {isVictory && (
          <p className="text-xl text-green-300 mb-8 font-bold">You are a true survivor!</p>
        )}

        {/* Stats Container */}
        <div className="bg-black/60 backdrop-blur-xl border-2 border-green-500/40 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-black text-yellow-400 mb-6">📊 STATISTICS</h2>

          <div className="space-y-4">
            {/* Score */}
            <div className="bg-black/40 border-2 border-yellow-500/60 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg font-bold flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <span>FINAL SCORE</span>
                </span>
                <span className="text-yellow-400 font-black text-4xl font-mono">{score.toLocaleString()}</span>
              </div>
            </div>

            {/* Enemies Killed */}
            <div className="bg-black/40 border-2 border-red-500/60 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg font-bold flex items-center gap-3">
                  <span className="text-2xl">💀</span>
                  <span>ENEMIES ELIMINATED</span>
                </span>
                <span className="text-red-400 font-black text-4xl font-mono">{enemiesKilled}</span>
              </div>
            </div>

            {/* Waves Survived */}
            <div className="bg-black/40 border-2 border-purple-500/60 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg font-bold flex items-center gap-3">
                  <span className="text-2xl">🌊</span>
                  <span>WAVES SURVIVED</span>
                </span>
                <span className="text-purple-400 font-black text-4xl font-mono">{wave}</span>
              </div>
            </div>
          </div>

          {/* Performance Rating */}
          <div className="mt-6 pt-6 border-t-2 border-gray-700">
            <div className="text-xl">
              {score >= 500 && <p className="text-green-400 font-black">🌟 LEGENDARY PERFORMANCE! 🌟</p>}
              {score >= 300 && score < 500 && <p className="text-blue-400 font-black">⚡ EXCELLENT PERFORMANCE! ⚡</p>}
              {score >= 150 && score < 300 && <p className="text-yellow-400 font-black">✨ GOOD PERFORMANCE ✨</p>}
              {score < 150 && <p className="text-orange-400 font-bold">Keep practicing!</p>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={onRestart}
            className="bg-green-600 hover:bg-green-500 text-white font-black py-5 px-12 rounded-2xl text-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-green-400"
            style={{
              boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
            }}
          >
            🔄 RESTART
          </button>
          <button
            onClick={onMainMenu}
            className="bg-gray-700 hover:bg-gray-600 text-white font-black py-5 px-12 rounded-2xl text-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-gray-500"
            style={{
              boxShadow: '0 8px 32px rgba(107, 114, 128, 0.4)',
            }}
          >
            🏠 MAIN MENU
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default GameOver;
