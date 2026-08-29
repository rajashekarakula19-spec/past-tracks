import { GPSPoint, TripSession, LiveTrackingStats } from '../types/track';
import {
  calculateDistanceKm,
  calculateBearing,
  formatDateKey,
  inferTransportMode,
  detectIdleStops,
} from '../utils/geoUtils';
import { requestWakeLock, releaseWakeLock } from './wakeLock';
import { saveActiveTrackPoints, clearActiveTrack, saveTrip } from './storage';

export type PositionUpdateListener = (stats: LiveTrackingStats, latestPoint: GPSPoint) => void;
export type TrackingStateChangeListener = (isTracking: boolean, isPaused: boolean) => void;
export type UserLocationListener = (point: GPSPoint) => void;

class GPSTrackerService {
  private watchId: number | null = null;
  private passiveWatchId: number | null = null;
  private isTracking = false;
  private isPaused = false;
  private points: GPSPoint[] = [];
  private totalDistanceKm = 0;
  private maxSpeedKmh = 0;
  private sessionStartTime: number = 0;
  private updateTimer: any = null;
  private minDistanceDeltaMeters: number = 1.5; // 1.5 meters minimum displacement
  private snapToRoadsEnabled: boolean = false; // Preserve genuine walking footsteps by default
  private currentUserLocation: GPSPoint | null = null;

  private positionListeners: Set<PositionUpdateListener> = new Set();
  private stateListeners: Set<TrackingStateChangeListener> = new Set();
  private userLocationListeners: Set<UserLocationListener> = new Set();

  constructor() {
    this.startPassiveLocationWatch();
  }

  public subscribePosition(listener: PositionUpdateListener): () => void {
    this.positionListeners.add(listener);
    return () => this.positionListeners.delete(listener);
  }

  public subscribeState(listener: TrackingStateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  public subscribeUserLocation(listener: UserLocationListener): () => void {
    this.userLocationListeners.add(listener);
    if (this.currentUserLocation) {
      listener(this.currentUserLocation);
    }
    return () => this.userLocationListeners.delete(listener);
  }

  public getCurrentUserLocation(): GPSPoint | null {
    return this.currentUserLocation;
  }

  public setSnapToRoads(enabled: boolean): void {
    this.snapToRoadsEnabled = enabled;
  }

  public getSnapToRoads(): boolean {
    return this.snapToRoadsEnabled;
  }

  /**
   * Passive high-accuracy location watcher: connects directly to phone hardware GPS & Chrome Android Fused Location
   */
  public startPassiveLocationWatch(): void {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      console.warn('Geolocation API not available');
      return;
    }

    // Fast initial position query (low accuracy first for instant cellular/Wi-Fi fix within 500ms)
    navigator.geolocation.getCurrentPosition(
      (pos) => this.handlePassivePosition(pos),
      (err) => console.warn('Instant Wi-Fi/Cell fix notice:', err.message),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 6000 }
    );

    // Precise continuous hardware GPS stream
    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 25000,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => this.handlePassivePosition(pos),
      (err) => {
        console.warn('High accuracy initial GPS notice:', err.message);
        // Retry with moderate timeout
        navigator.geolocation.getCurrentPosition(
          (retryPos) => this.handlePassivePosition(retryPos),
          (retryErr) => console.warn('GPS location retry:', retryErr.message),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      },
      highAccuracyOptions
    );

