import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  FloatingCombatText,
  GiftTier,
  ShaderConfig,
  SkillType,
  TeamId,
} from '../types/arena';
import { CyberPostShader } from '../three/celShader';
import {
  applyShaderConfigToFighter,
  createFighterRig,
  FighterRig,
  triggerFighterSkillAnim,
  updateFighterAnimation,
} from '../three/fighters';
import {
  ArenaEnvironment,
  createFloatingArena,
  updateArenaEnvironment,
} from '../three/arenaScene';
import { VfxPoolEngine } from '../three/vfxPool';

export interface ArenaViewportHandle {
  triggerAttackVfx: (
    attacker: TeamId,
    tier: GiftTier,
    skillType: SkillType,
    amount: number,
    subLabel?: string,
    isCrit?: boolean,
    isHeal?: boolean,
  ) => void;
  resetCamera: () => void;
}

interface ArenaViewportProps {
  shaderConfig: ShaderConfig;
  boyHpRatio: number;
  girlHpRatio: number;
  boyStreak: number;
  girlStreak: number;
  portraitMode: boolean;
  onStatsTick: (activeParticles: number, poolSize: number, hitStopMs: number) => void;
}

const _projVec = new THREE.Vector3();

function computeIdealCameraSetup(aspect: number, isPortrait: boolean) {
  const fovRad = THREE.MathUtils.degToRad(45);
  const tanHalfV = Math.tan(fovRad * 0.5);
  const tanHalfH = tanHalfV * Math.max(0.42, aspect);
  const minHalfWorldWidth = isPortrait ? 2.65 : 2.9;
  const distZ = Math.max(6.2, Math.min(13.5, minHalfWorldWidth / tanHalfH));
  const targetY = isPortrait ? 0.72 : 0.95;
  const camY = isPortrait ? 2.7 : 2.55;
  return { distZ, camY, targetY };
}

