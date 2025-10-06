const Controls = () => {
  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-xl border-2 border-gray-600 backdrop-blur-sm" style={{ animation: 'slideInFromTop 0.5s ease-out 0.2s both' }}>
      <h3 className="text-sm font-bold text-green-400 mb-3 border-b border-gray-700 pb-2">⌨️ CONTROLS</h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 font-mono">WASD</kbd>
          <span className="text-gray-300">Move</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 font-mono">SPACE</kbd>
          <span className="text-gray-300">Jump</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 font-mono">SHIFT</kbd>
          <span className="text-gray-300">Sprint</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 font-mono">CLICK</kbd>
          <span className="text-gray-300">Shoot</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 font-mono">R</kbd>
          <span className="text-gray-300">Reload</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 font-mono">1-3</kbd>
          <span className="text-gray-300">Weapons</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 font-mono">ESC</kbd>
          <span className="text-gray-300">Pause</span>
        </div>
      </div>
    </div>
  );
};

export default Controls;
