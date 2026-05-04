const { readFileSync } = require('fs');
const { join } = require('path');

const readFunction = () =>
  readFileSync(
    join(process.cwd(), 'supabase/functions/send-notification/index.ts'),
    'utf8',
  );

describe('send-notification Edge Function 보안', () => {
  test('admin notification type allowlist stays in sync with the app service', () => {
    const functionSource = readFunction();
    const serviceSource = readFileSync(
      join(process.cwd(), 'src/services/bookingNotificationService.ts'),
      'utf8',
    );
    const adminTypes = [
      'admin_new_booking',
      'admin_booking_cancelled',
      'admin_booking_cancel_requested',
      'admin_reschedule_requested',
      'admin_demo_overdue',
      'admin_no_show_risk',
    ];

    for (const notificationType of adminTypes) {
      expect(serviceSource).toContain(`'${notificationType}'`);
      expect(functionSource).toContain(`'${notificationType}'`);
    }
  });

  test('JWT 호출자와 알림 대상/예약 관계를 검증한 뒤 service role insert를 수행한다', () => {
    const source = readFunction();
    const permissionCheckIndex = source.indexOf(
      'await assertNotificationPermission(supabase, payload, caller.id);',
    );
    const insertIndex = source.indexOf(".from('notifications')");

    expect(source).toContain("Deno.env.get('SUPABASE_ANON_KEY')");
    expect(source).toContain('auth.getUser(token)');
    expect(source).toContain('getBearerToken(request)');
    expect(source).toContain('assertNotificationPermission');
    expect(source).toContain('adminNotificationTypes');
    expect(source).toContain('assertBookingAccess');
    expect(source).toContain('본인 예약 알림만 요청할 수 있습니다.');
    expect(source).toContain('관리자만 운영 알림을 발송할 수 있습니다.');
    expect(permissionCheckIndex).toBeGreaterThan(-1);
    expect(insertIndex).toBeGreaterThan(permissionCheckIndex);
  });
});
