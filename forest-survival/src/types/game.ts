import * as THREE from 'three';

export interface Weapon {
  name: string;
  damage: number;
  fireRate: number;
  maxAmmo: number;
  reloadTime: number;
  bulletSpeed: number;
  bulletColor: number;
  spread: number;
}

export const WEAPONS: Record<string, Weapon> = {
  pistol: {
    name: '🔫 Pistol',
    damage: 25,
    fireRate: 300,
    maxAmmo: 12,
    reloadTime: 1000,
    bulletSpeed: 2,
    bulletColor: 0xffff00,
    spread: 0.02
  },
  rifle: {
    name: '🔪 Rifle',
    damage: 35,
    fireRate: 150,
    maxAmmo: 30,
    reloadTime: 1500,
    bulletSpeed: 3,
    bulletColor: 0xff6600,
    spread: 0.01
  },
  shotgun: {
    name: '💥 Shotgun',
    damage: 15,
    fireRate: 800,
    maxAmmo: 8,
    reloadTime: 2000,
    bulletSpeed: 1.5,
    bulletColor: 0xff0000,
    spread: 0.15
  }
};

export interface Enemy {
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  dead: boolean;
  type: 'normal' | 'fast' | 'tank' | 'boss';
  damage: number;
  scoreValue: number;
}

export interface Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
}

export interface PowerUp {
  mesh: THREE.Mesh;
  type: 'health' | 'ammo' | 'speed';
  position: THREE.Vector3;
  collected: boolean;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface Tree {
  mesh: THREE.Group;
  x: number;
  z: number;
}

export interface Keys {
  [key: string]: boolean;
}

export interface GameState {
  health: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  enemiesKilled: number;
  wave: number;
  isGameOver: boolean;
  isVictory: boolean;
  combo: number;
  killStreak: number;
  currentWeapon: string;
}
