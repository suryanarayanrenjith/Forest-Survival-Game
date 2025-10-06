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
    { key: 'W', action: 'Move Forward' },
    { key: 'A', action: 'Move Left' },
    { key: 'S', action: 'Move Backward' },
    { key: 'D', action: 'Move Right' },
    { key: 'Mouse', action: 'Look Around' },
    { key: 'Left Click', action: 'Shoot' },
    { key: 'R', action: 'Reload' },
    { key: '1/2/3', action: 'Switch Weapon' },
    { key: 'ESC', action: 'Pause Menu' },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
      <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-green-500/30 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('controls')}
            className={`pb-3 px-4 font-semibold transition-all ${
              activeTab === 'controls'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Controls
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`pb-3 px-4 font-semibold transition-all ${
              activeTab === 'audio'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Audio
          </button>
        </div>

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {controls.map((control, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-green-500/30 transition-colors"
                >
                  <span className="text-gray-300">{control.action}</span>
                  <kbd className="bg-gray-900 border border-gray-600 rounded px-3 py-1 text-green-400 font-mono text-sm">
                    {control.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <label className="block text-gray-300 mb-4 font-semibold">
                Master Volume
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <span className="text-green-400 font-mono w-12 text-right">
                  {Math.round(volume)}%
                </span>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <button
                onClick={() => soundManager.play('shoot')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors mb-2"
              >
                Test Sound Effects
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
