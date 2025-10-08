import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Analytics } from '@vercel/analytics/react';
import { GunModel } from './utils/GunModel';
import { MuzzleFlash, BulletTracer, ImpactEffect } from './utils/Effects';
import { soundManager } from './utils/SoundManager';
import HUD from './components/HUD';
import MainMenu from './components/MainMenu';
import ClassicMenu from './components/ClassicMenu';
import GameOver from './components/GameOver';
import PauseMenu from './components/PauseMenu';
import Notifications from './components/Notifications';
import MobileWarning from './components/MobileWarning';
import APIKeyInput from './components/APIKeyInput';
import { WEAPONS, type Enemy, type Bullet, type PowerUp, type Particle, type TerrainObject, type Keys, type GameState } from './types/game';
import { AIGameAgent, type GameplayConfig } from './services/AIGameAgent';

interface Translations {
  [key: string]: {
    gameTitle: string;
    startGame: string;
    paused: string;
    resume: string;
    health: string;
    ammo: string;
    enemies: string;
    score: string;
    wave: string;
    waveComplete: string;
    nextWave: string;
    gameOver: string;
    youSurvived: string;
    finalScore: string;
    restart: string;
    mainMenu: string;
  };
}

const TRANSLATIONS: Translations = {
  "en-US": {
    "gameTitle": "FOREST SURVIVAL",
    "startGame": "START GAME",
    "paused": "PAUSED",
    "resume": "Press ESC to Resume",
    "health": "Health",
    "ammo": "Ammo",
    "enemies": "Enemies",
    "score": "Score",
    "wave": "Wave",
    "waveComplete": "WAVE COMPLETE!",
    "nextWave": "Next wave incoming...",
    "gameOver": "GAME OVER",
    "youSurvived": "VICTORY!",
    "finalScore": "Final Score",
    "restart": "RESTART",
    "mainMenu": "MAIN MENU"
  }
};

const browserLocale = navigator.languages?.[0] || navigator.language || 'en-US';
const findMatchingLocale = (locale: string): string => {
  if (TRANSLATIONS[locale]) return locale;
  const lang = locale.split('-')[0];
  const match = Object.keys(TRANSLATIONS).find(key => key.startsWith(lang + '-'));
  return match || 'en-US';
};
const locale = findMatchingLocale(browserLocale);
const t = (key: string): string => TRANSLATIONS[locale]?.[key as keyof typeof TRANSLATIONS['en-US']] || TRANSLATIONS['en-US'][key as keyof typeof TRANSLATIONS['en-US']] || key;

