"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Calendar, Settings, Bell, LogOut, Car, Clock,
  CheckCircle2, XCircle, AlertCircle, ChevronRight, Edit3,
  Save, Phone, Mail, MapPin, Shield, Sparkles, History,
  CreditCard, Gift, Star, TrendingUp, Award, Crown,
  Copy, Share2, Users, Zap, Eye, Package, Send, MessageCircle,
  Download, FileText, BarChart, Brain, RefreshCw, Plus, X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import type { LoyaltyPoints, LoyaltyTransaction, ServiceTracking, Booking, Worker, Service, UserVehicle, VehicleHealthScore } from "@/lib/types";
import { BrandedLoader } from "@/components/animations/CarLoader";
import dynamic from "next/dynamic";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { LoyaltyMissionMap } from "@/components/LoyaltyMissionMap";

function PayNowButton({ bookingId }: { bookingId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to create checkout session");
        return;
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error("Payment error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
    >
      {isLoading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
          Processing...
        </>
      ) : (
        <>
          <CreditCard size={16} />
          Pay Now
        </>
      )}
    </button>
  );
}

type TabType = "overview" | "bookings" | "tracking" | "loyalty" | "profile" | "settings";

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  address: string;
  notification_email: boolean;
  notification_sms: boolean;
  notification_promo: boolean;
  created_at: string;
}

const SERVICE_STAGES = [
  { id: "received", name: "Car Received", icon: Car },
  { id: "inspection", name: "Inspection", icon: Eye },
  { id: "washing", name: "Washing", icon: Zap },
  { id: "detailing", name: "Detailing", icon: Package },
  { id: "polishing", name: "Polishing", icon: Award },
  { id: "coating", name: "Coating", icon: Crown },
  { id: "drying", name: "Drying", icon: Clock },
  { id: "quality_check", name: "Quality Check", icon: CheckCircle2 },
  { id: "ready", name: "Ready", icon: Gift },
  { id: "delivered", name: "Delivered", icon: Send },
];

const TIER_INFO = {
  bronze: { color: "#CD7F32", icon: Award, benefits: ["5% cashback", "Birthday bonus"] },
  silver: { color: "#C0C0C0", icon: Star, benefits: ["7% cashback", "Priority booking", "Birthday bonus"] },
  gold: { color: "#FFD700", icon: Crown, benefits: ["10% cashback", "Priority booking", "Free upgrades", "Birthday bonus"] },
  platinum: { color: "#E5E4E2", icon: Sparkles, benefits: ["15% cashback", "VIP treatment", "Free upgrades", "Personal manager", "Birthday bonus"] },
};

