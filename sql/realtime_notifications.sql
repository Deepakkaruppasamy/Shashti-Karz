-- SQL Migration to set up Real-Time Notifications and Email Queue
-- This script ensures that every major action (New Profile, New Booking) 
-- is captured and can trigger an email, making it truly "real-time".

-- 1. Create a notification queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- 2. Add a trigger to profiles for Welcome Emails
CREATE OR REPLACE FUNCTION public.handle_new_profile_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_queue (recipient, subject, html_content)
    VALUES (
        NEW.email,
        'Welcome to Shashti Karz!',
        '<h1>Welcome, ' || COALESCE(NEW.full_name, 'Valued Customer') || '!</h1><p>Your account has been successfully initialized. Access your dashboard at: https://shashti-karz.vercel.app/dashboard</p>'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_email ON public.profiles;
CREATE TRIGGER on_profile_created_email
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_notification();

-- 3. Add a trigger to bookings for Confirmation Emails
CREATE OR REPLACE FUNCTION public.handle_new_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_queue (recipient, subject, html_content)
    VALUES (
        NEW.customer_email,
        'Booking Confirmed - Shashti Karz',
        '<h1>Booking Confirmed!</h1><p>Hi ' || NEW.customer_name || ', your booking for ' || NEW.service_name || ' on ' || NEW.date || ' at ' || NEW.time || ' is confirmed.</p>'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_created_email ON public.bookings;
CREATE TRIGGER on_booking_created_email
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.handle_new_booking_notification();

-- 4. Enable Realtime on the notifications table for instant UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER TABLE notifications REPLICA IDENTITY FULL;
