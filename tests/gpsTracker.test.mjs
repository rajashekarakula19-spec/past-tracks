import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './load-typescript.mjs';

const geo = loadTypeScript('src/utils/geoUtils.ts');

function createTracker() {
  let now = Date.parse('2026-10-16T12:00:00Z');
  const watches = new Map();
  let nextWatch = 0;
  let activeWatch;
  let saved;
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const navigator = { geolocation: {
    getCurrentPosition() {},
    watchPosition(callback) { const id = ++nextWatch; watches.set(id, callback); activeWatch = id; return id; },
    clearWatch(id) { watches.delete(id); },
  } };
  const { gpsTracker } = loadTypeScript('src/services/gpsTracker.ts', {
    '../utils/geoUtils': geo,
    './wakeLock': { requestWakeLock: async () => true, releaseWakeLock: async () => {} },
    './storage': { saveTrip: async trip => { saved = trip; }, saveActiveTrackPoints: async () => {}, clearActiveTrack: async () => {} },
  }, { Date: Clock, navigator, window: {}, setInterval: () => 1, clearInterval() {} });
  const base = now;
  return {
    tracker: gpsTracker,
    get saved() { return saved; },
    fix(seconds, offset = 0) {
      now = base + seconds * 1000;
      watches.get(activeWatch)?.({ timestamp: now, coords: { latitude: 42.95674 + offset, longitude: -78.82206, altitude: null, accuracy: 8, speed: 0, heading: null } });
    },
  };
}

test('stationary GPS fixes retain a five-minute checkpoint without inflating distance', async () => {
  const session = createTracker();
  await session.tracker.startTracking();
  for (let seconds = 0; seconds <= 360; seconds += 10) session.fix(seconds, seconds % 20 ? .000001 : 0);
  const stats = session.tracker.getStats();
  assert.equal(stats.distanceKm, 0);
  assert.equal(stats.currentSpeedKmh, 0);
  assert.equal(stats.idleStops.length, 1);
  assert.equal(stats.idleStops[0].durationSeconds, 360);
  await session.tracker.stopAndSaveTrip();
  assert.equal(session.saved.idleStops.length, 1);
  assert.equal(session.saved.idleStops[0].endTime - session.saved.idleStops[0].startTime, 360000);
});

test('roaming through the same area records actual movement and a checkpoint', async () => {
  const session = createTracker();
  await session.tracker.startTracking();
  for (let seconds = 0; seconds <= 360; seconds += 30) session.fix(seconds, [0, .0003, 0, -.0003][seconds / 30 % 4]);
  const stats = session.tracker.getStats();
  assert.ok(stats.distanceKm > 0.1);
  assert.equal(stats.idleStops.length, 1);
});

test('recording without observations through a GPS gap does not invent a checkpoint', async () => {
  const session = createTracker();
  await session.tracker.startTracking();
  session.fix(0); session.fix(600);
  assert.equal(session.tracker.getStats().idleStops.length, 0);
});

test('new recording clears checkpoint caches from the previous journey', async () => {
  const session = createTracker();
  await session.tracker.startTracking();
  for (let seconds = 0; seconds <= 360; seconds += 30) session.fix(seconds);
  assert.equal(session.tracker.getStats().idleStops.length, 1);
  await session.tracker.stopAndSaveTrip();
  await session.tracker.startTracking();
  assert.equal(session.tracker.getStats().idleStops.length, 0);
});
