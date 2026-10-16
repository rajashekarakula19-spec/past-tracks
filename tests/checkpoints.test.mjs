import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTypeScript } from './load-typescript.mjs';

const geo = loadTypeScript('src/utils/geoUtils.ts');
const start = Date.parse('2026-10-16T12:00:00Z');
const point = (seconds, lat = 42.95674, lng = -78.82206, accuracy = 8) => ({
  id: `p-${seconds}`, timestamp: start + seconds * 1000, lat, lng, accuracy,
  speed: 1, speedKmh: 3.6, heading: null, altitude: null,
});
const visit = (duration = 360) => Array.from({ length: duration / 30 + 1 }, (_, i) =>
  point(i * 30, 42.95674 + [0, .0003, 0, -.0003][i % 4], -78.82206 + [0, 0, .0003, 0][i % 4])
);

test('route distances convert to miles without changing the stored metric value', () => {
  assert.equal(geo.formatDistance(1.609344), '1.00 mi');
  assert.equal(geo.formatDistance(0), '0.00 mi');
  assert.equal(geo.formatDistance(.001), '<0.01 mi');
  assert.equal(geo.formatSpeed(96.56064), '60.0 mph');
});

test('five minutes roaming around a store counts as a place visit', () => {
  const stops = geo.detectIdleStops(visit(300));
  assert.equal(stops.length, 1);
  assert.equal(stops[0].startTime, start);
  assert.equal(stops[0].endTime, start + 300000);
  assert.equal(stops[0].durationSeconds, 300);
  assert.ok(stops[0].radiusMeters > 5);
});

test('a visit shorter than five minutes does not become a checkpoint', () => {
  assert.equal(geo.detectIdleStops([point(0), point(100), point(200), point(299)]).length, 0);
});

test('leaving the area finishes the checkpoint at the last observed in-area fix', () => {
  const stops = geo.detectIdleStops([...visit(), point(390, 42.96)]);
  assert.equal(stops.length, 1);
  assert.equal(stops[0].endTime, start + 360000);
});

test('continuous travel across blocks does not become a stop', () => {
  const route = Array.from({ length: 30 }, (_, i) => point(i * 30, 42.95674 + i * .0005));
  assert.equal(geo.detectIdleStops(route).length, 0);
});

test('a GPS outage does not become time spent at a place', () => {
  assert.equal(geo.detectIdleStops([point(0), point(600)]).length, 0);
});

test('two separate visits to the same area remain separate checkpoints', () => {
  const second = visit().map(p => ({ ...p, timestamp: p.timestamp + 900000 }));
  const stops = geo.detectIdleStops([...visit(), point(400, 42.96), ...second]);
  assert.equal(stops.length, 2);
  assert.notEqual(stops[0].id, stops[1].id);
});

test('coarse GPS observations break the visit instead of manufacturing dwell time', () => {
  const points = Array.from({ length: 21 }, (_, i) => point(i * 30, 42.95674, -78.82206, i === 10 ? 150 : 8));
  assert.equal(geo.detectIdleStops(points).length, 0);
});

test('duplicate and out-of-order timestamps do not add time', () => {
  const points = [point(0), point(60), point(30), point(60), point(120), point(180), point(240), point(300)];
  const stops = geo.detectIdleStops(points);
  assert.equal(stops.length, 1);
  assert.equal(stops[0].durationSeconds, 300);
  assert.equal(stops[0].pointCount, 6);
});

test('checkpoint labels show AM/PM and include dates for overnight visits', () => {
  const label = geo.formatStopTimeRange(Date.parse('2026-10-16T00:00:00Z'), Date.parse('2026-10-18T00:00:00Z'));
  assert.match(label, /AM|PM/);
  assert.match(label, /Oct/);
});

test('older saved trips can gain area checkpoints from their existing observations', () => {
  const trip = { points: visit(), idleStops: [] };
  assert.equal(geo.getTripStops(trip).length, 1);
  assert.equal(trip.idleStops.length, 0);
});

test('qualifying legacy checkpoints are preserved without duplicate overlapping stops', () => {
  const detected = geo.detectIdleStops(visit());
  assert.equal(geo.getTripStops({ points: visit(), idleStops: detected }).length, 1);
  assert.equal(geo.getTripStops({ points: [], idleStops: detected }).length, 1);
});
