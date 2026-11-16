export type TeamId = 'boy' | 'girl';

export type GiftTier = 1 | 2 | 3;

export type SkillType =
  | 'jab'
  | 'buff'
  | 'slash_wave'
  | 'dash_slam'
  | 'meteor_fury'
  | 'orbital_beam';

export type SpecSectionId = 'arena' | 'art' | 'vfx' | 'design';

export interface GiftDefinition {
  id: string;
  name: string;
  skillName: string;
  skillType: SkillType;
  tier: GiftTier;
  coins: number;
  baseDamage: number;
  healAmount: number;
  streakPoints: number;
  summary: string;
}

export interface ShaderConfig {
  celSteps: number;
  rimPower: number;
  rimIntensity: number;
  outlineWidth: number;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  chromaticBase: number;
  saturation: number;
  contrast: number;
  exposure: number;
  crowdReactivity: number;
}

export interface LiveBridgeConfig {
  autoBattle: boolean;
  handicapEnabled: boolean;
  handicapMaxBoost: number;
  streakDecaySeconds: number;
}

export interface MvpViewer {
  id: string;
  handle: string;
  team: TeamId;
  coins: number;
  topGift: string;
}

export interface FloatingCombatText {
  id: number;
  team: TeamId;
  label: string;
  subLabel?: string;
  screenX: number;
  screenY: number;
  tier: GiftTier;
  isCrit: boolean;
  isHeal?: boolean;
}

export interface MatchState {
  boyHp: number;
  girlHp: number;
  maxHp: number;
  boyScore: number;
  girlScore: number;
  boyStreak: number;
  girlStreak: number;
  boyAtkBuff: number;
  girlAtkBuff: number;
  boyMultiplier: number;
  girlMultiplier: number;
  giftGoalCurrent: number;
  giftGoalTarget: number;
  roundNumber: number;
  boyWins: number;
  girlWins: number;
  lastActionLabel: string;
  activeParticles: number;
  particlePoolSize: number;
  hitStopRemainingMs: number;
  mvpLeaderboard: MvpViewer[];
}

export const GIFT_CATALOG: GiftDefinition[] = [
  {
    id: 'rose',
    name: 'Rose',
    skillName: 'Quick Jab',
    skillType: 'jab',
    tier: 1,
    coins: 1,
    baseDamage: 65,
    healAmount: 0,
    streakPoints: 2,
    summary: 'Đấm nhanh + tia lửa',
  },
  {
    id: 'like',
    name: 'Like Tap',
    skillName: 'Aegis Buff',
    skillType: 'buff',
    tier: 1,
    coins: 1,
    baseDamage: 0,
    healAmount: 85,
    streakPoints: 2,
    summary: 'Hồi máu +10% ATK',
  },
  {
    id: 'hearts',
    name: 'Hand Hearts',
    skillName: 'Crescent Wave',
    skillType: 'slash_wave',
    tier: 2,
    coins: 100,
    baseDamage: 220,
    healAmount: 0,
    streakPoints: 8,
    summary: 'Chém sóng năng lượng kép',
  },
  {
    id: 'tiktok',
    name: 'TikTok Pulse',
    skillName: 'Thunder Slam',
    skillType: 'dash_slam',
    tier: 2,
    coins: 299,
    baseDamage: 360,
    healAmount: 0,
    streakPoints: 14,
    summary: 'Lao nhảy đập nứt sàn',
  },
  {
    id: 'lion',
    name: 'Cyber Lion',
    skillName: 'Meteor Fury',
    skillType: 'meteor_fury',
    tier: 3,
    coins: 2999,
    baseDamage: 840,
    healAmount: 0,
    streakPoints: 35,
    summary: 'Mưa thiên thạch + Hit-Stop',
  },
  {
    id: 'universe',
    name: 'Universe',
    skillName: 'Orbital Beam',
    skillType: 'orbital_beam',
    tier: 3,
    coins: 5000,
    baseDamage: 1350,
    healAmount: 150,
    streakPoints: 60,
    summary: 'Trụ Laser hủy diệt + Aura',
  },
];

export const DEFAULT_SHADER_CONFIG: ShaderConfig = {
  celSteps: 3,
  rimPower: 3.2,
  rimIntensity: 0.78,
  outlineWidth: 0.028,
  bloomStrength: 0.28,
  bloomThreshold: 0.96,
  bloomRadius: 0.25,
  chromaticBase: 0.001,
  saturation: 1.12,
  contrast: 1.04,
  exposure: 0.92,
  crowdReactivity: 1.0,
};

export const DEFAULT_LIVEBRIDGE_CONFIG: LiveBridgeConfig = {
  autoBattle: true,
  handicapEnabled: true,
  handicapMaxBoost: 1.85,
  streakDecaySeconds: 8,
};
