"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Plus, Edit3, Trash2, History, Calendar, Wrench, Fuel, Palette, Hash, FileText, X, ChevronRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import toast from "react-hot-toast";
import Link from "next/link";
import type { UserVehicle } from "@/lib/types";
import { carTypes } from "@/lib/data";

export default function VehiclesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<UserVehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    vin: "",
    number_plate: "",
    car_type: "sedan",
    fuel_type: "petrol",
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadVehicles();
    }
  }, [user]);

  const loadVehicles = async () => {
    try {
      const response = await fetch(`/api/vehicles?user_id=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error("Error loading vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVehicleHistory = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/history`);
      if (response.ok) {
        const data = await response.json();
        setVehicleHistory(data);
      }
    } catch (error) {
      console.error("Error loading vehicle history:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : "/api/vehicles";
      const method = editingVehicle ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, user_id: user.id }),
      });

      if (response.ok) {
        toast.success(editingVehicle ? "Vehicle updated!" : "Vehicle added!");
        setShowModal(false);
        setEditingVehicle(null);
        resetForm();
        loadVehicles();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save vehicle");
      }
    } catch (error) {
      toast.error("Error saving vehicle");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Vehicle deleted!");
        loadVehicles();
        if (selectedVehicle?.id === id) {
          setSelectedVehicle(null);
          setVehicleHistory(null);
        }
      }
    } catch (error) {
      toast.error("Error deleting vehicle");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      vin: "",
      number_plate: "",
      car_type: "sedan",
      fuel_type: "petrol",
      notes: "",
    });
  };

  const openEditModal = (vehicle: UserVehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      name: vehicle.name,
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || new Date().getFullYear(),
      color: vehicle.color || "",
      vin: vehicle.vin || "",
      number_plate: vehicle.number_plate || "",
      car_type: vehicle.car_type || "sedan",
      fuel_type: vehicle.fuel_type || "petrol",
      notes: vehicle.notes || "",
    });
    setShowModal(true);
  };

  const selectVehicle = (vehicle: UserVehicle) => {
    setSelectedVehicle(vehicle);
    loadVehicleHistory(vehicle.id);
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
              <h1 className="text-3xl font-bold font-display">My Vehicles</h1>
              <p className="text-[#888] mt-1">Manage your vehicle fleet and service history</p>
            </div>
            <button
              onClick={() => { resetForm(); setEditingVehicle(null); setShowModal(true); }}
              className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            >
              <Plus size={18} />
              Add Vehicle
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              {isLoading ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Car size={32} className="text-[#888]" />
                  </div>
                  <h3 className="font-medium mb-2">No vehicles yet</h3>
                  <p className="text-sm text-[#888] mb-4">Add your first vehicle to track service history</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-[#ff1744] text-sm font-medium"
                  >
                    + Add Vehicle
                  </button>
                </div>
              ) : (
                vehicles.map((vehicle) => (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${
                      selectedVehicle?.id === vehicle.id
                        ? "border-2 border-[#ff1744]"
                        : "border border-white/10 hover:border-[#ff1744]/50"
                    }`}
                    onClick={() => selectVehicle(vehicle)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 flex items-center justify-center">
                        <Car size={28} className="text-[#ff1744]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{vehicle.name}</h3>
                        <p className="text-sm text-[#888] truncate">
                          {vehicle.brand} {vehicle.model} • {vehicle.year}
                        </p>
                        {vehicle.number_plate && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/5 text-xs font-mono">
                            {vehicle.number_plate}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={20} className="text-[#666]" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="lg:col-span-2">
              {selectedVehicle ? (
                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                          <Car size={40} className="text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{selectedVehicle.name}</h2>
                          <p className="text-[#888]">
                            {selectedVehicle.brand} {selectedVehicle.model} • {selectedVehicle.year}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(selectedVehicle)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(selectedVehicle.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { icon: Hash, label: "Number Plate", value: selectedVehicle.number_plate },
                        { icon: Palette, label: "Color", value: selectedVehicle.color },
                        { icon: Fuel, label: "Fuel Type", value: selectedVehicle.fuel_type },
                        { icon: Car, label: "Car Type", value: selectedVehicle.car_type },
                        { icon: FileText, label: "VIN", value: selectedVehicle.vin },
                      ].filter(item => item.value).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                          <item.icon size={18} className="text-[#888]" />
                          <div>
                            <p className="text-xs text-[#666]">{item.label}</p>
                            <p className="font-medium capitalize">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedVehicle.notes && (
                      <div className="mt-4 p-4 rounded-xl bg-white/5">
                        <p className="text-sm text-[#888]">{selectedVehicle.notes}</p>
                      </div>
                    )}

                    <div className="mt-6 flex gap-3">
                      <Link
                        href={`/booking?vehicle=${selectedVehicle.id}`}
                        className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                      >
                        <Calendar size={18} />
                        Book Service
                      </Link>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <History size={18} className="text-[#ff1744]" />
                      Service History
                    </h3>

                    {vehicleHistory?.service_history?.length > 0 ? (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                          <div className="p-4 rounded-xl bg-white/5 text-center">
                            <Wrench size={24} className="mx-auto text-[#ff1744] mb-2" />
                            <div className="text-2xl font-bold">{vehicleHistory.total_services}</div>
                            <div className="text-sm text-[#888]">Total Services</div>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 text-center">
                            <Car size={24} className="mx-auto text-[#d4af37] mb-2" />
                            <div className="text-2xl font-bold">₹{vehicleHistory.total_spent.toLocaleString()}</div>
                            <div className="text-sm text-[#888]">Total Spent</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {vehicleHistory.service_history.map((booking: any) => (
                            <div key={booking.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                              <div className="w-10 h-10 rounded-lg bg-[#ff1744]/10 flex items-center justify-center">
                                <Wrench size={18} className="text-[#ff1744]" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{booking.service?.name || "Service"}</h4>
                                <p className="text-sm text-[#888]">{booking.date}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-[#d4af37]">₹{booking.price}</span>
                                <span className={`block text-xs capitalize ${
                                  booking.status === "completed" ? "text-green-500" : "text-yellow-500"
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle size={32} className="mx-auto text-[#888] mb-2" />
                        <p className="text-[#888]">No service history for this vehicle</p>
                        <Link href="/booking" className="text-[#ff1744] text-sm mt-2 inline-block">
                          Book first service
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-8 text-center h-full flex items-center justify-center">
                  <div>
                    <Car size={48} className="mx-auto text-[#888] mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Vehicle</h3>
                    <p className="text-[#888]">Choose a vehicle to view details and service history</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#111] rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#888] mb-2">Vehicle Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., My BMW"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#888] mb-2">Brand</label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      placeholder="BMW"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#888] mb-2">Model</label>
                    <input
                      type="text"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      placeholder="5 Series"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#888] mb-2">Year</label>
                    <input
                      type="number"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#888] mb-2">Color</label>
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="Black"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#888] mb-2">Number Plate</label>
                  <input
                    type="text"
                    value={form.number_plate}
                    onChange={(e) => setForm({ ...form, number_plate: e.target.value.toUpperCase() })}
                    placeholder="TN 39 AB 1234"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#888] mb-2">Car Type</label>
                    <select
                      value={form.car_type}
                      onChange={(e) => setForm({ ...form, car_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                    >
                      {carTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#888] mb-2">Fuel Type</label>
                    <select
                      value={form.fuel_type}
                      onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                    >
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="cng">CNG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#888] mb-2">VIN (Optional)</label>
                  <input
                    type="text"
                    value={form.vin}
                    onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                    placeholder="Vehicle Identification Number"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#888] mb-2">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any special notes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-premium px-6 py-3 rounded-xl font-semibold text-white"
                  >
                    {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
