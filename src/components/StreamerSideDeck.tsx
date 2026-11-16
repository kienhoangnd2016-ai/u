import React, { useState } from 'react';
import {
  Eye,
  Gift,
  MessageSquare,
  RotateCcw,
  Sliders,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  GIFT_CATALOG,
  GiftDefinition,
  LiveBridgeConfig,
  MatchState,
  ShaderConfig,
  TeamId,
} from '../types/arena';

interface StreamerSideDeckProps {
  match: MatchState;
  activeSenderTeam: TeamId;
  onSelectSenderTeam: (team: TeamId) => void;
  onSendGift: (team: TeamId, gift: GiftDefinition) => void;
  onChatSpam: (team: TeamId) => void;
  shaderConfig: ShaderConfig;
  onUpdateShader: (patch: Partial<ShaderConfig>) => void;
  onResetShader: () => void;
  liveBridgeConfig: LiveBridgeConfig;
  onUpdateLiveBridge: (patch: Partial<LiveBridgeConfig>) => void;
  onResetCamera: () => void;
  showTikTokSafeZones: boolean;
  onToggleTikTokSafeZones: () => void;
}

type SideTab = 'gifts' | 'shader' | 'postfx' | 'livebridge';

export const StreamerSideDeck: React.FC<StreamerSideDeckProps> = ({
  match,
  activeSenderTeam,
  onSelectSenderTeam,
  onSendGift,
  onChatSpam,
  shaderConfig,
  onUpdateShader,
  onResetShader,
  liveBridgeConfig,
  onUpdateLiveBridge,
  onResetCamera,
  showTikTokSafeZones,
  onToggleTikTokSafeZones,
}) => {
  const [activeTab, setActiveTab] = useState<SideTab>('gifts');

  return (
    <aside className="w-full md:w-[390px] lg:w-[420px] shrink-0 h-auto md:h-full max-h-[820px] flex flex-col rounded-xl bg-[#0B101B] border border-slate-800 overflow-hidden">
      {/* Deck Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-bold text-white">
            Streamer Command Deck
          </h2>
          <p className="text-[11px] font-mono-tabular text-slate-400">
            Pool {match.activeParticles}/{match.particlePoolSize}
            {match.hitStopRemainingMs > 0 ? ' · Hit-Stop' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleTikTokSafeZones}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            showTikTokSafeZones
              ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showTikTokSafeZones ? 'TikTok UI On' : 'TikTok UI Off'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2.5 pb-2 border-b border-slate-800 flex items-center gap-1 overflow-x-auto">
        {(
          [
            ['gifts', 'Gifts', Gift],
            ['shader', 'Cel/Rim', Sliders],
            ['postfx', 'URP FX', Sparkles],
            ['livebridge', 'LiveBridge', Zap],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === id
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeTab === 'gifts' && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center p-0.5 rounded-md bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onSelectSenderTeam('boy')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSenderTeam === 'boy'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Team Boy
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSenderTeam('girl')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSenderTeam === 'girl'
                      ? 'bg-pink-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Team Girl
                </button>
              </div>

              <button
                type="button"
                onClick={() => onChatSpam(activeSenderTeam)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat +10x</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {GIFT_CATALOG.map((gift) => {
                const tierAccent =
                  gift.tier === 3
                    ? 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200'
                    : gift.tier === 2
                      ? activeSenderTeam === 'boy'
                        ? 'border-cyan-500/45 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200'
                        : 'border-pink-500/45 bg-pink-500/10 hover:bg-pink-500/20 text-pink-200'
                      : 'border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-200';

                return (
                  <button
                    key={gift.id}
                    type="button"
                    onClick={() => onSendGift(activeSenderTeam, gift)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${tierAccent}`}
                  >
                    <div className="w-full flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold truncate">{gift.skillName}</span>
                      <span className="font-mono-tabular text-[10px] opacity-75">
                        T{gift.tier}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-80 mt-0.5">{gift.summary}</span>
                    <span className="font-mono-tabular text-[10px] opacity-75 mt-1">
                      {gift.name} · {gift.coins.toLocaleString()}c
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Top MVP Leaderboard */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-2">
                <Trophy className="w-3.5 h-3.5" />
                <span>MVP Viewer Leaderboard</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {match.mvpLeaderboard.slice(0, 4).map((v, i) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-slate-900/80 border border-slate-800/80 font-mono-tabular"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500">{i + 1}.</span>
                      <span
                        className={`truncate font-sans font-medium ${
                          v.team === 'boy' ? 'text-cyan-300' : 'text-pink-300'
                        }`}
                      >
                        {v.handle}
                      </span>
                    </div>
                    <span className="text-slate-300 shrink-0">
                      {v.coins.toLocaleString()}c
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'shader' && (
          <div className="flex flex-col gap-4">
            <SideSlider
              label="Cel Bands"
              value={shaderConfig.celSteps}
              min={2}
              max={5}
              step={1}
              display={`${shaderConfig.celSteps} steps`}
              onChange={(v) => onUpdateShader({ celSteps: v })}
            />
            <SideSlider
              label="Fresnel Rim Power"
              value={shaderConfig.rimPower}
              min={1.2}
              max={5.0}
              step={0.1}
              display={shaderConfig.rimPower.toFixed(1)}
              onChange={(v) => onUpdateShader({ rimPower: v })}
            />
            <SideSlider
              label="Rim Intensity"
              value={shaderConfig.rimIntensity}
              min={0.2}
              max={3.0}
              step={0.05}
              display={shaderConfig.rimIntensity.toFixed(2)}
              onChange={(v) => onUpdateShader({ rimIntensity: v })}
            />
            <SideSlider
              label="Outline Width"
              value={shaderConfig.outlineWidth}
              min={0.0}
              max={0.06}
              step={0.002}
              display={`${(shaderConfig.outlineWidth * 1000).toFixed(0)} mm`}
              onChange={(v) => onUpdateShader({ outlineWidth: v })}
            />
          </div>
        )}

        {activeTab === 'postfx' && (
          <div className="flex flex-col gap-4">
            <SideSlider
              label="Bloom Intensity"
              value={shaderConfig.bloomStrength}
              min={0}
              max={1.8}
              step={0.05}
              display={shaderConfig.bloomStrength.toFixed(2)}
              onChange={(v) => onUpdateShader({ bloomStrength: v })}
            />
            <SideSlider
              label="Bloom Threshold"
              value={shaderConfig.bloomThreshold}
              min={0.2}
              max={1.1}
              step={0.02}
              display={shaderConfig.bloomThreshold.toFixed(2)}
              onChange={(v) => onUpdateShader({ bloomThreshold: v })}
            />
            <SideSlider
              label="Chromatic Base"
              value={shaderConfig.chromaticBase}
              min={0}
              max={0.008}
              step={0.0002}
              display={(shaderConfig.chromaticBase * 1000).toFixed(1)}
              onChange={(v) => onUpdateShader({ chromaticBase: v })}
            />
            <SideSlider
              label="Saturation"
              value={shaderConfig.saturation}
              min={0.7}
              max={1.7}
              step={0.02}
              display={`${Math.round(shaderConfig.saturation * 100)}%`}
              onChange={(v) => onUpdateShader({ saturation: v })}
            />
            <SideSlider
              label="Contrast"
              value={shaderConfig.contrast}
              min={0.85}
              max={1.5}
              step={0.02}
              display={`${Math.round(shaderConfig.contrast * 100)}%`}
              onChange={(v) => onUpdateShader({ contrast: v })}
            />
          </div>
        )}

        {activeTab === 'livebridge' && (
          <div className="flex flex-col gap-3.5">
            <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer">
              <span className="text-slate-200 font-medium">Auto Live Stream Sim</span>
              <input
                type="checkbox"
                checked={liveBridgeConfig.autoBattle}
                onChange={(e) => onUpdateLiveBridge({ autoBattle: e.target.checked })}
                className="accent-cyan-400 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer">
              <span className="text-slate-200 font-medium">Dynamic Handicap</span>
              <input
                type="checkbox"
                checked={liveBridgeConfig.handicapEnabled}
                onChange={(e) => onUpdateLiveBridge({ handicapEnabled: e.target.checked })}
                className="accent-amber-400 w-4 h-4"
              />
            </label>
            <SideSlider
              label="Max Comeback Boost"
              value={liveBridgeConfig.handicapMaxBoost}
              min={1.1}
              max={2.5}
              step={0.05}
              display={`${liveBridgeConfig.handicapMaxBoost.toFixed(2)}x`}
              onChange={(v) => onUpdateLiveBridge({ handicapMaxBoost: v })}
            />
            <SideSlider
              label="Crowd Reactivity"
              value={shaderConfig.crowdReactivity}
              min={0.2}
              max={2.0}
              step={0.1}
              display={`${Math.round(shaderConfig.crowdReactivity * 100)}%`}
              onChange={(v) => onUpdateShader({ crowdReactivity: v })}
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-2.5 border-t border-slate-800 flex items-center justify-between gap-2 bg-[#090D16]">
        <button
          type="button"
          onClick={onResetCamera}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors cursor-pointer"
        >
          Reset Camera
        </button>
        <button
          type="button"
          onClick={onResetShader}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>
    </aside>
  );
};

interface SideSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

const SideSlider: React.FC<SideSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-300 font-medium">{label}</span>
      <span className="font-mono-tabular text-cyan-300">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-cyan-400 cursor-pointer"
    />
  </div>
);
