import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Sparkles, Brain, Zap, Activity, RefreshCw, BarChart3, TrendingUp, TrendingDown, Target, ShieldCheck, ShoppingCart, Box, Layers, History } from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "chemicals",
    unit: "liters",
    current_stock: 0,
    min_stock_threshold: 10,
    cost_per_unit: 0,
  });

  // Real-time subscription
  useRealtimeSubscription<any>({
    table: "inventory",
    onInsert: (newItem) => {
      // Map data to match frontend expectations
      const mapped = {
        ...newItem,
        current_stock: newItem.quantity,
        min_stock_threshold: newItem.min_quantity,
        cost_per_unit: newItem.price_per_unit
      };
      setItems(prev => [...prev, mapped]);
      toast.success(`New item added: ${newItem.name}`);
    },
    onUpdate: (updatedItem) => {
      const mapped = {
        ...updatedItem,
        current_stock: updatedItem.quantity,
        min_stock_threshold: updatedItem.min_quantity,
        cost_per_unit: updatedItem.price_per_unit
      };
      setItems(prev => prev.map(i => i.id === mapped.id ? mapped : i));
    },
    onDelete: (payload) => {
      setItems(prev => prev.filter(i => i.id !== payload.old.id));
    }
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (items.length > 0 && !aiInsight) {
      generateAiInsight();
    }
  }, [items]);

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

  const generateAiInsight = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/admin-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "Analyze current inventory levels. Identify items at highest risk of stockout and suggest an optimized purchase order for next week based on current burn rate.",
          context: {
            type: "inventory_analysis",
            items: items.map(i => ({ name: i.name, stock: i.current_stock, min: i.min_stock_threshold, unit: i.unit }))
          }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.response);
      }
    } finally {
      setIsAiLoading(false);
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
        toast.success("Inventory item initialized!");
        setShowModal(false);
        setForm({ name: "", category: "chemicals", unit: "liters", current_stock: 0, min_stock_threshold: 10, cost_per_unit: 0 });
      }
    } catch (error) {
      toast.error("Deployment failed");
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
        toast.success(`Injected ${restockQty} units into ${selectedItem.name}`);
        setShowRestockModal(false);
        setSelectedItem(null);
        setRestockQty(0);
      }
    } catch (error) {
      toast.error("Restock sequence interrupted");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Decommission this item permanently?")) return;
    try {
      const response = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Item decommissioned");
      }
    } catch (error) {
      toast.error("Decommissioning failed");
    }
  };

  const filteredItems = filter === "low"
    ? items.filter(i => i.current_stock <= i.min_stock_threshold)
    : items;

  const lowStockCount = items.filter(i => i.current_stock <= i.min_stock_threshold).length;
  const totalValue = items.reduce((sum, i) => sum + (i.current_stock * i.cost_per_unit), 0);
  const outOfStockCount = items.filter(i => i.current_stock === 0).length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                <Layers className="text-[#ff1744]" />
                Resource Engine
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Inventory Stream
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="btn-premium px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
              >
                <Plus size={16} />
                Provision Resource
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3 grid sm:grid-cols-3 gap-4">
              {[
                { label: "Total Asset Types", value: items.length, icon: Box, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Critical Stock", value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? "text-red-500" : "text-green-500", bg: lowStockCount > 0 ? "bg-red-500/10" : "bg-green-500/10" },
                { label: "Net Asset Value", value: `₹${totalValue.toLocaleString()}`, icon: TrendingUp, color: "text-[#d4af37]", bg: "bg-[#d4af37]/10" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-3xl p-6 border border-white/5 relative overflow-hidden group"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-[40px] opacity-20`} />
                  <div className="relative flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                      <stat.icon size={22} />
                    </div>
                    <div>
                      <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                      <div className="text-[10px] font-black text-[#555] uppercase tracking-widest">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="glass-card rounded-3xl p-6 border border-[#ff1744]/20 bg-[#ff1744]/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center animate-pulse">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div className="text-2xl font-black text-red-500 tracking-tighter">{outOfStockCount}</div>
                  <div className="text-[10px] font-black text-red-500/60 uppercase tracking-widest text-[#555]">Depleted Resources</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-[#888] uppercase tracking-[0.3em] ml-1">Universal Registry</h3>
                <div className="flex gap-2 p-1 glass-card rounded-xl border border-white/5">
                  {(["all", "low"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? "bg-white text-[#0a0a0a]" : "text-[#888] hover:text-white"}`}
                    >
                      {f === 'all' ? 'All Assets' : 'Emergency Restock'}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#444]">Syncing Neural Net...</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-1 gap-4">
                  {filteredItems.map((item) => {
                    const isLow = item.current_stock <= item.min_stock_threshold;
                    const percentage = Math.min(100, (item.current_stock / (item.min_stock_threshold * 2)) * 100);

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`glass-card rounded-[2rem] p-6 border-2 transition-all hover:scale-[1.01] overflow-hidden group ${isLow ? "border-red-500/30 bg-red-500/5" : "border-white/5 bg-white/[0.02]"}`}
                      >
                        <div className="flex items-center gap-6 relative">
                          <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center shrink-0 border transition-colors ${isLow ? "bg-red-500/20 border-red-500/30 text-red-500" : "bg-white/5 border-white/5 text-[#d4af37]"}`}>
                            <Box size={28} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-black text-lg tracking-tight truncate">{item.name}</h4>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${isLow ? 'bg-red-500/20 text-red-500 border-red-500/20' : 'bg-green-500/20 text-green-500 border-green-500/20'}`}>
                                {isLow ? 'Critical' : 'Operational'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">
                              <span className="flex items-center gap-1.5"><Layers size={12} /> {item.category}</span>
                              <span className="flex items-center gap-1.5"><History size={12} /> {item.unit}</span>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  className={`h-full rounded-full ${isLow ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-[#ff1744] to-[#d4af37]'}`}
                                />
                              </div>
                              <span className="text-[10px] font-black w-20 text-right">{item.current_stock} / {item.min_stock_threshold} min</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                            <div className="text-right">
                              <div className="text-lg font-black tracking-tighter">₹{item.cost_per_unit}</div>
                              <div className="text-[8px] font-black text-[#444] uppercase tracking-widest">Per {item.unit}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => { setSelectedItem(item); setShowRestockModal(true); }}
                                className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20 transition-all border border-[#d4af37]/10"
                              >
                                <RotateCcw size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/10"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              {/* AI insights Card */}
              <div className="glass-card rounded-[2.5rem] p-8 border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/5 to-transparent relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-[80px]" />
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center shadow-2xl ring-4 ring-white/5">
                    <Brain className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tighter">Supply Chain AI</h3>
                    <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest">Inventory Nexus</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 min-h-[200px] text-sm leading-relaxed text-[#ccc] italic">
                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center gap-4 py-12">
                        <RefreshCw className="animate-spin text-[#d4af37]" size={32} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#444]">Calibrating Burn Rate...</span>
                      </div>
                    ) : aiInsight ? (
                      aiInsight
                    ) : (
                      "Initiating stock-level analysis..."
                    )}
                  </div>

                  <button
                    onClick={generateAiInsight}
                    className="w-full py-4 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <Zap size={14} className="text-[#d4af37]" />
                    Recalibrate Forecast
                  </button>
                </div>
              </div>

              {/* Activity Log Placeholder */}
              <div className="glass-card rounded-[2.5rem] p-8 border border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444] mb-6 flex items-center gap-2">
                  <History size={14} /> Neural Events
                </h3>
                <div className="space-y-6">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex gap-4 group cursor-help">
                      <div className="w-1 h-8 rounded-full bg-white/5 group-hover:bg-[#ff1744] transition-colors" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-tighter">Stock Injection: Premium Wax</div>
                        <div className="text-[8px] font-black text-[#444] uppercase">+25.0 Units by System Admin</div>
                        <div className="text-[8px] font-black text-[#222] uppercase mt-1">2h 14m ago</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Implementation - Standardized with the new aesthetic */}
          {/* Add Item Modal */}
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xl bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff1744]/10 rounded-full blur-[100px] -z-1" />

                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter">Register Asset</h2>
                    <p className="text-[#888] text-sm uppercase font-black tracking-widest mt-1 text-[10px]">Neural Supply Integration</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors border border-white/5"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] ml-1">Asset Designation</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="e.g. ULTRA-SONIC POLISH"
                      className="w-full px-6 py-5 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none transition-all font-bold tracking-tight"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] ml-1">Category Link</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-6 py-5 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none transition-all font-bold uppercase text-xs tracking-widest"
                      >
                        <option value="chemicals">Chemicals</option>
                        <option value="cloths">Accessories</option>
                        <option value="tools">Hardware</option>
                        <option value="coatings">Pro-Coatings</option>
                        <option value="other">General</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] ml-1">Metric Unit</label>
                      <select
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        className="w-full px-6 py-5 rounded-2xl bg-white/[0.03] border border-white/10 focus:border-[#ff1744] focus:outline-none transition-all font-bold uppercase text-xs tracking-widest"
                      >
                        <option value="liters">Liters</option>
                        <option value="ml">Milliliters</option>
                        <option value="pieces">Units / Pcs</option>
                        <option value="sets">Industrial Sets</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-3">
                      <label className="text-[8px] font-black text-[#444] uppercase tracking-[0.2em]">Initial Stack</label>
                      <input
                        type="number"
                        value={form.current_stock}
                        onChange={(e) => setForm({ ...form, current_stock: parseFloat(e.target.value) })}
                        className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-[#ff1744] focus:outline-none text-center font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[8px] font-black text-[#444] uppercase tracking-[0.2em]">Min Payload</label>
                      <input
                        type="number"
                        value={form.min_stock_threshold}
                        onChange={(e) => setForm({ ...form, min_stock_threshold: parseFloat(e.target.value) })}
                        className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-[#ff1744] focus:outline-none text-center font-bold underline decoration-red-500/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[8px] font-black text-[#444] uppercase tracking-[0.2em]">Acq. Cost</label>
                      <input
                        type="number"
                        value={form.cost_per_unit}
                        onChange={(e) => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) })}
                        className="w-full px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 focus:border-[#ff1744] focus:outline-none text-center font-bold text-[#d4af37]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 rounded-[1.5rem] bg-white/5 font-black uppercase text-[10px] tracking-[0.2em] border border-white/5">Abort</button>
                    <button type="submit" className="flex-1 px-8 py-5 rounded-[1.5rem] btn-premium text-white font-black uppercase text-[10px] tracking-[0.3em]">Initialize Asset</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Restock Modal */}
          {showRestockModal && selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" onClick={() => setShowRestockModal(false)}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <RotateCcw size={32} />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter">Stack Injection</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#444] mt-1">{selectedItem.name}</p>
                </div>

                <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 mb-8 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#333] block mb-2">Available Mass</span>
                  <span className="text-3xl font-black tracking-tighter">{selectedItem.current_stock} <span className="text-sm font-bold text-[#444]">{selectedItem.unit}</span></span>
                </div>

                <div className="space-y-4 mb-10">
                  <label className="text-[10px] font-black text-[#444] uppercase tracking-widest block text-center">Load Quantity</label>
                  <input
                    type="number"
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseFloat(e.target.value))}
                    className="w-full px-6 py-6 rounded-2xl bg-white/5 border border-white/10 focus:border-green-500 focus:outline-none transition-all text-center text-4xl font-black tracking-tighter"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={handleRestock} className="w-full py-5 rounded-2xl bg-green-500 text-black font-black uppercase text-[10px] tracking-[0.3em] shadow-lg shadow-green-500/20 hover:scale-[1.03] active:scale-95 transition-all">Confirm Injection</button>
                  <button onClick={() => setShowRestockModal(false)} className="w-full py-4 rounded-2xl bg-white/5 text-[#444] font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Cancel</button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
