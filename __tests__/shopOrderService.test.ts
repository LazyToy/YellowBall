import { createShopOrderService } from '../src/services/shopOrderService';

describe('shopOrderService', () => {
  test('getMyOrders는 로그인 사용자의 주문을 최신순으로 조회한다', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'order-1',
          user_id: 'user-1',
          order_number: 'ORD-1',
          status: 'paid',
          total_amount: 329000,
          items: [{ name: 'Wilson Pro Staff' }],
          created_at: '2026-05-06T00:00:00.000Z',
          updated_at: '2026-05-06T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createShopOrderService({ from } as never);

    await expect(service.getMyOrders('user-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'order-1',
        order_number: 'ORD-1',
        total_amount: 329000,
      }),
    ]);

    expect(from).toHaveBeenCalledWith('shop_orders');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});
