import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Gift,
  MessageSquare,
  RotateCcw,
  Sliders,
  Sparkles,
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

interface BottomControlDockProps {
  expanded: boolean;
  onToggleExpanded: () => void;
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
}

type DockTab = 'gifts' | 'shader' | 'postfx' | 'livebridge';

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  expanded,
  onToggleExpanded,
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
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('gifts');

  return (
    <div className="pointer-events-none fixed bottom-2.5 left-1/2 -translate-x-1/2 z-30 w-[min(920px,95vw)] flex flex-col items-center">
      {/* Collapse / Expand Toggle */}
      <button
        type="button"
        onClick={onToggleExpanded}
        className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1 rounded-t-lg bg-[#0D1320]/95 border border-b-0 border-slate-700/80 text-[11px] font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        <span>{expanded ? 'Hide Controls' : 'Show Controls & Gifts'}</span>
      </button>

      {expanded && (
        <div className="pointer-events-auto w-full rounded-xl bg-[#0B101B]/95 border border-slate-700/80 shadow-2xl p-3">
          {/* Dock Tab Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
            <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('gifts')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'gifts'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Live Gifts</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shader')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'shader'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Cel & Rim</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('postfx')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'postfx'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>URP Post-FX</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('livebridge')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'livebridge'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>LiveBridge</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-slate-400">
              <span className="hidden md:inline">
                Pool {match.activeParticles}/{match.particlePoolSize}
              </span>
              <button
                type="button"
                onClick={onResetCamera}
                className="px-2.5 py-1 text-xs font-sans font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reset Cam
              </button>
              <button
                type="button"
                onClick={onResetShader}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Defaults</span>
              </button>
            </div>
          </div>

          {/* Tab: Live Gifts & Chat Triggers */}
          {activeTab === 'gifts' && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center p-0.5 rounded-md bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => onSelectSenderTeam('boy')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeSenderTeam === 'girl'
                        ? 'bg-pink-500 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Team Girl
                  </button>
                </div>

                <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[240px]">
                  {match.lastActionLabel}
                </span>

                <button
                  type="button"
                  onClick={() => onChatSpam(activeSenderTeam)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Spam +10x</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
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
                      className={`flex flex-col items-start px-2.5 py-1.5 rounded-md border text-left transition-colors cursor-pointer ${tierAccent}`}
                    >
                      <div className="w-full flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold truncate">{gift.skillName}</span>
                        <span className="font-mono-tabular text-[10px] opacity-75">
                          T{gift.tier}
                        </span>
                      </div>
                      <span className="font-mono-tabular text-[10px] opacity-80 truncate w-full">
                        {gift.name} · {gift.coins.toLocaleString()}c
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Cel & Rim Shader */}
          {activeTab === 'shader' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SliderControl
                label="Cel Bands"
                value={shaderConfig.celSteps}
                min={2}
                max={5}
                step={1}
                display={`${shaderConfig.celSteps} steps`}
                onChange={(v) => onUpdateShader({ celSteps: v })}
              />
              <SliderControl
                label="Fresnel Rim Power"
                value={shaderConfig.rimPower}
                min={1.2}
                max={5.0}
                step={0.1}
                display={shaderConfig.rimPower.toFixed(1)}
                onChange={(v) => onUpdateShader({ rimPower: v })}
              />
              <SliderControl
                label="Rim Intensity"
                value={shaderConfig.rimIntensity}
                min={0.2}
                max={3.0}
                step={0.05}
                display={shaderConfig.rimIntensity.toFixed(2)}
                onChange={(v) => onUpdateShader({ rimIntensity: v })}
              />
              <SliderControl
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

          {/* Tab: URP Post-FX */}
          {activeTab === 'postfx' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <SliderControl
                label="Bloom Intensity"
                value={shaderConfig.bloomStrength}
                min={0}
                max={1.8}
                step={0.05}
                display={shaderConfig.bloomStrength.toFixed(2)}
                onChange={(v) => onUpdateShader({ bloomStrength: v })}
              />
              <SliderControl
                label="Bloom Threshold"
                value={shaderConfig.bloomThreshold}
                min={0.2}
                max={1.1}
                step={0.02}
                display={shaderConfig.bloomThreshold.toFixed(2)}
                onChange={(v) => onUpdateShader({ bloomThreshold: v })}
              />
              <SliderControl
                label="Chromatic Base"
                value={shaderConfig.chromaticBase}
                min={0}
                max={0.008}
                step={0.0002}
                display={(shaderConfig.chromaticBase * 1000).toFixed(1)}
                onChange={(v) => onUpdateShader({ chromaticBase: v })}
              />
              <SliderControl
                label="Saturation"
                value={shaderConfig.saturation}
                min={0.7}
                max={1.7}
                step={0.02}
                display={`${Math.round(shaderConfig.saturation * 100)}%`}
                onChange={(v) => onUpdateShader({ saturation: v })}
              />
              <SliderControl
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

          {/* Tab: LiveBridge */}
          {activeTab === 'livebridge' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer">
                <span className="text-slate-200 font-medium">Auto Live Stream Sim</span>
                <input
                  type="checkbox"
                  checked={liveBridgeConfig.autoBattle}
                  onChange={(e) => onUpdateLiveBridge({ autoBattle: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer">
                <span className="text-slate-200 font-medium">Dynamic Handicap</span>
                <input
                  type="checkbox"
                  checked={liveBridgeConfig.handicapEnabled}
                  onChange={(e) => onUpdateLiveBridge({ handicapEnabled: e.target.checked })}
                  className="accent-amber-400 w-4 h-4"
                />
              </label>
              <SliderControl
                label="Max Comeback Boost"
                value={liveBridgeConfig.handicapMaxBoost}
                min={1.1}
                max={2.5}
                step={0.05}
                display={`${liveBridgeConfig.handicapMaxBoost.toFixed(2)}x`}
                onChange={(v) => onUpdateLiveBridge({ handicapMaxBoost: v })}
              />
              <SliderControl
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
      )}
    </div>
  );
};

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
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
