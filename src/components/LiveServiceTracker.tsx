"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { 
  Car, CheckCircle2, Clock, Sparkles, Wrench, Droplets, 
  Paintbrush, Shield, Wind, Search, Package, Bell, MessageSquare
} from "lucide-react";
import type { ServiceTracking, Booking } from "@/lib/types";
import { FeedbackForm } from "@/components/FeedbackForm";

const stages = [
  { id: "received", name: "Car Received", icon: Car, description: "Your car has been received at our facility" },
  { id: "inspection", name: "Inspection", icon: Search, description: "Detailed inspection in progress" },
  { id: "washing", name: "Washing", icon: Droplets, description: "Exterior and interior washing" },
  { id: "detailing", name: "Detailing", icon: Sparkles, description: "Deep cleaning and detailing" },
  { id: "polishing", name: "Polishing", icon: Paintbrush, description: "Paint polishing and correction" },
  { id: "coating", name: "Coating", icon: Shield, description: "Protective coating application" },
  { id: "drying", name: "Drying", icon: Wind, description: "Careful drying process" },
  { id: "quality_check", name: "Quality Check", icon: CheckCircle2, description: "Final quality inspection" },
  { id: "ready", name: "Ready", icon: Package, description: "Your car is ready for pickup" },
  { id: "delivered", name: "Delivered", icon: Bell, description: "Car delivered to customer" },
];

interface LiveServiceTrackerProps {
  bookingId?: string;
  isClient?: boolean;
}

