"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Printer, Download, Send, Eye, Save,
  Receipt, CreditCard, Banknote, Smartphone, Building, FileText,
  Search, Calendar, Filter, RefreshCw, CheckCircle, X, QrCode,
  Mail, MessageCircle, Car, User, Phone, Hash, Clock, Menu,
  DollarSign, Wallet, PieChart, Target, ShieldCheck, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface InvoiceItem {
  id: string;
  service_name: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_id: string | null;
  vehicle_number: string;
  invoice_date: string;
  payment_mode: string;
  payment_reference: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  notes: string;
  status: string;
  created_by_name: string;
  is_finalized: boolean;
  created_at: string;
  invoice_items: InvoiceItem[];
}

const PAYMENT_MODES = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "bank_transfer", label: "Bank", icon: Building },
];

const COMPANY_INFO = {
  name: "Shashti Karz",
  tagline: "Car Detailing Xpert",
  address: "123 Main Road, Tirupur, Tamil Nadu 641601",
  phone: "+91 98765 43210",
  email: "info@shashtikarz.com",
  gst: "33AABCU9603R1ZM",
};

export default function AdminBillingPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(18);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", service_name: "", description: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  // Real-time subscription
  useRealtimeSubscription<Invoice>({
    table: "invoices",
    onInsert: (newInvoice) => {
      setInvoices(prev => [newInvoice, ...prev]);
      toast.success(`Generated: ${newInvoice.invoice_number}`);
    }
  });

  useEffect(() => {
    if (activeTab === "history") loadInvoices();
  }, [activeTab]);

  async function loadInvoices() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      toast.error("Network synchronization failed");
    } finally {
      setIsLoading(false);
    }
  }

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), service_name: "", description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") updated.amount = Number(updated.quantity) * Number(updated.rate);
        return updated;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const totalAmount = taxableAmount + taxAmount;

  const handleSaveInvoice = async () => {
    if (!customerName.trim()) return toast.error("Designate subject name");
    setIsSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          vehicle_number: vehicleNumber,
          payment_mode: paymentMode,
          payment_reference: paymentReference,
          items: items.filter(item => item.service_name.trim()),
          discount_percent: discountPercent,
          tax_percent: taxPercent,
          notes,
          created_by_name: profile?.full_name || "Admin",
        }),
      });
      if (res.ok) {
        const invoice = await res.json();
        setSelectedInvoice(invoice);
        setShowPreview(true);
        resetForm();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setVehicleNumber("");
    setPaymentMode("cash"); setPaymentReference(""); setDiscountPercent(0); setTaxPercent(18);
    setNotes(""); setItems([{ id: "1", service_name: "", description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text("TAX INVOICE", 105, 20, { align: "center" });
    doc.setFontSize(10); doc.text(COMPANY_INFO.name, 20, 30);
    doc.text(`Invoice: ${invoice.invoice_number}`, 140, 30);
    return doc;
  };

  const handleDownloadPDF = (invoice: Invoice) => { generatePDF(invoice).save(`${invoice.invoice_number}.pdf`); };
  const handlePrint = (invoice: Invoice) => { window.open(generatePDF(invoice).output("bloburl")); };

  const handleSendWhatsApp = (invoice: Invoice) => {
    const message = `Hi ${invoice.customer_name}, your invoice ${invoice.invoice_number} for ₹${invoice.total_amount.toLocaleString()} is ready.`;
    window.open(`https://wa.me/${invoice.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = invoices.reduce((s, i) => s + i.total_amount, 0);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">

      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tighter flex items-center gap-3">
                <Wallet className="text-[#ff1744]" />
                Finance Nexus
              </h1>
              <p className="text-[#888] mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Revenue Processor
              </p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full md:w-auto">
              {(["create", "history"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? "bg-white text-black shadow-xl" : "text-[#555] hover:text-white"}`}
                >
                  {t === 'create' ? 'Draft Nexus' : 'Revenue Vault'}
                </button>
              ))}
            </div>
          </div>

          {/* Core Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Gross Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Transactions", value: invoices.length, icon: Receipt, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Yield / Ticket", value: `₹${(totalRevenue / (invoices.length || 1)).toFixed(0)}`, icon: Target, color: "text-[#d4af37]", bg: "bg-[#d4af37]/10" },
              { label: "Tax Pool", value: `₹${invoices.reduce((s, i) => s + i.tax_amount, 0).toLocaleString()}`, icon: ShieldCheck, color: "text-red-500", bg: "bg-red-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-card rounded-2xl p-4 lg:p-6 border border-white/5 flex items-center gap-3 lg:gap-4 ${i >= 2 ? 'hidden sm:flex' : 'flex'}`}
              >
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-lg lg:text-xl font-black tracking-tighter truncate">{stat.value}</div>
                  <div className="text-[8px] lg:text-[10px] font-black text-[#666] uppercase tracking-widest">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {activeTab === "create" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Matrix */}
                <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-8 border border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="text-[#ff1744]" size={20} />
                    <h2 className="text-xl font-black tracking-tighter uppercase text-[12px] text-[#ff1744]">Entity Identification</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[#444] tracking-widest ml-1">Subject Name</label>
                      <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full designation" className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[#444] tracking-widest ml-1">Comms Vector</label>
                      <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 Phone" className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[#444] tracking-widest ml-1">Digital Mail</label>
                      <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@address.com" className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-[#444] tracking-widest ml-1">Vehicle Plate</label>
                      <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="TN 00 XX 0000" className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] outline-none font-bold text-sm appearance-none" />
                    </div>
                  </div>
                </div>

                {/* Service Matrix */}
                <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-8 border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Receipt className="text-[#d4af37]" size={20} />
                      <h2 className="text-xl font-black tracking-tighter uppercase text-[12px] text-[#d4af37]">Load Items</h2>
                    </div>
                    <button onClick={addItem} className="p-2 lg:px-4 lg:py-2 rounded-xl bg-white/5 border border-white/5 text-[#d4af37] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#d4af37]/10 transition-colors">
                      <Plus size={16} />
                      <span className="hidden lg:inline">Inject Item</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 lg:p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
                        <div className="flex-1 space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
                          <input value={item.service_name} onChange={(e) => updateItem(item.id, "service_name", e.target.value)} placeholder="Service Concept" className="w-full bg-transparent border-b border-white/10 px-2 py-1 outline-none focus:border-[#ff1744] font-bold text-sm" />
                          <input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Specifications" className="w-full bg-transparent border-b border-white/10 px-2 py-1 outline-none text-[#666] text-xs" />
                        </div>
                        <div className="flex items-center justify-between lg:w-fit lg:gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-[#333] uppercase">Qty</span>
                            <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} className="w-12 bg-white/5 rounded-lg py-1 text-center font-bold text-xs" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-[#333] uppercase">Rate</span>
                            <input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", e.target.value)} className="w-24 bg-white/5 rounded-lg py-1 px-2 text-right font-bold text-xs" />
                          </div>
                          <div className="text-right font-black text-[#d4af37] text-sm w-20">
                            ₹{item.amount.toLocaleString()}
                          </div>
                          <button onClick={() => removeItem(item.id)} className="p-2 rounded-xl bg-red-500/5 text-red-500/30 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Logistics */}
                <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-8 border border-white/5">
                  <div className="flex items-center gap-3 mb-8">
                    <CreditCard className="text-blue-500" size={20} />
                    <h2 className="text-xl font-black tracking-tighter uppercase text-[12px] text-blue-500">Logistics Alignment</h2>
                  </div>
                  <div className="space-y-8">
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_MODES.map((mode) => (
                        <button key={mode.id} onClick={() => setPaymentMode(mode.id)} className={`flex-1 min-w-[100px] flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${paymentMode === mode.id ? "bg-[#ff1744] border-[#ff1744] shadow-lg shadow-[#ff1744]/20" : "bg-white/5 border-white/5 text-[#444]"}`}>
                          <mode.icon size={20} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#444] tracking-widest">Vector Ref</label>
                        <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Ref ID" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#444] tracking-widest">Efficiency Offset (%)</label>
                        <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 font-bold text-sm text-red-500" />
                      </div>
                      <div className="space-y-2 col-span-2 lg:col-span-1">
                        <label className="text-[10px] font-black uppercase text-[#444] tracking-widest">Regulatory Pool (%)</label>
                        <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 font-bold text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Summary Side */}
              <div className="lg:col-span-1">
                <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 sticky top-8">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444] mb-8">Yield Recalculation</h2>
                  <div className="space-y-2 mb-8">
                    <div className="flex justify-between text-xs text-[#666]">
                      <span>Subtotal Feed</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-red-500/50">
                      <span>Negative Offset</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#666]">
                      <span>Federal Pool ({taxPercent}%)</span>
                      <span>₹{taxAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-6 lg:p-8 bg-gradient-to-br from-[#ff1744]/10 to-transparent border border-[#ff1744]/20 rounded-3xl mb-8">
                    <span className="text-[10px] font-black text-[#ff1744] uppercase tracking-widest block mb-2">Net Financial Gain</span>
                    <div className="text-4xl lg:text-5xl font-black tracking-tighter">₹{totalAmount.toLocaleString()}</div>
                  </div>
                  <div className="space-y-3">
                    <button onClick={handleSaveInvoice} disabled={isSaving} className="w-full py-5 rounded-[1.5rem] btn-premium text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl">
                      {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                      Initialize Invoice
                    </button>
                    <button onClick={resetForm} className="w-full py-4 rounded-2xl bg-white/5 text-[#333] font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Clear Matrix</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-8 border border-white/5">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#444]" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Locate by designate or sequence..." className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:border-[#ff1744] outline-none" />
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#444]">Extracting Logs...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInvoices.map((inv) => (
                      <motion.div key={inv.id} whileHover={{ scale: 1.02 }} className="glass-card rounded-[2rem] p-6 border border-white/5 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-[#ff1744] uppercase tracking-widest">#{inv.invoice_number}</span>
                          <span className="text-[10px] font-black text-[#444] uppercase">{new Date(inv.invoice_date).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight mb-1 truncate">{inv.customer_name}</h3>
                        <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mb-6">{inv.vehicle_number || "No Plate"}</p>
                        <div className="flex items-end justify-between mb-6">
                          <div>
                            <span className="text-[8px] font-black text-[#333] uppercase block mb-1">Gain</span>
                            <span className="text-2xl font-black tracking-tighter">₹{inv.total_amount.toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${inv.payment_mode === 'cash' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {inv.payment_mode}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-6 border-t border-white/5">
                          <button onClick={() => { setSelectedInvoice(inv); setShowPreview(true); }} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center border border-white/5"><Eye size={16} /></button>
                          <button onClick={() => handleSendWhatsApp(inv)} className="p-3 rounded-xl bg-green-500/10 text-green-500 border border-green-500/10"><MessageCircle size={18} /></button>
                          <button onClick={() => handleDownloadPDF(inv)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5"><Download size={18} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Core Invoice Inspector Overlay */}
          <AnimatePresence>
            {showPreview && selectedInvoice && (
              <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl" onClick={() => setShowPreview(false)}>
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-2xl bg-[#0d0d0d] rounded-t-[3rem] sm:rounded-[3rem] p-8 lg:p-12 relative overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter">Receipt Matrix</h2>
                      <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Ref: {selectedInvoice.invoice_number}</p>
                    </div>
                    <button onClick={() => setShowPreview(false)} className="p-3 bg-white/5 border border-white/5 rounded-2xl"><X size={24} /></button>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 lg:p-8 mb-8 space-y-6">
                    <div className="grid grid-cols-2 gap-8 text-[12px]">
                      <div>
                        <span className="text-[8px] font-black text-[#333] uppercase tracking-widest block mb-2">Subject</span>
                        <div className="font-black text-white">{selectedInvoice.customer_name}</div>
                        <div className="text-[#666]">{selectedInvoice.customer_phone}</div>
                        <div className="text-[#666]">{selectedInvoice.vehicle_number}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-[#333] uppercase tracking-widest block mb-2">Metadata</span>
                        <div className="font-black text-white">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</div>
                        <div className="text-[#666] uppercase">{selectedInvoice.payment_mode}</div>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-4">
                      {selectedInvoice.invoice_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="min-w-0 pr-4">
                            <div className="font-black text-white truncate">{item.service_name}</div>
                            <div className="text-[10px] text-[#444] uppercase tracking-widest">{item.quantity} Unit x ₹{item.rate}</div>
                          </div>
                          <div className="font-black text-white text-right">₹{item.amount.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-[#444]">
                        <span>Designate Subtotal</span>
                        <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                      </div>
                      {selectedInvoice.discount_amount > 0 && (
                        <div className="flex justify-between text-xs text-red-500/40">
                          <span>Offset ({selectedInvoice.discount_percent}%)</span>
                          <span>-₹{selectedInvoice.discount_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-[#444]">
                        <span>Regulatory Pool ({selectedInvoice.tax_percent}%)</span>
                        <span>₹{selectedInvoice.tax_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xl font-black tracking-tighter pt-4 text-[#ff1744]">
                        <span>NET TOTAL</span>
                        <span>₹{selectedInvoice.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onClick={() => handlePrint(selectedInvoice)} className="col-span-1 py-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 group"><Printer size={20} className="group-hover:text-[#ff1744] transition-colors" /><span className="text-[8px] font-black uppercase">Print</span></button>
                    <button onClick={() => handleDownloadPDF(selectedInvoice)} className="col-span-1 py-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 group"><Download size={20} className="group-hover:text-[#ff1744] transition-colors" /><span className="text-[8px] font-black uppercase">PDF</span></button>
                    <button onClick={() => handleSendWhatsApp(selectedInvoice)} className="col-span-1 py-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-green-500"><MessageCircle size={20} /><span className="text-[8px] font-black uppercase">WA Stream</span></button>
                    <button onClick={() => toast.success("Comm system engaged")} className="col-span-1 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-blue-500"><Mail size={20} /><span className="text-[8px] font-black uppercase">Digital Mail</span></button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
