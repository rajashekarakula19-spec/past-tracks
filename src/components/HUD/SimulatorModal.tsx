import React, { useEffect, useRef } from 'react';
import { X, Play, Square, Compass, Car, Footprints } from 'lucide-react';
import { SIMULATION_PRESETS, SimulationPreset } from '../../services/gpsSimulator';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSimulating: boolean;
  onStartSimulation: (preset: SimulationPreset) => void;
  onStopSimulation: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose, isSimulating, onStartSimulation, onStopSimulation }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);
  return <dialog ref={dialogRef} className="demo-dialog" aria-labelledby="demo-dialog-title" onCancel={onClose} onClose={onClose}>
    <div className="demo-dialog-heading"><span className="activity-symbol"><Compass size={23} /></span><button className="app-icon-button" onClick={onClose} aria-label="Close demo journeys"><X size={19} /></button></div>
    <span className="app-kicker">A LITTLE INSPIRATION</span><h2 id="demo-dialog-title">Try a journey from here.</h2><p>See how recording works with a simulated route. No need to head outside.</p>
    <div className="demo-routes">{SIMULATION_PRESETS.map(preset => <article key={preset.id}><span className="activity-symbol">{preset.type === 'drive' ? <Car size={20} /> : <Footprints size={20} />}</span><div><h3>{preset.name}</h3><p>{preset.type === 'drive' ? 'A drive to the outlets, with a walk along the way.' : 'An easy stroll through the mall.'}</p><span>Simulated {preset.type} · {preset.avgSpeedKmh} km/h average</span></div><button className="journey-replay" aria-label={`Try ${preset.name}`} onClick={() => { onStartSimulation(preset); onClose(); }}><Play size={16} fill="currentColor" /></button></article>)}</div>
    {isSimulating && <div className="demo-running"><span>A demo journey is running.</span><button className="app-secondary-button" onClick={() => { onStopSimulation(); onClose(); }}><Square size={13} />Stop demo</button></div>}
    <p className="demo-note">Demo points are simulated. Stop the demo before recording a real journey.</p>
  </dialog>;
};
