import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Keyboard, Activity, Zap, Play, Square, Clock, Settings2, Sliders, Edit3, X, Smartphone } from 'lucide-react';

// --- TYPES ---
type SoundEngine = 'synth' | 'sample';
type InstrumentType = 'kick' | 'snare' | 'hihat' | 'openhat' | 'tom' | 'clap' | 'fx' | 'crash';

interface Pad {
  id: number;
  key: string;
  label: string;
  engine: SoundEngine;
  type: InstrumentType; 
  sampleUrl?: string;   
  color: string;
  pitch: number;  
  decay: number;  
}

// --- DEFAULT CONFIGURATION ---
const DEFAULT_PADS: Pad[] = [
  // Row 1
  { id: 1, key: '1', label: 'Crash', engine: 'synth', type: 'crash', pitch: 1, decay: 0.5, color: 'shadow-yellow-500 border-yellow-500 text-yellow-500' },
  { id: 2, key: '2', label: 'Ride', engine: 'synth', type: 'openhat', pitch: 0.8, decay: 0.4, color: 'shadow-yellow-500 border-yellow-500 text-yellow-500' },
  { id: 3, key: '3', label: 'Open Hat', engine: 'synth', type: 'openhat', pitch: 1, decay: 0.3, color: 'shadow-amber-500 border-amber-500 text-amber-500' },
  { id: 4, key: '4', label: 'Hi-Hat', engine: 'synth', type: 'hihat', pitch: 1, decay: 0.1, color: 'shadow-amber-500 border-amber-500 text-amber-500' },
  // Row 2
  { id: 5, key: 'q', label: 'High Tom', engine: 'synth', type: 'tom', pitch: 1.2, decay: 0.3, color: 'shadow-cyan-500 border-cyan-500 text-cyan-500' },
  { id: 6, key: 'w', label: 'Mid Tom', engine: 'synth', type: 'tom', pitch: 1.0, decay: 0.3, color: 'shadow-cyan-500 border-cyan-500 text-cyan-500' },
  { id: 7, key: 'e', label: 'Low Tom', engine: 'synth', type: 'tom', pitch: 0.8, decay: 0.4, color: 'shadow-blue-500 border-blue-500 text-blue-500' },
  { id: 8, key: 'r', label: 'Clap', engine: 'synth', type: 'clap', pitch: 1, decay: 0.2, color: 'shadow-pink-500 border-pink-500 text-pink-500' },
  // Row 3
  { id: 9, key: 'a', label: 'Snare 1', engine: 'synth', type: 'snare', pitch: 1, decay: 0.2, color: 'shadow-fuchsia-500 border-fuchsia-500 text-fuchsia-500' },
  { id: 10, key: 's', label: 'Snare 2', engine: 'synth', type: 'snare', pitch: 1.2, decay: 0.15, color: 'shadow-fuchsia-500 border-fuchsia-500 text-fuchsia-500' },
  { id: 11, key: 'd', label: 'Rim', engine: 'synth', type: 'hihat', pitch: 0.5, decay: 0.05, color: 'shadow-purple-500 border-purple-500 text-purple-500' },
  { id: 12, key: 'f', label: 'Zap', engine: 'synth', type: 'fx', pitch: 1, decay: 0.3, color: 'shadow-emerald-500 border-emerald-500 text-emerald-500' },
  // Row 4
  { id: 13, key: 'z', label: 'Kick Hard', engine: 'synth', type: 'kick', pitch: 1, decay: 0.5, color: 'shadow-red-500 border-red-500 text-red-500' },
  { id: 14, key: 'x', label: 'Kick Soft', engine: 'synth', type: 'kick', pitch: 1.2, decay: 0.4, color: 'shadow-red-500 border-red-500 text-red-500' },
  { id: 15, key: 'c', label: 'Sub Bass', engine: 'synth', type: 'kick', pitch: 0.5, decay: 0.8, color: 'shadow-rose-500 border-rose-500 text-rose-500' },
  { id: 16, key: 'v', label: 'Laser', engine: 'synth', type: 'fx', pitch: 1.5, decay: 0.5, color: 'shadow-green-500 border-green-500 text-green-500' },
];

