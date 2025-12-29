import { Volume2, Keyboard } from 'lucide-react';

interface ControlsProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  showKeyBinds: boolean;
  onToggleKeyBinds: () => void;
}

export const Controls = ({ volume, onVolumeChange, showKeyBinds, onToggleKeyBinds }: ControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Volume2 className="text-slate-400" size={20} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 sm:w-48 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                     [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                     [&::-webkit-slider-thumb]:hover:bg-cyan-300 [&::-webkit-slider-thumb]:hover:shadow-[0_0_10px_rgba(34,211,238,0.6)]
                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-all"
        />
        <span className="text-slate-400 text-sm min-w-[3rem] text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>

      <button
        onClick={onToggleKeyBinds}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg transition-all
          ${showKeyBinds
            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }
        `}
      >
        <Keyboard size={18} />
        <span className="text-sm font-medium">Keybinds</span>
      </button>
    </div>
  );
};
