"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Car, Calendar, Shield, Award, Star, Clock, 
  ArrowRight, Download, MessageSquare, AlertTriangle,
  History, Heart, TrendingUp, Info
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, language } = useLanguage();
  const [vehicle, setVehicle] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: vehicleData } = await supabase
          .from("user_vehicles")
          .select("*")
          .eq("id", id)
          .single();

        if (vehicleData) {
          setVehicle(vehicleData);
          
          const { data: bookingsData } = await supabase
            .from("bookings")
            .select("*, service:services(*)")
            .eq("car_model", vehicleData.model)
            .order("date", { ascending: false });
            
          setBookings(bookingsData || []);
        }
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, supabase]);

  const generateAIReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/vehicle-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: id }),
      });
      const data = await res.json();
      setHealthSummary(data);
      toast.success("AI Health Summary generated!");
    } catch (error) {
      toast.error("Failed to generate AI report");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!vehicle) return <div className="min-h-screen flex items-center justify-center">Vehicle not found</div>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Vehicle Info & Health Card */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ff1744]/20 to-transparent rounded-full blur-2xl" />
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 flex items-center justify-center mb-6">
                  <Car size={40} className="text-[#ff1744]" />
                </div>
                <h1 className="text-3xl font-bold mb-2">{vehicle.brand} {vehicle.model}</h1>
                <p className="text-[#888] font-mono mb-6">{vehicle.number_plate}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-[#666] mb-1">Year</p>
                    <p className="font-semibold">{vehicle.year || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-[#666] mb-1">Color</p>
                    <p className="font-semibold">{vehicle.color || "N/A"}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Heart size={20} className="text-[#ff1744]" />
                  {t('health_summary')}
                </h2>
                {!healthSummary && (
                  <button 
                    onClick={generateAIReport}
                    disabled={isGenerating}
                    className="text-xs px-3 py-1 bg-[#ff1744]/10 text-[#ff1744] rounded-full border border-[#ff1744]/20 hover:bg-[#ff1744]/20 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? "Analyzing..." : "Generate AI Summary"}
                  </button>
                )}
              </div>

              {healthSummary ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 * (1 - healthSummary["Health Score"] / 100)}
                          className="text-[#ff1744]"
                        />
                      </svg>
                      <span className="absolute text-sm font-bold">{healthSummary["Health Score"]}%</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Overall Health Score</p>
                      <p className="text-xs text-[#888]">Based on service history & detailing</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm leading-relaxed text-[#aaa]">
                    {healthSummary["AI Health Summary"]}
                  </div>

                  <div className="space-y-3">
                    {Object.entries(healthSummary["Component Status"] || {}).map(([key, val]: any) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-[#888]">{key}</span>
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full">{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-[#d4af37] mb-2">
                      <TrendingUp size={16} />
                      <span className="font-semibold">Resale Insight</span>
                    </div>
                    <p className="text-xs text-[#888] italic">
                      {healthSummary["Resale Value Insight"]}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info size={24} className="text-[#666]" />
                  </div>
                  <p className="text-sm text-[#666]">No health report available yet.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Service History & Actions */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <History size={24} className="text-[#ff1744]" />
                  {t('service_history')}
                </h2>
                <Link 
                  href="/booking"
                  className="px-4 py-2 bg-[#ff1744] text-white rounded-xl text-sm font-semibold hover:bg-[#ff1744]/90 transition-all flex items-center gap-2"
                >
                  <Calendar size={16} />
                  Book New Service
                </Link>
              </div>

              <div className="space-y-6">
                {bookings.length > 0 ? (
                  bookings.map((booking, idx) => (
                    <div key={booking.id} className="relative pl-8 pb-8 border-l border-white/10 last:pb-0">
                      <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-[#ff1744] shadow-[0_0_10px_#ff1744]" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                        <div>
                          <p className="text-sm text-[#666] mb-1">{booking.date}</p>
                          <h4 className="font-bold text-lg group-hover:text-[#ff1744] transition-colors">
                            {booking.service?.name || "General Service"}
                          </h4>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-[#888]">
                              {booking.status}
                            </span>
                            <span className="text-xs font-mono text-[#d4af37]">
                              ₹{booking.price}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all tooltip" title="Download Invoice">
                            <Download size={18} />
                          </button>
                          <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all" title="Reschedule">
                            <Clock size={18} />
                          </button>
                          <button className="px-4 py-2 bg-white/10 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car size={32} className="text-[#444]" />
                    </div>
                    <p className="text-[#666]">No service history found for this vehicle.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions / Self Service */}
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6 border-l-4 border-l-[#d4af37]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
                    <AlertTriangle size={24} className="text-[#d4af37]" />
                  </div>
                  <div>
                    <h3 className="font-bold">Need Help?</h3>
                    <p className="text-xs text-[#888]">Raise a service request</p>
                  </div>
                </div>
                <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all">
                  Contact Support
                </button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-2xl p-6 border-l-4 border-l-[#ff1744]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#ff1744]/10 flex items-center justify-center">
                    <MessageSquare size={24} className="text-[#ff1744]" />
                  </div>
                  <div>
                    <h3 className="font-bold">Shashti AI Chat</h3>
                    <p className="text-xs text-[#888]">Get instant answers</p>
                  </div>
                </div>
                <button className="w-full py-3 bg-[#ff1744] text-white rounded-xl text-sm font-semibold hover:bg-[#ff1744]/90 transition-all">
                  Start Chat
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
