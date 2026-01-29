"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Printer, Download, Send, Eye, Save,
  Receipt, CreditCard, Banknote, Smartphone, Building, FileText,
  Search, Calendar, Filter, RefreshCw, CheckCircle, X, QrCode,
  Mail, MessageCircle, Car, User, Phone, Hash, Clock, Menu
} from "lucide-react";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

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
  { id: "custom", label: "Other", icon: Receipt },
];

const COMPANY_INFO = {
  name: "Shashti Karz",
  tagline: "Car Detailing Xpert",
  address: "123 Main Road, Tirupur, Tamil Nadu 641601",
  phone: "+91 98765 43210",
  email: "info@shashtikarz.com",
  gst: "33AABCU9603R1ZM",
  logo: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/ChatGPT-Image-Dec-8-2025-10_12_14-AM-1-1768823187171.png?width=200&height=200&resize=contain",
};

export default function AdminBillingPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (activeTab === "history") {
      loadInvoices();
    }
  }, [activeTab]);

  async function loadInvoices() {
    setIsLoading(true);
    try {
      let url = "/api/invoices";
      const params = new URLSearchParams();
      if (filterDateStart) params.append("start_date", filterDateStart);
      if (filterDateEnd) params.append("end_date", filterDateEnd);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), service_name: "", description: "", quantity: 1, rate: 0, amount: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updated.amount = updated.quantity * updated.rate;
        }
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
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (items.every(item => !item.service_name.trim())) {
      toast.error("At least one service is required");
      return;
    }

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
          created_by: profile?.id,
          created_by_name: profile?.full_name || "Admin",
        }),
      });

      if (!res.ok) throw new Error("Failed to save invoice");

      const invoice = await res.json();
      toast.success("Invoice saved successfully!");
      setSelectedInvoice(invoice);
      setShowPreview(true);
      resetForm();
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setVehicleNumber("");
    setPaymentMode("cash");
    setPaymentReference("");
    setDiscountPercent(0);
    setTaxPercent(18);
    setNotes("");
    setItems([{ id: "1", service_name: "", description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_INFO.name, 20, 25);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_INFO.tagline, 20, 33);

    doc.setFontSize(8);
    doc.text(COMPANY_INFO.address, pageWidth - 20, 20, { align: "right" });
    doc.text(`Phone: ${COMPANY_INFO.phone}`, pageWidth - 20, 27, { align: "right" });
    doc.text(`Email: ${COMPANY_INFO.email}`, pageWidth - 20, 34, { align: "right" });
    doc.text(`GST: ${COMPANY_INFO.gst}`, pageWidth - 20, 41, { align: "right" });

    doc.setTextColor(255, 23, 68);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageWidth / 2, 65, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.setFillColor(245, 245, 245);
    doc.rect(20, 75, 80, 35, "F");
    doc.rect(110, 75, 80, 35, "F");

    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 25, 83);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.customer_name, 25, 91);
    if (invoice.customer_phone) doc.text(`Phone: ${invoice.customer_phone}`, 25, 98);
    if (invoice.vehicle_number) doc.text(`Vehicle: ${invoice.vehicle_number}`, 25, 105);

    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details:", 115, 83);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${invoice.invoice_number}`, 115, 91);
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 115, 98);
    doc.text(`Payment: ${invoice.payment_mode.toUpperCase()}`, 115, 105);

    let yPos = 125;
    doc.setFillColor(255, 23, 68);
    doc.rect(20, yPos, pageWidth - 40, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Service", 25, yPos + 6);
    doc.text("Qty", 120, yPos + 6);
    doc.text("Rate", 145, yPos + 6);
    doc.text("Amount", 175, yPos + 6);

    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    invoice.invoice_items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPos - 4, pageWidth - 40, 8, "F");
      }
      doc.text(item.service_name, 25, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`₹${item.rate.toLocaleString()}`, 145, yPos);
      doc.text(`₹${item.amount.toLocaleString()}`, 175, yPos);
      yPos += 10;
    });

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(120, yPos, pageWidth - 20, yPos);

    yPos += 10;
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 140, yPos);
    doc.text(`₹${invoice.subtotal.toLocaleString()}`, 175, yPos);

    if (invoice.discount_amount > 0) {
      yPos += 8;
      doc.text(`Discount (${invoice.discount_percent}%):`, 140, yPos);
      doc.setTextColor(255, 0, 0);
      doc.text(`-₹${invoice.discount_amount.toLocaleString()}`, 175, yPos);
      doc.setTextColor(0, 0, 0);
    }

    if (invoice.tax_amount > 0) {
      yPos += 8;
      doc.text(`GST (${invoice.tax_percent}%):`, 140, yPos);
      doc.text(`₹${invoice.tax_amount.toLocaleString()}`, 175, yPos);
    }

    yPos += 12;
    doc.setFillColor(10, 10, 10);
    doc.rect(130, yPos - 6, 60, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 135, yPos + 2);
    doc.text(`₹${invoice.total_amount.toLocaleString()}`, 175, yPos + 2);

    yPos += 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Payment received - Offline Payment - Verified by Admin", pageWidth / 2, yPos, { align: "center" });

    yPos += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 80, yPos);
    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signature", 35, yPos + 5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", pageWidth / 2, yPos + 20, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text("Terms & Conditions: All services are subject to our standard terms. No refunds after service completion.", pageWidth / 2, 280, { align: "center" });

    return doc;
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    const doc = generatePDF(invoice);
    doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    toast.success("Invoice downloaded!");
  };

  const handlePrint = (invoice: Invoice) => {
    const doc = generatePDF(invoice);
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success("Opening print dialog...");
  };

  const handleSendWhatsApp = (invoice: Invoice) => {
    const message = `Hi ${invoice.customer_name}!\n\nYour invoice from Shashti Karz:\n\nInvoice No: ${invoice.invoice_number}\nTotal Amount: ₹${invoice.total_amount.toLocaleString()}\nPayment Status: Paid (${invoice.payment_mode.toUpperCase()})\n\nThank you for choosing Shashti Karz!`;
    const phone = invoice.customer_phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleSendEmail = (invoice: Invoice) => {
    const subject = `Invoice ${invoice.invoice_number} from Shashti Karz`;
    const body = `Dear ${invoice.customer_name},\n\nPlease find your invoice details below:\n\nInvoice No: ${invoice.invoice_number}\nDate: ${new Date(invoice.invoice_date).toLocaleDateString()}\nTotal Amount: ₹${invoice.total_amount.toLocaleString()}\nPayment Status: Paid (${invoice.payment_mode.toUpperCase()})\n\nThank you for choosing Shashti Karz!\n\nBest regards,\nShashti Karz Team`;
    const mailtoUrl = `mailto:${invoice.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_blank");
  };

  const exportInvoices = () => {
    const data = invoices.map(inv => ({
      "Invoice No": inv.invoice_number,
      "Date": new Date(inv.invoice_date).toLocaleDateString(),
      "Customer": inv.customer_name,
      "Phone": inv.customer_phone,
      "Vehicle": inv.vehicle_number,
      "Payment Mode": inv.payment_mode,
      "Subtotal": inv.subtotal,
      "Discount": inv.discount_amount,
      "Tax": inv.tax_amount,
      "Total": inv.total_amount,
      "Status": inv.status,
      "Created By": inv.created_by_name,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `Invoices_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Invoices exported to Excel");
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer_phone.includes(searchQuery)
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display flex items-center gap-3">
                <Receipt className="text-[#ff1744]" />
                Billing & Invoices
              </h1>
              <p className="text-[#888] mt-1 text-sm lg:text-base">Create and manage offline customer invoices</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "create" ? "bg-[#ff1744] text-white shadow-lg" : "text-[#888] hover:text-white"}`}
              >
                Create New
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "history" ? "bg-[#ff1744] text-white shadow-lg" : "text-[#888] hover:text-white"}`}
              >
                History
              </button>
            </div>
          </div>

          {activeTab === "create" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User size={20} className="text-[#ff1744]" />
                      Customer Details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Customer Name *</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Email</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="customer@email.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Vehicle Number</label>
                        <input
                          type="text"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          placeholder="TN 39 AB 1234"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Receipt size={20} className="text-[#d4af37]" />
                        Service Items
                      </h2>
                      <button
                        onClick={addItem}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add Item
                      </button>
                    </div>

                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-12 sm:col-span-4">
                            <input
                              type="text"
                              value={item.service_name}
                              onChange={(e) => updateItem(item.id, "service_name", e.target.value)}
                              placeholder="Service name (e.g. Ceramic Coating)"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, "description", e.target.value)}
                              placeholder="Note (e.g. 3 layers)"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-1">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                              min="1"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-3 text-sm text-white text-center focus:border-[#ff1744] focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="col-span-4 sm:col-span-2">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                              min="0"
                              placeholder="Rate"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white text-right focus:border-[#ff1744] focus:outline-none transition-colors"
                            />
                          </div>
                          <div className="col-span-3 sm:col-span-1 text-right text-sm text-[#d4af37] font-bold">
                            ₹{item.amount.toLocaleString()}
                          </div>
                          <div className="col-span-1 text-right">
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={items.length === 1}
                              className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-20 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard size={20} className="text-green-500" />
                      Payment Details
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-3">Payment Mode</label>
                        <div className="flex flex-wrap gap-2">
                          {PAYMENT_MODES.map((mode) => (
                            <button
                              key={mode.id}
                              onClick={() => setPaymentMode(mode.id)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${paymentMode === mode.id
                                ? "bg-[#ff1744] border-[#ff1744] text-white shadow-lg shadow-[#ff1744]/20"
                                : "bg-white/5 border-white/10 text-[#888] hover:text-white"
                                }`}
                            >
                              <mode.icon size={16} />
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Reference ID</label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="UPI Ref / Last 4 digits"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Discount (%)</label>
                          <input
                            type="number"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">GST (%)</label>
                          <input
                            type="number"
                            value={taxPercent}
                            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="glass-card rounded-2xl p-6 sticky top-24">
                    <h2 className="text-lg font-semibold mb-6">Invoice Summary</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#888]">Subtotal</span>
                        <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                      </div>
                      {discountPercent > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#888]">Discount ({discountPercent}%)</span>
                          <span className="text-red-500 font-medium">-₹{discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      {taxPercent > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#888]">GST ({taxPercent}%)</span>
                          <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="h-px bg-white/10 my-4" />
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-[#888] font-bold uppercase tracking-widest">Total Amount</p>
                          <p className="text-3xl font-bold text-gradient">₹{totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="pt-6 space-y-3">
                        <button
                          onClick={handleSaveInvoice}
                          disabled={isSaving}
                          className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-bold shadow-lg shadow-[#ff1744]/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                          Save & Preview
                        </button>
                        <button
                          onClick={resetForm}
                          className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-card rounded-2xl p-6 border border-white/5">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by invoice number, name or phone..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-[#ff1744] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={exportInvoices}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Export
                  </button>
                </div>

                {isLoading ? (
                  <div className="text-center py-20">
                    <div className="w-10 h-10 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#888]">Loading history...</p>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl">
                    <FileText size={48} className="mx-auto text-[#333] mb-4" />
                    <p className="text-[#888]">No invoices found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-white/5">
                          <th className="px-4 py-4 text-xs font-bold text-[#888] uppercase tracking-widest">Invoice</th>
                          <th className="px-4 py-4 text-xs font-bold text-[#888] uppercase tracking-widest">Customer</th>
                          <th className="px-4 py-4 text-xs font-bold text-[#888] uppercase tracking-widest">Date</th>
                          <th className="px-4 py-4 text-xs font-bold text-[#888] uppercase tracking-widest">Amount</th>
                          <th className="px-4 py-4 text-xs font-bold text-[#888] uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-4 py-4">
                              <span className="font-mono text-sm text-[#aaa]">{invoice.invoice_number}</span>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-bold text-sm">{invoice.customer_name}</p>
                              <p className="text-[10px] text-[#666]">{invoice.customer_phone}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-[#888]">
                              {new Date(invoice.invoice_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-[#d4af37]">₹{invoice.total_amount.toLocaleString()}</span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => { setSelectedInvoice(invoice); setShowPreview(true); }}
                                  className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                  title="Preview"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(invoice)}
                                  className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                                  title="Download PDF"
                                >
                                  <Download size={16} />
                                </button>
                                <button
                                  onClick={() => handleSendWhatsApp(invoice)}
                                  className="p-2.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                  title="Send WhatsApp"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {showPreview && selectedInvoice && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white text-black rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-10 border-b pb-8">
                      <div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-[#ff1744] mb-1">Shashti Karz</h1>
                        <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">Car Detailing Xpert</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-sm font-black uppercase mb-1">Invoice</h2>
                        <p className="text-xs font-mono text-gray-500">{selectedInvoice.invoice_number}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-10">
                      <div>
                        <h3 className="text-[10px] font-black uppercase text-gray-400 mb-2">Billed To</h3>
                        <p className="text-lg font-bold mb-1">{selectedInvoice.customer_name}</p>
                        <p className="text-xs text-gray-600">{selectedInvoice.customer_phone}</p>
                        {selectedInvoice.vehicle_number && <p className="text-xs font-bold text-[#ff1744] mt-2">{selectedInvoice.vehicle_number}</p>}
                      </div>
                      <div className="text-right">
                        <h3 className="text-[10px] font-black uppercase text-gray-400 mb-2">Payment Info</h3>
                        <p className="text-sm font-bold uppercase">{selectedInvoice.payment_mode}</p>
                        <p className="text-xs text-gray-600">Date: {new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mb-10">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-black text-left">
                            <th className="py-3 text-[10px] font-black uppercase">Service</th>
                            <th className="py-3 text-[10px] font-black uppercase text-center">Qty</th>
                            <th className="py-3 text-[10px] font-black uppercase text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedInvoice.invoice_items?.map((item, index) => (
                            <tr key={index}>
                              <td className="py-4">
                                <p className="font-bold text-sm">{item.service_name}</p>
                                <p className="text-[10px] text-gray-500">{item.description}</p>
                              </td>
                              <td className="py-4 text-center text-sm">{item.quantity}</td>
                              <td className="py-4 text-right font-bold text-sm">₹{item.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end mb-10">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                          <span>Subtotal</span>
                          <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                        </div>
                        {selectedInvoice.discount_amount > 0 && (
                          <div className="flex justify-between text-xs font-bold text-red-500">
                            <span>Discount ({selectedInvoice.discount_percent}%)</span>
                            <span>-₹{selectedInvoice.discount_amount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-bold text-gray-500">
                          <span>GST ({selectedInvoice.tax_percent}%)</span>
                          <span>₹{selectedInvoice.tax_amount.toLocaleString()}</span>
                        </div>
                        <div className="border-t-2 border-black pt-4 mt-2 flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase">Total Amount</span>
                          <span className="text-2xl font-black">₹{selectedInvoice.total_amount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleDownloadPDF(selectedInvoice)} className="flex-1 py-4 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all">Download PDF</button>
                      <button onClick={() => setShowPreview(false)} className="px-8 py-4 rounded-2xl bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Close</button>
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
