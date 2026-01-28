import { createClient } from "@/lib/supabase/server";
import type { 
  Notification, 
  NotificationType, 
  NotificationChannel, 
  NotificationPriority,
  NotificationCategory,
  NotificationPreference 
} from "@/lib/types";
import { 
  sendEmail, 
  generateBookingConfirmationEmail, 
  generateServiceCompletedEmail,
  generatePaymentReceiptEmail,
  generateReminderEmail,
  generatePromotionalEmail
} from "@/lib/email-service";

interface SendNotificationParams {
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  actionUrl?: string;
  expiresAt?: string;
}

const TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategory> = {
  booking_created: "booking",
  booking_approved: "booking",
  worker_assigned: "service",
  service_started: "service",
  service_completed: "service",
  invoice_generated: "payment",
  refund_initiated: "payment",
  reminder: "booking",
  payment_received: "payment",
  admin_new_booking: "booking",
  admin_high_value: "booking",
  admin_payment_failed: "payment",
  admin_daily_summary: "system",
  system_alert: "system",
  ai_insight: "insight",
  promotion: "promotion",
};

const TYPE_TO_DEFAULT_PRIORITY: Record<NotificationType, NotificationPriority> = {
  booking_created: "high",
  booking_approved: "high",
  worker_assigned: "medium",
  service_started: "medium",
  service_completed: "high",
  invoice_generated: "medium",
  refund_initiated: "high",
  reminder: "medium",
  payment_received: "high",
  admin_new_booking: "high",
  admin_high_value: "critical",
  admin_payment_failed: "critical",
  admin_daily_summary: "low",
  system_alert: "critical",
  ai_insight: "low",
  promotion: "low",
};

const TYPE_TO_CHANNELS: Record<NotificationType, NotificationChannel[]> = {
  booking_created: ["in_app", "email", "whatsapp"],
  booking_approved: ["in_app", "email", "whatsapp"],
  worker_assigned: ["in_app"],
  service_started: ["in_app", "whatsapp"],
  service_completed: ["in_app", "email", "whatsapp"],
  invoice_generated: ["in_app", "email"],
  refund_initiated: ["in_app", "email", "whatsapp"],
  reminder: ["in_app", "whatsapp"],
  payment_received: ["in_app", "email"],
  admin_new_booking: ["in_app", "email"],
  admin_high_value: ["in_app", "whatsapp"],
  admin_payment_failed: ["in_app", "email", "whatsapp"],
  admin_daily_summary: ["email"],
  system_alert: ["in_app", "email"],
  ai_insight: ["in_app"],
  promotion: ["email"],
};

export async function sendNotification(params: SendNotificationParams): Promise<Notification | null> {
  const supabase = await createClient();
  
  const category = TYPE_TO_CATEGORY[params.type];
  const priority = params.priority || TYPE_TO_DEFAULT_PRIORITY[params.type];
  let channels = TYPE_TO_CHANNELS[params.type];

  if (params.userId) {
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", params.userId)
      .single();

    if (preferences) {
      channels = channels.filter(channel => {
        if (channel === "email" && !preferences.channel_email) return false;
        if (channel === "whatsapp" && !preferences.channel_whatsapp) return false;
        if (channel === "push" && !preferences.channel_push) return false;
        if (channel === "in_app" && !preferences.channel_in_app) return false;
        return true;
      });

      if (category === "booking" && !preferences.booking_notifications) {
        channels = channels.filter(c => c === "in_app");
      }
      if (category === "payment" && !preferences.payment_notifications) {
        channels = channels.filter(c => c === "in_app");
      }
      if (category === "promotion" && !preferences.promotional_notifications) {
        return null;
      }

      if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(preferences.quiet_hours_start.split(":")[0]);
        const endHour = parseInt(preferences.quiet_hours_end.split(":")[0]);
        
        const isQuietHours = startHour < endHour 
          ? currentHour >= startHour && currentHour < endHour
          : currentHour >= startHour || currentHour < endHour;
        
        if (isQuietHours && priority !== "critical") {
          channels = ["in_app"];
        }
      }
    }
  }

  const notification = {
    user_id: params.userId,
    type: params.type,
    category,
    title: params.title,
    message: params.message,
    data: params.data || null,
    channels,
    priority,
    read: false,
    read_at: null,
    delivered_channels: ["in_app"],
    action_url: params.actionUrl || null,
    expires_at: params.expiresAt || null,
  };

  const { data, error } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.error("Failed to create notification:", error);
    return null;
  }

  if (channels.includes("email") && params.userId) {
    await sendEmailNotification(params.userId, params.title, params.message, params.type, params.data || undefined);
  }

  if (channels.includes("whatsapp") && params.userId) {
    await sendWhatsAppNotification(params.userId, params.message);
  }

  return data;
}

