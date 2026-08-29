import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { Lock, Unlock, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Gauge, Coffee, Trash2 } from 'lucide-react';
import { GPSPoint } from '../../types/track';
import { gpsTracker } from '../../services/gpsTracker';

interface DeveloperControllerProps {
  userLocation: GPSPoint | null;
  isOpen: boolean;
  onClose: () => void;
  onClearTrack: () => void;
}

export const DeveloperController: React.FC<DeveloperControllerProps> = ({
  userLocation,
  isOpen,
  onClose,
  onClearTrack,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [moveMode, setMoveMode] = useState<'walk' | 'bike' | 'drive'>('walk');

  const currentPosRef = useRef<{ lat: number; lng: number }>({
    lat: userLocation ? userLocation.lat : 42.95674,
    lng: userLocation ? userLocation.lng : -78.82206,
  });

  useEffect(() => {
    if (userLocation) {
      currentPosRef.current = { lat: userLocation.lat, lng: userLocation.lng };
    }
  }, [userLocation]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      setIsUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect password');
    }
  };

  const stepSizes = {
    walk: { meters: 6, speedKmh: 4.5 },
    bike: { meters: 18, speedKmh: 18.0 },
    drive: { meters: 45, speedKmh: 55.0 },
  };

  const movePosition = (dNorthMeters: number, dEastMeters: number, heading: number) => {
    const { lat, lng } = currentPosRef.current;
    const { speedKmh } = stepSizes[moveMode];

    const earthRadius = 6378137;
    const newLat = lat + (dNorthMeters / earthRadius) * (180 / Math.PI);
    const newLng = lng + (dEastMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

    currentPosRef.current = { lat: newLat, lng: newLng };

    const newPt: GPSPoint = {
      id: `dev_pt_${Date.now()}`,
      lng: newLng,
      lat: newLat,
      altitude: 195,
      speed: (speedKmh * 1000) / 3600,
      speedKmh,
      heading,
      accuracy: 1.5,
      timestamp: Date.now(),
    };

    // Auto-center map camera directly on the moving figure on every step
    if (typeof window !== 'undefined' && (window as any)._map) {
      (window as any)._map.easeTo({
        center: [newLng, newLat],
        duration: 200,
      });
    }

    if (gpsTracker.getStats().status === 'idle') {
      gpsTracker.startTracking();
    }

    gpsTracker.injectSimulatedPoint(newPt);
  };

  const handleMoveUp = () => movePosition(stepSizes[moveMode].meters, 0, 0);
  const handleMoveDown = () => movePosition(-stepSizes[moveMode].meters, 0, 180);
  const handleMoveLeft = () => movePosition(0, -stepSizes[moveMode].meters, 270);
  const handleMoveRight = () => movePosition(0, stepSizes[moveMode].meters, 90);

  const handleSimulateStop = (durationMinutes: number = 2) => {
    const { lat, lng } = currentPosRef.current;
    const startTime = Date.now();
    const durationMs = durationMinutes * 60 * 1000;

    for (let i = 0; i <= 4; i++) {
      const pt: GPSPoint = {
        id: `dev_stop_${startTime}_${i}`,
        lng: lng + (Math.random() - 0.5) * 0.00002,
        lat: lat + (Math.random() - 0.5) * 0.00002,
        altitude: 195,
        speed: 0,
        speedKmh: 0,
        heading: null,
        accuracy: 1.5,
        timestamp: startTime + (durationMs * i) / 4,
      };
      gpsTracker.injectSimulatedPoint(pt);
    }
  };

  useEffect(() => {
    if (!isUnlocked || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleMoveUp();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleMoveDown();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleMoveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleMoveRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, isOpen, moveMode]);

  if (!isOpen) return null;

  return (
    /* Non-blocking, compact floating bottom-right widget (No map blur, no full-screen dimming) */
    <div className="fixed right-3 sm:right-5 bottom-20 sm:bottom-24 z-40 pointer-events-auto select-none">
      <GlassCard
        variant="elevated"
        className="w-64 sm:w-72 p-3.5 flex flex-col gap-2.5 shadow-2xl border-cyan-500/40 bg-black/85 backdrop-blur-md rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
            {isUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
            <span>Dev GPS Controller</span>
          </div>
          <button
            onClick={onClose}
            title="Close Dev Controller"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Password Screen */}
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="flex flex-col gap-2 py-1">
            <p className="text-[11px] text-zinc-300">
              Enter developer PIN / password:
            </p>
            <div className="flex gap-1.5">
              <input
                type="password"
                placeholder="Enter PIN"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/20 text-white placeholder-zinc-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md transition-all whitespace-nowrap"
              >
                Unlock
              </button>
            </div>
            {errorMsg && <p className="text-[10px] text-rose-400 font-mono">{errorMsg}</p>}
          </form>
        ) : (
          /* Compact Arrow Controller Screen */
          <div className="flex flex-col gap-2.5">
            {/* Speed Mode Selector */}
            <div className="flex items-center justify-between gap-1 p-1 rounded-lg bg-black/50 border border-white/10 text-[10px]">
              <div className="flex items-center gap-1 px-1 text-zinc-400">
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span>Mode:</span>
              </div>
              <div className="flex gap-1">
                {(['walk', 'bike', 'drive'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMoveMode(m)}
                    className={`px-2 py-0.5 rounded font-semibold uppercase text-[9px] transition-all ${
                      moveMode === m
                        ? 'bg-cyan-500 text-black shadow-[0_0_8px_#00f2fe]'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact D-Pad Arrow Buttons */}
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              {/* Up */}
              <button
                onClick={handleMoveUp}
                title="Step North / Forward"
                className="w-11 h-11 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 active:bg-cyan-500 active:text-black border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.35)] flex items-center justify-center text-cyan-300 transition-all"
              >
                <ArrowUp className="w-6 h-6" />
              </button>

              {/* Left & Right */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleMoveLeft}
                  title="Step West / Left"
                  className="w-11 h-11 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 active:bg-cyan-500 active:text-black border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.35)] flex items-center justify-center text-cyan-300 transition-all"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleMoveRight}
                  title="Step East / Right"
                  className="w-11 h-11 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 active:bg-cyan-500 active:text-black border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.35)] flex items-center justify-center text-cyan-300 transition-all"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>

              {/* Down */}
              <button
                onClick={handleMoveDown}
                title="Step South / Backward"
                className="w-11 h-11 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 active:bg-cyan-500 active:text-black border border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.35)] flex items-center justify-center text-cyan-300 transition-all"
              >
                <ArrowDown className="w-6 h-6" />
              </button>
            </div>

            {/* Action Buttons: Simulate Stop & Delete Trace */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10">
              <button
                onClick={() => handleSimulateStop(2)}
                title="Simulate 2-minute idle stop at current position"
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold transition-all"
              >
                <Coffee className="w-3 h-3" />
                <span>Add Stop</span>
              </button>

              <button
                onClick={onClearTrack}
                title="Delete current trace and reset tracking"
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-semibold transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear/Delete</span>
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
