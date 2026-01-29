-- Create Real Inventory System with Real-time Support
-- Run this in Supabase SQL Editor

-- 1. Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'cleaning_supplies', 'tools', 'chemicals', 'accessories'
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 10, -- Alert threshold
  max_quantity INTEGER NOT NULL DEFAULT 100,
  unit TEXT NOT NULL DEFAULT 'units', -- 'units', 'liters', 'kg', 'bottles'
  price_per_unit DECIMAL(10,2) DEFAULT 0,
  supplier TEXT,
  last_restocked TIMESTAMPTZ,
  location TEXT, -- Storage location
  sku TEXT UNIQUE, -- Stock Keeping Unit
  image_url TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'discontinued', 'out_of_stock'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create inventory transactions table (track usage/restocking)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'usage', 'restock', 'adjustment', 'waste'
  quantity INTEGER NOT NULL, -- Positive for restock, negative for usage
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable real-time for inventory tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory_transactions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 4. Set replica identity
ALTER TABLE inventory REPLICA IDENTITY FULL;
ALTER TABLE inventory_transactions REPLICA IDENTITY FULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_booking_id ON inventory_transactions(booking_id);

-- 6. Function to update inventory quantity
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the inventory quantity based on transaction
  UPDATE inventory
  SET 
    quantity = quantity + NEW.quantity,
    updated_at = NOW(),
    status = CASE 
      WHEN (quantity + NEW.quantity) <= 0 THEN 'out_of_stock'
      WHEN (quantity + NEW.quantity) > 0 THEN 'active'
      ELSE status
    END,
    last_restocked = CASE 
      WHEN NEW.type = 'restock' THEN NOW()
      ELSE last_restocked
    END
  WHERE id = NEW.inventory_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-update inventory on transaction
DROP TRIGGER IF EXISTS inventory_transaction_trigger ON inventory_transactions;
CREATE TRIGGER inventory_transaction_trigger
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();

-- 8. Function to check low stock and create notifications
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  admin_users UUID[];
BEGIN
  -- If quantity drops below minimum, create notification for admins
  IF NEW.quantity < NEW.min_quantity AND (OLD.quantity IS NULL OR OLD.quantity >= NEW.min_quantity) THEN
    -- Get all admin users
    SELECT ARRAY_AGG(id) INTO admin_users
    FROM profiles
    WHERE role = 'admin';
    
    -- Create notification for each admin
    IF admin_users IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, category, title, message, priority, data)
      SELECT 
        unnest(admin_users),
        'low_stock',
        'inventory',
        'Low Stock Alert',
        format('⚠️ %s is running low! Only %s %s remaining.', NEW.name, NEW.quantity, NEW.unit),
        'high',
        jsonb_build_object(
          'inventory_id', NEW.id,
          'item_name', NEW.name,
          'current_quantity', NEW.quantity,
          'min_quantity', NEW.min_quantity
        );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger for low stock alerts
DROP TRIGGER IF EXISTS low_stock_alert_trigger ON inventory;
CREATE TRIGGER low_stock_alert_trigger
AFTER INSERT OR UPDATE OF quantity ON inventory
FOR EACH ROW EXECUTE FUNCTION check_low_stock();

-- 10. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_inventory_timestamp_trigger ON inventory;
CREATE TRIGGER update_inventory_timestamp_trigger
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_inventory_timestamp();

-- 12. Insert sample inventory data
INSERT INTO inventory (name, category, description, quantity, min_quantity, max_quantity, unit, price_per_unit, supplier, location, sku) VALUES
-- Cleaning Supplies
('Car Wash Shampoo', 'cleaning_supplies', 'Premium pH-balanced car wash shampoo', 45, 10, 100, 'liters', 250.00, 'Auto Care Supplies Ltd', 'Storage Room A', 'CWS-001'),
('Microfiber Towels', 'cleaning_supplies', 'Ultra-soft microfiber drying towels', 120, 20, 200, 'units', 50.00, 'Detailing Pro', 'Storage Room A', 'MFT-001'),
('Glass Cleaner', 'cleaning_supplies', 'Streak-free glass cleaner', 30, 10, 80, 'liters', 180.00, 'Auto Care Supplies Ltd', 'Storage Room A', 'GLC-001'),
('Tire Cleaner', 'cleaning_supplies', 'Heavy-duty tire and wheel cleaner', 25, 8, 60, 'liters', 320.00, 'Wheel Care Inc', 'Storage Room B', 'TRC-001'),
('Interior Cleaner', 'cleaning_supplies', 'Multi-surface interior cleaner', 35, 10, 70, 'liters', 280.00, 'Auto Care Supplies Ltd', 'Storage Room A', 'INC-001'),

