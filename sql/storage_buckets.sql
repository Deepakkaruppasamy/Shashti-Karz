-- Setup Supabase Storage Buckets and Policies
-- This script ensures all necessary storage buckets are created and have correct RLS policies.

-- ============================================================================
-- 1. COMMUNITY SHOWROOM (showroom-media)
-- ============================================================================
-- Create bucket for showroom posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('showroom-media', 'showroom-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Showroom Public Access" ON storage.objects;
CREATE POLICY "Showroom Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'showroom-media' );

-- Authenticated users can upload their own media
DROP POLICY IF EXISTS "Showroom Authenticated Upload" ON storage.objects;
CREATE POLICY "Showroom Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'showroom-media' AND 
    auth.role() = 'authenticated'
);

-- Users can delete their own media
DROP POLICY IF EXISTS "Showroom User Delete" ON storage.objects;
CREATE POLICY "Showroom User Delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'showroom-media' AND 
    (auth.uid())::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 2. DIGITAL GARAGE (vehicle-media)
-- ============================================================================
-- Create bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-media', 'vehicle-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Vehicle Public Access" ON storage.objects;
CREATE POLICY "Vehicle Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'vehicle-media' );

-- Authenticated users can upload their vehicle photos
DROP POLICY IF EXISTS "Vehicle Authenticated Upload" ON storage.objects;
CREATE POLICY "Vehicle Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'vehicle-media' AND 
    auth.role() = 'authenticated'
);

-- ============================================================================
-- 3. VEHICLE IMAGES (vehicle-images) - for AI diagnostics
-- ============================================================================
-- Create bucket for diagnostic and vehicle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Vehicle Images Public Access" ON storage.objects;
CREATE POLICY "Vehicle Images Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'vehicle-images' );

-- Authenticated users can upload diagnostic images
DROP POLICY IF EXISTS "Vehicle Images Authenticated Upload" ON storage.objects;
CREATE POLICY "Vehicle Images Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'vehicle-images' AND 
    auth.role() = 'authenticated'
);

-- ============================================================================
-- 4. SERVICE JOURNAL (service-media)
-- ============================================================================
-- Create bucket for service before/after photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-media', 'service-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Service Public Access" ON storage.objects;
CREATE POLICY "Service Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'service-media' );

-- Authenticated users or workers can upload service photos
DROP POLICY IF EXISTS "Service Authenticated Upload" ON storage.objects;
CREATE POLICY "Service Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'service-media' AND 
    auth.role() = 'authenticated'
);

-- ============================================================================
-- 5. AD ASSETS (ad-assets) - from ads_system.sql
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-assets', 'ad-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Ads Public Access" ON storage.objects;
CREATE POLICY "Ads Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'ad-assets' );

-- Admin only upload (Simplified for now)
DROP POLICY IF EXISTS "Ads Admin Upload" ON storage.objects;
CREATE POLICY "Ads Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'ad-assets' AND
    auth.role() = 'authenticated'
);

-- ============================================================================
-- HELPER MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Supabase Storage Buckets configured!';
    RAISE NOTICE '📦 Buckets created: showroom-media, vehicle-media, vehicle-images, service-media, ad-assets';
    RAISE NOTICE '🔐 Policies set: Public Read, Authenticated Upload';
END $$;
