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

const HUD = ({ health, ammo, maxAmmo, enemiesKilled, score, wave, weaponName, combo, unlockedWeapons, currentWeapon }: HUDProps) => {
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
    if (health > 60) return 'bg-green-500';
    if (health > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      {/* Damage Flash Effect */}
      {damageFlash && (
        <div className="fixed inset-0 bg-red-600 opacity-20 pointer-events-none" style={{ animation: 'fadeOut 0.2s ease-out' }} />
      )}

      {/* Top Left - Minimal Stats */}
      <div className="absolute top-6 left-6 space-y-3 select-none font-mono">
        {/* Health - Ultra Minimal */}
        <div className="flex items-center gap-3">
          <div className="w-48 h-2 bg-black bg-opacity-40 rounded-full overflow-hidden backdrop-blur-sm border border-white border-opacity-10">
            <div
              className={`h-full ${getHealthColor()} transition-all duration-300`}
              style={{ width: `${Math.max(0, health)}%` }}
            />
          </div>
          <span className="text-white text-2xl font-bold drop-shadow-lg">{Math.max(0, Math.floor(health))}</span>
        </div>

        {/* Ammo - Ultra Minimal */}
        <div className="flex items-center gap-3">
          <div className="text-white text-sm font-semibold drop-shadow-lg opacity-80">{weaponName}</div>
          <span className="text-yellow-400 text-3xl font-bold drop-shadow-lg">{ammo}</span>
          <span className="text-white text-lg opacity-50">/ {maxAmmo}</span>
        </div>
      </div>

      {/* Top Right - Score & Stats */}
      <div className="absolute top-6 right-6 text-right space-y-2 select-none font-mono">
        <div className="text-white text-sm opacity-70 drop-shadow-lg">SCORE</div>
        <div className="text-cyan-400 text-4xl font-bold drop-shadow-lg">{score.toLocaleString()}</div>
        <div className="flex justify-end gap-4 mt-3 text-white text-sm">
          <div className="flex items-center gap-1.5">
            <span className="opacity-60">💀</span>
            <span className="font-bold drop-shadow-lg">{enemiesKilled}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="opacity-60">🌊</span>
            <span className="font-bold drop-shadow-lg">{wave}</span>
          </div>
        </div>
      </div>

      {/* Combo - Center Top */}
      {combo > 1 && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2" style={{ animation: 'bounceIn 0.3s ease-out' }}>
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <span className="font-bold text-2xl font-mono">x{combo} COMBO</span>
            </div>
          </div>
        </div>
      )}

      {/* Weapon Selector - Bottom Right - Minimal */}
      <div className="absolute bottom-6 right-6 select-none">
        <div className="text-white text-xs font-mono mb-2 text-right opacity-50">WEAPONS</div>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(WEAPONS).map(([key, weapon], index) => {
            const isUnlocked = unlockedWeapons.includes(key);
            const isCurrent = currentWeapon === key;

            return (
              <div
                key={key}
                title={isUnlocked ? `${weapon.name} (${index + 1})` : `Unlock at ${weapon.unlockScore} pts`}
                className={`w-14 h-14 rounded-lg transition-all flex items-center justify-center text-center relative ${
                  isCurrent
                    ? 'bg-cyan-500 bg-opacity-90 shadow-lg shadow-cyan-500/50 scale-110'
                    : isUnlocked
                    ? 'bg-black bg-opacity-40 backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-60'
                    : 'bg-black bg-opacity-20 backdrop-blur-sm border border-white border-opacity-10'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-2xl">{weapon.name.split(' ')[0]}</span>
                    <div className="absolute top-0.5 right-0.5 text-[9px] font-mono text-white bg-black bg-opacity-60 px-1 rounded">
                      {index + 1}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-600 text-xl">🔒</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls Hint - Bottom Left */}
      <div className="absolute bottom-6 left-6 text-white text-xs font-mono opacity-40 select-none space-y-1">
        <div>Right-Click: Lock/Unlock Mouse</div>
        <div>Mouse Wheel: Switch Weapons</div>
        <div>R: Reload | Space: Jump</div>
      </div>
    </>
  );
};

export default HUD;
