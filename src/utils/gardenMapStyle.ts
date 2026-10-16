import type { StyleSpecification } from 'maplibre-gl';

/** Landing-page palette over real OpenMapTiles geography, supplied by OpenFreeMap. */
export const gardenMapStyle: StyleSpecification = {
  version: 8,
  name: 'PastTracks Garden',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors' },
  },
  layers: [
    { id: 'garden-background', type: 'background', paint: { 'background-color': '#eceee5' } },
    { id: 'garden-landuse', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse', paint: { 'fill-color': '#e1e6d9', 'fill-opacity': 0.65 } },
    { id: 'garden-landcover', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover', paint: { 'fill-color': '#c3d1b6', 'fill-opacity': 0.65 } },
    { id: 'garden-parks', type: 'fill', source: 'openmaptiles', 'source-layer': 'park', paint: { 'fill-color': '#c3d1b6', 'fill-opacity': 0.85 } },
    { id: 'garden-water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water', paint: { 'fill-color': '#bed7d5' } },
    { id: 'garden-waterways', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway', paint: { 'line-color': '#bed7d5', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 16, 5] } },
    { id: 'garden-road-casing', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', filter: ['!=', ['get', 'class'], 'rail'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#d6ddcf', 'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5, 0.5, 12, 3, 16, 13, 20, 32] } },
    { id: 'garden-roads', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', filter: ['!=', ['get', 'class'], 'rail'], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fffdf4', 'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5, 0.3, 12, 2, 16, 10, 20, 27] } },
    { id: 'garden-buildings', type: 'fill', source: 'openmaptiles', 'source-layer': 'building', minzoom: 13, paint: { 'fill-color': '#d4ddca', 'fill-outline-color': '#c7d2bc' } },
    { id: 'garden-road-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', minzoom: 13, layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name'], ''], 'text-font': ['Noto Sans Regular'], 'text-size': 11 }, paint: { 'text-color': '#6b7c66', 'text-halo-color': '#f8f9f2', 'text-halo-width': 1.5 } },
    { id: 'garden-place-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', layout: { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name'], ''], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 3, 11, 12, 16], 'text-letter-spacing': 0.08, 'text-max-width': 8 }, paint: { 'text-color': '#52694f', 'text-halo-color': '#f8f9f2', 'text-halo-width': 2 } },
  ],
};
