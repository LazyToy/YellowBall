INSERT INTO app_content_blocks (key, payload, description)
VALUES (
  'admin_queue_summary',
  '[
    {"label":"평균 작업 시간","value":"23분","tone":"primary","icon":"timer"},
    {"label":"급행 대기","value":"2건","tone":"danger","icon":"alert"},
    {"label":"오늘 완료","value":"12건","tone":"success","icon":"check"}
  ]'::jsonb,
  'Admin queue page summary metrics'
)
ON CONFLICT (key) DO UPDATE
SET payload = EXCLUDED.payload,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = now();
