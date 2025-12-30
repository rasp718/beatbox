import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Activity, Zap, Play, Square, Clock, Settings2, Sliders, Edit3, X, Smartphone, Music, Speaker, Save } from 'lucide-react';

// --- TYPES ---
type InstrumentType = 'kick' | 'snare' | 'hihat' | 'openhat' | 'tom' | 'clap' | 'fx' | 'crash' | '808' | 'cowbell';

interface Pad {
  id: number;
  key: string;
  label: string;
  type: InstrumentType; 
  color: string;
  pitch: number;  
  decay: number;
  tone: number; // New param for brightness/frequency
}

// --- DEFAULT CONFIGURATION (Pure Synth) ---
const DEFAULT_PADS: Pad[] = [
  // Row 1 (Highs)
  { id: 1, key: '1', label: 'Crash', type: 'crash', pitch: 1.0, decay: 1.5, tone: 8000, color: 'shadow-yellow-500 border-yellow-500 text-yellow-500' },
  { id: 2, key: '2', label: 'Ride', type: 'crash', pitch: 1.5, decay: 1.2, tone: 5000, color: 'shadow-yellow-500 border-yellow-500 text-yellow-500' },
  { id: 3, key: '3', label: 'Open Hat', type: 'openhat', pitch: 1.0, decay: 0.6, tone: 1000, color: 'shadow-amber-500 border-amber-500 text-amber-500' },
  { id: 4, key: '4', label: 'Hi-Hat', type: 'hihat', pitch: 1.2, decay: 0.1, tone: 2000, color: 'shadow-amber-500 border-amber-500 text-amber-500' },
  // Row 2 (Percs)
  { id: 5, key: 'q', label: 'Hi Tom', type: 'tom', pitch: 1.5, decay: 0.3, tone: 200, color: 'shadow-cyan-500 border-cyan-500 text-cyan-500' },
  { id: 6, key: 'w', label: 'Lo Tom', type: 'tom', pitch: 1.0, decay: 0.4, tone: 100, color: 'shadow-cyan-500 border-cyan-500 text-cyan-500' },
  { id: 7, key: 'e', label: 'Cowbell', type: 'cowbell', pitch: 1.0, decay: 0.3, tone: 800, color: 'shadow-blue-500 border-blue-500 text-blue-500' },
  { id: 8, key: 'r', label: 'Clap', type: 'clap', pitch: 1.0, decay: 0.2, tone: 1200, color: 'shadow-pink-500 border-pink-500 text-pink-500' },
  // Row 3 (Snares)
  { id: 9, key: 'a', label: 'Snare A', type: 'snare', pitch: 1.0, decay: 0.2, tone: 1000, color: 'shadow-fuchsia-500 border-fuchsia-500 text-fuchsia-500' },
  { id: 10, key: 's', label: 'Snare B', type: 'snare', pitch: 0.8, decay: 0.3, tone: 600, color: 'shadow-fuchsia-500 border-fuchsia-500 text-fuchsia-500' },
  { id: 11, key: 'd', label: 'Rimshot', type: 'hihat', pitch: 0.5, decay: 0.05, tone: 800, color: 'shadow-purple-500 border-purple-500 text-purple-500' },
  { id: 12, key: 'f', label: 'Laser', type: 'fx', pitch: 1.5, decay: 0.4, tone: 2000, color: 'shadow-emerald-500 border-emerald-500 text-emerald-500' },
  // Row 4 (Bass)
  { id: 13, key: 'z', label: 'Kick', type: 'kick', pitch: 1.0, decay: 0.4, tone: 150, color: 'shadow-red-500 border-red-500 text-red-500' },
  { id: 14, key: 'x', label: 'Deep Kick', type: 'kick', pitch: 0.8, decay: 0.6, tone: 120, color: 'shadow-red-500 border-red-500 text-red-500' },
  { id: 15, key: 'c', label: '808 Sub', type: '808', pitch: 1.0, decay: 1.2, tone: 60, color: 'shadow-rose-500 border-rose-500 text-rose-500' },
  { id: 16, key: 'v', label: '808 Low', type: '808', pitch: 0.7, decay: 1.8, tone: 50, color: 'shadow-green-500 border-green-500 text-green-500' },
];

