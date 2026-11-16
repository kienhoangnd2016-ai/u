import { useCallback, useEffect, useRef, useState } from 'react';
import { ArenaViewport, ArenaViewportHandle } from './components/ArenaViewport';
import { BottomControlDock } from './components/BottomControlDock';
import { DesignBibleDrawer } from './components/DesignBibleDrawer';
import { PortraitHudOverlay } from './components/PortraitHudOverlay';
import { StreamerSideDeck } from './components/StreamerSideDeck';
import {
  DEFAULT_LIVEBRIDGE_CONFIG,
  DEFAULT_SHADER_CONFIG,
  GIFT_CATALOG,
  GiftDefinition,
  LiveBridgeConfig,
  MatchState,
  ShaderConfig,
  SpecSectionId,
  TeamId,
} from './types/arena';

const INITIAL_MAX_HP = 5000;

function computeHandicapMultiplier(
  teamHp: number,
  enemyHp: number,
  maxHp: number,
  enabled: boolean,
  maxBoost: number,
): number {
  if (!enabled) return 1.0;
  const deficitRatio = Math.max(0, (enemyHp - teamHp) / maxHp);
  if (deficitRatio < 0.12) return 1.0;
  const normalized = Math.min(1, (deficitRatio - 0.12) / 0.48);
  return Number((1.0 + (maxBoost - 1.0) * (normalized * normalized)).toFixed(2));
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 100) return 2.2;
  if (streak >= 50) return 1.6;
  if (streak >= 10) return 1.2;
  return 1.0;
}

const INITIAL_MVP = [
  { id: 'v1', handle: '@kenji_volt', team: 'boy' as TeamId, coins: 3400, topGift: 'Cyber Lion' },
  { id: 'v2', handle: '@sakura_nova', team: 'girl' as TeamId, coins: 2950, topGift: 'TikTok Pulse' },
  { id: 'v3', handle: '@pixel_blitz', team: 'boy' as TeamId, coins: 1200, topGift: 'Hand Hearts' },
];

