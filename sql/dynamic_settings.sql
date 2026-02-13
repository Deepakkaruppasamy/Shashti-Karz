-- 1. App Settings (Key-Value Store for Business Info & Configs)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Ensure columns exist
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS value JSONB;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);


-- 2. Service Packages
CREATE TABLE IF NOT EXISTS service_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FIX: Ensure ID is TEXT (It might have been UUID in a previous version)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'service_packages' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_pkey CASCADE;
        ALTER TABLE service_packages ALTER COLUMN id TYPE TEXT;
        ALTER TABLE service_packages ADD PRIMARY KEY (id);
    END IF;
END $$;

-- FIX: Handle legacy 'tier' column constraint
-- The 'tier' column exists in legacy table but is not used in new schema. We must make it nullable.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_packages' AND column_name = 'tier') THEN
        ALTER TABLE service_packages ALTER COLUMN tier DROP NOT NULL;
        ALTER TABLE service_packages ALTER COLUMN tier SET DEFAULT NULL;
    END IF;
END $$;


-- Add all potential missing columns
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS short_desc TEXT;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 5.0;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS ai_rating INTEGER DEFAULT 90;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS steps TEXT[];
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS benefits TEXT[];
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;


-- 3. Active Offers
CREATE TABLE IF NOT EXISTS active_offers (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns
ALTER TABLE active_offers ADD COLUMN IF NOT EXISTS discount TEXT;
ALTER TABLE active_offers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE active_offers ADD COLUMN IF NOT EXISTS valid_till TEXT;
ALTER TABLE active_offers ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE active_offers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add unique constraint to code if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'active_offers_code_key') THEN
        ALTER TABLE active_offers ADD CONSTRAINT active_offers_code_key UNIQUE (code);
    END IF;
END $$;


-- 4. Car Types & Multipliers
CREATE TABLE IF NOT EXISTS car_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- FIX: Ensure ID is TEXT for car_types as well
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'car_types' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE car_types DROP CONSTRAINT IF EXISTS car_types_pkey CASCADE;
        ALTER TABLE car_types ALTER COLUMN id TYPE TEXT;
        ALTER TABLE car_types ADD PRIMARY KEY (id);
    END IF;
END $$;


-- Add columns
ALTER TABLE car_types ADD COLUMN IF NOT EXISTS price_multiplier DECIMAL(3, 2) DEFAULT 1.00;
ALTER TABLE car_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;


-- RLS Policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_types ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings/services
DROP POLICY IF EXISTS "Public read access for app_settings" ON app_settings;
CREATE POLICY "Public read access for app_settings" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for service_packages" ON service_packages;
CREATE POLICY "Public read access for service_packages" ON service_packages FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Public read access for active_offers" ON active_offers;
CREATE POLICY "Public read access for active_offers" ON active_offers FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Public read access for car_types" ON car_types;
CREATE POLICY "Public read access for car_types" ON car_types FOR SELECT USING (true);

-- Only admins can update
DROP POLICY IF EXISTS "Admins can update app_settings" ON app_settings;
CREATE POLICY "Admins can update app_settings" ON app_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update service_packages" ON service_packages;
CREATE POLICY "Admins can update service_packages" ON service_packages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update active_offers" ON active_offers;
CREATE POLICY "Admins can update active_offers" ON active_offers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update car_types" ON car_types;
CREATE POLICY "Admins can update car_types" ON car_types FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);


-- Enable Realtime (Safe Operations)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_packages;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE active_offers;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE car_types;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
  END;
END $$;


-- DATA SEEDING (Using ON CONFLICT to avoid errors)

