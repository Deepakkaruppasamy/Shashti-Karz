"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, X, Trash2, Star, Power, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import type { Service } from "@/lib/types";

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  price: number;
  service_ids: string[] | null;
  is_popular: boolean;
  active: boolean;
  created_at: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    tier: "standard",
    price: 0,
    service_ids: [] as string[],
    is_popular: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesRes, servicesRes] = await Promise.all([
        fetch("/api/packages"),
        fetch("/api/services"),
      ]);
      if (packagesRes.ok) setPackages(await packagesRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPackage ? `/api/packages/${editingPackage.id}` : "/api/packages";
    const method = editingPackage ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(editingPackage ? "Package updated!" : "Package created!");
      setShowModal(false);
      setEditingPackage(null);
      resetForm();
      loadData();
    } else {
      toast.error("Failed to save package");
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", tier: "standard", price: 0, service_ids: [], is_popular: false });
  };

  const openEditModal = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      tier: pkg.tier,
      price: pkg.price,
      service_ids: pkg.service_ids || [],
      is_popular: pkg.is_popular,
    });
    setShowModal(true);
  };

  const toggleActive = async (pkg: ServicePackage) => {
    const res = await fetch(`/api/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !pkg.active }),
    });
    if (res.ok) {
      toast.success(pkg.active ? "Disabled" : "Enabled");
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted!");
      loadData();
    }
  };

  const calculateBundlePrice = async () => {
    if (form.service_ids.length === 0) return;
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "calculate_bundle", service_ids: form.service_ids }),
    });
    if (res.ok) {
      const data = await res.json();
      setForm({ ...form, price: data.bundle_price });
      toast.success(`Bundle price: ₹${data.bundle_price} (${data.bundle_discount}% off)`);
    }
  };

  const toggleService = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }));
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "premium": return "from-purple-500 to-pink-500";
      case "ultimate": return "from-[#d4af37] to-[#ffd700]";
      default: return "from-blue-500 to-cyan-500";
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <main className="min-h-screen pt-16 pb-16 lg:pt-20 lg:pb-20 bg-gradient-to-b from-[#0a0a0a] to-[#0a0a0a]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Service Packages</h1>
            <p className="text-[#888]">Create and manage bundled service packages</p>
          </div>
          <button
            onClick={() => { resetForm(); setEditingPackage(null); setShowModal(true); }}
            className="btn-premium px-6 py-3 rounded-xl text-white flex items-center gap-2"
          >
            <Plus size={18} />
            Create Package
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12 text-[#888]">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p>No packages created yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-6 border-2 relative overflow-hidden ${pkg.active ? "bg-white/5 border-white/10" : "bg-white/2 border-white/5 opacity-50"
                    }`}
                >
                  {pkg.is_popular && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full bg-[#ff1744] text-xs font-medium flex items-center gap-1">
                        <Star size={12} className="fill-white" />
                        Popular
                      </span>
                    </div>
                  )}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTierColor(pkg.tier)} flex items-center justify-center mb-4`}>
                    <Package size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                  <span className="text-xs text-[#888] uppercase tracking-wider">{pkg.tier}</span>
                  {pkg.description && (
                    <p className="text-sm text-[#888] mt-2 line-clamp-2">{pkg.description}</p>
                  )}
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gradient">₹{pkg.price.toLocaleString()}</span>
                  </div>
                  {pkg.service_ids && pkg.service_ids.length > 0 && (
                    <div className="mt-3 text-xs text-[#666]">
                      {pkg.service_ids.length} services included
                    </div>
                  )}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center gap-1 text-sm"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => toggleActive(pkg)}
                      className={`p-2 rounded-lg ${pkg.active ? "bg-green-500/10 text-green-500" : "bg-white/5 text-[#888]"}`}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </main>
  );
}
