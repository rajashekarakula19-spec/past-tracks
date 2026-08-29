import React from 'react';
import { Play, Pause, Square, Gauge, Activity, Clock, Zap } from 'lucide-react';
import { LiveTrackingStats } from '../../types/track';
import { formatDuration } from '../../utils/geoUtils';

interface LiveTrackerBarProps {
  stats: LiveTrackingStats;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const LiveTrackerBar: React.FC<LiveTrackerBarProps> = ({
  stats,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  const isTracking = stats.status === 'recording';
  const isIdle = stats.status === 'idle';

  if (isIdle) {
    return (
      <div className="absolute bottom-6 left-3.5 z-20 pointer-events-auto">
        <button
          onClick={onStart}
          className="py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-black font-black text-xs tracking-wide shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center gap-2 transition-all border border-white"
        >
          <Zap className="w-4 h-4 fill-black text-black" />
          <span>START LIVE TRACKING</span>
        </button>
      </div>
    );
  }

  return (
    /* Ultra-Compact Left-Side Mini HUD (Slim, Space-Saving for Mobile) */
    <div className="absolute bottom-6 left-3.5 z-20 pointer-events-auto flex flex-col gap-1.5 select-none">
      <div className="w-28 sm:w-36 p-2.5 flex flex-col gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.95)] border border-cyan-400/80 bg-[#000000] rounded-xl">
        {/* 1. Speed */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[9px] font-black text-cyan-300 uppercase">
            <Gauge className="w-2.5 h-2.5 text-cyan-400 stroke-[3]" />
            <span>SPEED</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white leading-none">
              {stats.currentSpeedKmh.toFixed(1)}
            </span>
            <span className="text-[9px] font-bold text-cyan-300">km/h</span>
          </div>
        </div>

        <div className="h-px w-full bg-white/20" />

        {/* 2. Distance */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[9px] font-black text-emerald-300 uppercase">
            <Activity className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
            <span>DIST</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white leading-none">
              {stats.distanceKm.toFixed(2)}
            </span>
            <span className="text-[9px] font-bold text-emerald-300">km</span>
          </div>
        </div>

        <div className="h-px w-full bg-white/20" />

        {/* 3. Duration / Time */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[9px] font-black text-purple-300 uppercase">
            <Clock className="w-2.5 h-2.5 text-purple-400 stroke-[3]" />
            <span>TIME</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm sm:text-base font-black font-mono tracking-tight text-white leading-none">
              {formatDuration(stats.durationSeconds * 1000)}
            </span>
          </div>
        </div>

        <div className="h-px w-full bg-white/20" />

        {/* 4. Action Buttons (Pause & Stop) */}
        <div className="flex items-center gap-1 pt-0.5">
          {isTracking ? (
            <button
              onClick={onPause}
              title="Pause"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold border border-white/30 transition-colors flex items-center justify-center shadow-md"
            >
              <Pause className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          ) : (
            <button
              onClick={onResume}
              title="Resume"
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-400 transition-colors flex items-center justify-center shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <button
            onClick={onStop}
            title="Stop & Save"
            className="flex-1 py-1.5 px-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-[10px] flex items-center justify-center gap-1 shadow-md transition-all border border-red-400 uppercase tracking-tight"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>STOP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