const ForestSurvivalGame = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameMode, setGameMode] = useState<'none' | 'ai' | 'classic'>('none');
  const [showAPIKeyInput, setShowAPIKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);
  const [showClassicMenu, setShowClassicMenu] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [aiConfig, setAiConfig] = useState<GameplayConfig | null>(null);
  const [classicDifficulty, setClassicDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [classicTimeOfDay, setClassicTimeOfDay] = useState<'day' | 'night'>('day');
  const [isInitializingAI, setIsInitializingAI] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const [showWaveComplete, setShowWaveComplete] = useState(false);
  const [powerUpMessage, setPowerUpMessage] = useState<string>('');
  const aiAgentRef = useRef<AIGameAgent | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 1024;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileDevice || isSmallScreen || isTouchDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    ammo: 12,
    maxAmmo: 12,
    score: 0,
    enemiesKilled: 0,
    wave: 1,
    isGameOver: false,
    isVictory: false,
    combo: 0,
    killStreak: 0,
    currentWeapon: 'pistol',
    unlockedWeapons: ['pistol']
  });

  useEffect(() => {
    if (!gameStarted) return;

    // Determine configuration based on game mode
    let timeOfDay: 'day' | 'night' | 'dawn' | 'dusk' | 'bloodmoon';
    let diffSettings: any;

    if (gameMode === 'ai' && aiConfig) {
      timeOfDay = aiConfig.timeOfDay;
      // atmosphere = aiConfig.atmosphere; // Future: implement atmosphere rendering
      diffSettings = {
        healthMult: aiConfig.enemyDifficulty,
        speedMult: aiConfig.enemySpeed,
        damageMult: aiConfig.enemyDifficulty,
        spawnMult: aiConfig.enemySpawnRate,
        regenRate: aiConfig.intensity === 'extreme' ? 0.5 : aiConfig.intensity === 'intense' ? 0.3 : 0,
        progressive: aiConfig.progressiveDifficulty,
        rampRate: aiConfig.difficultyRamp
      };
    } else {
      // Classic mode
      timeOfDay = classicTimeOfDay as any;
      const classicSettings = {
        easy: { healthMult: 1.5, speedMult: 1.3, damageMult: 1.5, spawnMult: 1.3, regenRate: 0 },
        medium: { healthMult: 2.5, speedMult: 1.8, damageMult: 2.2, spawnMult: 1.8, regenRate: 0.2 },
        hard: { healthMult: 4.0, speedMult: 2.5, damageMult: 3.5, spawnMult: 2.5, regenRate: 0.5 }
      };
      diffSettings = { ...classicSettings[classicDifficulty], progressive: false, rampRate: 0 };
    }

    // Scene setup with dynamic atmosphere
    const scene = new THREE.Scene();

    // Day/Night colors and settings
    const daySettings = {
      skyColor: 0x87CEEB, // Sky blue
      fogColor: 0xb0c4de, // Light steel blue
      fogDensity: 0.005,
      ambientColor: 0xffffff,
      ambientIntensity: 0.8,
      sunColor: 0xfff4e6,
      sunIntensity: 1.8,
      sunPosition: { x: 100, y: 150, z: -50 }
    };

    const nightSettings = {
      skyColor: 0x1a1a3a, // Lighter night blue for better visibility
      fogColor: 0x2a2a4e, // Lighter fog
      fogDensity: 0.004, // Less dense fog
      ambientColor: 0x6688aa, // Much brighter ambient
      ambientIntensity: 1.2, // Significantly increased
      moonColor: 0xccddff, // Brighter moon
      moonIntensity: 2.5, // Much stronger moonlight
      moonPosition: { x: -80, y: 120, z: 100 }
    };

    const settings = timeOfDay === 'day' ? daySettings : nightSettings;

    scene.fog = new THREE.FogExp2(settings.fogColor, settings.fogDensity);
    scene.background = new THREE.Color(settings.skyColor);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // PIXELATED RENDERING for maximum performance
    const pixelSize = 2; // Higher = more pixelated = better performance
    const renderWidth = Math.floor(window.innerWidth / pixelSize);
    const renderHeight = Math.floor(window.innerHeight / pixelSize);

    const renderer = new THREE.WebGLRenderer({
      antialias: true, // Enabled for AAA quality
      powerPreference: "high-performance",
      stencil: true,
      depth: true,
      alpha: false,
      logarithmicDepthBuffer: true // Better depth precision
    });
    renderer.setSize(renderWidth, renderHeight, false);
    renderer.setPixelRatio(1); // Fixed at 1 for consistent pixelation
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows for AAA quality
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Cinematic tone mapping
    renderer.toneMappingExposure = timeOfDay === 'day' ? 1.0 : 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Style canvas to scale up pixelated render
    if (renderer.domElement) {
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.imageRendering = 'pixelated';
      renderer.domElement.style.imageRendering = '-moz-crisp-edges';
      renderer.domElement.style.imageRendering = 'crisp-edges';
    }

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // === AAA-QUALITY POST-PROCESSING SYSTEM ===
    const renderTarget1 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      stencilBuffer: false
    });

    // Final Color Grading & Tone Mapping
    const finalShader = {
      uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: null },
        brightness: { value: timeOfDay === 'day' ? 1.15 : 1.25 },
        contrast: { value: timeOfDay === 'day' ? 1.25 : 1.35 },
        saturation: { value: timeOfDay === 'day' ? 1.4 : 1.3 },
        vignette: { value: 0.35 },
        vignetteHardness: { value: 0.6 }
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tBloom;
        uniform float brightness;
        uniform float contrast;
        uniform float saturation;
        uniform float vignette;
        uniform float vignetteHardness;
        varying vec2 vUv;

        vec3 adjustSaturation(vec3 color, float sat) {
          float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
          return mix(vec3(luma), color, sat);
        }

        vec3 ACESFilm(vec3 x) {
          float a = 2.51;
          float b = 0.03;
          float c = 2.43;
          float d = 0.59;
          float e = 0.14;
          return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }

        void main() {
          vec4 baseColor = texture2D(tDiffuse, vUv);
          vec4 bloomColor = texture2D(tBloom, vUv);

          vec3 color = baseColor.rgb + bloomColor.rgb;
          color *= brightness;
          color = (color - 0.5) * contrast + 0.5;
          color = adjustSaturation(color, saturation);
          color = ACESFilm(color);

          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vig = 1.0 - smoothstep(0.0, vignetteHardness, dist * vignette);
          color *= vig;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    };

    const finalMaterial = new THREE.ShaderMaterial(finalShader);

    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), finalMaterial);
    const postScene = new THREE.Scene();
    postScene.add(postQuad);
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Debug: Verify shaders compiled successfully
    console.log('Post-processing material created:', finalMaterial.isShaderMaterial);

    // Check for WebGL errors
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.error('WebGL context lost!');
    });

    renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
    });

    // RTX-Style Lighting System
    const ambientLight = new THREE.AmbientLight(settings.ambientColor, settings.ambientIntensity);
    scene.add(ambientLight);

    // Main directional light (Sun/Moon) with RTX-like shadows
    const mainLightColor = timeOfDay === 'day' ? daySettings.sunColor : nightSettings.moonColor;
    const mainLightIntensity = timeOfDay === 'day' ? daySettings.sunIntensity : nightSettings.moonIntensity;
    const mainLight = new THREE.DirectionalLight(mainLightColor, mainLightIntensity);

    const lightPos = timeOfDay === 'day' ? daySettings.sunPosition : nightSettings.moonPosition;
    mainLight.position.set(lightPos.x, lightPos.y, lightPos.z);
    mainLight.castShadow = true;

    // High-quality shadow settings for RTX feel
    mainLight.shadow.camera.near = 1;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -150;
    mainLight.shadow.camera.right = 150;
    mainLight.shadow.camera.top = 150;
    mainLight.shadow.camera.bottom = -150;
    mainLight.shadow.mapSize.width = 2048; // Higher resolution shadows
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    // Hemisphere light for natural sky reflection
    if (timeOfDay === 'day') {
      const skyLight = new THREE.HemisphereLight(0x87CEEB, 0x4a7c4a, 0.8);
      scene.add(skyLight);
    } else {
      const skyLight = new THREE.HemisphereLight(0x4466aa, 0x1a3a2a, 0.9);
      scene.add(skyLight);
    }

    // Volumetric light effect (god rays simulation)
    const volumetricLight = new THREE.DirectionalLight(
      timeOfDay === 'day' ? 0xffffaa : 0x8899ff,
      timeOfDay === 'day' ? 0.4 : 0.6
    );
    volumetricLight.position.set(lightPos.x * 0.5, lightPos.y * 0.8, lightPos.z * 0.5);
    scene.add(volumetricLight);

    // Fill light (opposite side of main light for balanced illumination)
    const fillLight = new THREE.DirectionalLight(
      timeOfDay === 'day' ? 0xaaccff : 0x6677aa,
      timeOfDay === 'day' ? 0.3 : 0.5
    );
    fillLight.position.set(-lightPos.x * 0.6, lightPos.y * 0.4, -lightPos.z * 0.6);
    scene.add(fillLight);

    // Rim/Back light for dramatic silhouettes
    const rimLight = new THREE.DirectionalLight(
      timeOfDay === 'day' ? 0xffffff : 0xccddff,
      timeOfDay === 'day' ? 0.5 : 0.8
    );
    rimLight.position.set(lightPos.x * 0.3, lightPos.y * 1.2, lightPos.z);
    scene.add(rimLight);

    // Additional ambient fill for night mode visibility
    if (timeOfDay === 'night') {
      const nightFillLight = new THREE.AmbientLight(0x3344aa, 0.4);
      scene.add(nightFillLight);
    }

    // INFINITE LOW-POLY Ground with day/night adaptation
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000, 40, 40);
    const groundColor = timeOfDay === 'day' ? 0x4a8c4a : 0x2a4a3a;
    const groundEmissive = timeOfDay === 'day' ? 0x2a5a2a : 0x1a2a2a;
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: groundColor,
      flatShading: true,
      emissive: groundEmissive,
      emissiveIntensity: timeOfDay === 'day' ? 0.15 : 0.4,
      roughness: 0.85,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.castShadow = false;
    scene.add(ground);

    // Subtle ground variation
    const vertices = groundGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = Math.random() * 0.5 - 0.25;
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    // Update ground position to follow camera seamlessly
    const updateGroundPosition = (playerX: number, playerZ: number) => {
      // Keep ground centered under player for infinite world
      ground.position.x = playerX;
      ground.position.z = playerZ;
    };

    // REMOVED grass patches for maximum performance
    // Low-poly aesthetic doesn't need extra details

    // DYNAMIC INFINITE WORLD GENERATION with Enhanced Terrain
    const terrainObjects: TerrainObject[] = [];
    const CHUNK_SIZE = 100;
    const TREE_DENSITY = 0.25;
    const ROCK_DENSITY = 0.15;
    const BUSH_DENSITY = 0.2;
    const loadedChunks = new Set<string>();

    // Create enhanced tree with better visuals
    const createTree = (x: number, z: number): TerrainObject => {
      const group = new THREE.Group();

      const height = 8 + Math.random() * 4;
      const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, height, 6);
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3520,
        flatShading: true,
        emissive: 0x201510,
        emissiveIntensity: 0.1,
        roughness: 0.9,
        metalness: 0.1
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      // Enhanced leaves with better shape
      for (let i = 0; i < 3; i++) {
        const size = 4 - i * 0.8;
        const leavesGeometry = new THREE.ConeGeometry(size, 5 - i * 1.2, 6);
        const leafColor = Math.random() > 0.6 ? 0x1a7a1a : Math.random() > 0.5 ? 0x0f5d0f : 0x0d4d0d;
        const leavesMaterial = new THREE.MeshStandardMaterial({
          color: leafColor,
          flatShading: true,
          emissive: 0x052505,
          emissiveIntensity: 0.15,
          roughness: 0.85,
          metalness: 0.05
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = height/2 + 1 + i * 3.5;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        group.add(leaves);
      }

      group.position.set(x, height/2, z);
      return { mesh: group, x, z, type: 'tree', collidable: true, radius: 2.5 };
    };

    // Create rocks for terrain variety
    const createRock = (x: number, z: number): TerrainObject => {
      const size = 0.8 + Math.random() * 1.5;
      const rockGeometry = new THREE.DodecahedronGeometry(size, 0);
      const rockColor = Math.random() > 0.5 ? 0x6a6a6a : 0x505050;
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: rockColor,
        flatShading: true,
        roughness: 0.95,
        metalness: 0.15,
        emissive: rockColor,
        emissiveIntensity: 0.05
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.position.set(x, size * 0.5, z);
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      return { mesh: rock, x, z, type: 'rock', collidable: true, radius: size + 0.5 };
    };

    // Create large boulders
    const createBoulder = (x: number, z: number): TerrainObject => {
      const size = 2.5 + Math.random() * 2;
      const boulderGeometry = new THREE.IcosahedronGeometry(size, 0);
      const boulderColor = Math.random() > 0.5 ? 0x555555 : 0x606060;
      const boulderMaterial = new THREE.MeshStandardMaterial({
        color: boulderColor,
        flatShading: true,
        roughness: 0.9,
        metalness: 0.2,
        emissive: boulderColor,
        emissiveIntensity: 0.08
      });
      const boulder = new THREE.Mesh(boulderGeometry, boulderMaterial);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      boulder.position.set(x, size * 0.6, z);
      boulder.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      return { mesh: boulder, x, z, type: 'boulder', collidable: true, radius: size + 1 };
    };

    // Create bushes
    const createBush = (x: number, z: number): TerrainObject => {
      const group = new THREE.Group();
      const bushSize = 0.8 + Math.random() * 0.6;

      for (let i = 0; i < 3; i++) {
        const bushGeometry = new THREE.SphereGeometry(bushSize * (1 - i * 0.15), 4, 3);
        const bushColor = Math.random() > 0.5 ? 0x1a6a1a : 0x156515;
        const bushMaterial = new THREE.MeshStandardMaterial({
          color: bushColor,
          flatShading: true,
          roughness: 0.9,
          metalness: 0.05,
          emissive: bushColor,
          emissiveIntensity: 0.1
        });
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.y = bushSize * 0.8 + i * bushSize * 0.3;
        bush.castShadow = true;
        bush.receiveShadow = true;
        group.add(bush);
      }

      group.position.set(x, 0, z);
      return { mesh: group, x, z, type: 'bush', collidable: false, radius: bushSize };
    };

    const generateChunk = (chunkX: number, chunkZ: number) => {
      const chunkKey = `${chunkX},${chunkZ}`;
      if (loadedChunks.has(chunkKey)) return;

      loadedChunks.add(chunkKey);
      const startX = chunkX * CHUNK_SIZE;
      const startZ = chunkZ * CHUNK_SIZE;

      // Generate trees
      const treesInChunk = Math.floor(CHUNK_SIZE * CHUNK_SIZE * TREE_DENSITY / 100);
      for (let i = 0; i < treesInChunk; i++) {
        const x = startX + Math.random() * CHUNK_SIZE;
        const z = startZ + Math.random() * CHUNK_SIZE;
        const tree = createTree(x, z);
        terrainObjects.push(tree);
        scene.add(tree.mesh);
      }

      // Generate rocks
      const rocksInChunk = Math.floor(CHUNK_SIZE * CHUNK_SIZE * ROCK_DENSITY / 100);
      for (let i = 0; i < rocksInChunk; i++) {
        const x = startX + Math.random() * CHUNK_SIZE;
        const z = startZ + Math.random() * CHUNK_SIZE;
        const rock = createRock(x, z);
        terrainObjects.push(rock);
        scene.add(rock.mesh);
      }

      // Generate occasional boulders
      if (Math.random() > 0.7) {
        const x = startX + Math.random() * CHUNK_SIZE;
        const z = startZ + Math.random() * CHUNK_SIZE;
        const boulder = createBoulder(x, z);
        terrainObjects.push(boulder);
        scene.add(boulder.mesh);
      }

      // Generate bushes
      const bushesInChunk = Math.floor(CHUNK_SIZE * CHUNK_SIZE * BUSH_DENSITY / 100);
      for (let i = 0; i < bushesInChunk; i++) {
        const x = startX + Math.random() * CHUNK_SIZE;
        const z = startZ + Math.random() * CHUNK_SIZE;
        const bush = createBush(x, z);
        terrainObjects.push(bush);
        scene.add(bush.mesh);
      }
    };

    const updateWorldGeneration = (playerX: number, playerZ: number) => {
      const chunkX = Math.floor(playerX / CHUNK_SIZE);
      const chunkZ = Math.floor(playerZ / CHUNK_SIZE);

      // Load chunks around player (3x3 grid)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          generateChunk(chunkX + dx, chunkZ + dz);
        }
      }

      // Remove distant terrain objects to save memory
      for (let i = terrainObjects.length - 1; i >= 0; i--) {
        const obj = terrainObjects[i];
        const distance = Math.sqrt(
          Math.pow(obj.x - playerX, 2) + Math.pow(obj.z - playerZ, 2)
        );
        if (distance > CHUNK_SIZE * 4) {
          scene.remove(obj.mesh);
          terrainObjects.splice(i, 1);
        }
      }
    };

    // Collision detection helper
    const checkTerrainCollision = (newX: number, newZ: number): boolean => {
      for (const obj of terrainObjects) {
        if (!obj.collidable) continue;
        const dx = newX - obj.x;
        const dz = newZ - obj.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < obj.radius) {
          return true; // Collision detected
        }
      }
      return false;
    };

    // Initial world generation
    generateChunk(0, 0);
    generateChunk(0, 1);
    generateChunk(1, 0);
    generateChunk(1, 1);
    generateChunk(-1, 0);
    generateChunk(0, -1);
    generateChunk(-1, -1);

    // Gun Model - CRITICAL FIX
    const gunModel = new GunModel('pistol');
    camera.add(gunModel.group);
    scene.add(camera);

    // Add gun light
    const gunLight = new THREE.PointLight(0xffffff, 0, 5);
    gunLight.position.set(0.3, -0.3, -0.5);
    camera.add(gunLight);

    // Game state
    let health = 100;
    let ammo = 12;
    let score = 0;
    let enemiesKilled = 0;
    let wave = 1;
    let isGameOver = false;
    let paused = false;
    let combo = 0;
    let killStreak = 0;
    let lastKillTime = 0;
    let currentWeapon = 'pistol';
    let canShoot = true;
    let isReloading = false;
    let unlockedWeapons = ['pistol'];
    let isAiming = false;

    // Check and unlock weapons based on score
    const checkWeaponUnlocks = () => {
      let newUnlock = false;
      Object.keys(WEAPONS).forEach(weaponKey => {
        const weapon = WEAPONS[weaponKey];
        if (score >= weapon.unlockScore && !unlockedWeapons.includes(weaponKey)) {
          unlockedWeapons.push(weaponKey);
          setPowerUpMessage(`🔓 ${weapon.name} Unlocked!`);
          setTimeout(() => setPowerUpMessage(''), 3000);
          newUnlock = true;
        }
      });
      return newUnlock;
    };

    // Effects arrays
    const muzzleFlashes: MuzzleFlash[] = [];
    const bulletTracers: BulletTracer[] = [];
    const impactEffects: ImpactEffect[] = [];

    // Game objects
    const enemies: Enemy[] = [];
    const bullets: Bullet[] = [];
    const powerUps: PowerUp[] = [];
    const particles: Particle[] = [];

