"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  FileText, Download, Eye, ArrowLeft, Search, Calendar,
  CheckCircle, Clock, Car, Receipt
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import Link from "next/link";

interface InvoiceItem {
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
  vehicle_number: string;
  invoice_date: string;
  payment_mode: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  invoice_items: InvoiceItem[];
}

const COMPANY_INFO = {
  name: "Shashti Karz",
  tagline: "Car Detailing Xpert",
  address: "123 Main Road, Tirupur, Tamil Nadu 641601",
  phone: "+91 98765 43210",
  email: "info@shashtikarz.com",
  gst: "33AABCU9603R1ZM",
};

export default function CustomerInvoicesPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile?.id) {
      loadInvoices();
    }
  }, [profile?.id]);

  async function loadInvoices() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices?customer_id=${profile?.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setIsLoading(false);
    }
  }

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

    invoice.invoice_items?.forEach((item, index) => {
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
    doc.text("Offline Payment - Verified by Admin", pageWidth / 2, yPos, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your business!", pageWidth / 2, yPos + 20, { align: "center" });

    return doc;
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    const doc = generatePDF(invoice);
    doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    toast.success("Invoice downloaded!");
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-display text-white">My Invoices</h1>
              <p className="text-sm text-[#888]">View and download your billing history</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice number or vehicle..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-12 text-center"
            >
              <Receipt size={48} className="mx-auto text-[#888] mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Invoices Yet</h3>
              <p className="text-[#888]">Your billing history will appear here after your services</p>
              <Link
                href="/booking"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-medium"
              >
                Book a Service
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 flex items-center justify-center">
                        <FileText size={24} className="text-[#ff1744]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{invoice.invoice_number}</h3>
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-500">
                            Paid - {invoice.payment_mode.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-[#888] mt-1">
                          {new Date(invoice.invoice_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </p>
                        {invoice.vehicle_number && (
                          <p className="text-xs text-[#666] flex items-center gap-1 mt-1">
                            <Car size={12} />
                            {invoice.vehicle_number}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gradient">₹{invoice.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-[#888]">{invoice.invoice_items?.length || 0} item(s)</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedInvoice(selectedInvoice?.id === invoice.id ? null : invoice)}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="p-2 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedInvoice?.id === invoice.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-white/10"
                    >
                      <h4 className="text-sm font-medium text-white mb-4">Service Details</h4>
                      <div className="space-y-2">
                        {invoice.invoice_items?.map((item, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div>
                              <p className="text-sm text-white">{item.service_name}</p>
                              {item.description && <p className="text-xs text-[#888]">{item.description}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-white">₹{item.amount.toLocaleString()}</p>
                              <p className="text-xs text-[#888]">{item.quantity} x ₹{item.rate.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#888]">Subtotal</span>
                          <span className="text-white">₹{invoice.subtotal.toLocaleString()}</span>
                        </div>
                        {invoice.discount_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#888]">Discount ({invoice.discount_percent}%)</span>
                            <span className="text-red-500">-₹{invoice.discount_amount.toLocaleString()}</span>
                          </div>
                        )}
                        {invoice.tax_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#888]">GST ({invoice.tax_percent}%)</span>
                            <span className="text-white">₹{invoice.tax_amount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                          <span className="text-white">Total</span>
                          <span className="text-gradient">₹{invoice.total_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          <span className="text-sm text-green-500">Offline Payment - Verified by Admin</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
