import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServiceClient();
    
    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          channels TEXT[] DEFAULT ARRAY['in_app'],
          priority TEXT DEFAULT 'medium',
          read BOOLEAN DEFAULT false,
          read_at TIMESTAMPTZ,
          delivered_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
          action_url TEXT,
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (notificationsError) {
      const { error: createNotifError } = await supabase.from('notifications').select('id').limit(1);
      
      if (createNotifError && createNotifError.code === '42P01') {
        return NextResponse.json({ 
          error: "Cannot create tables. Please create them manually in Supabase dashboard.",
          sql: getTableSQL()
        }, { status: 500 });
      }
    }

    const { error: prefsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notification_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
          channel_email BOOLEAN DEFAULT true,
          channel_whatsapp BOOLEAN DEFAULT true,
          channel_push BOOLEAN DEFAULT true,
          channel_in_app BOOLEAN DEFAULT true,
          quiet_hours_start TIME,
          quiet_hours_end TIME,
          language TEXT DEFAULT 'en',
          marketing_enabled BOOLEAN DEFAULT true,
          booking_notifications BOOLEAN DEFAULT true,
          payment_notifications BOOLEAN DEFAULT true,
          service_notifications BOOLEAN DEFAULT true,
          promotional_notifications BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: "Notification tables created successfully",
      sql: getTableSQL()
    });
  } catch (error) {
    console.error("Error setting up notifications:", error);
    return NextResponse.json({ 
      error: "Failed to setup notification tables",
      sql: getTableSQL()
    }, { status: 500 });
  }
}

function getTableSQL() {
  return `
-- Run this SQL in Supabase SQL Editor:

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  channels TEXT[] DEFAULT ARRAY['in_app'],
  priority TEXT DEFAULT 'medium',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  delivered_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_email BOOLEAN DEFAULT true,
  channel_whatsapp BOOLEAN DEFAULT true,
  channel_push BOOLEAN DEFAULT true,
  channel_in_app BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  language TEXT DEFAULT 'en',
  marketing_enabled BOOLEAN DEFAULT true,
  booking_notifications BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  service_notifications BOOLEAN DEFAULT true,
  promotional_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create notification rules table
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  conditions JSONB DEFAULT '{}'::JSONB,
  actions JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create notification analytics table
CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(user_id, category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_notification ON notification_analytics(notification_id);

-- 7. Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  `.trim();
}

export async function GET() {
  return NextResponse.json({ sql: getTableSQL() });
}
