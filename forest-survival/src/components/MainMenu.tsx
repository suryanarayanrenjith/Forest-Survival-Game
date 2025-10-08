import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import SettingsMenu from './SettingsMenu';

interface MainMenuProps {
  onStartGame: (prompt: string) => void;
  onClassicMode: () => void;
  t: (key: string) => string;
}

const MainMenu = ({ onStartGame, onClassicMode }: MainMenuProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [gameplayPrompt, setGameplayPrompt] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Minimal rotating forest scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1f0a, 10, 50);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a1f0a, 1);

    // Minimal particle stars
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 80;
      positions[i + 1] = Math.random() * 40;
      positions[i + 2] = (Math.random() - 0.5) * 80;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.15,
      color: 0x88ff88,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create forest circle
    const forest: THREE.Group[] = [];
    const treeCount = 40;
    const radius = 15;

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const tree = new THREE.Group();

      // Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 6);
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d1810,
        roughness: 0.9,
        flatShading: true,
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      tree.add(trunk);

      // Foliage - pyramid style
      const foliageGeometry = new THREE.ConeGeometry(1, 2.5, 6);
      const foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a4d1a,
        roughness: 0.8,
        flatShading: true,
      });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.y = 2;
      foliage.castShadow = true;
      tree.add(foliage);

      // Position in circle
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      tree.position.set(x, 0, z);
      tree.rotation.y = -angle + Math.PI / 2;

      scene.add(tree);
      forest.push(tree);
    }

    // Ground
    const groundGeometry = new THREE.CircleGeometry(25, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d1f0d,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2d4d2d, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x88ff88, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4d8d4d, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Initialize sceneRef first
    sceneRef.current = { scene, camera, renderer, animationId: 0 };

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.003;

      // Rotate entire forest
      forest.forEach((tree) => {
        tree.position.x = Math.cos(tree.userData.angle + time) * radius;
        tree.position.z = Math.sin(tree.userData.angle + time) * radius;
        tree.rotation.y = -(tree.userData.angle + time) + Math.PI / 2;
      });

      // Store initial angles
      if (time < 0.01) {
        forest.forEach((tree, i) => {
          tree.userData.angle = (i / treeCount) * Math.PI * 2;
        });
      }

      // Subtle camera sway
      camera.position.x = Math.sin(time * 0.3) * 1;
      camera.position.y = 8 + Math.sin(time * 0.5) * 0.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      if (sceneRef.current) {
        sceneRef.current.animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        renderer.dispose();
      }
    };
  }, []);

  const handlePlayClick = () => {
    setShowModeSelection(true);
  };

  const handleAIModeClick = () => {
    setShowModeSelection(false);
    setShowAIPrompt(true);
  };

  const handleAIStart = () => {
    if (gameplayPrompt.trim()) {
      onStartGame(gameplayPrompt);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />

      {/* Initial Screen - Just Title and Buttons */}
      {!showModeSelection && !showAIPrompt && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          {/* Title */}
          <h1
            className="text-6xl md:text-7xl lg:text-8xl font-black mb-16 text-center"
            style={{
              color: '#86efac',
              textShadow: '0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            FOREST SURVIVAL
          </h1>

          {/* Main Buttons */}
          <div className="flex flex-col gap-6 items-center mb-8">
            <button
              onClick={handlePlayClick}
              className="group relative bg-black bg-opacity-40 backdrop-blur-md border-2 border-green-500/60 rounded-2xl px-20 py-6 hover:border-green-400 hover:bg-opacity-50 transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
              }}
            >
              <span className="text-4xl font-black text-green-300">PLAY</span>
              <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="bg-black bg-opacity-40 backdrop-blur-md border border-gray-500/60 hover:border-gray-400 px-12 py-4 rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 text-lg"
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Version */}
          <p className="absolute bottom-4 text-gray-600 text-xs">
            Version 5.0 - AAA Edition
          </p>
        </div>
      )}

      {/* Mode Selection Screen */}
      {showModeSelection && !showAIPrompt && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          {/* Title */}
          <h1
            className="text-5xl md:text-6xl font-black mb-12 text-center"
            style={{
              color: '#86efac',
              textShadow: '0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            SELECT MODE
          </h1>

          {/* Mode Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full mb-8">
            {/* AI Mode Card */}
            <button
              onClick={handleAIModeClick}
              className="group relative bg-black bg-opacity-40 backdrop-blur-md border-2 border-purple-500/60 rounded-2xl p-8 hover:border-purple-400 hover:bg-opacity-50 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15)',
              }}
            >
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-3xl font-black text-purple-300 mb-3">AI MODE</h2>
              <p className="text-gray-300 text-sm mb-4">GPT-Powered Adaptive Gameplay</p>
              <div className="space-y-1 text-xs text-purple-200">
                <p>✓ Dynamic Difficulty</p>
                <p>✓ Smart Adaptation</p>
                <p>✓ Custom Experience</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
            </button>

            {/* Classic Mode Card */}
            <button
              onClick={onClassicMode}
              className="group relative bg-black bg-opacity-40 backdrop-blur-md border-2 border-green-500/60 rounded-2xl p-8 hover:border-green-400 hover:bg-opacity-50 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                boxShadow: '0 8px 32px rgba(34, 197, 94, 0.15)',
              }}
            >
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-3xl font-black text-green-300 mb-3">CLASSIC MODE</h2>
              <p className="text-gray-300 text-sm mb-4">Traditional Survival Challenge</p>
              <div className="space-y-1 text-xs text-green-200">
                <p>✓ Wave-Based Combat</p>
                <p>✓ Multiple Difficulties</p>
                <p>✓ High Score Chase</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
            </button>
          </div>

          {/* Back Button */}
          <button
            onClick={() => setShowModeSelection(false)}
            className="bg-black bg-opacity-40 backdrop-blur-md border border-gray-500/60 hover:border-gray-400 px-8 py-3 rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
          >
            ← Back
          </button>
        </div>
      )}

      {/* AI Prompt Screen */}
      {showAIPrompt && (
        <div className="relative z-20 flex items-center justify-center h-full overflow-y-auto py-8 px-4">
          <div
            className="bg-black bg-opacity-80 backdrop-blur-xl rounded-2xl border-2 border-purple-500/60 p-8 max-w-2xl w-full"
            style={{
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3)',
            }}
          >
            <h2 className="text-3xl font-black text-purple-300 mb-6 text-center">
              🤖 AI Game Director
            </h2>

            <div className="bg-purple-900/20 border border-purple-500/40 rounded-xl p-6 mb-6">
              <p className="text-purple-200 text-sm mb-3 font-semibold">💭 Describe Your Perfect Game</p>
              <textarea
                value={gameplayPrompt}
                onChange={(e) => setGameplayPrompt(e.target.value)}
                placeholder="Example: I want a challenging experience with mostly fast enemies. Make it intense with night atmosphere..."
                className="w-full bg-black/40 text-white px-4 py-3 rounded-lg border border-purple-500/40 focus:border-purple-400 focus:outline-none transition-all resize-none h-28 text-sm"
              />
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setGameplayPrompt("I want a relaxing daytime experience with moderate enemy waves. Nothing too intense.")}
                className="bg-gray-800/60 hover:bg-gray-700/60 border border-green-500/40 hover:border-green-400 text-left p-3 rounded-lg transition-all text-sm"
              >
                <span className="text-green-400">🌿</span> Chill Mode
              </button>
              <button
                onClick={() => setGameplayPrompt("Give me brutal nightmare difficulty. Constant waves. Night time with maximum intensity.")}
                className="bg-gray-800/60 hover:bg-gray-700/60 border border-red-500/40 hover:border-red-400 text-left p-3 rounded-lg transition-all text-sm"
              >
                <span className="text-red-400">💀</span> Nightmare
              </button>
              <button
                onClick={() => setGameplayPrompt("Balanced challenge with all enemy types. Gradually increase difficulty. Day time.")}
                className="bg-gray-800/60 hover:bg-gray-700/60 border border-blue-500/40 hover:border-blue-400 text-left p-3 rounded-lg transition-all text-sm"
              >
                <span className="text-blue-400">⚖️</span> Balanced
              </button>
              <button
                onClick={() => setGameplayPrompt("I want to face lots of weak enemies. Feel powerful. Occasional tough boss.")}
                className="bg-gray-800/60 hover:bg-gray-700/60 border border-yellow-500/40 hover:border-yellow-400 text-left p-3 rounded-lg transition-all text-sm"
              >
                <span className="text-yellow-400">⚡</span> Power Fantasy
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAIStart}
                disabled={!gameplayPrompt.trim()}
                className={`flex-1 py-3 font-bold rounded-lg transition-all ${
                  gameplayPrompt.trim()
                    ? 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 hover:scale-105 active:scale-95'
                    : 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                🚀 Start Game
              </button>
              <button
                onClick={() => {
                  setShowAIPrompt(false);
                  setShowModeSelection(true);
                }}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg border border-gray-600 transition-all"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Menu */}
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default MainMenu;