// Create enemy with enhanced visuals
    const createEnemy = (x: number, z: number, type: 'normal' | 'fast' | 'tank' | 'boss' = 'normal'): Enemy => {
      const enemyGroup = new THREE.Group();

      let bodyColor = 0xcc0000;
      let headColor = 0xff3333;
      let accentColor = 0x880000;
      let enemyHealth = 50;
      let enemySpeed = 0.08;
      let enemyDamage = 0.3;
      let enemyScore = 10;
      let bodyScale = 1;

      switch(type) {
        case 'fast':
          bodyColor = 0x0066ff;
          headColor = 0x3399ff;
          accentColor = 0x003399;
          enemyHealth = 30;
          enemySpeed = 0.15;
          enemyDamage = 0.2;
          enemyScore = 15;
          bodyScale = 0.7;
          break;
        case 'tank':
          bodyColor = 0x339933;
          headColor = 0x66cc66;
          accentColor = 0x1a661a;
          enemyHealth = 150;
          enemySpeed = 0.04;
          enemyDamage = 0.5;
          enemyScore = 30;
          bodyScale = 1.5;
          break;
        case 'boss':
          bodyColor = 0xcc00cc;
          headColor = 0xff33ff;
          accentColor = 0x880088;
          enemyHealth = 300;
          enemySpeed = 0.05;
          enemyDamage = 1.0;
          enemyScore = 100;
          bodyScale = 2;
          break;
      }

      // Enhanced LOW-POLY enemy body with better shape
      const torsoGeometry = new THREE.BoxGeometry(1 * bodyScale, 1.5 * bodyScale, 0.6 * bodyScale);
      const torsoMaterial = new THREE.MeshLambertMaterial({
        color: bodyColor,
        flatShading: true,
        emissive: bodyColor,
        emissiveIntensity: 0.2
      });
      const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
      torso.position.y = 0.2 * bodyScale;
      torso.castShadow = true;
      enemyGroup.add(torso);

      // Arms
      const armGeometry = new THREE.BoxGeometry(0.3 * bodyScale, 1.2 * bodyScale, 0.3 * bodyScale);
      const armMaterial = new THREE.MeshLambertMaterial({
        color: accentColor,
        flatShading: true,
        emissive: accentColor,
        emissiveIntensity: 0.15
      });

      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.65 * bodyScale, 0.2 * bodyScale, 0);
      leftArm.castShadow = true;
      enemyGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.65 * bodyScale, 0.2 * bodyScale, 0);
      rightArm.castShadow = true;
      enemyGroup.add(rightArm);

      // Legs
      const legGeometry = new THREE.BoxGeometry(0.35 * bodyScale, 1 * bodyScale, 0.35 * bodyScale);
      const legMaterial = new THREE.MeshLambertMaterial({
        color: accentColor,
        flatShading: true
      });

      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.3 * bodyScale, -1 * bodyScale, 0);
      leftLeg.castShadow = true;
      enemyGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.3 * bodyScale, -1 * bodyScale, 0);
      rightLeg.castShadow = true;
      enemyGroup.add(rightLeg);

      // Enhanced head with better proportions
      const headGeometry = new THREE.BoxGeometry(0.8 * bodyScale, 0.8 * bodyScale, 0.8 * bodyScale);
      const headMaterial = new THREE.MeshLambertMaterial({
        color: headColor,
        flatShading: true,
        emissive: headColor,
        emissiveIntensity: 0.25
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.3 * bodyScale;
      head.castShadow = true;
      head.rotation.y = Math.PI / 4;
      enemyGroup.add(head);

      // Glowing eyes with better positioning
      const eyeGeometry = new THREE.BoxGeometry(0.12 * bodyScale, 0.12 * bodyScale, 0.06 * bodyScale);
      const eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00
      });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.25 * bodyScale, 1.4 * bodyScale, 0.4 * bodyScale);
      enemyGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.25 * bodyScale, 1.4 * bodyScale, 0.4 * bodyScale);
      enemyGroup.add(rightEye);

      enemyGroup.position.set(x, 1.5 * bodyScale, z);
      scene.add(enemyGroup);

      return {
        mesh: enemyGroup,
        health: enemyHealth * diffSettings.healthMult,
        maxHealth: enemyHealth * diffSettings.healthMult,
        speed: (enemySpeed + Math.random() * 0.02) * diffSettings.speedMult,
        dead: false,
        type,
        damage: enemyDamage * diffSettings.damageMult,
        scoreValue: enemyScore,
        // Animation state
        walkTime: Math.random() * Math.PI * 2, // Random start for variation
        damageFlashTime: 0,
        deathTime: 0,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        torso
      };
    };

    const createPowerUp = (x: number, z: number, type: 'health' | 'ammo' | 'speed'): PowerUp => {
      let color = 0x00ff00;
      let geometry: THREE.BufferGeometry = new THREE.BoxGeometry(1, 1, 1);

      switch(type) {
        case 'health':
          color = 0xff0000;
          geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); // Simple box
          break;
        case 'ammo':
          color = 0xffff00;
          geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
          break;
        case 'speed':
          color = 0x00ffff;
          geometry = new THREE.ConeGeometry(0.6, 1.2, 4); // 4 sides
          break;
      }

      const material = new THREE.MeshLambertMaterial({ // Cheaper material
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        flatShading: true
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, 2, z);
      mesh.castShadow = false; // Disabled for performance
      scene.add(mesh);

      // Removed glow light for performance

      return {
        mesh,
        type,
        position: new THREE.Vector3(x, 2, z),
        collected: false
      };
    };

    const createParticles = (position: THREE.Vector3, color: number, count: number = 10) => {
      const effect = new ImpactEffect(scene, position, color, count);
      impactEffects.push(effect);
    };

    // Difficulty settings already defined at top of useEffect

    const spawnWave = () => {
      const baseCount = 5 + wave * 2;
      const enemyCount = Math.floor(baseCount * diffSettings.spawnMult);

      for (let i = 0; i < enemyCount; i++) {
        const angle = (Math.PI * 2 * i) / enemyCount;
        const distance = 40 + Math.random() * 30;
        const x = Math.cos(angle) * distance + camera.position.x;
        const z = Math.sin(angle) * distance + camera.position.z;

        // Determine enemy type based on game mode
        let type: 'normal' | 'fast' | 'tank' | 'boss' = 'normal';

        if (gameMode === 'ai' && aiConfig) {
          // AI-controlled distribution
          const rand = Math.random() * 100;
          let cumulative = 0;
          if (rand < (cumulative += aiConfig.spawnVariety.normal)) type = 'normal';
          else if (rand < (cumulative += aiConfig.spawnVariety.fast)) type = 'fast';
          else if (rand < (cumulative += aiConfig.spawnVariety.tank)) type = 'tank';
          else type = 'boss';
        } else {
          // Classic mode distribution
          const rand = Math.random();
          if (wave >= 5 && rand < 0.1) type = 'boss';
          else if (wave >= 3 && rand < 0.3) type = 'tank';
          else if (wave >= 2 && rand < 0.5) type = 'fast';
        }

        enemies.push(createEnemy(x, z, type));
      }

      // Spawn power-ups more frequently
      if (wave % 2 === 0) {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 20 + Math.random() * 15;
          const types: ('health' | 'ammo' | 'speed')[] = ['health', 'ammo', 'speed'];
          const type = types[Math.floor(Math.random() * types.length)];
          powerUps.push(createPowerUp(
            Math.cos(angle) * distance + camera.position.x,
            Math.sin(angle) * distance + camera.position.z,
            type
          ));
        }
      }
    };

    // Continuous enemy spawning
    let lastSpawnTime = Date.now();
    let lastAdaptationTime = Date.now();

    // Determine spawn interval based on mode
    let spawnInterval: number;
    let maxEnemies: number;

    if (gameMode === 'ai' && aiConfig) {
      spawnInterval = aiConfig.intensity === 'extreme' ? 4000 :
                      aiConfig.intensity === 'intense' ? 6000 :
                      aiConfig.intensity === 'moderate' ? 8000 : 12000;
      maxEnemies = Math.floor(30 * aiConfig.enemySpawnRate);
    } else {
      // Classic mode intervals
      spawnInterval = classicDifficulty === 'easy' ? 10000 : classicDifficulty === 'medium' ? 7000 : 5000;
      maxEnemies = classicDifficulty === 'easy' ? 25 : classicDifficulty === 'medium' ? 35 : 50;
    }

    const continuousSpawn = () => {
      const currentTime = Date.now();

      if (currentTime - lastSpawnTime > spawnInterval && enemies.length < maxEnemies) {
        let spawnCount: number;

        if (gameMode === 'ai' && aiConfig) {
          spawnCount = Math.floor(2 + Math.random() * 3 * aiConfig.enemySpawnRate);
        } else {
          const baseSpawn = classicDifficulty === 'easy' ? 2 : classicDifficulty === 'medium' ? 3 : 4;
          spawnCount = Math.floor(baseSpawn + Math.random() * 3);
        }

        for (let i = 0; i < spawnCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 50 + Math.random() * 20;
          const x = Math.cos(angle) * distance + camera.position.x;
          const z = Math.sin(angle) * distance + camera.position.z;

          // Determine enemy type
          let type: 'normal' | 'fast' | 'tank' | 'boss' = 'normal';

          if (gameMode === 'ai' && aiConfig) {
            const rand = Math.random() * 100;
            let cumulative = 0;
            if (rand < (cumulative += aiConfig.spawnVariety.normal)) type = 'normal';
            else if (rand < (cumulative += aiConfig.spawnVariety.fast)) type = 'fast';
            else if (rand < (cumulative += aiConfig.spawnVariety.tank)) type = 'tank';
            else type = 'boss';
          } else {
            const rand = Math.random();
            if (wave >= 3 && rand < (classicDifficulty === 'hard' ? 0.15 : 0.05)) type = 'boss';
            else if (wave >= 2 && rand < (classicDifficulty === 'hard' ? 0.35 : 0.2)) type = 'tank';
            else if (rand < (classicDifficulty === 'hard' ? 0.50 : 0.4)) type = 'fast';
          }

          enemies.push(createEnemy(x, z, type));
        }
        lastSpawnTime = currentTime;
      }

      // AI Adaptation (only in AI mode)
      if (gameMode === 'ai' && currentTime - lastAdaptationTime > 60000 && aiAgentRef.current) {
        lastAdaptationTime = currentTime;
        aiAgentRef.current.adaptGameplay({
          currentWave: wave,
          enemiesKilled,
          playerHealth: health,
          score,
          survivalTime: Math.floor((currentTime - startTime) / 1000)
        }).then(() => {
          console.log('🤖 AI adapted gameplay configuration');
        }).catch(err => {
          console.error('AI adaptation failed:', err);
        });
      }
    };

    const startTime = Date.now();

    spawnWave();

    // Movement
    const keys: Keys = {};
    const moveSpeed = 0.3;
    const sprintMultiplier = 1.8;
    const jumpPower = 0.4;
    const gravity = 0.02;

    let velocityY = 0;
    let isJumping = false;
    const groundLevel = 5;

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const PI_2 = Math.PI / 2;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        paused = !paused;
        setIsPaused(paused);
        if (paused) {
          document.exitPointerLock();
        } else {
          renderer.domElement.requestPointerLock();
        }
        return;
      }

      keys[e.code] = true;

      // Weapon switching with unlock check
      const weaponKeys: Record<string, string> = {
        'Digit1': 'pistol',
        'Digit2': 'rifle',
        'Digit3': 'shotgun',
        'Digit4': 'smg',
        'Digit5': 'sniper',
        'Digit6': 'minigun',
        'Digit7': 'launcher'
      };

      if (weaponKeys[e.code] && !isReloading) {
        const weaponName = weaponKeys[e.code];
        if (unlockedWeapons.includes(weaponName)) {
          currentWeapon = weaponName;
          ammo = WEAPONS[weaponName].maxAmmo;
          gunModel.switchWeapon(weaponName as any);
          updateGameState();
        } else {
          const weapon = WEAPONS[weaponName];
          setPowerUpMessage(`🔒 ${weapon.name} - Need ${weapon.unlockScore} score`);
          setTimeout(() => setPowerUpMessage(''), 2000);
        }
      }

      if (e.code === 'KeyR' && !isReloading && !paused && ammo < WEAPONS[currentWeapon].maxAmmo) {
        isReloading = true;
        const weapon = WEAPONS[currentWeapon];
        soundManager.play('reload', 0.5);
        gunModel.triggerReload(); // Trigger reload animation
        setTimeout(() => {
          ammo = weapon.maxAmmo;
          isReloading = false;
          updateGameState();
        }, weapon.reloadTime);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    const onPointerLockChange = () => {
      if (!document.pointerLockElement && !paused && !isGameOver) {
        paused = true;
        setIsPaused(true);
      }
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);

    const onCanvasClick = (e: MouseEvent) => {
      // Left click to lock pointer
      if (e.button === 0 && !isGameOver && !paused && document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      // Right click for aiming (if weapon supports it) or pointer lock
      const weapon = WEAPONS[currentWeapon];
      if (weapon.canAim && document.pointerLockElement === renderer.domElement) {
        // Don't unlock - this is for aiming
        return;
      }

      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
      } else if (!isGameOver && !paused) {
        renderer.domElement.requestPointerLock();
      }
    };

    renderer.domElement.addEventListener('click', onCanvasClick);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    // Enhanced shooting
    const shoot = () => {
      if (ammo > 0 && !isGameOver && !paused && canShoot && !isReloading) {
        const weapon = WEAPONS[currentWeapon];
        canShoot = false;
        setTimeout(() => { canShoot = true; }, weapon.fireRate);

        ammo--;
        gunModel.triggerRecoil();
        updateGameState();

        // Play shoot sound
        soundManager.play('shoot', 0.7);

        const bulletsToFire = currentWeapon === 'shotgun' ? 5 : 1;

        // Gun flash
        gunLight.intensity = 5;
        setTimeout(() => { gunLight.intensity = 0; }, 50);

        for (let i = 0; i < bulletsToFire; i++) {
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);

          // Reduce spread when aiming
          const spreadMultiplier = (isAiming && weapon.canAim) ? 0.2 : 1.0;
          direction.x += (Math.random() - 0.5) * weapon.spread * spreadMultiplier;
          direction.y += (Math.random() - 0.5) * weapon.spread * spreadMultiplier;
          direction.z += (Math.random() - 0.5) * weapon.spread * spreadMultiplier;
          direction.normalize();

          const bulletGeometry = new THREE.SphereGeometry(0.1);
          const bulletMaterial = new THREE.MeshBasicMaterial({
            color: weapon.bulletColor
          });
          const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
          bullet.position.copy(camera.position);
          scene.add(bullet);

          bullets.push({
            mesh: bullet,
            velocity: direction.multiplyScalar(weapon.bulletSpeed),
            life: 100,
            damage: weapon.damage
          });

          // Bullet tracer
          const tracerEnd = camera.position.clone().add(direction.clone().multiplyScalar(50));
          const tracer = new BulletTracer(scene, camera.position.clone(), tracerEnd, weapon.bulletColor);
          bulletTracers.push(tracer);
        }

        // Muzzle flash at gun position
        const gunWorldPos = new THREE.Vector3();
        gunModel.group.getWorldPosition(gunWorldPos);
        const flash = new MuzzleFlash(scene, gunWorldPos, weapon.bulletColor);
        muzzleFlashes.push(flash);
      }
    };

    let mouseDown = false;
    let autoFireInterval: number | null = null;

    const onMouseDown = (e: MouseEvent) => {
      // Right mouse button for aiming
      if (e.button === 2 && !paused && !isGameOver) {
        const weapon = WEAPONS[currentWeapon];
        if (weapon.canAim && document.pointerLockElement === renderer.domElement) {
          isAiming = true;
        }
        return;
      }

      if (e.button === 0 && !paused && !isGameOver) {
        mouseDown = true;
        shoot();

        // Start auto-fire for weapons that support it
        const weapon = WEAPONS[currentWeapon];
        if (weapon.autoFire && !autoFireInterval) {
          autoFireInterval = window.setInterval(() => {
            if (mouseDown && !paused && !isGameOver) {
              shoot();
            }
          }, weapon.fireRate);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      // Right mouse button - stop aiming
      if (e.button === 2) {
        isAiming = false;
        return;
      }

      if (e.button === 0) {
        mouseDown = false;

        // Stop auto-fire
        if (autoFireInterval) {
          clearInterval(autoFireInterval);
          autoFireInterval = null;
        }
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    setTimeout(() => {
      if (renderer.domElement && !paused && !isGameOver) {
        renderer.domElement.requestPointerLock();
      }
    }, 200);

    const onMouseMove = (e: MouseEvent) => {
      if (!paused && !isGameOver) {
        if (document.pointerLockElement === renderer.domElement || mouseDown) {
          euler.setFromQuaternion(camera.quaternion);
          euler.y -= e.movementX * 0.002;
          euler.x -= e.movementY * 0.002;
          euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
          camera.quaternion.setFromEuler(euler);
        }
      }
    };

    document.addEventListener('mousemove', onMouseMove);

    // Mouse wheel weapon switching
    const onMouseWheel = (e: WheelEvent) => {
      if (!paused && !isGameOver) {
        e.preventDefault();

        const weaponKeys = Object.keys(WEAPONS);
        const unlockedKeys = weaponKeys.filter(key => unlockedWeapons.includes(key));
        const currentIndex = unlockedKeys.indexOf(currentWeapon);

        if (e.deltaY > 0) {
          // Scroll down - next weapon
          const nextIndex = (currentIndex + 1) % unlockedKeys.length;
          currentWeapon = unlockedKeys[nextIndex];
        } else if (e.deltaY < 0) {
          // Scroll up - previous weapon
          const prevIndex = (currentIndex - 1 + unlockedKeys.length) % unlockedKeys.length;
          currentWeapon = unlockedKeys[prevIndex];
        }

        // Update weapon
        const weapon = WEAPONS[currentWeapon];
        ammo = weapon.maxAmmo;
        gunModel.switchWeapon(currentWeapon as 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'sniper' | 'minigun' | 'launcher');
        updateGameState();
        soundManager.play('reload', 0.4);
      }
    };

    document.addEventListener('wheel', onMouseWheel, { passive: false });

    const updateGameState = () => {
      checkWeaponUnlocks();
      setGameState({
        health,
        ammo,
        maxAmmo: WEAPONS[currentWeapon].maxAmmo,
        score,
        enemiesKilled,
        wave,
        isGameOver,
        isVictory: false, // No victory - endless mode
        combo,
        killStreak,
        currentWeapon,
        unlockedWeapons: [...unlockedWeapons]
      });
    };

    const checkCollision = (pos1: THREE.Vector3, pos2: THREE.Vector3, distance: number) => {
      const dx = pos1.x - pos2.x;
      const dz = pos1.z - pos2.z;
      return Math.sqrt(dx * dx + dz * dz) < distance;
    };

    // Game loop
    let animationId: number;
    const clock = new THREE.Clock();
    let frameCount = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Debug: Log first few frames
      if (frameCount < 3) {
        console.log(`Frame ${frameCount}: Rendering scene with ${scene.children.length} objects`);
        frameCount++;
      }

      if (isGameOver || paused) {
        // Still apply post-processing when paused
        renderer.setRenderTarget(renderTarget1);
        renderer.render(scene, camera);
        postQuad.material = finalMaterial;
        finalMaterial.uniforms.tDiffuse.value = renderTarget1.texture;
        finalMaterial.uniforms.tBloom.value = renderTarget1.texture;
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCamera);
        return;
      }

      // Update gun animations
      gunModel.updateRecoil(delta);

      // Aiming zoom effect
      if (isAiming && WEAPONS[currentWeapon].canAim) {
        // Zoom in when aiming
        camera.fov = THREE.MathUtils.lerp(camera.fov, 50, delta * 8);
        // Center gun more when aiming
        gunModel.group.position.x = THREE.MathUtils.lerp(gunModel.group.position.x, 0, delta * 8);
        gunModel.group.position.y = THREE.MathUtils.lerp(gunModel.group.position.y, -0.2, delta * 8);
      } else {
        // Zoom out when not aiming
        camera.fov = THREE.MathUtils.lerp(camera.fov, 75, delta * 8);
        // Reset gun position
        gunModel.group.position.x = THREE.MathUtils.lerp(gunModel.group.position.x, 0.3, delta * 8);
        gunModel.group.position.y = THREE.MathUtils.lerp(gunModel.group.position.y, -0.3, delta * 8);
      }
      camera.updateProjectionMatrix();

      // Removed player light update for performance

      // Player movement with weight-based speed
      const isMoving = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'];
      const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];

      // Calculate speed based on weapon weight
      const weaponWeight = WEAPONS[currentWeapon].weight;
      const weightSpeedMultiplier = 1.0 / weaponWeight; // Heavier weapons = slower movement
      const baseSpeed = moveSpeed * weightSpeedMultiplier;
      const currentSpeed = isRunning ? baseSpeed * sprintMultiplier : baseSpeed;

      // Update gun sway and bobbing based on movement
      gunModel.updateIdleSway(delta);
      gunModel.updateWalkBob(delta, isMoving, isRunning && isMoving);

      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(camera.up, direction).normalize();

      // Movement with collision detection
      if (keys['KeyW'] || keys['ArrowUp']) {
        const newX = camera.position.x + direction.x * currentSpeed;
        const newZ = camera.position.z + direction.z * currentSpeed;
        if (!checkTerrainCollision(newX, newZ)) {
          camera.position.x = newX;
          camera.position.z = newZ;
        }
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        const newX = camera.position.x - direction.x * currentSpeed;
        const newZ = camera.position.z - direction.z * currentSpeed;
        if (!checkTerrainCollision(newX, newZ)) {
          camera.position.x = newX;
          camera.position.z = newZ;
        }
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        const newX = camera.position.x + right.x * currentSpeed;
        const newZ = camera.position.z + right.z * currentSpeed;
        if (!checkTerrainCollision(newX, newZ)) {
          camera.position.x = newX;
          camera.position.z = newZ;
        }
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        const newX = camera.position.x - right.x * currentSpeed;
        const newZ = camera.position.z - right.z * currentSpeed;
        if (!checkTerrainCollision(newX, newZ)) {
          camera.position.x = newX;
          camera.position.z = newZ;
        }
      }

      // Jump - can jump while moving
      if (keys['Space'] && !isJumping && camera.position.y <= groundLevel + 0.1) {
        velocityY = jumpPower;
        isJumping = true;
      }

      velocityY -= gravity;
      camera.position.y += velocityY;

      if (camera.position.y <= groundLevel) {
        camera.position.y = groundLevel;
        velocityY = 0;
        isJumping = false;
      }

      // Head bob
      if ((keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) && !isJumping) {
        const bobAmount = isRunning ? 0.08 : 0.05;
        const bobSpeed = isRunning ? 0.3 : 0.18;
        camera.position.y = groundLevel + Math.sin(Date.now() * bobSpeed * 0.01) * bobAmount;
      }

      // Infinite world - update chunks and ground based on player position
      updateWorldGeneration(camera.position.x, camera.position.z);
      updateGroundPosition(camera.position.x, camera.position.z);

      // Continuous enemy spawning
      continuousSpawn();

      // Update effects
      for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        if (muzzleFlashes[i].update(delta)) {
          muzzleFlashes[i].dispose(scene);
          muzzleFlashes.splice(i, 1);
        }
      }

      for (let i = bulletTracers.length - 1; i >= 0; i--) {
        if (bulletTracers[i].update(delta)) {
          bulletTracers[i].dispose(scene);
          bulletTracers.splice(i, 1);
        }
      }

      for (let i = impactEffects.length - 1; i >= 0; i--) {
        if (impactEffects[i].update(delta)) {
          impactEffects[i].dispose(scene);
          impactEffects.splice(i, 1);
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.mesh.position.add(particle.velocity);
        particle.velocity.y -= 0.01;
        particle.life--;

        const opacity = particle.life / particle.maxLife;
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
        (particle.mesh.material as THREE.MeshBasicMaterial).transparent = true;

        if (particle.life <= 0) {
          scene.remove(particle.mesh);
          particles.splice(i, 1);
        }
      }

      // Update power-ups
      for (const powerUp of powerUps) {
        if (!powerUp.collected) {
          powerUp.mesh.rotation.y += delta * 2;
          powerUp.mesh.position.y = 2 + Math.sin(Date.now() * 0.003) * 0.3;

          if (checkCollision(camera.position, powerUp.position, 2)) {
            powerUp.collected = true;
            scene.remove(powerUp.mesh);
            soundManager.play('powerUp', 0.8);

            switch(powerUp.type) {
              case 'health':
                health = Math.min(100, health + 30);
                setPowerUpMessage('❤️ +30 Health');
                break;
              case 'ammo':
                ammo = WEAPONS[currentWeapon].maxAmmo;
                setPowerUpMessage('🔫 Ammo Refilled');
                break;
              case 'speed':
                setPowerUpMessage('⚡ Speed Boost!');
                break;
            }

            setTimeout(() => setPowerUpMessage(''), 2000);
            updateGameState();
          }
        }
      }

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.mesh.position.add(bullet.velocity);
        bullet.life--;

        if (bullet.life <= 0) {
          scene.remove(bullet.mesh);
          bullets.splice(i, 1);
          continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          if (!enemy.dead && checkCollision(bullet.mesh.position, enemy.mesh.position, 2)) {
            enemy.health -= bullet.damage;
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);

            // Trigger damage flash animation
            enemy.damageFlashTime = 0.3;

            createParticles(enemy.mesh.position, 0xff0000, 3); // Reduced particles
            soundManager.play('hit', 0.4);

            if (enemy.health <= 0) {
              enemy.dead = true;
              enemy.deathTime = 1.0; // Death animation duration
              score += enemy.scoreValue;
              enemiesKilled++;
              soundManager.play('enemyDeath', 0.6);

              const currentTime = Date.now();
              if (currentTime - lastKillTime < 2000) {
                combo++;
                killStreak++;
                score += combo * 5;
              } else {
                combo = 1;
              }
              lastKillTime = currentTime;

              createParticles(enemy.mesh.position, 0x00ff00, 8); // Reduced particles

              // Don't remove immediately - death animation will handle it

              updateGameState();

              // Check for wave complete - endless mode
              if (enemies.length === 0) {
                wave++;
                combo = 0;
                killStreak = 0;
                setShowWaveComplete(true);
                soundManager.play('waveComplete', 1.0);
                setTimeout(() => {
                  setShowWaveComplete(false);
                  spawnWave();
                }, 3000);
                updateGameState();
              }
            }
            break;
          }
        }
      }

      // Update enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Death animation
        if (enemy.dead && enemy.deathTime > 0) {
          enemy.deathTime -= delta;
          const deathProgress = 1.0 - (enemy.deathTime / 1.0);

          // Ragdoll-like fall
          enemy.mesh.rotation.x = deathProgress * Math.PI / 2;
          enemy.mesh.position.y = 1.5 - deathProgress * 1.5;

          // Limbs spread out
          if (enemy.leftArm) {
            enemy.leftArm.rotation.z = deathProgress * Math.PI / 3;
            enemy.leftArm.rotation.x = deathProgress * Math.PI / 4;
          }
          if (enemy.rightArm) {
            enemy.rightArm.rotation.z = -deathProgress * Math.PI / 3;
            enemy.rightArm.rotation.x = deathProgress * Math.PI / 4;
          }
          if (enemy.leftLeg) {
            enemy.leftLeg.rotation.x = deathProgress * Math.PI / 6;
          }
          if (enemy.rightLeg) {
            enemy.rightLeg.rotation.x = -deathProgress * Math.PI / 6;
          }

          // Fade out
          enemy.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
              child.material.opacity = 1.0 - deathProgress;
              child.material.transparent = true;
            }
          });

          // Remove after animation completes
          if (enemy.deathTime <= 0) {
            scene.remove(enemy.mesh);
            enemies.splice(i, 1);
          }
          continue;
        }

        if (enemy.dead) continue;

        // Enemy health regeneration on higher difficulties
        if (diffSettings.regenRate > 0 && enemy.health < enemy.maxHealth) {
          enemy.health = Math.min(enemy.maxHealth, enemy.health + diffSettings.regenRate * delta * 10);
        }

        const dx = camera.position.x - enemy.mesh.position.x;
        const dz = camera.position.z - enemy.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Walking animation
        const isMoving = distance > 2.5;
        if (isMoving) {
          enemy.walkTime += delta * 8; // Walking speed multiplier

          // Leg animation - alternating swing
          if (enemy.leftLeg && enemy.rightLeg) {
            enemy.leftLeg.rotation.x = Math.sin(enemy.walkTime) * 0.5;
            enemy.rightLeg.rotation.x = Math.sin(enemy.walkTime + Math.PI) * 0.5;
          }

          // Arm animation - opposite to legs
          if (enemy.leftArm && enemy.rightArm) {
            enemy.leftArm.rotation.x = Math.sin(enemy.walkTime + Math.PI) * 0.3;
            enemy.rightArm.rotation.x = Math.sin(enemy.walkTime) * 0.3;
          }

          // Torso bobbing
          if (enemy.torso) {
            enemy.torso.position.y = 0.2 + Math.sin(enemy.walkTime * 2) * 0.05;
          }

          enemy.mesh.position.x += (dx / distance) * enemy.speed;
          enemy.mesh.position.z += (dz / distance) * enemy.speed;
          enemy.mesh.lookAt(camera.position.x, enemy.mesh.position.y, camera.position.z);
        } else {
          // Reset to idle pose
          if (enemy.leftLeg) enemy.leftLeg.rotation.x *= 0.9;
          if (enemy.rightLeg) enemy.rightLeg.rotation.x *= 0.9;
          if (enemy.leftArm) enemy.leftArm.rotation.x *= 0.9;
          if (enemy.rightArm) enemy.rightArm.rotation.x *= 0.9;
        }

        // Damage flash animation
        if (enemy.damageFlashTime > 0) {
          enemy.damageFlashTime -= delta;
          const flashIntensity = Math.max(0, enemy.damageFlashTime);

          // Flash red when damaged
          if (enemy.torso && enemy.torso.material instanceof THREE.MeshLambertMaterial) {
            enemy.torso.material.emissiveIntensity = 0.2 + flashIntensity * 2;
          }
        }

        if (checkCollision(camera.position, enemy.mesh.position, 2.5)) {
          health -= enemy.damage;
          soundManager.play('playerHurt', 0.5);

          if (combo > 0) {
            combo = Math.max(0, combo - 1);
          }

          updateGameState();

          if (health <= 0) {
            health = 0;
            isGameOver = true;
            updateGameState();
            document.exitPointerLock();
          }
        }
      }

      // Endless mode - no victory condition, only game over on death

      // === AAA-QUALITY POST-PROCESSING ===
      // Render scene to render target
      renderer.setRenderTarget(renderTarget1);
      renderer.render(scene, camera);

      // Apply final composite with all effects
      postQuad.material = finalMaterial;
      finalMaterial.uniforms.tDiffuse.value = renderTarget1.texture;
      finalMaterial.uniforms.tBloom.value = renderTarget1.texture; // Use same for bloom blend
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      const newWidth = Math.floor(window.innerWidth / pixelSize);
      const newHeight = Math.floor(window.innerHeight / pixelSize);
      renderer.setSize(newWidth, newHeight, false);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      const mountNode = mountRef.current;

      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('wheel', onMouseWheel);
      document.removeEventListener('pointerlockchange', onPointerLockChange);

      if (renderer.domElement) {
        renderer.domElement.removeEventListener('click', onCanvasClick);
        renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      }

      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      if (autoFireInterval) {
        clearInterval(autoFireInterval);
      }

      if (mountNode && renderer.domElement) {
        mountNode.removeChild(renderer.domElement);
      }

      // Cleanup post-processing
      renderTarget1.dispose();
      finalMaterial.dispose();
      postQuad.geometry.dispose();

      renderer.dispose();
    };
  }, [gameStarted, aiConfig, gameMode, classicDifficulty, classicTimeOfDay]);

  // Handle mode selection
  const handleModeSelection = (mode: 'ai' | 'classic') => {
    setGameMode(mode);
    if (mode === 'ai') {
      setShowAPIKeyInput(true);
    } else {
      setShowClassicMenu(true);
    }
  };

  // Handle API key submission
  const handleAPIKeySubmit = (key: string) => {
    setApiKey(key);
    setShowAPIKeyInput(false);
    setShowMenu(true);
  };

  // Handle skip AI (go to classic menu)
  const handleSkipAI = () => {
    setShowAPIKeyInput(false);
    setGameMode('classic');
    setShowClassicMenu(true);
  };

  // Handle AI gameplay start
  const handleAIGameStart = async (prompt: string) => {
    setIsInitializingAI(true);
    setAiError('');

    try {
      // Initialize AI agent
      console.log('🤖 Initializing AI with prompt:', prompt);
      const agent = new AIGameAgent(apiKey, prompt);
      const config = await agent.initialize();

      aiAgentRef.current = agent;
      setAiConfig(config);

      // Show loading message with AI config
      setPowerUpMessage(`🤖 AI configured: ${config.intensity} intensity, ${config.timeOfDay} mode`);
      setTimeout(() => setPowerUpMessage(''), 4000);

      soundManager.initialize();
      setShowMenu(false);
      setGameStarted(true);
      setIsInitializingAI(false);
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to initialize AI. Please check your API key.');
      setIsInitializingAI(false);
    }
  };

  // Handle classic mode start
  const handleClassicGameStart = (difficulty: 'easy' | 'medium' | 'hard', timeOfDay: 'day' | 'night') => {
    setClassicDifficulty(difficulty);
    setClassicTimeOfDay(timeOfDay);
    soundManager.initialize();
    setShowClassicMenu(false);
    setGameStarted(true);
  };

  const restartGame = () => {
    window.location.reload();
  };

  const returnToMenu = () => {
    window.location.reload();
  };

  // Show mobile warning if on mobile device
  if (isMobile) {
    return <MobileWarning />;
  }

  // Mode Selection (Initial Screen)
  if (gameMode === 'none') {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-purple-900 to-black flex items-center justify-center z-50 p-4">
        <div className="text-center z-10 space-y-8">
          <div style={{ animation: 'fadeIn 1s ease-out' }}>
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-purple-500 to-pink-600 mb-4 tracking-wider drop-shadow-2xl">
              {t('gameTitle')}
            </h1>
            <p className="text-gray-300 text-xl">Choose Your Experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* AI Mode */}
            <button
              onClick={() => handleModeSelection('ai')}
              className="bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 p-8 rounded-3xl border-2 border-purple-500 hover:border-purple-400 transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-3xl font-bold text-purple-300 mb-2">AI Mode</h2>
              <p className="text-gray-300 mb-4">Dynamic, personalized gameplay</p>
              <ul className="text-sm text-gray-400 space-y-2 text-left">
                <li>✓ Describe your perfect game</li>
                <li>✓ AI adapts to your skill</li>
                <li>✓ Progressive difficulty</li>
                <li>✓ Unique every time</li>
              </ul>
            </button>

            {/* Classic Mode */}
            <button
              onClick={() => handleModeSelection('classic')}
              className="bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 p-8 rounded-3xl border-2 border-green-500 hover:border-green-400 transition-all transform hover:scale-105 active:scale-95"
            >
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-3xl font-bold text-green-300 mb-2">Classic Mode</h2>
              <p className="text-gray-300 mb-4">Traditional survival experience</p>
              <ul className="text-sm text-gray-400 space-y-2 text-left">
                <li>✓ Choose difficulty</li>
                <li>✓ Day/Night selection</li>
                <li>✓ Balanced gameplay</li>
                <li>✓ No API key needed</li>
              </ul>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // API Key Input Screen (AI Mode)
  if (showAPIKeyInput) {
    return <APIKeyInput onSubmit={handleAPIKeySubmit} onSkipAI={handleSkipAI} />;
  }

  // AI Prompt Menu
  if (showMenu) {
    return (
      <>
        {isInitializingAI && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">🤖</div>
              <h2 className="text-3xl font-bold text-purple-400 mb-2">Initializing AI Game Director...</h2>
              <p className="text-gray-400">Analyzing your gameplay preferences</p>
              <div className="mt-6">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            </div>
          </div>
        )}
        {aiError && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-900 border-2 border-red-500 text-white px-6 py-4 rounded-xl z-50 max-w-md">
            <p className="font-bold mb-1">⚠️ AI Initialization Failed</p>
            <p className="text-sm">{aiError}</p>
            <button
              onClick={() => {
                setAiError('');
                setShowMenu(false);
                setShowAPIKeyInput(true);
              }}
              className="mt-3 bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        <MainMenu onStartGame={handleAIGameStart} t={t} />
      </>
    );
  }

  // Classic Mode Menu
  if (showClassicMenu) {
    return <ClassicMenu onStartGame={handleClassicGameStart} onBack={() => { setShowClassicMenu(false); setGameMode('none'); }} t={t} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <Analytics />
      <div ref={mountRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <HUD
          health={gameState.health}
          ammo={gameState.ammo}
          maxAmmo={gameState.maxAmmo}
          enemiesKilled={gameState.enemiesKilled}
          score={gameState.score}
          wave={gameState.wave}
          weaponName={WEAPONS[gameState.currentWeapon].name}
          combo={gameState.combo}
          t={t}
          unlockedWeapons={gameState.unlockedWeapons}
          currentWeapon={gameState.currentWeapon}
        />
      </div>

      <div className="absolute inset-0" style={{ zIndex: 10, pointerEvents: 'none' }}>
        {!gameState.isGameOver && !isPaused && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute w-8 h-0.5 bg-green-400 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-90 shadow-lg"></div>
              <div className="absolute w-0.5 h-8 bg-green-400 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-90 shadow-lg"></div>
              <div className="absolute w-4 h-4 border-2 border-green-400 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        )}

        <Notifications
          showWaveComplete={showWaveComplete}
          killStreak={gameState.killStreak >= 5 ? gameState.killStreak : undefined}
          powerUpMessage={powerUpMessage}
          t={t}
        />
      </div>

      {isPaused && !gameState.isGameOver && (
        <div className="absolute inset-0" style={{ zIndex: 100, pointerEvents: 'auto' }}>
          <PauseMenu
            health={gameState.health}
            ammo={gameState.ammo}
            maxAmmo={gameState.maxAmmo}
            enemiesKilled={gameState.enemiesKilled}
            score={gameState.score}
            wave={gameState.wave}
            onMainMenu={returnToMenu}
            t={t}
          />
        </div>
      )}

      {gameState.isGameOver && (
        <div className="absolute inset-0" style={{ zIndex: 100, pointerEvents: 'auto' }}>
          <GameOver
            isVictory={gameState.isVictory}
            score={gameState.score}
            enemiesKilled={gameState.enemiesKilled}
            wave={gameState.wave}
            onRestart={restartGame}
            onMainMenu={returnToMenu}
            t={t}
          />
        </div>
      )}
    </div>
  );
};

export default ForestSurvivalGame;
