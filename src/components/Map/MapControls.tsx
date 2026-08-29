import React, { useState } from 'react';
import { Crosshair, Layers, Compass, Plus, Minus, Box, Eye, EyeOff } from 'lucide-react';
import { MAP_STYLES, MapStyleOption } from '../../utils/mapStyles';
import { GlassCard } from '../UI/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

interface MapControlsProps {
  onRecenter: () => void;
  onToggle3D: () => void;
  is3D: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  currentStyleId: string;
  onSelectStyle: (style: MapStyleOption) => void;
  isGpsLocked: boolean;
  isRouteVisible: boolean;
  onToggleRouteVisibility: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onRecenter,
  onToggle3D,
  is3D,
  onZoomIn,
  onZoomOut,
  onResetNorth,
  currentStyleId,
  onSelectStyle,
  isGpsLocked,
  isRouteVisible,
  onToggleRouteVisibility,
}) => {
  const [showLayers, setShowLayers] = useState(false);

  return (
    <>
      {/* 1. Upper-Right Secondary Controls (Layers, 3D, Compass, Zoom) */}
      <div className="absolute right-4 top-20 z-30 flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* Main Controls Card */}
        <GlassCard className="p-1 flex flex-col gap-1.5 shadow-lg border-white/15 bg-[#0a0d16]/90">
          {/* Route Visibility Toggle (Eye) */}
          <button
            onClick={onToggleRouteVisibility}
            title={isRouteVisible ? 'Hide Route Lines on Map' : 'Show Route Lines on Map'}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              isRouteVisible
                ? 'bg-emerald-500/25 text-emerald-300 shadow-[0_0_15px_rgba(0,255,136,0.3)] border border-emerald-400/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {isRouteVisible ? (
              <Eye className="w-5 h-5 text-emerald-400" />
            ) : (
              <EyeOff className="w-5 h-5 text-rose-400" />
            )}
          </button>

          {/* 3D Tilt Toggle */}
          <button
            onClick={onToggle3D}
            title={is3D ? 'Switch to 2D Top View' : 'Switch to 3D Perspective'}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center font-bold text-xs ${
              is3D
                ? 'bg-purple-500/25 text-purple-300 shadow-[0_0_15px_rgba(176,0,255,0.4)] border border-purple-400/40'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Box className="w-5 h-5" />
          </button>

          {/* Layer Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setShowLayers(!showLayers)}
              title="Change Map Style"
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                showLayers
                  ? 'bg-white/20 text-white'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>

            {/* Layer Selection Dropdown */}
            <AnimatePresence>
              {showLayers && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  className="absolute right-12 top-0 w-44 z-30"
                >
                  <GlassCard variant="elevated" className="p-2 flex flex-col gap-1.5 shadow-2xl border-white/20 bg-[#0a0d16]">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-2 py-1">
                      Map Style
                    </div>
                    {MAP_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          onSelectStyle(style);
                          setShowLayers(false);
                        }}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                          currentStyleId === style.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/30 flex-shrink-0"
                          style={{ backgroundColor: style.previewColor }}
                        />
                        <span className="truncate">{style.name}</span>
                      </button>
                    ))}
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Compass / Reset North */}
          <button
            onClick={onResetNorth}
            title="Reset Bearing (North Up)"
            className="p-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
          >
            <Compass className="w-5 h-5" />
          </button>
        </GlassCard>

        {/* Zoom In / Zoom Out */}
        <GlassCard className="p-1 flex flex-col gap-1 shadow-lg border-white/15 bg-[#0a0d16]/90">
          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <Minus className="w-4 h-4" />
          </button>
        </GlassCard>
      </div>

      {/* 2. DEDICATED BOTTOM-RIGHT "CENTER ON MY LOCATION" FLOATING BUTTON (Thumb-Friendly on Mobile) */}
      <div className="absolute bottom-6 right-3.5 sm:bottom-8 sm:right-6 z-30 pointer-events-auto">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onRecenter}
          title="Center map on my location"
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.85)] border-2 transition-all ${
            isGpsLocked
              ? 'bg-[#000000] border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(0,242,254,0.6)] ring-2 ring-cyan-500/40'
              : 'bg-[#000000] border-white/30 text-white hover:border-cyan-400 hover:text-cyan-300'
          }`}
        >
          <Crosshair className={`w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5] ${isGpsLocked ? 'text-cyan-400' : 'text-white'}`} />
        </motion.button>
      </div>
    </>
  );
};
