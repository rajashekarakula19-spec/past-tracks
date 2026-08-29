import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { TripSession } from '../../types/track';
import { formatDuration } from '../../utils/geoUtils';

interface HistoryScrubberProps {
  trip: TripSession;
  currentPointIndex: number;
  onScrub: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onExitReplay: () => void;
}

export const HistoryScrubber: React.FC<HistoryScrubberProps> = ({
  trip,
  currentPointIndex,
  onScrub,
  isPlaying,
  onTogglePlay,
  onReset,
  playbackSpeed,
  onChangeSpeed,
  onExitReplay,
}) => {
  const currentPoint = trip.points[currentPointIndex] || trip.points[0];

  const elapsedTimeMs = currentPoint
    ? currentPoint.timestamp - trip.startTime
    : 0;

  const speedOptions = [1, 2, 5, 10];

  return (
    <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col items-center pointer-events-none max-w-2xl mx-auto">
      <GlassCard
        variant="elevated"
        glow="purple"
        className="pointer-events-auto w-full p-4 flex flex-col gap-3 shadow-2xl border-white/20"
      >
        {/* Top Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white truncate max-w-[200px]">
              {trip.title}
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded">
              3D Follow-Cam Replay
            </span>
          </div>

          <button
            onClick={onExitReplay}
            className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕ Exit Replay
          </button>
        </div>

        {/* Telemetry Snapshot during scrubber replay */}
        <div className="flex items-center justify-between text-xs font-mono px-1">
          <div className="text-purple-300 font-bold">
            {formatDuration(elapsedTimeMs)} / {formatDuration(trip.durationMs)}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-cyan-300">
              Speed: <span className="font-bold">{currentPoint?.speedKmh.toFixed(1) || 0}</span> km/h
            </span>
            {currentPoint?.altitude !== null && currentPoint?.altitude !== undefined && (
              <span className="text-emerald-300">
                Alt: <span className="font-bold">{currentPoint.altitude}</span>m
              </span>
            )}
          </div>
        </div>

        {/* Interactive Scrub Slider */}
        <div className="relative flex items-center py-1">
          <input
            type="range"
            min={0}
            max={trip.points.length - 1}
            value={currentPointIndex}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
          />
        </div>

        {/* Playback Controls & Speed Multipliers */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              title="Restart from beginning"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(176,0,255,0.4)] border border-purple-400/40 transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>
          </div>

          {/* Speed Selector (1x, 2x, 5x, 10x) */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeSpeed(speed)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                  playbackSpeed === speed
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
