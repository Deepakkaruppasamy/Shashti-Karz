"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, AlertTriangle, RotateCcw, X, Edit3, Trash2, TrendingDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/AdminSidebar";
import type { InventoryItem } from "@/lib/types";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [filter, setFilter] = useState<"all" | "low">("all");

  const [form, setForm] = useState({
    name: "",
    category: "chemicals",
    unit: "liters",
    current_stock: 0,
    min_stock_threshold: 10,
    cost_per_unit: 0,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success("Item added!");
        setShowModal(false);
        setForm({ name: "", category: "chemicals", unit: "liters", current_stock: 0, min_stock_threshold: 10, cost_per_unit: 0 });
        loadItems();
      }
    } catch (error) {
      toast.error("Error adding item");
    }
  };

  const handleRestock = async () => {
    if (!selectedItem || restockQty <= 0) return;

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restock", item_id: selectedItem.id, quantity: restockQty }),
      });

      if (response.ok) {
        toast.success("Stock updated!");
        setShowRestockModal(false);
        setSelectedItem(null);
        setRestockQty(0);
        loadItems();
      }
    } catch (error) {
      toast.error("Error restocking");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const response = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Item deleted!");
        loadItems();
      }
    } catch (error) {
      toast.error("Error deleting item");
    }
  };

  const filteredItems = filter === "low"
    ? items.filter(i => i.current_stock <= i.min_stock_threshold)
    : items;

  const lowStockCount = items.filter(i => i.current_stock <= i.min_stock_threshold).length;
  const totalValue = items.reduce((sum, i) => sum + (i.current_stock * i.cost_per_unit), 0);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display flex items-center gap-3">
                <Package className="text-[#ff1744]" />
                Inventory
              </h1>
              <p className="text-[#888] mt-1 text-sm lg:text-base">Track products, supplies and chemicals</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadItems} className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#888] hover:text-white">
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white text-sm font-bold flex items-center gap-2"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Items", value: items.length, icon: Package, color: "from-blue-500 to-cyan-500" },
              { label: "Low Stock", value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? "from-red-500 to-orange-500" : "from-green-500 to-emerald-500" },
              { label: "Total Value", value: `₹${totalValue.toLocaleString()}`, icon: TrendingDown, color: "from-[#d4af37] to-[#ffd700]" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-[#888]">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="font-semibold text-lg">Inventory Items</h2>
              <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${filter === "all" ? "bg-[#ff1744] text-white shadow-lg" : "text-[#888] hover:text-white"}`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setFilter("low")}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${filter === "low" ? "bg-red-500 text-white shadow-lg" : "text-[#888] hover:text-white"}`}
                >
                  Low Stock
                  {lowStockCount > 0 && <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">{lowStockCount}</span>}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <div className="w-10 h-10 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#888] text-sm">Shashti AI is fetching inventory data...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 text-[#888] glass-card bg-white/[0.02] rounded-xl border-dashed border-white/10">
                <Package size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No items found</p>
                <p className="text-sm">Try changing filters or add a new item</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const isLow = item.current_stock <= item.min_stock_threshold;
                  return (
                    <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-white/[0.03] ${isLow ? "bg-red-500/5 border border-red-500/20" : "bg-white/5 border border-white/5"}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLow ? "bg-red-500/20" : "bg-white/10"}`}>
                        <Package size={24} className={isLow ? "text-red-500" : "text-[#888]"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{item.name}</h4>
                        <p className="text-xs text-[#888] uppercase tracking-wider">{item.category} • {item.unit}</p>
                      </div>
                      <div className="hidden md:block text-center px-4">
                        <div className={`text-lg font-bold ${isLow ? "text-red-500" : "text-white"}`}>{item.current_stock}</div>
                        <div className="text-[10px] text-[#888] uppercase">Current</div>
                      </div>
                      <div className="hidden sm:block text-center px-4">
                        <div className="text-lg font-bold text-[#d4af37]">₹{item.cost_per_unit}</div>
                        <div className="text-[10px] text-[#888] uppercase">Cost / {item.unit}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedItem(item); setShowRestockModal(true); }}
                          className="p-2.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                          title="Restock"
                        >
                          <RotateCcw size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowModal(false)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold font-display">Add Inventory</h2>
                    <p className="text-[#888] text-sm">Add a new product to tracking</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Item Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="e.g. Premium Shampoo"
                      className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                      >
                        <option value="chemicals">Chemicals</option>
                        <option value="cloths">Cloths</option>
                        <option value="tools">Tools</option>
                        <option value="coatings">Coatings</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Unit</label>
                      <select
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                      >
                        <option value="liters">Liters</option>
                        <option value="ml">ML</option>
                        <option value="pieces">Pieces</option>
                        <option value="sets">Sets</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Current Stock</label>
                      <input
                        type="number"
                        value={form.current_stock}
                        onChange={(e) => setForm({ ...form, current_stock: parseFloat(e.target.value) })}
                        className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Min Threshold</label>
                      <input
                        type="number"
                        value={form.min_stock_threshold}
                        onChange={(e) => setForm({ ...form, min_stock_threshold: parseFloat(e.target.value) })}
                        className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Cost/Unit</label>
                      <input
                        type="number"
                        value={form.cost_per_unit}
                        onChange={(e) => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) })}
                        className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
                    <button type="submit" className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-bold shadow-lg shadow-[#ff1744]/20 hover:scale-[1.02] transition-all">Add Product</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {showRestockModal && selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowRestockModal(false)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-3xl p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-display">Restock</h2>
                  <p className="text-[#888] text-sm">{selectedItem.name}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-6 flex justify-between items-center">
                  <span className="text-[#888] text-sm">Current Stock</span>
                  <span className="text-xl font-bold">{selectedItem.current_stock} {selectedItem.unit}</span>
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Quantity to Add</label>
                  <input
                    type="number"
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors text-center text-2xl font-bold"
                  />
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setShowRestockModal(false)} className="flex-1 px-6 py-4 rounded-2xl bg-white/5 font-bold border border-white/5 transition-colors">Cancel</button>
                  <button onClick={handleRestock} className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-bold shadow-lg shadow-[#ff1744]/20 transition-all">Restock</button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
