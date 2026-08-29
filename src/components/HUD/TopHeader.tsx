import React from 'react';
import { Calendar, Radio, Cpu, ShieldCheck, Terminal } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { AppMode } from '../../types/track';
import { motion } from 'framer-motion';

interface TopHeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  isTracking: boolean;
  accuracy: number;
  onOpenSimulator: () => void;
  isSimulating: boolean;
  onOpenDevMode: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentMode,
  onSelectMode,
  isTracking,
  accuracy,
  onOpenSimulator,
  isSimulating,
  onOpenDevMode,
}) => {
  return (
    <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
      {/* Brand & Mode Switcher */}
      <GlassCard className="pointer-events-auto px-3.5 py-2 flex items-center gap-3 shadow-xl border-white/15">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(0,242,254,0.5)]">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              PastTracks <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">GPS</span>
            </h1>
            <p className="text-[10px] text-zinc-400">Live Travel Trace & Memory Map</p>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Mode Segmented Controls */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => onSelectMode('live')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentMode === 'live'
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {currentMode === 'live' && (
              <motion.div
                layoutId="active-mode-pill"
                className="absolute inset-0 rounded-lg bg-cyan-500/30 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,242,254,0.3)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
              Live Track
            </span>
          </button>

          <button
            onClick={() => onSelectMode('history')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentMode === 'history'
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {currentMode === 'history' && (
              <motion.div
                layoutId="active-mode-pill"
                className="absolute inset-0 rounded-lg bg-purple-500/30 border border-purple-400/40 shadow-[0_0_12px_rgba(176,0,255,0.3)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
              Past Dates
            </span>
          </button>
        </div>
      </GlassCard>

      {/* Action Badges / GPS Status & Simulator Trigger */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Developer Mode Button (High Contrast on Google Maps) */}
        <button
          onClick={onOpenDevMode}
          title="Developer Mode Controller"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0a0d16]/95 hover:bg-[#151a28] text-cyan-300 border border-cyan-400/60 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.7)] hover:border-cyan-300"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
          <span className="hidden sm:inline">Dev Mode</span>
          <span className="sm:hidden">Dev</span>
        </button>

        {/* Simulator Button (Hidden on Mobile Phone Screens to prevent overlay) */}
        <button
          onClick={onOpenSimulator}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-[0_4px_16px_rgba(0,0,0,0.7)] ${
            isSimulating
              ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(255,183,3,0.5)] animate-pulse'
              : 'bg-[#0a0d16]/95 hover:bg-[#151a28] text-zinc-100 border-white/20 hover:border-white/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
          <span>{isSimulating ? 'Simulating...' : 'Simulator'}</span>
        </button>

        {/* GPS Accuracy Status Badge */}
        <div className="px-3 py-2 rounded-xl bg-[#0a0d16]/95 border border-white/20 text-white shadow-[0_4px_16px_rgba(0,0,0,0.7)] hidden sm:flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span className="text-[11px] font-mono font-semibold text-zinc-100">
            {accuracy > 0 ? `±${accuracy}m GPS` : 'GPS Ready'}
          </span>
        </div>
      </div>
    </header>
  );
};
