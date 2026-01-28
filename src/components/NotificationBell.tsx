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
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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

  const filteredNotifications = activeCategory === "all" 
    ? notifications 
    : notifications.filter(n => n.category === activeCategory);

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
              className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff1744] rounded-full flex items-center justify-center text-xs font-bold text-white"
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
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[#d4af37] hover:text-[#d4af37]/80 flex items-center gap-1"
                      >
                        <CheckCheck size={14} />
                        Mark all read
                      </button>
                    )}
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Settings size={16} className="text-[#888]" />
                    </Link>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {(["all", "booking", "payment", "service", "insight"] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        activeCategory === cat
                          ? "bg-[#ff1744] text-white"
                          : "bg-white/5 text-[#888] hover:bg-white/10"
                      }`}
                    >
                      {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-[#ff1744] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-[#333] mx-auto mb-3" />
                    <p className="text-[#666]">No notifications yet</p>
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
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-white/5 transition-colors cursor-pointer border-l-2 ${priorityClass} ${
                            !notification.read ? "bg-white/[0.02]" : ""
                          }`}
                          onClick={() => {
                            if (!notification.read) markAsRead(notification.id);
                            if (notification.action_url) {
                              setIsOpen(false);
                              window.location.href = notification.action_url;
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`font-medium text-sm ${!notification.read ? "text-white" : "text-[#aaa]"}`}>
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <span className="w-2 h-2 rounded-full bg-[#ff1744] flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-sm text-[#888] line-clamp-2 mt-0.5">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-[#666]">
                                  {formatTime(notification.created_at)}
                                </span>
                                {notification.action_url && (
                                  <span className="text-xs text-[#d4af37] flex items-center gap-0.5">
                                    View <ChevronRight size={12} />
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

              <div className="p-3 border-t border-white/10">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-2 text-sm text-[#d4af37] hover:text-[#d4af37]/80 transition-colors"
                >
                  View All Notifications
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
