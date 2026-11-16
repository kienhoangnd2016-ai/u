import React, { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import {
  ART_DIRECTOR_PARAMS,
  LIVEBRIDGE_CODE_SNIPPETS,
  VFX_TIER_SPECS,
} from '../data/specsData';
import { SpecSectionId } from '../types/arena';

interface DesignBibleDrawerProps {
  activeSection: Exclude<SpecSectionId, 'arena'>;
  onSelectSection: (section: SpecSectionId) => void;
  onApplyRecommendedPreset: () => void;
}

export const DesignBibleDrawer: React.FC<DesignBibleDrawerProps> = ({
  activeSection,
  onSelectSection,
  onApplyRecommendedPreset,
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (idx: number, code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedIdx(idx);
    window.setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-[#07090E]/96 px-6 py-8">
      <div className="mx-auto max-w-5xl flex flex-col gap-8">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p className="text-xs font-mono-tabular text-cyan-400">
              Boy vs Girl — Live Arena · Production Architecture
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1 text-balance">
              {activeSection === 'art' && '01. Art Direction, Cel-Rim Shader & Unity URP Stack'}
              {activeSection === 'vfx' && '02. 3-Tier Gift VFX & 60 FPS Object Pooling Specification'}
              {activeSection === 'design' && '03. LiveBridge Engagement, Handicap & 9:16 Portrait HUD'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {activeSection === 'art' && (
              <button
                type="button"
                onClick={() => {
                  onApplyRecommendedPreset();
                  onSelectSection('arena');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Apply URP Preset to 3D Stage
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectSection('arena')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Return to 3D Arena</span>
            </button>
          </div>
        </div>

        {/* ART & URP SECTION */}
        {activeSection === 'art' && (
          <div className="flex flex-col gap-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-[#0D1320] border border-slate-800">
                <h2 className="font-display text-base font-semibold text-white">
                  Character Shader & Outline
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Combine a 3-step hard cel diffuse ramp with cool indigo shadow tinting (#16142E) so dark armor retains form. Layer a view-space Fresnel rim (Power 2.6, Intensity 1.45) in Cyber Cyan or Hyper Pink paired with a 0.028m inverted-hull outline.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#0D1320] border border-slate-800">
                <h2 className="font-display text-base font-semibold text-white">
                  Floating Arena & Reactive Crowd
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Octagonal carbon-grid platform with emissive perimeter trim and 120 GPU-instanced crowd lightstick pillars. Lighting, rim color, and FogExp2 smoothly damp between Blue (#00E5FF) and Pink (#FF2E93) based on live HP dominance.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#0D1320] border border-slate-800">
                <h2 className="font-display text-base font-semibold text-white">
                  Unity URP Post-Processing
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Use ACES Filmic tonemapping with HDR Bloom threshold at 0.88 so only emissives glow. Trigger Chromatic Aberration impulses (0.04 base to 0.48 peak) strictly during heavy hits, keeping mobile SSAO at 2x downsample.
                </p>
              </div>
            </section>

            {/* URP Parameter Matrix */}
            <section className="rounded-xl border border-slate-800 overflow-hidden bg-[#0B101B]">
              <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-white">
                  Unity URP & Shader Calibration Parameters
                </h2>
                <span className="text-xs font-mono-tabular text-slate-400">
                  Target: 9:16 Vertical · 60 FPS Mobile/Web
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/70 text-xs text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3 font-medium">Parameter</th>
                      <th className="px-5 py-3 font-medium">Recommended Setting</th>
                      <th className="px-5 py-3 font-medium">Art Direction Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {ART_DIRECTOR_PARAMS.map((row) => (
                      <tr key={row.parameter} className="hover:bg-slate-900/40">
                        <td className="px-5 py-3 font-medium text-white whitespace-nowrap">
                          {row.parameter}
                        </td>
                        <td className="px-5 py-3 font-mono-tabular text-cyan-300 whitespace-nowrap">
                          {row.value}
                        </td>
                        <td className="px-5 py-3 text-slate-300">{row.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* HLSL Snippet */}
            <CodeBlockCard
              snippet={LIVEBRIDGE_CODE_SNIPPETS[0]}
              copied={copiedIdx === 0}
              onCopy={() => handleCopy(0, LIVEBRIDGE_CODE_SNIPPETS[0].code)}
            />
          </div>
        )}

        {/* VFX GRAPH SECTION */}
        {activeSection === 'vfx' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4">
              {VFX_TIER_SPECS.map((spec) => (
                <div
                  key={spec.tier}
                  className="p-5 rounded-xl bg-[#0D1320] border border-slate-800 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold text-white">
                      {spec.tier}
                    </h2>
                    <span className="font-mono-tabular text-xs text-cyan-300">
                      {spec.budget}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{spec.visuals}</p>
                  <p className="text-xs font-mono-tabular text-amber-300">
                    Impact Feedback: {spec.cameraAndHitStop}
                  </p>
                </div>
              ))}
            </div>

            <section className="p-5 rounded-xl bg-[#0B101B] border border-slate-800">
              <h2 className="font-display text-base font-semibold text-white">
                60 FPS Streaming Optimization Protocol
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300 list-disc list-inside">
                <li>
                  Pre-allocate a single InstancedMesh / GPU VFX Graph ring buffer (256–320 shards) at scene boot; never instantiate or GC particle GameObjects during gift storms.
                </li>
                <li>
                  Pack shockwaves, spark sprites, and ground fracture cracks into a single 2048x2048 4x4 RGBA Texture Atlas (1 draw call per layer).
                </li>
                <li>
                  Cap Tier 1 burst rate via a 120ms gift-coalescing window in LiveBridge so 50 simultaneous Rose gifts merge into one empowered multi-arc burst instead of 50 overlapping alpha planes.
                </li>
                <li>
                  Use additive blending with depthWrite disabled on all trails and shockwaves, and enforce polygonOffset (-2, -2) on ground crack decals to eliminate Z-fighting.
                </li>
              </ul>
            </section>
          </div>
        )}

        {/* LIVEBRIDGE & GAME DESIGN SECTION */}
        {activeSection === 'design' && (
          <div className="flex flex-col gap-6">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-[#0D1320] border border-slate-800">
                <h2 className="font-display text-base font-semibold text-white">
                  Dynamic Handicap System
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  When one side trails by &gt;12% HP, LiveBridge activates a quadratic Comeback Multiplier up to 1.85x damage &amp; shield mitigation, plus spawns a &ldquo;Comeback Crisis&rdquo; alert encouraging underdog viewers to snipe a comeback with small gifts.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#0D1320] border border-slate-800">
                <h2 className="font-display text-base font-semibold text-white">
                  Combo Streak Milestones
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Chat keywords (&ldquo;BOY&rdquo;, &ldquo;GIRL&rdquo;, likes) and gifts feed an 8-second decaying streak counter: 10x unlocks Surge (1.2x ATK), 50x unlocks Rage Mode (1.6x + outline glow), and 100x ignites Super Aura (2.2x + plasma shell).
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#0D1320] border border-slate-800">
                <h2 className="font-display text-base font-semibold text-white">
                  9:16 Portrait Safe-Zone HUD
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Pin HP bars, Handicap multipliers, and Live Gift Goal strictly in the top 18% safe zone, and compact MVP leaderboard + thumb triggers in the bottom 20%, keeping the middle 62% of the vertical viewport 100% open for 3D combat.
                </p>
              </div>
            </section>

            <CodeBlockCard
              snippet={LIVEBRIDGE_CODE_SNIPPETS[1]}
              copied={copiedIdx === 1}
              onCopy={() => handleCopy(1, LIVEBRIDGE_CODE_SNIPPETS[1].code)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface CodeBlockCardProps {
  snippet: { title: string; language: string; code: string };
  copied: boolean;
  onCopy: () => void;
}

const CodeBlockCard: React.FC<CodeBlockCardProps> = ({ snippet, copied, onCopy }) => (
  <div className="rounded-xl border border-slate-800 bg-[#0B101B] overflow-hidden">
    <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-white">{snippet.title}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="font-mono-tabular text-slate-400">{snippet.language}</span>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
    <pre className="p-4 text-xs font-mono-tabular text-slate-200 overflow-x-auto leading-relaxed">
      <code>{snippet.code}</code>
    </pre>
  </div>
);
