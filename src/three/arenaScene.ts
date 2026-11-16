import * as THREE from 'three';

const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();
const _boyColor = new THREE.Color(0x00e5ff);
const _girlColor = new THREE.Color(0xff2e93);
const _neutralColor = new THREE.Color(0x7c3aed);

function createArenaGridTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark metallic carbon base
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, size, size);

  // Perspective cyber grid lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 2;
  const step = 64;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Concentric arena combat rings
  const cx = size / 2;
  const cy = size / 2;
  const rings = [140, 260, 390, 470];
  rings.forEach((r, idx) => {
    ctx.strokeStyle = idx % 2 === 0 ? 'rgba(56, 189, 248, 0.42)' : 'rgba(236, 72, 153, 0.35)';
    ctx.lineWidth = idx === 3 ? 6 : 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Center VS Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.moveTo(cx, 60);
  ctx.lineTo(cx, size - 60);
  ctx.stroke();
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface ArenaEnvironment {
  group: THREE.Group;
  rimMaterial: THREE.MeshStandardMaterial;
  underGlowMaterial: THREE.MeshBasicMaterial;
  crowdMesh: THREE.InstancedMesh;
  crowdCount: number;
  crowdPhases: Float32Array;
  crowdRadii: Float32Array;
  crowdAngles: Float32Array;
  boyLight: THREE.PointLight;
  girlLight: THREE.PointLight;
  hemiLight: THREE.HemisphereLight;
  keyLight: THREE.DirectionalLight;
  boyShadow: THREE.Mesh;
  girlShadow: THREE.Mesh;
  dominanceLerp: number;
  crowdExcitement: number;
  dispose: () => void;
}

export function createFloatingArena(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean,
): ArenaEnvironment {
  const group = new THREE.Group();
  scene.add(group);

  // Scene atmosphere & fog
  scene.background = new THREE.Color(0x060810);
  scene.fog = new THREE.FogExp2(0x060810, 0.032);

  // 1. Floating Main Battle Platform
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const gridTex = createArenaGridTexture(maxAniso);

  const deckGeo = new THREE.CylinderGeometry(4.6, 4.9, 0.36, 8);
  const deckMat = new THREE.MeshStandardMaterial({
    map: gridTex,
    roughness: 0.62,
    metalness: 0.35,
  });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.y = -0.18;
  deck.receiveShadow = true;
  group.add(deck);

  // Neon Perimeter Trim Ring (changes color with winning team!)
  const rimGeo = new THREE.TorusGeometry(4.78, 0.09, 12, 64);
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.9,
    roughness: 0.3,
    metalness: 0.7,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 0.01;
  group.add(rimMesh);

  // Lower Floating Hull & Under-Thruster Core
  const underHullGeo = new THREE.CylinderGeometry(4.3, 1.8, 1.35, 8);
  const underHullMat = new THREE.MeshStandardMaterial({
    color: 0x0d121f,
    roughness: 0.65,
    metalness: 0.6,
  });
  const underHull = new THREE.Mesh(underHullGeo, underHullMat);
  underHull.position.y = -1.04;
  group.add(underHull);

  const underGlowGeo = new THREE.RingGeometry(1.1, 2.2, 32);
  const underGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
  });
  const underGlow = new THREE.Mesh(underGlowGeo, underGlowMaterial);
  underGlow.rotation.x = Math.PI / 2;
  underGlow.position.y = -1.73;
  group.add(underGlow);

  // Outer Orbital Horizon Rings (adds vertical 9:16 framing depth)
  const outerRingGeo = new THREE.TorusGeometry(7.2, 0.035, 8, 96);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.55,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = -0.35;
  group.add(outerRing);

  // 2. Reactive Crowd Pillars & Lightsticks (InstancedMesh - 120 virtual cheering units)
  const crowdCount = 120;
  const pillarGeo = new THREE.BoxGeometry(0.11, 0.68, 0.11);
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    emissive: 0x0e1726,
    emissiveIntensity: 0.35,
    roughness: 0.45,
    metalness: 0.4,
  });
  const crowdMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, crowdCount);
  crowdMesh.frustumCulled = false;

  const crowdPhases = new Float32Array(crowdCount);
  const crowdRadii = new Float32Array(crowdCount);
  const crowdAngles = new Float32Array(crowdCount);

  for (let i = 0; i < crowdCount; i++) {
    const tier = i % 2;
    const angle = (i / crowdCount) * Math.PI * 2 + tier * 0.05;
    const radius = 5.45 + tier * 0.72 + (i % 3) * 0.18;
    crowdAngles[i] = angle;
    crowdRadii[i] = radius;
    crowdPhases[i] = i * 0.43;

    _pos.set(Math.cos(angle) * radius, 0.1 + tier * 0.25, Math.sin(angle) * radius);
    _quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
    _scale.set(1, 0.7 + (i % 4) * 0.18, 1);
    _mat4.compose(_pos, _quat, _scale);
    crowdMesh.setMatrixAt(i, _mat4);
    crowdMesh.setColorAt(i, i % 2 === 0 ? _boyColor : _girlColor);
  }
  crowdMesh.instanceMatrix.needsUpdate = true;
  if (crowdMesh.instanceColor) crowdMesh.instanceColor.needsUpdate = true;
  crowdMesh.computeBoundingSphere();
  group.add(crowdMesh);

  // 3. Contact Grounding Shadows under Fighters
  const shadowTex = createContactShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const boyShadow = new THREE.Mesh(shadowGeo, shadowMat);
  boyShadow.rotation.x = -Math.PI / 2;
  boyShadow.position.set(-1.22, 0.02, 0);
  group.add(boyShadow);

  const girlShadow = new THREE.Mesh(shadowGeo, shadowMat);
  girlShadow.rotation.x = -Math.PI / 2;
  girlShadow.position.set(1.22, 0.02, 0);
  group.add(girlShadow);

  // 4. Balanced Studio + Dynamic Team-Dominance Lighting Rig
  const keyLight = new THREE.DirectionalLight(0xf8fafc, 1.2);
  keyLight.position.set(4.5, 9.0, 5.5);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 26;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1038, 0.45);
  scene.add(hemiLight);

  const boyLight = new THREE.PointLight(0x00e5ff, 1.3, 9, 1.8);
  boyLight.position.set(-3.2, 2.2, 1.8);
  scene.add(boyLight);

  const girlLight = new THREE.PointLight(0xff2e93, 1.3, 9, 1.8);
  girlLight.position.set(3.2, 2.2, 1.8);
  scene.add(girlLight);

  return {
    group,
    rimMaterial,
    underGlowMaterial,
    crowdMesh,
    crowdCount,
    crowdPhases,
    crowdRadii,
    crowdAngles,
    boyLight,
    girlLight,
    hemiLight,
    keyLight,
    boyShadow,
    girlShadow,
    dominanceLerp: 0,
    crowdExcitement: 0,
    dispose: () => {
      gridTex.dispose();
      shadowTex.dispose();
      deckGeo.dispose();
      deckMat.dispose();
      rimGeo.dispose();
      rimMaterial.dispose();
      underHullGeo.dispose();
      underHullMat.dispose();
      underGlowGeo.dispose();
      underGlowMaterial.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      pillarGeo.dispose();
      pillarMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
    },
  };
}

