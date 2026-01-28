"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Car, Sparkles, Check, Plus, Minus, ArrowRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Service } from "@/lib/types";

const carTypes = [
  { id: "hatchback", name: "Hatchback", multiplier: 1.0, icon: "🚗" },
  { id: "sedan", name: "Sedan", multiplier: 1.15, icon: "🚙" },
  { id: "suv", name: "SUV / MUV", multiplier: 1.35, icon: "🚐" },
  { id: "luxury", name: "Luxury", multiplier: 1.5, icon: "🏎️" },
  { id: "sports", name: "Sports Car", multiplier: 1.6, icon: "🏁" },
];

const addons = [
  { id: "engine-bay", name: "Engine Bay Cleaning", price: 300 },
  { id: "headlight", name: "Headlight Restoration", price: 300 },
  { id: "odor", name: "Odor Removal", price: 300 },
  { id: "leather", name: "Leather Conditioning", price: 300 },
  { id: "wheel-coating", name: "Wheel Ceramic Coating", price: 300 },
  { id: "glass-coating", name: "Windshield Coating", price: 300 },
];

const packages = [
  { id: "basic-pkg", name: "Basic Package", price: 300, description: "Exterior wash + Interior vacuum" },
  { id: "premium-pkg", name: "Premium Package", price: 300, description: "Full detailing + Basic polish" },
  { id: "ultimate-pkg", name: "Ultimate Package", price: 300, description: "Ceramic coating + Full interior" },
];

interface PriceCalculatorProps {
  services: Service[];
  onBookNow?: (data: { service: string; carType: string; addons: string[]; total: number }) => void;
}

import { AIRatingDisplay } from "@/components/AIRatingDisplay";

