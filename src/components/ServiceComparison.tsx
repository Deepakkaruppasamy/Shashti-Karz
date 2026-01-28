"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Crown, Sparkles, Shield, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

const packages = [
  {
    tier: "basic",
    name: "Basic Wash",
    price: 499,
    duration: "30 mins",
    description: "Quick exterior clean for regular maintenance",
    color: "#888",
    features: [
      { name: "Exterior Hand Wash", included: true },
      { name: "Tire Cleaning", included: true },
      { name: "Window Cleaning", included: true },
      { name: "Dashboard Wipe", included: true },
      { name: "Interior Vacuum", included: false },
      { name: "Leather Conditioning", included: false },
      { name: "Engine Bay Clean", included: false },
      { name: "Paint Correction", included: false },
      { name: "Ceramic Coating", included: false },
      { name: "Warranty", included: false },
    ],
  },
  {
    tier: "premium",
    name: "Premium Detail",
    price: 2499,
    duration: "3-4 hours",
    description: "Complete interior & exterior transformation",
    color: "#ff1744",
    popular: true,
    features: [
      { name: "Exterior Hand Wash", included: true },
      { name: "Tire Cleaning", included: true },
      { name: "Window Cleaning", included: true },
      { name: "Dashboard Wipe", included: true },
      { name: "Interior Vacuum", included: true },
      { name: "Leather Conditioning", included: true },
      { name: "Engine Bay Clean", included: true },
      { name: "Paint Correction", included: false },
      { name: "Ceramic Coating", included: false },
      { name: "Warranty", included: false },
    ],
  },
  {
    tier: "ultimate",
    name: "Ultimate Protection",
    price: 14999,
    duration: "2-3 days",
    description: "Premium detailing with long-term protection",
    color: "#d4af37",
    features: [
      { name: "Exterior Hand Wash", included: true },
      { name: "Tire Cleaning", included: true },
      { name: "Window Cleaning", included: true },
      { name: "Dashboard Wipe", included: true },
      { name: "Interior Vacuum", included: true },
      { name: "Leather Conditioning", included: true },
      { name: "Engine Bay Clean", included: true },
      { name: "Paint Correction", included: true },
      { name: "Ceramic Coating", included: true },
      { name: "1 Year Warranty", included: true },
    ],
  },
];

export function ServiceComparison() {
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>("premium");

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0d] to-[#0a0a0a]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff1744]/10 border border-[#ff1744]/20 text-[#ff1744] text-sm mb-4">
            <Zap size={16} />
            Compare Packages
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Choose Your <span className="text-gradient">Perfect</span> Package
          </h2>
          <p className="text-[#888] max-w-2xl mx-auto">
            Compare our service packages and find the one that best fits your needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.tier}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredPackage(pkg.tier)}
              onMouseLeave={() => setHoveredPackage(null)}
              onClick={() => setSelectedPackage(pkg.tier)}
              className={`relative glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                selectedPackage === pkg.tier
                  ? "ring-2 scale-105"
                  : hoveredPackage === pkg.tier
                  ? "scale-102"
                  : ""
              }`}
              style={{
                borderColor: selectedPackage === pkg.tier ? pkg.color : "transparent",
                boxShadow: selectedPackage === pkg.tier ? `0 0 40px ${pkg.color}30` : "none",
              }}
            >
              {pkg.popular && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  <span className="px-4 py-1 bg-[#ff1744] rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles size={14} />
                    Most Popular
                  </span>
                </motion.div>
              )}

              <div className="text-center mb-6 pt-4">
                <motion.div
                  animate={{ 
                    scale: hoveredPackage === pkg.tier ? [1, 1.1, 1] : 1,
                    rotate: hoveredPackage === pkg.tier ? [0, 5, -5, 0] : 0
                  }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${pkg.color}20` }}
                >
                  {pkg.tier === "basic" && <Shield size={32} style={{ color: pkg.color }} />}
                  {pkg.tier === "premium" && <Sparkles size={32} style={{ color: pkg.color }} />}
                  {pkg.tier === "ultimate" && <Crown size={32} style={{ color: pkg.color }} />}
                </motion.div>

                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                <p className="text-sm text-[#888] mb-4">{pkg.description}</p>
                
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold" style={{ color: pkg.color }}>
                    ₹{pkg.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-[#666]">{pkg.duration}</p>
              </div>

              <div className="space-y-3 mb-6">
                {pkg.features.map((feature, i) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check size={12} className="text-green-500" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                        <X size={12} className="text-[#666]" />
                      </div>
                    )}
                    <span className={feature.included ? "text-white" : "text-[#666]"}>
                      {feature.name}
                    </span>
                  </motion.div>
                ))}
              </div>

              <Link
                href={`/booking?package=${pkg.tier}`}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  pkg.popular
                    ? "btn-premium"
                    : pkg.tier === "ultimate"
                    ? "btn-gold"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Select Package
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-16 overflow-x-auto"
        >
          <h3 className="text-2xl font-bold text-center mb-8">Detailed Comparison</h3>
          
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-[#888] font-medium">Feature</th>
                {packages.map((pkg) => (
                  <th key={pkg.tier} className="text-center py-4 px-4">
                    <span className="font-semibold" style={{ color: pkg.color }}>
                      {pkg.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages[0].features.map((feature, i) => (
                <motion.tr
                  key={feature.name}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5"
                >
                  <td className="py-4 px-4 text-[#aaa]">{feature.name}</td>
                  {packages.map((pkg) => {
                    const pkgFeature = pkg.features.find((f) => f.name === feature.name);
                    return (
                      <td key={pkg.tier} className="text-center py-4 px-4">
                        {pkgFeature?.included ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            className="w-6 h-6 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
                          >
                            <Check size={14} className="text-green-500" />
                          </motion.div>
                        ) : (
                          <div className="w-6 h-6 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                            <X size={14} className="text-[#666]" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
              <tr className="bg-white/5">
                <td className="py-4 px-4 font-semibold">Price</td>
                {packages.map((pkg) => (
                  <td key={pkg.tier} className="text-center py-4 px-4">
                    <span className="text-xl font-bold" style={{ color: pkg.color }}>
                      ₹{pkg.price.toLocaleString()}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-12 text-center"
        >
          <p className="text-[#888] mb-4">Not sure which package to choose?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/919876543210?text=Hi! I need help choosing the right car detailing package."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl hover:bg-[#25D366]/90 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat with Us
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              Contact Us
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
