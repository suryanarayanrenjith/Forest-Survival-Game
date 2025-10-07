import * as THREE from 'three';

// Volumetric Light Scattering (God Rays) Shader
export const volumetricLightVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const volumetricLightFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform vec2 lightPosition;
  uniform float exposure;
  uniform float decay;
  uniform float density;
  uniform float weight;
  uniform int samples;

  varying vec2 vUv;

  void main() {
    vec2 texCoord = vUv;
    vec2 deltaTextCoord = texCoord - lightPosition;
    deltaTextCoord *= 1.0 / float(samples) * density;

    float illuminationDecay = 1.0;
    vec4 color = texture2D(tDiffuse, texCoord);

    for(int i = 0; i < 100; i++) {
      if(i >= samples) break;

      texCoord -= deltaTextCoord;
      vec4 sample = texture2D(tDiffuse, texCoord);

      sample *= illuminationDecay * weight;
      color += sample;
      illuminationDecay *= decay;
    }

    gl_FragColor = color * exposure;
  }
`;

// Advanced Bloom Shader
export const bloomVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const bloomFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float strength;
  uniform float radius;
  uniform float threshold;

  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);

    // Extract bright areas
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    float contribution = max(0.0, brightness - threshold);

    vec3 bloom = color.rgb * contribution * strength;

    // Sample surrounding pixels for blur
    vec2 texelSize = vec2(1.0) / vec2(textureSize(tDiffuse, 0));
    vec3 result = bloom;

    float total = 1.0;
    for(float x = -radius; x <= radius; x += 1.0) {
      for(float y = -radius; y <= radius; y += 1.0) {
        vec2 offset = vec2(x, y) * texelSize;
        vec4 sample = texture2D(tDiffuse, vUv + offset);
        float sampleBrightness = dot(sample.rgb, vec3(0.2126, 0.7152, 0.0722));
        float sampleContribution = max(0.0, sampleBrightness - threshold);
        result += sample.rgb * sampleContribution;
        total += 1.0;
      }
    }

    result /= total;
    gl_FragColor = vec4(color.rgb + result * strength, color.a);
  }
`;

// SSAO (Screen Space Ambient Occlusion) Shader
export const ssaoVertexShader = `
  varying vec2 vUv;
  varying vec3 vViewPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const ssaoFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform sampler2D tNormal;
  uniform vec2 resolution;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform float radius;
  uniform float intensity;

  varying vec2 vUv;

  float getDepth(vec2 uv) {
    return texture2D(tDepth, uv).x;
  }

  vec3 getViewPosition(vec2 uv, float depth) {
    float z = depth * 2.0 - 1.0;
    vec4 clipSpacePosition = vec4(uv * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = inverse(projectionMatrix) * clipSpacePosition;
    return viewSpacePosition.xyz / viewSpacePosition.w;
  }

  void main() {
    float depth = getDepth(vUv);
    vec3 viewPos = getViewPosition(vUv, depth);
    vec3 normal = normalize(texture2D(tNormal, vUv).xyz * 2.0 - 1.0);

    float occlusion = 0.0;
    int samples = 16;

    for(int i = 0; i < samples; i++) {
      float angle = float(i) * 2.39996323;
      float radiusStep = float(i) / float(samples);
      vec2 offset = vec2(cos(angle), sin(angle)) * radius * radiusStep / resolution;

      float sampleDepth = getDepth(vUv + offset);
      vec3 samplePos = getViewPosition(vUv + offset, sampleDepth);

      vec3 diff = samplePos - viewPos;
      float dist = length(diff);

      occlusion += max(0.0, dot(normal, normalize(diff))) * (1.0 / (1.0 + dist));
    }

    occlusion = 1.0 - (occlusion / float(samples)) * intensity;

    vec4 color = texture2D(tDiffuse, vUv);
    gl_FragColor = vec4(color.rgb * occlusion, color.a);
  }
`;

