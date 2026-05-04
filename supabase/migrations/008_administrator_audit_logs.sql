CREATE TABLE administrator_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  before_value JSONB,
  after_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE administrator_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_read_super_admin" ON administrator_audit_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ));

CREATE POLICY "audit_insert_admins" ON administrator_audit_logs
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));

CREATE INDEX administrator_audit_logs_actor_created_idx
  ON administrator_audit_logs(actor_id, created_at DESC);

CREATE INDEX administrator_audit_logs_target_idx
  ON administrator_audit_logs(target_table, target_id);
