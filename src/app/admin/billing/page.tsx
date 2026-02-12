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

  const BILLING_TEMPLATES = [
    {
      name: "Ceramic Pro",
      icon: ShieldCheck,
      items: [
        { service_name: "9H Ceramic Coating", description: "Exterior 3-Layer Protection", quantity: 1, rate: 25000 },
        { service_name: "Glass Coating", description: "All Windows Hydrophobic Layer", quantity: 1, rate: 5000 }
      ]
    },
    {
      name: "Interior Revive",
      icon: User,
      items: [
        { service_name: "Deep Interior Detailing", description: "Steam Clean & Sanitize", quantity: 1, rate: 4500 },
        { service_name: "Leather Conditioning", description: "Premium Leather Treatment", quantity: 1, rate: 1500 }
      ]
    },
    {
      name: "Pro Wash",
      icon: Car,
      items: [
        { service_name: "Premium Wash & Wax", description: "Exterior Wash + Paste Wax", quantity: 1, rate: 1200 },
        { service_name: "Underbody Wash", description: "Chassis Pressure Clean", quantity: 1, rate: 300 }
      ]
    }
  ];

  const applyTemplate = (template: typeof BILLING_TEMPLATES[0]) => {
    const formattedItems = template.items.map((item, index) => ({
      id: (Date.now() + index).toString(),
      ...item,
      amount: item.quantity * item.rate
    }));
    setItems(formattedItems);
    toast.success(`Applied ${template.name} Template`);
  };

  const resetForm = () => {
    setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setVehicleNumber("");
    setPaymentMode("cash"); setPaymentReference(""); setDiscountPercent(0); setTaxPercent(18);
    setNotes(""); setItems([{ id: "1", service_name: "", description: "", quantity: 1, rate: 0, amount: 0 }]);
  };
  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    const LOGO_URL = "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT-Image-Dec-8-2025-10_12_14-AM-1-1768823187171.png";
    const QR_CODE_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=";
    const qrData = encodeURIComponent(`Invoice: ${invoice.invoice_number} | Amount: Rs.${invoice.total_amount}`);
    const qrUrl = `${QR_CODE_BASE}${qrData}`;

    // Helper to add images from URL
    const addImageFromUrl = (url: string, x: number, y: number, w: number, h: number) => {
      try {
        doc.addImage(url, 'PNG', x, y, w, h);
      } catch (e) {
        console.error("Failed to add image", e);
      }
    };

    // 1. Header Section - 3 Column Grid
    addImageFromUrl(LOGO_URL, margin, 15, 25, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(229, 57, 53); // Premium Red
    doc.text(COMPANY_INFO.name, 50, 27);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(66, 66, 66); // Dark Gray
    doc.text(COMPANY_INFO.tagline, 50, 33);

    // Official Invoice (Right Column) with low opacity
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(230, 230, 230); // 10-15% Opacity feel
    doc.text("OFFICIAL INVOICE", pageWidth - margin, 28, { align: "right" });

    // Header Red Line
    doc.setDrawColor(229, 57, 53);
    doc.setLineWidth(0.7);
    doc.line(margin, 43, pageWidth - margin, 43);

    // 2. Invoice Meta Block
    let yMeta = 52;
    doc.setFontSize(9);
    doc.setTextColor(97, 97, 97);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE NO :", pageWidth - 75, yMeta);
    doc.text("DATE       :", pageWidth - 75, yMeta + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(33, 33, 33);
    doc.text(invoice.invoice_number, pageWidth - margin, yMeta, { align: "right" });
    doc.text(new Date(invoice.invoice_date).toLocaleDateString(), pageWidth - margin, yMeta + 6, { align: "right" });

    // 3. Billing Context Section (50/50 Split)
    let yBill = 75;
    doc.setFontSize(8);
    doc.setTextColor(158, 158, 158);
    doc.setFont("helvetica", "bold");
    doc.text("SERVICE PROVIDER", margin, yBill);
    doc.text("BILL TO / CUSTOMER", margin + (contentWidth / 2), yBill);

    yBill += 5;
    doc.setFontSize(9);
    doc.setTextColor(33, 33, 33);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_INFO.name, margin, yBill);
    doc.text(invoice.customer_name, margin + (contentWidth / 2), yBill);

    yBill += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(66, 66, 66);
    doc.text(COMPANY_INFO.address, margin, yBill, { maxWidth: contentWidth / 2 - 10 });
    doc.text(`Phone: ${invoice.customer_phone}`, margin + (contentWidth / 2), yBill);

    yBill += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: ${COMPANY_INFO.gst}`, margin, yBill);
    doc.setTextColor(229, 57, 53);
    doc.text(`VEHICLE NO: ${invoice.vehicle_number || "N/A"}`, margin + (contentWidth / 2), yBill);

    // 4. Line Items Table
    let yTable = 110;
    doc.setFillColor(33, 33, 33); // Dark Gray / Black
    doc.rect(margin, yTable, contentWidth, 10, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("#", margin + 3, yTable + 6.5);
    doc.text("DESCRIPTION", margin + 12, yTable + 6.5);
    doc.text("QTY", margin + 105, yTable + 6.5, { align: "center" });
    doc.text("RATE", margin + 135, yTable + 6.5, { align: "right" });
    doc.text("TOTAL", margin + contentWidth - 3, yTable + 6.5, { align: "right" });

    yTable += 10;
    invoice.invoice_items.forEach((item, idx) => {
      // Stripe background
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yTable, contentWidth, 12, "F");
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(97, 97, 97);
      doc.text(String(idx + 1).padStart(2, '0'), margin + 3, yTable + 7.5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(33, 33, 33);
      doc.text(item.service_name, margin + 12, yTable + 6);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(117, 117, 117);
      doc.text(item.description || "-", margin + 12, yTable + 10);

      doc.setFontSize(8);
      doc.setTextColor(33, 33, 33);
      doc.text(item.quantity.toString(), margin + 105, yTable + 7.5, { align: "center" });
      doc.text(`${item.rate.toLocaleString()}`, margin + 135, yTable + 7.5, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`${item.amount.toLocaleString()}`, margin + contentWidth - 3, yTable + 7.5, { align: "right" });

      doc.setDrawColor(245, 245, 245);
      doc.setLineWidth(0.1);
      doc.line(margin, yTable + 12, margin + contentWidth, yTable + 12);
      yTable += 12;
    });

    // 5. Price Summary Block
    yTable += 10;
    const summaryLabelX = margin + 110;
    const summaryValueX = margin + contentWidth - 3;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(117, 117, 117);
    doc.text("SUBTOTAL", summaryLabelX, yTable);
    doc.text(`${invoice.subtotal.toLocaleString()}`, summaryValueX, yTable, { align: "right" });

    if (invoice.discount_amount > 0) {
      yTable += 6;
      doc.setTextColor(229, 57, 53);
      doc.text(`DISCOUNT (${invoice.discount_percent}%)`, summaryLabelX, yTable);
      doc.text(`-${invoice.discount_amount.toLocaleString()}`, summaryValueX, yTable, { align: "right" });
    }

    yTable += 6;
    doc.setTextColor(117, 117, 117);
    doc.text(`GST (${invoice.tax_percent}%)`, summaryLabelX, yTable);
    doc.text(`${invoice.tax_amount.toLocaleString()}`, summaryValueX, yTable, { align: "right" });

    yTable += 4;
    doc.setDrawColor(224, 224, 224);
    doc.setLineWidth(0.5);
    doc.line(summaryLabelX, yTable, summaryValueX, yTable);

    yTable += 8;
    // Total Payable Highlight
    doc.setFillColor(255, 235, 238); // Very light red tint
    doc.rect(summaryLabelX - 5, yTable - 6, (summaryValueX - summaryLabelX) + 10, 10, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text("TOTAL PAYABLE", summaryLabelX, yTable);
    doc.setTextColor(229, 57, 53);
    doc.setFontSize(13);
    doc.text(`Rs.${invoice.total_amount.toLocaleString()}`, summaryValueX, yTable, { align: "right" });

    yTable += 4;
    doc.setFontSize(7);
    doc.setTextColor(158, 158, 158);
    doc.text("(Inclusive of all taxes)", summaryLabelX, yTable);

    // 6. QR Code Section (Aligned Left)
    let yQR = yTable + 15;
    doc.setDrawColor(245, 245, 245);
    doc.rect(margin, yQR, 60, 45); // QR Box

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text("SCAN TO VERIFY & PAY", margin + 30, yQR + 8, { align: "center" });

    addImageFromUrl(qrUrl, margin + 17.5, yQR + 12, 25, 25);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(117, 117, 117);
    doc.text("UPI / Fast Verification", margin + 30, yQR + 41, { align: "center" });

    // 7. Jurisdictions & Signature
    let yBottom = 245;
    doc.setFontSize(7);
    doc.setTextColor(189, 189, 189);
    doc.text("Subject to Tirupur jurisdiction. This is a system-generated invoice.", pageWidth / 2, yBottom, { align: "center" });

    yBottom += 15;
    doc.setDrawColor(224, 224, 224);
    doc.line(pageWidth - margin - 50, yBottom, pageWidth - margin, yBottom);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);
    doc.text("SHASHTI KARZ", pageWidth - margin - 25, yBottom + 5, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(158, 158, 158);
    doc.text("AUTHORIZED SIGNATORY", pageWidth - margin - 25, yBottom + 10, { align: "center" });

    // 8. Footer Bar
    doc.setFillColor(33, 33, 33);
    doc.rect(0, 282, pageWidth, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("THANK YOU FOR YOUR BUSINESS - DRIVE SAFE", pageWidth / 2, 291, { align: "center" });

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
                {/* Template Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                  {BILLING_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyTemplate(tmpl)}
                      className="glass-card p-4 rounded-2xl border border-white/5 hover:border-[#ff1744]/30 hover:bg-[#ff1744]/5 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#ff1744]/20 group-hover:text-[#ff1744] transition-colors">
                          <tmpl.icon size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#444] tracking-widest group-hover:text-white transition-colors">Quick Load</p>
                          <p className="text-sm font-bold truncate">{tmpl.name}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
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
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md" onClick={() => setShowPreview(false)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-4xl bg-[#f8f9fa] rounded-3xl relative overflow-hidden flex flex-col max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Action Bar */}
                  <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-900 font-bold ml-2">Invoice Review</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handlePrint(selectedInvoice)} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold">
                          <Printer size={16} /> Print
                        </button>
                        <button onClick={() => handleDownloadPDF(selectedInvoice)} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold">
                          <Download size={16} /> Download
                        </button>
                        <button onClick={() => handleSendWhatsApp(selectedInvoice)} className="p-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold">
                          <MessageCircle size={16} /> WhatsApp
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setShowPreview(false)} className="p-2 text-gray-400 hover:text-gray-600">
                      <X size={24} />
                    </button>
                  </div>

                  {/* The Actual Bill Container */}
                  <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                    <div className="bg-white shadow-2xl rounded-2xl p-8 lg:p-14 text-gray-800 font-sans border border-gray-100 min-h-[1056px] w-full max-w-[800px] mx-auto">

                      {/* Bill Header */}
                      <div className="flex justify-between items-start mb-12">
                        <div>
                          <div className="text-3xl font-black text-[#ff1744] tracking-tighter mb-1 uppercase">Shashti Karz</div>
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">{COMPANY_INFO.tagline}</div>
                          <div className="mt-6 text-xs leading-relaxed text-gray-500 max-w-[200px]">
                            {COMPANY_INFO.address}<br />
                            {COMPANY_INFO.phone}<br />
                            {COMPANY_INFO.email}
                          </div>
                        </div>
                        <div className="text-right">
                          <h1 className="text-4xl font-black text-gray-200 mb-6 uppercase tracking-tight">Invoice</h1>
                          <div className="space-y-1">
                            <div className="text-[10px] text-gray-400 uppercase font-black">Invoice Number</div>
                            <div className="text-sm font-bold text-gray-900">{selectedInvoice.invoice_number}</div>
                          </div>
                          <div className="mt-4 space-y-1">
                            <div className="text-[10px] text-gray-400 uppercase font-black">Date of Issue</div>
                            <div className="text-sm font-bold text-gray-900">{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* Billing Info */}
                      <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-black mb-3 border-b border-gray-100 pb-2">Billed To</p>
                          <div className="text-base font-bold text-gray-900">{selectedInvoice.customer_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{selectedInvoice.customer_phone}</div>
                          <div className="text-xs text-gray-500">{selectedInvoice.customer_email}</div>
                          {selectedInvoice.vehicle_number && (
                            <div className="mt-3 inline-block px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-600 uppercase">
                              {selectedInvoice.vehicle_number}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-black mb-3 border-b border-gray-100 pb-2">Company Registry</p>
                          <div className="text-xs text-gray-500 font-medium">GSTIN: <span className="text-gray-900 font-bold">{COMPANY_INFO.gst}</span></div>
                          <div className="text-xs text-gray-500 font-medium mt-1">Status: <span className="text-green-600 font-bold">Verified Operator</span></div>
                          <div className="text-xs text-gray-500 font-medium mt-1">Payment: <span className="text-gray-900 font-bold uppercase">{selectedInvoice.payment_mode}</span></div>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="mb-12">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gray-900">
                              <th className="py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">#</th>
                              <th className="py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                              <th className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-16">Qty</th>
                              <th className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Rate</th>
                              <th className="py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedInvoice.invoice_items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-5 text-xs text-gray-400 font-mono">{String(idx + 1).padStart(2, '0')}</td>
                                <td className="py-5">
                                  <div className="text-sm font-bold text-gray-900">{item.service_name}</div>
                                  <div className="text-[10px] text-gray-400 italic line-clamp-1">{item.description}</div>
                                </td>
                                <td className="py-5 text-center text-sm font-bold text-gray-600">{item.quantity}</td>
                                <td className="py-5 text-right text-sm text-gray-600">₹{item.rate.toLocaleString()}</td>
                                <td className="py-5 text-right text-sm font-black text-gray-900">₹{item.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Calculations */}
                      <div className="flex justify-end">
                        <div className="w-full max-w-[300px] space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-bold uppercase">Subtotal</span>
                            <span className="text-gray-900 font-bold">₹{selectedInvoice.subtotal.toLocaleString()}</span>
                          </div>
                          {selectedInvoice.discount_amount > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-red-500 font-bold uppercase">Discount ({selectedInvoice.discount_percent}%)</span>
                              <span className="text-red-500 font-bold">-₹{selectedInvoice.discount_amount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-bold uppercase">GST ({selectedInvoice.tax_percent}%)</span>
                            <span className="text-gray-900 font-bold">₹{selectedInvoice.tax_amount.toLocaleString()}</span>
                          </div>
                          <div className="pt-4 border-t-4 border-gray-900 flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Total Payable</span>
                              <span className="text-sm font-bold text-gray-400 italic">Inclusive of all taxes</span>
                            </div>
                            <span className="text-3xl font-black text-gray-900">₹{selectedInvoice.total_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bill Footer */}
                      <div className="mt-24 pt-12 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-12">
                          <div>
                            <div className="text-[10px] text-gray-400 font-black uppercase mb-4 tracking-[0.2em]">Terms & Conditions</div>
                            <ol className="text-[9px] text-gray-400 leading-relaxed font-medium list-decimal pl-4 space-y-1">
                              <li>Works carried out on owner's risk. Company not liable for loss/theft of items left in car.</li>
                              <li>Complaints regarding quality should be reported within 24 hours of delivery.</li>
                              <li>Warranty on coatings applicable only if maintenance schedule is strictly followed.</li>
                            </ol>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className="mt-8 mb-2">
                              <div className="w-32 h-px bg-gray-200 mb-2"></div>
                              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Authorized Signatory</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-12 text-center">
                          <div className="inline-block px-10 py-3 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em]">
                            Official Document
                          </div>
                        </div>
                      </div>

                    </div>
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
