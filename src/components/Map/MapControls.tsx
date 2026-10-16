import React, { useState } from 'react';
import { Crosshair, Layers, Compass, Plus, Minus, Box, Eye, EyeOff, Check, X } from 'lucide-react';
import { MAP_STYLES, MapStyleOption } from '../../utils/mapStyles';

interface MapControlsProps {
  onRecenter: () => void;
  onToggle3D: () => void;
  is3D: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  currentStyleId: string;
  onSelectStyle: (style: MapStyleOption) => void;
  isGpsLocked: boolean;
  isRouteVisible: boolean;
  onToggleRouteVisibility: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({ onRecenter, onToggle3D, is3D, onZoomIn, onZoomOut, onResetNorth, currentStyleId, onSelectStyle, isGpsLocked, isRouteVisible, onToggleRouteVisibility }) => {
  const [showLayers, setShowLayers] = useState(false);
  return <>
    <div className="map-tools" aria-label="Map controls"><div className="map-tool-group"><button className={isRouteVisible ? 'is-active' : ''} onClick={onToggleRouteVisibility} aria-pressed={isRouteVisible} aria-label={isRouteVisible ? 'Hide routes' : 'Show routes'} title={isRouteVisible ? 'Hide routes' : 'Show routes'}>{isRouteVisible ? <Eye size={20} /> : <EyeOff size={20} />}</button><button onClick={onToggle3D} className={is3D ? 'is-active' : ''} aria-pressed={is3D} aria-label="3D perspective" title="Toggle 3D perspective"><Box size={20} /></button><button onClick={() => setShowLayers(!showLayers)} className={showLayers ? 'is-active' : ''} aria-expanded={showLayers} aria-controls="map-style-panel" aria-label="Change map style" title="Map styles"><Layers size={20} /></button><button onClick={onResetNorth} aria-label="Reset map to north" title="Face north"><Compass size={20} /></button></div><div className="map-tool-group map-zoom-tools"><button onClick={onZoomIn} aria-label="Zoom in" title="Zoom in"><Plus size={20} /></button><button onClick={onZoomOut} aria-label="Zoom out" title="Zoom out"><Minus size={20} /></button></div>
      {showLayers && <section className="map-style-panel" id="map-style-panel" aria-label="Map styles" onKeyDown={e => { if (e.key === 'Escape') setShowLayers(false); }}><div><span className="app-kicker">A DIFFERENT PERSPECTIVE</span><button className="app-icon-button" onClick={() => setShowLayers(false)} aria-label="Close map styles"><X size={16} /></button></div><h2>Make the map yours.</h2>{MAP_STYLES.map(style => <button key={style.id} aria-pressed={currentStyleId === style.id} className={currentStyleId === style.id ? 'is-active' : ''} onClick={() => { onSelectStyle(style); setShowLayers(false); }}><span className="map-style-swatch" style={{ backgroundColor: style.previewColor }} /><span>{style.name}</span>{currentStyleId === style.id && <Check size={15} />}</button>)}</section>}
    </div>
    <button className={`map-recenter ${isGpsLocked ? 'is-active' : ''}`} onClick={onRecenter} aria-label="Center map on my location" title="My location"><Crosshair size={23} /></button>
  </>;
};
