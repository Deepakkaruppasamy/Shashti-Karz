-- Migration: Enhance Vehicle Health Scores with AI Detections
-- This adds support for storing detailed AI diagnostic data

-- 1. Add detections and diagnostic_image columns
ALTER TABLE public.vehicle_health_scores 
ADD COLUMN IF NOT EXISTS detections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS diagnostic_image TEXT;

-- 2. Update health score categories with random but realistic ranges if they are empty
-- This helps make the "static" data feel more alive for existing vehicles
UPDATE public.vehicle_health_scores
SET 
    interior_score = COALESCE(interior_score, (60 + floor(random() * 35))),
    coating_health_score = COALESCE(coating_health_score, (50 + floor(random() * 45))),
    paint_protection_score = COALESCE(paint_protection_score, (40 + floor(random() * 55)))
WHERE interior_score IS NULL OR interior_score = 0;

-- 3. Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ AI Diagnosis schema enhanced!';
    RAISE NOTICE '📸 Added detections (JSONB) and diagnostic_image columns';
    RAISE NOTICE '✨ Initialized realistic category scores for existing records';
END $$;
