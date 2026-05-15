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

  test('dashboard KPI cards link to their operational admin pages', () => {
    const adminKpis = read('apps/admin-web/components/admin/admin-kpis.tsx');
    const operationalData = read('apps/admin-web/lib/admin-operational-data.ts');

    expect(adminKpis).toContain("from 'next/link'");
    expect(adminKpis).toContain('href={k.href}');
    expect(operationalData).toContain("href: '/admin/queue'");
    expect(operationalData).toContain("href: '/admin/bookings'");
    expect(operationalData).not.toContain("href: '/admin/demo'");
    expect(operationalData).toContain("href: '/admin/orders'");
    expect(operationalData).toContain("href: '/admin/inventory'");
  });

  test('admin REST PATCH helper does not parse return=minimal empty responses', () => {
    const actions = read('apps/admin-web/lib/admin-actions.ts');
    const patchRowBody = actions.match(
      /async function patchRow[\s\S]*?\n}\n\nasync function fetchRows/,
    )?.[0];

    expect(patchRowBody).toContain("Prefer: 'return=minimal'");
    expect(patchRowBody).not.toContain('response.json()');
  });

  test('admin REST read helper parses JSON rows for server-side guards', () => {
    const actions = read('apps/admin-web/lib/admin-actions.ts');
    const fetchRowsBody = actions.match(
      /async function fetchRows[\s\S]*?\n}\n\nasync function upsertRow/,
    )?.[0];

    expect(fetchRowsBody).toContain('return (await response.json()) as T[];');
    expect(fetchRowsBody).not.toContain('return [] as T[];');
  });

  test('reservation status column shows admin cancel and no-show distinctly', () => {
    const adminData = read('apps/admin-web/lib/admin-data.ts');
    const statusMenu = read('apps/admin-web/components/admin/booking-status-menu.tsx');

    expect(adminData).toContain("cancelled_admin: '관리자 취소'");
    expect(adminData).toContain("no_show: '노쇼'");
    expect(statusMenu).not.toContain('toServiceWorkStatus(currentStatus)');
  });

  test('reservation status filters include admin cancel and no-show tabs', () => {
    const filterPanel = read('apps/admin-web/components/admin/bookings-filter-panel.tsx');

    expect(filterPanel).toContain("key: 'cancelled_admin'");
    expect(filterPanel).toContain("label: '관리자 취소'");
    expect(filterPanel).toContain("key: 'no_show'");
    expect(filterPanel).toContain("label: '노쇼'");
  });
});