const INITIAL_GRID: Record<number, boolean[]> = {};
DEFAULT_PADS.forEach(pad => { INITIAL_GRID[pad.id] = Array(16).fill(false); });

function App() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // --- STATE ---
  const [pads, setPads] = useState<Pad[]>(DEFAULT_PADS);
  const [activePadId, setActivePadId] = useState<number | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  // Mode States
  const [editMode, setEditMode] = useState(false);
  const [selectedPadId, setSelectedPadId] = useState<number | null>(null);

  // Sequencer States
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [sequencerGrid, setSequencerGrid] = useState(INITIAL_GRID);

  // --- GHOST CLICK PREVENTION ---
  const lastTouchTimeRef = useRef<number>(0);

  // --- AUDIO INIT ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current!;
    if (ctx.state === 'suspended') ctx.resume();

    // Silent buffer fix for iOS
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    setAudioUnlocked(true);
  };

  // --- AUDIO ENGINE ---
  const playSound = useCallback((pad: Pad) => {
    if (!audioCtxRef.current) initAudio();
    const ctx = audioCtxRef.current!;
    if (!ctx) return;
    
    // Visual Trigger
    setActivePadId(pad.id);
    setTimeout(() => setActivePadId(null), 80); // Slightly faster visual reset

    const t = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume;

    if (pad.engine === 'synth') {
      if (pad.type === 'kick') {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(150 * pad.pitch, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + pad.decay);
        gainNode.gain.setValueAtTime(volume, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
        osc.connect(gainNode);
        osc.start(t);
        osc.stop(t + pad.decay);
      } 
      else if (pad.type === 'snare') {
        const noise = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * pad.decay;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000 * pad.pitch;
        noise.connect(noiseFilter);
        noiseFilter.connect(gainNode);
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100 * pad.pitch, t);
        noise.start(t);
        osc.connect(gainNode);
        osc.start(t);
        osc.stop(t + 0.2);
      }
      else if (pad.type === 'hihat' || pad.type === 'openhat') {
        const bufferSize = ctx.sampleRate * pad.decay;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 10000 * pad.pitch;
        noise.connect(bandpass);
        bandpass.connect(gainNode);
        gainNode.gain.setValueAtTime(volume * 0.8, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
        noise.start(t);
      }
      else if (pad.type === 'tom') {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(200 * pad.pitch, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + pad.decay);
        gainNode.gain.setValueAtTime(volume, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
        osc.connect(gainNode);
        osc.start(t);
        osc.stop(t + pad.decay);
      }
      else if (pad.type === 'clap') {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500 * pad.pitch;
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(volume, t + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
        noise.start(t);
      }
      else if (pad.type === 'fx' || pad.type === 'crash') {
        const osc = ctx.createOscillator();
        osc.type = pad.type === 'crash' ? 'square' : 'sawtooth';
        osc.frequency.setValueAtTime(800 * pad.pitch, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + pad.decay);
        gainNode.gain.setValueAtTime(volume * 0.5, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
        osc.connect(gainNode);
        osc.start(t);
        osc.stop(t + pad.decay);
      }
    }
  }, [volume]);

  // --- HANDLER WRAPPERS ---
  const handleTouchStart = (e: React.TouchEvent, pad: Pad) => {
    e.preventDefault(); // Stop iOS from firing emulated mouse events
    lastTouchTimeRef.current = Date.now(); // Mark time
    initAudio();
    
    if (editMode) {
      setSelectedPadId(pad.id);
    } else {
      playSound(pad);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, pad: Pad) => {
    // IGNORE mouse event if a touch happened less than 500ms ago
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    
    initAudio();
    if (editMode) {
      setSelectedPadId(pad.id);
    } else {
      playSound(pad);
    }
  };

  // --- KEYBOARD LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const pad = pads.find(p => p.key === e.key.toLowerCase());
      if (pad) playSound(pad);
      if (e.code === 'Space') {
          e.preventDefault();
          setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSound, pads]);

  // --- SEQUENCER CLOCK ---
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      const intervalTime = (60 / bpm) * 1000 / 4;
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const nextStep = (prev + 1) % 16;
          pads.forEach(pad => {
            if (sequencerGrid[pad.id][nextStep]) playSound(pad);
          });
          return nextStep;
        });
      }, intervalTime);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm, sequencerGrid, playSound, pads]);

  const updatePad = (id: number, changes: Partial<Pad>) => {
    setPads(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  };
  const selectedPad = pads.find(p => p.id === selectedPadId);

  return (
    <div 
        onClick={initAudio}
        onTouchStart={initAudio}
        className="min-h-screen bg-slate-950 flex flex-col items-center p-6 text-white select-none overflow-y-auto"
    >
        {/* --- HEADER --- */}
        <div className="w-full max-w-6xl flex flex-wrap gap-4 justify-between items-end mb-8 border-b border-slate-800 pb-4 sticky top-0 bg-slate-950/80 backdrop-blur z-50">
            <div>
                <h1 className="text-4xl font-black italic tracking-tighter flex items-center gap-2">
                    <Zap className="text-yellow-400 fill-yellow-400" />
                    PULSE<span className="text-cyan-400">PAD</span>
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-mono">NEON DRUM SYNTHESIZER</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-xl">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                  className={`p-3 rounded-lg transition-all ${isPlaying ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}
                >
                  {isPlaying ? <Square fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} />}
                </button>
                <div className="flex gap-4 px-4 border-l border-r border-slate-700">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mb-1"><Clock size={10} /> BPM</div>
                        <input type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center font-mono focus:outline-none focus:border-cyan-500"/>
                    </div>
                    <div className="flex flex-col items-center">
                       <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mb-1"><Volume2 size={10} /> VOL</div>
                        <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 accent-cyan-500 h-1 bg-slate-700 rounded-full appearance-none my-2"/>
                    </div>
                </div>
                <button 
                    onClick={() => { setEditMode(!editMode); setSelectedPadId(null); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-sm ${editMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <Settings2 size={18} /> {editMode ? 'DONE' : 'EDIT'}
                </button>
            </div>
        </div>

        {/* --- MAIN LAYOUT --- */}
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl items-start">
            <div className="relative">
                {editMode && <div className="absolute -top-8 left-0 text-purple-400 text-xs font-bold animate-pulse">SELECT A PAD TO EDIT</div>}
                
                <div className="grid grid-cols-4 gap-3 w-full max-w-lg aspect-square">
                    {pads.map((pad) => (
                        <button
                            key={pad.id}
                            // 1. TOUCH: Handle touch, set timestamp
                            onTouchStart={(e) => handleTouchStart(e, pad)}
                            // 2. MOUSE: Check timestamp to avoid double-trigger
                            onMouseDown={(e) => handleMouseDown(e, pad)}
                            className={`
                                relative group rounded-xl border transition-all duration-75 
                                flex flex-col items-center justify-center overflow-hidden touch-none select-none
                                ${pad.color}
                                ${activePadId === pad.id ? 'bg-slate-800 scale-95 shadow-[0_0_30px_currentColor] border-white text-white z-10' : ''}
                                ${editMode && selectedPadId === pad.id ? 'ring-4 ring-purple-500 scale-95 z-20 bg-slate-800' : 'bg-slate-900 border-slate-800 opacity-90 hover:opacity-100 hover:border-slate-600'}
                                ${editMode && selectedPadId !== pad.id ? 'opacity-50 blur-[1px]' : ''}
                            `}
                        >
                            {editMode && selectedPadId === pad.id && <div className="absolute top-2 right-2 text-purple-500"><Edit3 size={14} /></div>}
                            <span className="font-bold text-lg tracking-wider pointer-events-none">{pad.label}</span>
                            {!editMode && <span className="absolute top-2 left-3 text-[10px] font-mono uppercase opacity-50 border border-current px-1.5 py-0.5 rounded">{pad.key}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- RIGHT PANEL --- */}
            <div className="flex-1 w-full min-h-[500px] flex flex-col gap-4">
                {editMode && selectedPad ? (
                    <div className="bg-slate-900 border border-purple-500/50 p-6 rounded-2xl shadow-2xl animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                                <Sliders size={20} /> Pad Settings
                            </h2>
                            <button onClick={() => setSelectedPadId(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Pad Label</label>
                                <input type="text" value={selectedPad.label} onChange={(e) => updatePad(selectedPad.id, { label: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-purple-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Sound Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['kick', 'snare', 'hihat', 'openhat', 'tom', 'clap', 'crash', 'fx'].map(type => (
                                        <button key={type} onClick={() => updatePad(selectedPad.id, { type: type as InstrumentType })} className={`p-2 rounded text-xs font-bold border ${selectedPad.type === type ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}>{type.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <div><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Pitch</span><span className="text-purple-400">{selectedPad.pitch.toFixed(1)}x</span></div><input type="range" min="0.1" max="2.0" step="0.1" value={selectedPad.pitch} onChange={(e) => updatePad(selectedPad.id, { pitch: parseFloat(e.target.value) })} className="w-full accent-purple-500 h-1 bg-slate-700 rounded-full appearance-none"/></div>
                                <div><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Decay</span><span className="text-purple-400">{selectedPad.decay.toFixed(1)}s</span></div><input type="range" min="0.1" max="2.0" step="0.1" value={selectedPad.decay} onChange={(e) => updatePad(selectedPad.id, { decay: parseFloat(e.target.value) })} className="w-full accent-purple-500 h-1 bg-slate-700 rounded-full appearance-none"/></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`bg-slate-900/50 p-6 rounded-2xl border border-slate-800 transition-opacity ${editMode ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="text-cyan-500" /> Sequencer</h3>
                            <button onClick={() => setSequencerGrid(INITIAL_GRID)} className="text-xs text-red-400 hover:text-red-300 border border-red-900 bg-red-900/20 px-3 py-1 rounded">CLEAR PATTERN</button>
                        </div>
                        <div className="flex flex-col gap-2 overflow-x-auto pb-4">
                            <div className="flex gap-1 ml-24 mb-2">{Array(16).fill(0).map((_, i) => (<div key={i} className={`w-6 text-center text-[10px] font-mono ${i === currentStep ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>{i + 1}</div>))}</div>
                            {pads.map((pad) => (
                                <div key={pad.id} className="flex items-center gap-4 group hover:bg-slate-800/50 rounded pr-2">
                                    <div className={`w-20 text-xs font-bold text-right truncate ${pad.color.split(' ').pop()?.replace('text-', 'text-')}`}>{pad.label}</div>
                                    <div className="flex gap-1">
                                        {sequencerGrid[pad.id].map((isActive, step) => (
                                            <button key={step} onClick={(e) => { e.stopPropagation(); setSequencerGrid(prev => ({...prev, [pad.id]: prev[pad.id].map((v, i) => i === step ? !v : v)})); }} className={`w-6 h-8 rounded-sm border transition-all ${step === currentStep ? 'border-white scale-110 z-10' : 'border-transparent'} ${isActive ? `bg-cyan-500 hover:bg-cyan-400` : `bg-slate-800 hover:bg-slate-700`} ${step % 4 === 0 ? 'ml-1' : ''}`}/>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {!audioUnlocked && (
            <div onTouchStart={initAudio} onClick={initAudio} className="absolute top-0 left-0 w-full h-full bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl text-center cursor-pointer max-w-sm mx-4">
                    <Activity size={48} className="mx-auto mb-4 text-cyan-500 animate-bounce" />
                    <h2 className="text-2xl font-bold mb-2">Tap to Start</h2>
                    <p className="text-slate-400 mb-4">Initialize Audio Engine</p>
                    <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded-lg flex items-start gap-3 text-left">
                        <Smartphone className="shrink-0 text-yellow-500 mt-1" size={20} />
                        <div className="text-xs text-yellow-200"><strong>iPhone Users:</strong><br/>Turn off "Silent Mode" (side switch) to hear sound.</div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

export default App;