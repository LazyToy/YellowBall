import { buildHomeFeaturedString } from '../src/utils/homeFeaturedStrings';
import type { StringCatalogItem } from '../src/types/database';

const stringItem: StringCatalogItem = {
  id: 'string-1',
  brand: 'Solinco',
  name: 'Hyper-G',
  gauge: '1.25',
  color: 'Green',
  image_url: 'app-assets/seed/hyper-g.png',
  description: '스핀 중심 폴리 스트링',
  price: 28000,
  recommended_style: 'spin',
  is_active: true,
  deactivation_reason: null,
  deactivated_at: null,
  created_at: '2099-05-04T00:00:00.000Z',
  updated_at: '2099-05-04T00:00:00.000Z',
};

describe('homeFeaturedStrings', () => {
  test('DB 스트링 데이터를 이미지 카드에 필요한 형태로 변환한다', () => {
    expect(buildHomeFeaturedString(stringItem, 0)).toEqual({
      brand: 'Solinco',
      description: '스핀 중심 폴리 스트링',
      gauge: '1.25',
      id: 'string-1',
      imageUrl: 'app-assets/seed/hyper-g.png',
      label: 'BEST',
      name: 'Hyper-G',
      price: 28000,
      tone: 'accent',
    });
  });
});
