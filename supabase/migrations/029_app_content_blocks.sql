CREATE TABLE app_content_blocks (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_content_blocks_public_read" ON app_content_blocks
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "app_content_blocks_admin_write" ON app_content_blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

INSERT INTO app_content_blocks (key, payload, description)
VALUES
  (
    'shop_filters',
    '["전체", "라켓", "스트링", "신발", "가방", "공", "그립", "의류"]'::jsonb,
    'Shop category filters'
  ),
  (
    'shop_products',
    '[
      {"id":"prod-wilson-rf97-v14","name":"Wilson Pro Staff RF97 v14","category":"라켓","price":389000,"sale":329000,"rating":4.9,"reviews":128,"tag":"BEST","tone":"primary"},
      {"id":"prod-babolat-pure-aero-2024","name":"Babolat Pure Aero 2024","category":"라켓","price":359000,"sale":309000,"rating":4.8,"reviews":96,"tag":"신상","tone":"accent"},
      {"id":"prod-luxilon-alu-power-125","name":"Luxilon ALU Power 1.25","category":"스트링","price":32000,"sale":28000,"rating":4.9,"reviews":412,"tag":null,"tone":"secondary"},
      {"id":"prod-selkirk-vanguard-power","name":"Selkirk Vanguard Power","category":"피클볼","price":269000,"sale":229000,"rating":4.7,"reviews":64,"tag":"HOT","tone":"card"},
      {"id":"prod-asics-court-ff-3","name":"Asics Court FF 3","category":"신발","price":219000,"sale":189000,"rating":4.8,"reviews":72,"tag":null,"tone":"accent"},
      {"id":"prod-wilson-tour-9-pack","name":"Wilson Tour 9 Pack","category":"가방","price":159000,"sale":139000,"rating":4.7,"reviews":38,"tag":null,"tone":"primary"}
    ]'::jsonb,
    'Shop product seed content'
  ),
  (
    'shop_sale_banner',
    '{"meta":"SPRING SALE","title":"봄맞이 라켓 최대 25% 할인","subtitle":"성수점 단독 · 시타 후 구매 시 추가 5%","buttonLabel":"기획전 보기","thumbLabel":"SALE"}'::jsonb,
    'Shop promotion banner'
  ),
  (
    'shop_cart_count',
    '2'::jsonb,
    'Demo cart count'
  ),
  (
    'home_rebook',
    '{"meta":"마지막 작업 · 32일 전","title":"스트링 교체 시기예요.\n지난 조합으로 다시 예약할까요?","subtitle":"Solinco Hyper-G · 48 / 46 lbs"}'::jsonb,
    'Home rebooking prompt'
  ),
  (
    'home_active_booking',
    '{"statusLabel":"작업 중","bookingNumber":"#2841","racketName":"Wilson Blade 98 v9","stringSummary":"Solinco Hyper-G · 메인 48 / 크로스 46 lbs","pickupLabel":"픽업 예정","pickupTime":"오늘 18:00","activeStepIndex":3}'::jsonb,
    'Home active booking card'
  ),
  (
    'home_rackets',
    '[
      {"brand":"Wilson","model":"Blade 98 v9","string":"Hyper-G","tension":"48 / 46","tone":"primary","main":true},
      {"brand":"Babolat","model":"Pure Aero","string":"RPM Blast","tension":"52 / 50","tone":"accent","main":false}
    ]'::jsonb,
    'Home racket carousel'
  ),
  (
    'home_featured_strings',
    '[
      {"name":"Solinco Hyper-G","label":"BEST","description":"컨트롤과 스핀 밸런스","tone":"accent"},
      {"name":"Luxilon ALU Power","label":"추천","description":"파워와 타구감 중심","tone":"secondary"},
      {"name":"Yonex PolyTour Pro","label":"추천","description":"부드러운 폴리 감각","tone":"secondary"}
    ]'::jsonb,
    'Home featured strings'
  ),
  (
    'home_categories',
    '["라켓", "스트링", "신발", "가방"]'::jsonb,
    'Home shop categories'
  ),
  (
    'home_store_hours',
    '{"title":"오늘 영업 중 ·","accent":"11:00 - 21:00","subtitle":"스트링 작업 마감 20:00 · 일요일 정기 휴무"}'::jsonb,
    'Home store hours'
  ),
  (
    'me_profile_summary',
    '{"membershipLabel":"VIP","storeName":"서울 성수점","joinedAtLabel":"가입 2024.06"}'::jsonb,
    'Profile summary labels'
  ),
  (
    'me_profile_metrics',
    '[
      {"label":"포인트","value":"12,400"},
      {"label":"쿠폰","value":"3장"},
      {"label":"스탬프","value":"7 / 10"}
    ]'::jsonb,
    'Profile metric values'
  ),
  (
    'me_stats',
    '[
      {"label":"스트링 작업","value":14,"glyph":"W"},
      {"label":"시타","value":6,"glyph":"S"},
      {"label":"주문","value":9,"glyph":"B"},
      {"label":"찜","value":23,"glyph":"H"}
    ]'::jsonb,
    'Profile activity stats'
  ),
  (
    'me_rackets',
    '[
      {"name":"Wilson Pro Staff RF97 v14","string":"Luxilon ALU Power 1.25 / 50LB","lastService":"2026.04.18","main":true,"tone":"primary"},
      {"name":"Babolat Pure Aero 2024","string":"Solinco Hyper-G Soft / 52LB","lastService":"2026.03.27","main":false,"tone":"accent"}
    ]'::jsonb,
    'Profile racket list'
  ),
  (
    'me_menu_groups',
    '[
      {"title":"쇼핑","items":[{"label":"주문 내역","route":"/shop","glyph":"O","badge":"배송중 1건"},{"label":"배송지 관리","route":"/addresses","glyph":"A"}]},
      {"title":"활동","items":[{"label":"쿠폰 / 포인트","route":"/shop","glyph":"G","badge":"3장"},{"label":"알림 설정","route":"/notification-settings","glyph":"N"}]},
      {"title":"고객지원","items":[{"label":"공지사항","route":"/notifications","glyph":"D"},{"label":"문의하기","route":"/notifications","glyph":"Q"}]}
    ]'::jsonb,
    'Profile menu groups'
  ),
  (
    'admin_kpis',
    '[
      {"label":"오늘 작업 예약","value":"12","sub":"진행 중 4 · 완료 8","delta":"+3","tone":"primary","up":true},
      {"label":"오늘 시타 예약","value":"5","sub":"다음 슬롯 11:00","delta":"+2","tone":"accent","up":true},
      {"label":"오늘 매출","value":"₩1,842,000","sub":"주문 14건","delta":"+12%","tone":"neutral","up":true},
      {"label":"재고 알림","value":"3","sub":"임계치 미만","delta":"-1","tone":"danger","up":false}
    ]'::jsonb,
    'Admin dashboard KPIs'
  ),
  (
    'admin_queue_columns',
    '[
      {"title":"접수","tone":"neutral","jobs":[{"id":"YB-2645","customer":"김지훈","racket":"Wilson Blade 98 v9","string":"Polytour Pro 1.25 / 51LB","due":"오늘 17:00"},{"id":"YB-2646","customer":"박서연","racket":"Babolat Pure Drive","string":"Hyper-G Soft / 52LB","due":"오늘 19:00","priority":true}]},
      {"title":"작업 중","tone":"primary","jobs":[{"id":"YB-2640","customer":"정민수","racket":"Wilson Pro Staff RF97","string":"ALU Power 1.25 / 50LB","due":"오늘 18:30"},{"id":"YB-2643","customer":"이도윤","racket":"Yonex VCORE 100","string":"Polytour Strike / 50LB","due":"내일 12:00"}]},
      {"title":"픽업 대기","tone":"accent","jobs":[{"id":"YB-2632","customer":"최예린","racket":"Head Speed MP","string":"Lynx Tour / 53LB","due":"픽업 가능"},{"id":"YB-2635","customer":"한우진","racket":"Wilson Clash 100 v3","string":"NXT 16 / 55LB","due":"픽업 가능"}]}
    ]'::jsonb,
    'Admin work queue columns'
  ),
  (
    'admin_sales_data',
    '[
      {"day":"월","string":320,"shop":480,"demo":0},
      {"day":"화","string":280,"shop":410,"demo":80},
      {"day":"수","string":410,"shop":520,"demo":60},
      {"day":"목","string":360,"shop":390,"demo":120},
      {"day":"금","string":480,"shop":610,"demo":90},
      {"day":"토","string":720,"shop":980,"demo":220},
      {"day":"일","string":540,"shop":760,"demo":180}
    ]'::jsonb,
    'Admin weekly sales chart'
  ),
  (
    'admin_demo_slots',
    '[
      {"time":"10:00","customer":"김지훈","racket":"Wilson Pro Staff","status":"예정"},
      {"time":"11:30","customer":"박서연","racket":"Babolat Pure Aero","status":"예정"},
      {"time":"14:00","customer":"이도윤","racket":"Yonex VCORE 100","status":"체크인"},
      {"time":"15:30","customer":"-","racket":"비어있음","status":"공실"},
      {"time":"17:00","customer":"한우진","racket":"Head Speed MP","status":"예정"}
    ]'::jsonb,
    'Admin demo schedule'
  ),
  (
    'admin_low_stock_items',
    '[
      {"name":"Luxilon ALU Power 1.25","stock":2,"threshold":10},
      {"name":"Wilson US Open 공","stock":4,"threshold":24},
      {"name":"Tourna Grip Original","stock":6,"threshold":20}
    ]'::jsonb,
    'Admin low stock list'
  ),
  (
    'admin_recent_orders',
    '[
      {"id":"ORD-91204","customer":"정민수","items":"Wilson RF97 + ALU Power 1.25","total":421000,"status":"결제완료","time":"10분 전"},
      {"id":"ORD-91203","customer":"박서연","items":"Hyper-G Soft 1.20 x2","total":56000,"status":"배송준비","time":"32분 전"},
      {"id":"ORD-91202","customer":"이도윤","items":"Asics Court FF 3 (270mm)","total":189000,"status":"배송중","time":"1시간 전"},
      {"id":"ORD-91201","customer":"한우진","items":"Babolat Pure Aero","total":309000,"status":"결제완료","time":"2시간 전"},
      {"id":"ORD-91200","customer":"최예린","items":"Tourna Grip Original x3","total":36000,"status":"취소","time":"3시간 전"}
    ]'::jsonb,
    'Admin recent orders'
  ),
  (
    'admin_open_status',
    '{"label":"영업 중 · 10:00 - 21:00","open":true}'::jsonb,
    'Admin open status badge'
  )
ON CONFLICT (key) DO UPDATE
SET payload = EXCLUDED.payload,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = now();