// Atmospheric Scattering Shader
export const atmosphericVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vViewDirection = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const atmosphericFragmentShader = `
  uniform vec3 sunPosition;
  uniform vec3 sunColor;
  uniform float sunIntensity;
  uniform float atmosphereThickness;
  uniform vec3 skyColor;
  uniform float time;

  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;

  float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * 3.14159)) * (1.0 + cosTheta * cosTheta);
  }

  float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    return (1.0 / (4.0 * 3.14159)) * ((1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
  }

  void main() {
    vec3 viewDir = normalize(vViewDirection);
    vec3 sunDir = normalize(sunPosition);

    float cosTheta = dot(viewDir, sunDir);

    // Rayleigh scattering (sky blue)
    vec3 rayleighColor = skyColor * rayleighPhase(cosTheta);

    // Mie scattering (sun glow)
    vec3 mieColor = sunColor * miePhase(cosTheta, 0.8);

    // Atmospheric depth
    float altitude = normalize(vWorldPosition).y;
    float depth = exp(-altitude * atmosphereThickness);

    // Sun disk
    float sunDisk = smoothstep(0.9995, 0.9999, cosTheta);
    vec3 sun = sunColor * sunDisk * sunIntensity;

    // Combine
    vec3 color = rayleighColor * depth + mieColor * depth * 0.5 + sun;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Lens Flare Effect
export const lensFlareVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const lensFlareFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform vec2 sunPosition;
  uniform float intensity;
  uniform vec3 flareColor;

  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);

    vec2 toSun = sunPosition - vUv;
    float dist = length(toSun);

    // Multiple flare elements
    float flare1 = 1.0 - smoothstep(0.0, 0.5, dist);
    float flare2 = 1.0 - smoothstep(0.0, 0.3, length(toSun * 0.5));
    float flare3 = 1.0 - smoothstep(0.0, 0.2, length(toSun * 0.25));

    vec3 flare = flareColor * (flare1 * 0.3 + flare2 * 0.2 + flare3 * 0.1) * intensity;

    gl_FragColor = vec4(color.rgb + flare, color.a);
  }
`;

// Color Grading Shader
export const colorGradingFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float contrast;
  uniform float saturation;
  uniform float brightness;
  uniform float vignette;
  uniform vec3 colorTint;

  varying vec2 vUv;

  vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
  }

  vec3 adjustSaturation(vec3 color, float saturation) {
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luminance), color, saturation);
  }

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);

    // Brightness
    color.rgb *= brightness;

    // Contrast
    color.rgb = adjustContrast(color.rgb, contrast);

    // Saturation
    color.rgb = adjustSaturation(color.rgb, saturation);

    // Color tint
    color.rgb *= colorTint;

    // Vignette
    vec2 center = vUv - 0.5;
    float vig = 1.0 - dot(center, center) * vignette;
    color.rgb *= vig;

    gl_FragColor = color;
  }
`;

// Create post-processing pass
export function createVolumetricLightMaterial(lightPosition: THREE.Vector2): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      lightPosition: { value: lightPosition },
      exposure: { value: 0.4 },
      decay: { value: 0.95 },
      density: { value: 0.5 },
      weight: { value: 0.4 },
      samples: { value: 50 }
    },
    vertexShader: volumetricLightVertexShader,
    fragmentShader: volumetricLightFragmentShader
  });
}

export function createBloomMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      strength: { value: 1.5 },
      radius: { value: 2.0 },
      threshold: { value: 0.7 }
    },
    vertexShader: bloomVertexShader,
    fragmentShader: bloomFragmentShader
  });
}

export function createColorGradingMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      contrast: { value: 1.1 },
      saturation: { value: 1.2 },
      brightness: { value: 1.0 },
      vignette: { value: 0.5 },
      colorTint: { value: new THREE.Vector3(1.0, 1.0, 1.0) }
    },
    vertexShader: bloomVertexShader,
    fragmentShader: colorGradingFragmentShader
  });
}
