import { GPSPoint, TripSession, TransportMode, IdleStop } from '../types/track';

/**
 * Calculates distance between two [lng, lat] coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing/heading in degrees from point 1 to point 2
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return (b + 360) % 360;
}

/**
 * Computes bounding box [minLng, minLat, maxLng, maxLat] from an array of GPS points
 */
export function computeBoundingBox(
  points: GPSPoint[]
): [number, number, number, number] | null {
  if (!points || points.length === 0) return null;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;

  for (let i = 1; i < points.length; i++) {
    const { lng, lat } = points[i];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Infer transport mode from average speed
 */
export function inferTransportMode(avgSpeedKmh: number, maxSpeedKmh: number): TransportMode {
  if (maxSpeedKmh > 200 || avgSpeedKmh > 180) return 'flight';
  if (maxSpeedKmh > 110 || avgSpeedKmh > 55) return 'drive';
  if (avgSpeedKmh > 35) return 'train';
  if (avgSpeedKmh > 12) return 'bike';
  if (avgSpeedKmh > 6) return 'run';
  return 'walk';
}

/**
 * Format date key YYYY-MM-DD
 */
export function formatDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format readable human date e.g. "Today", "Yesterday", or "Aug 27, 2026"
 */
export function formatHumanDate(dateKey: string): string {
  const todayKey = formatDateKey(Date.now());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterdayDate.getTime());

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format duration ms into hh:mm:ss or mm:ss
 */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export const KM_PER_MILE = 1.609344;

export function toMiles(kilometers: number): number {
  return kilometers / KM_PER_MILE;
}

export function formatDistance(distanceKm: number): string {
  const miles = toMiles(distanceKm);
  return `${miles > 0 && miles < 0.01 ? '<0.01' : miles.toFixed(2)} mi`;
}

export function formatSpeed(speedKmh: number): string {
  return `${toMiles(speedKmh).toFixed(1)} mph`;
}

/** A place visit may include walking around within the same area. */
export const STOP_RADIUS_METERS = 100;
export const STOP_MIN_DURATION_SECONDS = 5 * 60;
export const STOP_MAX_OBSERVATION_GAP_MS = 2 * 60 * 1000;

export function formatStopTimeRange(startTime: number, endTime: number): string {
  const crossDate = formatDateKey(startTime) !== formatDateKey(endTime);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric', minute: '2-digit', hour12: true,
    ...(crossDate ? { month: 'short', day: 'numeric' } : {}),
  };
  return `${new Date(startTime).toLocaleString(undefined, options)} – ${new Date(endTime).toLocaleString(undefined, options)}`;
}

/**
 * Dynamic color based on transport mode or speed
 */
export function getSpeedColor(speedKmh: number): string {
  if (speedKmh < 6) return '#00ff88'; // Neon Green (Walking)
  if (speedKmh < 20) return '#00f2fe'; // Neon Cyan (Running/Biking)
  if (speedKmh < 50) return '#ffb703'; // Neon Amber (City transit/Scooter)
  if (speedKmh < 120) return '#ff007f'; // Neon Pink (Driving)
  return '#b000ff'; // Neon Purple (Highway / High Speed)
}

export const TRIP_PALETTE = [
  '#00f2fe', // Cyan
  '#00ff88', // Green
  '#ff007f', // Pink
  '#b000ff', // Purple
  '#ffb703', // Amber
  '#38bdf8', // Sky Blue
  '#ec4899', // Hot Pink
  '#a855f7', // Violet
];

export function getRandomTripColor(): string {
  return TRIP_PALETTE[Math.floor(Math.random() * TRIP_PALETTE.length)];
}

/**
 * Convert GPS points to GeoJSON LineString
 */
export function pointsToGeoJSONLine(points: GPSPoint[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((p) => [p.lng, p.lat, p.altitude || 0]),
    },
  };
}

/**
 * Convert trip array to GeoJSON FeatureCollection
 */
export function tripsToFeatureCollection(trips: TripSession[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: 'FeatureCollection',
    features: trips
      .filter((t) => t.points.length >= 2)
      .map((trip) => ({
        type: 'Feature',
        properties: {
          id: trip.id,
          title: trip.title,
          color: trip.color,
          dateKey: trip.dateKey,
          distanceKm: trip.distanceKm,
          avgSpeedKmh: trip.avgSpeedKmh,
          transportMode: trip.transportMode,
        },
        geometry: {
          type: 'LineString',
          coordinates: trip.points.map((p) => [p.lng, p.lat, p.altitude || 0]),
        },
      })),
  };
}