import { ReviewModal } from "@/components/ReviewModal";
import { RescheduleModal } from "@/components/RescheduleModal";
import { AchievementsDisplay } from "@/components/gamification/AchievementsDisplay";
import { Leaderboard } from "@/components/gamification/Leaderboard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, signOut, isLoading: authLoading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trackingData, setTrackingData] = useState<Record<string, ServiceTracking[]>>({});
  const [loyaltyData, setLoyaltyData] = useState<(LoyaltyPoints & { transactions: LoyaltyTransaction[], nextTier: string | null, pointsToNextTier: number }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [vehicles, setVehicles] = useState<(UserVehicle & { health_score?: VehicleHealthScore })[]>([]);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<"total" | "completed" | "active" | "loyalty" | null>(null);

  const refreshBookings = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/bookings?user_id=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);

      // Fetch existing reviews to know which ones are already rated
      const reviewsRes = await fetch(`/api/reviews?user_id=${user.id}`);
      if (reviewsRes.ok) {
        const reviews = await reviewsRes.json();
        const ratedIds = new Set<string>(reviews.map((r: any) => r.booking_id));
        setReviewedBookingIds(ratedIds);
      }

      for (const booking of (Array.isArray(data) ? data : []).filter((b: Booking) => b.status === "approved" || b.status === "in_progress")) {
        const trackingRes = await fetch(`/api/service-tracking?booking_id=${booking.id}`);
        if (trackingRes.ok) {
          const tracking = await trackingRes.json();
          setTrackingData(prev => ({ ...prev, [booking.id]: tracking }));
        }
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLoyaltyData = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/loyalty?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data);
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    }
  };

  const loadVehicles = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/vehicles?user_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const vehiclesWithHealth = await Promise.all(data.map(async (v: UserVehicle) => {
          try {
            const healthRes = await fetch(`/api/vehicles/${v.id}/health-score`);
            if (healthRes.ok) {
              const healthData = await healthRes.json();
              return { ...v, health_score: healthData };
            }
          } catch (e) {
            console.error("Error fetching health score:", e);
          }
          return v;
        }));
        setVehicles(vehiclesWithHealth);
      }
    } catch (error) {
      console.error("Error loading vehicles:", error);
    }
  };

  const [profileForm, setProfileForm] = useState<ProfileData>({
    id: "",
    email: "",
    full_name: "",
    phone: "",
    avatar_url: "",
    address: "",
    notification_email: true,
    notification_sms: true,
    notification_promo: false,
    created_at: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        id: profile.id || "",
        email: profile.email || user?.email || "",
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
        address: profile.address || "",
        notification_email: profile.notification_email ?? true,
        notification_sms: profile.notification_sms ?? true,
        notification_promo: profile.notification_promo ?? false,
        created_at: profile.created_at || "",
      });
    }
  }, [profile, user]);

  useEffect(() => {
    if (user) {
      refreshBookings();
      loadLoyaltyData();
      loadVehicles();
    }
  }, [user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        refreshBookings();
        loadLoyaltyData();
        loadVehicles();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Real-time Service Tracking
  useRealtimeSubscription({
    table: 'service_tracking',
    onInsert: (newTracking) => {
      setTrackingData(prev => {
        const bookingId = newTracking.booking_id;
        const currentTracking = prev[bookingId] || [];
        return { ...prev, [bookingId]: [...currentTracking, newTracking] };
      });
      toast.custom((t) => (
        <div className="bg-[#111] border border-[#d4af37] text-white p-4 rounded-xl shadow-2xl flex items-center gap-4">
          <div className="p-2 bg-[#d4af37]/20 rounded-full text-[#d4af37]"><Sparkles size={20} /></div>
          <div>
            <p className="font-bold text-sm">Service Update</p>
            <p className="text-xs text-[#888]">Your car has moved to the next stage!</p>
          </div>
        </div>
      ), { duration: 4000 });
    },
    onUpdate: (updatedTracking) => {
      setTrackingData(prev => {
        const bookingId = updatedTracking.booking_id;
        const currentTracking = prev[bookingId] || [];
        return { ...prev, [bookingId]: currentTracking.map(t => t.id === updatedTracking.id ? updatedTracking : t) };
      });
    }
  });

  // Real-time Booking Status
  useRealtimeSubscription({
    table: 'bookings',
    onUpdate: (updatedBooking) => {
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b));
      if (updatedBooking.status === 'completed') {
        toast.success("Service Completed! Your car is ready.");
        refreshBookings(); // Fetch full details to be safe
      }
    }
  });

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          address: profileForm.address,
          notification_email: profileForm.notification_email,
          notification_sms: profileForm.notification_sms,
          notification_promo: profileForm.notification_promo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim() || !user) return;

    try {
      const response = await fetch("/api/loyalty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_code: referralCode, user_id: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Invalid referral code");
        return;
      }

      toast.success(`Referral applied! You earned ${data.bonus} bonus points!`);
      loadLoyaltyData();
      setReferralCode("");
    } catch (error) {
      toast.error("Failed to apply referral");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) throw new Error("Failed to cancel booking");

      toast.success("Booking cancelled successfully");
      refreshBookings();
    } catch (error) {
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  const copyReferralCode = () => {
    if (loyaltyData?.referral_code) {
      navigator.clipboard.writeText(loyaltyData.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const shareReferral = () => {
    if (loyaltyData?.referral_code) {
      const message = `Get amazing car detailing at Shashti Karz! Use my referral code ${loyaltyData.referral_code} for bonus rewards. Book now!`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  const downloadInvoice = async (booking: Booking) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("SHASHTI KARZ - INVOICE", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Booking ID: ${booking.booking_id}`, 20, 40);
    doc.text(`Customer: ${booking.customer_name}`, 20, 50);
    doc.text(`Service: ${booking.service?.name || booking.service_id}`, 20, 60);
    doc.text(`Date: ${booking.date}`, 20, 70);
    doc.text(`Amount Paid: Rs. ${booking.price}`, 20, 80);
    doc.text("Thank you for choosing Shashti Karz!", 105, 100, { align: "center" });
    doc.save(`Invoice_${booking.booking_id}.pdf`);
    toast.success("Invoice downloaded!");
  };

  const downloadBookingsExcel = async () => {
    const XLSX = await import("xlsx");
    const data = bookings.map(b => ({
      ID: b.booking_id,
      Service: b.service?.name || b.service_id,
      Car: b.car_model,
      Date: b.date,
      Price: b.price,
      Status: b.status,
      Payment: b.payment_status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, "My_Bookings.xlsx");
    toast.success("Bookings summary downloaded!");
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": case "approved": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "completed": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "pending": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "cancelled": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "in_progress": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": case "approved": return <CheckCircle2 size={14} />;
      case "completed": return <Award size={14} />;
      case "pending": return <Clock size={14} />;
      case "cancelled": return <XCircle size={14} />;
      case "in_progress": return <Sparkles size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const activeBookings = bookings.filter(b => b.status === "approved" || b.status === "in_progress");

  const stats = {
    totalBookings: bookings.length,
    completedBookings: bookings.filter(b => b.status === "completed").length,
    pendingBookings: bookings.filter(b => b.status === "pending" || b.status === "approved").length,
    totalSpent: bookings.filter(b => b.status === "completed").reduce((acc, b) => acc + (b.price || 0), 0),
  };

  const displayName = profileForm.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";

  if (authLoading) {
    return <BrandedLoader fullPage />;
  }

  if (!user) return null;

  const tierInfo = loyaltyData ? TIER_INFO[loyaltyData.tier as keyof typeof TIER_INFO] : TIER_INFO.bronze;
  const TierIcon = tierInfo.icon;

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: TrendingUp },
    { id: "bookings" as TabType, label: "My Bookings", icon: Calendar },
    { id: "tracking" as TabType, label: "Live Tracking", icon: Eye, badge: activeBookings.length },
    { id: "loyalty" as TabType, label: "Missions", icon: Star, badge: loyaltyData?.points },
    { id: "profile" as TabType, label: "Profile", icon: User },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center text-3xl sm:text-4xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  {loyaltyData && (
                    <div
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#111]"
                      style={{ backgroundColor: tierInfo.color }}
                    >
                      <TierIcon size={18} className="text-[#0a0a0a]" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold">{displayName}</h1>
                    {loyaltyData && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 text-[#0a0a0a]"
                        style={{ backgroundColor: tierInfo.color }}
                      >
                        <TierIcon size={12} />
                        {loyaltyData.tier.charAt(0).toUpperCase() + loyaltyData.tier.slice(1)} Member
                      </span>
                    )}
                  </div>
                  <p className="text-[#888] mb-4">{profileForm.email}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-[#666]">
                    <span className="flex items-center gap-2">
                      <Calendar size={16} />
                      Member since {new Date(profileForm.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    {loyaltyData && (
                      <span className="flex items-center gap-2 text-[#d4af37]">
                        <Star size={16} className="fill-current" />
                        {loyaltyData.points.toLocaleString()} points
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/booking"
                    className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                  >
                    <Calendar size={18} />
                    Book Service
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-[#888] hover:text-red-500 transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                  ? "bg-gradient-to-r from-[#ff1744] to-[#ff4569] text-white"
                  : "bg-white/5 text-[#888] hover:bg-white/10 hover:text-white"
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? "bg-white/20" : "bg-[#ff1744]/20 text-[#ff1744]"
                    }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <BarChart size={20} className="text-[#ff1744]" />
                    Account Stats
                  </h2>
                  <button
                    onClick={downloadBookingsExcel}
                    className="text-sm text-[#ff1744] hover:underline flex items-center gap-1"
                  >
                    <Download size={16} />
                    Export Data
                  </button>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">

                  {[
                    { id: "total" as const, label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "from-[#ff1744] to-[#ff4569]" },
                    { id: "completed" as const, label: "Completed", value: stats.completedBookings, icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
                    { id: "active" as const, label: "Active", value: activeBookings.length, icon: Sparkles, color: "from-purple-500 to-pink-500" },
                    { id: "loyalty" as const, label: "Loyalty Points", value: loyaltyData?.points || 0, icon: Star, color: "from-[#d4af37] to-[#ffd700]" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => { setSelectedMetric(stat.id); setShowMetricModal(true); }}
                      className="glass-card rounded-2xl p-6 cursor-pointer border border-white/5 hover:border-white/20 transition-all flex flex-col"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg shadow-black/20`}>
                        <stat.icon size={24} className="text-white" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight">{stat.value.toLocaleString()}</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-[#666]">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {activeBookings.length > 0 && (
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Eye size={20} className="text-purple-500" />
                        Live Service Tracking
                      </h2>
                      <button
                        onClick={() => setActiveTab("tracking")}
                        className="text-sm text-[#ff1744] hover:underline flex items-center gap-1"
                      >
                        View All <ChevronRight size={16} />
                      </button>
                    </div>

                    {activeBookings.slice(0, 2).map((booking) => {
                      const tracking = trackingData[booking.id] || [];
                      const completedStages = tracking.filter(t => t.status === "completed").length;
                      const currentStage = tracking.find(t => t.status === "in_progress");
                      const progress = tracking.length > 0 ? (completedStages / tracking.length) * 100 : 0;

                      return (
                        <div key={booking.id} className="mb-4 p-4 rounded-xl bg-white/5">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                              <Car size={24} className="text-purple-500" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{booking.service?.name || booking.service_id}</h3>
                              <p className="text-sm text-[#888]">{booking.car_model}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-purple-500">{Math.round(progress)}%</span>
                              <p className="text-xs text-[#888]">
                                {currentStage ? SERVICE_STAGES.find(s => s.id === currentStage.stage)?.name : "Processing"}
                              </p>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-[#ff1744]"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Digital Garage / AI Diagnostics section */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Brain size={20} className="text-[#d4af37]" />
                      Digital Garage & AI Vision
                    </h2>
                    <Link
                      href="/ai-diagnostic"
                      className="text-sm text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      New Scan <ChevronRight size={16} />
                    </Link>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {vehicles.length === 0 ? (
                      <div className="md:col-span-2 text-center py-8 text-[#888] bg-white/5 rounded-xl border border-dashed border-white/10">
                        <Car size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="mb-4">No vehicles added yet. Start a scan or add one manually.</p>
                        <Link
                          href="/ai-diagnostic"
                          className="btn-premium px-6 py-2 rounded-lg text-sm inline-flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Add Vehicle
                        </Link>
                      </div>
                    ) : (
                      vehicles.map((vehicle) => (
                        <Link
                          key={vehicle.id}
                          href={`/dashboard/vehicles/${vehicle.id}`}
                          className="block p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#d4af37]/30 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                              <Car size={20} className="text-[#d4af37]" />
                            </div>
                            {vehicle.health_score && (
                              <div className="text-right">
                                <span className={`text-2xl font-black ${vehicle.health_score.overall_score >= 80 ? "text-green-500" :
                                  vehicle.health_score.overall_score >= 60 ? "text-yellow-500" :
                                    vehicle.health_score.overall_score >= 40 ? "text-orange-500" : "text-red-500"
                                  }`}>{Math.round(vehicle.health_score.overall_score)}</span>
                                <p className="text-[10px] text-[#666] font-bold uppercase tracking-widest">Health Score</p>
                              </div>
                            )}
                          </div>
                          <h4 className="font-bold mb-1">{vehicle.brand || "Unknown"} {vehicle.model || "Vehicle"}</h4>
                          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#888]">
                            {vehicle.number_plate && <span>{vehicle.number_plate}</span>}
                            {vehicle.health_score ? (
                              <span className={
                                vehicle.health_score.overall_score >= 80 ? "text-green-500" :
                                  vehicle.health_score.overall_score >= 60 ? "text-yellow-500" :
                                    vehicle.health_score.overall_score >= 40 ? "text-orange-500" : "text-red-500"
                              }>
                                {vehicle.health_score.overall_score >= 80 ? "Excellent" :
                                  vehicle.health_score.overall_score >= 60 ? "Good" :
                                    vehicle.health_score.overall_score >= 40 ? "Fair" : "Needs Attention"}
                              </span>
                            ) : (
                              <span>No Health Data</span>
                            )}
                          </div>
                          {vehicle.health_score && vehicle.health_score.recommendations && vehicle.health_score.recommendations.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                              <p className="text-[10px] text-[#ff1744] font-black uppercase tracking-widest mb-1">
                                {vehicle.health_score.recommendations.length} Issues Detected
                              </p>
                              <span className="text-[10px] text-white underline decoration-[#ff1744]">
                                View Health Report
                              </span>
                            </div>
                          )}
                        </Link>
                      ))
                    )}

                    {vehicles.length > 0 && (
                      <Link href="/ai-diagnostic" className="md:col-span-2 p-6 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/[0.02] transition-colors group">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#d4af37]/10 transition-colors">
                          <Plus size={24} className="text-[#888] group-hover:text-[#d4af37]" />
                        </div>
                        <p className="text-sm font-bold text-[#888] group-hover:text-white uppercase tracking-widest">Add Another Vehicle for AI Scan</p>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1744]/10 rounded-full blur-3xl" />
                  <div className="flex items-center gap-3 mb-6 relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 flex items-center justify-center">
                      <Brain size={20} className="text-[#ff1744]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">AI Next-Step Suggestions</h3>
                      <p className="text-xs text-[#888]">Personalized for your {bookings[0]?.car_model || "vehicle"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                    {[
                      { title: "Recommended Service", desc: "Based on your last wash, a Ceramic Pro coating would protect your paint for 5+ years.", icon: Sparkles, color: "#d4af37" },
                      { title: "Loyalty Boost", desc: "You're only 2 bookings away from Gold tier! Book an interior detail to get there faster.", icon: TrendingUp, color: "#ff1744" }
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#ff1744]/30 transition-colors cursor-pointer group">
                        <item.icon size={18} style={{ color: item.color }} className="mb-2" />
                        <h4 className="text-sm font-medium mb-1 group-hover:text-white transition-colors">{item.title}</h4>
                        <p className="text-xs text-[#888] line-clamp-2">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {loyaltyData && (
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Gift size={20} className="text-[#d4af37]" />
                        Your Rewards
                      </h2>
                      <button
                        onClick={() => setActiveTab("loyalty")}
                        className="text-sm text-[#ff1744] hover:underline flex items-center gap-1"
                      >
                        View All <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl" style={{ backgroundColor: `${tierInfo.color}20` }}>
                        <TierIcon size={24} style={{ color: tierInfo.color }} className="mb-2" />
                        <h4 className="font-semibold" style={{ color: tierInfo.color }}>
                          {loyaltyData.tier.charAt(0).toUpperCase() + loyaltyData.tier.slice(1)} Tier
                        </h4>
                        <p className="text-xs text-[#888] mt-1">{tierInfo.benefits[0]}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5">
                        <Star size={24} className="text-[#d4af37] mb-2" />
                        <h4 className="font-semibold">{loyaltyData.points.toLocaleString()} Points</h4>
                        <p className="text-xs text-[#888] mt-1">Available to redeem</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5">
                        <Users size={24} className="text-green-500 mb-2" />
                        <h4 className="font-semibold">Refer & Earn</h4>
                        <p className="text-xs text-[#888] mt-1">200 points per referral</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                  <AchievementsDisplay userId={user.id} />
                  <Leaderboard />
                </div>
              </motion.div>
            )}

            {activeTab === "tracking" && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Eye size={20} className="text-purple-500" />
                      Live Service Tracking
                    </h2>
                    {activeBookings.length > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-500 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        {activeBookings.length} Active
                      </span>
                    )}
                  </div>

                  {activeBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Car size={32} className="text-[#888]" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Active Services</h3>
                      <p className="text-[#888] mb-6">Book a service to see live tracking here</p>
                      <Link
                        href="/booking"
                        className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2"
                      >
                        Book Now
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {activeBookings.map((booking) => {
                        const tracking = trackingData[booking.id] || [];
                        const completedStages = tracking.filter(t => t.status === "completed").length;
                        const currentStage = tracking.find(t => t.status === "in_progress");
                        const progress = tracking.length > 0 ? (completedStages / tracking.length) * 100 : 0;

                        return (
                          <div key={booking.id} className="p-6 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                  <Car size={32} className="text-purple-500" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold">{booking.service?.name || booking.service_id}</h3>
                                  <p className="text-sm text-[#888]">{booking.car_model} • {booking.booking_id}</p>
                                  <div className="flex flex-wrap gap-3 mt-2">
                                    <p className="text-xs text-[#666]">
                                      Booked for {booking.date} at {booking.time}
                                    </p>
                                    {booking.worker_visibility_approved && booking.worker && (
                                      <div className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 border border-white/5">
                                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center text-[8px] text-white">
                                          {booking.worker.name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] text-[#aaa]">Assigned: <span className="text-white">{booking.worker.name}</span> ({booking.worker.role})</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-purple-500">{Math.round(progress)}%</span>
                                <p className="text-sm text-[#888]">Complete</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-[#888]">
                                  Current: {currentStage ? SERVICE_STAGES.find(s => s.id === currentStage.stage)?.name : "Processing"}
                                </span>
                                <span className="text-sm font-medium">{completedStages}/{tracking.length} stages</span>
                              </div>
                              <div className="h-3 rounded-full bg-white/10">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-[#ff1744] to-[#d4af37]"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                              {SERVICE_STAGES.map((stage) => {
                                const trackingStage = tracking.find(t => t.stage === stage.id);
                                const stageStatus = trackingStage?.status || "pending";
                                const StageIcon = stage.icon;

                                return (
                                  <div
                                    key={stage.id}
                                    className={`p-2 rounded-lg text-center ${stageStatus === "completed"
                                      ? "bg-green-500/20"
                                      : stageStatus === "in_progress"
                                        ? "bg-purple-500/20 animate-pulse"
                                        : "bg-white/5"
                                      }`}
                                    title={stage.name}
                                  >
                                    <StageIcon
                                      size={16}
                                      className={`mx-auto ${stageStatus === "completed"
                                        ? "text-green-500"
                                        : stageStatus === "in_progress"
                                          ? "text-purple-500"
                                          : "text-[#666]"
                                        }`}
                                    />
                                    <span className="text-[8px] text-[#888] block mt-1 truncate">{stage.name.split(' ')[0]}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "loyalty" && (
              <motion.div
                key="loyalty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {loyaltyData && (
                  <>
                    <div className="mb-12">
                      <LoyaltyMissionMap currentPoints={loyaltyData.points} />
                    </div>

                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Gift size={18} className="text-[#d4af37]" />
                        Your Benefits
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {tierInfo.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            <CheckCircle2 size={16} style={{ color: tierInfo.color }} />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Users size={18} className="text-green-500" />
                        Refer & Earn
                      </h3>
                      <p className="text-[#888] mb-4">Share your referral code and earn 200 points for each friend who books!</p>

                      <div className="flex gap-3 mb-6">
                        <div className="flex-1 p-4 rounded-xl bg-white/5 font-mono text-lg text-center">
                          {loyaltyData.referral_code}
                        </div>
                        <button
                          onClick={copyReferralCode}
                          className="px-4 rounded-xl bg-white/5 hover:bg-white/10"
                        >
                          <Copy size={20} />
                        </button>
                        <button
                          onClick={shareReferral}
                          className="px-4 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20"
                        >
                          <Share2 size={20} />
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-white/5">
                        <h4 className="text-sm font-medium mb-3">Have a referral code?</h4>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="Enter code"
                            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none"
                          />
                          <button
                            onClick={handleApplyReferral}
                            className="px-6 py-2 rounded-lg bg-[#ff1744] text-white font-medium"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>

                    {loyaltyData.transactions.length > 0 && (
                      <div className="glass-card rounded-[2rem] p-8 border-white/10 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-8 -mr-8 -mt-8 bg-[#ff1744]/5 blur-3xl rounded-full" />

                        <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-white italic uppercase tracking-tight">
                          <div className="w-10 h-10 rounded-xl bg-[#ff1744]/20 flex items-center justify-center">
                            <History size={20} className="text-[#ff1744]" />
                          </div>
                          Points Activity
                        </h3>

                        <div className="space-y-4">
                          {loyaltyData.transactions.map((transaction, idx) => (
                            <motion.div
                              key={transaction.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group/item flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#ff1744]/30 hover:bg-white/10 transition-all duration-300"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover/item:scale-110 ${transaction.type === "earned" ? "bg-green-500/10 text-green-500" :
                                  transaction.type === "redeemed" ? "bg-red-500/10 text-red-500" :
                                    transaction.type === "referral" ? "bg-blue-500/10 text-blue-500" :
                                      "bg-[#d4af37]/10 text-[#d4af37]"
                                  }`}>
                                  {transaction.type === "earned" ? <TrendingUp size={20} /> :
                                    transaction.type === "redeemed" ? <CreditCard size={20} /> :
                                      transaction.type === "referral" ? <Users size={20} /> :
                                        <Gift size={20} />}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-white group-hover/item:text-[#ff1744] transition-colors">
                                    {transaction.description}
                                  </p>
                                  <p className="text-[10px] text-[#666] font-bold uppercase tracking-widest mt-1 italic">
                                    {new Date(transaction.created_at).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-lg font-black tracking-tighter ${transaction.points > 0 ? "text-green-500" : "text-red-500"
                                  }`}>
                                  {transaction.points > 0 ? "+" : ""}{transaction.points}
                                </span>
                                <div className="text-[10px] text-[#555] font-black uppercase tracking-tighter">
                                  Points
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid lg:grid-cols-2 gap-6">
                      <AchievementsDisplay userId={user.id} />
                      <Leaderboard />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "bookings" && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar size={20} className="text-[#ff1744]" />
                      All Bookings
                    </h2>
                    <Link
                      href="/booking"
                      className="btn-premium px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2"
                    >
                      <Calendar size={16} />
                      New Booking
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Calendar size={32} className="text-[#888]" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                      <p className="text-[#888] mb-6">Your booking history will appear here</p>
                      <Link
                        href="/booking"
                        className="btn-premium px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2"
                      >
                        Book Your First Service
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border border-white/10 rounded-xl p-5 hover:border-[#ff1744]/30 transition-colors"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                              {booking.service?.image ? (
                                <Image
                                  src={booking.service.image}
                                  alt={booking.service.name || "Service"}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                                  <Car size={32} className="text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold">{booking.service?.name || "Service"}</h3>
                                  <p className="text-sm text-[#888]">Booking ID: {booking.booking_id}</p>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                  {getStatusIcon(booking.status)}
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                                </span>
                              </div>

                              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-[#888]">
                                  <Car size={16} className="text-[#ff1744]" />
                                  <span>{booking.car_model}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#888]">
                                  <Calendar size={16} className="text-[#ff1744]" />
                                  <span>{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#888]">
                                  <Clock size={16} className="text-[#ff1744]" />
                                  <span>{booking.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CreditCard size={16} className="text-[#d4af37]" />
                                  <span className="font-semibold text-[#d4af37]">₹{booking.price?.toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mt-4">
                                {(booking.status === "approved" || booking.status === "in_progress") && (
                                  <button
                                    onClick={() => setActiveTab("tracking")}
                                    className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-500 text-sm flex items-center gap-2 hover:bg-purple-500/20"
                                  >
                                    <Eye size={16} />
                                    Track
                                  </button>
                                )}

                                {(booking.status === "pending" || booking.status === "approved") && (
                                  <>
                                    <button
                                      onClick={() => setSelectedBookingForReschedule(booking)}
                                      className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm flex items-center gap-2 hover:bg-blue-500/20"
                                    >
                                      <RefreshCw size={16} />
                                      Reschedule
                                    </button>
                                    <button
                                      onClick={() => handleCancelBooking(booking.id)}
                                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm flex items-center gap-2 hover:bg-red-500/20"
                                    >
                                      <XCircle size={16} />
                                      Cancel
                                    </button>
                                  </>
                                )}

                                {booking.status === "completed" && !reviewedBookingIds.has(booking.id) && (
                                  <button
                                    onClick={() => setSelectedBookingForReview(booking)}
                                    className="px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-500 text-sm flex items-center gap-2 hover:bg-yellow-500/20"
                                  >
                                    <Star size={16} />
                                    Rate
                                  </button>
                                )}

                                {booking.payment_status !== "paid" && booking.status !== "cancelled" && (
                                  <PayNowButton bookingId={booking.id} />
                                )}

                                {booking.payment_status === "paid" && booking.invoice_url && (
                                  <a
                                    href={booking.invoice_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-sm flex items-center gap-2 hover:bg-green-500/20"
                                  >
                                    <Download size={16} />
                                    Invoice
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <User size={20} className="text-[#ff1744]" />
                      Personal Information
                    </h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                      >
                        <Edit3 size={16} />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff1744] hover:bg-[#ff1744]/80 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-[#888] mb-2">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                          <User size={18} className="text-[#888]" />
                          <span>{profileForm.full_name || "Not set"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-[#888] mb-2">Email Address</label>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                        <Mail size={18} className="text-[#888]" />
                        <span>{profileForm.email}</span>
                        <Shield size={14} className="text-green-500 ml-auto" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#888] mb-2">Phone Number</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                          <Phone size={18} className="text-[#888]" />
                          <span>{profileForm.phone || "Not set"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-[#888] mb-2">Address</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ff1744] focus:outline-none transition-colors"
                          placeholder="Enter your address"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                          <MapPin size={18} className="text-[#888]" />
                          <span>{profileForm.address || "Not set"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Bell size={20} className="text-[#ff1744]" />
                    Notification Preferences
                  </h2>

                  <div className="space-y-4">
                    {[
                      { key: "notification_email" as const, label: "Email Notifications", desc: "Receive booking confirmations and updates via email", icon: Mail },
                      { key: "notification_sms" as const, label: "SMS Notifications", desc: "Get instant SMS alerts for your bookings", icon: Phone },
                      { key: "notification_promo" as const, label: "Promotional Offers", desc: "Stay updated with exclusive deals and discounts", icon: Gift },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                            <item.icon size={20} className="text-[#888]" />
                          </div>
                          <div>
                            <h4 className="font-medium">{item.label}</h4>
                            <p className="text-sm text-[#888]">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const newValue = !profileForm[item.key];
                            setProfileForm({ ...profileForm, [item.key]: newValue });

                            const { error } = await supabase
                              .from("profiles")
                              .update({ [item.key]: newValue, updated_at: new Date().toISOString() })
                              .eq("id", user.id);

                            if (error) {
                              toast.error("Failed to update setting");
                              setProfileForm({ ...profileForm, [item.key]: !newValue });
                            } else {
                              toast.success("Setting updated");
                            }
                          }}
                          className={`relative w-14 h-8 rounded-full transition-colors ${profileForm[item.key] ? "bg-[#ff1744]" : "bg-white/20"
                            }`}
                        >
                          <span
                            className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${profileForm[item.key] ? "translate-x-7" : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ReviewModal
          booking={selectedBookingForReview}
          isOpen={!!selectedBookingForReview}
          onClose={() => setSelectedBookingForReview(null)}
          onSuccess={refreshBookings}
        />

        <RescheduleModal
          booking={selectedBookingForReschedule}
          isOpen={!!selectedBookingForReschedule}
          onClose={() => setSelectedBookingForReschedule(null)}
          onSuccess={refreshBookings}
        />

        <AnimatePresence>
          {showMetricModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowMetricModal(false)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-6 lg:p-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff1744]/5 rounded-full blur-[100px] -z-1" />

                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tighter">
                      {selectedMetric === "total" && "Booking History"}
                      {selectedMetric === "completed" && "Completed Journeys"}
                      {selectedMetric === "active" && "Current Activations"}
                      {selectedMetric === "loyalty" && "Loyalty Dynamics"}
                    </h2>
                    <p className="text-[10px] font-black text-[#555] uppercase tracking-widest mt-1">Detailed Analysis & Insights</p>
                  </div>
                  <button onClick={() => setShowMetricModal(false)} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {(selectedMetric === "total" || selectedMetric === "completed" || selectedMetric === "active") && (
                    <div className="space-y-3">
                      {(selectedMetric === "total" ? bookings :
                        selectedMetric === "completed" ? bookings.filter(b => b.status === "completed") :
                          activeBookings).length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                          <p className="text-[#888] font-bold uppercase tracking-widest text-[10px]">No data available in this segment</p>
                        </div>
                      ) : (
                        (selectedMetric === "total" ? bookings :
                          selectedMetric === "completed" ? bookings.filter(b => b.status === "completed") :
                            activeBookings).map((booking) => (
                              <div key={booking.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center gap-5 hover:border-[#ff1744]/30 transition-all group">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                                  {booking.service?.image ? (
                                    <img src={booking.service.image} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
                                      <Car size={32} className="text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-black text-lg truncate group-hover:text-[#ff1744] transition-colors">{booking.service?.name || "Premium Care"}</h4>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${getStatusColor(booking.status)}`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-[#666] uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#ff1744]" /> {new Date(booking.date).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5"><Car size={12} className="text-[#ff1744]" /> {booking.car_model}</span>
                                    <span className="text-[#d4af37]">₹{booking.price?.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                      )}
                    </div>
                  )}

                  {selectedMetric === "loyalty" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30">
                          <h5 className="text-[10px] font-black text-[#d4af37] uppercase tracking-widest mb-1">Current Balance</h5>
                          <div className="text-4xl font-black tracking-tighter text-white">{loyaltyData?.points.toLocaleString()} <span className="text-sm font-bold text-[#666]">pts</span></div>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10">
                          <h5 className="text-[10px] font-black text-[#555] uppercase tracking-widest mb-1">Membership Rank</h5>
                          <div className="text-2xl font-black tracking-tighter text-[#d4af37] uppercase">{loyaltyData?.tier}</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-[#444] uppercase tracking-widest px-1">Transaction Ledger</h5>
                        <div className="space-y-2">
                          {loyaltyData?.transactions && loyaltyData.transactions.length > 0 ? (
                            loyaltyData.transactions.map((tx, idx) => (
                              <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'referral' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'referral' ? <TrendingUp size={18} /> : <Gift size={18} />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-tight">{tx.description || (tx.type === 'earned' ? 'Service Reward' : 'Points Redeemed')}</p>
                                    <p className="text-[9px] font-bold text-[#555] uppercase tracking-widest">{new Date(tx.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className={`text-lg font-black tracking-tighter ${tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'referral' ? 'text-green-500' : 'text-red-500'}`}>
                                  {tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'referral' ? '+' : '-'}{tx.points.toLocaleString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-[10px] font-black text-[#444] uppercase tracking-widest">No recent point dynamics</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <button
                    onClick={() => setShowMetricModal(false)}
                    className="w-full py-4 rounded-2xl bg-white/5 text-[#666] font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all border border-white/5"
                  >
                    Close Perspective
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </main >
  );
}
