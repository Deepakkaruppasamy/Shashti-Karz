-- Migration: Add missing columns to user_vehicles table
-- This migration adds all missing fields to match the TypeScript UserVehicle interface

-- Add the name column (nullable first to avoid errors with existing data)
ALTER TABLE public.user_vehicles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add car_type column
ALTER TABLE public.user_vehicles 
ADD COLUMN IF NOT EXISTS car_type TEXT;

-- Add service tracking columns
ALTER TABLE public.user_vehicles 
ADD COLUMN IF NOT EXISTS last_service_at TIMESTAMPTZ;

ALTER TABLE public.user_vehicles 
ADD COLUMN IF NOT EXISTS next_service_at TIMESTAMPTZ;

-- Add metadata columns
ALTER TABLE public.user_vehicles 
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.user_vehicles 
ADD COLUMN IF NOT EXISTS fleet_id UUID;

-- Update fuel_type constraint to include 'cng'
ALTER TABLE public.user_vehicles 
DROP CONSTRAINT IF EXISTS user_vehicles_fuel_type_check;

ALTER TABLE public.user_vehicles 
ADD CONSTRAINT user_vehicles_fuel_type_check 
CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng'));

-- Update existing records to have a default name (brand + model)
UPDATE public.user_vehicles 
SET name = CONCAT(brand, ' ', model)
WHERE name IS NULL;

-- Now make the name column NOT NULL
ALTER TABLE public.user_vehicles 
ALTER COLUMN name SET NOT NULL;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed: Added missing columns to user_vehicles table';
    RAISE NOTICE '📝 Added columns: name, car_type, last_service_at, next_service_at, image_url, fleet_id';
    RAISE NOTICE '🔧 Updated fuel_type constraint to include CNG';
    RAISE NOTICE '✨ Existing vehicles have been given default names based on brand and model';
END $$;
