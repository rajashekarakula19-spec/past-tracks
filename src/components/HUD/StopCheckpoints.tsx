import { ChevronDown, MapPin, ArrowUpRight } from 'lucide-react';
import { IdleStop } from '../../types/track';
import { formatDuration, formatStopTimeRange } from '../../utils/geoUtils';

interface StopCheckpointsProps {
  stops: IdleStop[];
  onSelectStop: (stop: IdleStop) => void;
}

export function StopCheckpoints({ stops, onSelectStop }: StopCheckpointsProps) {
  if (!stops.length) return <p className="checkpoint-hint"><MapPin size={13} />Spend 5+ minutes in one area to create a checkpoint. Walking around counts.</p>;
  return <details className="checkpoint-section">
    <summary><MapPin size={15} /><span>Stop checkpoints</span><span className="checkpoint-count">{stops.length}</span><ChevronDown size={15} /></summary>
    <p className="checkpoint-timezone">Times in {Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}. Select a stop to see it on the map.</p>
    <ol className="checkpoint-list">{stops.map((stop, index) => <li key={stop.id}><button className="checkpoint-row" onClick={() => onSelectStop(stop)} aria-label={`Show checkpoint ${index + 1} on map`}><span className="checkpoint-number">{index + 1}</span><span><strong>{formatStopTimeRange(stop.startTime, stop.endTime)}</strong><small>{formatDuration(stop.durationSeconds * 1000)} in this area</small></span><ArrowUpRight size={14} /></button></li>)}</ol>
  </details>;
}