export default function App() {
  const viewportRef = useRef<ArenaViewportHandle | null>(null);

  const [activeSection, setActiveSection] = useState<SpecSectionId>('arena');
  const [portraitMode, setPortraitMode] = useState<boolean>(true);
  const [showTikTokSafeZones, setShowTikTokSafeZones] = useState<boolean>(true);
  const [dockExpanded, setDockExpanded] = useState<boolean>(false);
  const [activeSenderTeam, setActiveSenderTeam] = useState<TeamId>('boy');

  const [shaderConfig, setShaderConfig] = useState<ShaderConfig>(DEFAULT_SHADER_CONFIG);
  const [liveBridgeConfig, setLiveBridgeConfig] = useState<LiveBridgeConfig>(
    DEFAULT_LIVEBRIDGE_CONFIG,
  );

  const [match, setMatch] = useState<MatchState>({
    boyHp: INITIAL_MAX_HP,
    girlHp: INITIAL_MAX_HP,
    maxHp: INITIAL_MAX_HP,
    boyScore: 0,
    girlScore: 0,
    boyStreak: 14,
    girlStreak: 11,
    boyAtkBuff: 0,
    girlAtkBuff: 0,
    boyMultiplier: 1.0,
    girlMultiplier: 1.0,
    giftGoalCurrent: 1850,
    giftGoalTarget: 5000,
    roundNumber: 1,
    boyWins: 0,
    girlWins: 0,
    lastActionLabel: 'Live Arena Ready',
    activeParticles: 0,
    particlePoolSize: 280,
    hitStopRemainingMs: 0,
    mvpLeaderboard: INITIAL_MVP,
  });

  const liveBridgeRef = useRef(liveBridgeConfig);
  liveBridgeRef.current = liveBridgeConfig;

  const triggerGiftAttack = useCallback(
    (team: TeamId, gift: GiftDefinition, senderHandle?: string) => {
      setMatch((prev) => {
        const cfg = liveBridgeRef.current;
        const atkHp = team === 'boy' ? prev.boyHp : prev.girlHp;
        const defHp = team === 'boy' ? prev.girlHp : prev.boyHp;
        const currentBuff = team === 'boy' ? prev.boyAtkBuff : prev.girlAtkBuff;

        const comebackMult = computeHandicapMultiplier(
          atkHp,
          defHp,
          prev.maxHp,
          cfg.handicapEnabled,
          cfg.handicapMaxBoost,
        );

        const nextStreak =
          (team === 'boy' ? prev.boyStreak : prev.girlStreak) + gift.streakPoints;
        const streakMult = getStreakMultiplier(nextStreak);

        const isBuffSkill = gift.skillType === 'buff';
        const totalDamage =
          gift.baseDamage > 0
            ? Math.round(gift.baseDamage * comebackMult * streakMult * (1 + currentBuff))
            : 0;
        const totalHeal =
          gift.healAmount > 0 ? Math.round(gift.healAmount * comebackMult) : 0;

        const isCrit = comebackMult > 1.2 || gift.tier === 3;

        const subTag = isBuffSkill
          ? `${gift.skillName} · +10% ATK`
          : comebackMult > 1.05
            ? `${gift.skillName} · ${comebackMult.toFixed(2)}x`
            : gift.skillName;

        viewportRef.current?.triggerAttackVfx(
          team,
          gift.tier,
          gift.skillType,
          isBuffSkill ? totalHeal : totalDamage,
          subTag,
          isCrit,
          isBuffSkill,
        );

        let nextBoyHp =
          team === 'boy'
            ? Math.min(prev.maxHp, prev.boyHp + totalHeal)
            : Math.max(0, prev.boyHp - totalDamage);
        let nextGirlHp =
          team === 'girl'
            ? Math.min(prev.maxHp, prev.girlHp + totalHeal)
            : Math.max(0, prev.girlHp - totalDamage);

        // Consume ATK buff on heavy/medium hit or stack it on Aegis Buff
        let nextBoyBuff =
          team === 'boy'
            ? isBuffSkill
              ? Math.min(0.8, prev.boyAtkBuff + 0.1)
              : gift.baseDamage > 0
                ? Math.max(0, prev.boyAtkBuff - 0.1)
                : prev.boyAtkBuff
            : prev.boyAtkBuff;
        let nextGirlBuff =
          team === 'girl'
            ? isBuffSkill
              ? Math.min(0.8, prev.girlAtkBuff + 0.1)
              : gift.baseDamage > 0
                ? Math.max(0, prev.girlAtkBuff - 0.1)
                : prev.girlAtkBuff
            : prev.girlAtkBuff;

        let nextRound = prev.roundNumber;
        let nextBoyWins = prev.boyWins;
        let nextGirlWins = prev.girlWins;
        let actionLabel = isBuffSkill
          ? `${team === 'boy' ? 'Boy' : 'Girl'} · ${gift.skillName} (+${totalHeal} HP)`
          : `${team === 'boy' ? 'Boy' : 'Girl'} · ${gift.skillName} (-${totalDamage})`;

        if (nextBoyHp <= 0 || nextGirlHp <= 0) {
          if (nextGirlHp <= 0) nextBoyWins += 1;
          else nextGirlWins += 1;
          nextRound += 1;
          nextBoyHp = prev.maxHp;
          nextGirlHp = prev.maxHp;
          nextBoyBuff = 0;
          nextGirlBuff = 0;
          actionLabel = `${nextGirlHp <= 0 ? 'Volt Boy' : 'Nova Girl'} Wins Round ${prev.roundNumber}`;
        }

        const nextBoyMult = computeHandicapMultiplier(
          nextBoyHp,
          nextGirlHp,
          prev.maxHp,
          cfg.handicapEnabled,
          cfg.handicapMaxBoost,
        );
        const nextGirlMult = computeHandicapMultiplier(
          nextGirlHp,
          nextBoyHp,
          prev.maxHp,
          cfg.handicapEnabled,
          cfg.handicapMaxBoost,
        );

        let nextGoal = prev.giftGoalCurrent + gift.coins;
        if (nextGoal >= prev.giftGoalTarget) {
          nextGoal = nextGoal % prev.giftGoalTarget;
        }

        const handle =
          senderHandle ?? (team === 'boy' ? '@you_volt' : '@you_nova');
        const updatedBoard = [...prev.mvpLeaderboard];
        const existing = updatedBoard.find((v) => v.handle === handle && v.team === team);
        if (existing) {
          existing.coins += gift.coins;
          existing.topGift = gift.skillName;
        } else {
          updatedBoard.push({
            id: `${handle}-${team}`,
            handle,
            team,
            coins: gift.coins,
            topGift: gift.skillName,
          });
        }
        updatedBoard.sort((a, b) => b.coins - a.coins);

        return {
          ...prev,
          boyHp: nextBoyHp,
          girlHp: nextGirlHp,
          boyScore: team === 'boy' ? prev.boyScore + gift.coins : prev.boyScore,
          girlScore: team === 'girl' ? prev.girlScore + gift.coins : prev.girlScore,
          boyStreak: team === 'boy' ? nextStreak : prev.boyStreak,
          girlStreak: team === 'girl' ? nextStreak : prev.girlStreak,
          boyAtkBuff: nextBoyBuff,
          girlAtkBuff: nextGirlBuff,
          boyMultiplier: nextBoyMult,
          girlMultiplier: nextGirlMult,
          giftGoalCurrent: nextGoal,
          roundNumber: nextRound,
          boyWins: nextBoyWins,
          girlWins: nextGirlWins,
          lastActionLabel: actionLabel,
          mvpLeaderboard: updatedBoard.slice(0, 5),
        };
      });
    },
    [],
  );

  const handleChatSpam = useCallback((team: TeamId) => {
    setMatch((prev) => {
      const nextStreak = (team === 'boy' ? prev.boyStreak : prev.girlStreak) + 10;
      return {
        ...prev,
        boyStreak: team === 'boy' ? nextStreak : prev.boyStreak,
        girlStreak: team === 'girl' ? nextStreak : prev.girlStreak,
        lastActionLabel: `${team === 'boy' ? 'Boy' : 'Girl'} Chat Surge (${nextStreak}x Streak)`,
      };
    });
    viewportRef.current?.triggerAttackVfx(team, 1, 'buff', 60, 'Chat Buff +10x', false, true);
  }, []);

  const handleResetMatch = useCallback(() => {
    setMatch((prev) => ({
      ...prev,
      boyHp: INITIAL_MAX_HP,
      girlHp: INITIAL_MAX_HP,
      boyStreak: 0,
      girlStreak: 0,
      boyAtkBuff: 0,
      girlAtkBuff: 0,
      boyMultiplier: 1.0,
      girlMultiplier: 1.0,
      lastActionLabel: 'Round Reset',
    }));
  }, []);

  useEffect(() => {
    if (!liveBridgeConfig.autoBattle) return;
    const interval = window.setInterval(() => {
      const roll = Math.random();
      const team: TeamId = Math.random() > 0.49 ? 'boy' : 'girl';
      const gift =
        roll > 0.95
          ? GIFT_CATALOG[5] // Orbital Beam
          : roll > 0.88
            ? GIFT_CATALOG[4] // Meteor Fury
            : roll > 0.72
              ? GIFT_CATALOG[3] // Thunder Slam
              : roll > 0.52
                ? GIFT_CATALOG[2] // Crescent Wave
                : roll > 0.3
                  ? GIFT_CATALOG[1] // Aegis Buff
                  : GIFT_CATALOG[0]; // Quick Jab
      const handles =
        team === 'boy'
          ? ['@kenji_volt', '@pixel_blitz', '@ryu_cyber']
          : ['@sakura_nova', '@hana_live', '@mina_spark'];
      const handle = handles[Math.floor(Math.random() * handles.length)];
      triggerGiftAttack(team, gift, handle);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [liveBridgeConfig.autoBattle, triggerGiftAttack]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h' && !portraitMode) {
        setDockExpanded((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [portraitMode]);

  const handleStatsTick = useCallback(
    (activeParticles: number, particlePoolSize: number, hitStopRemainingMs: number) => {
      setMatch((prev) => {
        if (
          prev.activeParticles === activeParticles &&
          prev.hitStopRemainingMs === hitStopRemainingMs
        ) {
          return prev;
        }
        return { ...prev, activeParticles, particlePoolSize, hitStopRemainingMs };
      });
    },
    [],
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07090E] text-slate-100">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-8 px-6 border-b border-slate-800/90 bg-[#090D16] z-50">
        <button
          type="button"
          onClick={() => setActiveSection('arena')}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          Boy vs Girl
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {(
            [
              ['arena', 'Live Arena'],
              ['art', 'Art & URP'],
              ['vfx', 'VFX Graph'],
              ['design', 'LiveBridge'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeSection === id
                  ? 'text-white border-cyan-400'
                  : 'border-transparent hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveSection('arena');
              setPortraitMode((prev) => !prev);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {portraitMode ? 'Switch to Full Stage' : 'Switch to 9:16 TikTok Live'}
          </button>
        </div>
      </header>

      {/* Main Stage Area */}
      <main
        className={`relative flex-1 min-h-0 bg-[#060810] ${
          portraitMode
            ? 'overflow-y-auto md:overflow-hidden flex flex-col md:flex-row items-center justify-center gap-6 p-4 md:p-6'
            : 'flex items-center justify-center'
        }`}
      >
        {/* 3D Arena Canvas Container */}
        <div
          className={`relative transition-all duration-300 ${
            portraitMode
              ? 'h-[600px] md:h-full max-h-[820px] aspect-[9/16] shrink-0 rounded-2xl overflow-hidden border border-slate-700/80 shadow-[0_0_60px_rgba(0,229,255,0.08)]'
              : 'w-full h-full'
          }`}
        >
          <ArenaViewport
            ref={viewportRef}
            shaderConfig={shaderConfig}
            boyHpRatio={match.boyHp / match.maxHp}
            girlHpRatio={match.girlHp / match.maxHp}
            boyStreak={match.boyStreak}
            girlStreak={match.girlStreak}
            portraitMode={portraitMode}
            onStatsTick={handleStatsTick}
          />

          <PortraitHudOverlay
            match={match}
            onResetMatch={handleResetMatch}
            portraitMode={portraitMode}
            showTikTokSafeZones={showTikTokSafeZones}
          />
        </div>

        {/* Non-Overlapping Streamer Side Deck in 9:16 TikTok Live Mode */}
        {portraitMode && (
          <StreamerSideDeck
            match={match}
            activeSenderTeam={activeSenderTeam}
            onSelectSenderTeam={setActiveSenderTeam}
            onSendGift={(team, gift) => triggerGiftAttack(team, gift)}
            onChatSpam={handleChatSpam}
            shaderConfig={shaderConfig}
            onUpdateShader={(patch) => setShaderConfig((prev) => ({ ...prev, ...patch }))}
            onResetShader={() => setShaderConfig(DEFAULT_SHADER_CONFIG)}
            liveBridgeConfig={liveBridgeConfig}
            onUpdateLiveBridge={(patch) =>
              setLiveBridgeConfig((prev) => ({ ...prev, ...patch }))
            }
            onResetCamera={() => viewportRef.current?.resetCamera()}
            showTikTokSafeZones={showTikTokSafeZones}
            onToggleTikTokSafeZones={() => setShowTikTokSafeZones((prev) => !prev)}
          />
        )}

        {/* Collapsible Bottom Control Dock in Full Stage Mode */}
        {!portraitMode && (
          <BottomControlDock
            expanded={dockExpanded}
            onToggleExpanded={() => setDockExpanded((prev) => !prev)}
            match={match}
            activeSenderTeam={activeSenderTeam}
            onSelectSenderTeam={setActiveSenderTeam}
            onSendGift={(team, gift) => triggerGiftAttack(team, gift)}
            onChatSpam={handleChatSpam}
            shaderConfig={shaderConfig}
            onUpdateShader={(patch) => setShaderConfig((prev) => ({ ...prev, ...patch }))}
            onResetShader={() => setShaderConfig(DEFAULT_SHADER_CONFIG)}
            liveBridgeConfig={liveBridgeConfig}
            onUpdateLiveBridge={(patch) =>
              setLiveBridgeConfig((prev) => ({ ...prev, ...patch }))
            }
            onResetCamera={() => viewportRef.current?.resetCamera()}
          />
        )}

        {/* Spec & Architecture Drawer */}
        {activeSection !== 'arena' && (
          <DesignBibleDrawer
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            onApplyRecommendedPreset={() => setShaderConfig(DEFAULT_SHADER_CONFIG)}
          />
        )}
      </main>
    </div>
  );
}
