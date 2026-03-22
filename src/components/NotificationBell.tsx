"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Calendar,
  CreditCard,
  Wrench,
  Sparkles,
  AlertCircle,
  Gift,
  ChevronRight,
  Settings
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Notification, NotificationCategory } from "@/lib/types";
import Link from "next/link";

const CATEGORY_ICONS: Record<NotificationCategory, typeof Bell> = {
  booking: Calendar,
  payment: CreditCard,
  service: Wrench,
  promotion: Gift,
  system: AlertCircle,
  insight: Sparkles,
};

const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  booking: "text-blue-400",
  payment: "text-green-400",
  service: "text-orange-400",
  promotion: "text-purple-400",
  system: "text-red-400",
  insight: "text-[#d4af37]",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "border-l-gray-500",
  medium: "border-l-blue-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | "all">("all");

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const categoryParam = activeCategory !== "all" ? `&category=${activeCategory}` : "";
      const res = await fetch(`/api/notifications?limit=50${categoryParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeCategory]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          if (Notification.permission === "granted") {
            new window.Notification(newNotification.title, {
              body: newNotification.message,
              icon: "/favicon.ico",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read" }),
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // No client-side filtering needed — API now handles category filtering
  const filteredNotifications = notifications;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell size={22} className="text-white/80" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff1744] rounded-full flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(255,23,68,0.5)]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:absolute lg:bg-transparent lg:backdrop-blur-none lg:inset-auto lg:z-auto"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={isMobile ? { y: "100%" } : { opacity: 0, y: 10, scale: 0.95 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={isMobile ? { y: "100%" } : { opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed bottom-0 left-0 right-0 z-50 bg-[#111] border-t border-white/10 rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] lg:absolute lg:bottom-auto lg:left-auto lg:right-0 lg:top-full lg:mt-4 lg:w-[400px] lg:rounded-2xl lg:border lg:max-h-[600px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] lg:shadow-2xl`}
            >
              {/* Handle for mobile bottom sheet */}
              <div className="lg:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />

              <div className="p-4 lg:p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-xl lg:text-lg">Notifications</h3>
                    <p className="text-xs text-[#666] mt-0.5">Stay updated with your bookings</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-[#d4af37] hover:brightness-110 flex items-center gap-1.5 bg-[#d4af37]/10 px-3 py-1.5 rounded-full transition-all"
                      >
                        <CheckCheck size={14} />
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="lg:hidden p-2 hover:bg-white/5 rounded-full text-[#888]"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                  {(["all", "booking", "payment", "service", "insight"] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat
                        ? "bg-[#ff1744] text-white shadow-[0_0_15px_rgba(255,23,68,0.3)]"
                        : "bg-white/5 text-[#888] hover:bg-white/10"
                        }`}
                    >
                      {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar pb-safe-area-inset-bottom">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="w-10 h-10 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#666] text-sm font-medium">Fetching updates...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-[#333]" />
                    </div>
                    <h4 className="text-white font-medium">All caught up!</h4>
                    <p className="text-[#666] text-sm mt-1">No new notifications at the moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredNotifications.map((notification) => {
                      const Icon = CATEGORY_ICONS[notification.category];
                      const colorClass = CATEGORY_COLORS[notification.category];
                      const priorityClass = PRIORITY_STYLES[notification.priority];

                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 lg:p-5 hover:bg-white/[0.03] transition-colors cursor-pointer border-l-4 ${priorityClass} ${!notification.read ? "bg-[#ff1744]/[0.02]" : ""
                            }`}
                          onClick={() => {
                            if (!notification.read) markAsRead(notification.id);
                            if (notification.action_url) {
                              setIsOpen(false);
                              if (notification.action_url.startsWith('http')) {
                                window.open(notification.action_url, '_blank');
                              } else {
                                window.location.href = notification.action_url;
                              }
                            }
                          }}
                        >
                          <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 ${colorClass} shadow-inner`}>
                              <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`font-bold text-sm lg:text-base leading-tight ${!notification.read ? "text-white" : "text-[#aaa]"}`}>
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff1744] flex-shrink-0 mt-1 shadow-[0_0_8px_rgba(255,23,68,0.8)]" />
                                )}
                              </div>
                              <p className="text-sm text-[#888] line-clamp-2 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-[11px] font-medium text-[#666] tracking-wide uppercase">
                                  {formatTime(notification.created_at)}
                                </span>
                                {notification.action_url && (
                                  <span className="text-xs font-bold text-[#d4af37] flex items-center gap-1 hover:gap-2 transition-all">
                                    Track Status <ChevronRight size={14} />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 lg:p-4 border-t border-white/10 bg-[#161616]/50 lg:bg-transparent">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <Bell size={16} />
                  See older notifications
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