const INITIAL_GRID: Record<number, boolean[]> = {};
DEFAULT_PADS.forEach(pad => { INITIAL_GRID[pad.id] = Array(16).fill(false); });

// --- PRESETS ---
const BEAT_PRESETS: Record<string, { label: string, bpm: number, grid: Record<number, boolean[]> }> = {
  hiphop: { label: 'Hip Hop: Classic', bpm: 90, grid: { ...INITIAL_GRID, 13: [true, false, false, true, false, false, true, false, false, false, true, false, false, true, false, false], 9: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], 4: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, true] } },
  trap: { label: 'Trap: Drill', bpm: 140, grid: { ...INITIAL_GRID, 15: [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false], 10: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], 4: [true, true, true, false, true, true, true, false, true, true, true, true, true, false, true, true] } },
  house: { label: 'House 4x4', bpm: 128, grid: { ...INITIAL_GRID, 13: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], 3: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false], 8: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false] } },
};

function App() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null); // Reusable white noise

  const [pads, setPads] = useState<Pad[]>(DEFAULT_PADS);
  const [activePadId, setActivePadId] = useState<number | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPadId, setSelectedPadId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [sequencerGrid, setSequencerGrid] = useState(INITIAL_GRID);
  const [mobilePage, setMobilePage] = useState<0 | 1>(0);
  const lastTouchTimeRef = useRef<number>(0);

  // --- ENGINE ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Master Compressor (The "Glue")
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24;
      comp.ratio.value = 12;
      comp.connect(ctx.destination);
      
      const gain = ctx.createGain();
      gain.connect(comp);
      masterGainRef.current = gain;

      // Generate 2s of White Noise once (Efficient)
      const bSize = ctx.sampleRate * 2;
      const b = ctx.createBuffer(1, bSize, ctx.sampleRate);
      const d = b.getChannelData(0);
      for(let i=0; i<bSize; i++) d[i] = Math.random() * 2 - 1;
      noiseBufferRef.current = b;
    }
    const ctx = audioCtxRef.current!;
    if (ctx.state === 'suspended') ctx.resume();
    
    // Unlock iOS audio
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    setAudioUnlocked(true);
  };

  const playSound = useCallback((pad: Pad) => {
    if (!audioCtxRef.current) initAudio();
    const ctx = audioCtxRef.current!;
    if (!noiseBufferRef.current) return; // Wait for init

    setActivePadId(pad.id);
    setTimeout(() => setActivePadId(null), 80);

    const t = ctx.currentTime;
    const master = masterGainRef.current!;
    master.gain.value = volume;

    // --- PROCEDURAL AUDIO GENERATORS ---
    
    // 1. KICK / 808
    if (pad.type === 'kick' || pad.type === '808') {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.connect(oscGain);
        oscGain.connect(master);

        const freq = pad.type === '808' ? pad.tone : 150; 
        osc.frequency.setValueAtTime(freq * pad.pitch, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + pad.decay);
        
        oscGain.gain.setValueAtTime(1, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);

        // Click Attack (The "Thump")
        if (pad.type === 'kick') {
            const clickOsc = ctx.createOscillator();
            const clickGain = ctx.createGain();
            clickOsc.connect(clickGain);
            clickGain.connect(master);
            clickOsc.frequency.setValueAtTime(50, t);
            clickGain.gain.setValueAtTime(1, t);
            clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
            clickOsc.start(t); clickOsc.stop(t+0.02);
        }

        osc.start(t); osc.stop(t + pad.decay);
    } 
    
    // 2. SNARE / CLAP
    else if (pad.type === 'snare' || pad.type === 'clap') {
        // Noise Layer
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBufferRef.current;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = pad.type === 'clap' ? 1200 : 800;
        
        const noiseGain = ctx.createGain();
        noise.connect(noiseFilter).connect(noiseGain).connect(master);
        
        noiseGain.gain.setValueAtTime(1, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
        noise.start(t);

        // Tonal Layer (Snare Body)
        if (pad.type === 'snare') {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(pad.tone * pad.pitch, t);
            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.5, t);
            oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(oscGain).connect(master);
            osc.start(t); osc.stop(t+0.2);
        }
    }
    
    // 3. HATS / CYMBALS (Metallic)
    else if (pad.type === 'hihat' || pad.type === 'openhat' || pad.type === 'crash') {
        // Metallic FM Synth logic
        const ratio = [2, 3, 4.16, 5.43, 6.79, 8.21]; // Roland TR-808 ratios
        const fund = 40 * pad.pitch;
        
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBufferRef.current;
        
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'highpass';
        bandpass.frequency.value = 7000;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(pad.type === 'openhat' || pad.type === 'crash' ? 0.6 : 1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
        
        noise.connect(bandpass).connect(gain).connect(master);
        noise.start(t);
    }
    
    // 4. COWBELL / TOM / FX
    else {
        if (pad.type === 'cowbell') {
            // Dual Square Wave (808 style)
            [1, 1.5].forEach(r => {
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(pad.tone * r, t);
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.3, t);
                g.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
                
                const bp = ctx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.value = 2000;
                
                osc.connect(bp).connect(g).connect(master);
                osc.start(t); osc.stop(t+pad.decay);
            });
        } else {
            // Toms / Lasers (Pitch Sweep)
            const osc = ctx.createOscillator();
            osc.frequency.setValueAtTime(pad.tone * pad.pitch, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + pad.decay);
            const g = ctx.createGain();
            g.gain.setValueAtTime(1, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + pad.decay);
            osc.connect(g).connect(master);
            osc.start(t); osc.stop(t+pad.decay);
        }
    }
  }, [volume]);

  // --- LISTENERS ---
  const handleTouchStart = (e: React.TouchEvent, pad: Pad) => {
    e.preventDefault();
    lastTouchTimeRef.current = Date.now();
    initAudio();
    if (editMode) setSelectedPadId(pad.id);
    else playSound(pad);
  };

  const handleMouseDown = (e: React.MouseEvent, pad: Pad) => {
    // 50ms lockout for ghost clicks
    if (Date.now() - lastTouchTimeRef.current < 50) return;
    initAudio();
    if (editMode) setSelectedPadId(pad.id);
    else playSound(pad);
  };

  const saveMyKit = () => {
    localStorage.setItem('my_custom_kit', JSON.stringify(pads));
    alert("Kit Saved!");
  };

  const loadPreset = (presetKey: string) => {
    if (BEAT_PRESETS[presetKey]) {
      setSequencerGrid(BEAT_PRESETS[presetKey].grid);
      setBpm(BEAT_PRESETS[presetKey].bpm);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  const updatePad = (id: number, changes: Partial<Pad>) => {
    setPads(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  };
  const selectedPad = pads.find(p => p.id === selectedPadId);

  useEffect(() => {
    const saved = localStorage.getItem('my_custom_kit');
    if (saved) setPads(JSON.parse(saved));
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && audioCtxRef.current) audioCtxRef.current.resume();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      const intervalTime = (60 / bpm) * 1000 / 4;
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const nextStep = (prev + 1) % 16;
          pads.forEach(pad => { if (sequencerGrid[pad.id][nextStep]) playSound(pad); });
          return nextStep;
        });
      }, intervalTime);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm, sequencerGrid, playSound, pads]);

  return (
    <div onClick={initAudio} onTouchStart={initAudio} className="min-h-screen bg-slate-950 flex flex-col items-center p-6 text-white select-none overflow-y-auto">
        <div className="w-full max-w-6xl flex flex-wrap gap-4 justify-between items-end mb-8 border-b border-slate-800 pb-4 sticky top-0 bg-slate-950/80 backdrop-blur z-50">
            <div>
                <h1 className="text-4xl font-black italic tracking-tighter flex items-center gap-2">
                    <Zap className="text-yellow-400 fill-yellow-400" />
                    PULSE<span className="text-cyan-400">PAD</span>
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-mono">NEON DRUM SYNTHESIZER</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-xl">
                <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className={`p-3 rounded-lg transition-all ${isPlaying ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}>
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
                <button onClick={saveMyKit} className="p-2 rounded-lg bg-slate-800 text-red-400 hover:bg-red-900/30 hover:text-white" title="Save Kit"><Save size={18} /></button>
                <button onClick={() => { setEditMode(!editMode); setSelectedPadId(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-sm ${editMode ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                    <Settings2 size={18} /> {editMode ? 'DONE' : 'EDIT'}
                </button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl items-start">
            <div className="relative">
                {editMode && <div className="absolute -top-8 left-0 text-purple-400 text-xs font-bold animate-pulse">SELECT A PAD TO EDIT</div>}
                <div className="grid grid-cols-4 gap-3 w-full max-w-lg aspect-square">
                    {pads.map((pad) => (
                        <button key={pad.id} onTouchStart={(e) => handleTouchStart(e, pad)} onMouseDown={(e) => handleMouseDown(e, pad)} className={`relative group rounded-xl border transition-all duration-75 flex flex-col items-center justify-center overflow-hidden touch-none select-none ${pad.color} ${activePadId === pad.id ? 'bg-slate-800 scale-95 shadow-[0_0_30px_currentColor] border-white text-white z-10' : ''} ${editMode && selectedPadId === pad.id ? 'ring-4 ring-purple-500 scale-95 z-20 bg-slate-800' : 'bg-slate-900 border-slate-800 opacity-90 hover:opacity-100 hover:border-slate-600'} ${editMode && selectedPadId !== pad.id ? 'opacity-50 blur-[1px]' : ''}`}>
                            {editMode && selectedPadId === pad.id && <div className="absolute top-2 right-2 text-purple-500"><Edit3 size={14} /></div>}
                            <span className="font-bold text-lg tracking-wider pointer-events-none">{pad.label}</span>
                            {!editMode && <span className="absolute top-2 left-3 text-[10px] font-mono uppercase opacity-50 border border-current px-1.5 py-0.5 rounded">{pad.key}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-[500px] flex flex-col gap-4">
                {editMode && selectedPad ? (
                    <div className="bg-slate-900 border border-purple-500/50 p-6 rounded-2xl shadow-2xl animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2"><Sliders size={20} /> Pad Settings</h2>
                            <button onClick={() => setSelectedPadId(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Label</label>
                                    <input type="text" value={selectedPad.label} onChange={(e) => updatePad(selectedPad.id, { label: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-purple-500 outline-none" />
                                </div>
                                <div className="flex items-end">
                                    <button onClick={() => playSound(selectedPad)} className="h-10 px-6 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-bold rounded flex items-center gap-2 transition-transform">
                                        <Volume2 size={20} /> TEST
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Instrument Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['kick', 'snare', 'hihat', 'openhat', 'tom', 'clap', 'crash', 'fx', '808', 'cowbell'].map(type => (
                                        <button key={type} onClick={() => updatePad(selectedPad.id, { type: type as InstrumentType })} className={`p-2 rounded text-xs font-bold border ${selectedPad.type === type ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}>{type.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <div><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Pitch</span><span className="text-purple-400">{selectedPad.pitch.toFixed(2)}x</span></div><input type="range" min="0.1" max="2.0" step="0.05" value={selectedPad.pitch} onChange={(e) => updatePad(selectedPad.id, { pitch: parseFloat(e.target.value) })} className="w-full accent-purple-500 h-1 bg-slate-700 rounded-full appearance-none"/></div>
                                <div><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Decay / Length</span><span className="text-purple-400">{selectedPad.decay.toFixed(2)}s</span></div><input type="range" min="0.1" max="2.0" step="0.05" value={selectedPad.decay} onChange={(e) => updatePad(selectedPad.id, { decay: parseFloat(e.target.value) })} className="w-full accent-purple-500 h-1 bg-slate-700 rounded-full appearance-none"/></div>
                                <div><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Tone / Frequency</span><span className="text-purple-400">{selectedPad.tone}Hz</span></div><input type="range" min="50" max="2000" step="10" value={selectedPad.tone} onChange={(e) => updatePad(selectedPad.id, { tone: parseFloat(e.target.value) })} className="w-full accent-purple-500 h-1 bg-slate-700 rounded-full appearance-none"/></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`bg-slate-900/50 p-6 rounded-2xl border border-slate-800 transition-opacity ${editMode ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="text-cyan-500" /> Sequencer</h3>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                                    <Music size={14} className="ml-2 text-slate-400" />
                                    <select onChange={(e) => { if(e.target.value) loadPreset(e.target.value); e.target.value = ""; }} className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none p-1 w-24 sm:w-auto">
                                        <option value="">Load Beat...</option>
                                        {Object.keys(BEAT_PRESETS).map(key => <option key={key} value={key}>{BEAT_PRESETS[key].label}</option>)}
                                    </select>
                                </div>
                                <div className="flex lg:hidden bg-slate-800 rounded-lg p-1 border border-slate-700 w-auto">
                                    <button onClick={() => setMobilePage(0)} className={`px-3 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${mobilePage === 0 ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>1-8</button>
                                    <button onClick={() => setMobilePage(1)} className={`px-3 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${mobilePage === 1 ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>9-16</button>
                                </div>
                                <button onClick={() => setSequencerGrid(INITIAL_GRID)} className="hidden sm:block text-xs text-red-400 hover:text-red-300 border border-red-900 bg-red-900/20 px-3 py-1 rounded whitespace-nowrap">CLEAR</button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 pb-4">
                            <div className="flex gap-1 ml-20 mb-2">
                                {Array(16).fill(0).map((_, i) => (<div key={i} className={`w-7 lg:w-8 text-center text-[10px] font-mono ${i === currentStep ? 'text-cyan-400 font-bold' : 'text-slate-600'} ${(i < 8 && mobilePage === 1) ? 'hidden lg:block' : ''} ${(i >= 8 && mobilePage === 0) ? 'hidden lg:block' : ''}`}>{i + 1}</div>))}
                            </div>
                            {pads.map((pad) => (
                                <div key={pad.id} className="flex items-center gap-3 lg:gap-4 group hover:bg-slate-800/50 rounded pr-2">
                                    <div className={`w-16 lg:w-20 text-xs font-bold text-right truncate ${pad.color.split(' ').pop()?.replace('text-', 'text-')}`}>{pad.label}</div>
                                    <div className="flex gap-1">
                                        {sequencerGrid[pad.id].map((isActive, step) => (
                                            <button key={step} onClick={(e) => { e.stopPropagation(); setSequencerGrid(prev => ({...prev, [pad.id]: prev[pad.id].map((v, i) => i === step ? !v : v)})); }} className={`w-7 lg:w-8 h-10 rounded-sm border transition-all ${step === currentStep ? 'border-white scale-110 z-10' : 'border-transparent'} ${isActive ? `bg-cyan-500 hover:bg-cyan-400` : `bg-slate-800 hover:bg-slate-700`} ${step % 4 === 0 ? 'ml-1' : ''} ${(step < 8 && mobilePage === 1) ? 'hidden lg:block' : ''} ${(step >= 8 && mobilePage === 0) ? 'hidden lg:block' : ''}`}/>
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