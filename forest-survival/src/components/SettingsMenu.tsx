import React, { useState } from 'react';
import { soundManager } from '../utils/SoundManager';

interface SettingsMenuProps {
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'audio'>('controls');
  const [volume, setVolume] = useState(soundManager.getVolume() * 100);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    soundManager.setVolume(newVolume / 100);
  };

  const controls = [
    { key: 'W', action: 'Move Forward', icon: '↑' },
    { key: 'S', action: 'Move Backward', icon: '↓' },
    { key: 'A', action: 'Move Left', icon: '←' },
    { key: 'D', action: 'Move Right', icon: '→' },
    { key: 'Space', action: 'Jump', icon: '⬆' },
    { key: 'Shift', action: 'Sprint', icon: '⚡' },
    { key: 'Mouse', action: 'Look Around', icon: '🖱️' },
    { key: 'Left Click', action: 'Shoot', icon: '🔫' },
    { key: 'Right Click', action: 'Aim (Sniper/Rifle)', icon: '🎯' },
    { key: 'R', action: 'Reload', icon: '🔄' },
    { key: '1/2/3/4/5', action: 'Switch Weapon', icon: '🔄' },
    { key: 'ESC', action: 'Pause Menu', icon: '⏸️' },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        animation: 'fade-in 0.3s ease-out',
      }}
    >
      <div
        className="bg-black bg-opacity-90 backdrop-blur-xl rounded-3xl border-4 border-green-500 p-8 max-w-4xl w-full mx-4 my-8 overflow-y-auto max-h-[90vh]"
        style={{
          animation: 'scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: '0 0 60px rgba(34, 197, 94, 0.4), 0 20px 40px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-5xl font-black text-green-400"
            style={{
              textShadow: '0 0 30px rgba(34, 197, 94, 0.8), 0 4px 10px rgba(0, 0, 0, 0.8)',
            }}
          >
            SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all text-4xl font-bold hover:scale-110 active:scale-95 w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-800"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 py-4 px-6 font-black text-xl rounded-xl transition-all duration-300 ${
              activeTab === 'controls'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-400 shadow-lg scale-105'
                : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600 hover:scale-102'
            }`}
          >
            🎮 CONTROLS
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-4 px-6 font-black text-xl rounded-xl transition-all duration-300 ${
              activeTab === 'audio'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-400 shadow-lg scale-105'
                : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600 hover:scale-102'
            }`}
          >
            🔊 AUDIO
          </button>
        </div>

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 rounded-xl p-4 mb-6">
              <p className="text-green-300 text-center font-semibold">
                💡 Master the controls to survive the forest!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {controls.map((control, index) => (
                <div
                  key={index}
                  className="group bg-gray-900 border-2 border-gray-700 rounded-xl p-5 flex items-center justify-between hover:border-green-500 hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                  style={{
                    animation: `fade-in 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{control.icon}</span>
                    <span className="text-gray-200 font-semibold">{control.action}</span>
                  </div>
                  <kbd className="bg-black border-2 border-green-500 rounded-lg px-4 py-2 text-green-400 font-mono text-sm font-bold shadow-lg group-hover:bg-green-900/20 transition-all">
                    {control.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="bg-yellow-900/20 border-2 border-yellow-500/50 rounded-xl p-4 mt-6">
              <p className="text-yellow-300 text-sm">
                <span className="font-bold">⚠️ Note:</span> Key bindings are currently fixed. Customizable controls coming in a future update!
              </p>
            </div>
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="space-y-6">
            {/* Master Volume */}
            <div
              className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-xl p-8 hover:border-green-500/50 transition-all"
              style={{
                animation: 'fade-in 0.3s ease-out',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🔊</span>
                <label className="text-gray-200 text-xl font-bold">
                  Master Volume
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e ${volume}%, #374151 ${volume}%, #374151 100%)`,
                    }}
                  />
                  <div className="bg-black border-2 border-green-500 rounded-lg px-4 py-2 min-w-[80px] text-center">
                    <span className="text-green-400 font-mono text-xl font-bold">
                      {Math.round(volume)}%
                    </span>
                  </div>
                </div>

                {/* Volume Indicator */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>🔇 Mute</span>
                  <span>🔊 Max</span>
                </div>
              </div>
            </div>

            {/* Sound Effects Test */}
            <div
              className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-xl p-8 hover:border-green-500/50 transition-all"
              style={{
                animation: 'fade-in 0.3s ease-out 0.1s both',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🎵</span>
                <h3 className="text-gray-200 text-xl font-bold">Sound Test</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => soundManager.play('shoot')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 border-2 border-blue-400"
                >
                  🔫 Gunshot
                </button>
                <button
                  onClick={() => soundManager.play('reload')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 border-2 border-purple-400"
                >
                  🔄 Reload
                </button>
                <button
                  onClick={() => soundManager.play('enemyHit')}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 border-2 border-red-400"
                >
                  💥 Hit Enemy
                </button>
                <button
                  onClick={() => soundManager.play('playerHurt')}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 border-2 border-orange-400"
                >
                  🩸 Take Damage
                </button>
              </div>
            </div>

            {/* Audio Info */}
            <div className="bg-green-900/20 border-2 border-green-500/50 rounded-xl p-4">
              <p className="text-green-300 text-sm text-center">
                <span className="font-bold">💡 Tip:</span> Adjust volume to hear enemies approaching and react faster!
              </p>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="group relative overflow-hidden px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black text-xl rounded-xl border-4 border-green-400 transition-all duration-300 hover:scale-110 hover:border-green-300 active:scale-95"
            style={{
              boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)',
            }}
          >
            <span className="relative z-10">CLOSE</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Custom slider styling */
        input[type="range"].slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #15803d);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
          transition: all 0.2s;
        }

        input[type="range"].slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.8);
        }

        input[type="range"].slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #15803d);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
          transition: all 0.2s;
        }

        input[type="range"].slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.8);
        }
      `}</style>
    </div>
  );
};

export default SettingsMenu;
