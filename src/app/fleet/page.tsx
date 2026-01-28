"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Car, Plus, Users, FileText, Calendar, Phone, MapPin, Trash2, Edit3, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import toast from "react-hot-toast";
import Link from "next/link";
import type { FleetAccount, UserVehicle } from "@/lib/types";

export default function FleetPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [fleets, setFleets] = useState<(FleetAccount & { vehicles?: UserVehicle[]; vehicle_count?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState<(FleetAccount & { vehicles?: UserVehicle[] }) | null>(null);

  const [form, setForm] = useState({
    company_name: "",
    tax_id: "",
    billing_address: "",
    contact_phone: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadFleets();
    }
  }, [user]);

  const loadFleets = async () => {
    try {
      const response = await fetch(`/api/fleet?owner_id=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setFleets(data);
      }
    } catch (error) {
      console.error("Error loading fleets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFleetDetails = async (fleetId: string) => {
    try {
      const response = await fetch(`/api/fleet/${fleetId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedFleet(data);
      }
    } catch (error) {
      console.error("Error loading fleet details:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch("/api/fleet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, owner_id: user.id }),
      });

      if (response.ok) {
        toast.success("Fleet account created!");
        setShowModal(false);
        setForm({ company_name: "", tax_id: "", billing_address: "", contact_phone: "" });
        loadFleets();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create fleet");
      }
    } catch (error) {
      toast.error("Error creating fleet");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fleet account?")) return;

    try {
      const response = await fetch(`/api/fleet/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Fleet deleted!");
        loadFleets();
        if (selectedFleet?.id === id) {
          setSelectedFleet(null);
        }
      }
    } catch (error) {
      toast.error("Error deleting fleet");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold font-display">Fleet Management</h1>
              <p className="text-[#888] mt-1">Manage your corporate vehicle fleets</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            >
              <Plus size={18} />
              Create Fleet
            </button>
          </div>

          {isLoading ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : fleets.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Building2 size={40} className="text-[#888]" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Fleet Accounts</h3>
              <p className="text-[#888] mb-6 max-w-md mx-auto">
                Create a fleet account to manage multiple vehicles for your business with bulk booking and monthly invoicing.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Create Your First Fleet
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                {fleets.map((fleet) => (
                  <motion.div
                    key={fleet.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${
                      selectedFleet?.id === fleet.id
                        ? "border-2 border-[#ff1744]"
                        : "border border-white/10 hover:border-[#ff1744]/50"
                    }`}
                    onClick={() => loadFleetDetails(fleet.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Building2 size={28} className="text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{fleet.company_name}</h3>
                        <p className="text-sm text-[#888]">
                          {fleet.vehicle_count || 0} vehicles
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        fleet.status === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      }`}>
                        {fleet.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="lg:col-span-2">
                {selectedFleet ? (
                  <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Building2 size={32} className="text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">{selectedFleet.company_name}</h2>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                              selectedFleet.status === "active" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                            }`}>
                              {selectedFleet.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(selectedFleet.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {selectedFleet.tax_id && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <FileText size={18} className="text-[#888]" />
                            <div>
                              <p className="text-xs text-[#666]">Tax ID</p>
                              <p className="font-medium">{selectedFleet.tax_id}</p>
                            </div>
                          </div>
                        )}
                        {selectedFleet.contact_phone && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <Phone size={18} className="text-[#888]" />
                            <div>
                              <p className="text-xs text-[#666]">Contact</p>
                              <p className="font-medium">{selectedFleet.contact_phone}</p>
                            </div>
                          </div>
                        )}
                        {selectedFleet.billing_address && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 sm:col-span-2">
                            <MapPin size={18} className="text-[#888]" />
                            <div>
                              <p className="text-xs text-[#666]">Billing Address</p>
                              <p className="font-medium">{selectedFleet.billing_address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Car size={18} className="text-[#ff1744]" />
                          Fleet Vehicles ({selectedFleet.vehicles?.length || 0})
                        </h3>
                        <Link
                          href={`/dashboard/vehicles?fleet=${selectedFleet.id}`}
                          className="text-sm text-[#ff1744] hover:underline"
                        >
                          + Add Vehicle
                        </Link>
                      </div>

                      {selectedFleet.vehicles && selectedFleet.vehicles.length > 0 ? (
                        <div className="space-y-3">
                          {selectedFleet.vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                              <div className="w-10 h-10 rounded-lg bg-[#ff1744]/10 flex items-center justify-center">
                                <Car size={18} className="text-[#ff1744]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{vehicle.name}</h4>
                                <p className="text-sm text-[#888]">
                                  {vehicle.brand} {vehicle.model} • {vehicle.number_plate}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[#888]">
                          <Car size={32} className="mx-auto mb-2 opacity-50" />
                          <p>No vehicles in this fleet</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Link
                        href="/booking"
                        className="flex-1 btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                      >
                        <Calendar size={18} />
                        Book Fleet Service
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl p-8 text-center h-full flex items-center justify-center">
                    <div>
                      <Building2 size={48} className="mx-auto text-[#888] mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a Fleet</h3>
                      <p className="text-[#888]">Choose a fleet to view details and vehicles</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#111] rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create Fleet Account</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#888] mb-2">Company Name *</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#888] mb-2">Tax ID / GST Number</label>
                <input
                  type="text"
                  value={form.tax_id}
                  onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#888] mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#888] mb-2">Billing Address</label>
                <textarea
                  value={form.billing_address}
                  onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-premium px-6 py-3 rounded-xl font-semibold text-white"
                >
                  Create Fleet
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Footer />
    </main>
  );
}
