-- Create activity_logs table for tracking all user activities
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('connection', 'disconnection', 'voucher', 'error', 'system', 'authentication')),
  user_name TEXT,
  ip_address TEXT,
  mac_address TEXT,
  message TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all activity logs
CREATE POLICY "Allow authenticated users to read activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow service role to read all activity logs
CREATE POLICY "Allow service role to read activity logs"
  ON activity_logs
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Allow authenticated users to insert activity logs
CREATE POLICY "Allow authenticated users to insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow anon users to insert activity logs (for guest logins)
CREATE POLICY "Allow anon users to insert activity logs"
  ON activity_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Migrate existing data from logs table to activity_logs
INSERT INTO activity_logs (created_at, type, user_name, ip_address, mac_address, message, details, user_id)
SELECT 
  created_at, 
  type, 
  user_name, 
  ip_address, 
  mac_address, 
  message, 
  CASE 
    WHEN details IS NOT NULL THEN jsonb_build_object('details', details)
    ELSE NULL
  END as details,
  user_id
FROM logs
ON CONFLICT DO NOTHING;
