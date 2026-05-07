import { normalizeHomeShopCategories } from '../src/utils/homeShopCategories';

describe('homeShopCategories', () => {
  test('DB 이미지 payload를 홈 카테고리 카드 데이터로 정규화한다', () => {
    expect(
      normalizeHomeShopCategories([
        {
          id: 'tennis-rackets',
          label: '테니스라켓',
          image_path: 'seed/wilson-pro-staff.png',
          route: '/shop',
        },
        '스트링',
      ]),
    ).toEqual([
      {
        id: 'tennis-rackets',
        image_path: 'seed/wilson-pro-staff.png',
        image_url: null,
        label: '테니스라켓',
        route: '/shop',
      },
      {
        id: '스트링',
        image_path: null,
        image_url: null,
        label: '스트링',
        route: '/shop',
      },
    ]);
  });
});
