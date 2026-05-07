ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE profiles
  ALTER COLUMN phone DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique
  ON profiles (email)
  WHERE email IS NOT NULL;

UPDATE profiles
SET email = auth_users.email
FROM auth.users AS auth_users
WHERE profiles.id = auth_users.id
  AND profiles.email IS NULL
  AND auth_users.email IS NOT NULL;

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, nickname, email, phone)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      substr(
        regexp_replace(
          lower(split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)),
          '[^a-z0-9_]',
          '_',
          'g'
        ),
        1,
        13
      ) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 6)
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'nickname', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'YellowBall User'
    ),
    NEW.email,
    NEW.phone
  );

  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
