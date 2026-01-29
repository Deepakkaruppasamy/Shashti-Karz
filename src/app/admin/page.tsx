"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Package, Settings, LogOut, Bell, Search,
  DollarSign, Car, Clock, CheckCircle, XCircle, Gift, BarChart3,
  Plus, Trash2, Filter, Play, Eye, MessageCircle,
  TrendingUp, TrendingDown, Award, Crown, Zap, Send, RefreshCw,
  Brain, Sparkles, AlertTriangle, ArrowUp, ArrowDown, Target,
  PieChart, Activity, Lightbulb, ChevronRight, X, FileText, Download, CreditCard, Receipt, ArrowUpRight,
  Menu, ChevronDown, ImageIcon, Edit2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import type { Booking, Service, Profile, ServiceTracking, Worker, GalleryItem } from "@/lib/types";
import type { AIInsight } from "@/lib/shashti-ai";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase/client";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-500 border-green-500/30",
  in_progress: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  completed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-500 border-red-500/30",
};

const SERVICE_STAGES = [
  { id: "received", name: "Car Received", icon: Car },
  { id: "inspection", name: "Inspection", icon: Eye },
  { id: "washing", name: "Washing", icon: Zap },
  { id: "detailing", name: "Detailing", icon: Package },
  { id: "polishing", name: "Polishing", icon: Award },
  { id: "coating", name: "Coating", icon: Crown },
  { id: "drying", name: "Drying", icon: Clock },
  { id: "quality_check", name: "Quality Check", icon: CheckCircle },
  { id: "ready", name: "Ready", icon: Gift },
  { id: "delivered", name: "Delivered", icon: Send },
];

interface AnalyticsData {
  totalRevenue: number;
  prevRevenue: number;
  revenueChange: number;
  revenueForecast: number;
  lowStockItems: any[];
  activeAlerts: any[];
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  inProgressBookings: number;
  cancelledBookings: number;
  completionRate: number;
  cancellationRate: number;
  avgOrderValue: number;
  topService: { name: string; count: number } | null;
  lowPerformingService: { name: string; count: number } | null;
  servicePopularity: { name: string; count: number; revenue: number }[];
  workerPerformance: { name: string; bookings: number; revenue: number }[];
  funnel: { pending: number; approved: number; in_progress: number; completed: number; cancelled: number };
  peakDay: string;
  peakHours: string;
  revenueByDay: { date: string; value: number }[];
  bookingsByDay: { date: string; value: number }[];
  newCustomers: number;
  totalCustomers: number;
  insights: AIInsight[];
  anomalies: AIInsight[];
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [searchQuery, setSearchQuery] = useState("");