-- Insert default business info
INSERT INTO app_settings (key, value, description) VALUES
('business_info', '{
  "name": "Shashti Karz",
  "tagline": "Car Detailing Xpert",
  "address": "Avinashi Road, Tirupur, Tamil Nadu 641652",
  "phone": "+91 98765 43210",
  "whatsapp": "+919876543210",
  "email": "info@shashtikarz.com",
  "hours": {
    "weekdays": "9:00 AM - 7:00 PM",
    "saturday": "9:00 AM - 6:00 PM",
    "sunday": "10:00 AM - 4:00 PM"
  },
  "social": {
    "instagram": "https://instagram.com/shashtikarz",
    "facebook": "https://facebook.com/shashtikarz",
    "youtube": "https://youtube.com/@shashtikarz"
  }
}'::jsonb, 'General business contact and display information')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert default services
INSERT INTO service_packages (id, name, short_desc, description, price, duration, rating, ai_rating, image_url, steps, benefits, is_popular, is_premium, sort_order) VALUES
('exterior-detailing', 'Exterior Detailing', 'Complete exterior transformation', 'Professional hand wash, clay bar treatment, paint correction, and premium wax application for a showroom-worthy finish.', 2499, '3-4 hours', 4.9, 95, 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800', 
 ARRAY['Pre-wash foam application', 'Two-bucket hand wash method', 'Clay bar decontamination', 'Paint correction polish', 'Premium carnauba wax', 'Tire & trim dressing'], 
 ARRAY['Removes swirl marks & scratches', 'UV protection for paint', 'Hydrophobic finish', '3-month shine guarantee'], false, false, 1),

('interior-detailing', 'Interior Detailing', 'Deep clean your cabin', 'Complete interior restoration including deep vacuum, steam cleaning, leather conditioning, and odor elimination.', 1999, '2-3 hours', 4.8, 92, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', 
 ARRAY['Complete vacuum & debris removal', 'Steam cleaning all surfaces', 'Leather cleaning & conditioning', 'Dashboard & console detailing', 'Glass cleaning inside', 'Air freshener application'], 
 ARRAY['Eliminates bacteria & allergens', 'Restores leather suppleness', 'Removes stubborn stains', 'Fresh cabin smell'], false, false, 2),

('full-detailing', 'Full Detailing', 'Complete inside-out makeover', 'Our signature package combining exterior and interior detailing for a complete vehicle transformation.', 3999, '5-6 hours', 5.0, 98, 'https://content.jdmagicbox.com/v2/comp/tirupur/i7/9999px421.x421.250820151543.f4i7/catalogue/shashti-karz-detailingxpert-avanashi-car-repair-and-services-tozgssaip5.jpg', 
 ARRAY['Full exterior wash & decontamination', 'Paint correction & polish', 'Premium wax application', 'Complete interior deep clean', 'Leather/fabric treatment', 'Engine bay quick clean', 'Final inspection & quality check'], 
 ARRAY['Best value package', 'Complete transformation', 'Inside-out perfection', '6-month protection guarantee'], true, false, 3),

('ceramic-coating', 'Ceramic Coating', 'Ultimate paint protection', '9H ceramic coating application providing years of protection with incredible gloss and hydrophobic properties.', 15999, '1-2 days', 5.0, 99, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800', 
 ARRAY['Complete paint decontamination', 'Multi-stage paint correction', 'IPA wipedown', '9H ceramic coating application', 'IR curing process', '24-hour cure time', 'Final inspection'], 
 ARRAY['5-year protection', 'Extreme hydrophobic effect', 'UV & chemical resistance', 'Self-cleaning properties'], false, true, 4),

('ppf', 'Paint Protection Film', 'Invisible armor for your paint', 'Self-healing PPF installation protecting your vehicle from rock chips, scratches, and environmental damage.', 25999, '2-3 days', 5.0, 97, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800', 
 ARRAY['Surface preparation & cleaning', 'Computer-cut film templates', 'Precision PPF installation', 'Edge sealing & finishing', 'Heat gun conforming', 'Quality inspection'], 
 ARRAY['Self-healing technology', '10-year warranty', 'Invisible protection', 'Maintains resale value'], false, true, 5),

