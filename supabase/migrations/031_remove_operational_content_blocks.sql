DELETE FROM app_content_blocks
WHERE key IN (
  'admin_kpis',
  'admin_queue_columns',
  'admin_sales_data',
  'admin_demo_slots',
  'admin_low_stock_items',
  'admin_recent_orders',
  'admin_open_status',
  'admin_queue_summary'
);
