"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Settings,
  Sparkles,
  BarChart3,
  Bell,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Zap,
  Car,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useSound } from "@/hooks/useSound";
import { playSound, setSoundEnabled, type SoundType } from "@/lib/sound-system";
import { BrandedLoader } from "@/components/animations/BrandedLoader";
import { toast } from "sonner";

interface SoundSettings {
  globalEnabled: boolean;
  defaultVolume: number;
  heroSounds: boolean;
  bookingSounds: boolean;
  notificationSounds: boolean;
  carWashSounds: boolean;
  adminSoundsDisabled: boolean;
  visualEffectsEnabled: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  globalEnabled: true,
  defaultVolume: 30,
  heroSounds: true,
  bookingSounds: true,
  notificationSounds: true,
  carWashSounds: true,
  adminSoundsDisabled: true,
  visualEffectsEnabled: true,
};

const SOUND_TYPES: { type: SoundType; label: string; description: string }[] = [
  { type: "engine_rev", label: "Engine Rev", description: "Booking success" },
  { type: "whoosh", label: "Whoosh", description: "Transitions" },
  { type: "click", label: "UI Click", description: "Interactions" },
  { type: "success", label: "Success", description: "Completed" },
  { type: "notification", label: "Alert", description: "New chimes" },
];

export default function AdminSoundSettingsPage() {
  const { enabled, volume, toggleSound, setVolume, setAdmin } = useSound();
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading settings
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setAdmin(false);
    const adminSaved = localStorage.getItem("shashti_admin_sound_settings");
    let loadedSettings = { ...DEFAULT_SETTINGS };
    if (adminSaved) {
      try { loadedSettings = { ...loadedSettings, ...JSON.parse(adminSaved) }; } catch (e) { }
    }
    setSettings(loadedSettings);
  }, [setAdmin]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("shashti_admin_sound_settings", JSON.stringify(settings));
      setSoundEnabled(settings.globalEnabled);
      setVolume(settings.defaultVolume);
      localStorage.setItem("shashti_visual_prefs", JSON.stringify({ enabled: settings.visualEffectsEnabled }));
      window.dispatchEvent(new Event("storage"));
      toast.success("Settings synchronized!");
      playSound("success");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <BrandedLoader fullPage />;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="p-4 lg:p-8 max-w-5xl mx-auto text-white">
          <div className="flex items-center gap-6 mb-12">
            <Link href="/admin" className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all shrink-0">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter">Sound & Visuals</h1>
              <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Global UX Configuration</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Primary Controls */}
              <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${enabled ? "bg-[#ff1744] text-white" : "bg-white/5 text-[#222]"}`}>
                      <Volume2 size={24} />
                    </div>
                    <div>
                      <h2 className="font-black tracking-tighter">Global Audio</h2>
                      <p className="text-[8px] font-black text-[#444] uppercase tracking-widest">Master Switch</p>
                    </div>
                  </div>
                  <button onClick={toggleSound} className={`w-14 h-7 rounded-full relative transition-all ${enabled ? "bg-[#ff1744]" : "bg-white/10"}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${enabled ? "left-8" : "left-1"}`} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1">
                    <span className="text-[#333]">Amplitude</span>
                    <span className="text-white">{Math.round(volume * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={volume * 100} onChange={(e) => setVolume(parseInt(e.target.value) / 100)} className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#ff1744]" />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${settings.visualEffectsEnabled ? "bg-[#d4af37] text-white" : "bg-white/5 text-[#222]"}`}>
                      <Eye size={24} />
                    </div>
                    <div>
                      <h2 className="font-black tracking-tighter">Motion Vectors</h2>
                      <p className="text-[8px] font-black text-[#444] uppercase tracking-widest">Visual Feedback</p>
                    </div>
                  </div>
                  <button onClick={() => setSettings(s => ({ ...s, visualEffectsEnabled: !s.visualEffectsEnabled }))} className={`w-14 h-7 rounded-full relative transition-all ${settings.visualEffectsEnabled ? "bg-[#d4af37]" : "bg-white/10"}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${settings.visualEffectsEnabled ? "left-8" : "left-1"}`} />
                  </button>
                </div>
              </div>

              {/* Granular Control */}
              <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5 space-y-6">
                <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.3em]">Sector Control</h3>
                <div className="space-y-4">
                  {[
                    { key: "heroSounds", label: "Engine Ignition", icon: Car },
                    { key: "bookingSounds", label: "Gear Shifts", icon: Zap },
                    { key: "notificationSounds", label: "Signal Alerts", icon: Bell },
                    { key: "carWashSounds", label: "Acoustic Wash", icon: Sparkles },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="text-[#333]"><item.icon size={16} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                      </div>
                      <button onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key as keyof SoundSettings] }))} className={`w-10 h-5 rounded-full relative transition-all ${settings[item.key as keyof SoundSettings] ? "bg-green-500" : "bg-white/10"}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings[item.key as keyof SoundSettings] ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Sound Preview */}
              <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5 space-y-8">
                <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.3em]">Acoustic Test</h3>
                <div className="grid grid-cols-1 gap-3">
                  {SOUND_TYPES.map((sound) => (
                    <button key={sound.type} onClick={() => playSound(sound.type)} disabled={!enabled} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:border-[#ff1744]/30 transition-all flex items-center justify-between group disabled:opacity-20">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest mb-1">{sound.label}</div>
                        <div className="text-[8px] font-black text-[#333] uppercase tracking-[0.2em]">{sound.description}</div>
                      </div>
                      <div className="p-2 border border-white/5 rounded-lg group-hover:bg-[#ff1744] group-hover:border-transparent transition-all">
                        <Play size={12} fill="currentColor" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Shashti AI Metrics */}
              <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border border-white/5 space-y-8 bg-gradient-to-br from-white/[0.02] to-transparent">
                <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-[#ff1744]" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Synapse Analysis</h3>
                </div>
                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-green-500/5 border border-green-500/10">
                    <div className="text-xl font-black text-green-500">+6.4%</div>
                    <div className="text-[8px] font-black text-[#444] uppercase tracking-widest">Resonance Conversion</div>
                  </div>
                  <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                    <div className="text-xl font-black text-blue-500">2.1x</div>
                    <div className="text-[8px] font-black text-[#444] uppercase tracking-widest">Dwell Threshold</div>
                  </div>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="w-full btn-premium py-5 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#ff1744]/20 transition-all hover:scale-[1.02]">
                  {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <><Save size={18} /> Authorize Settings</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
