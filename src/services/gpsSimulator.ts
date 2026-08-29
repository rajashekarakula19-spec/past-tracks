import { gpsTracker } from './gpsTracker';
import { GPSPoint } from '../types/track';
import { calculateBearing } from '../utils/geoUtils';
import { ALLENHURST_TO_OUTLETS_DRIVE, FASHION_OUTLETS_MALL_WALK } from './osrmRoutes';

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  type: 'drive' | 'walk' | 'bike';
  avgSpeedKmh: number;
  rawCoords: [number, number][];
}

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'sim_allenhurst_to_outlets',
    name: '104 Allenhurst to Fashion Outlets (Full Route)',
    description: 'Exact Google Maps road geometry: Allenhurst -> I-290 -> I-190 Bridges -> Fashion Outlets -> Mall Walk',
    type: 'drive',
    avgSpeedKmh: 75,
    rawCoords: [...ALLENHURST_TO_OUTLETS_DRIVE, ...FASHION_OUTLETS_MALL_WALK],
  },
  {
    id: 'sim_mall_walk_only',
    name: 'Fashion Outlets Interior Walkway',
    description: 'High-precision pedestrian footsteps through mall concourses & aisles',
    type: 'walk',
    avgSpeedKmh: 4.8,
    rawCoords: FASHION_OUTLETS_MALL_WALK,
  },
];

class GPSSimulator {
  private timer: any = null;
  private isSimulating = false;
  private currentStepIndex = 0;
  private points: GPSPoint[] = [];

  public startSimulation(preset: SimulationPreset = SIMULATION_PRESETS[0]): void {
    if (this.isSimulating) {
      this.stopSimulation();
    }

    this.points = this.buildPointsFromGeometry(preset.rawCoords, preset.type);
    this.currentStepIndex = 0;
    this.isSimulating = true;

    gpsTracker.startTracking();

    // Fast coordinate stream (1 point every 200ms for smooth 60fps road gliding)
    this.timer = setInterval(() => {
      if (this.currentStepIndex < this.points.length) {
        const pt = { ...this.points[this.currentStepIndex], timestamp: Date.now() };
        gpsTracker.injectSimulatedPoint(pt);
        this.currentStepIndex++;
      } else {
        this.currentStepIndex = 0;
      }
    }, 200);
  }

  public stopSimulation(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isSimulating = false;
    this.currentStepIndex = 0;
    this.points = [];
  }

  public getStatus(): boolean {
    return this.isSimulating;
  }

  private buildPointsFromGeometry(coords: [number, number][], type: 'drive' | 'walk' | 'bike'): GPSPoint[] {
    const points: GPSPoint[] = [];
    const baseSpeed = type === 'drive' ? 75 : 4.5;

    for (let i = 0; i < coords.length; i++) {
      const [lng, lat] = coords[i];
      let heading = 0;
      let speedKmh = baseSpeed;

      if (i < coords.length - 1) {
        const [nextLng, nextLat] = coords[i + 1];
        heading = calculateBearing(lat, lng, nextLat, nextLng);
      } else if (i > 0) {
        const [prevLng, prevLat] = coords[i - 1];
        heading = calculateBearing(prevLat, prevLng, lat, lng);
      }

      // If in mall portion (index > 578), switch to walking speed
      if (coords.length > 500 && i > 575) {
        speedKmh = 4.2;
      }

      points.push({
        id: `sim_pt_${i}`,
        lng,
        lat,
        altitude: 195,
        speed: (speedKmh * 1000) / 3600,
        speedKmh: Math.round(speedKmh * 10) / 10,
        heading: Math.round(heading),
        accuracy: type === 'walk' ? 1.5 : 2.5,
        timestamp: Date.now(),
      });
    }

    return points;
  }
}

export const gpsSimulator = new GPSSimulator();
