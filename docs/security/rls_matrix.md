# PR-32 RLS Access Matrix

| Table | anon | user | admin | super_admin |
| --- | --- | --- | --- | --- |
| profiles | none | read/update own | read all active users | read all |
| addresses | none | CRUD own | none | none |
| user_rackets | none | CRUD own | none | none |
| user_string_setups | none | CRUD own | none | none |
| notification_preferences | none | CRUD own | none | none |
| notifications | none | CRUD own | none | none |
| string_catalog | none | read active | CRUD with can_manage_strings, read all admins | CRUD all |
| admin_permissions | none | none | read own | CRUD all |
| administrator_audit_logs | none | none | insert | read/insert |
| app_settings | none | read | read | read/write |
| shop_schedule | none | read | CRUD | CRUD |
| closed_dates | none | read | CRUD | CRUD |
| booking_slots | none | read | CRUD | CRUD |
| service_bookings | none | read own, create through RPC | CRUD with can_manage_bookings | CRUD all |
| demo_bookings | none | read own, create through RPC | CRUD with can_manage_bookings | CRUD all |
| booking_status_logs | none | read related own booking logs | CRUD with can_manage_bookings | CRUD all |
| demo_rackets | none | read active enabled rackets | CRUD with can_manage_demo_rackets | CRUD all |
| racket_condition_checks | none | read checks for own demo bookings | CRUD with can_manage_bookings | CRUD all |

Notes:

- Direct inserts into `service_bookings` and `demo_bookings` remain blocked for users. Creation stays behind `create_service_booking_transaction` and `create_demo_booking_transaction`.
- Authenticated public reads intentionally exclude `anon`; app bootstrap data must be fetched after login.
- Booking administration is narrowed to `can_manage_bookings` instead of a broad `admin` role check.
- Edge Functions may use `SUPABASE_SERVICE_ROLE_KEY`; app and service client code must not expose it.
- `string-photos` is a public Storage bucket with upload, update, and delete limited to active admins with `can_manage_strings` or active super admins.
- `demo-racket-photos` is a public Storage bucket with upload, update, and delete limited to active admins with `can_manage_demo_rackets` or active super admins.
- `condition-photos` is a private Storage bucket. `racket_condition_checks.photo_urls` stores object paths, and clients must request signed URLs before displaying those photos.
