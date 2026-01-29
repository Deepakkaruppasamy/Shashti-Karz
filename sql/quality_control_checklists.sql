-- Quality Control Checklist System
-- This enables workers to complete service checklists with photo verification

-- Service Checklists Templates
CREATE TABLE IF NOT EXISTS service_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL, -- [{step: "Exterior wash", required: true, order: 1}]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Completions
CREATE TABLE IF NOT EXISTS checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES service_checklists(id),
  worker_id UUID REFERENCES workers(id),
  completed_items JSONB NOT NULL, -- [{step: "wash", completed: true, timestamp: "..."}]
  photos JSONB, -- [{step: "wash", url: "...", uploaded_at: "..."}]
  notes TEXT,
  manager_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_completions_booking ON checklist_completions(booking_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completions_worker ON checklist_completions(worker_id);
CREATE INDEX IF NOT EXISTS idx_service_checklists_service ON service_checklists(service_id);

-- Enable Row Level Security
ALTER TABLE service_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active checklists" ON service_checklists
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage checklists" ON service_checklists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Workers can view their completions" ON checklist_completions
  FOR SELECT USING (
    worker_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Workers can create completions" ON checklist_completions
  FOR INSERT WITH CHECK (worker_id = auth.uid());

CREATE POLICY "Workers can update their completions" ON checklist_completions
  FOR UPDATE USING (
    worker_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );

-- Insert default checklists for existing services
INSERT INTO service_checklists (service_id, name, items) VALUES
('ceramic-coating', 'Ceramic Coating Checklist', '[
  {"step": "Vehicle inspection and documentation", "required": true, "order": 1},
  {"step": "Thorough wash and decontamination", "required": true, "order": 2},
  {"step": "Clay bar treatment", "required": true, "order": 3},
  {"step": "Paint correction and polishing", "required": true, "order": 4},
  {"step": "Surface preparation and IPA wipe", "required": true, "order": 5},
  {"step": "Ceramic coating application (first layer)", "required": true, "order": 6},
  {"step": "Ceramic coating application (second layer)", "required": true, "order": 7},
  {"step": "Curing time verification", "required": true, "order": 8},
  {"step": "Final inspection and photo documentation", "required": true, "order": 9}
]'::jsonb),
('full-detailing', 'Full Detailing Checklist', '[
  {"step": "Pre-wash inspection", "required": true, "order": 1},
  {"step": "Exterior pressure wash", "required": true, "order": 2},
  {"step": "Wheel and tire cleaning", "required": true, "order": 3},
  {"step": "Hand wash with premium shampoo", "required": true, "order": 4},
  {"step": "Interior vacuum and dust removal", "required": true, "order": 5},
  {"step": "Dashboard and console cleaning", "required": true, "order": 6},
  {"step": "Leather/fabric seat cleaning", "required": true, "order": 7},
  {"step": "Glass cleaning (interior and exterior)", "required": true, "order": 8},
  {"step": "Tire dressing application", "required": true, "order": 9},
  {"step": "Final wipe down and quality check", "required": true, "order": 10}
]'::jsonb),
('paint-protection', 'Paint Protection Film Checklist', '[
  {"step": "Vehicle surface inspection", "required": true, "order": 1},
  {"step": "Deep cleaning and preparation", "required": true, "order": 2},
  {"step": "Surface measurement and film cutting", "required": true, "order": 3},
  {"step": "Application solution preparation", "required": true, "order": 4},
  {"step": "Film application (hood)", "required": true, "order": 5},
  {"step": "Film application (fenders)", "required": true, "order": 6},
  {"step": "Film application (bumper)", "required": true, "order": 7},
  {"step": "Edge sealing and squeegee work", "required": true, "order": 8},
  {"step": "Final inspection and cure time", "required": true, "order": 9}
]'::jsonb);

-- Function to calculate completion percentage
CREATE OR REPLACE FUNCTION calculate_completion_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  completed_count INTEGER;
BEGIN
  -- Count total items from checklist
  SELECT jsonb_array_length(items) INTO total_items
  FROM service_checklists
  WHERE id = NEW.checklist_id;
  
  -- Count completed items
  SELECT COUNT(*) INTO completed_count
  FROM jsonb_array_elements(NEW.completed_items) AS item
  WHERE (item->>'completed')::boolean = true;
  
  -- Calculate percentage
  NEW.completion_percentage := ROUND((completed_count::DECIMAL / total_items) * 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate completion percentage
CREATE TRIGGER update_completion_percentage
  BEFORE INSERT OR UPDATE ON checklist_completions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_completion_percentage();

-- Enable real-time for checklist completions
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_completions;
