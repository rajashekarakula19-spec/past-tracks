import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GPSPoint, TripSession, IdleStop } from '../../types/track';
import { MapControls } from './MapControls';
import { MAP_STYLES, MapStyleOption } from '../../utils/mapStyles';
import { computeBoundingBox, getTripStops, formatStopTimeRange, formatDuration } from '../../utils/geoUtils';

interface MapContainerProps {
  livePoints: GPSPoint[];
  pastTrips: TripSession[];
  selectedDate: string | null; // YYYY-MM-DD or null for all
  selectedTrip: TripSession | null;
  onSelectTrip: (trip: TripSession | null) => void;
  replayPoint: GPSPoint | null;
  isReplaying: boolean;
  isLiveTracking: boolean;
  isRouteVisible: boolean;
  onToggleRouteVisibility: () => void;
  userLocation: GPSPoint | null;
  liveStops?: IdleStop[];
  focusedStop?: IdleStop | null;
}

const LIVE_SOURCE_ID = 'live-trace-source';
const LIVE_LAYER_CASING_ID = 'live-trace-casing';
const LIVE_LAYER_GLOW_ID = 'live-trace-glow';
const LIVE_LAYER_CORE_ID = 'live-trace-core';

const PAST_SOURCE_ID = 'past-traces-source';
const PAST_LAYER_CASING_ID = 'past-traces-casing';
const PAST_LAYER_GLOW_ID = 'past-traces-glow';
const PAST_LAYER_CORE_ID = 'past-traces-core';

