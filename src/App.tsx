import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { MapContainer } from './components/Map/MapContainer';
import { TopHeader } from './components/HUD/TopHeader';
import { LiveTrackerBar } from './components/HUD/LiveTrackerBar';
import { DateFilterDrawer } from './components/HUD/DateFilterDrawer';
import { TripStatsCard } from './components/HUD/TripStatsCard';
import { HistoryScrubber } from './components/Timeline/HistoryScrubber';
import { SimulatorModal } from './components/HUD/SimulatorModal';
import { DeveloperController } from './components/HUD/DeveloperController';
import { GPSPoint, TripSession, AppMode, LiveTrackingStats, IdleStop } from './types/track';
import { gpsTracker } from './services/gpsTracker';
import { gpsSimulator, SimulationPreset } from './services/gpsSimulator';
import { getAllTrips, groupTripsByDate, deleteTrip, clearAllTrips, reseedStreetDemoTrips } from './services/storage';
import { formatDateKey } from './utils/geoUtils';
import './app-ui.css';

export const App: React.FC = () => {
  const todayKey = formatDateKey(Date.now());
  const appLayoutRef = useRef<HTMLElement>(null);
  const [focusedStop, setFocusedStop] = useState<IdleStop | null>(null);
  const [appMode, setAppMode] = useState<AppMode>('live');
  const [livePoints, setLivePoints] = useState<GPSPoint[]>([]);
  const [userLocation, setUserLocation] = useState<GPSPoint | null>(gpsTracker.getCurrentUserLocation());
  const [liveStats, setLiveStats] = useState<LiveTrackingStats>(gpsTracker.getStats());
  const [pastTrips, setPastTrips] = useState<TripSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayKey);
  const [selectedTrip, setSelectedTrip] = useState<TripSession | null>(null);
  const [isRouteVisible, setIsRouteVisible] = useState<boolean>(true);

  // 3D Replay State
  const [replayingTrip, setReplayingTrip] = useState<TripSession | null>(null);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(2);
  const replayIntervalRef = useRef<any>(null);

  // Simulator & Developer Modal State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isDevModeOpen, setIsDevModeOpen] = useState<boolean>(false);

  // Keep the mobile location button above cards, including expanded checkpoints.
  useEffect(() => {
    const root = appLayoutRef.current;
    const panel = root?.querySelector('.activity-panel, .journey-detail, .replay-panel');
    if (!root || !panel) return;
    const update = () => root.style.setProperty('--map-panel-height', `${panel.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    update();
    return () => observer.disconnect();
  }, [appMode, selectedTrip]);

  const handleSelectStop = (stop: IdleStop) => {
    setIsRouteVisible(true);
    setFocusedStop({ ...stop });
  };

  // Load Trips on mount
  const refreshTrips = async () => {
    const trips = await getAllTrips();
    const hasOldDemos = trips.some((t) => t.id === 'demo_sf_coastal');
    if (hasOldDemos || trips.length === 0) {
      const reseeded = await reseedStreetDemoTrips();
      setPastTrips(reseeded);
    } else {
      setPastTrips(trips);
    }
  };

  useEffect(() => {
    refreshTrips();
  }, []);

  // Subscribe to GPS Tracker stream and immediate User Location
  useEffect(() => {
    const unsubscribePosition = gpsTracker.subscribePosition((stats, point) => {
      setLiveStats(stats);
      setLivePoints((prev) => [...prev, point]);
    });

    const unsubscribeStats = gpsTracker.subscribeStats((stats) => {
      setLiveStats(stats);
    });

    const unsubscribeState = gpsTracker.subscribeState(() => {
      setLiveStats(gpsTracker.getStats());
    });

    const unsubscribeLocation = gpsTracker.subscribeUserLocation((loc) => {
      setUserLocation(loc);
      setLiveStats(gpsTracker.getStats());
    });

    return () => {
      unsubscribePosition();
      unsubscribeStats();
      unsubscribeState();
      unsubscribeLocation();
    };
  }, []);

  // Grouped trips by date YYYY-MM-DD
  const groupedTrips = useMemo(() => {
    return groupTripsByDate(pastTrips);
  }, [pastTrips]);

  // Live Tracking Actions
  const handleStartLive = async () => {
    await gpsTracker.startTracking();
  };

  const handlePauseLive = () => {
    gpsTracker.pauseTracking();
  };

  const handleResumeLive = () => {
    gpsTracker.resumeTracking();
  };

  const handleStopAndSaveLive = async () => {
    const saved = await gpsTracker.stopAndSaveTrip();
    setLivePoints([]);
    setLiveStats(gpsTracker.getStats());

    if (saved) {
      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#244c3a', '#d7edac', '#8da864', '#bed7d5'],
        });
      } catch {}
      await refreshTrips();
      setSelectedTrip(saved);
      setAppMode('history');
    }
  };

  // Simulation handlers
  const handleStartSimulation = (preset: SimulationPreset) => {
    setIsSimulating(true);
    gpsSimulator.startSimulation(preset);
    setAppMode('live');
  };

  const handleStopSimulation = () => {
    gpsSimulator.stopSimulation();
    setIsSimulating(false);
  };

  const handleClearDevTrace = async () => {
    await gpsTracker.cancelTracking();
    setLivePoints([]);
    setLiveStats(gpsTracker.getStats());

    if (selectedTrip) {
      await deleteTrip(selectedTrip.id);
      setSelectedTrip(null);
      await refreshTrips();
    }
  };

  // Replay Handlers
  const handleStartReplay = (trip: TripSession) => {
    setFocusedStop(null);
    setReplayingTrip(trip);
    setReplayIndex(0);
    setIsReplaying(true);
    setAppMode('replay');
    setSelectedTrip(null);
  };

  const handleExitReplay = () => {
    setIsReplaying(false);
    setReplayingTrip(null);
    setReplayIndex(0);
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
    }
    setAppMode('history');
  };

  // Replay timer loop
  useEffect(() => {
    if (isReplaying && replayingTrip && replayingTrip.points.length > 0) {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);

      const intervalMs = Math.max(30, 200 / replaySpeed);
      replayIntervalRef.current = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= replayingTrip.points.length - 1) {
            setIsReplaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    }

    return () => {
      if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
    };
  }, [isReplaying, replayingTrip, replaySpeed]);

  const currentReplayPoint =
    replayingTrip && replayingTrip.points[replayIndex]
      ? replayingTrip.points[replayIndex]
      : null;

  // Delete Trip
  const handleDeleteTrip = async (tripId: string) => {
    if (confirm('Delete this recorded travel trace?')) {
      await deleteTrip(tripId);
      if (selectedTrip?.id === tripId) setSelectedTrip(null);
      await refreshTrips();
    }
  };

  // Delete Multiple Trips
  const handleDeleteMultipleTrips = async (tripIds: string[]) => {
    for (const id of tripIds) {
      await deleteTrip(id);
    }
    if (selectedTrip && tripIds.includes(selectedTrip.id)) setSelectedTrip(null);
    await refreshTrips();
  };

  // Clear All Trips
  const handleClearAllTrips = async () => {
    if (confirm('Are you sure you want to permanently delete ALL recorded journeys and travel history?')) {
      await clearAllTrips();
      setSelectedTrip(null);
      await refreshTrips();
    }
  };

  return (
    <main ref={appLayoutRef} className={`tracker-app app-mode-${appMode === 'replay' ? 'replay' : appMode === 'history' ? 'history' : selectedTrip ? 'detail' : liveStats.status !== 'idle' ? 'recording' : 'record'} fixed inset-0 w-full h-[100dvh] overflow-hidden select-none`}>
      {/* Top Floating Navigation Header */}
      <TopHeader
        currentMode={appMode}
        onSelectMode={(mode) => {
          setAppMode(mode);
          setFocusedStop(null);
          if (mode === 'live') setSelectedTrip(null);
          if (mode !== 'replay') {
            setIsReplaying(false);
            setReplayingTrip(null);
          }
        }}
        isTracking={liveStats.status === 'recording'}
        isSimulating={isSimulating}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        accuracy={liveStats.accuracy}
        onOpenDevMode={() => setIsDevModeOpen(true)}
      />

      {/* 3D WebGL Vector Map */}
      <MapContainer
        livePoints={livePoints}
        pastTrips={pastTrips}
        selectedDate={selectedDate}
        selectedTrip={selectedTrip || replayingTrip}
        onSelectTrip={(t) => {
          setSelectedTrip(t);
          if (t) setAppMode('history');
        }}
        replayPoint={currentReplayPoint}
        isReplaying={appMode === 'replay'}
        isLiveTracking={liveStats.status === 'recording'}
        isRouteVisible={isRouteVisible}
        onToggleRouteVisibility={() => setIsRouteVisible(!isRouteVisible)}
        userLocation={userLocation}
        liveStops={appMode === 'live' && !selectedTrip ? liveStats.idleStops : undefined}
        focusedStop={focusedStop}
      />

      {/* Mode 1: Live Phone GPS Tracking HUD */}
      {appMode === 'live' && !selectedTrip && (
        <LiveTrackerBar
          stats={liveStats}
          onStart={handleStartLive}
          onPause={handlePauseLive}
          onResume={handleResumeLive}
          onStop={handleStopAndSaveLive}
          onBrowseJourneys={() => { setSelectedTrip(null); setAppMode('history'); }}
          isSimulating={isSimulating}
          onSelectStop={handleSelectStop}
        />
      )}

      {/* Mode 2: Past History Dates Drawer (Dedicated Window / Page on Mobile) */}
      {appMode === 'history' && (
        <DateFilterDrawer
          groupedTrips={groupedTrips}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedTrip={selectedTrip}
          onSelectTrip={(trip) => {
            setSelectedTrip(trip);
            setFocusedStop(null);
            if (trip) {
              setAppMode('live'); // ONLY switch to map when a valid trip is chosen
            }
          }}
          onStartReplay={(trip) => {
            handleStartReplay(trip);
          }}
          onDeleteTrip={handleDeleteTrip}
          onDeleteTrips={handleDeleteMultipleTrips}
          isRouteVisible={isRouteVisible}
          onToggleRouteVisibility={() => setIsRouteVisible(!isRouteVisible)}
          liveStats={liveStats}
          onStartLiveTracking={() => {
            handleStartLive();
            setAppMode('live');
          }}
          onCloseMobileDrawer={() => setAppMode('live')}
          onClearAllTrips={handleClearAllTrips}
        />
      )}

      {/* Selected Past Trip Details Card on Map */}
      {selectedTrip && appMode !== 'history' && (
        <TripStatsCard
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onStartReplay={handleStartReplay}
          onDeleteTrip={handleDeleteTrip}
          onSelectStop={handleSelectStop}
        />
      )}

      {/* Mode 3: 3D Follow-Cam Journey Replay & Scrubber */}
      {appMode === 'replay' && replayingTrip && (
        <HistoryScrubber
          trip={replayingTrip}
          currentPointIndex={replayIndex}
          onScrub={(idx) => setReplayIndex(idx)}
          isPlaying={isReplaying}
          onTogglePlay={() => setIsReplaying(!isReplaying)}
          onReset={() => {
            setReplayIndex(0);
            setIsReplaying(true);
          }}
          playbackSpeed={replaySpeed}
          onChangeSpeed={setReplaySpeed}
          onExitReplay={handleExitReplay}
        />
      )}

      {/* Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        isSimulating={isSimulating}
        onStartSimulation={handleStartSimulation}
        onStopSimulation={handleStopSimulation}
      />

      {/* Developer Mode Manual GPS Controller (Password: 1234) */}
      <DeveloperController
        isOpen={isDevModeOpen}
        onClose={() => setIsDevModeOpen(false)}
        userLocation={userLocation}
        onClearTrack={handleClearDevTrace}
      />
    </main>
  );
};
export default App;
