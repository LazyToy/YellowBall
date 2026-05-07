const fs = require('fs');
const path = require('path');

const read = (relativePath) =>
  fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

describe('admin web operational pages', () => {
  test('customers page links rows to the customer detail route', () => {
    const customersPage = read('apps/admin-web/app/admin/customers/page.tsx');

    expect(customersPage).toContain("from 'next/link'");
    expect(customersPage).toContain('/admin/customers/${c.id}');
    expect(fs.existsSync(path.join(__dirname, '..', 'apps/admin-web/app/admin/customers/[id]/page.tsx'))).toBe(
      true,
    );
  });

  test('announcements page uses DB-backed actions instead of hard-coded mock rows', () => {
    const announcementsPage = read('apps/admin-web/app/admin/announcements/page.tsx');
    const actions = read('apps/admin-web/lib/admin-actions.ts');

    expect(announcementsPage).not.toContain('const items = [');
    expect(announcementsPage).toContain('loadAnnouncements');
    expect(actions).toContain('createAnnouncement');
    expect(actions).toContain('sendAnnouncementNotification');
    expect(actions).toContain('bulkInsertNotifications');
  });

  test('orders page manages shop, stringing, and demo orders through a client table', () => {
    const ordersPage = read('apps/admin-web/app/admin/orders/page.tsx');
    const adminData = read('apps/admin-web/lib/admin-data.ts');

    expect(ordersPage).toContain('OrderManagementTable');
    expect(adminData).toContain('toSettlementServiceOrder');
    expect(adminData).toContain('toSettlementDemoOrder');
    expect(adminData).toContain('toSettlementShopOrder');
  });
});
