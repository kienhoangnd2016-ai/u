import * as THREE from 'three';

export interface CelMaterialOptions {
  baseColor: THREE.ColorRepresentation;
  shadowTint?: THREE.ColorRepresentation;
  rimColor: THREE.ColorRepresentation;
  emissiveColor?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  specularStrength?: number;
  celSteps?: number;
  rimPower?: number;
  rimIntensity?: number;
}

export function createCelRimMaterial(options: CelMaterialOptions): THREE.ShaderMaterial {
  const base = new THREE.Color(options.baseColor);
  const shadow = new THREE.Color(options.shadowTint ?? 0x16142e);
  const rim = new THREE.Color(options.rimColor);
  const emissive = new THREE.Color(options.emissiveColor ?? 0x000000);

  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: base },
      uShadowTint: { value: shadow },
      uRimColor: { value: rim },
      uEmissiveColor: { value: emissive },
      uEmissiveIntensity: { value: options.emissiveIntensity ?? 0.0 },
      uSpecularStrength: { value: options.specularStrength ?? 0.22 },
      uCelSteps: { value: options.celSteps ?? 3.0 },
      uRimPower: { value: options.rimPower ?? 3.2 },
      uRimIntensity: { value: options.rimIntensity ?? 0.78 },
      uLightDir: { value: new THREE.Vector3(0.55, 0.85, 0.45).normalize() },
      uHitFlash: { value: 0.0 },
      uAuraLevel: { value: 0.0 },
      uTime: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vViewNormal;
      varying vec3 vViewPos;
      varying vec3 vWorldNormal;

      void main() {
        vViewNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBaseColor;
      uniform vec3 uShadowTint;
      uniform vec3 uRimColor;
      uniform vec3 uEmissiveColor;
      uniform float uEmissiveIntensity;
      uniform float uSpecularStrength;
      uniform float uCelSteps;
      uniform float uRimPower;
      uniform float uRimIntensity;
      uniform vec3 uLightDir;
      uniform float uHitFlash;
      uniform float uAuraLevel;
      uniform float uTime;

      varying vec3 vViewNormal;
      varying vec3 vViewPos;
      varying vec3 vWorldNormal;

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 VN = normalize(vViewNormal);
        vec3 V = normalize(vViewPos);
        vec3 L = normalize(uLightDir);

        // Stylized Cel Diffuse Banding (kept below bloom threshold for sharp readability)
        float ndotl = dot(N, L) * 0.5 + 0.5;
        float steps = max(2.0, floor(uCelSteps + 0.5));
        float celBand = floor(ndotl * steps) / (steps - 0.35);
        celBand = clamp(celBand, 0.22, 0.92);

        vec3 shadowMix = mix(uShadowTint * uBaseColor * 1.35, uBaseColor, celBand);

        // Stylized Crisp Specular Band
        vec3 H = normalize(L + normalize(vec3(0.0, 0.35, 1.0)));
        float specRaw = max(dot(N, H), 0.0);
        float specStep = smoothstep(0.92, 0.95, specRaw) * uSpecularStrength;

        // Crisp Outer-Edge Fresnel Rim Lighting (never floods front faces)
        float fresnel = 1.0 - max(dot(VN, V), 0.0);
        float rim = pow(fresnel, max(1.4, uRimPower)) * (uRimIntensity + uAuraLevel * 0.65);

        // Subtle aura pulse on Rage / Super Aura
        float auraPulse = uAuraLevel * (0.1 + 0.06 * sin(uTime * 11.0));

        vec3 finalColor = shadowMix
          + vec3(specStep)
          + uRimColor * rim
          + uEmissiveColor * uEmissiveIntensity
          + uRimColor * auraPulse;

        // Crisp controlled impact hit flash
        finalColor = mix(finalColor, vec3(0.95, 0.98, 1.05), clamp(uHitFlash, 0.0, 1.0));

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
}

export function createOutlineMaterial(
  outlineColor: THREE.ColorRepresentation = 0x05070e,
  outlineWidth = 0.028,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOutlineColor: { value: new THREE.Color(outlineColor) },
      uOutlineWidth: { value: outlineWidth },
      uAuraColor: { value: new THREE.Color(0x00e5ff) },
      uAuraLevel: { value: 0.0 },
    },
    side: THREE.BackSide,
    vertexShader: /* glsl */ `
      uniform float uOutlineWidth;
      void main() {
        vec3 extruded = position + normalize(normal) * uOutlineWidth;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(extruded, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uOutlineColor;
      uniform vec3 uAuraColor;
      uniform float uAuraLevel;
      void main() {
        vec3 col = mix(uOutlineColor, uAuraColor * 0.85, clamp(uAuraLevel * 0.5, 0.0, 0.6));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export function createAuraShellMaterial(color: THREE.ColorRepresentation): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;
        float wave = sin(pos.y * 5.0 - uTime * 8.0) * 0.045 + cos(pos.x * 6.0 + uTime * 6.0) * 0.03;
        pos += normal * (0.06 + wave);
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPos);
        float fresnel = pow(1.0 - abs(dot(N, V)), 2.6);
        float streak = 0.5 + 0.45 * sin(vUv.y * 18.0 - uTime * 12.0);
        float alpha = fresnel * streak * uOpacity * 0.55;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor * 0.95, alpha);
      }
    `,
  });
}

export const CyberPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uChromaticAmount: { value: 0.0014 },
    uSaturation: { value: 1.18 },
    uContrast: { value: 1.06 },
    uVignette: { value: 0.18 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uChromaticAmount;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uVignette;
    varying vec2 vUv;

    void main() {
      vec2 dir = vUv - 0.5;
      float dist = length(dir);
      vec2 offset = dir * uChromaticAmount * (0.65 + dist * 1.4);

      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      vec3 col = vec3(r, g, b);

      // Vibrant Color Grading in sRGB space (after OutputPass)
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);
      col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);

      // Subtle Arena Framing Vignette
      float vig = smoothstep(0.95, 0.35, dist);
      col *= mix(1.0 - uVignette, 1.0, vig);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
