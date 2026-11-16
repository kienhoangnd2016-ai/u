export interface SpecParameterRow {
  parameter: string;
  value: string;
  rationale: string;
}

export interface SpecCodeBlock {
  title: string;
  language: string;
  code: string;
}

export const ART_DIRECTOR_PARAMS: SpecParameterRow[] = [
  {
    parameter: 'Cel Diffuse Bands',
    value: '3 Steps (Hardness 0.04)',
    rationale: 'Keeps character muscles & armor readable at 720x1280 vertical compression.',
  },
  {
    parameter: 'Shadow Tint Shift',
    value: '#16142E (Cool Indigo)',
    rationale: 'Prevents muddy black shadows on dark OLED screens; preserves hue saturation.',
  },
  {
    parameter: 'Fresnel Rim Power / Intensity',
    value: 'Power 2.6 · Intensity 1.45',
    rationale: 'Separates silhouette cleanly from neon grid & particle bursts during dashes.',
  },
  {
    parameter: 'Inverted-Hull Outline',
    value: '0.025–0.032m · #04060D',
    rationale: 'Screen-space clamped vertex extrusion along baked smooth normals.',
  },
  {
    parameter: 'URP Bloom (ACES)',
    value: 'Threshold 0.88 · Intensity 0.65 · Scatter 0.42',
    rationale: 'Only HDR emissives (>1.0) bloom; HUD and skin tones remain razor-sharp.',
  },
  {
    parameter: 'Chromatic Aberration',
    value: 'Base 0.04 · Hit Spike 0.48 (90ms decay)',
    rationale: 'Adds tactile lens shock on Tier 2/3 strikes without hurting text legibility.',
  },
  {
    parameter: 'Color Adjustments',
    value: 'ACES Filmic · Contrast +14 · Saturation +24',
    rationale: 'Matches high-energy TikTok LIVE feed vibrancy without clipping neon cyan/pink.',
  },
  {
    parameter: 'URP SSAO (Mobile)',
    value: 'Downsample 2x · Intensity 0.35 · Radius 0.25',
    rationale: 'Low-cost contact grounding under boots & shoulder plates at 60 FPS.',
  },
];

export const VFX_TIER_SPECS = [
  {
    tier: 'Tier 1 — Small Gifts (Rose, Like Tap)',
    budget: 'Max 25 particles/event · Pool: 256 · 0.35ms GPU',
    visuals:
      'Fast directional spark burst, additive ribbon weapon trail, spring-eased floating damage/buff numbers (+2% ATK buff).',
    cameraAndHitStop: 'Micro-shake (0.04 amp, 80ms) · 0 Hit-Stop frames so rapid gift spam stays fluid.',
  },
  {
    tier: 'Tier 2 — Medium Gifts (Hand Hearts, TikTok Pulse)',
    budget: 'Max 65 particles/event · 1 Slash Mesh · 1 Decal · 0.8ms GPU',
    visuals:
      'World-space crescent energy slash wave, expanding additive shockwave ring, radial ground crack decal with emissive fade.',
    cameraAndHitStop: 'Damped directional shake (0.16 amp, 220ms) · Chromatic spike 0.0065 · 2-frame white hit-flash.',
  },
  {
    tier: 'Tier 3 — Massive Gifts (Cyber Lion, Universe)',
    budget: 'Max 120 particles + 4 Meteors · 1.6ms GPU',
    visuals:
      'Full-screen radial vignette flash, 4 elemental meteor drops with crater decals, Super Aura Fresnel shell overdrive.',
    cameraAndHitStop: 'Hit-Stop slow-motion (TimeScale 0.08 for 340ms) · Heavy shake (0.34 amp) · Chromatic spike 0.014.',
  },
];

export const LIVEBRIDGE_CODE_SNIPPETS: SpecCodeBlock[] = [
  {
    title: 'Unity URP Cel + Rim HLSL Fragment Core',
    language: 'hlsl',
    code: `// Stylized Cyber-Neon Cel + Rim Core (URP Lit Custom Function)
float ndotl = dot(WorldNormal, LightDir) * 0.5 + 0.5;
float celBand = floor(ndotl * _CelSteps) / (_CelSteps - 0.35);
celBand = clamp(celBand, 0.18, 1.08);

half3 lit = lerp(_ShadowTint * _BaseColor.rgb, _BaseColor.rgb, celBand);
float fresnel = pow(1.0 - saturate(dot(ViewDirWS, WorldNormal)), _RimPower);
half3 rim = _RimColor.rgb * fresnel * (_RimIntensity + _AuraBoost);
return lit + rim + (_EmissiveColor.rgb * _EmissivePower);`,
  },
  {
    title: 'Node.js LiveBridge — Dynamic Handicap & Batching Engine',
    language: 'typescript',
    code: `// Dynamic Comeback Multiplier (keeps losing team in the fight)
export function computeHandicapMultiplier(
  teamHp: number,
  enemyHp: number,
  maxHp: number,
  maxBoost = 1.85
): number {
  const deficitRatio = Math.max(0, (enemyHp - teamHp) / maxHp);
  if (deficitRatio < 0.12) return 1.0; // Fair fight zone
  // Smooth quadratic ramp up to maxBoost (e.g., 1.85x at 50%+ deficit)
  const normalized = Math.min(1, (deficitRatio - 0.12) / 0.48);
  return Number((1.0 + (maxBoost - 1.0) * (normalized * normalized)).toFixed(2));
}

// Combo Streak Tier Evaluation (Chat Spam + Gift Streaks)
export function getStreakState(streak: number) {
  if (streak >= 100) return { mode: 'SUPER_AURA', dmgMult: 2.2, vfxScale: 1.8 };
  if (streak >= 50)  return { mode: 'RAGE_MODE',  dmgMult: 1.6, vfxScale: 1.4 };
  if (streak >= 10)  return { mode: 'SURGE',      dmgMult: 1.2, vfxScale: 1.15 };
  return { mode: 'BASE', dmgMult: 1.0, vfxScale: 1.0 };
}`,
  },
];
