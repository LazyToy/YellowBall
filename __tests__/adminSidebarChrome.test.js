const fs = require('fs');
const path = require('path');

const read = (relativePath) =>
  fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

describe('admin sidebar chrome', () => {
  test('sidebar omits the store identity panels and bottom return action', () => {
    const sidebar = read('apps/admin-web/components/admin/admin-sidebar.tsx');

    expect(sidebar).not.toContain('Admin Console');
    expect(sidebar).not.toContain('href="/me"');
    expect(sidebar).not.toContain('storeInitial');
    expect(sidebar).not.toContain('brandLabel');
    expect(sidebar).not.toContain('storeName?: string');
  });

  test('admin layout keeps store name in the topbar but not the sidebar', () => {
    const layout = read('apps/admin-web/app/admin/layout.tsx');

    expect(layout).not.toContain(`<AdminSidebar
        permissions={admin.permissions}
        profile={admin.profile}
        storeName={storeName}
      />`);
    expect(layout).toContain('<AdminTopbar profile={admin.profile} storeName={storeName} />');
  });
});
