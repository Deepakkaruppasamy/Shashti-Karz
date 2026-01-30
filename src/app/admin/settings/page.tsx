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
  Car
} from "lucide-react";
import Link from "next/link";
import { useSound } from "@/hooks/useSound";
import { playSound, setSoundEnabled, type SoundType } from "@/lib/sound-system";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/AdminSidebar";

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
  { type: "engine_ignition", label: "Engine Ignition", description: "Plays on first interaction" },
  { type: "engine_rev", label: "Engine Rev", description: "Booking confirmation" },
  { type: "whoosh", label: "Whoosh", description: "Page transitions" },
  { type: "click", label: "UI Click", description: "Button interactions" },
  { type: "success", label: "Success", description: "Completed actions" },
  { type: "notification", label: "Notification", description: "New notifications" },
  { type: "water_spray", label: "Water Spray", description: "Car wash demo" },
  { type: "foam_brush", label: "Foam Brush", description: "Car wash demo" },
  { type: "polish_shine", label: "Polish Shine", description: "Service completion" },
  { type: "air_hiss", label: "Air Hiss", description: "Tyre services" },
  { type: "gear_shift", label: "Gear Shift", description: "Step transitions" },
];

export default function AdminSoundSettingsPage() {
  const { enabled, volume, toggleSound, setVolume, setAdmin } = useSound();
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAdmin(false);

    // Load Admin Granular Settings
    const adminSaved = localStorage.getItem("shashti_admin_sound_settings");
    let loadedSettings = { ...DEFAULT_SETTINGS };

    if (adminSaved) {
      try {
        loadedSettings = { ...loadedSettings, ...JSON.parse(adminSaved) };
      } catch (e) { }
    }

    // Sync from Global Keys (source of truth)
    const soundSaved = localStorage.getItem("shashti_sound_prefs");
    if (soundSaved) {
      try {
        const soundPrefs = JSON.parse(soundSaved);
        loadedSettings.globalEnabled = soundPrefs.enabled;
        loadedSettings.defaultVolume = soundPrefs.volume;
      } catch (e) { }
    }

    const visualSaved = localStorage.getItem("shashti_visual_prefs");
    if (visualSaved) {
      try {
        const visualPrefs = JSON.parse(visualSaved);
        loadedSettings.visualEffectsEnabled = visualPrefs.enabled;
      } catch (e) { }
    }

    setSettings(loadedSettings);
  }, [setAdmin]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save Admin specific granular settings
      localStorage.setItem("shashti_admin_sound_settings", JSON.stringify(settings));

      // Sync Global Sound System
      setSoundEnabled(settings.globalEnabled);
      // setVolume from useSound hook might not be enough if we want to force explicit value without hook state lag
      // but let's use the hook's setVolume if available, or just the one we imported? 
      // Actually we have setVolume from useSound hook in scope.
      setVolume(settings.defaultVolume);

      // Sync Visual Effects
      localStorage.setItem("shashti_visual_prefs", JSON.stringify({
        enabled: settings.visualEffectsEnabled
      }));

      // Trigger storage event for other components to pick up visual changes
      window.dispatchEvent(new Event("storage"));

      toast.success("Sound & Visual settings saved!");
      playSound("success");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.info("Settings reset to defaults");
  };

  const handlePlayPreview = (type: SoundType) => {
    playSound(type);
  };

  const VolumeIcon = !enabled ? VolumeX : volume < 0.3 ? Volume1 : Volume2;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/admin"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-display">Sound & Effects Settings</h1>
              <p className="text-[#888]">Configure audio and visual effects for the website</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#ff1744]/20 rounded-lg">
                    <Volume2 size={20} className="text-[#ff1744]" />
                  </div>
                  <h2 className="text-xl font-semibold">Global Sound Controls</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <VolumeIcon size={24} className={enabled ? "text-[#ff1744]" : "text-[#666]"} />
                      <div>
                        <p className="font-medium">Sound Effects</p>
                        <p className="text-sm text-[#888]">Enable/disable all sounds globally</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleSound}
                      className={`relative w-14 h-7 rounded-full transition-colors ${enabled ? "bg-[#ff1744]" : "bg-white/10"
                        }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? "left-8" : "left-1"
                        }`} />
                    </button>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">Master Volume</p>
                        <p className="text-sm text-[#888]">Default volume for all sounds</p>
                      </div>
                      <span className="text-lg font-mono text-[#ff1744]">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume * 100}
                      onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:bg-[#ff1744]
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#666] mt-2">
                      <span>Quiet</span>
                      <span>Medium</span>
                      <span>Loud</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Eye size={24} className={settings.visualEffectsEnabled ? "text-[#d4af37]" : "text-[#666]"} />
                      <div>
                        <p className="font-medium">Visual Effects</p>
                        <p className="text-sm text-[#888]">Particles, shine, water droplets</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSettings(s => ({ ...s, visualEffectsEnabled: !s.visualEffectsEnabled }))}
                      className={`relative w-14 h-7 rounded-full transition-colors ${settings.visualEffectsEnabled ? "bg-[#d4af37]" : "bg-white/10"
                        }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${settings.visualEffectsEnabled ? "left-8" : "left-1"
                        }`} />
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#d4af37]/20 rounded-lg">
                    <Settings size={20} className="text-[#d4af37]" />
                  </div>
                  <h2 className="text-xl font-semibold">Page-wise Sound Settings</h2>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "heroSounds", label: "Hero Section", desc: "Engine ignition, headlight effects", icon: Car },
                    { key: "bookingSounds", label: "Booking Flow", desc: "Click, gear shift, success sounds", icon: Zap },
                    { key: "notificationSounds", label: "Notifications", desc: "Alerts and notification chimes", icon: Bell },
                    { key: "carWashSounds", label: "Car Wash Demo", desc: "Water, foam, polish effects", icon: Sparkles },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-[#888]" />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-[#666]">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key as keyof SoundSettings] }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key as keyof SoundSettings] ? "bg-green-500" : "bg-white/10"
                          }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings[item.key as keyof SoundSettings] ? "left-7" : "left-1"
                          }`} />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <VolumeX size={20} className="text-red-400" />
                      <div>
                        <p className="font-medium text-red-400">Admin Panel</p>
                        <p className="text-sm text-[#666]">Business mode - sounds disabled</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-500/20 rounded-full text-xs text-red-400">Always Off</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Play size={20} className="text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Sound Preview</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SOUND_TYPES.map((sound) => (
                    <button
                      key={sound.type}
                      onClick={() => handlePlayPreview(sound.type)}
                      disabled={!enabled}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Play size={14} className="text-[#888] group-hover:text-[#ff1744] transition-colors" />
                        <span className="text-sm font-medium">{sound.label}</span>
                      </div>
                      <p className="text-xs text-[#666]">{sound.description}</p>
                    </button>
                  ))}
                </div>

                {!enabled && (
                  <p className="text-sm text-center text-[#888] mt-4">
                    Enable sounds to preview them
                  </p>
                )}
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BarChart3 size={20} className="text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold">Shashti AI Insights</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-xl">
                    <p className="text-2xl font-bold text-green-400">+6.4%</p>
                    <p className="text-sm text-[#888]">Booking conversion with sounds</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl">
                    <p className="text-2xl font-bold text-blue-400">23%</p>
                    <p className="text-sm text-[#888]">Users enable sounds</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-[#d4af37]/10 to-transparent border border-[#d4af37]/20 rounded-xl">
                    <p className="text-2xl font-bold text-[#d4af37]">2.1x</p>
                    <p className="text-sm text-[#888]">Longer session with effects</p>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-[#888] italic">
                      &quot;Users who interact with sound effects show 23% higher engagement and 6.4% more likely to complete bookings.&quot;
                    </p>
                    <p className="text-xs text-[#666] mt-1">— Shashti AI</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full btn-premium py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Save Settings
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full py-3 rounded-xl border border-white/10 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    <RefreshCw size={18} />
                    Reset to Defaults
                  </button>
                </div>
              </motion.div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-sm text-yellow-400 font-medium mb-1">Accessibility Note</p>
                <p className="text-xs text-[#888]">
                  Sounds are automatically disabled for users with &quot;Reduce Motion&quot; preference enabled in their system settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
