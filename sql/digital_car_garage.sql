-- Digital Car Garage & Service Journal System
-- Comprehensive vehicle service tracking and digital documentation

-- ============================================================================
-- 1. SERVICE JOURNAL ENTRIES
-- ============================================================================
-- Detailed journal entries for each service with before/after photos
CREATE TABLE IF NOT EXISTS service_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES user_vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Service Details
    service_name TEXT NOT NULL,
    service_type TEXT, -- detailing, coating, wash, etc.
    service_category TEXT, -- interior, exterior, engine, etc.
    
    -- Documentation
    worker_notes TEXT,
    customer_notes TEXT,
    before_photos TEXT[], -- Array of image URLs
    after_photos TEXT[], -- Array of image URLs
    
    -- Service Metadata
    mileage INTEGER,
    service_date DATE NOT NULL,
    service_duration_hours DECIMAL(4, 2),
    products_used TEXT[], -- Array of product names
    
    -- Quality Metrics
    quality_rating DECIMAL(3, 2) CHECK (quality_rating >= 0 AND quality_rating <= 5),
    worker_id UUID REFERENCES workers(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. MAINTENANCE REMINDERS
-- ============================================================================
-- Predictive maintenance alerts based on usage and history
CREATE TABLE IF NOT EXISTS vehicle_maintenance_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES user_vehicles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Reminder Details
    reminder_type TEXT NOT NULL, -- coating_renewal, wax, wash, inspection, etc.
    title TEXT NOT NULL,
    description TEXT,
    
    -- Scheduling
    due_date DATE,
    due_mileage INTEGER,
    recurrence_interval TEXT, -- monthly, quarterly, yearly, custom
    recurrence_interval_days INTEGER,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed', 'overdue')),
    completed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    
    -- Notifications
    notify_days_before INTEGER DEFAULT 7,
    last_notified_at TIMESTAMPTZ,
    
    -- Metadata
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_cost DECIMAL(10, 2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. SERVICE CERTIFICATES
-- ============================================================================
-- Digital certificates for premium services with QR verification
CREATE TABLE IF NOT EXISTS service_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES user_vehicles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Certificate Details
    service_name TEXT NOT NULL,
    service_type TEXT NOT NULL, -- ceramic_coating, ppf, glass_coating, etc.
    certificate_type TEXT DEFAULT 'service_warranty' CHECK (certificate_type IN ('service_warranty', 'quality_guarantee', 'authenticity')),
    
    -- Warranty Information
    warranty_period_months INTEGER,
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE NOT NULL,
    warranty_terms TEXT,
    
    -- Service Details
    products_applied TEXT[],
    application_method TEXT,
    curing_time_hours INTEGER,
    before_photos TEXT[],
    after_photos TEXT[],
    
    -- Verification
    qr_code_url TEXT, -- QR code for verification
    verification_hash TEXT UNIQUE, -- For blockchain-style verification
    digital_signature TEXT, -- Admin signature
    signed_by UUID REFERENCES auth.users(id),
    signed_at TIMESTAMPTZ,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'voided')),
    voided_reason TEXT,
    voided_at TIMESTAMPTZ,
    
    -- PDF Generation
    pdf_url TEXT, -- Generated PDF certificate
    pdf_generated_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. VEHICLE HEALTH SCORES
-- ============================================================================
-- AI-driven health scoring based on service history
CREATE TABLE IF NOT EXISTS vehicle_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES user_vehicles(id) ON DELETE CASCADE,
    
    -- Overall Health
    overall_score DECIMAL(5, 2) CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Category Scores
    exterior_score DECIMAL(5, 2) CHECK (exterior_score >= 0 AND exterior_score <= 100),
    interior_score DECIMAL(5, 2) CHECK (interior_score >= 0 AND interior_score <= 100),
    coating_health_score DECIMAL(5, 2) CHECK (coating_health_score >= 0 AND coating_health_score <= 100),
    paint_protection_score DECIMAL(5, 2) CHECK (paint_protection_score >= 0 AND paint_protection_score <= 100),
    
    -- Maintenance Compliance
    maintenance_compliance_score DECIMAL(5, 2) CHECK (maintenance_compliance_score >= 0 AND maintenance_compliance_score <= 100),
    days_since_last_service INTEGER,
    overdue_services INTEGER DEFAULT 0,
    
    -- Service Frequency
    total_services INTEGER DEFAULT 0,
    services_last_year INTEGER DEFAULT 0,
    average_service_interval_days INTEGER,
    
    -- Spending
    total_spent DECIMAL(10, 2) DEFAULT 0,
    spent_last_year DECIMAL(10, 2) DEFAULT 0,
    
    -- Recommendations
    recommendations TEXT[],
    urgent_attention_needed BOOLEAN DEFAULT false,
    
    -- Calculation Metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    calculation_method TEXT DEFAULT 'v1',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_service_journal_vehicle ON service_journal_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_journal_booking ON service_journal_entries(booking_id);
