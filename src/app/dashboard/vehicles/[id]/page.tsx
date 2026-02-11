"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Award, Bell, FileText, TrendingUp,
  CheckCircle2, AlertTriangle, Image as ImageIcon, Edit3, Plus,
  X, Upload, Star, Package, Clock, DollarSign, Sparkles, Brain
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import toast from "react-hot-toast";
import type {
  UserVehicle,
  ServiceJournalEntry,
  MaintenanceReminder,
  ServiceCertificate,
  VehicleHealthScore
} from "@/lib/types";
import { ServiceJournalModal } from "@/components/dashboard/ServiceJournalModal";
import { MaintenanceReminderModal } from "@/components/dashboard/MaintenanceReminderModal";

interface ExtendedVehicleData {
  vehicle: UserVehicle;
  service_history: any[];
  journal_entries: ServiceJournalEntry[];
  maintenance_reminders: MaintenanceReminder[];
  certificates: ServiceCertificate[];
  health_score: VehicleHealthScore | null;
}

export default function VehicleGaragePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [vehicleId, setVehicleId] = useState<string>("");
  const [vehicle, setVehicle] = useState<ExtendedVehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"journal" | "reminders" | "certificates" | "health">("journal");
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ServiceJournalEntry | null>(null);

  useEffect(() => {
    params.then(p => setVehicleId(p.id));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && vehicleId) {
      loadVehicleData();
    }
  }, [user, vehicleId]);

  const loadVehicleData = async () => {
    try {
      setIsLoading(true);

      // Load vehicle basic info & history
      const historyRes = await fetch(`/api/vehicles/${vehicleId}/history`);
      const historyData = await historyRes.json();

      // Load service journal entries
      const journalRes = await fetch(`/api/service-journal?vehicle_id=${vehicleId}`);
      const journalData = await journalRes.json();

      // Load maintenance reminders
      const remindersRes = await fetch(`/api/maintenance-reminders?vehicle_id=${vehicleId}&status=active`);
      const remindersData = await remindersRes.json();

      // Load certificates
      const certsRes = await fetch(`/api/certificates?vehicle_id=${vehicleId}`);
      const certsData = await certsRes.json();

      // Load health score
      const healthRes = await fetch(`/api/vehicles/${vehicleId}/health-score`);
      const healthData = await healthRes.json();

      setVehicle({
        vehicle: historyData.vehicle,
        service_history: historyData.service_history || [],
        journal_entries: journalData || [],
        maintenance_reminders: remindersData || [],
        certificates: certsData || [],
        health_score: healthData,
      });
    } catch (error) {
      console.error("Error loading vehicle data:", error);
      toast.error("Failed to load vehicle data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      const res = await fetch(`/api/maintenance-reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString()
        }),
      });

      if (res.ok) {
        toast.success("Reminder completed!");
        loadVehicleData();
      }
    } catch (error) {
      toast.error("Failed to update reminder");
    }
  };

  const handleDismissReminder = async (reminderId: string) => {
    try {
      const res = await fetch(`/api/maintenance-reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "dismissed",
          dismissed_at: new Date().toISOString()
        }),
      });

      if (res.ok) {
        toast.success("Reminder dismissed");
        loadVehicleData();
      }
    } catch (error) {
      toast.error("Failed to dismiss reminder");
    }
  };

  const handleDeleteJournalEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this service record?")) return;

    try {
      const { error } = await fetch(`/api/service-journal/${entryId}`, {
        method: "DELETE",
      }).then(res => res.json());

      if (error) throw new Error(error);

      toast.success("Entry deleted successfully");
      loadVehicleData();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  if (authLoading || !user || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Vehicle Not Found</h3>
          <p className="text-[#888] mb-4">The vehicle you&apos;re looking for doesn&apos;t exist.</p>
          <button onClick={() => router.push("/dashboard/vehicles")} className="btn-premium px-6 py-3 rounded-xl">
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/dashboard/vehicles")}
              className="flex items-center gap-2 text-[#888] hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              Back to Vehicles
            </button>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                  <FileText size={48} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold font-display">{vehicle.vehicle.name}</h1>
                  <p className="text-[#888] mt-1">
                    {vehicle.vehicle.brand} {vehicle.vehicle.model} • {vehicle.vehicle.year}
                  </p>
                  {vehicle.vehicle.number_plate && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-white/5 text-sm font-mono border border-white/10">
                      {vehicle.vehicle.number_plate}
                    </span>
                  )}
                </div>
              </div>

              {/* Health Score Badge */}
              {vehicle.health_score && (
                <div className="glass-card rounded-2xl p-6 text-center min-w-[200px]">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles size={20} className={getHealthScoreColor(vehicle.health_score.overall_score)} />
                    <span className="text-sm text-[#888]">Health Score</span>
                  </div>
                  <div className={`text-4xl font-bold ${getHealthScoreColor(vehicle.health_score.overall_score)}`}>
                    {Math.round(vehicle.health_score.overall_score)}
                  </div>
                  <div className="text-xs text-[#666] mt-1">
                    {getHealthScoreLabel(vehicle.health_score.overall_score)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4 text-center">
              <Calendar size={24} className="mx-auto text-[#ff1744] mb-2" />
              <div className="text-2xl font-bold">{vehicle.journal_entries.length}</div>
              <div className="text-xs text-[#888]">Services</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <DollarSign size={24} className="mx-auto text-[#d4af37] mb-2" />
              <div className="text-2xl font-bold">₹{(vehicle.health_score?.total_spent || 0).toLocaleString()}</div>
              <div className="text-xs text-[#888]">Total Spent</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Award size={24} className="mx-auto text-green-500 mb-2" />
              <div className="text-2xl font-bold">{vehicle.certificates.length}</div>
              <div className="text-xs text-[#888]">Certificates</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <Bell size={24} className="mx-auto text-yellow-500 mb-2" />
              <div className="text-2xl font-bold">{vehicle.maintenance_reminders.length}</div>
              <div className="text-xs text-[#888]">Reminders</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "journal", label: "Service Journal", icon: FileText },
              { id: "reminders", label: "Reminders", icon: Bell },
              { id: "certificates", label: "Certificates", icon: Award },
              { id: "health", label: "Health Report", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                  ? "bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white"
                  : "bg-white/5 hover:bg-white/10 text-[#888]"
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "journal" && (
              <motion.div
                key="journal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Service Journal</h2>
                  <button
                    onClick={() => setShowJournalModal(true)}
                    className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Entry
                  </button>
                </div>

                {vehicle.journal_entries.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <FileText size={48} className="mx-auto text-[#888] mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Service Records Yet</h3>
                    <p className="text-[#888] mb-4">Start tracking your vehicle&apos;s service history</p>
                    <button
                      onClick={() => setShowJournalModal(true)}
                      className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold"
                    >
                      Add First Entry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicle.journal_entries.map((entry) => (
                      <div key={entry.id} className="glass-card rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{entry.service_name}</h3>
                            <p className="text-sm text-[#888]">
                              {new Date(entry.service_date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {entry.price > 0 && (
                              <div className="text-sm font-semibold text-green-500">
                                ₹{entry.price.toLocaleString()}
                              </div>
                            )}
                            {entry.quality_rating && (
                              <div className="flex items-center gap-1">
                                <Star size={16} className="text-[#d4af37] fill-[#d4af37]" />
                                <span className="font-semibold">{entry.quality_rating.toFixed(1)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 ml-2">
                              <button
                                onClick={() => {
                                  setEditingEntry(entry);
                                  setShowJournalModal(true);
                                }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#888] hover:text-white transition-colors"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteJournalEntry(entry.id)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {entry.worker_notes && (
                          <div className="mb-4 p-4 rounded-lg bg-white/5">
                            <p className="text-sm text-[#ccc]"><strong>Worker Notes:</strong> {entry.worker_notes}</p>
                          </div>
                        )}

                        {entry.customer_notes && (
                          <div className="mb-4 p-4 rounded-lg bg-white/5">
                            <p className="text-sm text-[#ccc]"><strong>Your Notes:</strong> {entry.customer_notes}</p>
                          </div>
                        )}

                        {(entry.before_photos?.length > 0 || entry.after_photos?.length > 0) && (
                          <div className="grid grid-cols-2 gap-4">
                            {entry.before_photos?.length > 0 && (
                              <div>
                                <p className="text-xs text-[#888] mb-2">Before</p>
                                <div className="aspect-video rounded-lg bg-white/5 flex items-center justify-center">
                                  <ImageIcon size={24} className="text-[#666]" />
                                </div>
                              </div>
                            )}
                            {entry.after_photos?.length > 0 && (
                              <div>
                                <p className="text-xs text-[#888] mb-2">After</p>
                                <div className="aspect-video rounded-lg bg-white/5 flex items-center justify-center">
                                  <ImageIcon size={24} className="text-[#666]" />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "reminders" && (
              <motion.div
                key="reminders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Maintenance Reminders</h2>
                  <button
                    onClick={() => setShowReminderModal(true)}
                    className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Reminder
                  </button>
                </div>

                {vehicle.maintenance_reminders.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <Bell size={48} className="mx-auto text-[#888] mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Reminders Set</h3>
                    <p className="text-[#888] mb-4">Keep track of upcoming maintenance</p>
                    <button
                      onClick={() => setShowReminderModal(true)}
                      className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold"
                    >
                      Create Reminder
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicle.maintenance_reminders.map((reminder) => {
                      const daysUntil = reminder.due_date
                        ? Math.ceil((new Date(reminder.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : null;
                      const isOverdue = daysUntil !== null && daysUntil < 0;
                      const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;

                      return (
                        <div
                          key={reminder.id}
                          className={`glass-card rounded-xl p-6 border ${isOverdue ? "border-red-500/30" : isUrgent ? "border-yellow-500/30" : "border-white/10"
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {isOverdue ? (
                                  <AlertTriangle size={20} className="text-red-500" />
                                ) : isUrgent ? (
                                  <Clock size={20} className="text-yellow-500" />
                                ) : (
                                  <CheckCircle2 size={20} className="text-green-500" />
                                )}
                                <h3 className="font-semibold">{reminder.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${reminder.priority === 'critical' ? 'bg-red-500/20 text-red-500' :
                                  reminder.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                                    reminder.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                      'bg-green-500/20 text-green-500'
                                  }`}>
                                  {reminder.priority}
                                </span>
                              </div>
                              {reminder.description && (
                                <p className="text-sm text-[#888] mb-3">{reminder.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-[#666]">
                                {reminder.due_date && (
                                  <span>
                                    Due: {new Date(reminder.due_date).toLocaleDateString("en-IN")}
                                    {daysUntil !== null && (
                                      <span className={`ml-2 ${isOverdue ? 'text-red-500' : isUrgent ? 'text-yellow-500' : ''}`}>
                                        ({isOverdue ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days`})
                                      </span>
                                    )}
                                  </span>
                                )}
                                {reminder.estimated_cost && (
                                  <span>Est. Cost: ₹{reminder.estimated_cost.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCompleteReminder(reminder.id)}
                                className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                                title="Mark as complete"
                              >
                                <CheckCircle2 size={20} />
                              </button>
                              <button
                                onClick={() => handleDismissReminder(reminder.id)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="Dismiss"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "certificates" && (
              <motion.div
                key="certificates"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-2xl font-bold mb-6">Service Certificates</h2>

                {vehicle.certificates.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <Award size={48} className="mx-auto text-[#888] mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
                    <p className="text-[#888]">Premium service certificates will appear here</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {vehicle.certificates.map((cert) => (
                      <div key={cert.id} className="glass-card rounded-xl p-6 border border-[#d4af37]/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#ff1744] flex items-center justify-center">
                            <Award size={24} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{cert.service_name}</h3>
                            <p className="text-xs text-[#888] font-mono">{cert.certificate_number}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-[#888]">Warranty Period</span>
                            <span className="font-medium">{cert.warranty_period_months} months</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#888]">Valid Until</span>
                            <span className="font-medium">{new Date(cert.warranty_end_date).toLocaleDateString("en-IN")}</span>
                          </div>
                          {cert.warranty_terms && (
                            <div className="pt-2 mt-2 border-t border-white/5">
                              <p className="text-[10px] text-[#555] italic leading-tight">{cert.warranty_terms}</p>
                            </div>
                          )}
                          {cert.status === 'active' && (
                            <div className="flex justify-between">
                              <span className="text-[#888]">Status</span>
                              <span className="text-green-500 font-medium flex items-center gap-1">
                                <CheckCircle2 size={14} />
                                Active
                              </span>
                            </div>
                          )}
                        </div>

                        {cert.pdf_url && (
                          <button
                            onClick={() => window.open(cert.pdf_url || '', '_blank')}
                            className="w-full btn-premium py-3 rounded-xl text-sm font-semibold"
                          >
                            Download Certificate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "health" && (
              <motion.div
                key="health"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h2 className="text-2xl font-bold mb-6">Vehicle Health Report</h2>

                {vehicle.health_score ? (
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="glass-card rounded-2xl p-8 text-center">
                      <div className="w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{
                          background: `conic-gradient(
                            ${vehicle.health_score.overall_score >= 80 ? '#10b981' :
                              vehicle.health_score.overall_score >= 60 ? '#f59e0b' :
                                vehicle.health_score.overall_score >= 40 ? '#f97316' : '#ef4444'
                            } ${vehicle.health_score.overall_score * 3.6}deg,
                            rgba(255,255,255,0.1) 0deg
                          )`
                        }}
                      >
                        <div className="w-28 h-28 rounded-full bg-[#0a0a0a] flex flex-col items-center justify-center">
                          <div className={`text-3xl font-bold ${getHealthScoreColor(vehicle.health_score.overall_score)}`}>
                            {Math.round(vehicle.health_score.overall_score)}
                          </div>
                          <div className="text-xs text-[#666]">/ 100</div>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {getHealthScoreLabel(vehicle.health_score.overall_score)}
                      </h3>
                      <p className="text-sm text-[#888]">
                        Last updated: {new Date(vehicle.health_score.calculated_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    {/* Category Scores */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { label: "Exterior", score: vehicle.health_score.exterior_score, icon: Sparkles },
                        { label: "Interior", score: vehicle.health_score.interior_score, icon: Package },
                        { label: "Coating Health", score: vehicle.health_score.coating_health_score, icon: Award },
                        { label: "Maintenance", score: vehicle.health_score.maintenance_compliance_score, icon: CheckCircle2 },
                      ].map((item) => (
                        <div key={item.label} className="glass-card rounded-xl p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <item.icon size={18} className="text-[#888]" />
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <span className={`text-2xl font-bold ${getHealthScoreColor(item.score)}`}>
                              {Math.round(item.score)}
                            </span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.score >= 80 ? 'bg-green-500' :
                                item.score >= 60 ? 'bg-yellow-500' :
                                  item.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Statistics */}
                    <div className="glass-card rounded-xl p-6">
                      <h3 className="font-semibold mb-4">Service Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-[#888]">Days Since Last Service</p>
                          <p className="text-2xl font-bold">{vehicle.health_score.days_since_last_service}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#888]">Total Services</p>
                          <p className="text-2xl font-bold">{vehicle.health_score.total_services}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#888]">Services This Year</p>
                          <p className="text-2xl font-bold">{vehicle.health_score.services_last_year}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#888]">Overdue Services</p>
                          <p className={`text-2xl font-bold ${vehicle.health_score.overdue_services > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {vehicle.health_score.overdue_services}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {vehicle.health_score.recommendations?.length > 0 && (
                      <div className="glass-card rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <AlertTriangle size={18} className="text-yellow-500" />
                          Recommendations
                        </h3>
                        <ul className="space-y-2">
                          {vehicle.health_score.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 size={16} className="text-[#ff1744] mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* AI Detections Detail */}
                    {vehicle.health_score.detections && (vehicle.health_score.detections as any[]).length > 0 && (
                      <div className="glass-card rounded-xl p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Brain size={18} className="text-[#ff1744]" />
                          AI Visual Analysis Detections
                        </h3>
                        <div className="space-y-4">
                          {(vehicle.health_score.detections as any[]).map((det, i) => (
                            <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${det.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                                  det.severity === 'medium' ? 'bg-orange-500/10 text-orange-500' : 'bg-yellow-500/10 text-yellow-500'
                                  }`}>
                                  <AlertTriangle size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-sm uppercase tracking-wider">{det.type} @ {det.location}</p>
                                  <p className="text-xs text-[#888]">{det.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-[#444] uppercase font-black">Plan</p>
                                <p className="text-xs font-bold text-white">{det.recommendedService}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Diagnostic Image Reference */}
                    {vehicle.health_score.diagnostic_image && (
                      <div className="glass-card rounded-xl p-6">
                        <h3 className="font-semibold mb-4">Diagnostic Scan Reference</h3>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                          <img
                            src={vehicle.health_score.diagnostic_image}
                            alt="AI Diagnostic Scan"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                            <p className="text-xs text-white/60">Source scan used for health calculation</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <TrendingUp size={48} className="mx-auto text-[#888] mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Health Data Available</h3>
                    <p className="text-[#888]">Complete a few services to see your vehicle&apos;s health score</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ServiceJournalModal
        isOpen={showJournalModal}
        onClose={() => {
          setShowJournalModal(false);
          setEditingEntry(null);
        }}
        vehicleId={vehicleId}
        onSuccess={loadVehicleData}
        initialData={editingEntry}
      />

      <MaintenanceReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        vehicleId={vehicleId}
        onSuccess={loadVehicleData}
      />

      <Footer />
    </main>
  );
}
