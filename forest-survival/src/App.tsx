import { Analytics } from "@vercel/analytics/next"
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GunModel } from './utils/GunModel';
import { MuzzleFlash, BulletTracer, ImpactEffect } from './utils/Effects';
import { soundManager } from './utils/SoundManager';
import HUD from './components/HUD';
import MainMenu from './components/MainMenu';
import GameOver from './components/GameOver';
import PauseMenu from './components/PauseMenu';
import Notifications from './components/Notifications';
import { WEAPONS, type Enemy, type Bullet, type PowerUp, type Particle, type Tree, type Keys, type GameState } from './types/game';

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
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showWaveComplete, setShowWaveComplete] = useState(false);
  const [powerUpMessage, setPowerUpMessage] = useState<string>('');
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
    currentWeapon: 'pistol'
  });

  useEffect(() => {
    if (!gameStarted) return;

    // Scene setup with better fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x001100, 0.015);
    scene.background = new THREE.Color(0x001100);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // PIXELATED RENDERING for maximum performance
    const pixelSize = 2; // Higher = more pixelated = better performance
    const renderWidth = Math.floor(window.innerWidth / pixelSize);
    const renderHeight = Math.floor(window.innerHeight / pixelSize);

    const renderer = new THREE.WebGLRenderer({
      antialias: false, // Disabled for pixelated look
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
      alpha: false
    });
    renderer.setSize(renderWidth, renderHeight, false);
    renderer.setPixelRatio(1); // Fixed at 1 for consistent pixelation
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Fastest shadow type
    renderer.toneMapping = THREE.NoToneMapping; // Disabled for performance
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

    // SIMPLIFIED lighting for performance
    const ambientLight = new THREE.AmbientLight(0x606060, 1.2); // Brighter ambient, no shadows needed
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x8888ff, 0.8);
    moonLight.position.set(100, 150, -100);
    moonLight.castShadow = true;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 400;
    moonLight.shadow.camera.left = -100;
    moonLight.shadow.camera.right = 100;
    moonLight.shadow.camera.top = 100;
    moonLight.shadow.camera.bottom = -100;
    moonLight.shadow.mapSize.width = 512; // Much smaller shadow map
    moonLight.shadow.mapSize.height = 512;
    scene.add(moonLight);

    // Removed hemisphere light for performance
    // Removed player spotlight for performance

    // LOW-POLY Ground for performance
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 20, 20); // Reduced segments
    const groundMaterial = new THREE.MeshLambertMaterial({ // Cheaper than Standard
      color: 0x1a5c1a,
      flatShading: true // Low-poly aesthetic
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle ground variation
    const vertices = groundGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = Math.random() * 0.5 - 0.25;
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    // REMOVED grass patches for maximum performance
    // Low-poly aesthetic doesn't need extra details

    // LOW-POLY Trees for performance
    const trees: Tree[] = [];
    const createTree = (x: number, z: number): Tree => {
      const group = new THREE.Group();

      const height = 8 + Math.random() * 4;
      const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.6, height, 4); // 4 sides = very low poly
      const trunkMaterial = new THREE.MeshLambertMaterial({ // Cheaper material
        color: 0x3d2817,
        flatShading: true // Low-poly look
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      group.add(trunk);

      // Simple 2-layer leaves instead of 4
      for (let i = 0; i < 2; i++) {
        const size = 3.5 - i * 0.7;
        const leavesGeometry = new THREE.ConeGeometry(size, 6 - i * 1.5, 4); // 4 sides
        const leavesMaterial = new THREE.MeshLambertMaterial({
          color: 0x0d4d0d,
          flatShading: true
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = height/2 + 1 + i * 4;
        leaves.castShadow = true;
        group.add(leaves);
      }

      group.position.set(x, height/2, z);
      return { mesh: group, x, z };
    };

    for (let i = 0; i < 100; i++) { // Further reduced to 100
      const x = (Math.random() - 0.5) * 480;
      const z = (Math.random() - 0.5) * 480;
      if (Math.sqrt(x*x + z*z) > 20) {
        const tree = createTree(x, z);
        trees.push(tree);
        scene.add(tree.mesh);
      }
    }

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

    // Effects arrays
    const muzzleFlashes: MuzzleFlash[] = [];
    const bulletTracers: BulletTracer[] = [];
    const impactEffects: ImpactEffect[] = [];

    // Game objects
    const enemies: Enemy[] = [];
    const bullets: Bullet[] = [];
    const powerUps: PowerUp[] = [];
    const particles: Particle[] = [];

// Create enemy with better visuals
    const createEnemy = (x: number, z: number, type: 'normal' | 'fast' | 'tank' | 'boss' = 'normal'): Enemy => {
      const enemyGroup = new THREE.Group();

      let bodyColor = 0x8b0000;
      let headColor = 0xa00000;
      let enemyHealth = 50;
      let enemySpeed = 0.08;
      let enemyDamage = 0.3;
      let enemyScore = 10;
      let bodyScale = 1;

      switch(type) {
        case 'fast':
          bodyColor = 0x00008b;
          headColor = 0x0000ff;
          enemyHealth = 30;
          enemySpeed = 0.15;
          enemyDamage = 0.2;
          enemyScore = 15;
          bodyScale = 0.7;
          break;
        case 'tank':
          bodyColor = 0x2f4f2f;
          headColor = 0x556b2f;
          enemyHealth = 150;
          enemySpeed = 0.04;
          enemyDamage = 0.5;
          enemyScore = 30;
          bodyScale = 1.5;
          break;
        case 'boss':
          bodyColor = 0x8b008b;
          headColor = 0xff00ff;
          enemyHealth = 300;
          enemySpeed = 0.05;
          enemyDamage = 1.0;
          enemyScore = 100;
          bodyScale = 2;
          break;
      }

      // LOW-POLY enemy body
      const bodyGeometry = new THREE.CylinderGeometry(0.5 * bodyScale, 0.5 * bodyScale, 2 * bodyScale, 4); // 4 sides
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: bodyColor,
        flatShading: true,
        emissive: bodyColor,
        emissiveIntensity: 0.1
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      enemyGroup.add(body);

      // LOW-POLY head
      const headGeometry = new THREE.BoxGeometry(bodyScale, bodyScale, bodyScale); // Box instead of sphere
      const headMaterial = new THREE.MeshLambertMaterial({
        color: headColor,
        flatShading: true,
        emissive: headColor,
        emissiveIntensity: 0.15
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.5 * bodyScale;
      head.castShadow = true;
      head.rotation.y = Math.PI / 4; // Rotate for diamond look
      enemyGroup.add(head);

      // Simple glowing eyes
      const eyeGeometry = new THREE.BoxGeometry(0.15 * bodyScale, 0.15 * bodyScale, 0.05 * bodyScale);
      const eyeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000
      });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.2 * bodyScale, 1.6 * bodyScale, 0.5 * bodyScale);
      enemyGroup.add(leftEye);

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.2 * bodyScale, 1.6 * bodyScale, 0.5 * bodyScale);
      enemyGroup.add(rightEye);

      // Removed enemy light for performance

      enemyGroup.position.set(x, 1.5 * bodyScale, z);
      scene.add(enemyGroup);

      return {
        mesh: enemyGroup,
        health: enemyHealth,
        maxHealth: enemyHealth,
        speed: enemySpeed + Math.random() * 0.02,
        dead: false,
        type,
        damage: enemyDamage,
        scoreValue: enemyScore
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

    const spawnWave = () => {
      const enemyCount = 5 + wave * 2;
      for (let i = 0; i < enemyCount; i++) {
        const angle = (Math.PI * 2 * i) / enemyCount;
        const distance = 40 + Math.random() * 30;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        let type: 'normal' | 'fast' | 'tank' | 'boss' = 'normal';
        const rand = Math.random();

        if (wave >= 5 && rand < 0.1) type = 'boss';
        else if (wave >= 3 && rand < 0.3) type = 'tank';
        else if (wave >= 2 && rand < 0.5) type = 'fast';

        enemies.push(createEnemy(x, z, type));
      }

      if (wave % 2 === 0) {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 20 + Math.random() * 15;
          const types: ('health' | 'ammo' | 'speed')[] = ['health', 'ammo', 'speed'];
          const type = types[Math.floor(Math.random() * types.length)];
          powerUps.push(createPowerUp(Math.cos(angle) * distance, Math.sin(angle) * distance, type));
        }
      }
    };

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

      if (e.code === 'Digit1' && !isReloading) {
        currentWeapon = 'pistol';
        ammo = WEAPONS.pistol.maxAmmo;
        gunModel.switchWeapon('pistol');
        updateGameState();
      }
      if (e.code === 'Digit2' && !isReloading) {
        currentWeapon = 'rifle';
        ammo = WEAPONS.rifle.maxAmmo;
        gunModel.switchWeapon('rifle');
        updateGameState();
      }
      if (e.code === 'Digit3' && !isReloading) {
        currentWeapon = 'shotgun';
        ammo = WEAPONS.shotgun.maxAmmo;
        gunModel.switchWeapon('shotgun');
        updateGameState();
      }

      if (e.code === 'KeyR' && !isReloading && !paused && ammo < WEAPONS[currentWeapon].maxAmmo) {
        isReloading = true;
        const weapon = WEAPONS[currentWeapon];
        soundManager.play('reload', 0.5);
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

    const onCanvasClick = () => {
      if (!isGameOver && !paused && document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
      }
    };

    renderer.domElement.addEventListener('click', onCanvasClick);

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

          direction.x += (Math.random() - 0.5) * weapon.spread;
          direction.y += (Math.random() - 0.5) * weapon.spread;
          direction.z += (Math.random() - 0.5) * weapon.spread;
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
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && !paused && !isGameOver) {
        mouseDown = true;
        shoot();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseDown = false;
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

    const updateGameState = () => {
      setGameState({
        health,
        ammo,
        maxAmmo: WEAPONS[currentWeapon].maxAmmo,
        score,
        enemiesKilled,
        wave,
        isGameOver,
        isVictory: enemiesKilled >= 50,
        combo,
        killStreak,
        currentWeapon
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

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (isGameOver || paused) {
        renderer.render(scene, camera);
        return;
      }

      // Update gun recoil
      gunModel.updateRecoil(delta);

      // Removed player light update for performance

      // Player movement
      const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
      const currentSpeed = isRunning ? moveSpeed * sprintMultiplier : moveSpeed;

      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(camera.up, direction).normalize();

      if (keys['KeyW'] || keys['ArrowUp']) {
        camera.position.addScaledVector(direction, currentSpeed);
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        camera.position.addScaledVector(direction, -currentSpeed);
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        camera.position.addScaledVector(right, currentSpeed);
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        camera.position.addScaledVector(right, -currentSpeed);
      }

      if (keys['Space'] && !isJumping && camera.position.y <= groundLevel) {
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

      camera.position.x = Math.max(-240, Math.min(240, camera.position.x));
      camera.position.z = Math.max(-240, Math.min(240, camera.position.z));

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

            createParticles(enemy.mesh.position, 0xff0000, 3); // Reduced particles
            soundManager.play('hit', 0.4);

            if (enemy.health <= 0) {
              enemy.dead = true;
              scene.remove(enemy.mesh);
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

              // Remove enemy AFTER all operations
              enemies.splice(j, 1);

              updateGameState();

              // Check for wave complete or victory
              if (enemiesKilled >= 50) {
                // Victory condition - do nothing here, will be handled below
              } else if (enemies.length === 0) {
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
        if (enemy.dead) continue;

        // Simple breathing animation
        enemy.mesh.position.y += Math.sin(Date.now() * 0.003 + i) * 0.01;

        const dx = camera.position.x - enemy.mesh.position.x;
        const dz = camera.position.z - enemy.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 2.5) {
          enemy.mesh.position.x += (dx / distance) * enemy.speed;
          enemy.mesh.position.z += (dz / distance) * enemy.speed;
          enemy.mesh.lookAt(camera.position.x, enemy.mesh.position.y, camera.position.z);
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

      if (enemiesKilled >= 50 && !isGameOver) {
        isGameOver = true;
        updateGameState();
        document.exitPointerLock();
      }

      renderer.render(scene, camera);
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
      document.removeEventListener('pointerlockchange', onPointerLockChange);

      if (renderer.domElement) {
        renderer.domElement.removeEventListener('click', onCanvasClick);
      }

      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      if (mountNode && renderer.domElement) {
        mountNode.removeChild(renderer.domElement);
      }

      renderer.dispose();
    };
  }, [gameStarted]);

  const startGame = () => {
    soundManager.initialize();
    setGameStarted(true);
  };

  const restartGame = () => {
    window.location.reload();
  };

  const returnToMenu = () => {
    window.location.reload();
  };

  if (!gameStarted) {
    return <MainMenu onStartGame={startGame} t={t} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
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
