// src/components/SoundSelector.tsx
import React from 'react';
import { SOUND_LIBRARY } from '../data/soundLibrary';

interface SoundSelectorProps {
  currentUrl: string;
  onChange: (newUrl: string, newLabel: string) => void;
}

export const SoundSelector: React.FC<SoundSelectorProps> = ({ currentUrl, onChange }) => {
  return (
    <select 
      className="bg-gray-700 text-white text-xs p-1 rounded mt-2 w-full"
      value={currentUrl}
      onClick={(e) => e.stopPropagation()} // Prevent triggering the drum pad when clicking select
      onChange={(e) => {
        const selectedSound = SOUND_LIBRARY.find(s => s.url === e.target.value);
        if (selectedSound) {
          onChange(selectedSound.url, selectedSound.label);
        }
      }}
    >
      {SOUND_LIBRARY.map((sound) => (
        <option key={sound.url} value={sound.url}>
          {sound.label}
        </option>
      ))}
    </select>
  );
};