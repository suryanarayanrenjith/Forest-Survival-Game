import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ClassicMenuProps {
  onStartGame: (difficulty: 'easy' | 'medium' | 'hard', timeOfDay: 'day' | 'night') => void;
  onBack: () => void;
  t: (key: string) => string;
}

const ClassicMenu = ({ onStartGame, onBack }: ClassicMenuProps) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<'day' | 'night'>('day');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Same forest scene as main menu
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
      forest.forEach((tree, i) => {
        if (!tree.userData.angle) {
          tree.userData.angle = (i / treeCount) * Math.PI * 2;
        }
        tree.position.x = Math.cos(tree.userData.angle + time) * radius;
        tree.position.z = Math.sin(tree.userData.angle + time) * radius;
        tree.rotation.y = -(tree.userData.angle + time) + Math.PI / 2;
      });

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

      {/* Menu Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-8 overflow-y-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 bg-black/40 backdrop-blur-md border border-gray-500/60 hover:border-gray-400 px-6 py-3 rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
        >
          ← Back
        </button>

        {/* Title */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-12 text-center"
          style={{
            color: '#86efac',
            textShadow: '0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          CLASSIC MODE
        </h1>

        {/* Settings Container */}
        <div className="space-y-6 max-w-2xl w-full mb-8">
          {/* Difficulty Selection */}
          <div className="bg-black/40 backdrop-blur-md border-2 border-orange-500/60 rounded-2xl p-6">
            <h2 className="text-2xl font-black text-orange-300 mb-4 text-center">⚔️ DIFFICULTY</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedDifficulty('easy')}
                className={`py-4 px-4 rounded-xl font-bold transition-all duration-300 ${
                  selectedDifficulty === 'easy'
                    ? 'bg-green-600 text-white border-2 border-green-400 scale-105'
                    : 'bg-gray-800/60 text-gray-400 border-2 border-gray-600 hover:border-green-400 hover:scale-105'
                }`}
              >
                <div className="text-2xl mb-1">😊</div>
                <div>EASY</div>
                <div className="text-xs mt-1">Challenging</div>
              </button>
              <button
                onClick={() => setSelectedDifficulty('medium')}
                className={`py-4 px-4 rounded-xl font-bold transition-all duration-300 ${
                  selectedDifficulty === 'medium'
                    ? 'bg-orange-600 text-white border-2 border-orange-400 scale-105'
                    : 'bg-gray-800/60 text-gray-400 border-2 border-gray-600 hover:border-orange-400 hover:scale-105'
                }`}
              >
                <div className="text-2xl mb-1">😐</div>
                <div>MEDIUM</div>
                <div className="text-xs mt-1">Brutal</div>
              </button>
              <button
                onClick={() => setSelectedDifficulty('hard')}
                className={`py-4 px-4 rounded-xl font-bold transition-all duration-300 ${
                  selectedDifficulty === 'hard'
                    ? 'bg-red-600 text-white border-2 border-red-400 scale-105'
                    : 'bg-gray-800/60 text-gray-400 border-2 border-gray-600 hover:border-red-400 hover:scale-105'
                }`}
              >
                <div className="text-2xl mb-1">😈</div>
                <div>HARD</div>
                <div className="text-xs mt-1">Nightmare</div>
              </button>
            </div>
          </div>

          {/* Time of Day Selection */}
          <div className="bg-black/40 backdrop-blur-md border-2 border-cyan-500/60 rounded-2xl p-6">
            <h2 className="text-2xl font-black text-cyan-300 mb-4 text-center">🎨 ATMOSPHERE</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedTimeOfDay('day')}
                className={`py-6 px-6 rounded-xl font-bold transition-all duration-300 ${
                  selectedTimeOfDay === 'day'
                    ? 'bg-yellow-600 text-white border-2 border-yellow-400 scale-105'
                    : 'bg-gray-800/60 text-gray-400 border-2 border-gray-600 hover:border-yellow-400 hover:scale-105'
                }`}
              >
                <div className="text-4xl mb-2">☀️</div>
                <div className="text-lg">DAY MODE</div>
                <div className="text-xs mt-1">Golden Hour</div>
              </button>
              <button
                onClick={() => setSelectedTimeOfDay('night')}
                className={`py-6 px-6 rounded-xl font-bold transition-all duration-300 ${
                  selectedTimeOfDay === 'night'
                    ? 'bg-indigo-600 text-white border-2 border-indigo-400 scale-105'
                    : 'bg-gray-800/60 text-gray-400 border-2 border-gray-600 hover:border-indigo-400 hover:scale-105'
                }`}
              >
                <div className="text-4xl mb-2">🌙</div>
                <div className="text-lg">NIGHT MODE</div>
                <div className="text-xs mt-1">Neon Dreams</div>
              </button>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onStartGame(selectedDifficulty, selectedTimeOfDay)}
          className="bg-green-600 hover:bg-green-500 text-white font-black py-5 px-16 rounded-2xl text-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-green-400"
          style={{
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
          }}
        >
          ▶️ START GAME
        </button>

        {/* Version */}
        <p className="absolute bottom-4 text-gray-600 text-xs">
          Version 5.0 - Classic Mode
        </p>
      </div>
    </div>
  );
};

export default ClassicMenu;