  const [onlineUsers, setOnlineUsers] = useState(0);
  const [pulseRevenue, setPulseRevenue] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [trackingData, setTrackingData] = useState<Record<string, ServiceTracking[]>>({});
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("today");
  const [financeData, setFinanceData] = useState<any>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [commandQuery, setCommandQuery] = useState("");
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandResult, setCommandResult] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showAIQueryModal, setShowAIQueryModal] = useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.0);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionData, setInspectionData] = useState<any>({
    paint: 5, interior: 5, wheels: 5, glass: 5, notes: ""
  });

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/analytics?timeRange=${timeRange}&insights=true&anomalies=true`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  }, [timeRange]);

  const loadFinanceData = useCallback(async () => {
    setFinanceLoading(true);
    try {
      const now = new Date();
      let start: Date;
      if (timeRange === "week") {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        start = new Date(now.getFullYear(), 0, 1);
      }
      const res = await fetch(`/api/finance?start_date=${start.toISOString()}&end_date=${now.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setFinanceData(data);
      }
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setFinanceLoading(false);
    }
  }, [timeRange]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchWithCheck = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch ${url}: ${res.status} ${text}`);
        }
        return res.json();
      };

      const [bookingsData, servicesData, usersData, workersData, galleryData, activitiesData] = await Promise.all([
        fetchWithCheck("/api/bookings"),
        fetchWithCheck("/api/services?all=true"),
        fetch("/api/users").then(res => res.ok ? res.json() : []),
        fetchWithCheck("/api/workers"),
        fetchWithCheck("/api/gallery?all=true"),
        fetch("/api/activities").then(res => res.ok ? res.json() : []),
      ]);

      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setServices(servicesData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
      setGallery(Array.isArray(galleryData) ? galleryData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);

      const activeBookings = (Array.isArray(bookingsData) ? bookingsData : [])
        .filter((b: Booking) => b.status === "approved" || b.status === "in_progress");

      if (activeBookings.length > 0) {
        const trackingPromises = activeBookings.map(async (booking: Booking) => {
          try {
            const trackingRes = await fetch(`/api/service-tracking?booking_id=${booking.id}`);
            if (trackingRes.ok) {
              const tracking = await trackingRes.json();
              return { id: booking.id, tracking };
            }
          } catch (err) {
            console.error(`Failed to fetch tracking for booking ${booking.id}:`, err);
          }
          return null;
        });

        const trackingResults = await Promise.all(trackingPromises);
        const newTrackingData: Record<string, ServiceTracking[]> = {};
        trackingResults.forEach(result => {
          if (result) {
            newTrackingData[result.id] = result.tracking;
          }
        });
        setTrackingData(prev => ({ ...prev, ...newTrackingData }));
      }

      await loadAnalytics();
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load dashboard data. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }, [loadAnalytics]);

  const subscribeToRealtime = useCallback(() => {
    const channel = supabase
      .channel('admin-realtime-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_tracking' },
        (payload) => {
          const updatedTracking = payload.new as ServiceTracking;
          const bookingId = updatedTracking.booking_id;
          setTrackingData(prev => {
            const currentBookingTracking = prev[bookingId] || [];
            let newBookingTracking;
            if (payload.eventType === 'INSERT') newBookingTracking = [...currentBookingTracking, updatedTracking];
            else if (payload.eventType === 'UPDATE') newBookingTracking = currentBookingTracking.map(t => t.id === updatedTracking.id ? updatedTracking : t);
            else if (payload.eventType === 'DELETE') newBookingTracking = currentBookingTracking.filter(t => t.id !== payload.old.id);
            else newBookingTracking = currentBookingTracking;
            return { ...prev, [bookingId]: newBookingTracking };
          });
          if (payload.eventType === 'UPDATE' && (payload.old.status !== payload.new.status)) loadAnalytics();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          const newBooking = payload.new as Booking;
          setBookings(prev => [newBooking, ...prev]);
          setLastUpdate(new Date());
          loadAnalytics();
          toast.info(`New booking: ${newBooking.booking_id}`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoices' },
        (payload) => {
          setPulseRevenue(true);
          setTimeout(() => setPulseRevenue(false), 2000);
          setLastUpdate(new Date());
          loadAnalytics();
          if (activeTab === 'finance') loadFinanceData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory_items' },
        (payload) => {
          if (payload.new.current_stock < payload.new.min_stock_threshold) {
            toast.warning(`Low stock: ${payload.new.name}`);
            loadAnalytics();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_activities' },
        (payload) => {
          setActivities(prev => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user?.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const count = Object.keys(newState).length;
        setOnlineUsers(count);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [activeTab, loadAnalytics, loadFinanceData]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToRealtime();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadData, subscribeToRealtime]);

  useEffect(() => {
    if (activeTab === "finance") {
      loadFinanceData();
    }
  }, [activeTab, timeRange, loadFinanceData]);

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery, timeRange })
      });
      const data = await res.json();
      setAiResponse(data.answer || "Unable to process query");
    } catch (error) {
      setAiResponse("Failed to get AI response. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCommandSearch = async () => {
    if (!commandQuery.trim()) return;
    setCommandLoading(true);
    try {
      const res = await fetch("/api/ai/admin-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: commandQuery }),
      });
      const data = await res.json();
      setCommandResult(data);
      if (data.action === "redirect") {
        toast.info(data.message);
        router.push(data.target);
      }
    } catch (error) {
      toast.error("Failed to execute command");
    } finally {
      setCommandLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      if (newStatus === "approved") {
        for (const stage of SERVICE_STAGES) {
          await fetch("/api/service-tracking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ booking_id: bookingId, stage: stage.id, status: "pending" }),
          });
        }
      }
      setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: newStatus as Booking["status"] } : b)));
      toast.success(`Booking ${newStatus}!`);
      loadData();
    } catch {
      toast.error("Failed to update booking status");
    }
  };

  const handleUpdateStage = async (stageId: string, trackingId: string, newStatus: string) => {
    if (!selectedBooking) return;
    try {
      const method = trackingId ? "PUT" : "POST";
      const body = trackingId
        ? { id: trackingId, status: newStatus }
        : { booking_id: selectedBooking.id, stage: stageId, status: newStatus };

      const res = await fetch("/api/service-tracking", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(`Stage ${newStatus.replace('_', ' ')}!`);

      const trackingRes = await fetch(`/api/service-tracking?booking_id=${selectedBooking.id}`);
      if (trackingRes.ok) {
        const tracking = await trackingRes.json();
        setTrackingData(prev => ({ ...prev, [selectedBooking.id]: tracking }));
      }
    } catch {
      toast.error("Failed to update stage");
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      toast.success("Booking deleted!");
    } catch {
      toast.error("Failed to delete booking");
    }
  };

  const handleUpdateBooking = async (bookingId: string, updates: any) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update booking");
      toast.success("Booking updated!");
      loadData();
    } catch {
      toast.error("Failed to update booking");
    }
  };

  const handleSaveWorker = async (workerData: any) => {
    try {
      const isEditing = !!selectedWorker;
      const url = isEditing ? `/api/workers/${selectedWorker.id}` : "/api/workers";
      const method = isEditing ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workerData),
      });
      if (!response.ok) throw new Error("Failed to save worker");
      toast.success(`Worker ${isEditing ? "updated" : "added"} successfully!`);
      setShowWorkerModal(false);
      setSelectedWorker(null);
      loadData();
    } catch {
      toast.error("Failed to save worker");
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) return;
    try {
      const response = await fetch(`/api/workers/${workerId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Worker deleted!");
      loadData();
    } catch {
      toast.error("Failed to delete worker");
    }
  };

  const handleSaveService = async (serviceData: Partial<Service>) => {
    try {
      const isEditing = !!selectedService;
      const url = isEditing ? `/api/services/${selectedService.id}` : "/api/services";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...serviceData, price: 300 }),
      });
      if (!response.ok) throw new Error("Failed to save service");
      toast.success(`Service ${isEditing ? "updated" : "added"} successfully!`);
      setShowServiceModal(false);
      setSelectedService(null);
      loadData();
    } catch {
      toast.error("Failed to save service");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const response = await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Service deleted!");
      loadData();
    } catch {
      toast.error("Failed to delete service");
    }
  };

  const handleSaveGalleryItem = async (galleryData: Partial<GalleryItem>) => {
    try {
      const isEditing = !!selectedGalleryItem;
      const url = "/api/gallery";
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...galleryData, id: selectedGalleryItem.id } : galleryData),
      });
      if (!response.ok) throw new Error("Failed to save gallery item");
      toast.success(`Gallery item ${isEditing ? "updated" : "added"} successfully!`);
      setShowGalleryModal(false);
      setSelectedGalleryItem(null);
      loadData();
    } catch {
      toast.error("Failed to save gallery item");
    }
  };

  const handleDeleteGalleryItem = async (galleryId: string) => {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;
    try {
      const response = await fetch(`/api/gallery?id=${galleryId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Gallery item deleted!");
      loadData();
    } catch {
      toast.error("Failed to delete gallery item");
    }
  };

  const downloadBookingsExcel = () => {
    const data = bookings.map(b => ({
      ID: b.booking_id, Customer: b.customer_name, Email: b.customer_email, Service: b.service?.name || b.service_id,
      Car: b.car_model, Date: b.date, Price: b.price, Status: b.status, Payment: b.payment_status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `Bookings_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Bookings exported to Excel");
  };

  const downloadUsersExcel = () => {
    const data = users.map(u => ({ Name: u.full_name, Email: u.email, Phone: u.phone, Joined: new Date(u.created_at).toLocaleDateString() }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Customers exported to Excel");
  };

  const downloadWorkersExcel = () => {
    const data = workers.map(w => ({ Name: w.name, Role: w.role, Status: w.status, Skills: w.skills.join(", ") }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workers");
    XLSX.writeFile(wb, `Workers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Workers exported to Excel");
  };

  const downloadInvoice = (booking: Booking) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("SHASHTI KARZ - OFFICIAL INVOICE", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Booking ID: ${booking.booking_id}`, 20, 40);
    doc.text(`Date: ${booking.date}`, 20, 50);
    doc.text("--------------------------------------------------", 20, 55);
    doc.text(`Customer Name: ${booking.customer_name}`, 20, 65);
    doc.text(`Customer Email: ${booking.customer_email}`, 20, 75);
    doc.text(`Vehicle: ${booking.car_model} (${booking.car_type})`, 20, 85);
    doc.text(`Service: ${booking.service?.name || booking.service_id}`, 20, 95);
    doc.text("--------------------------------------------------", 20, 100);
    doc.setFontSize(14);
    doc.text(`TOTAL AMOUNT: Rs. ${booking.price?.toLocaleString()}`, 20, 115);
    doc.setFontSize(10);
    doc.text("Payment Status: " + (booking.payment_status || "Pending"), 20, 125);
    doc.text("Assigned Specialist: " + (workers.find(w => w.id === booking.assigned_worker_id)?.name || "Not Assigned"), 20, 135);
    doc.text("Generated by Shashti AI", 105, 160, { align: "center" });
    doc.save(`Invoice_${booking.booking_id}.pdf`);
    toast.success("Invoice downloaded");
  };

  const filteredBookings = bookings.filter(
    b => b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.booking_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 mx-auto mb-4">
            <Brain size={64} className="text-[#ff1744]" />
          </motion.div>
          <p className="text-[#888]">Shashti AI is analyzing your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>{/* Bottom padding now handled in layout */}
      <header className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 z-40">
        <div className="flex items-center justify-between h-14 lg:h-16 pl-14 pr-3 lg:px-6">{/* Added pl-14 for mobile menu button */}
          <div className="flex items-center gap-2 lg:gap-4 flex-1">
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Brain size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff1744]" />
              <input
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCommandSearch()}
                placeholder="Type command... (e.g. 'Pending bookings')"
                className="w-full bg-[#ff1744]/5 border border-[#ff1744]/20 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50"
              />
              {commandLoading && <motion.div animate={{ rotate: 360 }} className="absolute right-3 top-1/2 -translate-y-1/2"><RefreshCw size={12} className="text-[#ff1744]" /></motion.div>}
            </div>
            <div className="relative flex-1 max-w-xs hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#666] focus:outline-none focus:border-[#ff1744]/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white"
            >
              <option value="today">Today</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
            <button onClick={loadData} className="p-1.5 lg:p-2 text-[#888] hover:text-white rounded-lg hover:bg-white/5"><RefreshCw size={18} /></button>
            <button className="relative p-1.5 lg:p-2 text-[#888] hover:text-white rounded-lg hover:bg-white/5 hidden sm:block">
              <Bell size={18} />
              {analytics && analytics.anomalies.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff1744] rounded-full animate-pulse" />}
            </button>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-500">{onlineUsers} Online</span>
            </div>
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center">
              <span className="text-white font-bold text-xs lg:text-sm">A</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-3 sm:p-4 lg:p-6">
        {activeTab === "dashboard" && analytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold font-display flex items-center gap-2">
                  AI Dashboard
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-[#ff1744]"
                  />
                </h1>
                <p className="text-xs lg:text-sm text-[#888] flex items-center gap-2">
                  Real-time insights by Shashti AI
                  <span className="text-[10px] opacity-50">• Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </p>
              </div>
              <div className="flex gap-2 lg:gap-3">
                <button onClick={downloadBookingsExcel} className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs lg:text-sm font-medium flex items-center gap-1.5 lg:gap-2 hover:bg-white/10"><Download size={14} /><span className="hidden sm:inline">Export</span></button>
                <button onClick={() => setShowAIQueryModal(true)} className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white text-xs lg:text-sm font-medium flex items-center gap-1.5 lg:gap-2"><Brain size={14} />Ask AI</button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {analytics.anomalies.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4 border border-red-500/30 bg-red-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"><AlertTriangle size={20} className="text-red-500" /></div>
                      <div className="flex-1"><h3 className="font-semibold text-red-500">{analytics.anomalies[0].title}</h3><p className="text-sm text-[#888]">{analytics.anomalies[0].description}</p></div>
                      {analytics.anomalies[0].actionUrl && <button onClick={() => router.push("/admin?tab=tracking")} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 text-sm">{analytics.anomalies[0].action}</button>}
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {[
                    { label: "Total Revenue", value: `₹${analytics.totalRevenue.toLocaleString()}`, change: analytics.revenueChange, icon: DollarSign, color: "#d4af37" },
                    { label: "Revenue Forecast", value: `₹${analytics.revenueForecast.toLocaleString()}`, icon: TrendingUp, color: "#4CAF50" },
                    { label: "Total Bookings", value: analytics.totalBookings.toString(), icon: Calendar, color: "#ff1744" },
                    { label: "Completion Rate", value: `${analytics.completionRate}%`, icon: Target, color: "#9c27b0" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: (stat.label === "Total Revenue" && pulseRevenue) ? [1, 1.05, 1] : 1,
                        boxShadow: (stat.label === "Total Revenue" && pulseRevenue) ? "0 0 20px rgba(212, 175, 55, 0.3)" : "none"
                      }}
                      transition={{
                        delay: i * 0.1,
                        duration: (stat.label === "Total Revenue" && pulseRevenue) ? 0.5 : 0.3
                      }}
                      className={`glass-card rounded-xl lg:rounded-2xl p-3 lg:p-5 relative overflow-hidden ${(stat.label === "Total Revenue" && pulseRevenue) ? "border-[#d4af37]/50" : ""}`}
                    >
                      <div className="absolute top-0 right-0 w-16 lg:w-20 h-16 lg:h-20 rounded-full opacity-10" style={{ backgroundColor: stat.color, filter: "blur(20px)" }} />
                      <div className="flex items-center justify-between mb-2 lg:mb-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}><stat.icon size={16} className="lg:w-5 lg:h-5" style={{ color: stat.color }} /></div>
                        {stat.change !== undefined && <div className={`flex items-center gap-0.5 text-[10px] lg:text-xs ${stat.change >= 0 ? "text-green-500" : "text-red-500"}`}>{stat.change >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{Math.abs(stat.change)}%</div>}
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold">{stat.value}</h3>
                      <p className="text-[10px] lg:text-xs text-[#888] mt-0.5 lg:mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {analytics.insights.length > 0 && (
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff1744]/20 to-[#d4af37]/20 flex items-center justify-center"><Brain size={20} className="text-[#ff1744]" /></div><div><h3 className="font-semibold">AI Briefing</h3><p className="text-xs text-[#888]">Live intelligence from Shashti AI</p></div></div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {analytics.insights.slice(0, 4).map((insight, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className={`p-4 rounded-xl border ${insight.priority === "critical" ? "border-red-500/30 bg-red-500/5" : insight.priority === "high" ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/10 bg-white/5"}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${insight.type === "revenue" ? "bg-[#d4af37]/20" : insight.type === "alert" ? "bg-red-500/20" : insight.type === "recommendation" ? "bg-purple-500/20" : "bg-blue-500/20"}`}>
                              {insight.type === "revenue" ? <DollarSign size={16} className="text-[#d4af37]" /> : insight.type === "alert" ? <AlertTriangle size={16} className="text-red-500" /> : insight.type === "recommendation" ? <Lightbulb size={16} className="text-purple-500" /> : <TrendingUp size={16} className="text-blue-500" />}
                            </div>
                            <div className="flex-1"><h4 className="text-sm font-medium">{insight.title}</h4><p className="text-xs text-[#888] mt-1">{insight.description}</p></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="glass-card rounded-2xl p-6 border border-[#d4af37]/20">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-[#d4af37]"><Sparkles size={18} />AI Live Forecasting</h3>
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-[#d4af37]/5 border border-[#d4af37]/10">
                      <p className="text-[10px] text-[#d4af37] font-bold uppercase mb-1">Next Expected Booking</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white">Full Detailing</span>
                        <span className="text-xs text-[#888]">~ 4:30 PM Today</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-[#888] font-bold uppercase mb-2">Customer Velocity</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                          <div key={i} className={`flex-1 h-8 rounded ${i > 4 ? 'bg-[#ff1744]/20' : 'bg-[#ff1744]'}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-[#666] mt-2 text-center">High demand expected in next 2 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff1744] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff1744]"></span>
                    </span>
                  </div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={18} className="text-[#ff1744]" />Real-time Activity</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {activities.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <Activity size={32} className="text-white/10 mb-2 animate-pulse" />
                        <p className="text-sm text-[#666]">Waiting for activities...</p>
                      </div>
                    ) : (
                      activities.map((activity, i) => (
                        <motion.div key={activity.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${activity.type === 'booking' ? 'bg-green-500/20 text-green-500' : activity.type === 'finance' ? 'bg-[#d4af37]/20 text-[#d4af37]' : activity.type === 'tracking' ? 'bg-purple-500/20 text-purple-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            {activity.type === 'booking' ? <Calendar size={14} /> : activity.type === 'finance' ? <DollarSign size={14} /> : activity.type === 'tracking' ? <Play size={14} /> : <Activity size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium truncate">{activity.title}</h4>
                            <p className="text-[10px] text-[#888] truncate">{activity.description}</p>
                            <span className="text-[10px] text-[#666]">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6 border border-green-500/20">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-500"><Users size={18} />Live Worker Status</h3>
                  <div className="space-y-4">
                    {workers.slice(0, 3).map((w, i) => (
                      <div key={w.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">{w.name.charAt(0)}</div>
                          <div>
                            <p className="text-xs font-medium">{w.name}</p>
                            <p className="text-[10px] text-[#666]">{w.role}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${i === 0 ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-[#888]'}`}>
                          {i === 0 ? 'Busy' : 'Available'}
                        </span>
                      </div>
                    ))}
                    {workers.length === 0 && <p className="text-xs text-[#666] text-center">No workers loaded</p>}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Package size={18} className="text-[#ff1744]" />Inventory Health</h3>
                  {analytics.lowStockItems.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.lowStockItems.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                          <span className="text-xs font-medium">{item.name}</span>
                          <span className="text-xs text-red-500 font-bold">{item.current_stock} {item.unit} left</span>
                        </div>
                      ))}
                      <Link href="/admin?tab=inventory" className="block text-center text-xs text-[#ff1744] hover:underline mt-2">View all inventory</Link>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                      <p className="text-xs text-[#888]">All stock levels normal</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={18} className="text-[#ff1744]" />Bookings Trend (7 Days)</h3>
                <div className="h-48 flex items-end gap-2">
                  {analytics.bookingsByDay.map((day, i) => {
                    const maxValue = Math.max(...analytics.bookingsByDay.map(d => d.value), 1);
                    const height = (day.value / maxValue) * 100;
                    return (
                      <motion.div key={day.date} initial={{ height: 0 }} animate={{ height: `${Math.max(height, 5)}%` }} transition={{ delay: i * 0.1 }} className="flex-1 rounded-t-lg bg-gradient-to-t from-[#ff1744] to-[#ff4569] relative group">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap">{day.value} bookings</div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-[#888]">{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><PieChart size={18} className="text-[#d4af37]" />Service Popularity</h3>
                <div className="space-y-3">
                  {analytics.servicePopularity.slice(0, 5).map((service, i) => {
                    const maxCount = Math.max(...analytics.servicePopularity.map(s => s.count), 1);
                    const width = (service.count / maxCount) * 100;
                    return (
                      <div key={i}><div className="flex items-center justify-between mb-1"><span className="text-sm">{service.name}</span><span className="text-xs text-[#888]">{service.count} bookings</span></div><div className="h-2 rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ delay: i * 0.1 }} className="h-full rounded-full bg-gradient-to-r from-[#ff1744] to-[#d4af37]" /></div></div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "analytics" && analytics && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-2xl font-bold font-display flex items-center gap-3"><Brain className="text-[#ff1744]" />AI Analytics Center</h1>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Ask Shashti AI</h3>
                  <div className="flex gap-3">
                    <input type="text" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAIQuery()} placeholder="Ask anything about your business..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                    <button onClick={handleAIQuery} disabled={aiLoading || !aiQuery.trim()} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-medium disabled:opacity-50 flex items-center gap-2">{aiLoading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><Brain size={18} /></motion.div> : <Brain size={18} />}Analyze</button>
                  </div>
                  {aiResponse && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff1744] to-[#d4af37] flex items-center justify-center flex-shrink-0"><Brain size={16} className="text-white" /></div><div className="flex-1 prose prose-invert prose-sm max-w-none"><div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} /></div></div></motion.div>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="glass-card rounded-2xl p-6 border border-blue-500/20">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-400"><TrendingUp size={16} /> Opportunity Detection</h3>
                    <p className="text-xs text-[#888]">AI is scanning for growth patterns...</p>
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/5 text-blue-400 text-xs">
                      {analytics.revenueChange > 0 ? "Growth trend detected. Suggesting loyalty campaign." : "Steady state. Recommended: mid-week special."}
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-6 border border-purple-500/20">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-purple-400"><Sparkles size={16} /> Smart Pricing</h3>
                    <p className="text-xs text-[#888]">Dynamic pricing optimization</p>
                    <div className="mt-4 p-3 rounded-lg bg-purple-500/5 text-purple-400 text-xs">
                      AI recommends +10% on SAT for peak demand.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 border border-[#ff1744]/20 relative overflow-hidden">
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded bg-[#ff1744]/10 text-[#ff1744] text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff1744] animate-ping" />
                    Live Analysis
                  </div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Send size={16} className="text-[#ff1744]" /> Events Analyzed</h3>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                    {activities.slice(0, 10).map((act, i) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={act.id} className="relative pl-4 border-l border-white/5">
                        <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-white/10" />
                        <p className="text-[10px] text-[#ff1744] font-medium uppercase">{act.type}</p>
                        <p className="text-xs font-medium text-white">{act.title}</p>
                        <p className="text-[10px] text-[#666]">{new Date(act.timestamp).toLocaleTimeString()}</p>
                      </motion.div>
                    ))}
                    {activities.length === 0 && <p className="text-xs text-[#666] text-center py-10">Listening for events...</p>}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-white/5 to-transparent">
                  <h3 className="text-sm font-semibold mb-3">AI Model Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888]">Engine</span>
                      <span className="text-green-500 font-medium">Gemini Pro 2.5</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888]">Context Size</span>
                      <span className="text-white">1.03M tokens</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888]">Last Sync</span>
                      <span className="text-white">{lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "finance" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-2xl font-bold font-display flex items-center gap-3"><DollarSign className="text-[#d4af37]" />Finance & Revenue</h1>
            {financeLoading && !financeData ? <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" /></div> : (financeData && analytics) ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card rounded-2xl p-6">
                    <p className="text-xs text-[#888]">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-500">₹{financeData.summary.totalRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-[#666] mt-1">From {financeData.transactions.length} transactions</p>
                  </div>
                  <div className="glass-card rounded-2xl p-6 border border-[#4CAF50]/30 bg-[#4CAF50]/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-[#888]">AI Revenue Forecast</p>
                      <Sparkles size={12} className="text-[#4CAF50]" />
                    </div>
                    <p className="text-2xl font-bold text-[#4CAF50]">₹{analytics.revenueForecast.toLocaleString()}</p>
                    <p className="text-[10px] text-[#666] mt-1">Next 7 days prediction</p>
                  </div>
                  <div className="glass-card rounded-2xl p-6">
                    <p className="text-xs text-[#888]">Net Revenue</p>
                    <p className="text-2xl font-bold text-[#d4af37]">₹{financeData.summary.netRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-[#666] mt-1">After {financeData.summary.totalRefunds.toLocaleString()} refunds</p>
                  </div>
                  <div className="glass-card rounded-2xl p-6">
                    <p className="text-xs text-[#888]">Est. GST (18%)</p>
                    <p className="text-2xl font-bold text-blue-500">₹{financeData.summary.estimatedTax.toLocaleString()}</p>
                    <p className="text-[10px] text-[#666] mt-1">Liable for current period</p>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Revenue Breakdown</h3>
                  <div className="h-64 flex items-end gap-2">
                    {analytics.revenueByDay.map((day, i) => {
                      const maxValue = Math.max(...analytics.revenueByDay.map(d => d.value), 1);
                      const height = (day.value / maxValue) * 100;
                      return (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(height, 5)}%` }} transition={{ delay: i * 0.1 }} className="w-full rounded-t-lg bg-gradient-to-t from-[#d4af37] to-[#ffd700] relative group">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap">₹{day.value.toLocaleString()}</div>
                          </motion.div>
                          <span className="text-[10px] text-[#888]">{new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : <p className="text-center py-20 text-[#888]">No finance data found.</p>}
          </motion.div>
        )}

        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between"><h1 className="text-2xl font-bold font-display">Manage Bookings</h1><button onClick={downloadBookingsExcel} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium flex items-center gap-2"><Download size={16} />Export</button></div>
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">ID</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">Customer</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">Service</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">Assigned Specialist</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4 text-sm font-mono">{booking.booking_id}</td>
                      <td className="px-6 py-4 text-sm font-bold">{booking.customer_name}</td>
                      <td className="px-6 py-4 text-sm">{booking.service?.name || booking.service_id}</td>
                      <td className="px-6 py-4">
                        <select
                          value={booking.assigned_worker_id || ""}
                          onChange={(e) => handleUpdateBooking(booking.id, { assigned_worker_id: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#ff1744]"
                        >
                          <option value="">Unassigned</option>
                          {workers.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.skills[0] || 'General'})</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${statusColors[booking.status]}`}>{booking.status}</span></td>
                      <td className="px-6 py-4 flex gap-2">
                        {booking.status === "pending" && (
                          <>
                            <button onClick={() => handleStatusChange(booking.id, "approved")} className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20" title="Approve Booking">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => handleStatusChange(booking.id, "cancelled")} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20" title="Reject Booking">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button onClick={() => { setSelectedBooking(booking); setShowTrackingModal(true); }} className="p-2 rounded-lg bg-purple-500/10 text-purple-500" title="Track Service">
                          <Play size={16} />
                        </button>
                        <button onClick={() => handleDeleteBooking(booking.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500" title="Delete Booking">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "tracking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-2xl font-bold font-display">Live Service Tracking</h1>
            <div className="grid gap-6">
              {bookings.filter(b => b.status === "approved" || b.status === "in_progress").map((booking) => {
                const tracking = trackingData[booking.id] || [];
                const completedStages = tracking.filter(t => t.status === "completed").length;
                const progress = tracking.length > 0 ? (completedStages / tracking.length) * 100 : 0;
                return (
                  <div key={booking.id} className="glass-card rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{booking.customer_name}</h3>
                        <p className="text-sm text-[#888]">{booking.car_model} • {booking.booking_id}</p>
                        <p className="text-xs text-[#ff1744] mt-1 font-medium italic">{booking.service?.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold text-gradient">{Math.round(progress)}%</div>
                        <button
                          onClick={() => { setSelectedBooking(booking); setShowInspectionModal(true); }}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/10 text-xs font-bold hover:bg-blue-500/20 text-blue-400 transition-all flex items-center gap-2"
                        >
                          <Eye size={14} />
                          Digital Inspection
                        </button>
                        <button
                          onClick={() => { setSelectedBooking(booking); setShowTrackingModal(true); }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                          <Settings size={14} />
                          Manage Stages
                        </button>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-purple-500 to-[#ff1744]" /></div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === "workers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between"><h1 className="text-2xl font-bold font-display">Staff & Productivity</h1><button onClick={() => { setSelectedWorker(null); setShowWorkerModal(true); }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-bold flex items-center gap-2"><Plus size={16} />Add Worker</button></div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
                {workers.map((worker, i) => (
                  <div key={worker.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xl font-bold">{worker.name.charAt(0)}</div>
                        <div>
                          <h3 className="font-bold">{worker.name}</h3>
                          <p className="text-xs text-[#888]">{worker.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedWorker(worker); setShowWorkerModal(true); }} className="p-2 hover:bg-white/5 rounded-lg"><Settings size={14} /></button>
                        <button onClick={() => handleDeleteWorker(worker.id)} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#666]">
                        <span>Daily Efficiency</span>
                        <span className="text-green-500">{85 + (i * 3)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${85 + (i * 3)}%` }} className="h-full bg-gradient-to-r from-green-600 to-emerald-400" />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#888]">
                        <span>{12 + i} cars this week</span>
                        <span>Avg 1.2h / car</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-[#ff1744]/10 to-transparent border border-[#ff1744]/20">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-[#ff1744]" /> Productivity Leader</h3>
                  {workers.length > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border-2 border-[#ff1744] p-1">
                        <div className="w-full h-full rounded-full bg-[#ff1744] flex items-center justify-center text-2xl font-black text-white">{workers[0].name.charAt(0)}</div>
                      </div>
                      <div>
                        <p className="font-black text-xl">{workers[0].name}</p>
                        <p className="text-xs text-[#888]">Most efficient today</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-bold text-sm mb-4">Training Reminders</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-[#888]">
                      New Gtechniq coating method tutorial available.
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-[#888]">
                      Safety certification expiring in 12 days.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "services" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold font-display">Services & Pricing</h1>
              <button onClick={() => { setSelectedService(null); setShowServiceModal(true); }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-bold flex items-center gap-2"><Plus size={16} />Add Service</button>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-[#ff1744]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff1744]/5 rounded-full blur-3xl" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                <div className="flex-1">
                  <h3 className="font-bold flex items-center gap-2 mb-1"><Zap size={18} className="text-[#ff1744]" />Dynamic Pricing Engine</h3>
                  <p className="text-xs text-[#888]">Apply a global multiplier during peak demand hours.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-center">
                    <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Multiplier</p>
                    <p className="text-xl font-black text-[#ff1744]">{surgeMultiplier.toFixed(1)}x</p>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.1"
                    value={surgeMultiplier}
                    onChange={(e) => setSurgeMultiplier(parseFloat(e.target.value))}
                    className="w-32 accent-[#ff1744] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${surgeMultiplier > 1 ? 'bg-[#ff1744] text-white animate-pulse' : 'bg-white/10 text-[#666]'}`}>
                    {surgeMultiplier > 1 ? 'Surge Active' : 'Normal'}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">Service Name</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">Base price</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-[#888] uppercase">Final price (Surge)</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-[#888] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-t border-white/5">
                      <td className="px-6 py-4 font-medium">{s.name}</td>
                      <td className="px-6 py-4 text-[#888]">₹{s.price}</td>
                      <td className="px-6 py-4 font-bold text-[#d4af37]">₹{Math.round(s.price * surgeMultiplier)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { setSelectedService(s); setShowServiceModal(true); }} className="p-2 hover:text-[#ff1744] transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteService(s.id)} className="p-2 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "gallery" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between"><h1 className="text-2xl font-bold font-display">Gallery</h1><button onClick={() => { setSelectedGalleryItem(null); setShowGalleryModal(true); }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white">Add Item</button></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((item) => (
                <div key={item.id} className="glass-card rounded-2xl overflow-hidden group">
                  <div className="relative aspect-video"><Image src={item.after_image} alt={item.title} fill className="object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDeleteGalleryItem(item.id)} className="p-2 bg-red-500 rounded-full"><Trash2 size={16} /></button></div></div>
                  <div className="p-4"><h3 className="font-semibold">{item.title}</h3><p className="text-xs text-[#888]">{item.service}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between"><h1 className="text-2xl font-bold font-display">Customers</h1><button onClick={downloadUsersExcel} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"><Download size={16} />Export</button></div>
            <div className="glass-card rounded-2xl overflow-hidden"><table className="w-full"><tbody>{users.map((u) => (<tr key={u.id} className="border-t border-white/5"><td className="px-6 py-4">{u.full_name || u.email}</td><td className="px-6 py-4 text-[#888]">{u.phone || "No phone"}</td></tr>))}</tbody></table></div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showInspectionModal && selectedBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInspectionModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold font-display flex items-center gap-3"><Eye className="text-blue-500" />Digital Inspection</h2>
                  <p className="text-sm text-[#888] mt-1">Vehicle: {selectedBooking.car_model} • {selectedBooking.booking_id}</p>
                </div>
                <button onClick={() => setShowInspectionModal(false)}><X size={24} /></button>
              </div>

              <div className="space-y-6">
                {Object.entries(inspectionData).filter(([k]) => k !== 'notes').map(([key, val]: any) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[#888]">
                      <span>{key} Condition</span>
                      <span className="text-blue-500">{val}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={val}
                      onChange={(e) => setInspectionData({ ...inspectionData, [key]: parseInt(e.target.value) })}
                      className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                ))}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#888]">Inspection Notes</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 transition-colors h-24"
                    placeholder="Describe paint defects, scratches, or interior issues..."
                    value={inspectionData.notes}
                    onChange={(e) => setInspectionData({ ...inspectionData, notes: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button onClick={() => setShowInspectionModal(false)} className="flex-1 px-6 py-4 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition-all">Cancel</button>
                  <button onClick={() => { toast.success("Inspection Report Sent to Customer!"); setShowInspectionModal(false); }} className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">Publish Report</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIQueryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAIQueryModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#111] rounded-2xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><Brain className="text-[#ff1744]" /> Ask AI</h2><button onClick={() => setShowAIQueryModal(false)}><X size={20} /></button></div>
              <div className="space-y-4"><div className="flex gap-3"><input type="text" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Ask anything..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white" /><button onClick={handleAIQuery} disabled={aiLoading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white">{aiLoading ? "..." : "Ask"}</button></div>{aiResponse && <div className="p-4 bg-white/5 rounded-xl text-sm border border-white/10">{aiResponse}</div>}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrackingModal && selectedBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowTrackingModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111] rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between mb-6"><h2 className="text-xl font-bold">Tracking: {selectedBooking.booking_id}</h2><button onClick={() => setShowTrackingModal(false)}><X size={20} /></button></div>
              <div className="space-y-2">
                {SERVICE_STAGES.map(stage => {
                  const t = (trackingData[selectedBooking.id] || []).find(x => x.stage === stage.id);
                  return (
                    <div key={stage.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3"><stage.icon size={18} /><span className="text-sm">{stage.name}</span></div>
                      <button onClick={() => handleUpdateStage(stage.id, t?.id || "", t?.status === "pending" || !t ? "in_progress" : "completed")} className="text-xs px-2 py-1 bg-white/10 rounded">{t?.status || "pending"}</button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWorkerModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowWorkerModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">{selectedWorker ? 'Edit Worker' : 'Add New Worker'}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveWorker({
                  name: formData.get('name'),
                  role: formData.get('role'),
                  skills: (formData.get('skills') as string).split(',').map(s => s.trim()),
                  status: 'active'
                });
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Full Name</label>
                  <input name="name" defaultValue={selectedWorker?.name} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#ff1744] outline-none" placeholder="Worker Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Primary Role</label>
                  <input name="role" defaultValue={selectedWorker?.role} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#ff1744] outline-none" placeholder="e.g. Senior Detailer" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#888] uppercase mb-1">Specialties / Skills (comma separated)</label>
                  <input name="skills" defaultValue={selectedWorker?.skills.join(', ')} required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:border-[#ff1744] outline-none" placeholder="e.g. Ceramic, Interior, Paint Correction" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowWorkerModal(false)} className="flex-1 px-4 py-2 rounded-lg bg-white/5 font-medium hover:bg-white/10">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff1744] to-[#d4af37] text-white font-bold">Save Worker</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin" /></div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
