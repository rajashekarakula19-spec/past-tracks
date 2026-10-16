import React from 'react';
import { Play, Pause, RotateCcw, X, Route } from 'lucide-react';
import { TripSession } from '../../types/track';
import { formatDuration, formatSpeed } from '../../utils/geoUtils';

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

export const HistoryScrubber: React.FC<HistoryScrubberProps> = ({ trip, currentPointIndex, onScrub, isPlaying, onTogglePlay, onReset, playbackSpeed, onChangeSpeed, onExitReplay }) => {
  const point = trip.points[currentPointIndex] || trip.points[0];
  const elapsed = point ? Math.max(0, point.timestamp - trip.startTime) : 0;
  return <section className="replay-panel" aria-label="Journey replay">
    <div className="replay-heading"><span className="activity-symbol"><Route size={20} /></span><div><span className="app-kicker">A JOURNEY WORTH REVISITING</span><h2>{trip.title}</h2></div><button className="app-icon-button" onClick={onExitReplay} aria-label="Exit replay"><X size={18} /></button></div>
    <div className="replay-telemetry"><span>{formatDuration(elapsed)} <span>/ {formatDuration(trip.durationMs)}</span></span><span>{formatSpeed(point?.speedKmh ?? 0)}{point?.altitude != null && <span> · {point.altitude} m elevation</span>}</span></div>
    <input className="replay-range" type="range" aria-label="Journey playback position" min={0} max={Math.max(0, trip.points.length - 1)} value={currentPointIndex} onChange={e => onScrub(Number(e.target.value))} />
    <div className="replay-actions"><div><button className="app-icon-button" onClick={onReset} aria-label="Restart replay"><RotateCcw size={17} /></button><button className="app-primary-button" onClick={onTogglePlay}>{isPlaying ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}{isPlaying ? 'Pause' : 'Play'}</button></div><div className="replay-speeds" aria-label="Playback speed">{[1, 2, 5, 10].map(speed => <button key={speed} className={playbackSpeed === speed ? 'is-active' : ''} aria-pressed={playbackSpeed === speed} aria-label={`Playback speed ${speed} times`} onClick={() => onChangeSpeed(speed)}>{speed}×</button>)}</div></div>
  </section>;
};