CREATE INDEX IF NOT EXISTS idx_service_journal_user ON service_journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_service_journal_date ON service_journal_entries(service_date DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_vehicle ON vehicle_maintenance_reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_user ON vehicle_maintenance_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_status ON vehicle_maintenance_reminders(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_due_date ON vehicle_maintenance_reminders(due_date);

CREATE INDEX IF NOT EXISTS idx_certificates_vehicle ON service_certificates(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON service_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON service_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON service_certificates(status);

CREATE INDEX IF NOT EXISTS idx_health_scores_vehicle ON vehicle_health_scores(vehicle_id);

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

-- Service Journal Entries
ALTER TABLE service_journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service journal entries"
    ON service_journal_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service journal entries"
    ON service_journal_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service journal entries"
    ON service_journal_entries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all service journal entries"
    ON service_journal_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Maintenance Reminders
ALTER TABLE vehicle_maintenance_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maintenance reminders"
    ON vehicle_maintenance_reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own maintenance reminders"
    ON vehicle_maintenance_reminders FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all maintenance reminders"
    ON vehicle_maintenance_reminders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Service Certificates
ALTER TABLE service_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active certificates for verification"
    ON service_certificates FOR SELECT
    USING (status = 'active');

CREATE POLICY "Users can view their own certificates"
    ON service_certificates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certificates"
    ON service_certificates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Vehicle Health Scores
ALTER TABLE vehicle_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicle health scores"
    ON vehicle_health_scores FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_vehicles
            WHERE user_vehicles.id = vehicle_health_scores.vehicle_id
            AND user_vehicles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all vehicle health scores"
    ON vehicle_health_scores FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Function to auto-create journal entry when booking is completed
CREATE OR REPLACE FUNCTION create_service_journal_entry_from_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create journal entry when booking status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        INSERT INTO service_journal_entries (
            vehicle_id,
            booking_id,
            user_id,
            service_name,
            service_date,
            worker_id
        )
        SELECT 
            uv.id,
            NEW.id,
            NEW.user_id,
            s.name,
            NEW.date::DATE,
            NEW.assigned_worker_id
        FROM user_vehicles uv
        CROSS JOIN services s
        WHERE uv.user_id = NEW.user_id
          AND s.id = NEW.service_id
          AND (uv.name ILIKE '%' || NEW.car_model || '%' 
               OR uv.number_plate = NEW.car_model)
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto journal entry creation
DROP TRIGGER IF EXISTS trigger_create_journal_entry ON bookings;
CREATE TRIGGER trigger_create_journal_entry
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_service_journal_entry_from_booking();

-- Function to calculate vehicle health score
CREATE OR REPLACE FUNCTION calculate_vehicle_health_score(p_vehicle_id UUID)
RETURNS TABLE(
    overall_score DECIMAL,
    exterior_score DECIMAL,
    interior_score DECIMAL,
    maintenance_compliance DECIMAL,
    total_services BIGINT,
    total_spent NUMERIC
) AS $$
DECLARE
    v_total_services BIGINT;
    v_total_spent NUMERIC;
    v_days_since_last INTEGER;
    v_overdue_services INTEGER;
    v_compliance_score DECIMAL;
    v_service_frequency_score DECIMAL;
    v_overall_score DECIMAL;
BEGIN
    -- Get total services
    SELECT COUNT(*), COALESCE(SUM(price), 0)
    INTO v_total_services, v_total_spent
    FROM service_journal_entries sje
    WHERE sje.vehicle_id = p_vehicle_id;
    
    -- Days since last service
    SELECT COALESCE(EXTRACT(DAY FROM NOW() - MAX(service_date)), 999)::INTEGER
    INTO v_days_since_last
    FROM service_journal_entries
    WHERE vehicle_id = p_vehicle_id;
    
    -- Overdue services count
    SELECT COUNT(*)::INTEGER
    INTO v_overdue_services
    FROM vehicle_maintenance_reminders
    WHERE vehicle_id = p_vehicle_id
      AND status = 'overdue';
    
    -- Compliance score (0-100)
    v_compliance_score := GREATEST(0, 100 - (v_overdue_services * 20));
    
    -- Service frequency score
    IF v_days_since_last < 30 THEN
        v_service_frequency_score := 100;
    ELSIF v_days_since_last < 60 THEN
        v_service_frequency_score := 80;
    ELSIF v_days_since_last < 90 THEN
        v_service_frequency_score := 60;
    ELSIF v_days_since_last < 180 THEN
        v_service_frequency_score := 40;
    ELSE
        v_service_frequency_score := 20;
    END IF;
    
    -- Overall score (weighted average)
    v_overall_score := (
        (v_compliance_score * 0.6) + 
        (v_service_frequency_score * 0.4)
    );
    
    -- Return results
    RETURN QUERY SELECT
        v_overall_score,
        v_service_frequency_score,
        v_service_frequency_score,
        v_compliance_score,
        v_total_services,
        v_total_spent;
END;
$$ LANGUAGE plpgsql;

-- Function to update overdue reminders
CREATE OR REPLACE FUNCTION update_overdue_reminders()
RETURNS void AS $$
BEGIN
    UPDATE vehicle_maintenance_reminders
    SET status = 'overdue'
    WHERE status = 'active'
      AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT := 'SK-CERT';
    v_year TEXT := TO_CHAR(NOW(), 'YY');
    v_sequence TEXT;
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) + 1 INTO v_count
    FROM service_certificates
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    v_sequence := LPAD(v_count::TEXT, 6, '0');
    
    RETURN v_prefix || '-' || v_year || '-' || v_sequence;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. SCHEDULED JOBS (Run via cron or external scheduler)
-- ============================================================================
-- Create a function to check and notify upcoming reminders
CREATE OR REPLACE FUNCTION process_maintenance_reminders()
RETURNS TABLE(
    reminder_id UUID,
    vehicle_name TEXT,
    user_email TEXT,
    reminder_title TEXT,
    days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vmr.id,
        uv.name,
        p.email,
        vmr.title,
        (vmr.due_date - CURRENT_DATE)::INTEGER
    FROM vehicle_maintenance_reminders vmr
    JOIN user_vehicles uv ON uv.id = vmr.vehicle_id
    JOIN profiles p ON p.id = vmr.user_id
    WHERE vmr.status = 'active'
      AND vmr.due_date - CURRENT_DATE <= vmr.notify_days_before
      AND (vmr.last_notified_at IS NULL 
           OR vmr.last_notified_at < CURRENT_DATE - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to add sample data

/*
-- Sample service journal entry
INSERT INTO service_journal_entries (vehicle_id, user_id, service_name, service_type, service_category, worker_notes, service_date)
SELECT 
    uv.id,
    uv.user_id,
    'Premium Ceramic Coating',
    'coating',
    'exterior',
    'Applied 9H ceramic coating. Surface preparation included clay bar treatment and paint correction. Curing time: 24 hours.',
    CURRENT_DATE - INTERVAL '30 days'
FROM user_vehicles uv
LIMIT 1;

-- Sample maintenance reminder
INSERT INTO vehicle_maintenance_reminders (vehicle_id, user_id, reminder_type, title, description, due_date, recurrence_interval_days, priority)
SELECT 
    uv.id,
    uv.user_id,
    'coating_renewal',
    'Ceramic Coating Top-up',
    'Your ceramic coating may need a maintenance top-up for optimal protection.',
    CURRENT_DATE + INTERVAL '30 days',
    180,
    'medium'
FROM user_vehicles uv
LIMIT 1;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Digital Car Garage & Service Journal schema created successfully!';
    RAISE NOTICE '📋 Created tables: service_journal_entries, vehicle_maintenance_reminders, service_certificates, vehicle_health_scores';
    RAISE NOTICE '🔐 Row Level Security policies enabled';
    RAISE NOTICE '⚡ Functions and triggers created';
END $$;
