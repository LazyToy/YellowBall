CREATE OR REPLACE FUNCTION ensure_booking_slots_for_date(
  p_date DATE,
  p_service_type TEXT,
  p_duration_min INT DEFAULT 60,
  p_capacity INT DEFAULT 1
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule shop_schedule%ROWTYPE;
  v_cursor TIME;
  v_next TIME;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.';
  END IF;

  IF p_service_type NOT IN ('stringing', 'demo') THEN
    RAISE EXCEPTION '지원하지 않는 예약 유형입니다.';
  END IF;

  IF p_duration_min IS NULL OR p_duration_min <= 0 THEN
    RAISE EXCEPTION '슬롯 간격은 1분 이상이어야 합니다.';
  END IF;

  IF p_capacity IS NULL OR p_capacity < 1 THEN
    RAISE EXCEPTION '예약 정원은 1명 이상이어야 합니다.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM closed_dates
    WHERE closed_date = p_date
  ) THEN
    RETURN;
  END IF;

  SELECT *
    INTO v_schedule
  FROM shop_schedule
  WHERE day_of_week = EXTRACT(DOW FROM p_date)::SMALLINT;

  IF NOT FOUND OR v_schedule.is_closed THEN
    RETURN;
  END IF;

  v_cursor := v_schedule.open_time;

  WHILE v_cursor + make_interval(mins => p_duration_min) <= v_schedule.close_time LOOP
    v_next := v_cursor + make_interval(mins => p_duration_min);
    v_start_time := (p_date::TEXT || ' ' || v_cursor::TEXT || '+00')::TIMESTAMPTZ;
    v_end_time := (p_date::TEXT || ' ' || v_next::TEXT || '+00')::TIMESTAMPTZ;

    INSERT INTO booking_slots (
      service_type,
      start_time,
      end_time,
      capacity,
      reserved_count,
      is_blocked,
      block_reason,
      updated_at
    )
    VALUES (
      p_service_type,
      v_start_time,
      v_end_time,
      p_capacity,
      0,
      false,
      null,
      now()
    )
    ON CONFLICT (service_type, start_time) DO NOTHING;

    v_cursor := v_next;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION ensure_booking_slots_for_date(DATE, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_booking_slots_for_date(DATE, TEXT, INT, INT) TO authenticated;
NOTIFY pgrst, 'reload schema';
