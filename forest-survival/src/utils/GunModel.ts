import * as THREE from 'three';

export class GunModel {
  group: THREE.Group;
  recoilAnimation: number = 0;
  reloadAnimation: number = 0;
  idleSwayTime: number = 0;
  walkBobTime: number = 0;
  isReloading: boolean = false;
  magazine: THREE.Mesh | null = null;
  currentWeaponType: string = 'pistol';

  constructor(type: 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'sniper' | 'minigun' | 'launcher') {
    this.group = new THREE.Group();
    this.currentWeaponType = type;
    this.createGunModel(type);
  }

  private createGunModel(type: 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'sniper' | 'minigun' | 'launcher') {
    this.group.clear();

    switch(type) {
      case 'pistol':
        this.createPistol();
        break;
      case 'rifle':
        this.createRifle();
        break;
      case 'shotgun':
        this.createShotgun();
        break;
      case 'smg':
        this.createSMG();
        break;
      case 'sniper':
        this.createSniper();
        break;
      case 'minigun':
        this.createMinigun();
        break;
      case 'launcher':
        this.createLauncher();
        break;
    }

    // Position gun in front of camera
    this.group.position.set(0.3, -0.3, -0.5);
    this.group.scale.set(0.15, 0.15, 0.15);
  }

  private createPistol() {
    // Slide (top part)
    const slideGeometry = new THREE.BoxGeometry(0.8, 0.6, 4.5);
    const slideMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.15,
      flatShading: true
    });
    const slide = new THREE.Mesh(slideGeometry, slideMaterial);
    slide.position.set(0, 0.8, -1.5);
    this.group.add(slide);

    // Barrel extending from slide
    const barrelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.95,
      roughness: 0.1
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.8, -4.2);
    this.group.add(barrel);

    // Frame/Grip
    const gripGeometry = new THREE.BoxGeometry(1, 2.2, 1.2);
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.3,
      roughness: 0.7,
      flatShading: true
    });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0, -0.5, 0.3);
    this.group.add(grip);

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.7, 1.8, 0.8);
    const magMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.5,
      roughness: 0.4
    });
    this.magazine = new THREE.Mesh(magGeometry, magMaterial);
    this.magazine.position.set(0, -1, 0.3);
    this.group.add(this.magazine);

    // Trigger
    const triggerGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.3);
    const triggerMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.2
    });
    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.set(0, -0.3, -0.5);
    this.group.add(trigger);

    // Front sight
    const frontSightGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
    const sightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.6
    });
    const frontSight = new THREE.Mesh(frontSightGeometry, sightMaterial);
    frontSight.position.set(0, 1.3, -3.5);
    this.group.add(frontSight);

    // Rear sight
    const rearSight = new THREE.Mesh(frontSightGeometry, sightMaterial);
    rearSight.position.set(0, 1.3, -0.5);
    this.group.add(rearSight);
  }

  private createRifle() {
    // Upper receiver
    const upperGeometry = new THREE.BoxGeometry(1.2, 0.8, 5);
    const upperMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.85,
      roughness: 0.2,
      flatShading: true
    });
    const upper = new THREE.Mesh(upperGeometry, upperMaterial);
    upper.position.set(0, 0.5, -1.5);
    this.group.add(upper);

    // Barrel with heat shield
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.22, 6, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.95,
      roughness: 0.1
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.3, -4.5);
    this.group.add(barrel);

    // Handguard
    const handguardGeometry = new THREE.BoxGeometry(1, 0.8, 3.5);
    const handguardMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.4,
      roughness: 0.6,
      flatShading: true
    });
    const handguard = new THREE.Mesh(handguardGeometry, handguardMaterial);
    handguard.position.set(0, 0, -3);
    this.group.add(handguard);

    // Lower receiver
    const lowerGeometry = new THREE.BoxGeometry(1.1, 1.2, 2.5);
    const lowerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.3,
      flatShading: true
    });
    const lower = new THREE.Mesh(lowerGeometry, lowerMaterial);
    lower.position.set(0, -0.3, 0.5);
    this.group.add(lower);

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.7, 2, 0.9);
    const magMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.3,
      roughness: 0.5,
      flatShading: true,
      emissive: 0x662200,
      emissiveIntensity: 0.2
    });
    this.magazine = new THREE.Mesh(magGeometry, magMaterial);
    this.magazine.position.set(0, -1.8, 0.5);
    this.group.add(this.magazine);

    // Stock
    const stockGeometry = new THREE.BoxGeometry(1, 1.2, 2.5);
    const stockMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      metalness: 0.2,
      roughness: 0.8,
      flatShading: true
    });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, 0.2, 3);
    this.group.add(stock);

    // Optic rail
    const railGeometry = new THREE.BoxGeometry(0.4, 0.3, 3);
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.3
    });
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(0, 1.2, -1);
    this.group.add(rail);

    // Red dot sight
    const sightGeometry = new THREE.BoxGeometry(0.6, 0.6, 1);
    const sightMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.7,
      roughness: 0.3
    });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.set(0, 1.6, -1);
    this.group.add(sight);

    // Red dot
    const dotGeometry = new THREE.CircleGeometry(0.08);
    const dotMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000
    });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(0, 1.6, -1.6);
    this.group.add(dot);
  }

  private createShotgun() {
    // Wide barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.4, 0.35, 5, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -2.5;
    this.group.add(barrel);

    // Pump action
    const pumpGeometry = new THREE.CylinderGeometry(0.45, 0.45, 1, 8);
    const pumpMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      metalness: 0.3,
      roughness: 0.7
    });
    const pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.rotation.x = Math.PI / 2;
    pump.position.set(0, -0.5, -1);
    this.group.add(pump);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1.8, 2, 2.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0.5);
    this.group.add(body);

    // Stock
    const stockGeometry = new THREE.BoxGeometry(1.5, 2, 3);
    const stockMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3a2a,
      metalness: 0.2,
      roughness: 0.8
    });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, 0, 3);
    this.group.add(stock);

    // Iron sights
    const sightGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const sightMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.8,
      roughness: 0.2
    });
    const frontSight = new THREE.Mesh(sightGeometry, sightMaterial);
    frontSight.position.set(0, 1.3, -4);
    this.group.add(frontSight);

    const rearSight = new THREE.Mesh(sightGeometry, sightMaterial);
    rearSight.position.set(0, 1.3, 0);
    this.group.add(rearSight);
  }

  private createSMG() {
    // Compact body
    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.8, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      metalness: 0.7,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.group.add(body);

    // Short barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3.5, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.9,
      roughness: 0.1
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -1.75;
    this.group.add(barrel);

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.6, 2, 0.8);
    const magMaterial = new THREE.MeshStandardMaterial({
      color: 0x00cccc,
      metalness: 0.6,
      roughness: 0.3
    });
    const mag = new THREE.Mesh(magGeometry, magMaterial);
    mag.position.set(0, -1.5, 0);
    this.group.add(mag);
  }

  private createSniper() {
    // Extra long barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.95,
      roughness: 0.05
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -5;
    this.group.add(barrel);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 1.5, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2a1a,
      metalness: 0.6,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    this.group.add(body);

    // Large scope
    const scopeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
    const scopeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aa00,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3
    });
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.rotation.z = Math.PI / 2;
    scope.position.set(0, 1.5, -2);
    this.group.add(scope);
  }

  private createMinigun() {
    // Multiple barrels
    const barrelGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 6);
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.9,
        roughness: 0.1
      });
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.x = Math.cos(angle) * 0.5;
      barrel.position.y = Math.sin(angle) * 0.5;
      barrel.position.z = -3;
      barrelGroup.add(barrel);
    }
    this.group.add(barrelGroup);

    // Central hub
    const hubGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1, 16);
    const hubMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xff00ff,
      emissiveIntensity: 0.3
    });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = -3;
    this.group.add(hub);

    // Ammo box
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.5,
      roughness: 0.5
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, -0.5, 1.5);
    this.group.add(box);
  }

  private createLauncher() {
    // Large tube
    const tubeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 6, 8);
    const tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      metalness: 0.7,
      roughness: 0.3
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.rotation.x = Math.PI / 2;
    tube.position.z = -3;
    this.group.add(tube);

    // Rocket tip (visible)
    const tipGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
    const tipMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xff2200,
      emissiveIntensity: 0.4
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -6.5;
    this.group.add(tip);

    // Grip
    const gripGeometry = new THREE.BoxGeometry(1, 2, 1.5);
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.5,
      roughness: 0.5
    });
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0, -0.5, 0);
    this.group.add(grip);
  }

  updateRecoil(delta: number) {
    const baseZ = -0.5;

    // Recoil animation
    if (this.recoilAnimation > 0) {
      this.recoilAnimation -= delta * 10;
      const recoilAmount = Math.max(0, this.recoilAnimation);
      this.group.position.z = baseZ + recoilAmount * 0.15;
      this.group.rotation.x = -recoilAmount * 0.3;
    } else {
      this.group.position.z += (baseZ - this.group.position.z) * 0.2;
      this.group.rotation.x += (0 - this.group.rotation.x) * 0.2;
    }

    // Reload animation
    if (this.isReloading) {
      this.reloadAnimation += delta * 3;
      if (this.reloadAnimation < 0.5) {
        // Magazine drops
        if (this.magazine) {
          this.magazine.position.y = -1 - this.reloadAnimation * 4;
          this.magazine.rotation.x = this.reloadAnimation * 2;
        }
      } else if (this.reloadAnimation < 1.0) {
        // Magazine inserts
        if (this.magazine) {
          this.magazine.position.y = -1 - (1.0 - this.reloadAnimation) * 4;
          this.magazine.rotation.x = (1.0 - this.reloadAnimation) * 2;
        }
      } else {
        // Reset
        this.isReloading = false;
        this.reloadAnimation = 0;
        if (this.magazine) {
          this.magazine.position.y = -1;
          this.magazine.rotation.x = 0;
        }
      }
    }
  }

  updateIdleSway(delta: number) {
    this.idleSwayTime += delta;
    // Subtle breathing/idle motion
    const swayX = Math.sin(this.idleSwayTime * 0.8) * 0.003;
    const swayY = Math.cos(this.idleSwayTime * 0.6) * 0.002;
    const swayZ = Math.sin(this.idleSwayTime * 0.5) * 0.001;

    this.group.rotation.x += swayX;
    this.group.rotation.y += swayY;
    this.group.rotation.z += swayZ;
  }

  updateWalkBob(delta: number, isWalking: boolean, isRunning: boolean) {
    if (isWalking) {
      const speed = isRunning ? 8.0 : 5.0;
      const intensity = isRunning ? 0.015 : 0.01;

      this.walkBobTime += delta * speed;

      // Vertical bobbing
      this.group.position.y = -0.3 + Math.sin(this.walkBobTime) * intensity;

      // Horizontal sway
      this.group.position.x = 0.3 + Math.sin(this.walkBobTime * 0.5) * intensity * 0.5;

      // Subtle rotation
      this.group.rotation.z = Math.sin(this.walkBobTime * 0.5) * intensity * 2;
    } else {
      // Smooth return to center
      this.group.position.y += (-0.3 - this.group.position.y) * 0.1;
      this.group.position.x += (0.3 - this.group.position.x) * 0.1;
      this.group.rotation.z += (0 - this.group.rotation.z) * 0.1;
    }
  }

  triggerRecoil() {
    this.recoilAnimation = 1;
  }

  triggerReload() {
    this.isReloading = true;
    this.reloadAnimation = 0;
  }

  switchWeapon(type: 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'sniper' | 'minigun' | 'launcher') {
    this.currentWeaponType = type;
    this.createGunModel(type);
  }
}
