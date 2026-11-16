import * as THREE from 'three';
import { ShaderConfig, SkillType, TeamId } from '../types/arena';
import {
  createAuraShellMaterial,
  createCelRimMaterial,
  createOutlineMaterial,
} from './celShader';

export interface FighterRig {
  team: TeamId;
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  rightArmPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  weaponPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  auraShell: THREE.Mesh;
  auraMaterial: THREE.ShaderMaterial;
  celMaterials: THREE.ShaderMaterial[];
  outlineMaterials: THREE.ShaderMaterial[];
  baseX: number;
  facingDir: number;
  hitFlashTimer: number;
  attackTimer: number;
  attackDuration: number;
  activeSkill: SkillType;
  recoilTimer: number;
  auraLevel: number;
}

function addOutlinedMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.ShaderMaterial,
  outlineMaterial: THREE.ShaderMaterial,
  position?: [number, number, number],
  rotation?: [number, number, number],
  castShadow = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;

  const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
  outlineMesh.castShadow = false;
  outlineMesh.receiveShadow = false;
  mesh.add(outlineMesh);

  parent.add(mesh);
  return mesh;
}

export function createFighterRig(team: TeamId): FighterRig {
  const isBoy = team === 'boy';
  const primaryHex = isBoy ? 0x0ea5e9 : 0xec4899;
  const armorDarkHex = isBoy ? 0x162238 : 0x261430;
  const accentHex = isBoy ? 0x00e5ff : 0xff2e93;
  const visorHex = isBoy ? 0x38f8ff : 0xff66b5;

  const celMaterials: THREE.ShaderMaterial[] = [];
  const outlineMaterials: THREE.ShaderMaterial[] = [];

  const outlineMat = createOutlineMaterial(0x04060d, 0.028);
  outlineMat.uniforms.uAuraColor.value.setHex(accentHex);
  outlineMaterials.push(outlineMat);

  const armorMat = createCelRimMaterial({
    baseColor: armorDarkHex,
    shadowTint: 0x0d0b1a,
    rimColor: accentHex,
    specularStrength: 0.25,
  });
  const suitMat = createCelRimMaterial({
    baseColor: primaryHex,
    shadowTint: isBoy ? 0x16143c : 0x2c0e32,
    rimColor: accentHex,
    specularStrength: 0.2,
  });
  const neonEmissiveMat = createCelRimMaterial({
    baseColor: visorHex,
    shadowTint: accentHex,
    rimColor: 0xffffff,
    emissiveColor: accentHex,
    emissiveIntensity: 0.55,
    specularStrength: 0.3,
  });
  const skinMat = createCelRimMaterial({
    baseColor: isBoy ? 0xe5b89e : 0xf2c9b2,
    shadowTint: 0x4b2a40,
    rimColor: accentHex,
    specularStrength: 0.08,
  });

  celMaterials.push(armorMat, suitMat, neonEmissiveMat, skinMat);

  const root = new THREE.Group();
  const baseX = isBoy ? -1.22 : 1.22;
  const facingDir = isBoy ? 1 : -1;
  root.position.set(baseX, 0, 0);
  root.rotation.y = isBoy ? Math.PI * 0.46 : -Math.PI * 0.46;

  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 1.05, 0);
  root.add(bodyGroup);

  // 1. Torso & Armored Chest Core
  const torsoGeo = isBoy
    ? new THREE.CylinderGeometry(0.36, 0.25, 0.78, 8)
    : new THREE.CylinderGeometry(0.3, 0.21, 0.74, 8);
  addOutlinedMesh(bodyGroup, torsoGeo, armorMat, outlineMat, [0, 0.38, 0]);

  const reactorGeo = new THREE.OctahedronGeometry(0.12, 0);
  addOutlinedMesh(bodyGroup, reactorGeo, neonEmissiveMat, outlineMat, [0, 0.46, 0.26], [0, 0, Math.PI / 4]);

  const collarGeo = new THREE.TorusGeometry(0.24, 0.055, 6, 12, Math.PI * 1.35);
  addOutlinedMesh(bodyGroup, collarGeo, suitMat, outlineMat, [0, 0.74, -0.02], [Math.PI / 2, 0, Math.PI * 0.82]);

  // 2. Head & Cyber Visor Helmet
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.98, 0);
  bodyGroup.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.22, 12, 10);
  addOutlinedMesh(headGroup, headGeo, skinMat, outlineMat, [0, 0, 0]);

  const helmCapGeo = new THREE.CylinderGeometry(0.23, 0.24, 0.2, 8);
  addOutlinedMesh(headGroup, helmCapGeo, armorMat, outlineMat, [0, 0.09, -0.02]);

  const visorGeo = new THREE.BoxGeometry(0.34, 0.085, 0.14);
  addOutlinedMesh(headGroup, visorGeo, neonEmissiveMat, outlineMat, [0, 0.02, 0.17]);

  if (isBoy) {
    const hornGeo = new THREE.ConeGeometry(0.055, 0.24, 5);
    addOutlinedMesh(headGroup, hornGeo, suitMat, outlineMat, [-0.18, 0.2, -0.02], [0, 0, 0.35]);
    addOutlinedMesh(headGroup, hornGeo, suitMat, outlineMat, [0.18, 0.2, -0.02], [0, 0, -0.35]);
  } else {
    const earGeo = new THREE.ConeGeometry(0.065, 0.2, 4);
    addOutlinedMesh(headGroup, earGeo, neonEmissiveMat, outlineMat, [-0.15, 0.22, 0.02], [0.15, 0, 0.28]);
    addOutlinedMesh(headGroup, earGeo, neonEmissiveMat, outlineMat, [0.15, 0.22, 0.02], [0.15, 0, -0.28]);
    const tailGeo = new THREE.ConeGeometry(0.06, 0.55, 6);
    addOutlinedMesh(headGroup, tailGeo, suitMat, outlineMat, [-0.18, -0.08, -0.22], [-0.55, 0, 0.22]);
    addOutlinedMesh(headGroup, tailGeo, suitMat, outlineMat, [0.18, -0.08, -0.22], [-0.55, 0, -0.22]);
  }

  // 3. Back Jet Thrusters / Cyber Wings
  const wingGeo = new THREE.BoxGeometry(0.14, 0.54, 0.06);
  addOutlinedMesh(bodyGroup, wingGeo, suitMat, outlineMat, [-0.24, 0.55, -0.26], [0.22, -0.28, 0.38]);
  addOutlinedMesh(bodyGroup, wingGeo, suitMat, outlineMat, [0.24, 0.55, -0.26], [0.22, 0.28, -0.38]);

  const thrusterGlowGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.18, 6);
  addOutlinedMesh(bodyGroup, thrusterGlowGeo, neonEmissiveMat, outlineMat, [-0.14, 0.36, -0.28], [0.35, 0, 0]);
  addOutlinedMesh(bodyGroup, thrusterGlowGeo, neonEmissiveMat, outlineMat, [0.14, 0.36, -0.28], [0.35, 0, 0]);

  // 4. Articulated Arms + Shoulder Pauldrons + Weapon
  const pauldronGeo = new THREE.BoxGeometry(0.24, 0.16, 0.26);
  const armGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.52, 8);
  const gauntletGeo = new THREE.BoxGeometry(0.15, 0.24, 0.17);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.42, 0.68, 0);
  bodyGroup.add(rightArmPivot);
  addOutlinedMesh(rightArmPivot, pauldronGeo, suitMat, outlineMat, [0.04, 0.04, 0], [0, 0, -0.25]);
  addOutlinedMesh(rightArmPivot, armGeo, armorMat, outlineMat, [0.04, -0.22, 0.06], [-0.35, 0, 0]);
  addOutlinedMesh(rightArmPivot, gauntletGeo, suitMat, outlineMat, [0.04, -0.44, 0.16], [-0.35, 0, 0]);

  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0.04, -0.46, 0.26);
  rightArmPivot.add(weaponPivot);

  if (isBoy) {
    const hiltGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.28, 6);
    const bladeGeo = new THREE.BoxGeometry(0.05, 1.18, 0.15);
    addOutlinedMesh(weaponPivot, hiltGeo, armorMat, outlineMat, [0, 0, 0], [Math.PI * 0.42, 0, 0]);
    addOutlinedMesh(weaponPivot, bladeGeo, neonEmissiveMat, outlineMat, [0, 0.22, 0.62], [Math.PI * 0.42, 0, 0]);
  } else {
    const shaftGeo = new THREE.CylinderGeometry(0.028, 0.028, 1.35, 6);
    const tipGeo = new THREE.ConeGeometry(0.095, 0.42, 4);
    addOutlinedMesh(weaponPivot, shaftGeo, armorMat, outlineMat, [0, 0.08, 0.22], [Math.PI * 0.36, 0, 0]);
    addOutlinedMesh(weaponPivot, tipGeo, neonEmissiveMat, outlineMat, [0, 0.36, 0.78], [Math.PI * 0.36, 0, 0]);
  }

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.42, 0.68, 0);
  bodyGroup.add(leftArmPivot);
  addOutlinedMesh(leftArmPivot, pauldronGeo, suitMat, outlineMat, [-0.04, 0.04, 0], [0, 0, 0.25]);
  addOutlinedMesh(leftArmPivot, armGeo, armorMat, outlineMat, [-0.04, -0.22, 0.08], [-0.45, 0, 0]);
  addOutlinedMesh(leftArmPivot, gauntletGeo, suitMat, outlineMat, [-0.04, -0.44, 0.2], [-0.45, 0, 0]);

  // 5. Articulated Legs & Cyber Greaves
  const legGeo = new THREE.CylinderGeometry(0.11, 0.085, 0.55, 8);
  const bootGeo = new THREE.BoxGeometry(0.19, 0.46, 0.28);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.17, 0.02, 0);
  bodyGroup.add(leftLegPivot);
  addOutlinedMesh(leftLegPivot, legGeo, armorMat, outlineMat, [0, -0.28, 0]);
  addOutlinedMesh(leftLegPivot, bootGeo, suitMat, outlineMat, [0, -0.82, 0.04]);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.17, 0.02, 0);
  bodyGroup.add(rightLegPivot);
  addOutlinedMesh(rightLegPivot, legGeo, armorMat, outlineMat, [0, -0.28, 0]);
  addOutlinedMesh(rightLegPivot, bootGeo, suitMat, outlineMat, [0, -0.82, 0.04]);

  // 6. Super Aura Shell
  const auraGeo = new THREE.CapsuleGeometry(0.75, 1.25, 8, 16);
  const auraMaterial = createAuraShellMaterial(accentHex);
  const auraShell = new THREE.Mesh(auraGeo, auraMaterial);
  auraShell.position.set(0, 0.22, 0);
  auraShell.visible = false;
  bodyGroup.add(auraShell);

  return {
    team,
    root,
    bodyGroup,
    headGroup,
    rightArmPivot,
    leftArmPivot,
    weaponPivot,
    leftLegPivot,
    rightLegPivot,
    auraShell,
    auraMaterial,
    celMaterials,
    outlineMaterials,
    baseX,
    facingDir,
    hitFlashTimer: 0,
    attackTimer: 0,
    attackDuration: 0.36,
    activeSkill: 'jab',
    recoilTimer: 0,
    auraLevel: 0,
  };
}

