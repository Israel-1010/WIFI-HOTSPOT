-- Create logs table for system activities
CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('connection', 'disconnection', 'voucher', 'error', 'system')),
  user_name TEXT,
  ip_address TEXT,
  mac_address TEXT,
  message TEXT NOT NULL,
  details TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- Enable Row Level Security
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all logs
CREATE POLICY "Allow authenticated users to read logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert logs
CREATE POLICY "Allow authenticated users to insert logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert some sample data
INSERT INTO logs (type, user_name, ip_address, mac_address, message, details) VALUES
  ('connection', 'João Silva', '192.168.1.100', 'AA:BB:CC:DD:EE:FF', 'Usuário conectado com sucesso', 'Voucher: WIFI2024'),
  ('voucher', NULL, NULL, NULL, 'Novo voucher criado', 'Código: GUEST001, Perfil: 1 Hora'),
  ('disconnection', 'Maria Santos', '192.168.1.101', '11:22:33:44:55:66', 'Usuário desconectado', 'Timeout de sessão'),
  ('connection', 'Pedro Costa', '192.168.1.102', 'AA:11:BB:22:CC:33', 'Usuário conectado via Facebook', 'Login social'),
  ('error', NULL, NULL, NULL, 'Falha na autenticação', 'Voucher inválido: INVALID123'),
  ('system', NULL, NULL, NULL, 'Hotspot reiniciado', 'Reinício manual pelo administrador');
