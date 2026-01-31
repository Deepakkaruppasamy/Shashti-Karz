export interface Service {
  id: string;
  name: string;
  short_desc: string;
  description: string;
  price: number;
  duration: string;
  rating: number;
  ai_rating: number;
  image: string;
  steps: string[];
  benefits: string[];
  popular: boolean;
  premium: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarType {
  id: string;
  name: string;
  price_multiplier: number;
}

export interface Profile {
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
  updated_at: string;
}

export interface UserCar {
  id: string;
  user_id: string;
  name: string;
  car_type: string;
  number_plate: string;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_id: string;
  user_id: string | null;
  service_id: string;
  car_type: string;
  car_model: string;
  date: string;
  time: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  price: number;
  status: "pending" | "approved" | "in_progress" | "completed" | "cancelled";
  assigned_worker_id?: string | null;
  worker_visibility_approved?: boolean;
  payment_status?: "pending" | "paid" | "refunded";
  payment_id?: string | null;
  payment_method?: string | null;
  invoice_url?: string | null;
  created_at: string;
  updated_at: string;
  service?: Service;
  worker?: Worker;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  skills: string[];
  status: "active" | "inactive";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIChatMessage {
  id: string;
  user_id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  context?: any;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  metric_name: string;
  metric_value: number;
  dimensions: any;
  recorded_at: string;
}

export interface Review {
  id: string;
  user_id: string | null;
  booking_id: string | null;
  service_id?: string | null;
  name: string;
  car: string;
  rating: number;
  comment: string;
  service: string;
  avatar: string;
  approved: boolean;
  sentiment_score?: number;
  sentiment_label?: string;
  ai_metadata?: any;
  is_repeat_customer?: boolean;
  is_verified?: boolean;
  recommend?: boolean;
  flagged?: boolean;
  abuse_score?: number;
  admin_response?: string | null;
  replied_at?: string | null;
  feedback_category?: "service" | "app" | "staff" | "other";
  is_private?: boolean;
  created_at: string;
}

export interface ServiceAIStats {
  id: string;
  service_id: string;
  weighted_rating: number;
  confidence_level: "High" | "Medium" | "Low";
  total_reviews: number;
  sentiment_summary: any;
  trend_indicator: string;
  last_calculated_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  before_image: string;
  after_image: string;
  service: string;
  active: boolean;
  created_at: string;
}

export interface Offer {
  id: string;
  title: string;
  discount: string;
  description: string;
  valid_till: string;
  code: string;
  active: boolean;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
}

export interface BusinessSettings {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours_weekdays: string;
  hours_saturday: string;
  hours_sunday: string;
  instagram: string;
  facebook: string;
  youtube: string;
}

export interface LoyaltyPoints {
  id: string;
  user_id: string;
  points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  total_spent: number;
  total_bookings: number;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  booking_id: string | null;
  points: number;
  type: "earned" | "redeemed" | "referral" | "bonus" | "expired";
  description: string;
  created_at: string;
}

export interface ServiceTracking {
  id: string;
  booking_id: string;
  stage: "received" | "inspection" | "washing" | "detailing" | "polishing" | "coating" | "drying" | "quality_check" | "ready" | "delivered";
  status: "pending" | "in_progress" | "completed";
  notes: string | null;
  image_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface VideoTestimonial {
  id: string;
  user_id: string | null;
  name: string;
  car: string;
  service: string;
  video_url: string;
  thumbnail_url: string;
  rating: number;
  quote: string;
  approved: boolean;
  featured: boolean;
  created_at: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  tier: "basic" | "premium" | "ultimate";
  price: number;
  duration: string;
  features: string[];
  services: string[];
  popular: boolean;
  created_at: string;
}

export interface PriceModifier {
  id: string;
  car_type: string;
  multiplier: number;
  addon_name: string | null;
  addon_price: number;
  created_at: string;
}

export type NotificationType =
  | "booking_created"
  | "booking_approved"
  | "worker_assigned"
  | "service_started"
  | "service_completed"
  | "invoice_generated"
  | "refund_initiated"
  | "reminder"
  | "payment_received"
  | "admin_new_booking"
  | "admin_high_value"
  | "admin_payment_failed"
  | "admin_daily_summary"
  | "system_alert"
  | "ai_insight"
  | "promotion";

export type NotificationChannel = "in_app" | "email" | "whatsapp" | "push";
export type NotificationPriority = "low" | "medium" | "high" | "critical";
export type NotificationCategory = "booking" | "payment" | "service" | "promotion" | "system" | "insight";

export interface Notification {
  id: string;
  user_id: string | null;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Record<string, any> | null;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  read: boolean;
  read_at: string | null;
  delivered_channels: NotificationChannel[];
  action_url: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  channel_email: boolean;
  channel_whatsapp: boolean;
  channel_push: boolean;
  channel_in_app: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  language: string;
  marketing_enabled: boolean;
  booking_notifications: boolean;
  payment_notifications: boolean;
  service_notifications: boolean;
  promotional_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title_template: string;
  body_template: string;
  variables: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  event_type: NotificationType;
  conditions: Record<string, any>;
  actions: {
    channels: NotificationChannel[];
    priority: NotificationPriority;
    delay_minutes?: number;
  };
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationAnalytics {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  delivered: boolean;
  delivered_at: string | null;
  opened: boolean;
  opened_at: string | null;
  clicked: boolean;
  clicked_at: string | null;
  error: string | null;
  created_at: string;
}

export interface UserVehicle {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vin: string | null;
  number_plate: string | null;
  car_type: string | null;
  fuel_type: string | null;
  last_service_at: string | null;
  next_service_at: string | null;
  notes: string | null;
  image_url: string | null;
  fleet_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_occupancy: number;
  is_blocked: boolean;
  reason: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  code: string;
  status: "pending" | "completed" | "rewarded";
  reward_amount: number;
  created_at: string;
}

export interface PricingRule {
  id: string;
  name: string;
  rule_type: "peak_hour" | "weather" | "weekend" | "high_demand";
  modifier_type: "percentage" | "fixed";
  modifier_value: number;
  conditions: Record<string, any>;
  active: boolean;
  created_at: string;
}

export interface FleetAccount {
  id: string;
  owner_id: string;
  company_name: string;
  tax_id: string | null;
  billing_address: string | null;
  contact_phone: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  current_stock: number;
  min_stock_threshold: number;
  cost_per_unit: number;
  last_restocked_at: string | null;
  created_at: string;
}

export interface ServiceInventoryUsage {
  id: string;
  booking_id: string;
  item_id: string;
  quantity_used: number;
  cost_at_time: number | null;
  created_at: string;
}

// Dinesh Voice Assistant Types
export interface SupportRequest {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  category: "navigation" | "service_info" | "booking_help" | "technical" | "general" | "other";
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  admin_response: string | null;
  admin_responder_id: string | null;
  responded_at: string | null;
  resolved_at: string | null;
  conversation_history: ConversationMessage[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  sender: "customer" | "admin" | "system";
  message: string;
  timestamp: string;
}

export interface CustomerFeedbackDinesh {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  feedback_type: "feature_request" | "bug_report" | "compliment" | "complaint" | "suggestion" | "other";
  category: "website" | "booking" | "service" | "payment" | "communication" | "voice_assistant" | "other" | null;
  rating: number | null;
  message: string;
  satisfaction_score: number | null;
  would_recommend: boolean;
  status: "new" | "reviewed" | "acknowledged" | "implemented" | "closed";
  admin_notes: string | null;
  admin_reviewer_id: string | null;
  reviewed_at: string | null;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface DineshInteraction {
  id: string;
  session_id: string;
  user_id: string | null;
  interaction_type: "navigation" | "service_query" | "booking" | "support" | "feedback" | "general";
  user_query: string;
  assistant_response: string;
  intent_detected: string | null;
  confidence_score: number | null;
  was_helpful: boolean | null;
  duration_seconds: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SupportRequestAttachment {
  id: string;
  support_request_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface VoiceAssistantContext {
  sessionId: string;
  userId: string | null;
  userName: string | null;
  currentPage: string;
  previousQueries: string[];
  isListening: boolean;
  isSpeaking: boolean;
}

export interface VoiceSettings {
  voiceGender: "male" | "female"; // Dinesh or Deepika
  voiceName: string; // Browser voice name
  speechRate: number; // 0.5 to 2.0
  pitch: number; // 0 to 2.0
  language: "en-US" | "ta-IN" | "hi-IN"; // English, Tamil, Hindi
  soundEffectsEnabled: boolean;
}

export interface Ad {
  id: string;
  title: string;
  description?: string;
  media_url?: string;
  media_type: 'video' | 'image';
  thumbnail_url?: string;
  target_url?: string;
  position: string;
  status: 'active' | 'draft' | 'scheduled' | 'archived';
  start_date?: string;
  end_date?: string;
  priority: number;
  impressions: number;
  clicks: number;
  metadata?: any;
  created_at: string;
}

export interface AdminPulseEvent {
  id: string;
  type: "interaction" | "support_request" | "feedback";
  timestamp: Date;
  user_name: string;
  query?: string;
  category?: string;
  priority?: string;
  status?: string;
}
