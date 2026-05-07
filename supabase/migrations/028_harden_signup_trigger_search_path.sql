CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, nickname, email, phone)
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

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
