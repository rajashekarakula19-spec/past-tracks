import React from 'react';
import { X, Play, Square, Cpu, Car, Footprints } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { SIMULATION_PRESETS, SimulationPreset } from '../../services/gpsSimulator';
import { motion } from 'framer-motion';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSimulating: boolean;
  onStartSimulation: (preset: SimulationPreset) => void;
  onStopSimulation: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  isSimulating,
  onStartSimulation,
  onStopSimulation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md"
      >
        <GlassCard
          variant="elevated"
          glow="cyan"
          className="p-5 flex flex-col gap-4 shadow-2xl border-white/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  GPS Simulator (Indoor / Desk Mode)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Streams real-time phone coordinates to test glowing line drawing
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preset list */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
              Select Route to Stream
            </div>
            {SIMULATION_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-black/40 text-cyan-300 mt-0.5">
                    {preset.type === 'drive' ? (
                      <Car className="w-4 h-4" />
                    ) : (
                      <Footprints className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{preset.name}</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{preset.description}</p>
                    <span className="text-[10px] font-mono text-cyan-300 mt-1 inline-block">
                      Avg {preset.avgSpeedKmh} km/h • {preset.rawCoords.length} road waypoints
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onStartSimulation(preset);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all whitespace-nowrap shadow-sm"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start</span>
                </button>
              </div>
            ))}
          </div>

          {/* Active status or stop */}
          {isSimulating && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Simulation currently running</span>
              </div>
              <button
                onClick={() => {
                  onStopSimulation();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-all"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};