export function LiveServiceTracker({ bookingId, isClient = false }: LiveServiceTrackerProps) {
  const [tracking, setTracking] = useState<ServiceTracking[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [currentStage, setCurrentStage] = useState<string>("received");
  const [searchId, setSearchId] = useState(bookingId || "");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (bookingId) {
      fetchTrackingData(bookingId);
    }
  }, [bookingId]);

    useEffect(() => {
      if (!booking?.id) return;

      const channel = supabase
        .channel(`tracking-${booking.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "service_tracking",
            filter: `booking_id=eq.${booking.id}`,
          },
          (payload) => {
            console.log("Realtime update received:", payload);
            if (payload.eventType === "INSERT") {
              setTracking(prev => {
                const exists = prev.find(t => t.id === payload.new.id);
                if (exists) return prev;
                return [...prev, payload.new as ServiceTracking].sort((a, b) => 
                  new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
                );
              });
            } else if (payload.eventType === "UPDATE") {
              setTracking(prev => 
                prev.map(t => t.id === payload.new.id ? payload.new as ServiceTracking : t)
              );
            }
            updateCurrentStage();
          }
        )
        .subscribe((status) => {
          console.log(`Realtime subscription status for booking ${booking.id}:`, status);
        });

      // Fallback polling every 10 seconds if realtime is slow or disabled
      const pollInterval = setInterval(() => {
        fetchTrackingData(booking.id, true);
      }, 10000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
      };
    }, [booking?.id]);

    const fetchTrackingData = async (id: string, isSilent = false) => {
      if (!isSilent) setIsSearching(true);
      setError("");

      try {
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .or(`booking_id.eq.${id},id.eq.${id}`)
          .single();

        if (bookingError || !bookingData) {
          if (!isSilent) setError("Booking not found. Please check your booking ID.");
          setBooking(null);
          setTracking([]);
          return;
        }

        setBooking(bookingData);

        const { data: trackingData } = await supabase
          .from("service_tracking")
          .select("*")
          .eq("booking_id", bookingData.id)
          .order("created_at", { ascending: true });

        setTracking(trackingData || []);
        updateCurrentStage(trackingData || []);
      } catch {
        if (!isSilent) setError("Error fetching tracking data");
      } finally {
        if (!isSilent) setIsSearching(false);
      }
    };


  const updateCurrentStage = (data?: ServiceTracking[]) => {
    const trackingData = data || tracking;
    const inProgressStage = trackingData.find(t => t.status === "in_progress");
    const lastCompleted = [...trackingData].reverse().find(t => t.status === "completed");
    
    if (inProgressStage) {
      setCurrentStage(inProgressStage.stage);
    } else if (lastCompleted) {
      const currentIndex = stages.findIndex(s => s.id === lastCompleted.stage);
      if (currentIndex < stages.length - 1) {
        setCurrentStage(stages[currentIndex + 1].id);
      } else {
        setCurrentStage(lastCompleted.stage);
      }
    }
  };

  const getStageStatus = (stageId: string) => {
    const stageData = tracking.find(t => t.stage === stageId);
    if (stageData?.status === "completed") return "completed";
    if (stageData?.status === "in_progress") return "in_progress";
    return "pending";
  };

  const getProgress = () => {
    const completedStages = tracking.filter(t => t.status === "completed").length;
    return Math.round((completedStages / stages.length) * 100);
  };

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0d0808] to-[#0a0a0a]" />
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-sm mb-4">
            <Clock size={16} className="animate-pulse" />
            Live Service Tracker
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Track Your <span className="text-gradient-gold">Car&apos;s Journey</span>
          </h2>
          <p className="text-[#888] max-w-2xl mx-auto">
            Real-time updates on your car&apos;s service progress
          </p>
        </motion.div>

        {isClient && !bookingId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-12"
          >
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-medium mb-2">Enter Booking ID</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="e.g., BK-ABC123"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#ff1744] focus:outline-none"
                />
                <button
                  onClick={() => fetchTrackingData(searchId)}
                  disabled={!searchId || isSearching}
                  className="btn-premium px-6 py-3 rounded-xl disabled:opacity-50"
                >
                  {isSearching ? "..." : "Track"}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </motion.div>
        )}

        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-semibold">{booking.car_model}</h3>
                  <p className="text-[#888]">Booking: {booking.booking_id}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gradient">{getProgress()}%</div>
                  <p className="text-sm text-[#888]">Complete</p>
                </div>
              </div>

              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff1744] to-[#d4af37] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgress()}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ff1744] to-[#d4af37] rounded-full blur-sm opacity-50"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgress()}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {stages.map((stage, index) => {
                const status = getStageStatus(stage.id);
                const stageData = tracking.find(t => t.stage === stage.id);
                const Icon = stage.icon;
                
                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card rounded-xl p-4 flex items-center gap-4 transition-all ${
                      status === "in_progress" 
                        ? "border-2 border-[#ff1744] bg-[#ff1744]/5"
                        : status === "completed"
                        ? "border border-green-500/30 bg-green-500/5"
                        : "border border-white/5"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      status === "completed" 
                        ? "bg-green-500/20"
                        : status === "in_progress"
                        ? "bg-[#ff1744]/20"
                        : "bg-white/5"
                    }`}>
                      {status === "completed" ? (
                        <CheckCircle2 className="text-green-500" size={24} />
                      ) : status === "in_progress" ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Icon className="text-[#ff1744]" size={24} />
                        </motion.div>
                      ) : (
                        <Icon className="text-[#666]" size={24} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${
                          status === "completed" ? "text-green-500" :
                          status === "in_progress" ? "text-white" : "text-[#666]"
                        }`}>
                          {stage.name}
                        </h4>
                        {status === "in_progress" && (
                          <span className="px-2 py-0.5 bg-[#ff1744] rounded-full text-xs animate-pulse">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#888]">{stage.description}</p>
                      {stageData?.notes && (
                        <p className="text-sm text-[#d4af37] mt-1">{stageData.notes}</p>
                      )}
                    </div>

                    {stageData?.completed_at && (
                      <div className="text-right text-sm text-[#888]">
                        {new Date(stageData.completed_at).toLocaleTimeString()}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-[#888] mb-4">Questions about your service?</p>
              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent(
                  `Hi! I'm checking on my booking ${booking.booking_id}. Current status: ${currentStage}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl hover:bg-[#25D366]/90 transition-colors mb-6"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contact via WhatsApp
              </a>

              {getProgress() === 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-8 border-t border-white/10"
                >
                  <FeedbackForm
                    bookingId={booking.id}
                    customerName={booking.customer_name}
                    carModel={booking.car_model}
                    serviceName={booking.service?.name || "Premium Detailing"}
                    userId={booking.user_id}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {!booking && !isClient && (
          <div className="text-center text-[#666]">
            <p>Enter your booking ID above to track your service</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function ServiceTrackerDemo() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage(prev => (prev + 1) % stages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#080a0d] to-[#0a0a0a]" />
      
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] text-sm mb-4">
            <Clock size={16} />
            Real-Time Updates
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            Live <span className="text-gradient-gold">Service Tracking</span>
          </h2>
          <p className="text-[#888] max-w-2xl mx-auto">
            Track every step of your car&apos;s transformation with real-time notifications
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#ff1744] via-[#d4af37] to-[#666]" />

          <div className="space-y-6">
            {stages.slice(0, 6).map((stage, index) => {
              const Icon = stage.icon;
              const isActive = index === activeStage % 6;
              const isCompleted = index < activeStage % 6;
              
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-center gap-6 pl-4"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.2, 1] : 1,
                      boxShadow: isActive ? "0 0 30px rgba(255, 23, 68, 0.5)" : "none"
                    }}
                    transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? "bg-green-500" :
                      isActive ? "bg-[#ff1744]" : "bg-[#333]"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={20} className="text-white" />
                    ) : (
                      <Icon size={20} className="text-white" />
                    )}
                  </motion.div>

                  <motion.div
                    animate={{ 
                      opacity: isActive ? 1 : 0.6,
                      x: isActive ? 10 : 0 
                    }}
                    className={`flex-1 glass-card rounded-xl p-4 ${
                      isActive ? "border-2 border-[#ff1744]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{stage.name}</h4>
                        <p className="text-sm text-[#888]">{stage.description}</p>
                      </div>
                      {isActive && (
                        <span className="px-3 py-1 bg-[#ff1744] rounded-full text-xs animate-pulse">
                          Live
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">
                          Done
                        </span>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-12 text-center"
        >
          <p className="text-[#888] mb-4">Get notified at every step</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Bell size={16} className="text-[#ff1744]" />
              <span className="text-sm">Push Notifications</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-sm">WhatsApp Updates</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
              <Package size={16} className="text-[#d4af37]" />
              <span className="text-sm">SMS Alerts</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
