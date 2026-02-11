-- User Vehicles Table
-- Core table for the Digital Garage feature

CREATE TABLE IF NOT EXISTS public.user_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Vehicle Information
    name TEXT NOT NULL, -- Custom name for the vehicle (e.g., "My BMW", "Daily Driver")
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    number_plate TEXT NOT NULL UNIQUE,
    color TEXT,
    vin TEXT, -- Vehicle Identification Number
    
    -- Additional Details
    car_type TEXT, -- sedan, suv, hatchback, etc.
    purchase_date DATE,
    mileage INTEGER,
    fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng')),
    transmission TEXT CHECK (transmission IN ('manual', 'automatic', 'cvt')),
    
    -- Service Tracking
    last_service_at TIMESTAMPTZ,
    next_service_at TIMESTAMPTZ,
    
    -- Metadata
    image_url TEXT,
    photo_url TEXT,
    notes TEXT,
    fleet_id UUID, -- For fleet management
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON public.user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_number_plate ON public.user_vehicles(number_plate);

-- Enable Row Level Security
ALTER TABLE public.user_vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own vehicles
DROP POLICY IF EXISTS "Users can view own vehicles" ON public.user_vehicles;
CREATE POLICY "Users can view own vehicles"
    ON public.user_vehicles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own vehicles
DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.user_vehicles;
CREATE POLICY "Users can insert own vehicles"
    ON public.user_vehicles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own vehicles
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.user_vehicles;
CREATE POLICY "Users can update own vehicles"
    ON public.user_vehicles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own vehicles
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.user_vehicles;
CREATE POLICY "Users can delete own vehicles"
    ON public.user_vehicles FOR DELETE
    USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_vehicles_updated_at ON public.user_vehicles;
CREATE TRIGGER update_user_vehicles_updated_at
    BEFORE UPDATE ON public.user_vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ user_vehicles table created successfully!';
    RAISE NOTICE '🚗 Users can now add vehicles to their Digital Garage';
END $$;
