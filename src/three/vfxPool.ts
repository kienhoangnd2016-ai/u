import * as THREE from 'three';
import { SkillType, TeamId } from '../types/arena';

const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _color = new THREE.Color();

function createCrackDecalTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, size * 0.46);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineCap = 'round';
  const branches = 9;
  for (let b = 0; b < branches; b++) {
    const baseAngle = (b / branches) * Math.PI * 2 + (b % 2) * 0.15;
    ctx.lineWidth = b % 2 === 0 ? 4 : 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    let r = 0;
    let a = baseAngle;
    for (let seg = 0; seg < 4; seg++) {
      r += 24 + (seg % 2) * 8;
      a += (seg % 2 === 0 ? 1 : -1) * 0.22;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface ShockwaveItem {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
  duration: number;
  maxScale: number;
}

interface SlashItem {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
  duration: number;
  startX: number;
  endX: number;
  tiltZ: number;
}

interface CrackDecalItem {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
  duration: number;
}

interface MeteorItem {
  group: THREE.Group;
  coreMat: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
  duration: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  color: THREE.Color;
  impacted: boolean;
}

interface BeamItem {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
  duration: number;
  baseRadius: number;
}

interface HaloItem {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  age: number;
  duration: number;
  startY: number;
  endY: number;
}

export class VfxPoolEngine {
  readonly poolCapacity = 280;
  private particleMesh: THREE.InstancedMesh;
  private pActive = new Uint8Array(this.poolCapacity);
  private pPos = new Float32Array(this.poolCapacity * 3);
  private pVel = new Float32Array(this.poolCapacity * 3);
  private pAge = new Float32Array(this.poolCapacity);
  private pLife = new Float32Array(this.poolCapacity);
  private pSize = new Float32Array(this.poolCapacity);
  private pColor = new Float32Array(this.poolCapacity * 3);
  private pCursor = 0;

  private shockwaves: ShockwaveItem[] = [];
  private slashes: SlashItem[] = [];
  private cracks: CrackDecalItem[] = [];
  private meteors: MeteorItem[] = [];
  private beams: BeamItem[] = [];
  private halos: HaloItem[] = [];
  private crackTexture: THREE.CanvasTexture;

  public activeParticleCount = 0;
  public hitStopTimer = 0;
  public cameraShakeStrength = 0;
  public chromaticSpike = 0;

  private geometriesToDispose: THREE.BufferGeometry[] = [];
  private materialsToDispose: THREE.Material[] = [];

  constructor(scene: THREE.Scene) {
    // 1. Pooled Particle Shards
    const pGeo = new THREE.OctahedronGeometry(0.11, 0);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.geometriesToDispose.push(pGeo);
    this.materialsToDispose.push(pMat);

    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.poolCapacity);
    this.particleMesh.frustumCulled = false;
    for (let i = 0; i < this.poolCapacity; i++) {
      _scale.set(0, 0, 0);
      _mat4.compose(_pos.set(0, -50, 0), _quat.identity(), _scale);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, _color.setHex(0x00e5ff));
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.particleMesh);

    // 2. Pooled Shockwave Rings
    const ringGeo = new THREE.RingGeometry(0.55, 0.85, 36);
    this.geometriesToDispose.push(ringGeo);
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      scene.add(mesh);
      this.materialsToDispose.push(mat);
      this.shockwaves.push({ mesh, mat, active: false, age: 0, duration: 0.5, maxScale: 4 });
    }

    // 3. Pooled Energy Slash Waves
    const slashGeo = new THREE.TorusGeometry(0.85, 0.08, 6, 20, Math.PI * 0.85);
    this.geometriesToDispose.push(slashGeo);
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff2e93,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(slashGeo, mat);
      mesh.visible = false;
      scene.add(mesh);
      this.materialsToDispose.push(mat);
      this.slashes.push({
        mesh,
        mat,
        active: false,
        age: 0,
        duration: 0.35,
        startX: 0,
        endX: 0,
        tiltZ: 0.15,
      });
    }

    // 4. Pooled Ground Crack Decals
    this.crackTexture = createCrackDecalTexture();
    const crackGeo = new THREE.PlaneGeometry(2.6, 2.6);
    this.geometriesToDispose.push(crackGeo);
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: this.crackTexture,
        color: 0x00e5ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const mesh = new THREE.Mesh(crackGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.03;
      mesh.visible = false;
      scene.add(mesh);
      this.materialsToDispose.push(mat);
      this.cracks.push({ mesh, mat, active: false, age: 0, duration: 2.2 });
    }

    // 5. Pooled Elemental Meteors
    const meteorGeo = new THREE.DodecahedronGeometry(0.36, 0);
    const tailGeo = new THREE.ConeGeometry(0.28, 1.4, 8);
    this.geometriesToDispose.push(meteorGeo, tailGeo);
    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xff6b00 });
      const core = new THREE.Mesh(meteorGeo, coreMat);
      const tail = new THREE.Mesh(tailGeo, coreMat);
      tail.position.y = 0.85;
      group.add(core, tail);
      group.visible = false;
      scene.add(group);
      this.materialsToDispose.push(coreMat);
      this.meteors.push({
        group,
        coreMat,
        active: false,
        age: 0,
        duration: 0.45,
        startPos: new THREE.Vector3(),
        targetPos: new THREE.Vector3(),
        color: new THREE.Color(0xff6b00),
        impacted: false,
      });
    }

    // 6. Pooled Vertical Orbital / Thunder Beam Pillars
    const beamGeo = new THREE.CylinderGeometry(0.55, 0.72, 12, 18, 1, true);
    this.geometriesToDispose.push(beamGeo);
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(beamGeo, mat);
      mesh.visible = false;
      scene.add(mesh);
      this.materialsToDispose.push(mat);
      this.beams.push({ mesh, mat, active: false, age: 0, duration: 0.5, baseRadius: 1 });
    }

    // 7. Pooled Rising Aegis / Heal Halos
    const haloGeo = new THREE.TorusGeometry(0.72, 0.045, 8, 28);
    this.geometriesToDispose.push(haloGeo);
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(haloGeo, mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.visible = false;
      scene.add(mesh);
      this.materialsToDispose.push(mat);
      this.halos.push({ mesh, mat, active: false, age: 0, duration: 0.55, startY: 0.2, endY: 2.3 });
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    life: number,
    size: number,
    color: THREE.Color,
  ) {
    const idx = this.pCursor;
    this.pCursor = (this.pCursor + 1) % this.poolCapacity;
    this.pActive[idx] = 1;
    const i3 = idx * 3;
    this.pPos[i3] = x;
    this.pPos[i3 + 1] = y;
    this.pPos[i3 + 2] = z;
    this.pVel[i3] = vx;
    this.pVel[i3 + 1] = vy;
    this.pVel[i3 + 2] = vz;
    this.pAge[idx] = 0;
    this.pLife[idx] = life;
    this.pSize[idx] = size;
    this.pColor[i3] = color.r;
    this.pColor[i3 + 1] = color.g;
    this.pColor[i3 + 2] = color.b;
  }

  private spawnShockwave(x: number, y: number, z: number, colorHex: number, maxScale: number, duration = 0.55) {
    const item = this.shockwaves.find((s) => !s.active) ?? this.shockwaves[0];
    item.active = true;
    item.age = 0;
    item.duration = duration;
    item.maxScale = maxScale;
    item.mesh.position.set(x, y, z);
    item.mesh.scale.setScalar(0.35);
    item.mesh.visible = true;
    item.mat.color.setHex(colorHex);
    item.mat.opacity = 0.9;
  }

  private spawnSlashWave(startX: number, endX: number, colorHex: number, tiltZ = Math.PI * 0.15) {
    const item = this.slashes.find((s) => !s.active) ?? this.slashes[0];
    item.active = true;
    item.age = 0;
    item.duration = 0.32;
    item.startX = startX;
    item.endX = endX;
    item.tiltZ = tiltZ;
    item.mesh.position.set(startX, 1.35, 0);
    item.mesh.rotation.set(0, startX < endX ? -Math.PI * 0.5 : Math.PI * 0.5, tiltZ);
    item.mesh.scale.setScalar(1.0);
    item.mesh.visible = true;
    item.mat.color.setHex(colorHex);
    item.mat.opacity = 0.95;
  }

  private spawnGroundCrack(x: number, z: number, colorHex: number, scale = 1.0) {
    const item = this.cracks.find((c) => !c.active) ?? this.cracks[0];
    item.active = true;
    item.age = 0;
    item.duration = 2.4;
    item.mesh.position.set(x, 0.03, z);
    item.mesh.rotation.z = Math.random() * Math.PI * 2;
    item.mesh.scale.setScalar(scale);
    item.mesh.visible = true;
    item.mat.color.setHex(colorHex);
    item.mat.opacity = 0.9;
  }

  private spawnMeteor(targetX: number, targetZ: number, colorHex: number) {
    const item = this.meteors.find((m) => !m.active) ?? this.meteors[0];
    item.active = true;
    item.age = 0;
    item.duration = 0.36 + Math.random() * 0.18;
    item.impacted = false;
    item.color.setHex(colorHex);
    item.coreMat.color.setHex(colorHex).multiplyScalar(1.1);
    item.startPos.set(
      targetX + (Math.random() - 0.5) * 2.2,
      8.2 + Math.random() * 2.2,
      targetZ + (Math.random() - 0.5) * 1.2,
    );
    item.targetPos.set(targetX, 0.2, targetZ);
    item.group.position.copy(item.startPos);
    item.group.lookAt(item.targetPos);
    item.group.rotateX(Math.PI / 2);
    item.group.visible = true;
  }

  private spawnBeam(x: number, colorHex: number, widthScale = 1.0, duration = 0.55) {
    const item = this.beams.find((b) => !b.active) ?? this.beams[0];
    item.active = true;
    item.age = 0;
    item.duration = duration;
    item.baseRadius = widthScale;
    item.mesh.position.set(x, 6.0, 0);
    item.mesh.scale.set(widthScale, 1, widthScale);
    item.mesh.visible = true;
    item.mat.color.setHex(colorHex);
    item.mat.opacity = 0.85;
  }

  private spawnHalo(x: number, colorHex: number, delayScale = 1.0) {
    const item = this.halos.find((h) => !h.active) ?? this.halos[0];
    item.active = true;
    item.age = 0;
    item.duration = 0.55 * delayScale;
    item.startY = 0.15;
    item.endY = 2.45;
    item.mesh.position.set(x, 0.15, 0);
    item.mesh.scale.setScalar(0.95);
    item.mesh.visible = true;
    item.mat.color.setHex(colorHex);
    item.mat.opacity = 0.9;
  }

  public triggerSkillEffect(
    attacker: TeamId,
    skill: SkillType,
    targetX: number,
    attackerX: number,
  ) {
    const primaryHex = attacker === 'boy' ? 0x00e5ff : 0xff2e93;
    const secondaryHex = attacker === 'boy' ? 0x38bdf8 : 0xfb7185;
    _color.setHex(primaryHex);

    switch (skill) {
      case 'jab': {
        for (let i = 0; i < 24; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.4 + Math.random() * 3.5;
          this.spawnParticle(
            targetX + (Math.random() - 0.5) * 0.25,
            1.3 + (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.35,
            Math.cos(angle) * speed,
            1.0 + Math.random() * 3.0,
            Math.sin(angle) * speed,
            0.38 + Math.random() * 0.2,
            0.85 + Math.random() * 0.6,
            _color,
          );
        }
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 0.045);
        this.chromaticSpike = Math.max(this.chromaticSpike, 0.0018);
        break;
      }

      case 'buff': {
        // Rising Aegis Heal & ATK Buff rings around the caster
        this.spawnHalo(attackerX, 0x34d399, 1.0);
        this.spawnHalo(attackerX, primaryHex, 1.25);
        this.spawnShockwave(attackerX, 0.08, 0, 0x34d399, 2.1, 0.48);
        _color.setHex(0x34d399);
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2;
          this.spawnParticle(
            attackerX + Math.cos(a) * 0.65,
            0.35,
            Math.sin(a) * 0.65,
            Math.cos(a) * 0.5,
            3.2 + Math.random() * 2.5,
            Math.sin(a) * 0.5,
            0.55 + Math.random() * 0.25,
            0.85,
            _color,
          );
        }
        break;
      }

      case 'slash_wave': {
        // Dual intersecting crescent energy slashes
        this.spawnSlashWave(attackerX, targetX, primaryHex, Math.PI * 0.18);
        this.spawnSlashWave(attackerX, targetX, secondaryHex, -Math.PI * 0.18);
        this.spawnShockwave(targetX, 0.1, 0, primaryHex, 3.0, 0.45);
        for (let i = 0; i < 48; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3.0 + Math.random() * 5.2;
          this.spawnParticle(
            targetX,
            1.25,
            0,
            Math.cos(angle) * speed,
            1.2 + Math.random() * 4.4,
            Math.sin(angle) * speed,
            0.48 + Math.random() * 0.28,
            1.0 + Math.random() * 0.75,
            _color,
          );
        }
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 0.14);
        this.chromaticSpike = Math.max(this.chromaticSpike, 0.0055);
        break;
      }

      case 'dash_slam': {
        // Thunder Dash Slam: vertical lightning bolt + ground fracture decal + shockwave
        this.spawnBeam(targetX, primaryHex, 0.42, 0.36);
        this.spawnShockwave(targetX, 0.08, 0, primaryHex, 3.8, 0.52);
        this.spawnGroundCrack(targetX, 0, secondaryHex, 1.15);
        for (let i = 0; i < 58; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3.5 + Math.random() * 6.0;
          this.spawnParticle(
            targetX,
            0.4,
            0,
            Math.cos(angle) * speed,
            2.5 + Math.random() * 5.2,
            Math.sin(angle) * speed,
            0.52 + Math.random() * 0.3,
            1.05 + Math.random() * 0.85,
            _color,
          );
        }
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 0.19);
        this.chromaticSpike = Math.max(this.chromaticSpike, 0.0075);
        break;
      }

      case 'meteor_fury': {
        // 4 Elemental Meteors + Hit-Stop
        this.spawnShockwave(targetX, 0.1, 0, primaryHex, 4.8, 0.68);
        this.spawnGroundCrack(targetX, 0, primaryHex, 1.45);
        for (let m = 0; m < 4; m++) {
          this.spawnMeteor(
            targetX + (Math.random() - 0.5) * 1.35,
            (Math.random() - 0.5) * 1.1,
            m % 2 === 0 ? primaryHex : 0xf59e0b,
          );
        }
        for (let i = 0; i < 85; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3.8 + Math.random() * 7.5;
          const c = i % 3 === 0 ? _color.setHex(0xfbbf24) : _color.setHex(primaryHex);
          this.spawnParticle(
            targetX,
            1.0,
            0,
            Math.cos(angle) * speed,
            2.2 + Math.random() * 6.5,
            Math.sin(angle) * speed,
            0.65 + Math.random() * 0.4,
            1.2 + Math.random() * 1.0,
            c,
          );
        }
        this.hitStopTimer = 0.28;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 0.28);
        this.chromaticSpike = Math.max(this.chromaticSpike, 0.011);
        break;
      }

      case 'orbital_beam': {
        // Giant Orbital Judgment Beam + Dual Shockwaves + Healing Halo + Max Hit-Stop
        this.spawnBeam(targetX, primaryHex, 1.25, 0.72);
        this.spawnBeam(targetX, 0xfbbf24, 0.55, 0.62);
        this.spawnHalo(attackerX, primaryHex, 1.15);
        this.spawnShockwave(targetX, 0.1, 0, primaryHex, 5.8, 0.75);
        this.spawnShockwave(targetX, 0.25, 0, 0xfbbf24, 4.2, 0.55);
        this.spawnGroundCrack(targetX, 0, 0xfbbf24, 1.65);

        for (let i = 0; i < 110; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 4.2 + Math.random() * 8.2;
          const c = i % 2 === 0 ? _color.setHex(0xfbbf24) : _color.setHex(primaryHex);
          this.spawnParticle(
            targetX,
            0.8,
            0,
            Math.cos(angle) * speed,
            2.8 + Math.random() * 7.5,
            Math.sin(angle) * speed,
            0.7 + Math.random() * 0.45,
            1.3 + Math.random() * 1.0,
            c,
          );
        }
        this.hitStopTimer = 0.36;
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 0.34);
        this.chromaticSpike = Math.max(this.chromaticSpike, 0.014);
        break;
      }
    }
  }

  public update(rawDt: number, simDt: number) {
    if (this.hitStopTimer > 0) this.hitStopTimer = Math.max(0, this.hitStopTimer - rawDt);
    this.cameraShakeStrength = THREE.MathUtils.damp(this.cameraShakeStrength, 0, 12, rawDt);
    this.chromaticSpike = THREE.MathUtils.damp(this.chromaticSpike, 0, 10, rawDt);

    let activeCount = 0;
    for (let i = 0; i < this.poolCapacity; i++) {
      if (this.pActive[i] === 0) continue;

      this.pAge[i] += simDt;
      const life = this.pLife[i];
      if (this.pAge[i] >= life) {
        this.pActive[i] = 0;
        _scale.set(0, 0, 0);
        _mat4.compose(_pos.set(0, -50, 0), _quat.identity(), _scale);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }

      activeCount++;
      const i3 = i * 3;
      this.pVel[i3 + 1] -= 11.5 * simDt;
      this.pPos[i3] += this.pVel[i3] * simDt;
      this.pPos[i3 + 1] = Math.max(0.05, this.pPos[i3 + 1] + this.pVel[i3 + 1] * simDt);
      this.pPos[i3 + 2] += this.pVel[i3 + 2] * simDt;

      const t = 1.0 - this.pAge[i] / life;
      const s = this.pSize[i] * t;
      _pos.set(this.pPos[i3], this.pPos[i3 + 1], this.pPos[i3 + 2]);
      _quat.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, this.pAge[i] * 8.0);
      _scale.set(s, s * 1.4, s);
      _mat4.compose(_pos, _quat, _scale);
      this.particleMesh.setMatrixAt(i, _mat4);

      const gain = 0.78 + t * 0.35;
      _color.setRGB(this.pColor[i3] * gain, this.pColor[i3 + 1] * gain, this.pColor[i3 + 2] * gain);
      this.particleMesh.setColorAt(i, _color);
    }
    this.activeParticleCount = activeCount;
    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;

    for (const s of this.shockwaves) {
      if (!s.active) continue;
      s.age += simDt;
      const p = s.age / s.duration;
      if (p >= 1) {
        s.active = false;
        s.mesh.visible = false;
      } else {
        const ease = 1 - Math.pow(1 - p, 3);
        s.mesh.scale.setScalar(0.35 + ease * s.maxScale);
        s.mat.opacity = (1 - p) * 0.9;
      }
    }

    for (const sl of this.slashes) {
      if (!sl.active) continue;
      sl.age += simDt;
      const p = sl.age / sl.duration;
      if (p >= 1) {
        sl.active = false;
        sl.mesh.visible = false;
      } else {
        sl.mesh.position.x = THREE.MathUtils.lerp(sl.startX, sl.endX, p);
        sl.mesh.scale.setScalar(1.0 + p * 0.9);
        sl.mat.opacity = 1 - p;
      }
    }

    for (const c of this.cracks) {
      if (!c.active) continue;
      c.age += simDt;
      const p = c.age / c.duration;
      if (p >= 1) {
        c.active = false;
        c.mesh.visible = false;
      } else {
        c.mat.opacity = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
      }
    }

    for (const m of this.meteors) {
      if (!m.active) continue;
      m.age += simDt;
      const p = Math.min(1, m.age / m.duration);
      m.group.position.lerpVectors(m.startPos, m.targetPos, p);

      if (p >= 1 && !m.impacted) {
        m.impacted = true;
        m.active = false;
        m.group.visible = false;
        this.spawnShockwave(m.targetPos.x, 0.12, m.targetPos.z, m.color.getHex(), 2.8, 0.45);
        this.spawnGroundCrack(m.targetPos.x, m.targetPos.z, m.color.getHex(), 0.85);
        this.cameraShakeStrength = Math.max(this.cameraShakeStrength, 0.22);
      }
    }

    for (const b of this.beams) {
      if (!b.active) continue;
      b.age += simDt;
      const p = b.age / b.duration;
      if (p >= 1) {
        b.active = false;
        b.mesh.visible = false;
      } else {
        const pulseWidth = b.baseRadius * (1.25 - p * 0.75);
        b.mesh.scale.set(pulseWidth, 1, pulseWidth);
        b.mat.opacity = (1 - p) * 0.85;
      }
    }

    for (const h of this.halos) {
      if (!h.active) continue;
      h.age += simDt;
      const p = h.age / h.duration;
      if (p >= 1) {
        h.active = false;
        h.mesh.visible = false;
      } else {
        h.mesh.position.y = THREE.MathUtils.lerp(h.startY, h.endY, p);
        h.mesh.scale.setScalar(0.85 + Math.sin(p * Math.PI) * 0.35);
        h.mat.opacity = (1 - p) * 0.9;
      }
    }
  }

  public dispose() {
    this.crackTexture.dispose();
    this.geometriesToDispose.forEach((g) => g.dispose());
    this.materialsToDispose.forEach((m) => m.dispose());
  }
}
