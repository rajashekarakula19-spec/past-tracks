import React, { useState } from 'react';
import { Play, Pause, Square, Route, ArrowUpRight, LocateFixed, ShieldCheck } from 'lucide-react';
import { LiveTrackingStats } from '../../types/track';
import { formatDuration } from '../../utils/geoUtils';

interface LiveTrackerBarProps {
  stats: LiveTrackingStats;
  onStart: () => void | Promise<void>;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void | Promise<void>;
  onBrowseJourneys: () => void;
  isSimulating?: boolean;
}

export const LiveTrackerBar: React.FC<LiveTrackerBarProps> = ({ stats, onStart, onPause, onResume, onStop, onBrowseJourneys, isSimulating }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isIdle = stats.status === 'idle';
  const isTracking = stats.status === 'recording';
  const runAction = async (action: () => void | Promise<void>) => {
    setBusy(true); setError('');
    try { await action(); } catch { setError('Something went wrong. Please try again.'); } finally { setBusy(false); }
  };
  return <section className="activity-panel" aria-label="Journey recorder">
    <div className="activity-heading"><span className="activity-symbol"><Route size={22} /></span><div><span className="app-kicker">{isSimulating ? 'DEMO JOURNEY' : isIdle ? 'YOUR NEXT CHAPTER' : 'YOUR JOURNEY'}</span><h2>{isIdle ? 'Take the scenic way.' : isTracking ? 'You’re on your way.' : 'A moment to pause.'}</h2></div>{!isIdle && <span className={`activity-status ${isTracking ? 'is-recording' : ''}`} role="status"><span />{isTracking ? 'Recording' : 'Paused'}</span>}</div>
    {isIdle ? <><p className="activity-intro">A morning walk or a new adventure. Keep a little piece of wherever you go.</p><div className="activity-ready"><LocateFixed size={15} /><span>{stats.accuracy > 0 ? 'Location found. You’re ready to explore.' : 'Allow location access to record your route.'}</span></div><button className="app-primary-button activity-start" onClick={() => runAction(onStart)} disabled={busy}><Play size={16} fill="currentColor" />{busy ? 'Getting ready…' : 'Start a journey'}<ArrowUpRight size={18} /></button><button className="activity-browse" onClick={onBrowseJourneys}>Explore your saved journeys <ArrowUpRight size={13} /></button></> : <><dl className="activity-metrics"><div><dd>{stats.distanceKm.toFixed(2)} <small>km</small></dd><dt>Distance</dt></div><div><dd>{formatDuration(stats.durationSeconds * 1000)}</dd><dt>Time elapsed</dt></div><div><dd>{stats.currentSpeedKmh.toFixed(1)} <small>km/h</small></dd><dt>Current speed</dt></div></dl>{stats.pointsCount === 0 && <p className="activity-gps-note" role="status">Waiting for a GPS signal. Check that location access is allowed.</p>}<div className="activity-buttons"><button className="app-secondary-button" disabled={busy} onClick={isTracking ? onPause : onResume}>{isTracking ? <Pause size={16} /> : <Play size={16} />}{isTracking ? 'Pause' : 'Resume'}</button><button className="app-primary-button" onClick={() => runAction(onStop)} disabled={busy}><Square size={13} fill="currentColor" />{busy ? 'Saving…' : 'Finish & save'}</button></div></>}
    {error && <p className="activity-error" role="alert">{error}</p>}
    <div className="activity-footnote"><ShieldCheck size={12} />{isIdle ? 'No account needed. Saved in your browser.' : 'Keep this tab open while you explore.'}</div>
  </section>;
};
