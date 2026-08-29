import { TripSession, GPSPoint, TransportMode } from '../types/track';
import { calculateDistanceKm, calculateBearing, formatDateKey } from '../utils/geoUtils';
import { ALLENHURST_TO_OUTLETS_DRIVE, FASHION_OUTLETS_MALL_WALK } from './osrmRoutes';

function buildGPSPointsFromRoadGeometry(
  roadCoords: [number, number][],
  startTime: number,
  avgSpeedKmh: number,
  mode: TransportMode,
  baseAltitude: number = 195
): { points: GPSPoint[]; distanceKm: number; durationMs: number; maxSpeedKmh: number } {
  const points: GPSPoint[] = [];
  let currentTime = startTime;
  let totalDistanceKm = 0;
  let maxSpeedKmh = 0;

  for (let i = 0; i < roadCoords.length - 1; i++) {
    const [startLng, startLat] = roadCoords[i];
    const [endLng, endLat] = roadCoords[i + 1];

    const segmentDistKm = calculateDistanceKm(startLat, startLng, endLat, endLng);
    const bearing = calculateBearing(startLat, startLng, endLat, endLng);

    // Calculate speed based on road type
    let segmentSpeedKmh = avgSpeedKmh;
    if (mode === 'drive') {
      // Highway vs local speed
      if (segmentDistKm > 0.08) {
        segmentSpeedKmh = Math.min(110, avgSpeedKmh * 1.3); // Highway section on I-290/I-190
      } else {
        segmentSpeedKmh = Math.max(30, avgSpeedKmh * 0.7); // Local street / turns
      }
    } else {
      segmentSpeedKmh = Math.max(3.5, avgSpeedKmh + Math.sin(i * 0.5) * 0.5);
    }

    if (segmentSpeedKmh > maxSpeedKmh) maxSpeedKmh = segmentSpeedKmh;

    const speedMs = (segmentSpeedKmh * 1000) / 3600;
    const stepDurationSec = (segmentDistKm * 1000) / Math.max(0.8, speedMs);

    currentTime += Math.round(stepDurationSec * 1000);
    totalDistanceKm += segmentDistKm;

    points.push({
      id: `pt_${currentTime}_${i}`,
      lng: startLng,
      lat: startLat,
      altitude: Math.round(baseAltitude + Math.sin(i * 0.05) * 6),
      speed: speedMs,
      speedKmh: Math.round(segmentSpeedKmh * 10) / 10,
      heading: Math.round(bearing),
      accuracy: mode === 'walk' ? 1.5 : 3.0,
      timestamp: currentTime,
    });
  }

  // Final point
  const last = roadCoords[roadCoords.length - 1];
  points.push({
    id: `pt_${currentTime}_final`,
    lng: last[0],
    lat: last[1],
    altitude: Math.round(baseAltitude),
    speed: 0,
    speedKmh: 0,
    heading: points[points.length - 1]?.heading || 0,
    accuracy: 2.0,
    timestamp: currentTime + 1000,
  });

  return {
    points,
    distanceKm: Math.round(totalDistanceKm * 100) / 100,
    durationMs: currentTime - startTime,
    maxSpeedKmh: Math.round(maxSpeedKmh * 10) / 10,
  };
}

export function generateDemoTrips(): TripSession[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. TRUE Google Maps-grade Turn-by-Turn: 104 Allenhurst Rd to Fashion Outlets (Drive + Mall Walk)
  const allenhurstStart = now - dayMs * 1 - 2 * 60 * 60 * 1000;
  const driveData = buildGPSPointsFromRoadGeometry(ALLENHURST_TO_OUTLETS_DRIVE, allenhurstStart, 78, 'drive', 198);
  const walkData = buildGPSPointsFromRoadGeometry(
    FASHION_OUTLETS_MALL_WALK,
    allenhurstStart + driveData.durationMs,
    4.5,
    'walk',
    180
  );

  const combinedPoints = [...driveData.points, ...walkData.points];
  const combinedDist = Math.round((driveData.distanceKm + walkData.distanceKm) * 100) / 100;
  const combinedDuration = driveData.durationMs + walkData.durationMs;

  const allenhurstTrip: TripSession = {
    id: 'demo_allenhurst_to_niagara_outlets',
    title: '104 Allenhurst to Fashion Outlets (Drive + Mall Walk)',
    dateKey: formatDateKey(allenhurstStart),
    startTime: allenhurstStart,
    endTime: allenhurstStart + combinedDuration,
    points: combinedPoints,
    color: '#00f2fe',
    distanceKm: combinedDist,
    durationMs: combinedDuration,
    avgSpeedKmh: Math.round((combinedDist / (combinedDuration / 3600000)) * 10) / 10,
    maxSpeedKmh: driveData.maxSpeedKmh,
    elevationGainM: 28,
    transportMode: 'drive',
    isSimulated: true,
  };

  // 2. Buffalo Waterfront Walkway
  const walkStart = now - dayMs * 2 - 5 * 60 * 60 * 1000;
  const walkOnly = buildGPSPointsFromRoadGeometry(FASHION_OUTLETS_MALL_WALK, walkStart, 4.8, 'walk', 178);

  const mallWalkTrip: TripSession = {
    id: 'demo_fashion_outlets_mall_walk',
    title: 'Fashion Outlets Mall Walkway Loop',
    dateKey: formatDateKey(walkStart),
    startTime: walkStart,
    endTime: walkStart + walkOnly.durationMs,
    points: walkOnly.points,
    color: '#00ff88',
    distanceKm: walkOnly.distanceKm,
    durationMs: walkOnly.durationMs,
    avgSpeedKmh: 4.8,
    maxSpeedKmh: 6.2,
    elevationGainM: 2,
    transportMode: 'walk',
    isSimulated: true,
  };

  return [allenhurstTrip, mallWalkTrip];
}
