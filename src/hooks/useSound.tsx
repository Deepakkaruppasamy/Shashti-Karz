"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { soundSystem, playSound, stopSound, setSoundEnabled, setSoundVolume, setAdminSoundMode, type SoundType } from "@/lib/sound-system";

interface SoundContextType {
  enabled: boolean;
  volume: number;
  hasInteracted: boolean;
  isAdmin: boolean;
  toggleSound: () => void;
  setVolume: (volume: number) => void;
  setAdmin: (isAdmin: boolean) => void;
  play: (type: SoundType, options?: { volume?: number; fadeIn?: number }) => void;
  stop: (type: SoundType, fadeOut?: number) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolumeState] = useState(0.3);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (soundSystem) {
      setEnabled(soundSystem.getEnabled());
      setVolumeState(soundSystem.getVolume());
      setHasInteracted(soundSystem.getHasInteracted());
    }

    const checkInteraction = () => {
      if (soundSystem) {
        setHasInteracted(soundSystem.getHasInteracted());
      }
    };

    document.addEventListener("click", checkInteraction, { once: true });
    return () => document.removeEventListener("click", checkInteraction);
  }, []);

  const toggleSound = useCallback(() => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    setSoundEnabled(newEnabled);
  }, [enabled]);

  const handleSetVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    setSoundVolume(vol);
  }, []);

  const setAdmin = useCallback((admin: boolean) => {
    setIsAdmin(admin);
    setAdminSoundMode(admin);
  }, []);

  const play = useCallback((type: SoundType, options?: { volume?: number; fadeIn?: number }) => {
    playSound(type, options);
  }, []);

  const stop = useCallback((type: SoundType, fadeOut?: number) => {
    stopSound(type, fadeOut);
  }, []);

  return (
    <SoundContext.Provider
      value={{
        enabled,
        volume,
        hasInteracted,
        isAdmin,
        toggleSound,
        setVolume: handleSetVolume,
        setAdmin,
        play,
        stop,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    return {
      enabled: false,
      volume: 0.3,
      hasInteracted: false,
      isAdmin: false,
      toggleSound: () => {},
      setVolume: () => {},
      setAdmin: () => {},
      play: () => {},
      stop: () => {},
    };
  }
  return context;
}

export function useSoundEffect(type: SoundType, trigger: boolean, options?: { volume?: number; fadeIn?: number; fadeOut?: number }) {
  const { play, stop, enabled } = useSound();

  useEffect(() => {
    if (!enabled) return;
    
    if (trigger) {
      play(type, options);
    } else if (options?.fadeOut) {
      stop(type, options.fadeOut);
    }
  }, [trigger, type, enabled, play, stop, options]);
}
