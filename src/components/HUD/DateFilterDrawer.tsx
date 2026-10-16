import React, { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Eye, EyeOff, Play, X, Trash2, CheckSquare, Square as SquareIcon, Route, Compass, ArrowUpRight, Download, ShieldCheck } from 'lucide-react';
import { TripSession, DateGroupedTrips, LiveTrackingStats } from '../../types/track';
import { formatHumanDate, formatDistance, formatDuration, formatDateKey, formatSpeed, getTripStops } from '../../utils/geoUtils';
import './journey-panel.css';

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

  const displayedDistance = activeTrips.reduce((sum, trip) => sum + trip.distanceKm, 0);
  const toggleDate = (date: string | null) => {
    onSelectDate(date);
    onSelectTrip(null);
    setSelectedTripIds(new Set());
  };

  return (
    <aside className="journey-panel" aria-label="Past journeys">
      <header className="journey-panel-header">
        <div className="journey-panel-heading">
          <span className="journey-icon"><Route size={23} /></span>
          <div><span className="journey-eyebrow">YOUR PERSONAL TRAVEL JOURNAL</span><h2>Past journeys<span>.</span></h2></div>
          {onCloseMobileDrawer && <button className="journey-icon-button mobile-map-back" onClick={onCloseMobileDrawer} aria-label="Back to map"><X size={20} /></button>}
        </div>
        <div className="journey-toolbar">
          <span className="journey-count">{totalTripsCount} saved {totalTripsCount === 1 ? 'journey' : 'journeys'}</span>
          <div>
            {activeTrips.length > 0 && <button className={`journey-small-button ${isSelectMode ? 'is-active' : ''}`} aria-pressed={isSelectMode} onClick={() => { setIsSelectMode(!isSelectMode); setSelectedTripIds(new Set()); }}>{isSelectMode ? 'Cancel' : 'Select'}</button>}
            <button className="journey-small-button" onClick={onToggleRouteVisibility} aria-pressed={isRouteVisible} title={isRouteVisible ? 'Hide routes on map' : 'Show routes on map'}>{isRouteVisible ? <Eye size={14} /> : <EyeOff size={14} />}{isRouteVisible ? 'Routes on' : 'Routes off'}</button>
          </div>
        </div>
      </header>

      <nav className="journey-dates" aria-label="Filter journeys by date">
        <button className={`journey-date ${selectedDate === null ? 'is-active' : ''}`} aria-pressed={selectedDate === null} onClick={() => toggleDate(null)}><CalendarIcon size={13} />All dates</button>
        {dateKeys.map((key) => <button key={key} className={`journey-date ${selectedDate === key ? 'is-active' : ''}`} aria-pressed={selectedDate === key} onClick={() => toggleDate(key)}>{key === todayKey && <span className={`journey-dot ${isLiveRecording ? 'is-recording' : ''}`} />}{formatHumanDate(key)}</button>)}
      </nav>

      {isSelectMode && <div className="journey-selection-bar"><button onClick={handleToggleSelectAll}>{selectedTripIds.size === activeTrips.length ? <CheckSquare size={16} /> : <SquareIcon size={16} />}{selectedTripIds.size === activeTrips.length ? 'Deselect all' : 'Select all'}</button><span>{selectedTripIds.size} selected</span></div>}

      <div className="journey-list">
        <div className="journey-list-label"><span>{selectedDate ? formatHumanDate(selectedDate) : 'All your journeys'}</span><span>{activeTrips.length} {activeTrips.length === 1 ? 'trip' : 'trips'}</span></div>
        {isTodaySelected && isLiveRecording && liveStats && !isSelectMode && <div className="journey-live"><span className="journey-dot is-recording" /><div><strong>A new story is unfolding</strong><span>{formatDistance(liveStats.distanceKm)} · {formatDuration(liveStats.durationSeconds * 1000)} · {formatSpeed(liveStats.currentSpeedKmh)}</span></div></div>}
        {activeTrips.length === 0 ? <div className="journey-empty"><span className="journey-icon"><MapPin size={26} /></span><h3>{isTodaySelected ? 'A fresh day, a new route.' : 'No journeys here just yet.'}</h3><p>{isTodaySelected ? 'Your next journey starts with a single step. Head out and make a memory.' : 'Choose another date to revisit a journey.'}</p>{isTodaySelected && !isLiveRecording && onStartLiveTracking && <button className="journey-primary" onClick={onStartLiveTracking}><Play size={14} />Start a journey</button>}</div> : activeTrips.map((trip) => {
          const isSelected = selectedTrip?.id === trip.id;
          const isChecked = selectedTripIds.has(trip.id);
          const checkpointCount = getTripStops(trip).length;
          return <article key={trip.id} className={`saved-journey ${isSelected || isChecked ? 'is-selected' : ''}`}>
            <div className="saved-journey-header">
              <button className="saved-journey-open" onClick={() => handleTripCardClick(trip)} aria-label={isSelectMode ? `${isChecked ? 'Deselect' : 'Select'} ${trip.title}` : `View ${trip.title} on map`} aria-pressed={isSelectMode ? isChecked : undefined}>
                <span className="journey-icon">{isSelectMode ? isChecked ? <CheckSquare size={21} /> : <SquareIcon size={21} /> : <Route size={22} />}</span>
                <span className="saved-journey-title"><strong>{trip.title}</strong><span>{new Date(trip.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {trip.isSimulated ? 'Sample journey' : 'Saved journey'}{checkpointCount > 0 && ` · ${checkpointCount} ${checkpointCount === 1 ? 'checkpoint' : 'checkpoints'}`}</span></span>
              </button>
              <span className="journey-mode">{trip.transportMode}</span>
            </div>
            <div className="saved-journey-main">
              <dl className="journey-metric-pair"><div><dd>{formatDistance(trip.distanceKm)}</dd><dt>Distance</dt></div><div><dd>{formatDuration(trip.durationMs)}</dd><dt>Journey time</dt></div></dl>
              {!isSelectMode && <button className="journey-replay" onClick={() => { onStartReplay(trip); }} aria-label={`Replay ${trip.title}`} title="Replay journey"><Play size={18} fill="currentColor" /></button>}
            </div>
            <div className="saved-journey-footer"><span>{formatSpeed(trip.avgSpeedKmh)} <span>avg. speed</span></span>{!isSelectMode && <div><button className="journey-view-link" onClick={() => handleTripCardClick(trip)}>View route <ArrowUpRight size={13} /></button><button className="journey-icon-button journey-delete" onClick={() => onDeleteTrip(trip.id)} aria-label={`Delete ${trip.title}`} title="Delete journey"><Trash2 size={14} /></button></div>}</div>
          </article>;
        })}
      </div>

      <footer className="journey-panel-footer">
        {isSelectMode ? <button className="journey-danger-button" disabled={selectedTripIds.size === 0} onClick={handleDeleteSelected}><Trash2 size={15} />Delete selected ({selectedTripIds.size})</button> : <>
          <div className="journey-summary"><div><span className="journey-eyebrow">{selectedDate ? 'DISTANCE THIS DAY' : 'DISTANCE ALL TIME'}</span><strong>{formatDistance(selectedDate ? displayedDistance : totalDistanceAll)}</strong></div><span className="journey-icon"><Compass size={22} /></span></div>
          <div className="journey-backup-actions"><button className="journey-export" onClick={() => { const trips = Object.values(groupedTrips).flat(); if (!trips.length) { alert('No trips to export yet.'); return; } import('../../services/storage').then(({ exportTripsAsJSON }) => exportTripsAsJSON(trips)); }}><Download size={14} />Export all</button>{onClearAllTrips && totalTripsCount > 0 && <button className="journey-clear" onClick={onClearAllTrips}><Trash2 size={13} />Delete all</button>}</div>
          <span className="journey-storage-note"><ShieldCheck size={11} />Saved in this browser. Export to keep a backup.</span>
        </>}
      </footer>
    </aside>
  );
};
