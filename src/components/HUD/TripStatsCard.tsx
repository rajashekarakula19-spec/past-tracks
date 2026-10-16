import React from 'react';
import { X, Play, Trash2, Download, Route } from 'lucide-react';
import { TripSession } from '../../types/track';
import { formatHumanDate, formatDistance, formatDuration } from '../../utils/geoUtils';
import './journey-panel.css';

interface TripStatsCardProps {
  trip: TripSession;
  onClose: () => void;
  onStartReplay: (trip: TripSession) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripStatsCard: React.FC<TripStatsCardProps> = ({ trip, onClose, onStartReplay, onDeleteTrip }) => (
  <section className="journey-detail" aria-label={`Journey details: ${trip.title}`}>
    <div className="journey-detail-header">
      <span className="journey-icon"><Route size={22} /></span>
      <div><h3>{trip.title}</h3><p>{formatHumanDate(trip.dateKey)} · {new Date(trip.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p></div>
      <button onClick={onClose} className="journey-icon-button" aria-label="Close journey details"><X size={17} /></button>
    </div>
    <div className="saved-journey-main">
      <dl className="journey-metric-pair"><div><dd>{formatDistance(trip.distanceKm)}</dd><dt>Distance</dt></div><div><dd>{formatDuration(trip.durationMs)}</dd><dt>On the move</dt></div></dl>
      <button onClick={() => onStartReplay(trip)} className="journey-replay" aria-label={`Replay ${trip.title}`} title="Replay journey"><Play size={18} fill="currentColor" /></button>
    </div>
    <div className="journey-detail-speeds"><span>{trip.avgSpeedKmh.toFixed(1)} km/h avg. speed</span><span>{trip.maxSpeedKmh.toFixed(1)} km/h max. speed</span></div>
    <div className="journey-detail-actions"><button onClick={() => import('../../services/storage').then(({ exportTripAsGeoJSON }) => exportTripAsGeoJSON(trip))} className="journey-export"><Download size={13} />Export journey</button><span className="journey-mode">{trip.transportMode}</span><button onClick={() => onDeleteTrip(trip.id)} className="journey-icon-button journey-delete" aria-label={`Delete ${trip.title}`}><Trash2 size={15} /></button></div>
  </section>
);
