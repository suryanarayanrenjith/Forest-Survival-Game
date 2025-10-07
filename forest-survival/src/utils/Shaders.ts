import * as THREE from 'three';

// Custom vertex shader for animated grass/foliage
export const foliageVertexShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    // Wind effect
    float wind = sin(time * 2.0 + position.x * 0.5 + position.z * 0.5) * 0.3;
    pos.x += wind * position.y * 0.1;
    pos.z += wind * position.y * 0.05;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const foliageFragmentShader = `
  uniform vec3 color;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec3 light = normalize(vec3(0.5, 1.0, 0.3));
    float dProd = max(0.0, dot(vNormal, light));

    vec3 finalColor = color * (0.5 + 0.5 * dProd);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Enhanced water/liquid shader
export const waterVertexShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;

    vec3 pos = position;
    // Wave motion
    pos.y += sin(time * 3.0 + position.x * 2.0) * 0.1;
    pos.y += cos(time * 2.0 + position.z * 2.0) * 0.1;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const waterFragmentShader = `
  uniform float time;
  uniform vec3 color;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vec2 uv = vUv * 10.0;
    float pattern = sin(uv.x + time) * cos(uv.y + time) * 0.5 + 0.5;

    vec3 finalColor = mix(color * 0.8, color, pattern);
    gl_FragColor = vec4(finalColor, 0.7);
  }
`;

// Rim lighting shader for enemies
export const rimLightVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const rimLightFragmentShader = `
  uniform vec3 color;
  uniform vec3 rimColor;
  uniform float rimPower;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float rim = 1.0 - max(0.0, dot(normal, viewDir));
    rim = pow(rim, rimPower);

    vec3 finalColor = mix(color, rimColor, rim);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Holographic effect for power-ups
export const holographicVertexShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    vec3 pos = position;
    // Floating animation
    pos.y += sin(time * 2.0) * 0.2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const holographicFragmentShader = `
  uniform float time;
  uniform vec3 color;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Scan lines
    float scanline = sin(vPosition.y * 20.0 - time * 5.0) * 0.5 + 0.5;

    // Fresnel effect
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(vNormal, viewDir), 3.0);

    vec3 finalColor = color * (0.5 + scanline * 0.5) + vec3(fresnel);
    float alpha = 0.7 + fresnel * 0.3;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Create shader material helper
export function createCustomMaterial(
  type: 'foliage' | 'water' | 'rimLight' | 'holographic',
  color: THREE.Color,
  options?: {
    rimColor?: THREE.Color;
    rimPower?: number;
  }
): THREE.ShaderMaterial {
  const uniforms = {
    time: { value: 0 },
    color: { value: color }
  };

  let vertexShader = '';
  let fragmentShader = '';

  switch (type) {
    case 'foliage':
      vertexShader = foliageVertexShader;
      fragmentShader = foliageFragmentShader;
      break;
    case 'water':
      vertexShader = waterVertexShader;
      fragmentShader = waterFragmentShader;
      break;
    case 'rimLight':
      Object.assign(uniforms, {
        rimColor: { value: options?.rimColor || new THREE.Color(0xffffff) },
        rimPower: { value: options?.rimPower || 3.0 }
      });
      vertexShader = rimLightVertexShader;
      fragmentShader = rimLightFragmentShader;
      break;
    case 'holographic':
      vertexShader = holographicVertexShader;
      fragmentShader = holographicFragmentShader;
      break;
  }

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: type === 'water' || type === 'holographic',
    side: THREE.DoubleSide
  });
}

// Update shader time uniform
export function updateShaderTime(material: THREE.ShaderMaterial, deltaTime: number) {
  if (material.uniforms.time) {
    material.uniforms.time.value += deltaTime;
  }
}
