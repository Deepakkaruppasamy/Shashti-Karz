"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Monitor, Car, Clock, CheckCircle2, Sparkles, Users, Calendar, RefreshCw } from "lucide-react";
import { businessInfo } from "@/lib/data";

interface QueueItem {
  id: string;
  booking_id: string;
  car_model: string;
  customer_name: string;
  service: { name: string };
  status: string;
  queue_position: number;
  estimated_wait_time: string;
  time: string;
}

export default function QueueDisplayPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const loadQueue = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/queue?date=${today}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setQueue(data);
      }
    } catch (error) {
      console.error("Error loading queue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const inProgress = queue.filter((q) => q.status === "in_progress" || q.status === "approved").slice(0, 3);
  const waiting = queue.filter((q) => q.status === "pending").slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
              <Car size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display text-gradient">{businessInfo.name}</h1>
              <p className="text-[#888]">Live Service Queue</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-4xl font-bold font-mono">
                {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="text-sm text-[#888]">
                {currentTime.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Monitor size={24} />
            </button>
            <button
              onClick={loadQueue}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={24} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center">
            <Calendar size={64} className="mx-auto text-[#888] mb-6" />
            <h2 className="text-3xl font-bold mb-4">No Services Scheduled</h2>
            <p className="text-xl text-[#888]">Check back later for live updates</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="glass-card rounded-3xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="text-2xl font-bold">Currently Servicing</h2>
                  <span className="ml-auto px-4 py-2 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                    {inProgress.length} Active
                  </span>
                </div>

                {inProgress.length > 0 ? (
                  <div className="space-y-4">
                    {inProgress.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-6 rounded-2xl ${
                          index === 0
                            ? "bg-gradient-to-r from-[#ff1744]/20 to-[#d4af37]/20 border-2 border-[#ff1744]/50"
                            : "bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                            index === 0 ? "bg-gradient-to-br from-[#ff1744] to-[#d4af37]" : "bg-white/10"
                          }`}>
                            <Sparkles size={36} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold">{item.car_model}</h3>
                            <p className="text-lg text-[#888]">{item.service?.name}</p>
                            <p className="text-sm text-[#666] mt-1">#{item.booking_id}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                              index === 0
                                ? "bg-[#ff1744] text-white animate-pulse"
                                : "bg-green-500/20 text-green-500"
                            }`}>
                              <CheckCircle2 size={16} />
                              {index === 0 ? "In Progress" : "Queued"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#888]">
                    <Car size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No vehicles currently being serviced</p>
                  </div>
                )}
              </div>

              <div className="glass-card rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Clock size={24} className="text-yellow-500" />
                  <h2 className="text-2xl font-bold">Waiting Queue</h2>
                  <span className="ml-auto px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-medium">
                    {waiting.length} Waiting
                  </span>
                </div>

                {waiting.length > 0 ? (
                  <div className="space-y-3">
                    {waiting.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
                      >
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-xl font-bold text-yellow-500">
                          {item.queue_position}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.car_model}</h4>
                          <p className="text-sm text-[#888]">{item.service?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.time}</p>
                          <p className="text-xs text-[#888]">~{item.estimated_wait_time} wait</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#888]">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No customers waiting</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-[#ff1744]/10 to-[#d4af37]/10">
                <h3 className="text-lg font-semibold mb-4">Today&apos;s Stats</h3>
                <div className="space-y-4">
                  {[
                    { label: "Total Bookings", value: queue.length, icon: Calendar },
                    { label: "In Progress", value: inProgress.length, icon: Sparkles },
                    { label: "Waiting", value: waiting.length, icon: Clock },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-black/20">
                      <stat.icon size={24} className="text-[#d4af37]" />
                      <div className="flex-1">
                        <p className="text-sm text-[#888]">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6">
                <h3 className="text-lg font-semibold mb-4">Average Wait Time</h3>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold text-[#d4af37]">
                    {waiting.length > 0 ? `${waiting.length * 30}` : "0"}
                  </div>
                  <p className="text-[#888] mt-2">minutes</p>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 text-center">
                <p className="text-sm text-[#888] mb-2">Questions? Call us</p>
                <p className="text-2xl font-bold text-[#ff1744]">{businessInfo.phone}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-[#666] text-sm">
          <p>Auto-refreshes every 30 seconds • {businessInfo.name} © {new Date().getFullYear()}</p>
        </div>
      </div>
    </main>
  );
}
