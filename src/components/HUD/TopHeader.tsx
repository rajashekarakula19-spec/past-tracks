import React, { useEffect, useRef, useState } from 'react';
import { Route, Circle, CalendarDays, MoreHorizontal, Compass, Terminal, LocateFixed, ArrowUpRight } from 'lucide-react';
import { AppMode } from '../../types/track';

interface TopHeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  isTracking: boolean;
  accuracy: number;
  onOpenSimulator: () => void;
  isSimulating: boolean;
  onOpenDevMode: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ currentMode, onSelectMode, isTracking, accuracy, onOpenSimulator, isSimulating, onOpenDevMode }) => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onPointer = (event: PointerEvent) => { if (!toolsRef.current?.contains(event.target as Node)) setToolsOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setToolsOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, []);
  return <header className="app-header">
    <a className="app-brand" href="#" aria-label="PastTracks home — back to landing page"><span><Route size={23} /></span><div><strong>PastTracks<span>.</span></strong><small>A little more meaning in every mile.</small></div></a>
    <nav className="app-tabs" aria-label="App navigation"><button className={currentMode === 'live' ? 'is-active' : ''} aria-pressed={currentMode === 'live'} onClick={() => onSelectMode('live')}><Circle size={15} fill={isTracking ? 'currentColor' : 'none'} />Record{isTracking && <span className="app-recording-dot" />}</button><button className={currentMode === 'history' ? 'is-active' : ''} aria-pressed={currentMode === 'history'} onClick={() => onSelectMode('history')}><CalendarDays size={16} />Journeys</button></nav>
    <div className="app-header-actions"><span className="app-location-status" title={accuracy > 0 ? `Location accuracy: approximately ${Math.round(accuracy)} meters` : 'Allow location access to find yourself on the map'}><LocateFixed size={15} /><span>{accuracy > 0 ? `Location ±${Math.round(accuracy)} m` : 'Finding your location'}</span></span><div className="app-tools" ref={toolsRef}><button className="app-icon-button" onClick={() => setToolsOpen(!toolsOpen)} aria-expanded={toolsOpen} aria-controls="app-tools-panel" aria-label="More options"><MoreHorizontal size={22} /></button>{toolsOpen && <div className="app-tools-panel" id="app-tools-panel"><span className="app-kicker">EXPLORE & MORE</span><button onClick={() => { onOpenSimulator(); setToolsOpen(false); }}><Compass size={17} /><span>{isSimulating ? 'Manage demo journey' : 'Try a demo journey'}<small>Explore without heading outside</small></span></button><button onClick={() => { onOpenDevMode(); setToolsOpen(false); }}><Terminal size={17} /><span>Developer tools<small>Manual GPS controls</small></span></button><a href="#" onClick={() => setToolsOpen(false)}><ArrowUpRight size={17} />Back to welcome page</a></div>}</div></div>
  </header>;
};
