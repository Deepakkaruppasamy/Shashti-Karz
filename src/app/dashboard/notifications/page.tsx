"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bell, 
  Mail, 
  MessageCircle, 
  Smartphone, 
  Moon, 
  Globe,
  Calendar,
  CreditCard,
  Wrench,
  Gift,
  Settings,
  Check,
  ChevronRight,
  Trash2
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth-context";
import type { Notification, NotificationPreference, NotificationCategory } from "@/lib/types";
import toast from "react-hot-toast";

const CATEGORY_ICONS: Record<NotificationCategory, typeof Bell> = {
  booking: Calendar,
  payment: CreditCard,
  service: Wrench,
  promotion: Gift,
  system: Bell,
  insight: Settings,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "settings">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [notifRes, prefsRes] = await Promise.all([
        fetch("/api/notifications?limit=50"),
        fetch("/api/notifications/preferences"),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.notifications || []);
      }
      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreference, value: any) => {
    if (!preferences) return;
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPreferences(updated);
        toast.success("Preferences updated");
      } else {
        toast.error("Failed to update preferences");
      }
    } catch (error) {
      toast.error("Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <p className="text-[#888]">Please login to view notifications</p>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold font-display">
                <span className="text-gradient">Notifications</span>
              </h1>
              <p className="text-[#888] mt-1">Manage your notifications and preferences</p>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-[#ff1744] text-white"
                  : "bg-white/5 text-[#888] hover:bg-white/10"
              }`}
            >
              <Bell size={18} className="inline mr-2" />
              All Notifications
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "settings"
                  ? "bg-[#ff1744] text-white"
                  : "bg-white/5 text-[#888] hover:bg-white/10"
              }`}
            >
              <Settings size={18} className="inline mr-2" />
              Preferences
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : activeTab === "all" ? (
            <div className="space-y-4">
              {notifications.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-[#d4af37] hover:text-[#d4af37]/80"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
              
              {notifications.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-2xl">
                  <Bell className="w-16 h-16 text-[#333] mx-auto mb-4" />
                  <p className="text-[#888]">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = CATEGORY_ICONS[notification.category];
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`glass-card rounded-xl p-4 ${
                        !notification.read ? "border-l-4 border-l-[#ff1744]" : ""
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Icon size={20} className="text-[#d4af37]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={`font-medium ${!notification.read ? "text-white" : "text-[#aaa]"}`}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-[#888] mt-1">{notification.message}</p>
                              <p className="text-xs text-[#666] mt-2">{formatTime(notification.created_at)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                  title="Mark as read"
                                >
                                  <Check size={16} className="text-green-500" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-6">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-[#d4af37]" />
                      <div>
                        <p className="font-medium">In-App Notifications</p>
                        <p className="text-sm text-[#888]">Receive notifications within the app</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.channel_in_app ?? true}
                        onChange={(e) => updatePreference("channel_in_app", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff1744]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail size={20} className="text-[#d4af37]" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-[#888]">Receive notifications via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.channel_email ?? true}
                        onChange={(e) => updatePreference("channel_email", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff1744]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <MessageCircle size={20} className="text-[#25D366]" />
                      <div>
                        <p className="font-medium">WhatsApp Notifications</p>
                        <p className="text-sm text-[#888]">Receive notifications via WhatsApp</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.channel_whatsapp ?? true}
                        onChange={(e) => updatePreference("channel_whatsapp", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff1744]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone size={20} className="text-[#d4af37]" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-[#888]">Receive browser push notifications</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.channel_push ?? true}
                        onChange={(e) => updatePreference("channel_push", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff1744]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-6">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-blue-400" />
                      <div>
                        <p className="font-medium">Booking Updates</p>
                        <p className="text-sm text-[#888]">Confirmations, approvals, reminders</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.booking_notifications ?? true}
                        onChange={(e) => updatePreference("booking_notifications", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff1744]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} className="text-green-400" />
                      <div>
                        <p className="font-medium">Payment Updates</p>
                        <p className="text-sm text-[#888]">Invoices, receipts, refunds</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.payment_notifications ?? true}
                        onChange={(e) => updatePreference("payment_notifications", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff1744]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Wrench size={20} className="text-orange-400" />
                      <div>
                        <p className="font-medium">Service Updates</p>
                        <p className="text-sm text-[#888]">Service progress, completion</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.service_notifications ?? true}
                        onChange={(e) => updatePreference("service_notifications", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff1744]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Gift size={20} className="text-purple-400" />
                      <div>
                        <p className="font-medium">Promotions & Offers</p>
                        <p className="text-sm text-[#888]">Special deals, discounts, rewards</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences?.promotional_notifications ?? true}
                        onChange={(e) => updatePreference("promotional_notifications", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff1744]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-lg mb-6">Quiet Hours</h3>
                <p className="text-sm text-[#888] mb-4">
                  During quiet hours, only critical notifications will be sent via push/WhatsApp. 
                  Others will be available in-app only.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#888] mb-2">Start Time</label>
                    <input
                      type="time"
                      value={preferences?.quiet_hours_start || ""}
                      onChange={(e) => updatePreference("quiet_hours_start", e.target.value || null)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff1744]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#888] mb-2">End Time</label>
                    <input
                      type="time"
                      value={preferences?.quiet_hours_end || ""}
                      onChange={(e) => updatePreference("quiet_hours_end", e.target.value || null)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff1744]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