export function triggerFighterSkillAnim(rig: FighterRig, skill: SkillType) {
  rig.activeSkill = skill;
  switch (skill) {
    case 'jab':
      rig.attackDuration = 0.26;
      break;
    case 'buff':
      rig.attackDuration = 0.45;
      break;
    case 'slash_wave':
      rig.attackDuration = 0.4;
      break;
    case 'dash_slam':
      rig.attackDuration = 0.52;
      break;
    case 'meteor_fury':
      rig.attackDuration = 0.6;
      break;
    case 'orbital_beam':
      rig.attackDuration = 0.68;
      break;
  }
  rig.attackTimer = rig.attackDuration;
}

export function applyShaderConfigToFighter(rig: FighterRig, config: ShaderConfig) {
  for (const mat of rig.celMaterials) {
    mat.uniforms.uCelSteps.value = config.celSteps;
    mat.uniforms.uRimPower.value = config.rimPower;
    mat.uniforms.uRimIntensity.value = config.rimIntensity;
  }
  for (const mat of rig.outlineMaterials) {
    mat.uniforms.uOutlineWidth.value = config.outlineWidth;
  }
}

export function updateFighterAnimation(
  rig: FighterRig,
  dt: number,
  elapsed: number,
  streakCount: number,
) {
  const targetAura = streakCount >= 100 ? 1.0 : streakCount >= 50 ? 0.58 : streakCount >= 10 ? 0.22 : 0.0;
  rig.auraLevel = THREE.MathUtils.damp(rig.auraLevel, targetAura, 6, dt);

  if (rig.hitFlashTimer > 0) rig.hitFlashTimer = Math.max(0, rig.hitFlashTimer - dt);
  if (rig.attackTimer > 0) rig.attackTimer = Math.max(0, rig.attackTimer - dt);
  if (rig.recoilTimer > 0) rig.recoilTimer = Math.max(0, rig.recoilTimer - dt);

  const hitFlashVal = rig.hitFlashTimer > 0 ? 1.0 : 0.0;
  for (const mat of rig.celMaterials) {
    mat.uniforms.uHitFlash.value = hitFlashVal;
    mat.uniforms.uAuraLevel.value = rig.auraLevel;
    mat.uniforms.uTime.value = elapsed;
  }
  for (const mat of rig.outlineMaterials) {
    mat.uniforms.uAuraLevel.value = rig.auraLevel;
  }

  rig.auraShell.visible = rig.auraLevel > 0.05;
  if (rig.auraShell.visible) {
    rig.auraMaterial.uniforms.uTime.value = elapsed;
    rig.auraMaterial.uniforms.uOpacity.value = rig.auraLevel * 0.85;
  }

  const idleBob = Math.sin(elapsed * 3.4 + (rig.team === 'boy' ? 0 : 1.6)) * 0.045;
  const superHover = rig.auraLevel > 0.5 ? Math.sin(elapsed * 5.0) * 0.08 + 0.12 : 0;

  let offsetX = 0;
  let offsetY = 0;
  let spinY = 0;
  let rightArmX = -0.35;
  let rightArmZ = -0.18;
  let leftArmX = -0.55 + Math.sin(elapsed * 3.4) * 0.12;
  let bodyTiltX = 0.04;

  if (rig.attackTimer > 0) {
    const p = 1.0 - rig.attackTimer / Math.max(0.01, rig.attackDuration);
    const bell = Math.sin(p * Math.PI);

    switch (rig.activeSkill) {
      case 'jab': {
        offsetX = rig.facingDir * bell * 0.85;
        leftArmX = -1.45 * bell;
        rightArmX = -0.65;
        bodyTiltX = 0.22 * bell;
        break;
      }
      case 'buff': {
        offsetY = bell * 0.28;
        rightArmX = -1.85 * bell;
        leftArmX = -1.85 * bell;
        spinY = p * Math.PI * 2;
        bodyTiltX = -0.1 * bell;
        break;
      }
      case 'slash_wave': {
        offsetX = rig.facingDir * bell * 0.72;
        rightArmX = -2.2 + p * 3.1;
        rightArmZ = -0.65 * bell;
        bodyTiltX = 0.26 * bell;
        break;
      }
      case 'dash_slam': {
        offsetX = rig.facingDir * Math.sin(Math.min(1, p * 1.15) * Math.PI * 0.5) * 1.45 * (1 - Math.max(0, (p - 0.75) * 4));
        offsetY = Math.sin(p * Math.PI) * 1.35;
        rightArmX = -2.4 * Math.sin(p * Math.PI);
        bodyTiltX = p > 0.5 ? 0.35 : -0.15;
        break;
      }
      case 'meteor_fury': {
        offsetY = bell * 0.85;
        rightArmX = -2.1 + Math.sin(p * Math.PI * 6) * 0.8;
        leftArmX = -2.1 - Math.sin(p * Math.PI * 6) * 0.8;
        bodyTiltX = -0.18 * bell;
        break;
      }
      case 'orbital_beam': {
        offsetY = bell * 1.15;
        rightArmX = -2.85 * bell;
        leftArmX = -2.65 * bell;
        spinY = Math.sin(p * Math.PI) * 0.4;
        bodyTiltX = -0.22 * bell;
        break;
      }
    }
  }

  let recoilX = 0;
  let recoilTilt = 0;
  if (rig.recoilTimer > 0) {
    const rp = rig.recoilTimer / 0.28;
    recoilX = -rig.facingDir * Math.sin(rp * Math.PI) * 0.35;
    recoilTilt = -0.26 * rp;
  }

  rig.root.position.x = THREE.MathUtils.damp(
    rig.root.position.x,
    rig.baseX + offsetX + recoilX,
    18,
    dt,
  );
  rig.root.rotation.y = (rig.team === 'boy' ? Math.PI * 0.46 : -Math.PI * 0.46) + spinY;
  rig.bodyGroup.position.y = 1.05 + idleBob + superHover + offsetY;
  rig.bodyGroup.rotation.x = recoilTilt + bodyTiltX;

  rig.rightArmPivot.rotation.x = rightArmX;
  rig.rightArmPivot.rotation.z = rightArmZ;
  rig.leftArmPivot.rotation.x = leftArmX;
  rig.headGroup.rotation.y = Math.sin(elapsed * 1.8) * 0.06;

  const stride = rig.attackTimer > 0 ? 0.35 : 0.14;
  rig.leftLegPivot.rotation.x = -stride;
  rig.rightLegPivot.rotation.x = stride;
}
