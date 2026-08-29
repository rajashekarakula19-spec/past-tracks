import React from 'react';
import { X, Play, Trash2, Calendar, Download } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { TripSession } from '../../types/track';
import { formatHumanDate, formatDistance } from '../../utils/geoUtils';
import { motion } from 'framer-motion';

interface TripStatsCardProps {
  trip: TripSession;
  onClose: () => void;
  onStartReplay: (trip: TripSession) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripStatsCard: React.FC<TripStatsCardProps> = ({
  trip,
  onClose,
  onStartReplay,
  onDeleteTrip,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-6 sm:w-96 z-30 pointer-events-none"
    >
      <GlassCard
        variant="elevated"
        glow="cyan"
        className="pointer-events-auto p-3.5 flex flex-col gap-2.5 shadow-2xl border-cyan-400/40 bg-[#000000] rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0 bg-cyan-400 shadow-[0_0_10px_#00f2fe]" />
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[200px]">
                {trip.title}
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-cyan-400" />
              {formatHumanDate(trip.dateKey)} • {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-zinc-900 border border-white/10 text-center font-mono">
          <div>
            <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Distance</div>
            <div className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5">{formatDistance(trip.distanceKm)}</div>
          </div>
          <div>
            <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Avg Speed</div>
            <div className="text-xs sm:text-sm font-black text-cyan-400 mt-0.5">{trip.avgSpeedKmh.toFixed(1)} km/h</div>
          </div>
          <div>
            <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Max Speed</div>
            <div className="text-xs sm:text-sm font-black text-purple-300 mt-0.5">{trip.maxSpeedKmh.toFixed(1)} km/h</div>
          </div>
        </div>

        {/* Action Buttons: 3D Replay, Export GeoJSON, Delete */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <button
            onClick={() => onStartReplay(trip)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,242,254,0.4)] transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-black text-black" />
            <span>3D Replay</span>
          </button>

          {/* Export GeoJSON / Raw GPS Data */}
          <button
            onClick={() => {
              import('../../services/storage').then(({ exportTripAsGeoJSON }) => {
                exportTripAsGeoJSON(trip);
              });
            }}
            title="Download Raw GPS & Stops Data (GeoJSON)"
            className="p-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors shadow-sm flex items-center justify-center"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteTrip(trip.id)}
            title="Delete this trip from storage"
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
};