async function sendEmailNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: NotificationType,
  data?: Record<string, any>
) {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (!profile?.email) {
    console.log(`[Email] No email found for user ${userId}`);
    return;
  }

  let html = "";
  const customerName = profile.full_name || "Customer";

  switch (type) {
    case "booking_created":
    case "booking_approved":
      html = generateBookingConfirmationEmail({
        customerName,
        serviceName: data?.serviceName || "Car Detailing",
        date: data?.date || new Date().toLocaleDateString(),
        time: data?.time || "10:00 AM",
        price: data?.price || 0,
        bookingId: data?.bookingId || "",
      });
      break;
    case "service_completed":
      html = generateServiceCompletedEmail({
        customerName,
        serviceName: data?.serviceName || "Car Detailing",
        bookingId: data?.bookingId || "",
      });
      break;
    case "payment_received":
      html = generatePaymentReceiptEmail({
        customerName,
        amount: data?.amount || data?.price || 0,
        serviceName: data?.serviceName || "Car Detailing",
        paymentId: data?.paymentId || "",
        date: new Date().toLocaleDateString(),
      });
      break;
    case "reminder":
      html = generateReminderEmail({
        customerName,
        serviceName: data?.serviceName || "Car Detailing",
        date: data?.date || new Date().toLocaleDateString(),
        time: data?.time || "10:00 AM",
      });
      break;
    case "promotion":
      html = generatePromotionalEmail({
        customerName,
        title,
        message,
        offerCode: data?.code,
        discount: data?.discount,
      });
      break;
    default:
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ff1744;">${title}</h1>
          <p>${message}</p>
        </div>
      `;
  }

  const result = await sendEmail({
    to: profile.email,
    subject: title,
    html,
  });

  if (result.success) {
    console.log(`[Email] Sent to ${profile.email}: ${title}`);
  } else {
    console.error(`[Email] Failed to send to ${profile.email}: ${result.error}`);
  }
}

async function sendWhatsAppNotification(userId: string, message: string) {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .single();

  if (!profile?.phone) {
    console.log(`[WhatsApp] No phone found for user ${userId}`);
    return;
  }

  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: profile.phone,
        template_name: "custom_message",
        params: [message],
      }),
    });
    console.log(`[WhatsApp] Sent to ${profile.phone}`);
  } catch (error) {
    console.error(`[WhatsApp] Failed to send:`, error);
  }
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("read", false);

  return !error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) return 0;
  return count || 0;
}

export async function getUserNotifications(
  userId: string, 
  options: { limit?: number; offset?: number; category?: NotificationCategory } = {}
): Promise<Notification[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options.category) {
    query = query.eq("category", options.category);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function getUserPreferences(userId: string): Promise<NotificationPreference> {
  const defaultPrefs: NotificationPreference = {
    id: "default",
    user_id: userId,
    channel_email: true,
    channel_whatsapp: true,
    channel_push: true,
    channel_in_app: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
    language: "en",
    marketing_enabled: true,
    booking_notifications: true,
    payment_notifications: true,
    service_notifications: true,
    promotional_notifications: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return defaultPrefs;
    }

    return data || defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

export async function updateUserPreferences(
  userId: string, 
  updates: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  const currentPrefs = await getUserPreferences(userId);
  return { ...currentPrefs, ...updates, updated_at: new Date().toISOString() };
}

export async function sendBookingNotification(
  bookingId: string,
  type: "created" | "approved" | "completed" | "cancelled",
  userId: string | null,
  bookingData: {
    serviceName: string;
    date: string;
    time: string;
    price: number;
    customerName: string;
    customerEmail?: string;
  }
) {
  const titles: Record<string, string> = {
    created: "Booking Confirmed!",
    approved: "Booking Approved!",
    completed: "Service Completed!",
    cancelled: "Booking Cancelled",
  };

  const messages: Record<string, string> = {
    created: `Your booking for ${bookingData.serviceName} on ${bookingData.date} at ${bookingData.time} has been confirmed. Total: ₹${bookingData.price}`,
    approved: `Great news! Your booking for ${bookingData.serviceName} on ${bookingData.date} has been approved. See you soon!`,
    completed: `Your ${bookingData.serviceName} service has been completed. Thank you for choosing Shashti Karz!`,
    cancelled: `Your booking for ${bookingData.serviceName} on ${bookingData.date} has been cancelled.`,
  };

  const notificationType: NotificationType = type === "created" 
    ? "booking_created" 
    : type === "approved" 
    ? "booking_approved" 
    : "service_completed";

  const notification = await sendNotification({
    userId,
    type: notificationType,
    title: titles[type],
    message: messages[type],
    data: { bookingId, ...bookingData },
    actionUrl: `/dashboard?booking=${bookingId}`,
  });

  if (bookingData.customerEmail) {
    let html = "";
    if (type === "created" || type === "approved") {
      html = generateBookingConfirmationEmail({
        customerName: bookingData.customerName,
        serviceName: bookingData.serviceName,
        date: bookingData.date,
        time: bookingData.time,
        price: bookingData.price,
        bookingId,
      });
    } else if (type === "completed") {
      html = generateServiceCompletedEmail({
        customerName: bookingData.customerName,
        serviceName: bookingData.serviceName,
        bookingId,
      });
    }
    
    if (html) {
      await sendEmail({
        to: bookingData.customerEmail,
        subject: titles[type],
        html,
      });
    }
  }

  return notification;
}

export async function sendAdminNotification(
  type: "new_booking" | "high_value" | "payment_failed",
  data: Record<string, any>
) {
  const supabase = await createClient();
  
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  const titles: Record<string, string> = {
    new_booking: "New Booking Received",
    high_value: "High-Value Booking Alert!",
    payment_failed: "Payment Failed Alert",
  };

  const messages: Record<string, string> = {
    new_booking: `New booking from ${data.customerName} for ${data.serviceName}`,
    high_value: `High-value booking of ₹${data.price} from ${data.customerName}`,
    payment_failed: `Payment of ₹${data.amount} failed for booking ${data.bookingId}`,
  };

  const notificationType: NotificationType = type === "new_booking"
    ? "admin_new_booking"
    : type === "high_value"
    ? "admin_high_value"
    : "admin_payment_failed";

  if (admins && admins.length > 0) {
    for (const admin of admins) {
      await sendNotification({
        userId: admin.id,
        type: notificationType,
        title: titles[type],
        message: messages[type],
        data,
        actionUrl: "/admin/bookings",
      });
    }
  }
}

export async function sendAIInsight(
  userId: string,
  insight: string,
  data?: Record<string, any>
) {
  return sendNotification({
    userId,
    type: "ai_insight",
    title: "Shashti AI Insight",
    message: insight,
    data,
    priority: "low",
  });
}

export async function sendPaymentNotification(
  userId: string | null,
  paymentData: {
    customerName: string;
    customerEmail: string;
    amount: number;
    serviceName: string;
    paymentId: string;
    bookingId: string;
  }
) {
  const notification = await sendNotification({
    userId,
    type: "payment_received",
    title: "Payment Received!",
    message: `Your payment of ₹${paymentData.amount.toLocaleString()} for ${paymentData.serviceName} has been received. Thank you!`,
    data: paymentData,
    actionUrl: `/dashboard?booking=${paymentData.bookingId}`,
  });

  if (paymentData.customerEmail) {
    const html = generatePaymentReceiptEmail({
      customerName: paymentData.customerName,
      amount: paymentData.amount,
      serviceName: paymentData.serviceName,
      paymentId: paymentData.paymentId,
      date: new Date().toLocaleDateString(),
    });

    await sendEmail({
      to: paymentData.customerEmail,
      subject: "Payment Receipt - Shashti Karz",
      html,
    });
  }

  return notification;
}
