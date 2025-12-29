import { useEffect, useState } from 'react';
import { DrumSound } from '../hooks/useSynthesizer';

interface DrumPadProps {
  sound: DrumSound;
  label: string;
  keyBinding: string;
  color: string;
  onTrigger: (sound: DrumSound) => void;
  showKeyBinds: boolean;
}

export const DrumPad = ({ sound, label, keyBinding, color, onTrigger, showKeyBinds }: DrumPadProps) => {
  const [isActive, setIsActive] = useState(false);

  const trigger = () => {
    setIsActive(true);
    onTrigger(sound);
    setTimeout(() => setIsActive(false), 150);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === keyBinding.toLowerCase() && !e.repeat) {
        trigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyBinding, sound]);

  const colorClasses = {
    red: isActive
      ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8),0_0_60px_rgba(239,68,68,0.4)]'
      : 'bg-slate-800 hover:bg-slate-700',
    cyan: isActive
      ? 'bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.8),0_0_60px_rgba(34,211,238,0.4)]'
      : 'bg-slate-800 hover:bg-slate-700',
    yellow: isActive
      ? 'bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.8),0_0_60px_rgba(250,204,21,0.4)]'
      : 'bg-slate-800 hover:bg-slate-700',
    purple: isActive
      ? 'bg-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.8),0_0_60px_rgba(168,85,247,0.4)]'
      : 'bg-slate-800 hover:bg-slate-700',
  };

  return (
    <button
      onClick={trigger}
      onTouchStart={(e) => {
        e.preventDefault();
        trigger();
      }}
      className={`
        relative rounded-lg transition-all duration-150
        active:scale-95 select-none touch-manipulation
        ${colorClasses[color as keyof typeof colorClasses]}
      `}
      style={{ aspectRatio: '1/1' }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        <span className={`text-xs sm:text-sm font-bold ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
          {label}
        </span>
        {showKeyBinds && (
          <span className={`text-[10px] sm:text-xs mt-1 font-mono ${isActive ? 'text-slate-950' : 'text-slate-500'}`}>
            {keyBinding}
          </span>
        )}
      </div>
    </button>
  );
};
