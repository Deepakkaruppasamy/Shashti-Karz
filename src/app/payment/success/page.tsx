"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Download, ArrowRight, CreditCard, Calendar, Car } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

interface SessionData {
  status: string;
  payment_status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  invoice_url: string | null;
  metadata: {
    booking_id: string;
    booking_display_id: string;
    service_name: string;
    customer_name: string;
    car_model: string;
  };
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found");
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/checkout?session_id=${sessionId}`);
        if (!res.ok) throw new Error("Failed to fetch session");
        const data = await res.json();
        setSessionData(data);
      } catch (err) {
        setError("Failed to verify payment");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-[#ff1744] border-t-transparent rounded-full"
        />
        <p className="text-[#888]">Verifying payment...</p>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <CreditCard size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Payment Verification Failed</h2>
        <p className="text-[#888] mb-8">{error || "Unable to verify your payment"}</p>
        <Link
          href="/dashboard"
          className="btn-premium px-6 py-3 rounded-xl font-semibold"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(34, 197, 94, 0.4)",
              "0 0 0 20px rgba(34, 197, 94, 0)",
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle size={48} className="text-white" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold font-display mb-4"
      >
        Payment Successful!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-[#888] mb-8"
      >
        Your booking has been confirmed and paid. A confirmation email has been sent to{" "}
        <span className="text-white">{sessionData.customer_email}</span>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6 text-left mb-8"
      >
        <h3 className="font-semibold mb-4 text-[#d4af37] flex items-center gap-2">
          <CreditCard size={18} />
          Payment Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#888]">Booking ID:</span>
            <span className="font-mono">{sessionData.metadata.booking_display_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">Service:</span>
            <span>{sessionData.metadata.service_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">Vehicle:</span>
            <span>{sessionData.metadata.car_model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">Customer:</span>
            <span>{sessionData.metadata.customer_name}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
            <span className="text-[#888]">Amount Paid:</span>
            <span className="text-xl font-bold text-green-500">
              ₹{((sessionData.amount_total || 0) / 100).toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        {sessionData.invoice_url && (
          <a
            href={sessionData.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download Invoice
          </a>
        )}
        <Link
          href="/dashboard"
          className="btn-premium px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          Go to Dashboard
          <ArrowRight size={18} />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-8 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ x: [0, 100, 200] }}
          transition={{ duration: 2, delay: 1 }}
          className="opacity-30"
        >
          <Car size={40} className="text-green-500" />
        </motion.div>
        <p className="text-xs text-[#666]">Your premium car care journey begins!</p>
      </motion.div>
    </motion.div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <section className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <PaymentSuccessContent />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}
