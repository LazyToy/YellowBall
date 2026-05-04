REVOKE ALL ON FUNCTION public.can_manage_bookings(UUID)
  FROM PUBLIC, anon, authenticated;