export const ArenaViewport = React.forwardRef<ArenaViewportHandle, ArenaViewportProps>(
  (
    {
      shaderConfig,
      boyHpRatio,
      girlHpRatio,
      boyStreak,
      girlStreak,
      portraitMode,
      onStatsTick,
    },
    ref,
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState<FloatingCombatText[]>([]);

    const configRef = useRef(shaderConfig);
    configRef.current = shaderConfig;

    const matchStateRef = useRef({ boyHpRatio, girlHpRatio, boyStreak, girlStreak });
    matchStateRef.current = { boyHpRatio, girlHpRatio, boyStreak, girlStreak };

    const portraitRef = useRef(portraitMode);
    portraitRef.current = portraitMode;

    const onStatsTickRef = useRef(onStatsTick);
    onStatsTickRef.current = onStatsTick;

    const desiredCamRef = useRef<{
      active: boolean;
      pos: THREE.Vector3;
      target: THREE.Vector3;
    }>({
      active: false,
      pos: new THREE.Vector3(0, 2.55, 6.4),
      target: new THREE.Vector3(0, 0.95, 0),
    });

    const sceneRefs = useRef<{
      camera: THREE.PerspectiveCamera;
      controls: OrbitControls;
      boyRig: FighterRig;
      girlRig: FighterRig;
      arena: ArenaEnvironment;
      vfx: VfxPoolEngine;
    } | null>(null);

    const textIdCounter = useRef(1);

    useEffect(() => {
      const refs = sceneRefs.current;
      const el = mountRef.current;
      if (!refs || !el) return;
      const w = Math.max(240, el.clientWidth);
      const h = Math.max(240, el.clientHeight);
      const { distZ, camY, targetY } = computeIdealCameraSetup(w / h, portraitMode);
      desiredCamRef.current.pos.set(0, camY, distZ);
      desiredCamRef.current.target.set(0, targetY, 0);
      desiredCamRef.current.active = true;
    }, [portraitMode]);

    useImperativeHandle(ref, () => ({
      triggerAttackVfx: (attacker, tier, skillType, amount, subLabel, isCrit = false, isHeal = false) => {
        const refs = sceneRefs.current;
        if (!refs || !mountRef.current) return;

        const atkRig = attacker === 'boy' ? refs.boyRig : refs.girlRig;
        const defRig = attacker === 'boy' ? refs.girlRig : refs.boyRig;

        triggerFighterSkillAnim(atkRig, skillType);
        if (!isHeal) {
          defRig.hitFlashTimer = tier === 3 ? 0.2 : 0.1;
          defRig.recoilTimer = 0.28;
        }
        refs.arena.crowdExcitement = Math.min(1.6, refs.arena.crowdExcitement + tier * 0.42);

        const targetX = defRig.baseX;
        const attackerX = atkRig.baseX;
        refs.vfx.triggerSkillEffect(attacker, skillType, targetX, attackerX);

        const textWorldX = isHeal ? attackerX : targetX;
        _projVec.set(textWorldX + (Math.random() - 0.5) * 0.25, 2.25 + Math.random() * 0.25, 0);
        _projVec.project(refs.camera);

        const rect = mountRef.current.getBoundingClientRect();
        const screenX = ((_projVec.x + 1) / 2) * rect.width;
        const screenY = ((-_projVec.y + 1) / 2) * rect.height;

        const id = textIdCounter.current++;
        const item: FloatingCombatText = {
          id,
          team: attacker,
          label: isHeal ? `+${amount.toLocaleString()} HP` : `-${amount.toLocaleString()}`,
          subLabel,
          screenX: Math.max(44, Math.min(rect.width - 44, screenX)),
          screenY: Math.max(85, Math.min(rect.height - 110, screenY)),
          tier,
          isCrit,
          isHeal,
        };

        setFloatingTexts((prev) => [...prev.slice(-9), item]);
        window.setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        }, 950);
      },
      resetCamera: () => {
        const refs = sceneRefs.current;
        const el = mountRef.current;
        if (!refs || !el) return;
        const aspect = Math.max(240, el.clientWidth) / Math.max(240, el.clientHeight);
        const { distZ, camY, targetY } = computeIdealCameraSetup(aspect, portraitRef.current);
        desiredCamRef.current.pos.set(0, camY, distZ);
        desiredCamRef.current.target.set(0, targetY, 0);
        desiredCamRef.current.active = true;
      },
    }));

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = (() => {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      })();

      const width = Math.max(240, container.clientWidth);
      const height = Math.max(240, container.clientHeight);
      const aspect = width / height;

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = configRef.current.exposure;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      container.appendChild(renderer.domElement);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const handleContextRestored = () => {
        setContextLost(false);
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      const scene = new THREE.Scene();

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      scene.environmentIntensity = 0.45;
      pmremGenerator.dispose();

      const initialCam = computeIdealCameraSetup(aspect, portraitRef.current);
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
      camera.position.set(0, initialCam.camY, initialCam.distZ);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, initialCam.targetY, 0);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.06;
      controls.minDistance = 4.2;
      controls.maxDistance = 16.0;
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.minPolarAngle = 0.25;
      controls.update();

      const cancelTransition = () => {
        desiredCamRef.current.active = false;
      };
      controls.addEventListener('start', cancelTransition);

      const arena = createFloatingArena(scene, renderer, isSoftwareGl);
      const boyRig = createFighterRig('boy');
      const girlRig = createFighterRig('girl');
      scene.add(boyRig.root);
      scene.add(girlRig.root);

      const vfx = new VfxPoolEngine(scene);
      sceneRefs.current = { camera, controls, boyRig, girlRig, arena, vfx };

      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        configRef.current.bloomStrength,
        configRef.current.bloomRadius,
        configRef.current.bloomThreshold,
      );
      composer.addPass(bloomPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);

      const cyberPass = new ShaderPass(CyberPostShader);
      composer.addPass(cyberPass);

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.max(200, Math.floor(entry.contentRect.width));
          const h = Math.max(200, Math.floor(entry.contentRect.height));
          const nextAspect = w / h;
          camera.aspect = nextAspect;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          composer.setSize(w, h);
          bloomPass.resolution.set(w, h);

          // Adapt camera distance smoothly when aspect ratio changes (e.g., 16:9 <-> 9:16)
          const ideal = computeIdealCameraSetup(nextAspect, portraitRef.current);
          desiredCamRef.current.pos.set(0, ideal.camY, ideal.distZ);
          desiredCamRef.current.target.set(0, ideal.targetY, 0);
          desiredCamRef.current.active = true;
        }
      });
      resizeObserver.observe(container);

      const clock = new THREE.Clock();
      let frameId = 0;
      let disposed = false;
      let statsAccum = 0;
      const baseCamOffset = new THREE.Vector3();

      function afterDraw(cb: () => void) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      }

      function tick() {
        if (disposed) return;
        const rawDt = Math.min(0.05, clock.getDelta());
        const cfg = configRef.current;
        const ms = matchStateRef.current;

        const timeScale = vfx.hitStopTimer > 0 ? 0.08 : 1.0;
        const simDt = rawDt * timeScale;
        const elapsed = clock.elapsedTime;

        renderer.toneMappingExposure = cfg.exposure;
        applyShaderConfigToFighter(boyRig, cfg);
        applyShaderConfigToFighter(girlRig, cfg);

        bloomPass.strength = cfg.bloomStrength;
        bloomPass.radius = cfg.bloomRadius;
        bloomPass.threshold = cfg.bloomThreshold;

        cyberPass.uniforms.uChromaticAmount.value = cfg.chromaticBase + vfx.chromaticSpike;
        cyberPass.uniforms.uSaturation.value = cfg.saturation;
        cyberPass.uniforms.uContrast.value = cfg.contrast;

        updateFighterAnimation(boyRig, simDt, elapsed, ms.boyStreak);
        updateFighterAnimation(girlRig, simDt, elapsed, ms.girlStreak);
        updateArenaEnvironment(
          arena,
          rawDt,
          elapsed,
          ms.boyHpRatio,
          ms.girlHpRatio,
          boyRig.root.position.x,
          girlRig.root.position.x,
          cfg.crowdReactivity,
        );
        vfx.update(rawDt, simDt);

        // Smooth camera framing transition on viewport aspect change
        if (desiredCamRef.current.active) {
          camera.position.x = THREE.MathUtils.damp(
            camera.position.x,
            desiredCamRef.current.pos.x,
            8,
            rawDt,
          );
          camera.position.y = THREE.MathUtils.damp(
            camera.position.y,
            desiredCamRef.current.pos.y,
            8,
            rawDt,
          );
          camera.position.z = THREE.MathUtils.damp(
            camera.position.z,
            desiredCamRef.current.pos.z,
            8,
            rawDt,
          );
          controls.target.x = THREE.MathUtils.damp(
            controls.target.x,
            desiredCamRef.current.target.x,
            8,
            rawDt,
          );
          controls.target.y = THREE.MathUtils.damp(
            controls.target.y,
            desiredCamRef.current.target.y,
            8,
            rawDt,
          );
          controls.target.z = THREE.MathUtils.damp(
            controls.target.z,
            desiredCamRef.current.target.z,
            8,
            rawDt,
          );
          if (
            camera.position.distanceTo(desiredCamRef.current.pos) < 0.03 &&
            controls.target.distanceTo(desiredCamRef.current.target) < 0.03
          ) {
            desiredCamRef.current.active = false;
          }
        }

        controls.update();

        baseCamOffset.copy(camera.position);
        if (vfx.cameraShakeStrength > 0.002) {
          camera.position.x += (Math.random() - 0.5) * vfx.cameraShakeStrength;
          camera.position.y += (Math.random() - 0.5) * vfx.cameraShakeStrength * 0.7;
        }

        if (isSoftwareGl) {
          renderer.render(scene, camera);
        } else {
          composer.render();
        }

        camera.position.copy(baseCamOffset);

        statsAccum += rawDt;
        if (statsAccum >= 0.12) {
          statsAccum = 0;
          onStatsTickRef.current(
            vfx.activeParticleCount,
            vfx.poolCapacity,
            Math.round(vfx.hitStopTimer * 1000),
          );
        }

        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
      }

      tick();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        controls.removeEventListener('start', cancelTransition);
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
        controls.dispose();
        composer.dispose();
        vfx.dispose();
        arena.dispose();
        envTex.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        sceneRefs.current = null;
      };
    }, []);

    return (
      <div className="relative w-full h-full overflow-hidden bg-[#060810]">
        <div ref={mountRef} className="w-full h-full" />

        {/* Spring-Animated Floating Damage & Buff Numbers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              style={{ left: `${ft.screenX}px`, top: `${ft.screenY}px` }}
              className="animate-damage-float absolute flex flex-col items-center select-none"
            >
              <span
                className={`font-display font-bold tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
                  ft.isHeal
                    ? 'text-base sm:text-lg text-emerald-300'
                    : ft.tier === 3
                      ? 'text-2xl sm:text-3xl text-amber-300'
                      : ft.tier === 2
                        ? 'text-xl sm:text-2xl text-white'
                        : ft.team === 'boy'
                          ? 'text-base sm:text-lg text-cyan-300'
                          : 'text-base sm:text-lg text-pink-300'
                }`}
              >
                {ft.label}
              </span>
              {ft.subLabel && (
                <span className="text-[10px] font-semibold tracking-wide text-slate-100 bg-black/75 px-1.5 py-0.5 rounded">
                  {ft.subLabel}
                </span>
              )}
            </div>
          ))}
        </div>

        {contextLost && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#07090E]/95 text-center p-6">
            <p className="font-display text-lg font-semibold text-white">WebGL Context Suspended</p>
            <p className="mt-1 text-sm text-slate-400">
              Restoring GPU pipeline for the 3D arena viewport.
            </p>
          </div>
        )}
      </div>
    );
  },
);

ArenaViewport.displayName = 'ArenaViewport';