export function PriceCalculator({ services, onBookNow }: PriceCalculatorProps) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCarType, setSelectedCarType] = useState(carTypes[0]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const basePrice = selectedService?.price || 0;
  const carMultiplier = selectedCarType.multiplier;
  const addonsTotal = selectedAddons.reduce((sum, addonId) => {
    const addon = addons.find(a => a.id === addonId);
    return sum + (addon?.price || 0);
  }, 0);
  const packagesTotal = selectedPackages.reduce((sum, pkgId) => {
    const pkg = packages.find(p => p.id === pkgId);
    return sum + (pkg?.price || 0);
  }, 0);
  const totalPrice = Math.round(basePrice * carMultiplier + addonsTotal + packagesTotal);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const togglePackage = (pkgId: string) => {
    setSelectedPackages(prev => 
      prev.includes(pkgId) 
        ? prev.filter(id => id !== pkgId)
        : [...prev, pkgId]
    );
  };

  useEffect(() => {
    if (selectedService || selectedAddons.length > 0 || selectedPackages.length > 0) {
      setIsCalculating(true);
      const timer = setTimeout(() => setIsCalculating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedService, selectedCarType, selectedAddons, selectedPackages]);

  const handleBookNow = () => {
    const addonNames = selectedAddons.map(id => addons.find(a => a.id === id)?.name).filter(Boolean);
    const packageNames = selectedPackages.map(id => packages.find(p => p.id === id)?.name).filter(Boolean);
    const allExtras = [...addonNames, ...packageNames].join(", ");
    
    const params = new URLSearchParams();
    if (selectedService) params.set("service", selectedService.id);
    params.set("car", selectedCarType.id);
    if (allExtras) params.set("addons", allExtras);
    params.set("total", totalPrice.toString());
    
    router.push(`/booking?${params.toString()}`);
  };

  const handleBookAddonOnly = (addonId: string) => {
    const addon = addons.find(a => a.id === addonId);
    if (!addon) return;
    
    const params = new URLSearchParams();
    params.set("addon", addon.name);
    params.set("car", selectedCarType.id);
    params.set("total", (addon.price * selectedCarType.multiplier).toString());
    
    router.push(`/booking?${params.toString()}`);
  };

  const handleBookPackageOnly = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    
    const params = new URLSearchParams();
    params.set("package", pkg.name);
    params.set("car", selectedCarType.id);
    params.set("total", (pkg.price * selectedCarType.multiplier).toString());
    
    router.push(`/booking?${params.toString()}`);
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]" />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 bg-gradient-conic from-[#ff1744]/5 via-transparent to-[#d4af37]/5 rounded-full blur-3xl" />
      </motion.div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff1744]/10 border border-[#ff1744]/20 text-[#ff1744] text-sm mb-4">
            <Calculator size={16} />
            Interactive Price Calculator
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Calculate Your <span className="text-gradient">Perfect</span> Package
          </h2>
          <p className="text-[#888] max-w-2xl mx-auto">
            Select your service, car type, and add-ons to get an instant price estimate. All services priced at ₹300!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-[#d4af37]" />
                Select Service
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {services.slice(0, 6).map((service) => (
                  <motion.button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedService?.id === service.id
                        ? "bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 border-2 border-[#ff1744]"
                        : "bg-white/5 border border-white/10 hover:border-white/20"
                    }`}
                  >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{service.name}</span>
                        {selectedService?.id === service.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-[#ff1744] flex items-center justify-center"
                          >
                            <Check size={12} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-[#d4af37]">₹300</span>
                        <AIRatingDisplay serviceId={service.id} className="scale-75 origin-right" />
                      </div>
                    </motion.button>

                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Car size={20} className="text-[#ff1744]" />
                Select Car Type
              </h3>
              <div className="flex flex-wrap gap-3">
                {carTypes.map((car) => (
                  <motion.button
                    key={car.id}
                    onClick={() => setSelectedCarType(car)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-5 py-3 rounded-xl flex items-center gap-2 transition-all ${
                      selectedCarType.id === car.id
                        ? "bg-gradient-to-br from-[#ff1744] to-[#d4af37] text-white"
                        : "bg-white/5 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl">{car.icon}</span>
                    <span className="font-medium">{car.name}</span>
                    {car.multiplier > 1 && (
                      <span className={`text-xs ${selectedCarType.id === car.id ? "text-white/80" : "text-[#888]"}`}>
                        +{Math.round((car.multiplier - 1) * 100)}%
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-[#d4af37]" />
                Add-ons (₹300 each)
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {addons.map((addon) => (
                  <motion.div
                    key={addon.id}
                    className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                      selectedAddons.includes(addon.id)
                        ? "bg-[#d4af37]/20 border-2 border-[#d4af37]"
                        : "bg-white/5 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    <button
                      onClick={() => toggleAddon(addon.id)}
                      className="flex-1 text-left"
                    >
                      <span className="font-medium">{addon.name}</span>
                      <span className="block text-sm text-[#d4af37]">₹{addon.price}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBookAddonOnly(addon.id)}
                        className="p-2 rounded-lg bg-[#ff1744]/10 text-[#ff1744] hover:bg-[#ff1744]/20 transition-colors"
                        title="Book this addon only"
                      >
                        <ShoppingCart size={14} />
                      </button>
                      <button
                        onClick={() => toggleAddon(addon.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          selectedAddons.includes(addon.id) ? "bg-[#d4af37]" : "bg-white/10"
                        }`}
                      >
                        {selectedAddons.includes(addon.id) ? (
                          <Check size={14} className="text-black" />
                        ) : (
                          <Plus size={14} className="text-white/50" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-[#ff1744]" />
                Packages (₹300 each)
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {packages.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    className={`p-4 rounded-xl transition-all ${
                      selectedPackages.includes(pkg.id)
                        ? "bg-[#ff1744]/20 border-2 border-[#ff1744]"
                        : "bg-white/5 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    <button
                      onClick={() => togglePackage(pkg.id)}
                      className="w-full text-left mb-3"
                    >
                      <span className="font-medium block">{pkg.name}</span>
                      <span className="text-xs text-[#888] block mt-1">{pkg.description}</span>
                      <span className="text-sm text-[#d4af37] block mt-2">₹{pkg.price}</span>
                    </button>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleBookPackageOnly(pkg.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#ff1744]/10 text-[#ff1744] hover:bg-[#ff1744]/20 transition-colors text-xs flex items-center gap-1"
                      >
                        <ShoppingCart size={12} />
                        Book Now
                      </button>
                      <button
                        onClick={() => togglePackage(pkg.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          selectedPackages.includes(pkg.id) ? "bg-[#ff1744]" : "bg-white/10"
                        }`}
                      >
                        {selectedPackages.includes(pkg.id) ? (
                          <Check size={14} className="text-white" />
                        ) : (
                          <Plus size={14} className="text-white/50" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24 h-fit"
          >
            <div className="glass-card rounded-2xl p-6 border border-[#ff1744]/20">
              <h3 className="text-lg font-semibold mb-6 text-center">Price Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Base Service</span>
                  <span>{selectedService ? `₹${basePrice.toLocaleString()}` : "—"}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Car Type ({selectedCarType.name})</span>
                  <span>{carMultiplier > 1 ? `+${Math.round((carMultiplier - 1) * 100)}%` : "—"}</span>
                </div>

                {selectedAddons.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Add-ons ({selectedAddons.length})</span>
                    <span>+₹{addonsTotal.toLocaleString()}</span>
                  </div>
                )}

                {selectedPackages.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888]">Packages ({selectedPackages.length})</span>
                    <span>+₹{packagesTotal.toLocaleString()}</span>
                  </div>
                )}

                <div className="h-px bg-white/10" />

                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={totalPrice}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="text-3xl font-bold text-gradient"
                    >
                      {isCalculating ? (
                        <span className="text-[#888]">...</span>
                      ) : (
                        `₹${totalPrice.toLocaleString()}`
                      )}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBookNow}
                  disabled={!selectedService && selectedAddons.length === 0 && selectedPackages.length === 0}
                  className="btn-premium w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Book Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <a
                  href={`https://wa.me/919876543210?text=${encodeURIComponent(
                    `Hi! I'm interested in ${selectedService?.name || "your services"} for my ${selectedCarType.name}. ${selectedAddons.length > 0 ? `Add-ons: ${selectedAddons.map(id => addons.find(a => a.id === id)?.name).join(", ")}. ` : ""}${selectedPackages.length > 0 ? `Packages: ${selectedPackages.map(id => packages.find(p => p.id === id)?.name).join(", ")}. ` : ""}Estimated price: ₹${totalPrice.toLocaleString()}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-xl bg-[#25D366]/20 text-[#25D366] font-semibold flex items-center justify-center gap-2 hover:bg-[#25D366]/30 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Get Quote on WhatsApp
                </a>
              </div>

              <p className="text-xs text-center text-[#666] mt-4">
                *Final price may vary based on car condition
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
