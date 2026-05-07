INSERT INTO app_content_blocks (key, payload, description, is_active)
VALUES
  (
    'home_banners',
    '[
      {
        "id": "home-stringing",
        "meta": "STRINGING",
        "title": "오늘 컨디션에 맞춘 스트링",
        "subtitle": "새 스트링 작업을 빠르게 예약하세요.",
        "buttonLabel": "예약하기",
        "image_path": "seed/home-banner-stringing.png",
        "route": "/new-booking"
      },
      {
        "id": "home-demo-rackets",
        "meta": "DEMO RACKETS",
        "title": "새 라켓을 찾는 시간",
        "subtitle": "인기 라켓을 비교하고 다음 장비를 찾아보세요.",
        "buttonLabel": "둘러보기",
        "image_path": "seed/home-banner-demo-rackets.png",
        "route": "/shop"
      },
      {
        "id": "home-accessories",
        "meta": "SHOP",
        "title": "코트 준비를 더 가볍게",
        "subtitle": "스트링, 그립, 액세서리를 한 번에 확인하세요.",
        "buttonLabel": "쇼핑하기",
        "image_path": "seed/home-banner-accessories.png",
        "route": "/shop"
      }
    ]'::jsonb,
    'Home image banner carousel',
    true
  )
ON CONFLICT (key) DO UPDATE
SET payload = EXCLUDED.payload,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = now();
