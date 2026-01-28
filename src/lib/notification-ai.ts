import type { NotificationChannel, NotificationPriority, NotificationType } from "@/lib/types";

interface UserEngagementData {
  preferred_channel?: NotificationChannel;
  last_email_open?: string;
  last_whatsapp_response?: string;
  last_push_click?: string;
  avg_response_time_hours?: number;
  active_hours_start?: number;
  active_hours_end?: number;
  engagement_score?: number;
}

interface AINotificationDecision {
  recommended_channel: NotificationChannel;
  recommended_send_time: Date | null;
  should_batch: boolean;
  tone: "formal" | "friendly" | "urgent";
  confidence: number;
}

export function analyzeUserEngagement(
  engagementHistory: UserEngagementData,
  notificationType: NotificationType,
  priority: NotificationPriority
): AINotificationDecision {
  let recommendedChannel: NotificationChannel = "in_app";
  let confidence = 0.7;
  let shouldBatch = false;
  let tone: "formal" | "friendly" | "urgent" = "friendly";
  let recommendedSendTime: Date | null = null;

  if (priority === "critical") {
    recommendedChannel = "whatsapp";
    tone = "urgent";
    confidence = 0.95;
  } else if (engagementHistory.preferred_channel) {
    recommendedChannel = engagementHistory.preferred_channel;
    confidence = 0.85;
  } else {
    if (engagementHistory.last_whatsapp_response) {
      const whatsappAge = Date.now() - new Date(engagementHistory.last_whatsapp_response).getTime();
      if (whatsappAge < 7 * 24 * 60 * 60 * 1000) {
        recommendedChannel = "whatsapp";
        confidence = 0.8;
      }
    }
    
    if (engagementHistory.last_email_open) {
      const emailAge = Date.now() - new Date(engagementHistory.last_email_open).getTime();
      if (emailAge < 3 * 24 * 60 * 60 * 1000 && recommendedChannel === "in_app") {
        recommendedChannel = "email";
        confidence = 0.75;
      }
    }
  }

  if (priority === "low" || notificationType === "ai_insight" || notificationType === "promotion") {
    shouldBatch = true;
  }

  const currentHour = new Date().getHours();
  if (engagementHistory.active_hours_start !== undefined && 
      engagementHistory.active_hours_end !== undefined) {
    const isActiveHours = currentHour >= engagementHistory.active_hours_start && 
                          currentHour < engagementHistory.active_hours_end;
    
    if (!isActiveHours && priority !== "critical") {
      recommendedSendTime = new Date();
      recommendedSendTime.setHours(engagementHistory.active_hours_start, 0, 0, 0);
      if (recommendedSendTime < new Date()) {
        recommendedSendTime.setDate(recommendedSendTime.getDate() + 1);
      }
    }
  } else {
    if ((currentHour < 9 || currentHour > 21) && priority !== "critical") {
      recommendedSendTime = new Date();
      recommendedSendTime.setHours(10, 0, 0, 0);
      if (recommendedSendTime < new Date()) {
        recommendedSendTime.setDate(recommendedSendTime.getDate() + 1);
      }
    }
  }

  if (notificationType === "payment_received" || notificationType === "invoice_generated") {
    tone = "formal";
  } else if (priority === "critical" || notificationType.includes("failed")) {
    tone = "urgent";
  } else if (notificationType === "promotion" || notificationType === "ai_insight") {
    tone = "friendly";
  }

  return {
    recommended_channel: recommendedChannel,
    recommended_send_time: recommendedSendTime,
    should_batch: shouldBatch,
    tone,
    confidence,
  };
}

export function shouldSendNow(
  decision: AINotificationDecision,
  priority: NotificationPriority
): boolean {
  if (priority === "critical" || priority === "high") {
    return true;
  }
  
  if (decision.recommended_send_time && decision.recommended_send_time > new Date()) {
    return false;
  }
  
  return true;
}

export function generateSmartMessage(
  template: string,
  tone: "formal" | "friendly" | "urgent",
  variables: Record<string, string>
): string {
  let message = template;
  
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  
  const toneModifiers: Record<string, { prefix?: string; suffix?: string }> = {
    formal: { prefix: "Dear Customer, ", suffix: " Thank you for your business." },
    friendly: { prefix: "Hey! ", suffix: " 🚗✨" },
    urgent: { prefix: "⚠️ URGENT: ", suffix: " Please take action immediately." },
  };
  
  const modifier = toneModifiers[tone];
  if (modifier) {
    if (modifier.prefix && !message.startsWith(modifier.prefix)) {
    }
    if (modifier.suffix && !message.endsWith(modifier.suffix)) {
    }
  }
  
  return message;
}

export function predictOptimalSendTime(
  userTimezone: string = "Asia/Kolkata",
  engagementHistory?: UserEngagementData
): Date {
  const now = new Date();
  const optimalHour = engagementHistory?.active_hours_start || 10;
  
  const sendTime = new Date();
  sendTime.setHours(optimalHour, 0, 0, 0);
  
  if (sendTime < now) {
    sendTime.setDate(sendTime.getDate() + 1);
  }
  
  return sendTime;
}

export function calculateNotificationScore(
  notification: {
    type: NotificationType;
    priority: NotificationPriority;
    channels: NotificationChannel[];
  },
  userPreferences: {
    channel_email: boolean;
    channel_whatsapp: boolean;
    channel_push: boolean;
  }
): number {
  let score = 50;
  
  if (notification.priority === "critical") score += 40;
  else if (notification.priority === "high") score += 25;
  else if (notification.priority === "medium") score += 10;
  
  const matchingChannels = notification.channels.filter(ch => {
    if (ch === "email" && userPreferences.channel_email) return true;
    if (ch === "whatsapp" && userPreferences.channel_whatsapp) return true;
    if (ch === "push" && userPreferences.channel_push) return true;
    if (ch === "in_app") return true;
    return false;
  });
  
  score += (matchingChannels.length / notification.channels.length) * 20;
  
  return Math.min(100, Math.max(0, score));
}
