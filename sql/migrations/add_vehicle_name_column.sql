-- Migration: Add 'name' column to user_vehicles table
-- This migration adds the 'name' field to allow users to give custom names to their vehicles

-- Add the name column (nullable first to avoid errors with existing data)
ALTER TABLE public.user_vehicles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing records to have a default name (brand + model)
UPDATE public.user_vehicles 
SET name = CONCAT(brand, ' ', model)
WHERE name IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.user_vehicles 
ALTER COLUMN name SET NOT NULL;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed: Added name column to user_vehicles table';
    RAISE NOTICE '📝 Existing vehicles have been given default names based on brand and model';
END $$;
