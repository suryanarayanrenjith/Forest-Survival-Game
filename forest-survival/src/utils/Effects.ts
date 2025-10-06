import * as THREE from 'three';

export class MuzzleFlash {
  light: THREE.PointLight;
  sprite: THREE.Sprite;
  lifetime: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3, color: number) {
    // Create point light
    this.light = new THREE.PointLight(color, 10, 10);
    this.light.position.copy(position);
    scene.add(this.light);

    // Create sprite for visual flash
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 1)`);
    gradient.addColorStop(0.5, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.5)`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    this.sprite = new THREE.Sprite(spriteMaterial);
    this.sprite.position.copy(position);
    this.sprite.scale.set(0.5, 0.5, 0.5);
    scene.add(this.sprite);

    this.lifetime = 0.1;
  }

  update(delta: number): boolean {
    this.lifetime -= delta;

    if (this.lifetime <= 0) {
      return true; // Signal for removal
    }

    const opacity = this.lifetime / 0.1;
    this.light.intensity = 10 * opacity;
    if (this.sprite.material instanceof THREE.SpriteMaterial) {
      this.sprite.material.opacity = opacity;
    }

    return false;
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.light);
    scene.remove(this.sprite);
    if (this.sprite.material instanceof THREE.SpriteMaterial) {
      this.sprite.material.map?.dispose();
      this.sprite.material.dispose();
    }
  }
}

export class BulletTracer {
  line: THREE.Line;
  lifetime: number = 0;

  constructor(scene: THREE.Scene, start: THREE.Vector3, end: THREE.Vector3, color: number) {
    const points = [start.clone(), end.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });

    this.line = new THREE.Line(geometry, material);
    scene.add(this.line);
    this.lifetime = 0.05;
  }

  update(delta: number): boolean {
    this.lifetime -= delta;

    if (this.lifetime <= 0) {
      return true;
    }

    const opacity = this.lifetime / 0.05;
    (this.line.material as THREE.LineBasicMaterial).opacity = opacity * 0.8;

    return false;
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.line);
    this.line.geometry.dispose();
    (this.line.material as THREE.LineBasicMaterial).dispose();
  }
}

export class ImpactEffect {
  particles: THREE.Points;
  velocities: THREE.Vector3[] = [];
  lifetime: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3, color: number, count: number = 10) {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    const r = ((color >> 16) & 255) / 255;
    const g = ((color >> 8) & 255) / 255;
    const b = (color & 255) / 255;

    for (let i = 0; i < count; i++) {
      positions.push(position.x, position.y, position.z);
      colors.push(r, g, b);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      this.velocities.push(velocity);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
    this.lifetime = 0.5;
  }

  update(delta: number): boolean {
    this.lifetime -= delta;

    if (this.lifetime <= 0) {
      return true;
    }

    const positions = this.particles.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.velocities.length; i++) {
      const idx = i * 3;
      positions[idx] += this.velocities[i].x * delta * 10;
      positions[idx + 1] += this.velocities[i].y * delta * 10;
      positions[idx + 2] += this.velocities[i].z * delta * 10;

      // Gravity
      this.velocities[i].y -= delta * 5;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    const opacity = this.lifetime / 0.5;
    (this.particles.material as THREE.PointsMaterial).opacity = opacity;

    return false;
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.particles);
    this.particles.geometry.dispose();
    (this.particles.material as THREE.PointsMaterial).dispose();
  }
}