    if (this.passiveWatchId === null) {
      this.passiveWatchId = navigator.geolocation.watchPosition(
        (pos) => this.handlePassivePosition(pos),
        (err) => {
          console.warn('Continuous GPS watch notice:', err.message);
        },
        highAccuracyOptions
      );
    }
  }

  public requestLocationPermission(): void {
    this.startPassiveLocationWatch();
  }

  private handlePassivePosition(pos: GeolocationPosition): void {
    const { latitude: lat, longitude: lng, altitude, accuracy, speed: rawSpeed, heading } = pos.coords;
    const speedKmh = rawSpeed !== null && rawSpeed >= 0 ? (rawSpeed * 3600) / 1000 : 0;

    const userPoint: GPSPoint = {
      id: `user_loc_${pos.timestamp || Date.now()}`,
      lng,
      lat,
      altitude: altitude !== null ? Math.round(altitude) : null,
      speed: rawSpeed !== null ? rawSpeed : 0,
      speedKmh: Math.round(speedKmh * 10) / 10,
      heading: heading !== null && !isNaN(heading) ? Math.round(heading) : null,
      accuracy: Math.round((accuracy || 5) * 10) / 10,
      timestamp: pos.timestamp || Date.now(),
    };

    this.currentUserLocation = userPoint;
    this.userLocationListeners.forEach((fn) => fn(userPoint));
  }

  public getStats(): LiveTrackingStats {
    const now = Date.now();
    const durationSeconds =
      this.sessionStartTime > 0
        ? Math.floor((now - this.sessionStartTime) / 1000)
        : 0;

    const avgSpeedKmh =
      durationSeconds > 0
        ? (this.totalDistanceKm / (durationSeconds / 3600))
        : 0;

    const currentPoint = this.points[this.points.length - 1] || this.currentUserLocation || null;

    return {
      currentPoint,
      pointsCount: this.points.length,
      distanceKm: Math.round(this.totalDistanceKm * 100) / 100,
      durationSeconds,
      currentSpeedKmh: currentPoint ? currentPoint.speedKmh : 0,
      avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
      maxSpeedKmh: Math.round(this.maxSpeedKmh * 10) / 10,
      accuracy: currentPoint ? currentPoint.accuracy : 0,
      isWakeLocked: this.isTracking && !this.isPaused,
      status: !this.isTracking ? 'idle' : this.isPaused ? 'paused' : 'recording',
    };
  }

  private statsListeners: ((stats: LiveTrackingStats) => void)[] = [];

  public subscribeStats(listener: (stats: LiveTrackingStats) => void): () => void {
    this.statsListeners.push(listener);
    return () => {
      this.statsListeners = this.statsListeners.filter((fn) => fn !== listener);
    };
  }

  public async startTracking(): Promise<boolean> {
    if (this.isTracking) return true;

    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser or device.');
      return false;
    }

    // Reset clean points array (only real verified GPS fixes will be recorded)
    this.points = [];
    this.totalDistanceKm = 0;
    this.maxSpeedKmh = 0;
    this.sessionStartTime = Date.now();
    this.isTracking = true;
    this.isPaused = false;

    // Acquire Screen WakeLock
    await requestWakeLock();

    this.notifyState();
    const initialStats = this.getStats();
    this.statsListeners.forEach((fn) => fn(initialStats));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleNewPosition(pos),
      (err) => this.handleLocationError(err),
      options
    );

    // Continuous 1-second timer tick
    this.updateTimer = setInterval(() => {
      if (this.isTracking && !this.isPaused) {
        const stats = this.getStats();
        this.statsListeners.forEach((fn) => fn(stats));
      }
    }, 1000);

    return true;
  }

  public pauseTracking(): void {
    this.isPaused = true;
    releaseWakeLock();
    this.notifyState();
  }

  public resumeTracking(): void {
    this.isPaused = false;
    requestWakeLock();
    this.notifyState();
  }

  public async stopAndSaveTrip(customTitle?: string): Promise<TripSession | null> {
    if (!this.isTracking) return null;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    await releaseWakeLock();

    const now = Date.now();
    let finalPoints = [...this.points];
    const durationMs = now - this.sessionStartTime;
    const avgSpeed =
      durationMs > 0
        ? (this.totalDistanceKm / (durationMs / (1000 * 3600)))
        : 0;

    let savedTrip: TripSession | null = null;

    if (finalPoints.length >= 2) {
      const mode = inferTransportMode(avgSpeed, this.maxSpeedKmh);

      const title =
        customTitle ||
        `Trip on ${new Date(this.sessionStartTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;

      const idleStops = detectIdleStops(finalPoints, 30, 45);

      savedTrip = {
        id: `trip_${this.sessionStartTime}`,
        title,
        dateKey: formatDateKey(this.sessionStartTime),
        startTime: this.sessionStartTime,
        endTime: now,
        points: finalPoints, // 100% exact, pure recorded points (Zero mutation)
        color: '#00f2fe', // Consistent vibrant cyan glow (No random pink)
        distanceKm: Math.round(this.totalDistanceKm * 100) / 100,
        durationMs,
        avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
        maxSpeedKmh: Math.round(this.maxSpeedKmh * 10) / 10,
        transportMode: mode,
        idleStops,
      };

      await saveTrip(savedTrip);
      await clearActiveTrack();
    }

    this.isTracking = false;
    this.isPaused = false;
    this.points = [];
    this.totalDistanceKm = 0;
    this.sessionStartTime = 0;
    this.notifyState();

    return savedTrip;
  }

  public async cancelTracking(): Promise<void> {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    await releaseWakeLock();
    await clearActiveTrack();

    this.isTracking = false;
    this.isPaused = false;
    this.points = [];
    this.totalDistanceKm = 0;
    this.sessionStartTime = 0;
    this.notifyState();
  }

  private handleNewPosition(pos: GeolocationPosition): void {
    this.handlePassivePosition(pos); // Also update user location puck

    if (!this.isTracking || this.isPaused) return;

    const { latitude: lat, longitude: lng, altitude, accuracy, speed: rawSpeed, heading: rawHeading } = pos.coords;
    const now = pos.timestamp || Date.now();

    // 1. Reject coarse low-accuracy cell tower fixes (> 60m)
    if (accuracy && accuracy > 60 && this.points.length > 0) {
      console.warn('Skipping low accuracy GPS point:', accuracy);
      return;
    }

    let calculatedSpeedKmh = 0;
    let computedHeading = rawHeading;

    if (this.points.length > 0) {
      const prev = this.points[this.points.length - 1];
      const distKm = calculateDistanceKm(prev.lat, prev.lng, lat, lng);
      const distMeters = distKm * 1000;
      const timeDiffSec = Math.max((now - prev.timestamp) / 1000, 0.1);

      // Filter stationary micro-jitter (< minDistanceDeltaMeters)
      if (distMeters < this.minDistanceDeltaMeters) {
        return;
      }

      // 2. Reject impossible speed spikes / GPS teleports (> 160 km/h jump)
      const impliedSpeedKmh = distKm / (timeDiffSec / 3600);
      if (impliedSpeedKmh > 160 && timeDiffSec < 10) {
        console.warn('Rejected GPS teleport outlier jump:', distMeters, 'meters in', timeDiffSec, 's');
        return;
      }

      this.totalDistanceKm += distKm;

      if (rawSpeed !== null && rawSpeed !== undefined && rawSpeed >= 0) {
        calculatedSpeedKmh = (rawSpeed * 3600) / 1000;
      } else {
        calculatedSpeedKmh = impliedSpeedKmh;
      }

      if (computedHeading === null || computedHeading === undefined || isNaN(computedHeading)) {
        computedHeading = calculateBearing(prev.lat, prev.lng, lat, lng);
      }
    } else {
      if (rawSpeed !== null && rawSpeed !== undefined && rawSpeed >= 0) {
        calculatedSpeedKmh = (rawSpeed * 3600) / 1000;
      }
    }

    if (calculatedSpeedKmh > this.maxSpeedKmh) {
      this.maxSpeedKmh = calculatedSpeedKmh;
    }

    const newPoint: GPSPoint = {
      id: `pt_${now}`,
      lng,
      lat,
      altitude: altitude !== null ? Math.round(altitude) : null,
      speed: rawSpeed !== null ? rawSpeed : (calculatedSpeedKmh * 1000) / 3600,
      speedKmh: Math.round(calculatedSpeedKmh * 10) / 10,
      heading: computedHeading !== null && !isNaN(computedHeading) ? Math.round(computedHeading) : null,
      accuracy: Math.round((accuracy || 5) * 10) / 10,
      timestamp: now,
    };

    this.points.push(newPoint);

    if (this.points.length % 5 === 0) {
      saveActiveTrackPoints(this.points);
    }

    const stats = this.getStats();
    this.positionListeners.forEach((fn) => fn(stats, newPoint));
  }

  public injectSimulatedPoint(point: GPSPoint): void {
    this.currentUserLocation = point;
    this.userLocationListeners.forEach((fn) => fn(point));

    if (!this.isTracking || this.isPaused) return;

    if (this.points.length > 0) {
      const prev = this.points[this.points.length - 1];
      const distKm = calculateDistanceKm(prev.lat, prev.lng, point.lat, point.lng);
      this.totalDistanceKm += distKm;
    }

    if (point.speedKmh > this.maxSpeedKmh) {
      this.maxSpeedKmh = point.speedKmh;
    }

    this.points.push(point);
    const stats = this.getStats();
    this.positionListeners.forEach((fn) => fn(stats, point));
  }

  private handleLocationError(err: GeolocationPositionError): void {
    console.warn('GPS Geolocation warning:', err.message, err.code);
  }

  private notifyState(): void {
    this.stateListeners.forEach((fn) => fn(this.isTracking, this.isPaused));
  }
}

export const gpsTracker = new GPSTrackerService();