('paint-correction', 'Paint Correction', 'Remove swirls & scratches', 'Multi-stage machine polishing to remove swirl marks, scratches, and oxidation, restoring paint to factory finish.', 5999, '6-8 hours', 4.9, 94, 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800', 
 ARRAY['Paint thickness measurement', 'Wash & decontamination', 'Compound cutting stage', 'Polish refining stage', 'Finishing polish', 'IPA wipedown & inspection'], 
 ARRAY['Removes 90% of defects', 'Mirror-like finish', 'Prepares for coating', 'Professional grade results'], false, false, 6),

('engine-bay', 'Engine Bay Cleaning', 'Under the hood perfection', 'Safe and thorough engine bay cleaning and dressing for a show-quality engine compartment.', 1499, '1-2 hours', 4.7, 88, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800', 
 ARRAY['Cover sensitive electronics', 'Degrease application', 'Agitation & scrubbing', 'Pressure rinse', 'Blow dry', 'Plastic & rubber dressing'], 
 ARRAY['Easier maintenance', 'Spot leaks early', 'Increases resale value', 'Professional appearance'], false, false, 7),

('headlight-restoration', 'Headlight Restoration', 'Crystal clear visibility', 'Professional headlight restoration removing oxidation and yellowing for improved visibility and appearance.', 999, '1 hour', 4.8, 91, 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800', 
 ARRAY['Masking surrounding areas', 'Wet sanding progression', 'Compound polishing', 'Fine polish', 'UV sealant application'], 
 ARRAY['Improved night visibility', 'Better appearance', 'Pass vehicle inspection', 'UV protection included'], false, false, 8),

('wheel-tire', 'Wheel & Tire Detailing', 'Complete wheel makeover', 'Deep cleaning of wheels, tires, and wheel wells with protection and dressing application.', 799, '1 hour', 4.7, 89, 'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=800', 
 ARRAY['Wheel well cleaning', 'Brake dust removal', 'Iron fallout treatment', 'Tire cleaning', 'Wheel sealant application', 'Tire dressing'], 
 ARRAY['Removes brake dust buildup', 'Protects wheel finish', 'Long-lasting tire shine', 'Complete wheel refresh'], false, false, 9),

('express-wash', 'Express Wash', 'Quick professional clean', 'Fast yet thorough hand wash for busy professionals who need their car looking great quickly.', 499, '30-45 mins', 4.6, 85, 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800', 
 ARRAY['Pre-rinse', 'Foam cannon application', 'Hand wash', 'Rinse & dry', 'Quick interior vacuum', 'Glass cleaning'], 
 ARRAY['Quick turnaround', 'Affordable pricing', 'Hand wash quality', 'Perfect for maintenance'], false, false, 10)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  short_desc = EXCLUDED.short_desc,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  rating = EXCLUDED.rating,
  ai_rating = EXCLUDED.ai_rating,
  image_url = EXCLUDED.image_url,
  steps = EXCLUDED.steps,
  benefits = EXCLUDED.benefits,
  is_popular = EXCLUDED.is_popular,
  is_premium = EXCLUDED.is_premium,
  sort_order = EXCLUDED.sort_order;

INSERT INTO active_offers (title, discount, description, valid_till, code) VALUES
('New Year Special', '20% OFF', 'On all ceramic coating packages', '31 Jan 2026', 'NEWYEAR20'),
('First Service Offer', '15% OFF', 'For first-time customers', '28 Feb 2026', 'FIRST15'),
('Loyalty Bonus', 'FREE', 'Interior detailing with full package', 'Ongoing', 'LOYAL2026')
ON CONFLICT (code) DO NOTHING;

INSERT INTO car_types (id, name, price_multiplier, sort_order) VALUES
('hatchback', 'Hatchback', 1.0, 1),
('sedan', 'Sedan', 1.0, 2),
('suv', 'SUV / MUV', 1.3, 3),
('luxury', 'Luxury Car', 1.5, 4),
('supercar', 'Supercar / Sports', 2.0, 5)
ON CONFLICT (id) DO UPDATE SET
  price_multiplier = EXCLUDED.price_multiplier,
  sort_order = EXCLUDED.sort_order;
