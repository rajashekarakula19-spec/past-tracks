import { get, set, del, keys } from 'idb-keyval';
import { TripSession, GPSPoint, DateGroupedTrips } from '../types/track';
import { formatDateKey } from '../utils/geoUtils';
import { generateDemoTrips } from './demoData';

const TRIPS_STORE_PREFIX = 'pasttracks_trip_';
const ACTIVE_TRACK_KEY = 'pasttracks_active_points';
const SETTINGS_KEY = 'pasttracks_settings';

export interface AppSettings {
  mapStyle: string;
  enableWakeLock: boolean;
  distanceUnit: 'km' | 'miles';
  smoothAccuracyThreshold: number; // in meters (e.g. 35m)
  highAccuracyMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  mapStyle: 'cyberpunk',
  enableWakeLock: true,
  distanceUnit: 'km',
  smoothAccuracyThreshold: 35,
  highAccuracyMode: true,
};

/**
 * Get all trips saved in IndexedDB
 */
export async function getAllTrips(): Promise<TripSession[]> {
  try {
    const allKeys = await keys();
    const tripKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(TRIPS_STORE_PREFIX)
    );

    // If no trips exist, or existing demo trips are old, seed new street-accurate trips
    if (tripKeys.length === 0) {
      const seeded = generateDemoTrips();
      for (const trip of seeded) {
        await saveTrip(trip);
      }
      return seeded;
    }

    const trips: TripSession[] = [];
    for (const key of tripKeys) {
      const trip = await get<TripSession>(key);
      if (trip) {
        trips.push(trip);
      }
    }

    return trips.sort((a, b) => b.startTime - a.startTime);
  } catch (err) {
    console.error('Failed to load trips from IndexedDB, falling back to demo data:', err);
    return generateDemoTrips();
  }
}

/**
 * Reseed demo trips with street-accurate data
 */
export async function reseedStreetDemoTrips(): Promise<TripSession[]> {
  const seeded = generateDemoTrips();
  for (const trip of seeded) {
    await saveTrip(trip);
  }
  return seeded;
}

/**
 * Save or update a trip session in IndexedDB
 */
export async function saveTrip(trip: TripSession): Promise<void> {
  try {
    await set(`${TRIPS_STORE_PREFIX}${trip.id}`, trip);
  } catch (err) {
    console.error(`Failed to save trip ${trip.id}:`, err);
  }
}

// Export All Trips as JSON file
export function exportTripsAsJSON(trips: TripSession[]): void {
  const dataStr = JSON.stringify(trips, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `past_tracks_data_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export a single Trip as standard GeoJSON
export function exportTripAsGeoJSON(trip: TripSession): void {
  const geojson = {
    type: 'FeatureCollection',
    properties: {
      tripId: trip.id,
      title: trip.title,
      date: trip.dateKey,
      distanceKm: trip.distanceKm,
      durationMs: trip.durationMs,
      avgSpeedKmh: trip.avgSpeedKmh,
      idleStops: trip.idleStops,
    },
    features: [
      {
        type: 'Feature',
        properties: { name: trip.title, color: trip.color },
        geometry: {
          type: 'LineString',
          coordinates: trip.points.map((p) => [p.lng, p.lat, p.altitude || 0]),
        },
      },
    ],
  };

  const dataStr = JSON.stringify(geojson, null, 2);
  const blob = new Blob([dataStr], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import trips from JSON
export async function importTripsFromJSON(jsonString: string): Promise<void> {
  const trips: TripSession[] = JSON.parse(jsonString);
  for (const trip of trips) {
    await saveTrip(trip);
  }
}

/**
 * Delete a specific trip by ID
 */
export async function deleteTrip(tripId: string): Promise<void> {
  try {
    await del(`${TRIPS_STORE_PREFIX}${tripId}`);
  } catch (err) {
    console.error(`Failed to delete trip ${tripId}:`, err);
  }
}

/**
 * Clear all trips from database
 */
export async function clearAllTrips(): Promise<void> {
  try {
    const allKeys = await keys();
    const tripKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(TRIPS_STORE_PREFIX)
    );
    for (const key of tripKeys) {
      await del(key);
    }
  } catch (err) {
    console.error('Failed to clear trips:', err);
  }
}

/**
 * Group trips by date key (YYYY-MM-DD)
 */
export function groupTripsByDate(trips: TripSession[]): DateGroupedTrips {
  const grouped: DateGroupedTrips = {};
  for (const trip of trips) {
    const key = trip.dateKey || formatDateKey(trip.startTime);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(trip);
  }
  return grouped;
}

/**
 * Save active live tracking points buffer (for crash recovery)
 */
export async function saveActiveTrackPoints(points: GPSPoint[]): Promise<void> {
  try {
    await set(ACTIVE_TRACK_KEY, points);
  } catch (err) {
    console.error('Failed to cache active track:', err);
  }
}

/**
 * Retrieve cached active live tracking points
 */
export async function getActiveTrackPoints(): Promise<GPSPoint[]> {
  try {
    return (await get<GPSPoint[]>(ACTIVE_TRACK_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Clear active track cache
 */
export async function clearActiveTrack(): Promise<void> {
  try {
    await del(ACTIVE_TRACK_KEY);
  } catch (err) {
    console.error('Failed to clear active track cache:', err);
  }
}

/**
 * Settings persistence
 */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const settings = await get<AppSettings>(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await set(SETTINGS_KEY, settings);
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
