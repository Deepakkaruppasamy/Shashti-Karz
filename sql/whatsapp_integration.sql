-- WhatsApp Business Integration
-- Message templates, chat sessions, and campaign management

-- WhatsApp Message Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('booking', 'payment', 'service', 'marketing', 'support')),
  language TEXT DEFAULT 'en',
  header_type TEXT CHECK (header_type IN ('text', 'image', 'video', 'document')),
  header_content TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB, -- [{type: "quick_reply", text: "Yes"}, {type: "url", text: "Book Now", url: "..."}]
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Chat Sessions
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  phone_number TEXT NOT NULL,
  session_status TEXT DEFAULT 'active' CHECK (session_status IN ('active', 'closed', 'expired')),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  context JSONB, -- Current conversation context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  message_id TEXT UNIQUE, -- WhatsApp message ID
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'document', 'template', 'interactive')),
  content TEXT,
  media_url TEXT,
  template_id UUID REFERENCES whatsapp_templates(id),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Broadcast Campaigns
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id),
  target_audience JSONB, -- {segment: "all", filters: {...}}
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- WhatsApp Campaign Recipients
CREATE TABLE IF NOT EXISTS whatsapp_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT
);

-- WhatsApp Bot Intents
CREATE TABLE IF NOT EXISTS whatsapp_bot_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name TEXT UNIQUE NOT NULL,
  keywords TEXT[], -- Trigger keywords
  response_template TEXT NOT NULL,
  action TEXT, -- 'create_booking', 'check_status', 'support_ticket', etc.
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO whatsapp_templates (template_name, category, body_text, footer_text, buttons) VALUES
('booking_confirmation', 'booking', 
  'Hi {{name}}! Your booking #{{booking_id}} is confirmed for {{date}} at {{time}}. Service: {{service_name}}. Total: ₹{{amount}}.',
  'Shashti Karz - Premium Car Detailing',
  '[{"type": "quick_reply", "text": "View Details"}, {"type": "quick_reply", "text": "Reschedule"}]'::jsonb),
  
('service_started', 'service',
  'Hi {{name}}! Our worker {{worker_name}} has started working on your {{service_name}}. Track progress: {{tracking_url}}',
  'Shashti Karz',
  '[{"type": "url", "text": "Track Live", "url": "{{tracking_url}}"}]'::jsonb),
  
('service_completed', 'service',
  'Hi {{name}}! Your {{service_name}} is complete! Please rate your experience and help us improve.',
  'Thank you for choosing Shashti Karz',
  '[{"type": "url", "text": "Rate Service", "url": "{{review_url}}"}]'::jsonb),
  
('payment_reminder', 'payment',
  'Hi {{name}}! Payment of ₹{{amount}} is pending for booking #{{booking_id}}. Pay now: {{payment_link}}',
  'Shashti Karz',
  '[{"type": "url", "text": "Pay Now", "url": "{{payment_link}}"}]'::jsonb),
  
