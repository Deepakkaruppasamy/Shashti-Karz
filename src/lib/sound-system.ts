"use client";

import { Howl, Howler } from "howler";

export type SoundType = 
  | "engine_ignition"
  | "engine_rev"
  | "engine_idle"
  | "whoosh"
  | "turbo"
  | "click"
  | "success"
  | "notification"
  | "water_spray"
  | "foam_brush"
  | "polish_shine"
  | "air_hiss"
  | "gear_shift";

interface SoundConfig {
  src: string[];
  volume: number;
  loop?: boolean;
  sprite?: Record<string, [number, number]>;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  engine_ignition: {
    src: ["/sounds/engine-ignition.mp3"],
    volume: 0.3,
  },
  engine_rev: {
    src: ["/sounds/engine-rev.mp3"],
    volume: 0.25,
  },
  engine_idle: {
    src: ["/sounds/engine-idle.mp3"],
    volume: 0.15,
    loop: true,
  },
  whoosh: {
    src: ["/sounds/whoosh.mp3"],
    volume: 0.2,
  },
  turbo: {
    src: ["/sounds/turbo.mp3"],
    volume: 0.2,
  },
  click: {
    src: ["/sounds/click.mp3"],
    volume: 0.15,
  },
  success: {
    src: ["/sounds/success.mp3"],
    volume: 0.25,
  },
  notification: {
    src: ["/sounds/notification.mp3"],
    volume: 0.2,
  },
  water_spray: {
    src: ["/sounds/water-spray.mp3"],
    volume: 0.2,
  },
  foam_brush: {
    src: ["/sounds/foam-brush.mp3"],
    volume: 0.15,
  },
  polish_shine: {
    src: ["/sounds/polish-shine.mp3"],
    volume: 0.2,
  },
  air_hiss: {
    src: ["/sounds/air-hiss.mp3"],
    volume: 0.15,
  },
  gear_shift: {
    src: ["/sounds/gear-shift.mp3"],
    volume: 0.2,
  },
};

const FALLBACK_SOUNDS: Record<SoundType, string> = {
  engine_ignition: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  engine_rev: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  engine_idle: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  whoosh: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  turbo: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  click: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  success: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  notification: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  water_spray: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  foam_brush: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  polish_shine: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  air_hiss: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
  gear_shift: "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNWMmLAAAAAAD/+9DEAAAGAAGn9AAAIowBdz888ARIkQCAHxAAgAABAEAQBGB//9P/pPf/+T5P///////4g/E+XAhx8f///y4IBgMHAx//lgQf+WDn/4KAMP4Pg+D4nAGH/E+IBz/y7/+D//l3/h/E4Pg/iccDiDg/j/+JwYf5YEA//+IAOchxP/Lg//h/E/+WBAP8nJzZ",
};

class SoundSystem {
  private sounds: Map<SoundType, Howl> = new Map();
  private enabled: boolean = false;
  private volume: number = 0.3;
  private hasInteracted: boolean = false;
  private isAdmin: boolean = false;
  private initialized: boolean = false;
  private reducedMotion: boolean = false;
  private isMobile: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadPreferences();
      this.detectCapabilities();
      this.setupInteractionListener();
    }
  }

  private detectCapabilities() {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (this.reducedMotion) {
      this.enabled = false;
    }
    
    if (this.isMobile) {
      this.volume = Math.min(this.volume, 0.2);
    }
  }

  private loadPreferences() {
    try {
      const saved = localStorage.getItem("shashti_sound_prefs");
      if (saved) {
        const prefs = JSON.parse(saved);
        this.enabled = prefs.enabled ?? false;
        this.volume = prefs.volume ?? 0.3;
      }
    } catch (e) {
      console.warn("Failed to load sound preferences");
    }
  }

  private savePreferences() {
    try {
      localStorage.setItem("shashti_sound_prefs", JSON.stringify({
        enabled: this.enabled,
        volume: this.volume,
      }));
    } catch (e) {
      console.warn("Failed to save sound preferences");
    }
  }

  private setupInteractionListener() {
    const handleInteraction = () => {
      this.hasInteracted = true;
      if (this.enabled && !this.initialized) {
        this.initializeSounds();
      }
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
  }

  private initializeSounds() {
    if (this.initialized) return;
    
    Object.entries(SOUND_CONFIGS).forEach(([type, config]) => {
      const soundType = type as SoundType;
      try {
        const howl = new Howl({
          src: [FALLBACK_SOUNDS[soundType]],
          volume: config.volume * this.volume,
          loop: config.loop || false,
          preload: false,
        });
        this.sounds.set(soundType, howl);
      } catch (e) {
      }
    });
    
    this.initialized = true;
  }

  play(type: SoundType, options?: { volume?: number; fadeIn?: number }) {
    if (!this.enabled || !this.hasInteracted || this.isAdmin) return;
    if (this.reducedMotion) return;
    
    if (!this.initialized) {
      this.initializeSounds();
    }

    const sound = this.sounds.get(type);
    if (!sound) return;

    const vol = (options?.volume ?? 1) * this.volume * (SOUND_CONFIGS[type]?.volume ?? 0.2);
    sound.volume(vol);

    if (options?.fadeIn) {
      sound.volume(0);
      sound.play();
      sound.fade(0, vol, options.fadeIn);
    } else {
      sound.play();
    }
  }

  stop(type: SoundType, fadeOut?: number) {
    const sound = this.sounds.get(type);
    if (!sound) return;

    if (fadeOut) {
      sound.fade(sound.volume(), 0, fadeOut);
      setTimeout(() => sound.stop(), fadeOut);
    } else {
      sound.stop();
    }
  }

  stopAll() {
    this.sounds.forEach((sound) => sound.stop());
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    } else if (this.hasInteracted && !this.initialized) {
      this.initializeSounds();
    }
    this.savePreferences();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.volume);
    this.savePreferences();
  }

  setAdminMode(isAdmin: boolean) {
    this.isAdmin = isAdmin;
    if (isAdmin) {
      this.stopAll();
    }
  }

  getEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }

  getHasInteracted() {
    return this.hasInteracted;
  }
}

export const soundSystem = typeof window !== "undefined" ? new SoundSystem() : null;

export function playSound(type: SoundType, options?: { volume?: number; fadeIn?: number }) {
  soundSystem?.play(type, options);
}

export function stopSound(type: SoundType, fadeOut?: number) {
  soundSystem?.stop(type, fadeOut);
}

export function toggleSound() {
  if (soundSystem) {
    soundSystem.setEnabled(!soundSystem.getEnabled());
    return soundSystem.getEnabled();
  }
  return false;
}

export function setSoundVolume(volume: number) {
  soundSystem?.setVolume(volume);
}

export function setSoundEnabled(enabled: boolean) {
  soundSystem?.setEnabled(enabled);
}

export function setAdminSoundMode(isAdmin: boolean) {
  soundSystem?.setAdminMode(isAdmin);
}
