export type TransportMode = 'walk' | 'run' | 'bike' | 'drive' | 'transit' | 'flight' | 'train';

export interface GPSPoint {
  id: string;
  lng: number;
  lat: number;
  altitude: number | null;
  speed: number; // m/s
  speedKmh: number; // km/h
  heading: number | null; // degrees (0-360)
  accuracy: number; // meters
  timestamp: number; // Unix epoch ms
  isIndoorDwell?: boolean;
}

export interface IdleStop {
  id: string;
  lng: number;
  lat: number;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  radiusMeters: number; // Distance cube radius
  label: string; // e.g. "6:50 PM — 7:05 PM (15m)"
  pointCount: number;
}

export interface TripSession {
  id: string;
  title: string;
  dateKey: string; // YYYY-MM-DD
  startTime: number;
  endTime: number;
  points: GPSPoint[];
  color: string;
  distanceKm: number;
  durationMs: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  elevationGainM?: number;
  transportMode: TransportMode;
  isSimulated?: boolean;
  idleStops?: IdleStop[];
}

export interface DateGroupedTrips {
  [dateKey: string]: TripSession[];
}

export interface LiveTrackingStats {
  currentPoint: GPSPoint | null;
  pointsCount: number;
  distanceKm: number;
  durationSeconds: number;
  currentSpeedKmh: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  accuracy: number;
  isWakeLocked: boolean;
  status: 'idle' | 'recording' | 'paused';
  isInsideBuilding?: boolean;
  idleStops?: IdleStop[];
}

export type MapStyleMode = 'cyberpunk' | 'satellite' | 'streets' | 'google-streets' | 'google-hybrid' | 'buildings-3d';

export type AppMode = 'live' | 'history' | 'replay';
