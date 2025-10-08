interface PauseMenuProps {
  health: number;
  ammo: number;
  maxAmmo: number;
  enemiesKilled: number;
  score: number;
  wave: number;
  onMainMenu: () => void;
  t: (key: string) => string;
}

const PauseMenu = ({ health, ammo, maxAmmo, enemiesKilled, score, wave, onMainMenu, t }: PauseMenuProps) => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4"
      style={{
        background: 'linear-gradient(to bottom, rgba(10, 14, 10, 0.95), rgba(26, 46, 26, 0.95), rgba(13, 31, 13, 0.95))',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-50" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl w-full py-8" style={{ animation: 'scaleIn 0.5s ease-out' }}>
        {/* Pause Title */}
        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 text-yellow-400"
          style={{
            textShadow: '0 0 40px rgba(250, 204, 21, 0.8), 0 0 80px rgba(250, 204, 21, 0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          ⏸️ PAUSED
        </h1>

        <p className="text-xl text-gray-300 mb-8 font-semibold">Press ESC to Resume</p>

        {/* Stats Container */}
        <div className="bg-black/60 backdrop-blur-xl border-2 border-green-500/40 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-black text-green-400 mb-6 flex items-center justify-center gap-2">
            <span>📊</span>
            <span>CURRENT STATUS</span>
          </h2>

          <div className="space-y-3">
            {/* Health */}
            <div className="bg-black/40 border-2 border-red-500/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg font-bold flex items-center gap-3">
                  <span className="text-2xl">❤️</span>
                  <span>HEALTH</span>
                </span>
                <span className="text-red-400 font-black text-3xl font-mono">{Math.floor(health)}</span>
              </div>
            </div>

            {/* Ammo */}
            <div className="bg-black/40 border-2 border-yellow-500/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg font-bold flex items-center gap-3">
                  <span className="text-2xl">🔫</span>
                  <span>AMMO</span>
                </span>
                <span className="text-yellow-400 font-black text-3xl font-mono">{ammo}/{maxAmmo}</span>
              </div>
            </div>

            {/* Enemies Killed */}
            <div className="bg-black/40 border-2 border-purple-500/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg font-bold flex items-center gap-3">
                  <span className="text-2xl">💀</span>
                  <span>ENEMIES KILLED</span>
                </span>
                <span className="text-purple-400 font-black text-3xl font-mono">{enemiesKilled}/50</span>
              </div>
            </div>

            {/* Score */}
            <div className="bg-black/40 border-2 border-blue-500/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg font-bold flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <span>SCORE</span>
                </span>
                <span className="text-blue-400 font-black text-3xl font-mono">{score.toLocaleString()}</span>
              </div>
            </div>

            {/* Wave */}
            <div className="bg-black/40 border-2 border-green-500/60 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-lg font-bold flex items-center gap-3">
                  <span className="text-2xl">🌊</span>
                  <span>WAVE</span>
                </span>
                <span className="text-green-400 font-black text-3xl font-mono">{wave}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Menu Button */}
        <button
          onClick={onMainMenu}
          className="bg-red-600 hover:bg-red-500 text-white font-black py-5 px-12 rounded-2xl text-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-red-400"
          style={{
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)',
          }}
        >
          🏠 MAIN MENU
        </button>
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

export default PauseMenu;