-- Chemicals
('Ceramic Coating', 'chemicals', 'Professional grade ceramic coating', 8, 3, 20, 'bottles', 2500.00, 'Coating Masters', 'Secure Cabinet', 'CRC-001'),
('Wax Polish', 'chemicals', 'Premium carnauba wax polish', 15, 5, 40, 'bottles', 800.00, 'Polish Pro', 'Storage Room B', 'WAX-001'),
('Engine Degreaser', 'chemicals', 'Industrial strength engine degreaser', 20, 5, 50, 'liters', 450.00, 'Engine Care Co', 'Storage Room B', 'ENG-001'),
('Leather Conditioner', 'chemicals', 'Premium leather care conditioner', 12, 5, 30, 'bottles', 650.00, 'Leather Luxe', 'Storage Room A', 'LEC-001'),
('Paint Sealant', 'chemicals', 'Long-lasting paint protection sealant', 10, 4, 25, 'bottles', 1200.00, 'Paint Guard Pro', 'Secure Cabinet', 'PTS-001'),

-- Tools
('Pressure Washer', 'tools', 'High-pressure water jet system', 3, 1, 5, 'units', 25000.00, 'Power Tools India', 'Equipment Room', 'PRW-001'),
('Vacuum Cleaner', 'tools', 'Industrial wet/dry vacuum', 4, 2, 6, 'units', 15000.00, 'Clean Tech', 'Equipment Room', 'VAC-001'),
('Polishing Machine', 'tools', 'Dual-action polisher', 5, 2, 8, 'units', 18000.00, 'Polish Pro', 'Equipment Room', 'POL-001'),
('Foam Cannon', 'tools', 'High-pressure foam applicator', 6, 2, 10, 'units', 3500.00, 'Auto Care Supplies Ltd', 'Equipment Room', 'FMC-001'),
('Detailing Brushes Set', 'tools', 'Professional detailing brush kit', 15, 5, 30, 'units', 1200.00, 'Detailing Pro', 'Storage Room A', 'DBR-001'),

-- Accessories
('Spray Bottles', 'accessories', 'Professional spray bottles 500ml', 50, 15, 100, 'units', 80.00, 'General Supplies', 'Storage Room A', 'SPB-001'),
('Buckets', 'accessories', 'Heavy-duty wash buckets', 20, 5, 40, 'units', 150.00, 'General Supplies', 'Storage Room A', 'BCK-001'),
('Applicator Pads', 'accessories', 'Foam applicator pads', 80, 20, 150, 'units', 30.00, 'Detailing Pro', 'Storage Room A', 'APP-001'),
('Wheel Brushes', 'accessories', 'Long-handle wheel cleaning brushes', 12, 5, 25, 'units', 250.00, 'Wheel Care Inc', 'Storage Room B', 'WBR-001'),
('Clay Bars', 'accessories', 'Professional detailing clay bars', 25, 10, 50, 'units', 400.00, 'Paint Guard Pro', 'Storage Room A', 'CLB-001')
ON CONFLICT (sku) DO NOTHING;

-- 13. Grant permissions
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON inventory TO service_role;
GRANT ALL ON inventory_transactions TO authenticated;
GRANT ALL ON inventory_transactions TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Inventory system created successfully!';
  RAISE NOTICE '✅ Real-time enabled for inventory tables';
  RAISE NOTICE '✅ Sample inventory data inserted';
  RAISE NOTICE '✅ Low stock alerts configured';
  RAISE NOTICE '🚀 Inventory management is ready to use!';
END $$;
