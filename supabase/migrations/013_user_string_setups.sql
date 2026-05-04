CREATE TABLE user_string_setups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  racket_id UUID NOT NULL REFERENCES user_rackets(id) ON DELETE CASCADE,
  main_string_id UUID NOT NULL REFERENCES string_catalog(id),
  cross_string_id UUID NOT NULL REFERENCES string_catalog(id),
  tension_main INT NOT NULL CHECK (tension_main BETWEEN 20 AND 70),
  tension_cross INT NOT NULL CHECK (tension_cross BETWEEN 20 AND 70),
  is_hybrid BOOLEAN NOT NULL DEFAULT false,
  memo TEXT,
  last_strung_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (is_hybrid OR cross_string_id = main_string_id)
);

ALTER TABLE user_string_setups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_string_setups_own_all" ON user_string_setups
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX user_string_setups_user_idx ON user_string_setups(user_id);
CREATE INDEX user_string_setups_racket_idx ON user_string_setups(racket_id);
CREATE INDEX user_string_setups_main_string_idx
  ON user_string_setups(main_string_id);
CREATE INDEX user_string_setups_cross_string_idx
  ON user_string_setups(cross_string_id);
