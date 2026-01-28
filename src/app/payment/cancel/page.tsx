"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Link from "next/link";

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  const handleRetry = async () => {
    if (!bookingId) return;
    
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error("Failed to retry payment:", error);
    }
  };

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
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-8">
          <XCircle size={48} className="text-white" />
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold font-display mb-4"
      >
        Payment Cancelled
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-[#888] mb-8"
      >
        Your payment was cancelled. Don&apos;t worry - your booking is still saved.
        You can complete the payment anytime from your dashboard.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6 mb-8"
      >
        <h3 className="font-semibold mb-4">What happens next?</h3>
        <ul className="text-left space-y-3 text-sm text-[#888]">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#ff1744]/20 text-[#ff1744] flex items-center justify-center text-xs shrink-0">1</span>
            <span>Your booking is saved with pending payment status</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#ff1744]/20 text-[#ff1744] flex items-center justify-center text-xs shrink-0">2</span>
            <span>Complete payment from your dashboard to confirm the appointment</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#ff1744]/20 text-[#ff1744] flex items-center justify-center text-xs shrink-0">3</span>
            <span>Once paid, you&apos;ll receive a confirmation email with all details</span>
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        {bookingId && (
          <button
            onClick={handleRetry}
            className="btn-premium px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        )}
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          Go to Dashboard
          <ArrowRight size={18} />
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function PaymentCancelPage() {
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
            <PaymentCancelContent />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}