export function updateArenaEnvironment(
  env: ArenaEnvironment,
  dt: number,
  elapsed: number,
  boyRatio: number,
  girlRatio: number,
  boyX: number,
  girlX: number,
  crowdReactivity: number,
) {
  // Dominance in [-1 (Girl leads) .. +1 (Boy leads)]
  const targetDominance = THREE.MathUtils.clamp((boyRatio - girlRatio) * 2.2, -1, 1);
  env.dominanceLerp = THREE.MathUtils.damp(env.dominanceLerp, targetDominance, 4.5, dt);
  env.crowdExcitement = THREE.MathUtils.damp(env.crowdExcitement, 0, 3.5, dt);

  // Shift Arena Rim & Dynamic Lights between Cyber Blue & Hyper Pink
  if (env.dominanceLerp >= 0) {
    _color.lerpColors(_neutralColor, _boyColor, env.dominanceLerp);
  } else {
    _color.lerpColors(_neutralColor, _girlColor, -env.dominanceLerp);
  }

  env.rimMaterial.color.copy(_color);
  env.rimMaterial.emissive.copy(_color);
  env.underGlowMaterial.color.copy(_color);
  env.hemiLight.color.lerp(_color, 0.08);

  env.boyLight.intensity = 1.1 + Math.max(0, env.dominanceLerp) * 1.1 + env.crowdExcitement * 0.45;
  env.girlLight.intensity = 1.1 + Math.max(0, -env.dominanceLerp) * 1.1 + env.crowdExcitement * 0.45;

  // Ground contact shadows follow fighters
  env.boyShadow.position.x = boyX;
  env.girlShadow.position.x = girlX;

  // Animate Reactive Crowd Lightstick Pillars (Zero-GC)
  const speed = (3.5 + env.crowdExcitement * 9.0) * crowdReactivity;
  const bounceAmp = (0.28 + env.crowdExcitement * 0.72) * crowdReactivity;
  for (let i = 0; i < env.crowdCount; i++) {
    const phase = env.crowdPhases[i];
    const angle = env.crowdAngles[i];
    const radius = env.crowdRadii[i];
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * speed + phase);

    const scaleY = 0.55 + pulse * (0.65 + bounceAmp);
    const y = (i % 2) * 0.22 + scaleY * 0.34 - 0.18;

    _pos.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    _quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, -angle);
    _scale.set(1, scaleY, 1);
    _mat4.compose(_pos, _quat, _scale);
    env.crowdMesh.setMatrixAt(i, _mat4);

    // Crowd color shifts toward winning team with subtle excitement boost
    const teamBias = Math.cos(angle) < 0 ? 0.15 : -0.15;
    const crowdMix = THREE.MathUtils.clamp(0.5 + env.dominanceLerp * 0.42 + teamBias, 0, 1);
    _color.lerpColors(_girlColor, _boyColor, crowdMix);
    _color.multiplyScalar(0.75 + env.crowdExcitement * 0.2);
    env.crowdMesh.setColorAt(i, _color);
  }
  env.crowdMesh.instanceMatrix.needsUpdate = true;
  if (env.crowdMesh.instanceColor) env.crowdMesh.instanceColor.needsUpdate = true;
}
