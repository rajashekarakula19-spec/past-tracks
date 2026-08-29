import { GPSPoint, TransportMode } from '../types/track';
import { calculateDistanceKm, calculateBearing } from '../utils/geoUtils';

/**
 * Service to snap GPS coordinates to real-world streets and pedestrian walkways
 * using OpenStreetMap / OSRM routing network.
 */
export class RoadSnapperService {
  private cache: Map<string, [number, number][]> = new Map();

  /**
   * Fetch real road/walkway coordinates between waypoints using OSRM
   */
  public async getRoadSnappedGeometry(
    waypoints: [number, number][], // [lng, lat][]
    mode: 'foot' | 'driving' = 'driving'
  ): Promise<[number, number][]> {
    if (waypoints.length < 2) return waypoints;

    const cacheKey = `${mode}_${waypoints.map((w) => `${w[0].toFixed(5)},${w[1].toFixed(5)}`).join(';')}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const coordString = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/${mode}/${coordString}?overview=full&geometries=geojson`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM routing error: ${res.statusText}`);

      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const roadCoords: [number, number][] = data.routes[0].geometry.coordinates;
        this.cache.set(cacheKey, roadCoords);
        return roadCoords;
      }
    } catch (err) {
      console.warn('Road snapping fetch fallback:', err);
    }

    // Fallback: return original waypoints if offline or rate-limited
    return waypoints;
  }

  /**
   * Snap an array of raw GPS points to real streets
   */
  public async snapGPSPointsToRoads(
    points: GPSPoint[],
    mode: TransportMode = 'drive'
  ): Promise<GPSPoint[]> {
    if (points.length < 2) return points;

    const osrmMode = mode === 'walk' || mode === 'run' ? 'foot' : 'driving';
    
    // Sample key anchor points if array is large
    const sampleRate = Math.max(1, Math.floor(points.length / 25));
    const sampledAnchors = points.filter((_, idx) => idx % sampleRate === 0 || idx === points.length - 1);
    const coords: [number, number][] = sampledAnchors.map((p) => [p.lng, p.lat]);

    const snappedCoords = await this.getRoadSnappedGeometry(coords, osrmMode);
    if (!snappedCoords || snappedCoords.length < 2) return points;

    // Reconstruct full GPSPoints along the snapped road geometry
    const startTime = points[0].timestamp;
    const endTime = points[points.length - 1].timestamp;
    const totalDurationMs = Math.max(1000, endTime - startTime);
    const totalPoints = snappedCoords.length;

    const result: GPSPoint[] = [];

    for (let i = 0; i < snappedCoords.length; i++) {
      const [lng, lat] = snappedCoords[i];
      const progress = i / Math.max(1, totalPoints - 1);
      const timestamp = Math.round(startTime + progress * totalDurationMs);

      let speedKmh = 30;
      let heading = 0;

      if (i < snappedCoords.length - 1) {
        const [nextLng, nextLat] = snappedCoords[i + 1];
        heading = calculateBearing(lat, lng, nextLat, nextLng);
        const distKm = calculateDistanceKm(lat, lng, nextLat, nextLng);
        const stepTimeSec = (totalDurationMs / totalPoints) / 1000;
        speedKmh = stepTimeSec > 0 ? (distKm / (stepTimeSec / 3600)) : 30;
      } else if (i > 0) {
        const [prevLng, prevLat] = snappedCoords[i - 1];
        heading = calculateBearing(prevLat, prevLng, lat, lng);
      }

      result.push({
        id: `snapped_${timestamp}_${i}`,
        lng,
        lat,
        altitude: points[Math.min(points.length - 1, Math.floor(progress * points.length))]?.altitude || 20,
        speed: (speedKmh * 1000) / 3600,
        speedKmh: Math.round(speedKmh * 10) / 10,
        heading: Math.round(heading),
        accuracy: 3.0,
        timestamp,
      });
    }

    return result;
  }
}

export const roadSnapper = new RoadSnapperService();
