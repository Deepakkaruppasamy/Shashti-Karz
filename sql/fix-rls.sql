-- SQL to fix Notifications RLS policies
-- Run this in the Supabase SQL Editor

-- 1. Enable RLS on the tables (if not already enabled)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 2. Polices for 'notifications' table

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Only systems/admins can insert notifications - but since we use service_role for insertion,
-- we don't necessarily NEED an insert policy for anon users. 
-- However, for testing, you could add:
CREATE POLICY "Service Role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- 3. Policies for 'notification_preferences' table

-- Users can view their own preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON notification_preferences;
CREATE POLICY "Users can view their own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own preferences
DROP POLICY IF EXISTS "Users can update their own preferences" ON notification_preferences;
CREATE POLICY "Users can update their own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Allow insertion of preferences on signup
DROP POLICY IF EXISTS "Users can insert their own preferences" ON notification_preferences;
CREATE POLICY "Users can insert their own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
