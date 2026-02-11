-- Migration: Fix Garage Service Journal and Health Score RPC
-- This migration adds the missing 'price' column and fixes worker references

-- 1. Add price column if it doesn't exist
ALTER TABLE public.service_journal_entries 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- 2. Fix the stored function for health score calculation
-- We drop and recreate it to ensure it picks up the new schema
DROP FUNCTION IF EXISTS calculate_vehicle_health_score(UUID);

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
    -- Get total services from journal
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

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Garage migrations applied successfully!';
    RAISE NOTICE '📝 Added price column to service_journal_entries';
    RAISE NOTICE '🔧 Fixed calculate_vehicle_health_score function';
END $$;
