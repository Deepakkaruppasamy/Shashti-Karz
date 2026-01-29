-- Equipment Maintenance Tracker
-- Track equipment, maintenance schedules, and service history

-- Equipment Inventory
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('pressure_washer', 'polisher', 'vacuum', 'steamer', 'dryer', 'tool', 'other')),
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  purchase_date DATE,
  purchase_cost DECIMAL,
  current_value DECIMAL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'repair', 'retired')),
  assigned_to UUID REFERENCES profiles(id),
  location TEXT,
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Schedules
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('routine', 'inspection', 'cleaning', 'oil_change', 'parts_replacement')),
  frequency_days INTEGER NOT NULL,
  last_maintenance_date DATE,
  next_maintenance_date DATE NOT NULL,
  estimated_cost DECIMAL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance History
CREATE TABLE IF NOT EXISTS maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL,
  performed_by UUID REFERENCES profiles(id),
  parts_replaced TEXT[],
  next_maintenance_due DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Alerts
CREATE TABLE IF NOT EXISTS equipment_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('maintenance_due', 'warranty_expiring', 'replacement_needed', 'malfunction')),
  alert_message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check maintenance due
CREATE OR REPLACE FUNCTION check_maintenance_due()
RETURNS void AS $$
DECLARE
  schedule_record maintenance_schedules%ROWTYPE;
BEGIN
  FOR schedule_record IN 
    SELECT * FROM maintenance_schedules 
    WHERE active = true AND next_maintenance_date <= CURRENT_DATE + 7
  LOOP
    -- Create alert if not already exists
    INSERT INTO equipment_alerts (equipment_id, alert_type, alert_message, priority)
    SELECT 
      schedule_record.equipment_id,
      'maintenance_due',
      format('Maintenance due for %s on %s', e.equipment_name, schedule_record.next_maintenance_date),
      CASE 
        WHEN schedule_record.next_maintenance_date < CURRENT_DATE THEN 'urgent'
        WHEN schedule_record.next_maintenance_date <= CURRENT_DATE + 3 THEN 'high'
        ELSE 'medium'
      END
    FROM equipment e
    WHERE e.id = schedule_record.equipment_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_date ON maintenance_schedules(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_equipment_alerts_status ON equipment_alerts(status);

-- Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage equipment" ON equipment
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
  );
