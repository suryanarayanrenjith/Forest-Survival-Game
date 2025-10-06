import * as THREE from 'three';

export class GunModel {
  group: THREE.Group;
  recoilAnimation: number = 0;

  constructor(type: 'pistol' | 'rifle' | 'shotgun') {
    this.group = new THREE.Group();
    this.createGunModel(type);
  }

  private createGunModel(type: 'pistol' | 'rifle' | 'shotgun') {
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
    }

    // Position gun in front of camera
    this.group.position.set(0.3, -0.3, -0.5);
    this.group.scale.set(0.15, 0.15, 0.15);
  }

  private createPistol() {
    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.2
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -2;
    this.group.add(barrel);

    // Body/Handle
    const bodyGeometry = new THREE.BoxGeometry(1.2, 2.5, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0.5);
    this.group.add(body);

    // Trigger guard
    const guardGeometry = new THREE.TorusGeometry(0.5, 0.1, 8, 16);
    const guardMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.7,
      roughness: 0.3
    });
    const guard = new THREE.Mesh(guardGeometry, guardMaterial);
    guard.rotation.x = Math.PI / 2;
    guard.position.set(0, -0.5, 0);
    this.group.add(guard);

    // Sight
    const sightGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
    const sightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    const sight = new THREE.Mesh(sightGeometry, sightMaterial);
    sight.position.set(0, 1.5, -1.5);
    this.group.add(sight);
  }

  private createRifle() {
    // Long barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 7, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.1
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -3.5;
    this.group.add(barrel);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    this.group.add(body);

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.8, 2.5, 1);
    const magMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.5,
      roughness: 0.4
    });
    const mag = new THREE.Mesh(magGeometry, magMaterial);
    mag.position.set(0, -1.5, 0.5);
    this.group.add(mag);

    // Stock
    const stockGeometry = new THREE.BoxGeometry(1.2, 1.5, 2);
    const stockMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      metalness: 0.2,
      roughness: 0.8
    });
    const stock = new THREE.Mesh(stockGeometry, stockMaterial);
    stock.position.set(0, 0, 2.5);
    this.group.add(stock);

    // Scope
    const scopeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
    const scopeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.8,
      roughness: 0.2
    });
    const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.rotation.z = Math.PI / 2;
    scope.position.set(0, 1.2, -1);
    this.group.add(scope);

    // Red dot sight
    const dotGeometry = new THREE.SphereGeometry(0.1);
    const dotMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(0, 1.2, -2);
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

  updateRecoil(delta: number) {
    if (this.recoilAnimation > 0) {
      this.recoilAnimation -= delta * 10;

      // Recoil effect
      const recoilAmount = Math.max(0, this.recoilAnimation);
      this.group.position.z = -0.5 + recoilAmount * 0.15;
      this.group.rotation.x = -recoilAmount * 0.3;
    } else {
      // Smoothly return to original position
      this.group.position.z += (-0.5 - this.group.position.z) * 0.2;
      this.group.rotation.x += (0 - this.group.rotation.x) * 0.2;
    }
  }

  triggerRecoil() {
    this.recoilAnimation = 1;
  }

  switchWeapon(type: 'pistol' | 'rifle' | 'shotgun') {
    this.createGunModel(type);
  }
}
