CREATE TABLE user_rackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  grip_size TEXT,
  weight INT,
  balance TEXT,
  photo_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_rackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rackets_own" ON user_rackets
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX user_rackets_owner_id_idx ON user_rackets(owner_id);
CREATE UNIQUE INDEX user_rackets_one_primary_per_owner_idx
  ON user_rackets(owner_id)
  WHERE is_primary = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('racket-photos', 'racket-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "racket_photos_own_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'racket-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "racket_photos_own_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'racket-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'racket-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "racket_photos_own_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'racket-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