/**
 * Find visits lasting 5+ minutes within a 100-meter radius of the arrival fix.
 * Walking around inside that area counts. Gaps over two minutes split visits;
 * the detector never invents arrival/departure times across missing GPS data.
 */
export function detectIdleStops(
  points: GPSPoint[],
  radiusMeters: number = STOP_RADIUS_METERS,
  minStopDurationSec: number = STOP_MIN_DURATION_SECONDS
): IdleStop[] {
  const stops: IdleStop[] = [];
  let cluster: GPSPoint[] = [];
  let previousTimestamp = -Infinity;

  const finishCluster = () => {
    if (cluster.length < 2) return;
    const start = cluster[0];
    const end = cluster[cluster.length - 1];
    const durationSeconds = Math.floor((end.timestamp - start.timestamp) / 1000);
    if (durationSeconds < minStopDurationSec) return;
    const lat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length;
    const lng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length;
    const spread = cluster.reduce((max, p) => Math.max(max, calculateDistanceKm(lat, lng, p.lat, p.lng) * 1000), 5);
    stops.push({
      id: `stop_${start.timestamp}`, lat, lng,
      startTime: start.timestamp, endTime: end.timestamp, durationSeconds,
      radiusMeters: Math.round(spread), pointCount: cluster.length,
      label: `${formatStopTimeRange(start.timestamp, end.timestamp)} (${formatDuration(durationSeconds * 1000)})`,
    });
  };

  for (const point of points) {
    if (!Number.isFinite(point.timestamp) || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180 || point.accuracy > 60) {
      finishCluster(); cluster = []; previousTimestamp = -Infinity; continue;
    }
    if (point.timestamp <= previousTimestamp) continue;
    const previous = cluster[cluster.length - 1];
    const anchor = cluster[0];
    if (previous && (point.timestamp - previous.timestamp > STOP_MAX_OBSERVATION_GAP_MS || calculateDistanceKm(anchor.lat, anchor.lng, point.lat, point.lng) * 1000 > radiusMeters)) {
      finishCluster(); cluster = [];
    }
    cluster.push(point);
    previousTimestamp = point.timestamp;
  }
  finishCluster();
  return stops;
}

const tripStopsCache = new WeakMap<TripSession, IdleStop[]>();

/** Prefer newly detected area visits; retain qualifying older saved checkpoints. */
export function getTripStops(trip: TripSession): IdleStop[] {
  const cached = tripStopsCache.get(trip);
  if (cached) return cached;
  const detected = detectIdleStops(trip.points);
  const legacy = (trip.idleStops || []).filter(stop =>
    stop.durationSeconds >= STOP_MIN_DURATION_SECONDS &&
    Number.isFinite(stop.startTime) && Number.isFinite(stop.endTime) &&
    stop.endTime > stop.startTime && Number.isFinite(stop.lat) && Number.isFinite(stop.lng) &&
    !detected.some(other => stop.startTime <= other.endTime && stop.endTime >= other.startTime)
  );
  const stops = [...detected, ...legacy].sort((a, b) => a.startTime - b.startTime);
  tripStopsCache.set(trip, stops);
  return stops;
}

/**
 * Filter Indoor GPS Multipath Jitter:
 * Prevents GPS noise from drifting outside the building when roaming indoors.
 * Clamps indoor roaming coordinates to the building dwell centroid.
 */
export function stabilizeIndoorPoints(points: GPSPoint[], indoorRadiusMeters: number = 30): GPSPoint[] {
  if (points.length < 3) return points;

  const stops = detectIdleStops(points, indoorRadiusMeters, 45);
  if (stops.length === 0) return points;

  const stabilized: GPSPoint[] = [];

  points.forEach((pt) => {
    // Check if point falls inside any detected building stop time window
    const matchingStop = stops.find(
      (s) => pt.timestamp >= s.startTime && pt.timestamp <= s.endTime
    );

    if (matchingStop) {
      // Pull indoor wandering coordinate towards the building centroid to keep it inside
      const distToCenter = calculateDistanceKm(matchingStop.lat, matchingStop.lng, pt.lat, pt.lng) * 1000;
      if (distToCenter > 15) {
        // Clamp coordinate inside building perimeter
        stabilized.push({
          ...pt,
          lng: matchingStop.lng + (pt.lng - matchingStop.lng) * 0.25,
          lat: matchingStop.lat + (pt.lat - matchingStop.lat) * 0.25,
          isIndoorDwell: true,
        });
      } else {
        stabilized.push({ ...pt, isIndoorDwell: true });
      }
    } else {
      stabilized.push(pt);
    }
  });

  return stabilized;
}



