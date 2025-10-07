import { useEffect, useState } from 'react';
import { WEAPONS } from '../types/game';

interface HUDProps {
  health: number;
  ammo: number;
  maxAmmo: number;
  enemiesKilled: number;
  score: number;
  wave: number;
  weaponName: string;
  combo: number;
  t: (key: string) => string;
  unlockedWeapons: string[];
  currentWeapon: string;
}

const HUD = ({ health, ammo, maxAmmo, enemiesKilled, score, wave, weaponName, combo, t, unlockedWeapons, currentWeapon }: HUDProps) => {
  const [damageFlash, setDamageFlash] = useState(false);
  const [prevHealth, setPrevHealth] = useState(health);

  useEffect(() => {
    if (health < prevHealth) {
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 200);
    }
    setPrevHealth(health);
  }, [health, prevHealth]);

  const getHealthColor = () => {
    if (health > 60) return 'from-green-600 to-green-400';
    if (health > 30) return 'from-yellow-600 to-yellow-400';
    return 'from-red-600 to-red-400';
  };

  const getHealthBarClass = () => {
    if (health > 60) return 'border-green-600';
    if (health > 30) return 'border-yellow-600';
    return 'border-red-600 animate-pulse';
  };

  return (
    <>
      {/* Damage Flash Effect */}
      {damageFlash && (
        <div className="fixed inset-0 bg-red-600 opacity-30 pointer-events-none animate-pulse" />
      )}

      {/* Main HUD Container */}
      <div className="absolute top-4 left-4 space-y-3 select-none" style={{ animation: 'slideInFromTop 0.5s ease-out' }}>
        {/* Health Bar */}
        <div className={`bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg border-2 ${getHealthBarClass()} transition-all backdrop-blur-sm`}>
          <div className="flex items-center gap-3">
            <span className="text-red-500 font-bold text-lg">❤️</span>
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">{t('health')}</div>
              <div className="w-48 h-6 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <div
                  className={`h-full bg-gradient-to-r ${getHealthColor()} transition-all duration-300 relative`}
                  style={{ width: `${health}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                </div>
              </div>
            </div>
            <span className="font-mono text-xl font-bold min-w-[60px] text-right">{Math.max(0, Math.floor(health))}</span>
          </div>
        </div>

        {/* Ammo Counter */}
        <div className="bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg border-2 border-yellow-600 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold text-lg">🔫</span>
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">{weaponName}</div>
              {/* Use bar for large ammo counts, bullets for small */}
              {maxAmmo <= 30 ? (
                <div className="flex gap-1 flex-wrap max-w-[200px]">
                  {Array.from({ length: maxAmmo }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-6 rounded-sm transition-all ${
                        i < ammo ? 'bg-yellow-400' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-48 h-4 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300"
                    style={{ width: `${(ammo / maxAmmo) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <span className="font-mono text-2xl font-bold text-yellow-400">{ammo}/{maxAmmo}</span>
          </div>
        </div>

        {/* Enemy Counter */}
        <div className="bg-black bg-opacity-90 text-white px-4 py-2 rounded-lg border-2 border-purple-600 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-bold">💀</span>
            <span className="text-sm text-gray-300">{t('enemies')}:</span>
            <span className="ml-auto font-mono text-lg font-bold text-purple-400">{enemiesKilled}</span>
          </div>
        </div>

        {/* Score Display */}
        <div className="bg-black bg-opacity-90 text-white px-4 py-2 rounded-lg border-2 border-blue-600 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold">⭐</span>
            <span className="text-sm text-gray-300">{t('score')}:</span>
            <span className="ml-auto font-mono text-lg font-bold text-blue-400">{score}</span>
          </div>
        </div>

        {/* Wave Display */}
        <div className="bg-black bg-opacity-90 text-white px-4 py-2 rounded-lg border-2 border-green-600 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">🌊</span>
            <span className="text-sm text-gray-300">{t('wave')}:</span>
            <span className="ml-auto font-mono text-lg font-bold text-green-400">{wave}</span>
          </div>
        </div>

        {/* Combo Display */}
        {combo > 1 && (
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg border-2 border-orange-400 animate-pulse" style={{ animation: 'scaleIn 0.3s ease-out' }}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">🔥</span>
              <span className="font-bold text-lg">COMBO x{combo}</span>
            </div>
          </div>
        )}
      </div>

      {/* Weapon Selector - Bottom Right */}
      <div className="absolute bottom-4 right-4 space-y-2 select-none">
        <div className="text-white text-sm font-bold mb-2 text-center bg-black bg-opacity-80 px-3 py-1 rounded-lg">
          WEAPONS (1-7)
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(WEAPONS).map(([key, weapon], index) => {
            const isUnlocked = unlockedWeapons.includes(key);
            const isCurrent = currentWeapon === key;

            return (
              <div
                key={key}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  isCurrent
                    ? 'bg-blue-600 bg-opacity-90 border-blue-400 scale-105'
                    : isUnlocked
                    ? 'bg-black bg-opacity-80 border-green-600 hover:bg-opacity-90'
                    : 'bg-black bg-opacity-60 border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">{index + 1}</span>
                  <div className="flex-1">
                    <div className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                      {isUnlocked ? weapon.name : '🔒'}
                    </div>
                    {isUnlocked ? (
                      <div className="text-[10px] text-gray-400">
                        DMG: {weapon.damage}
                      </div>
                    ) : (
                      <div className="text-[10px] text-red-400">
                        {weapon.unlockScore} pts
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default HUD;
