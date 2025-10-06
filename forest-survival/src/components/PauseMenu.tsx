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
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-md">
      <div className="text-center max-w-lg" style={{ animation: 'scaleIn 0.3s ease-out' }}>
        <h1 className="text-7xl font-bold text-yellow-400 mb-6 drop-shadow-2xl animate-pulse">⏸️ {t('paused')}</h1>
        <p className="text-white text-2xl mb-10">{t('resume')}</p>

        {/* Current Stats */}
        <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-gray-700 p-8 rounded-2xl mb-8">
          <h3 className="text-2xl font-bold text-green-400 mb-6 border-b border-gray-700 pb-3">📊 CURRENT STATUS</h3>
          <div className="text-white text-left space-y-3">
            <div className="flex items-center justify-between p-3 bg-black bg-opacity-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span>❤️</span>
                <span>Health</span>
              </span>
              <span className="font-mono text-xl font-bold text-red-400">{Math.floor(health)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black bg-opacity-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span>🔫</span>
                <span>Ammo</span>
              </span>
              <span className="font-mono text-xl font-bold text-yellow-400">{ammo}/{maxAmmo}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black bg-opacity-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span>💀</span>
                <span>Enemies Killed</span>
              </span>
              <span className="font-mono text-xl font-bold text-purple-400">{enemiesKilled}/50</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black bg-opacity-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span>⭐</span>
                <span>Score</span>
              </span>
              <span className="font-mono text-xl font-bold text-blue-400">{score}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black bg-opacity-50 rounded-lg">
              <span className="flex items-center gap-2">
                <span>🌊</span>
                <span>Wave</span>
              </span>
              <span className="font-mono text-xl font-bold text-green-400">{wave}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onMainMenu}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-10 rounded-xl text-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xl border-2 border-red-500"
        >
          🏠 {t('mainMenu')}
        </button>
      </div>
    </div>
  );
};

export default PauseMenu;
