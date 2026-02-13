"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Store,
  Tag,
  Car,
  Volume2,
  Save,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  CreditCard,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useSound } from "@/hooks/useSound";
import { playSound, setSoundEnabled, setSoundVolume as setVolume } from "@/lib/sound-system";
import { BrandedLoader } from "@/components/animations/BrandedLoader";

// --- Components for Tabs ---

function BusinessSettingsTab({ data, onSave }: { data: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(data || {});

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (parent: string, key: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
        <h3 className="text-xl font-bold text-white mb-4">Store Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-[#888] uppercase font-bold">Business Name</label>
            <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#d4af37] outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[#888] uppercase font-bold">Tagline</label>
            <input name="tagline" value={formData.tagline || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#d4af37] outline-none" />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
        <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-[#888] uppercase font-bold">Phone</label>
            <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#d4af37] outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-[#888] uppercase font-bold">WhatsApp</label>
            <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#d4af37] outline-none" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-[#888] uppercase font-bold">Email</label>
            <input name="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#d4af37] outline-none" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-[#888] uppercase font-bold">Address</label>
            <textarea name="address" value={formData.address || ''} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#d4af37] outline-none h-24" />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
        <h3 className="text-xl font-bold text-white mb-4">Operating Hours</h3>
        <div className="grid grid-cols-1 gap-4">
          {['weekdays', 'saturday', 'sunday'].map((day) => (
            <div key={day} className="space-y-2">
              <label className="text-xs text-[#888] uppercase font-bold">{day}</label>
              <input
                value={formData.hours?.[day] || ''}
                onChange={(e) => handleNestedChange('hours', day, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#d4af37] outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => onSave(formData)} className="w-full py-4 bg-[#d4af37] text-black font-bold uppercase rounded-xl hover:bg-[#b8860b] transition-colors">
        Save Business Settings
      </button>
    </div>
  );
}

function ServicesSettingsTab({ services }: { services: any[] }) {
  const supabase = createClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, field: string, value: any) => {
    const { error } = await supabase.from('service_packages').update({ [field]: value }).eq('id', id);
    if (error) toast.error("Failed to update service");
    else toast.success("Service updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Service Packages</h3>
        {/* Add New Service Button could go here */}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {services.map(service => (
          <div key={service.id} className="glass-card p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
              <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-2 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <input
                    defaultValue={service.name}
                    onBlur={(e) => handleUpdate(service.id, 'name', e.target.value)}
                    className="bg-transparent text-lg font-bold text-white border-b border-transparent focus:border-[#d4af37] outline-none w-full"
                  />
                  <input
                    defaultValue={service.short_desc}
                    onBlur={(e) => handleUpdate(service.id, 'short_desc', e.target.value)}
                    className="bg-transparent text-sm text-[#888] border-b border-transparent focus:border-[#d4af37] outline-none w-full"
                  />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-[#d4af37] font-bold">₹</span>
                    <input
                      type="number"
                      defaultValue={service.price}
                      onBlur={(e) => handleUpdate(service.id, 'price', parseFloat(e.target.value))}
                      className="bg-transparent text-lg font-bold text-[#d4af37] border-b border-transparent focus:border-[#d4af37] outline-none w-20 text-right"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.active}
                    onChange={(e) => handleUpdate(service.id, 'active', e.target.checked)}
                    className="accent-[#d4af37]"
                  />
                  <span className={service.active ? 'text-green-500' : 'text-red-500'}>{service.active ? 'Active' : 'Inactive'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.is_popular}
                    onChange={(e) => handleUpdate(service.id, 'is_popular', e.target.checked)}
                    className="accent-[#d4af37]"
                  />
                  <span className={service.is_popular ? 'text-[#d4af37]' : 'text-[#666]'}>Popular</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OffersSettingsTab({ offers }: { offers: any[] }) {
  const supabase = createClient();

  const handleToggle = async (id: number, current: boolean) => {
    await supabase.from('active_offers').update({ active: !current }).eq('id', id);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this offer?")) {
      await supabase.from('active_offers').delete().eq('id', id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Active Campaigns</h3>
        {/* Create New Offer logic needed */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map(offer => (
          <div key={offer.id} className="glass-card p-6 rounded-xl border border-white/5 relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleDelete(offer.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
            </div>
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-lg font-bold text-white">{offer.title}</h4>
              <span className="px-2 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded text-xs font-bold">{offer.discount}</span>
            </div>
            <p className="text-sm text-[#888] mb-4">{offer.description}</p>
            <div className="flex justify-between items-center">
              <code className="bg-white/10 px-3 py-1 rounded text-sm font-mono">{offer.code}</code>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase">
                <input
                  type="checkbox"
                  checked={offer.active}
                  onChange={() => handleToggle(offer.id, offer.active)}
                  className="accent-[#d4af37]"
                />
                <span>{offer.active ? 'Active' : 'Paused'}</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CarTypeSettingsTab({ carTypes }: { carTypes: any[] }) {
  const supabase = createClient();

  const handleUpdate = async (id: string, field: string, value: any) => {
    await supabase.from('car_types').update({ [field]: value }).eq('id', id);
    toast.success("Car type updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Vehicle Class Multipliers</h3>
      </div>
      <div className="space-y-3">
        {carTypes.map(type => (
          <div key={type.id} className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Car size={20} className="text-[#888]" />
              </div>
              <div>
                <input
                  defaultValue={type.name}
                  onBlur={(e) => handleUpdate(type.id, 'name', e.target.value)}
                  className="bg-transparent font-bold text-white border-b border-transparent focus:border-[#d4af37] outline-none"
                />
                <p className="text-xs text-[#666] uppercase">{type.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#888]">Multiplier:</span>
              <input
                type="number"
                step="0.1"
                defaultValue={type.price_multiplier || type.priceMultiplier}
                onBlur={(e) => handleUpdate(type.id, 'price_multiplier', parseFloat(e.target.value))}
                className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-right font-mono text-[#d4af37] focus:border-[#d4af37] outline-none"
              />
              <span className="text-xs text-[#666]">x</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoundSettingsTab() {
  const { enabled, volume, toggleSound, setVolume, setAdmin } = useSound();
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    // Load local sound settings
    const saved = localStorage.getItem("shashti_admin_sound_settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const saveSoundSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem("shashti_admin_sound_settings", JSON.stringify(newSettings));
    setSoundEnabled(newSettings.globalEnabled);
    if (newSettings.defaultVolume) setVolume(newSettings.defaultVolume / 100);
    toast.success("Sound settings updated");
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl ${enabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            <Volume2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white">Master Sound</h3>
            <p className="text-xs text-[#888]">Enable or disable all app sounds</p>
          </div>
        </div>
        <button
          onClick={toggleSound}
          className={`w-14 h-7 rounded-full relative transition-all ${enabled ? "bg-green-500" : "bg-white/10"}`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${enabled ? "left-8" : "left-1"}`} />
        </button>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex justify-between text-xs font-bold uppercase text-[#888]">
          <span>Master Volume</span>
          <span>{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff1744]"
        />
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function AdminSettingsPage() {
  const { businessInfo, services, offers, carTypes, loading, refresh } = useAppSettings();
  const [activeTab, setActiveTab] = useState<"business" | "services" | "offers" | "cartypes" | "sound">("business");
  const supabase = createClient();

  const handleSaveBusiness = async (data: any) => {
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: 'business_info',
        value: data,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      toast.success("Business settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    }
  };

  if (loading) return <BrandedLoader fullPage />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-8 space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-2 flex items-center gap-3">
            <Settings className="text-[#d4af37]" /> Global Configuration
          </h1>
          <p className="text-[#888]">Manage store details, services, and system preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {[
          { id: "business", label: "Business Info", icon: Store },
          { id: "services", label: "Services", icon: CreditCard },
          { id: "cartypes", label: "Car Types", icon: Car },
          { id: "offers", label: "Offers", icon: Tag },
          { id: "sound", label: "Sound & Visuals", icon: Volume2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 font-bold uppercase text-xs tracking-wider transition-all whitespace-nowrap ${activeTab === tab.id
                ? "bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20"
                : "bg-white/5 text-[#888] hover:bg-white/10 hover:text-white"
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="max-w-4xl">
        <AnimatePresence mode="wait">
          {activeTab === "business" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="business">
              <BusinessSettingsTab data={businessInfo} onSave={handleSaveBusiness} />
            </motion.div>
          )}
          {activeTab === "services" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="services">
              <ServicesSettingsTab services={services} />
            </motion.div>
          )}
          {activeTab === "cartypes" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="cartypes">
              <CarTypeSettingsTab carTypes={carTypes} />
            </motion.div>
          )}
          {activeTab === "offers" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="offers">
              <OffersSettingsTab offers={offers} />
            </motion.div>
          )}
          {activeTab === "sound" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="sound">
              <SoundSettingsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