('promotional_offer', 'marketing',
  '🎉 Special Offer! Get {{discount}}% OFF on {{service_name}}. Valid till {{expiry_date}}. Book now!',
  'Limited time offer',
  '[{"type": "url", "text": "Book Now", "url": "{{booking_url}}"}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert default bot intents
INSERT INTO whatsapp_bot_intents (intent_name, keywords, response_template, action, priority) VALUES
('book_service', ARRAY['book', 'booking', 'schedule', 'appointment'], 
  'I can help you book a service! What type of service are you looking for? Reply with:\n1. Basic Wash\n2. Full Detailing\n3. Ceramic Coating\n4. Interior Cleaning',
  'show_services', 100),
  
('check_status', ARRAY['status', 'track', 'where', 'progress'],
  'Let me check your booking status. Please share your booking ID or phone number.',
  'check_booking_status', 90),
  
('pricing', ARRAY['price', 'cost', 'how much', 'rate'],
  'Our pricing varies by service. Here are our popular services:\n• Basic Wash: ₹499\n• Full Detailing: ₹2,999\n• Ceramic Coating: ₹15,999\nWould you like to book any service?',
  'show_pricing', 80),
  
('support', ARRAY['help', 'support', 'issue', 'problem', 'complaint'],
  'I''m sorry to hear you''re facing an issue. Our support team will assist you shortly. Please describe your concern.',
  'create_support_ticket', 70),
  
('reschedule', ARRAY['reschedule', 'change', 'postpone', 'cancel'],
  'I can help you reschedule. Please share your booking ID.',
  'reschedule_booking', 85)
ON CONFLICT DO NOTHING;

-- Function to process incoming WhatsApp message
CREATE OR REPLACE FUNCTION process_whatsapp_message(
  phone_number_param TEXT,
  message_text TEXT
)
RETURNS JSONB AS $$
DECLARE
  session_record whatsapp_sessions%ROWTYPE;
  intent_record whatsapp_bot_intents%ROWTYPE;
  response_text TEXT;
  matched_intent BOOLEAN := false;
BEGIN
  -- Get or create session
  SELECT * INTO session_record 
  FROM whatsapp_sessions 
  WHERE phone_number = phone_number_param 
    AND session_status = 'active'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    INSERT INTO whatsapp_sessions (phone_number)
    VALUES (phone_number_param)
    RETURNING * INTO session_record;
  END IF;
  
  -- Match intent based on keywords
  FOR intent_record IN 
    SELECT * FROM whatsapp_bot_intents 
    WHERE active = true 
    ORDER BY priority DESC
  LOOP
    IF EXISTS (
      SELECT 1 FROM unnest(intent_record.keywords) AS keyword
      WHERE LOWER(message_text) LIKE '%' || keyword || '%'
    ) THEN
      response_text := intent_record.response_template;
      matched_intent := true;
      EXIT;
    END IF;
  END LOOP;
  
  -- Default response if no intent matched
  IF NOT matched_intent THEN
    response_text := 'Welcome to Shashti Karz! 🚗✨\n\nHow can I help you today?\n1. Book a service\n2. Check booking status\n3. View pricing\n4. Speak to support\n\nJust reply with your choice!';
  END IF;
  
  -- Update session
  UPDATE whatsapp_sessions 
  SET last_message_at = NOW(),
      expires_at = NOW() + INTERVAL '24 hours'
  WHERE id = session_record.id;
  
  RETURN jsonb_build_object(
    'session_id', session_record.id,
    'response', response_text,
    'action', COALESCE(intent_record.action, 'default'),
    'intent', COALESCE(intent_record.intent_name, 'unknown')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to send WhatsApp template message
CREATE OR REPLACE FUNCTION send_whatsapp_template(
  phone_number_param TEXT,
  template_name_param TEXT,
  variables JSONB
)
RETURNS UUID AS $$
DECLARE
  template_record whatsapp_templates%ROWTYPE;
  session_id UUID;
  message_id UUID;
  processed_body TEXT;
BEGIN
  -- Get template
  SELECT * INTO template_record 
  FROM whatsapp_templates 
  WHERE template_name = template_name_param AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or not approved';
  END IF;
  
  -- Get or create session
  INSERT INTO whatsapp_sessions (phone_number)
  VALUES (phone_number_param)
  ON CONFLICT DO NOTHING
  RETURNING id INTO session_id;
  
  IF session_id IS NULL THEN
    SELECT id INTO session_id FROM whatsapp_sessions WHERE phone_number = phone_number_param LIMIT 1;
  END IF;
  
  -- Process template variables
  processed_body := template_record.body_text;
  -- In real implementation, replace {{variables}} with actual values from JSONB
  
  -- Create message record
  INSERT INTO whatsapp_messages (session_id, direction, message_type, content, template_id)
  VALUES (session_id, 'outbound', 'template', processed_body, template_record.id)
  RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session ON whatsapp_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);

-- Enable RLS
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_bot_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage templates" ON whatsapp_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Users can view their own sessions" ON whatsapp_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own messages" ON whatsapp_messages
  FOR SELECT USING (
    session_id IN (SELECT id FROM whatsapp_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage campaigns" ON whatsapp_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_sessions;
