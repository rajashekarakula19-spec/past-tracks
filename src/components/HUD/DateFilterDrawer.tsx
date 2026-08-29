import React, { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Globe, Eye, EyeOff, Play, ArrowLeft, X, Trash2, CheckSquare, Square as SquareIcon } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { TripSession, DateGroupedTrips, LiveTrackingStats } from '../../types/track';
import { formatHumanDate, formatDistance, formatDuration, formatDateKey } from '../../utils/geoUtils';
import { motion } from 'framer-motion';

interface DateFilterDrawerProps {
  groupedTrips: DateGroupedTrips;
  selectedDate: string | null;
  onSelectDate: (dateKey: string | null) => void;
  selectedTrip: TripSession | null;
  onSelectTrip: (trip: TripSession | null) => void;
  onStartReplay: (trip: TripSession) => void;
  onDeleteTrip: (tripId: string) => void;
  onDeleteTrips?: (tripIds: string[]) => void;
  isRouteVisible: boolean;
  onToggleRouteVisibility: () => void;
  liveStats?: LiveTrackingStats;
  onStartLiveTracking?: () => void;
  onCloseMobileDrawer?: () => void;
  onClearAllTrips?: () => void;
}

export const DateFilterDrawer: React.FC<DateFilterDrawerProps> = ({
  groupedTrips,
  selectedDate,
  onSelectDate,
  selectedTrip,
  onSelectTrip,
  onStartReplay,
  onDeleteTrip,
  onDeleteTrips,
  isRouteVisible,
  onToggleRouteVisibility,
  liveStats,
  onStartLiveTracking,
  onCloseMobileDrawer,
  onClearAllTrips,
}) => {
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());

  const todayKey = formatDateKey(Date.now());

  // Always ensure Today (Present Day) is included and pinned first
  const dateKeys = Array.from(new Set([todayKey, ...Object.keys(groupedTrips)])).sort(
    (a, b) => b.localeCompare(a)
  );

  const totalTripsCount = Object.values(groupedTrips).flat().length;
  const totalDistanceAll = Object.values(groupedTrips)
    .flat()
    .reduce((acc, t) => acc + t.distanceKm, 0);

  const isTodaySelected = selectedDate === todayKey;
  const isLiveRecording = liveStats?.status === 'recording';

  // Trips to display
  const activeTrips = selectedDate
    ? groupedTrips[selectedDate] || []
    : Object.values(groupedTrips).flat();

  const handleTripCardClick = (trip: TripSession) => {
    if (isSelectMode) {
      // Toggle selection in multi-select mode
      const next = new Set(selectedTripIds);
      if (next.has(trip.id)) {
        next.delete(trip.id);
      } else {
        next.add(trip.id);
      }
      setSelectedTripIds(next);
    } else {
      // View on map
      onSelectTrip(trip);
      if (onCloseMobileDrawer) {
        onCloseMobileDrawer();
      }
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedTripIds.size === activeTrips.length) {
      setSelectedTripIds(new Set());
    } else {
      setSelectedTripIds(new Set(activeTrips.map((t) => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTripIds.size === 0) return;
    const count = selectedTripIds.size;
    if (confirm(`Delete the ${count} selected trip${count > 1 ? 's' : ''}?`)) {
      if (onDeleteTrips) {
        onDeleteTrips(Array.from(selectedTripIds));
      } else {
        selectedTripIds.forEach((id) => onDeleteTrip(id));
      }
      setSelectedTripIds(new Set());
      setIsSelectMode(false);
    }
  };

  return (
    <aside className="fixed inset-0 sm:inset-auto sm:left-4 sm:top-20 sm:bottom-24 z-40 sm:z-20 w-full sm:w-96 flex flex-col pointer-events-auto bg-[#090b11] sm:bg-transparent transition-all">
      <GlassCard
        variant="elevated"
        className="flex flex-col h-full overflow-hidden shadow-2xl border-white/15 bg-[#0a0d16] sm:bg-[#0a0d16]/95 rounded-none sm:rounded-2xl"
      >
        {/* Header with Mobile Back to Map Button & Select Mode Toggle */}
        <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2">
            {onCloseMobileDrawer && !isSelectMode && (
              <button
                onClick={onCloseMobileDrawer}
                className="sm:hidden p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Map</span>
              </button>
            )}
            <CalendarIcon className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              {isTodaySelected ? 'Today (Present Day)' : 'Travels for the Day'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Select & Delete Multi-Select Toggle */}
            {activeTrips.length > 0 && (
              <button
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedTripIds(new Set());
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  isSelectMode
                    ? 'bg-amber-500 text-black border-amber-300 shadow-sm'
                    : 'bg-white/10 text-zinc-300 hover:text-white border-white/20'
                }`}
              >
                {isSelectMode ? 'Cancel' : 'Select'}
              </button>
            )}

            {/* Show / Hide Lines Toggle Button */}
            {!isSelectMode && (
              <button
                onClick={onToggleRouteVisibility}
                title={isRouteVisible ? 'Make route lines invisible' : 'Make route lines visible'}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  isRouteVisible
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {isRouteVisible ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hidden</span>
                  </>
                )}
              </button>
            )}

            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {totalTripsCount} trips
            </span>

            {onCloseMobileDrawer && !isSelectMode && (
              <button
                onClick={onCloseMobileDrawer}
                className="sm:hidden p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Date Selector Pills (Horizontal Scroll) */}
        <div className="p-3 border-b border-white/10 bg-black/30 flex gap-2 overflow-x-auto no-scrollbar">
          {dateKeys.map((key) => {
            const isSelected = selectedDate === key;
            const isToday = key === todayKey;
            const dayTrips = groupedTrips[key] || [];
            const dayDist = dayTrips.reduce((acc, t) => acc + t.distanceKm, 0);

            return (
              <button
                key={key}
                onClick={() => {
                  onSelectDate(key);
                  onSelectTrip(null);
                  setSelectedTripIds(new Set());
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? isToday
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,254,0.4)]'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/50 shadow-[0_0_15px_rgba(176,0,255,0.4)]'
                    : isToday
                    ? 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-white/5'
                }`}
              >
                {isToday && (
                  <span className={`w-2 h-2 rounded-full ${isLiveRecording ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                )}
                <span>{isToday ? '📍 Today (Present)' : formatHumanDate(key)}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {dayDist > 0 ? `(${dayDist.toFixed(1)}km)` : isToday ? '(Live)' : '(0km)'}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
              onSelectDate(null);
              onSelectTrip(null);
              setSelectedTripIds(new Set());
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedDate === null
                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                : 'bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Show All Dates</span>
          </button>
        </div>

        {/* Selection Bar (When Select Mode is Active) */}
        {isSelectMode && (
          <div className="px-3 py-2 bg-amber-500/15 border-b border-amber-400/30 flex items-center justify-between text-xs font-mono">
            <button
              onClick={handleToggleSelectAll}
              className="text-amber-300 font-bold flex items-center gap-1.5 hover:underline"
            >
              {selectedTripIds.size === activeTrips.length ? (
                <>
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <SquareIcon className="w-4 h-4 text-amber-400" />
                  <span>Select All ({activeTrips.length})</span>
                </>
              )}
            </button>
            <span className="text-zinc-300 font-bold">
              {selectedTripIds.size} selected
            </span>
          </div>
        )}

        {/* Trips List for Selected Date */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {/* Active Live Tracking Banner if Today is selected */}
          {isTodaySelected && isLiveRecording && liveStats && !isSelectMode && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,242,254,0.15)] flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>Currently Tracking Live</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-200 bg-cyan-500/20 px-2 py-0.5 rounded">
                  {liveStats.currentSpeedKmh.toFixed(1)} km/h
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-300 pt-1 border-t border-cyan-500/20">
                <div>Distance: <span className="font-bold text-white">{liveStats.distanceKm.toFixed(2)} km</span></div>
                <div>Points: <span className="font-bold text-white">{liveStats.pointsCount}</span></div>
              </div>
            </motion.div>
          )}

          {activeTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-zinc-500">
              <MapPin className="w-8 h-8 mb-2 opacity-40 text-cyan-400" />
              <p className="text-xs text-zinc-300 font-medium">
                {isTodaySelected ? 'No trips recorded yet today.' : 'No recorded traces for this date.'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {isTodaySelected
                  ? 'Tap below to start tracking your travel today!'
                  : 'Select Today or another date from above.'}
              </p>

              {isTodaySelected && !isLiveRecording && onStartLiveTracking && (
                <button
                  onClick={onStartLiveTracking}
                  className="mt-3.5 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-[0_0_15px_rgba(0,242,254,0.4)] border border-cyan-400/40 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Live Tracking Today</span>
                </button>
              )}
            </div>
          ) : (
            activeTrips.map((trip) => {
              const isSelected = selectedTrip?.id === trip.id;
              const isChecked = selectedTripIds.has(trip.id);

              return (
                <motion.div
                  key={trip.id}
                  layout
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleTripCardClick(trip)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(255,183,3,0.25)] ring-1 ring-amber-400'
                      : isSelected
                      ? 'bg-cyan-500/20 border-cyan-400/80 shadow-[0_0_20px_rgba(0,242,254,0.3)]'
                      : 'bg-white/[0.05] hover:bg-white/[0.09] border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Multi-Select Checkbox Indicator */}
                      {isSelectMode ? (
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-amber-400 border-amber-300 text-black font-black text-xs'
                              : 'bg-black/40 border-white/30 text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                      ) : (
                        <span className="w-3 h-3 rounded-full flex-shrink-0 bg-cyan-400 shadow-[0_0_10px_#00f2fe]" />
                      )}
                      <h3 className="text-xs font-bold text-white truncate max-w-[170px]">
                        {trip.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      {trip.transportMode}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-white/10 text-[11px] font-mono">
                    <div>
                      <div className="text-[9px] text-zinc-400 uppercase font-bold">Distance</div>
                      <div className="text-white font-black">{formatDistance(trip.distanceKm)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-400 uppercase font-bold">Duration</div>
                      <div className="text-zinc-200">{formatDuration(trip.durationMs)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-zinc-400 uppercase font-bold">Avg Speed</div>
                      <div className="text-zinc-200">{trip.avgSpeedKmh.toFixed(1)} km/h</div>
                    </div>
                  </div>

                  {/* Card Actions: Prompt, 3D Replay, and Direct Delete Trash Icon */}
                  {!isSelectMode && (
                    <div className="mt-2.5 flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
                      <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                        👉 Tap to view trace
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartReplay(trip);
                            if (onCloseMobileDrawer) onCloseMobileDrawer();
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors"
                        >
                          <span>⚡ Replay</span>
                        </button>

                        {/* Individual Direct Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrip(trip.id);
                          }}
                          title="Delete this journey"
                          className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer: Multi-Select Delete Action or Standard Summary */}
        <div className="p-3 border-t border-white/10 bg-black/50 flex flex-col gap-2.5">
          {isSelectMode ? (
            /* Multi-Select Action Bar */
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedTripIds(new Set());
                }}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedTripIds.size === 0}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  selectedTripIds.size > 0
                    ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({selectedTripIds.size})</span>
              </button>
            </div>
          ) : (
            /* Standard Summary & Backup */
            <>
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>{selectedDate ? formatHumanDate(selectedDate) : 'All-Time Total'}</span>
                <span className="text-cyan-400 font-black">
                  {selectedDate
                    ? `${(groupedTrips[selectedDate] || []).reduce((a, t) => a + t.distanceKm, 0).toFixed(2)} km`
                    : `${totalDistanceAll.toFixed(2)} km`}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                <button
                  onClick={() => {
                    const allTrips = Object.values(groupedTrips).flat();
                    if (allTrips.length === 0) {
                      alert('No trips to export yet.');
                      return;
                    }
                    import('../../services/storage').then(({ exportTripsAsJSON }) => {
                      exportTripsAsJSON(allTrips);
                    });
                  }}
                  title="Export all trips as JSON for Google Drive / iCloud Backup"
                  className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <span>📥 Export All</span>
                </button>

                {onClearAllTrips && totalTripsCount > 0 && (
                  <button
                    onClick={onClearAllTrips}
                    title="Delete all past journeys"
                    className="py-1.5 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                  >
                    <span>🗑️ Delete All</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </aside>
  );
};
