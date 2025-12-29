import { useRef, useCallback } from 'react';

export type DrumSound = 'kick' | 'snare' | 'hihat-closed' | 'hihat-open' | 'clap' | 'tom' | 'laser' | 'zap';

export const useSynthesizer = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = 0.7;
    }
    return { context: audioContextRef.current, masterGain: masterGainRef.current! };
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    const { masterGain } = getAudioContext();
    masterGain.gain.value = volume;
  }, [getAudioContext]);

  const createKick = useCallback(() => {
    const { context, masterGain } = getAudioContext();
    const currentTime = context.currentTime;

    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, currentTime + 0.5);

    gain.gain.setValueAtTime(1, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(currentTime);
    osc.stop(currentTime + 0.5);
  }, [getAudioContext]);

  const createSnare = useCallback(() => {
    const { context, masterGain } = getAudioContext();
    const currentTime = context.currentTime;

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.2, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = context.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(1, currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);

    const osc = context.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 200;

    const oscGain = context.createGain();
    oscGain.gain.setValueAtTime(0.7, currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    noise.start(currentTime);
    osc.start(currentTime);
    noise.stop(currentTime + 0.2);
    osc.stop(currentTime + 0.1);
  }, [getAudioContext]);

  const createHiHat = useCallback((type: 'closed' | 'open') => {
    const { context, masterGain } = getAudioContext();
    const currentTime = context.currentTime;
    const duration = type === 'closed' ? 0.05 : 0.15;

    const noiseBuffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const bandpass = context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    bandpass.Q.value = 1;

    const highpass = context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 7000;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.6, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

    noise.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(masterGain);

    noise.start(currentTime);
    noise.stop(currentTime + duration);
  }, [getAudioContext]);

  const createClap = useCallback(() => {
    const { context, masterGain } = getAudioContext();
    const currentTime = context.currentTime;

    const createClapNoise = (delay: number) => {
      const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.05, context.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = context.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.5, currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, currentTime + delay + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start(currentTime + delay);
      noise.stop(currentTime + delay + 0.05);
    };

    createClapNoise(0);
    createClapNoise(0.03);
    createClapNoise(0.06);
  }, [getAudioContext]);

  const createTom = useCallback(() => {
    const { context, masterGain } = getAudioContext();
    const currentTime = context.currentTime;

    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, currentTime + 0.3);

    gain.gain.setValueAtTime(0.8, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(currentTime);
    osc.stop(currentTime + 0.3);
  }, [getAudioContext]);

  const createLaser = useCallback(() => {
    const { context, masterGain } = getAudioContext();
    const currentTime = context.currentTime;

    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1000, currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, currentTime + 0.3);

    gain.gain.setValueAtTime(0.4, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(currentTime);
    osc.stop(currentTime + 0.3);
  }, [getAudioContext]);

  const createZap = useCallback(() => {
    const { context, masterGain } = getAudioContext();
    const currentTime = context.currentTime;

    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(50, currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(30, currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(currentTime);
    osc.stop(currentTime + 0.2);
  }, [getAudioContext]);

  const playSound = useCallback((sound: DrumSound) => {
    switch (sound) {
      case 'kick':
        createKick();
        break;
      case 'snare':
        createSnare();
        break;
      case 'hihat-closed':
        createHiHat('closed');
        break;
      case 'hihat-open':
        createHiHat('open');
        break;
      case 'clap':
        createClap();
        break;
      case 'tom':
        createTom();
        break;
      case 'laser':
        createLaser();
        break;
      case 'zap':
        createZap();
        break;
    }
  }, [createKick, createSnare, createHiHat, createClap, createTom, createLaser, createZap]);

  return {
    playSound,
    setMasterVolume,
  };
};
