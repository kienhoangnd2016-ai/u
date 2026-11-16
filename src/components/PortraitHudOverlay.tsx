import React from 'react';
import { Flame, Gift, Heart, RotateCcw, ShieldAlert, Trophy, Users, Zap } from 'lucide-react';
import { MatchState } from '../types/arena';

interface PortraitHudOverlayProps {
  match: MatchState;
  onResetMatch: () => void;
  portraitMode: boolean;
  showTikTokSafeZones: boolean;
}

export const PortraitHudOverlay: React.FC<PortraitHudOverlayProps> = ({
  match,
  onResetMatch,
  portraitMode,
  showTikTokSafeZones,
}) => {
  const totalHp = Math.max(1, match.boyHp + match.girlHp);
  const boySharePct = Math.max(8, Math.min(92, (match.boyHp / totalHp) * 100));
  const goalPct = Math.min(100, (match.giftGoalCurrent / match.giftGoalTarget) * 100);
  const topViewer = match.mvpLeaderboard[0];

  return (
    <>
      {/* Simulated TikTok Native Top Header (0% - 8% top safe zone) */}
      {portraitMode && showTikTokSafeZones && (
        <div className="pointer-events-none absolute top-2 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2 text-[10px] text-white/90">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/10">
            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 inline-block shrink-0" />
            <span className="font-semibold truncate max-w-[95px]">@boyvsgirl.live</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 font-mono-tabular">
            <Users className="w-3 h-3 text-slate-300" />
            <span>3.8K</span>
          </div>
        </div>
      )}

      {/* UNIFIED TUG-OF-WAR PK BAR (Ultra-slim top edge, zero character occlusion) */}
      <div
        className={`pointer-events-none absolute left-2.5 right-2.5 z-20 flex justify-center transition-[top] duration-200 ${
          portraitMode && showTikTokSafeZones ? 'top-9' : 'top-2.5'
        }`}
      >
        <div
          className={`pointer-events-auto w-full flex flex-col gap-1 px-2.5 py-1.5 rounded-lg bg-[#090D16]/88 border border-slate-800/90 ${
            portraitMode ? 'max-w-full' : 'max-w-3xl'
          }`}
        >
          {/* Row 1: Team Names, Exact HP & Round Score */}
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-display font-bold text-cyan-300 truncate">BOY</span>
              <span className="font-mono-tabular font-semibold text-white">
                {Math.round(match.boyHp).toLocaleString()}
              </span>
              {match.boyAtkBuff > 0 && (
                <span className="font-mono-tabular text-[10px] text-emerald-300">
                  +{Math.round(match.boyAtkBuff * 100)}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 font-mono-tabular text-[10px] text-slate-300 shrink-0">
              <span className="font-semibold text-white">R{match.roundNumber}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-cyan-300">{match.boyWins}</span>
              <span aria-hidden="true" className="text-slate-600">-</span>
              <span className="text-pink-400">{match.girlWins}</span>
              <button
                type="button"
                onClick={onResetMatch}
                title="Reset Round"
                className="ml-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 min-w-0 justify-end">
              {match.girlAtkBuff > 0 && (
                <span className="font-mono-tabular text-[10px] text-emerald-300">
                  +{Math.round(match.girlAtkBuff * 100)}%
                </span>
              )}
              <span className="font-mono-tabular font-semibold text-white">
                {Math.round(match.girlHp).toLocaleString()}
              </span>
              <span className="font-display font-bold text-pink-400 truncate">GIRL</span>
            </div>
          </div>

          {/* Row 2: Single Opposing Tug-of-War PK Bar */}
          <div className="relative h-3 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-700/80 flex">
            <div
              className="h-full bg-gradient-to-r from-sky-600 via-cyan-500 to-cyan-300 transition-[width] duration-300"
              style={{ width: `${boySharePct}%` }}
            />
            <div
              className="h-full bg-gradient-to-l from-rose-600 via-pink-500 to-pink-300 transition-[width] duration-300"
              style={{ width: `${100 - boySharePct}%` }}
            />
            {/* Clash Spark Divider */}
            <div
              className="absolute top-0 bottom-0 -translate-x-1/2 w-1 bg-white shadow-[0_0_8px_#fff] transition-[left] duration-300 flex items-center justify-center"
              style={{ left: `${boySharePct}%` }}
            >
              <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300 shrink-0" />
            </div>
          </div>

          {/* Row 3: Compact Streaks, Handicap & Gift Goal */}
          <div className="flex items-center justify-between gap-2 text-[9px] font-mono-tabular text-slate-300">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-0.5 text-cyan-300">
                <Flame className="w-2.5 h-2.5" />
                {match.boyStreak}x
              </span>
              {match.boyMultiplier > 1.01 && (
                <span className="inline-flex items-center gap-0.5 text-amber-300 font-semibold">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  {match.boyMultiplier.toFixed(1)}x
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-1 max-w-[160px] min-w-0">
              <Gift className="w-2.5 h-2.5 text-amber-300 shrink-0" />
              <div className="flex-1 h-1 rounded bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-[width] duration-300"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <span className="text-slate-400 shrink-0">
                {Math.round(goalPct)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {match.girlMultiplier > 1.01 && (
                <span className="inline-flex items-center gap-0.5 text-amber-300 font-semibold">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  {match.girlMultiplier.toFixed(1)}x
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 text-pink-300">
                {match.girlStreak}x
                <Flame className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated TikTok Bottom Native Safe Zone (bottom 0% - 20% below the 3D arena) */}
      {portraitMode && showTikTokSafeZones && (
        <div className="pointer-events-none absolute bottom-2 left-2.5 right-2.5 z-20 flex flex-col gap-1.5">
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5 max-w-[74%] text-[10px] leading-tight text-slate-200">
              {topViewer && (
                <div className="px-2 py-0.5 rounded bg-black/55 truncate">
                  <Trophy className="w-2.5 h-2.5 text-amber-300 inline mr-1" />
                  <span className={topViewer.team === 'boy' ? 'text-cyan-300 font-semibold' : 'text-pink-300 font-semibold'}>
                    {topViewer.handle}
                  </span>{' '}
                  <span className="text-slate-300">MVP · {topViewer.topGift}</span>
                </div>
              )}
              <div className="px-2 py-0.5 rounded bg-black/55 truncate text-slate-200">
                <span className="text-amber-300 font-semibold">Skill:</span>{' '}
                <span>{match.lastActionLabel}</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg bg-black/55 text-[9px] text-pink-300 font-mono-tabular">
              <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
              <span>{(match.boyScore + match.girlScore + 1240).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] text-slate-400">
            <span>Add comment... (BOY / GIRL)</span>
            <span className="text-amber-300 font-semibold">Gift</span>
          </div>
        </div>
      )}
    </>
  );
};