export const MapContainer: React.FC<MapContainerProps> = ({
  livePoints,
  pastTrips,
  selectedDate,
  selectedTrip,
  onSelectTrip,
  replayPoint,
  isReplaying,
  isRouteVisible,
  onToggleRouteVisibility,
  userLocation,
  liveStops,
  focusedStop,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const replayMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [currentStyle, setCurrentStyle] = useState<MapStyleOption>(MAP_STYLES[0]);
  const [is3D, setIs3D] = useState(true);
  const [isGpsLocked, setIsGpsLocked] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(0);
  const styleRef = useRef(currentStyle);
  const routeVisibleRef = useRef(isRouteVisible);
  routeVisibleRef.current = isRouteVisible;
  const tripSelectionRef = useRef({ pastTrips, onSelectTrip });
  tripSelectionRef.current = { pastTrips, onSelectTrip };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use current user location if available, otherwise 104 Allenhurst Rd
    const initialLng = userLocation ? userLocation.lng : -78.82206;
    const initialLat = userLocation ? userLocation.lat : 42.95674;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: currentStyle.url,
      center: [initialLng, initialLat],
      zoom: 15,
      pitch: 50, // 3D perspective by default
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;
    (window as any)._map = map;

    map.on('style.load', () => {
      setupLayers(map);
      setMapLoaded((version) => version + 1);
    });

      // Click on past route to inspect
      map.on('click', PAST_LAYER_CORE_ID, (e) => {
        if (e.features && e.features.length > 0) {
          const tripId = e.features[0].properties?.id;
          const found = tripSelectionRef.current.pastTrips.find((t) => t.id === tripId);
          if (found) {
            tripSelectionRef.current.onSelectTrip(found);
          }
        }
      });

      map.on('mouseenter', PAST_LAYER_CORE_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', PAST_LAYER_CORE_ID, () => {
        map.getCanvas().style.cursor = '';
      });

    map.on('dragstart', () => {
      if (!isReplaying) {
        setIsGpsLocked(false);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map style when changed
  const handleSelectStyle = (style: MapStyleOption) => {
    setCurrentStyle(style);
    styleRef.current = style;
    if (mapRef.current) {
      mapRef.current.setStyle(style.url);
    }
  };

  // Setup vector GeoJSON sources & high-contrast glowing line layers
  const setupLayers = (map: MapLibreMap) => {
    const isGarden = styleRef.current.id === 'pasttracks-garden';
    // 1. Past Traces Source & Layers
    if (!map.getSource(PAST_SOURCE_ID)) {
      map.addSource(PAST_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Casing layer: Dark outline to guarantee crystal-clear contrast against Satellite & Street textures
      if (!map.getLayer(PAST_LAYER_CASING_ID)) {
        map.addLayer({
          id: PAST_LAYER_CASING_ID,
          type: 'line',
          source: PAST_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': routeVisibleRef.current ? 'visible' : 'none',
          },
          paint: {
            'line-color': isGarden ? '#fffdf4' : '#000000',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 9],
            'line-opacity': isGarden ? 0.12 : 0.85,
          },
        });
      }

      // Glow layer (broad outer neon cyan bloom)
      if (!map.getLayer(PAST_LAYER_GLOW_ID)) {
        map.addLayer({
          id: PAST_LAYER_GLOW_ID,
          type: 'line',
          source: PAST_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': routeVisibleRef.current ? 'visible' : 'none',
          },
          paint: {
            'line-color': isGarden ? '#3d6244' : '#00f2fe',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 8, 16, 18],
            'line-opacity': isGarden ? 0.12 : 0.8,
            'line-blur': 7,
          },
        });
      }

      // Core line layer (bright crisp cyan core)
      if (!map.getLayer(PAST_LAYER_CORE_ID)) {
        map.addLayer({
          id: PAST_LAYER_CORE_ID,
          type: 'line',
          source: PAST_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': routeVisibleRef.current ? 'visible' : 'none',
          },
          paint: {
            'line-color': isGarden ? '#3d6244' : '#00f2fe',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 5],
            'line-opacity': 1,
          },
        });
      }


    }

    // 2. Live Tracking Source & Layers
    if (!map.getSource(LIVE_SOURCE_ID)) {
      map.addSource(LIVE_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Live casing
      if (!map.getLayer(LIVE_LAYER_CASING_ID)) {
        map.addLayer({
          id: LIVE_LAYER_CASING_ID,
          type: 'line',
          source: LIVE_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': routeVisibleRef.current ? 'visible' : 'none',
          },
          paint: {
            'line-color': isGarden ? '#fffdf4' : '#000000',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 10],
            'line-opacity': isGarden ? 0.12 : 0.85,
          },
        });
      }

      // Live Outer neon cyan glow
      if (!map.getLayer(LIVE_LAYER_GLOW_ID)) {
        map.addLayer({
          id: LIVE_LAYER_GLOW_ID,
          type: 'line',
          source: LIVE_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': routeVisibleRef.current ? 'visible' : 'none',
          },
          paint: {
            'line-color': isGarden ? '#3d6244' : '#00f2fe',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 8, 16, 20],
            'line-opacity': isGarden ? 0.12 : 0.8,
            'line-blur': 8,
          },
        });
      }

      // Live Core razor line
      if (!map.getLayer(LIVE_LAYER_CORE_ID)) {
        map.addLayer({
          id: LIVE_LAYER_CORE_ID,
          type: 'line',
          source: LIVE_SOURCE_ID,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': routeVisibleRef.current ? 'visible' : 'none',
          },
          paint: {
            'line-color': isGarden ? '#244c3a' : '#ffffff',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 5],
            'line-opacity': 1,
          },
        });
      }
    }

    // 3. 3D Building Extrusion Layer (renders 3D building blocks with realistic heights)
    try {
      const style = map.getStyle();
      if (style && style.sources) {
        const sourceKeys = Object.keys(style.sources);
        const vectorSourceKey = sourceKeys.find(
          (k) => k === 'openmaptiles' || k === 'composite' || k === 'carto' || (style.sources[k] as any).type === 'vector'
        );

        if (vectorSourceKey && !map.getLayer('3d-buildings-extruded')) {
          const layers = style.layers || [];
          let labelLayerId: string | undefined;
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout && (layers[i].layout as any)['text-field']) {
              labelLayerId = layers[i].id;
              break;
            }
          }

          map.addLayer(
            {
              id: '3d-buildings-extruded',
              source: vectorSourceKey,
              'source-layer': 'building',
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'render_height'],
                  0,
                  isGarden ? '#d4ddca' : '#1a1f2c',
                  50,
                  isGarden ? '#c3d1b6' : '#252e3d',
                  150,
                  isGarden ? '#a7b99b' : '#334155',
                ],
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14,
                  0,
                  15,
                  ['coalesce', ['get', 'render_height'], ['get', 'height'], 7],
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14,
                  0,
                  15,
                  ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
                ],
                'fill-extrusion-opacity': 0.85,
              },
            },
            labelLayerId
          );
        }
      }
    } catch (err) {
      console.warn('3D building extrusion not supported for current raster style:', err);
    }
  };

  // Update Past Trips GeoJSON (All paths in pure Neon Cyan)
  const updatePastLayers = useCallback(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource(PAST_SOURCE_ID) as GeoJSONSource;
    if (!source) return;

    // Filter trips by date or selection
    let filteredTrips = pastTrips;
    if (selectedTrip) {
      filteredTrips = [selectedTrip];
    } else if (selectedDate) {
      filteredTrips = pastTrips.filter((t) => t.dateKey === selectedDate);
    }

    const features: GeoJSON.Feature<GeoJSON.LineString>[] = filteredTrips
      .filter((trip) => trip.points.length >= 2)
      .map((trip) => ({
        type: 'Feature',
        properties: {
          id: trip.id,
          title: trip.title,
          color: '#00f2fe',
          distanceKm: trip.distanceKm,
          avgSpeedKmh: trip.avgSpeedKmh,
        },
        geometry: {
          type: 'LineString',
          coordinates: trip.points.map((p) => [p.lng, p.lat]),
        },
      }));

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    source.setData(geojsonData);
  }, [pastTrips, selectedDate, selectedTrip, mapLoaded]);

  useEffect(() => {
    updatePastLayers();
  }, [updatePastLayers]);

  // Auto fit bounds when selected trip changes
  useEffect(() => {
    if (!mapRef.current || !selectedTrip || selectedTrip.points.length === 0 || isReplaying) return;
    const bbox = computeBoundingBox(selectedTrip.points);
    if (bbox) {
      mapRef.current.fitBounds(bbox, { padding: 90, duration: 1000, pitch: is3D ? 50 : 0 });
    }
  }, [selectedTrip, is3D, isReplaying]);

  // Handle Route Visibility (Show / Hide lines)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const visibility = isRouteVisible ? 'visible' : 'none';

    const layerIds = [
      PAST_LAYER_CASING_ID,
      PAST_LAYER_GLOW_ID,
      PAST_LAYER_CORE_ID,
      LIVE_LAYER_CASING_ID,
      LIVE_LAYER_GLOW_ID,
      LIVE_LAYER_CORE_ID,
    ];

    layerIds.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visibility);
      }
    });
  }, [isRouteVisible, mapLoaded]);

  // Update Live GPS Line GeoJSON
  const updateLiveLayers = useCallback(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource(LIVE_SOURCE_ID) as GeoJSONSource;
    if (!source) return;

    const coords = livePoints.map((p) => [p.lng, p.lat]);

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features:
        coords.length >= 2
          ? [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: coords,
                },
              },
            ]
          : [],
    };

    source.setData(geojsonData);
  }, [livePoints, mapLoaded]);

  useEffect(() => {
    updateLiveLayers();
  }, [updateLiveLayers]);

  const hasAutoCenteredRef = useRef<boolean>(false);

  // Dedicated Real-Time User Location Marker (Google / Apple Maps Blue Puck + Accuracy Ring)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const loc = userLocation || (livePoints.length > 0 ? livePoints[livePoints.length - 1] : null);

    if (!loc) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'gps-marker relative flex items-center justify-center pointer-events-none z-50';
      el.style.width = '48px';
      el.style.height = '48px';

      el.innerHTML = `
        <!-- High-Visibility Glowing Pulse Ring -->
        <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-ping opacity-90"></div>
        <!-- Accuracy Halo -->
        <div class="absolute w-9 h-9 rounded-full bg-blue-500/25 border-2 border-blue-400/80 shadow-[0_0_25px_rgba(0,122,255,0.9)]"></div>
        <!-- Vivid Solid Blue Core (Google/Apple Maps style) -->
        <div class="relative w-5 h-5 rounded-full bg-[#007aff] border-3 border-white shadow-[0_2px_8px_rgba(0,0,0,0.8)] ring-2 ring-blue-400"></div>
        <!-- Heading Direction Pointer -->
        <div id="puck-heading" class="absolute -top-3.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#007aff] opacity-95 transition-transform duration-300"></div>
      `;

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map);

      // Smooth auto-center to real user position on first GPS lock
      if (!hasAutoCenteredRef.current && !selectedTrip) {
        hasAutoCenteredRef.current = true;
        map.flyTo({
          center: [loc.lng, loc.lat],
          zoom: 16,
          pitch: is3D ? 50 : 0,
          duration: 1500,
        });
      }
    } else {
      userMarkerRef.current.setLngLat([loc.lng, loc.lat]);
      const headingEl = userMarkerRef.current.getElement().querySelector('#puck-heading') as HTMLElement;
      if (headingEl && loc.heading !== null) {
        headingEl.style.transform = `rotate(${loc.heading}deg)`;
      }
    }

    // Auto-follow if GPS lock is on or during active movement
    if (isGpsLocked && !isReplaying) {
      map.easeTo({
        center: [loc.lng, loc.lat],
        duration: 300,
        pitch: is3D ? 50 : 0,
      });
    }
  }, [userLocation, livePoints, isGpsLocked, is3D, isReplaying, selectedTrip]);

  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Numbered place visits use the same times in the map and journey cards.
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    stopMarkersRef.current.forEach(marker => marker.remove());
    stopMarkersRef.current = [];
    if (!isRouteVisible) return;

    const tripsToShow = selectedTrip ? [selectedTrip] : selectedDate ? pastTrips.filter(trip => trip.dateKey === selectedDate) : pastTrips;
    const groups = tripsToShow.map(trip => ({ title: trip.title, stops: getTripStops(trip) }));
    if (liveStops?.length) groups.push({ title: 'Current journey', stops: liveStops });

    groups.forEach(group => group.stops.forEach((stop, index) => {
      const el = document.createElement('button');
      el.className = 'stop-checkpoint-marker';
      el.type = 'button';
      el.textContent = String(index + 1);
      el.dataset.checkpointId = stop.id;
      el.setAttribute('aria-label', `Checkpoint ${index + 1}: ${formatStopTimeRange(stop.startTime, stop.endTime)}`);
      el.title = `Stop ${index + 1} · ${formatStopTimeRange(stop.startTime, stop.endTime)}`;

      const content = document.createElement('div');
      content.className = 'stop-checkpoint-popup';
      const heading = document.createElement('strong');
      heading.textContent = `Checkpoint ${index + 1}`;
      const title = document.createElement('span');
      title.textContent = group.title;
      const time = document.createElement('p');
      time.textContent = formatStopTimeRange(stop.startTime, stop.endTime);
      const duration = document.createElement('span');
      duration.textContent = `${formatDuration(stop.durationSeconds * 1000)} in this area`;
      const timezone = document.createElement('small');
      timezone.textContent = `Times in ${Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}`;
      content.append(heading, title, time, duration, timezone);
      const popup = new maplibregl.Popup({ offset: 20, className: 'checkpoint-popup', maxWidth: '270px' }).setDOMContent(content);
      const marker = new maplibregl.Marker({ element: el }).setLngLat([stop.lng, stop.lat]).setPopup(popup).addTo(map);
      stopMarkersRef.current.push(marker);
    }));
    return () => { stopMarkersRef.current.forEach(marker => marker.remove()); stopMarkersRef.current = []; };
  }, [selectedTrip, selectedDate, pastTrips, mapLoaded, isRouteVisible, liveStops]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !focusedStop || !isRouteVisible) return;
    const marker = stopMarkersRef.current.find(item => item.getElement().dataset.checkpointId === focusedStop.id);
    if (!marker) return;
    setIsGpsLocked(false);
    stopMarkersRef.current.forEach(item => item.getPopup()?.remove());
    marker.togglePopup();
    let offset: [number, number] = [-60, 0];
    if (window.innerWidth < 640) {
      const headerBottom = document.querySelector('.app-header')?.getBoundingClientRect().bottom || 125;
      const panelTop = document.querySelector('.journey-detail, .activity-panel')?.getBoundingClientRect().top || window.innerHeight - 30;
      const popupHeight = marker.getPopup()?.getElement()?.getBoundingClientRect().height || 170;
      const desiredY = headerBottom + popupHeight + 30;
      const canFitPopup = desiredY + 25 < panelTop - 15;
      // On short screens the selected row already shows all times; focus the
      // map pin without squeezing a second copy behind the header or card.
      if (!canFitPopup) marker.getPopup()?.remove();
      const markerY = canFitPopup ? desiredY : (headerBottom + panelTop) / 2;
      offset = [-20, markerY - window.innerHeight / 2];
    }
    mapRef.current.flyTo({
      center: [focusedStop.lng, focusedStop.lat], zoom: 16, duration: 700, offset,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  }, [focusedStop, mapLoaded, isRouteVisible]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (!isReplaying || !replayPoint) {
      if (replayMarkerRef.current) {
        replayMarkerRef.current.remove();
        replayMarkerRef.current = null;
      }
      return;
    }

    if (!replayMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'replay-marker relative flex items-center justify-center pointer-events-none';
      el.style.width = '44px';
      el.style.height = '44px';
      el.innerHTML = `
        <div class="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse"></div>
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 border-2 border-white flex items-center justify-center shadow-[0_0_20px_rgba(176,0,255,0.9)] text-white text-xs font-bold">
          ⚡
        </div>
      `;

      replayMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([replayPoint.lng, replayPoint.lat])
        .addTo(map);
    } else {
      replayMarkerRef.current.setLngLat([replayPoint.lng, replayPoint.lat]);
    }

    // Follow-Cam smooth transition
    map.easeTo({
      center: [replayPoint.lng, replayPoint.lat],
      duration: 300,
      pitch: 60,
      zoom: 16.5,
      bearing: replayPoint.heading !== null ? replayPoint.heading : map.getBearing(),
    });
  }, [replayPoint, isReplaying]);

  // Recenter GPS Handler: prioritize real user location
  const handleRecenter = () => {
    setIsGpsLocked(true);
    if (!mapRef.current) return;

    const loc = userLocation || (livePoints.length > 0 ? livePoints[livePoints.length - 1] : null);

    if (loc) {
      mapRef.current.flyTo({
        center: [loc.lng, loc.lat],
        zoom: 16.5,
        pitch: is3D ? 55 : 0,
        duration: 1200,
      });
    } else if (selectedTrip && selectedTrip.points.length > 0) {
      const bbox = computeBoundingBox(selectedTrip.points);
      if (bbox) {
        mapRef.current.fitBounds(bbox, { padding: 80, duration: 1200 });
      }
    } else if (pastTrips.length > 0) {
      const allPoints = pastTrips.flatMap((t) => t.points);
      const bbox = computeBoundingBox(allPoints);
      if (bbox) {
        mapRef.current.fitBounds(bbox, { padding: 80, duration: 1200 });
      }
    }
  };

  // Toggle 3D Perspective
  const handleToggle3D = () => {
    if (!mapRef.current) return;
    const next3D = !is3D;
    setIs3D(next3D);
    mapRef.current.easeTo({
      pitch: next3D ? 60 : 0,
      duration: 800,
    });
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetNorth = () => {
    mapRef.current?.easeTo({ bearing: 0, pitch: is3D ? 55 : 0, duration: 600 });
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${currentStyle.id === 'pasttracks-garden' ? 'garden-map' : ''}`}>
      {/* Keep map markers and popups below app panels in their own stacking context. */}
      <div ref={mapContainerRef} className="relative isolate w-full h-full bg-[#090a0f]" />

      {currentStyle.id === 'pasttracks-garden' && (
        <div className="absolute bottom-0 left-0 z-20 bg-[#f8f9f2]/95 px-2 py-0.5 text-[9px] text-[#52694f] pointer-events-auto">
          <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>{' · '}
          <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">© OpenMapTiles</a>{' · '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
        </div>
      )}
      {/* Map Interactive Controls */}
      <MapControls
        onRecenter={handleRecenter}
        onToggle3D={handleToggle3D}
        is3D={is3D}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetNorth={handleResetNorth}
        currentStyleId={currentStyle.id}
        onSelectStyle={handleSelectStyle}
        isGpsLocked={isGpsLocked}
        isRouteVisible={isRouteVisible}
        onToggleRouteVisibility={onToggleRouteVisibility}
      />
    </div>
  );
};
