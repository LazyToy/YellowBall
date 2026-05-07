'use server';

/**
 * 관리자 대시보드 Server Actions
 * - 예약 상태 변경, 상품 재고 업데이트, 주문 상태 변경 등 실제 DB 뮤테이션 처리
 */

import { revalidatePath } from 'next/cache';
import {
  requireAdminPermission,
  requireSuperAdmin,
} from './admin-auth';
import {
  MENU_SETTINGS_KEY,
  POLICY_SETTINGS_KEY,
  STORE_SETTINGS_KEY,
  menuGroups,
  mergeMenuSettings,
  mergePolicySettings,
  mergeStoreSettings,
  normalizeAdminPermissions,
  normalizeShopSchedule,
  permissionDefinitions,
  type AdminPermissionKey,
  type AdminPermissionRow,
  type AppSettingRow,
  type MenuId,
  type PolicySettings,
  type ProfileRow,
  type ShopScheduleRow,
  type StoreSettings,
} from './super-admin-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Supabase REST API 공통 PATCH 헬퍼
 */
async function patchRow(table: string, id: string, idField: string, payload: Record<string, unknown>) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
  }

  const url = `${supabaseUrl}/rest/v1/${table}?${idField}=eq.${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DB 업데이트 실패 (${table}): ${response.status} ${text}`);
  }

  return response.json();
}

async function fetchRows<T>(table: string, params: Record<string, string>) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
  }

  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DB 조회 실패 (${table}): ${response.status} ${text}`);
  }

  return [] as T[];
}

async function upsertRow<T>(table: string, payload: Record<string, unknown>, conflictKey: string) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
  }

  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  url.searchParams.set('on_conflict', conflictKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DB 저장 실패 (${table}): ${response.status} ${text}`);
  }

  return (await response.json()) as T[];
}

async function upsertRows<T>(table: string, payload: Record<string, unknown>[], conflictKey: string) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
  }

  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  url.searchParams.set('on_conflict', conflictKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DB 저장 실패 (${table}): ${response.status} ${text}`);
  }

  return (await response.json()) as T[];
}

async function insertRows<T>(table: string, payload: Record<string, unknown>[]) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
  }

  if (payload.length === 0) {
    return [] as T[];
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DB 생성 실패 (${table}): ${response.status} ${text}`);
  }

  return (await response.json()) as T[];
}

async function deleteRow(table: string, id: string, idField: string) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
  }

  const url = `${supabaseUrl}/rest/v1/${table}?${idField}=eq.${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DB 삭제 실패 (${table}): ${response.status} ${text}`);
  }
}

async function insertAuditLog(
  actorId: string,
  action: string,
  targetTable: string,
  targetId: string | null,
  beforeValue: unknown,
  afterValue: unknown,
) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/administrator_audit_logs`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      actor_id: actorId,
      action,
      target_table: targetTable,
      target_id: targetId,
      before_value: beforeValue,
      after_value: afterValue,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`감사 로그 저장 실패: ${response.status} ${text}`);
  }
}

function assertUuid(value: string, label: string) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(value)) {
    throw new Error(`${label} 값이 올바른 UUID가 아닙니다.`);
  }
}

async function getProfile(profileId: string) {
  const [profile] = await fetchRows<ProfileRow>('profiles', {
    select: 'id,username,nickname,email,phone,role,status,created_at,updated_at',
    id: `eq.${profileId}`,
    limit: '1',
  });

  if (!profile) {
    throw new Error('대상 사용자를 찾지 못했습니다.');
  }

  return profile;
}

const trimRequired = (value: string, label: string, maxLength: number) => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${label}을 입력해야 합니다.`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${label}은 ${maxLength}자 이하로 입력해야 합니다.`);
  }

  return trimmed;
};

const normalizeAnnouncementType = (value: string): 'notice' | 'event' => {
  if (value === 'event') {
    return 'event';
  }

  return 'notice';
};

const normalizeAnnouncementStatus = (
  value: string,
): 'published' | 'draft' | 'archived' => {
  if (value === 'draft' || value === 'archived') {
    return value;
  }

  return 'published';
};

async function loadNotificationTargets() {
  return fetchRows<{ id: string }>('profiles', {
    select: 'id',
    order: 'created_at.asc',
    limit: '10000',
  });
}

async function loadAnnouncementBlock(announcementKey: string) {
  const [row] = await fetchRows<{
    key: string;
    payload: Record<string, unknown> | null;
    is_active: boolean;
  }>('app_content_blocks', {
    select: 'key,payload,is_active',
    key: `eq.${announcementKey}`,
    limit: '1',
  });

  if (!row) {
    throw new Error('공지 게시물을 찾을 수 없습니다.');
  }

  return row;
}

export async function bulkInsertNotifications(
  notifications: Record<string, unknown>[],
) {
  const batchSize = 500;
  const inserted: unknown[] = [];

  for (let index = 0; index < notifications.length; index += batchSize) {
    const batch = notifications.slice(index, index + batchSize);
    await insertRows('notifications', batch);
    inserted.push(...batch);
  }

  return inserted.length;
}

function sanitizePermissionUpdate(permissions: Partial<AdminPermissionRow>) {
  return permissionDefinitions.reduce<Partial<AdminPermissionRow>>((next, definition) => {
    if (typeof permissions[definition.key] === 'boolean') {
      next[definition.key] = permissions[definition.key];
    }

    return next;
  }, {});
}

async function getCurrentMenuSetting() {
  const [setting] = await fetchRows<AppSettingRow>('app_settings', {
    select: 'key,value,updated_by,updated_at',
    key: `eq.${MENU_SETTINGS_KEY}`,
    limit: '1',
  });

  return setting ?? null;
}

async function getCurrentAppSetting(key: string) {
  const [setting] = await fetchRows<AppSettingRow>('app_settings', {
    select: 'key,value,updated_by,updated_at',
    key: `eq.${key}`,
    limit: '1',
  });

  return setting ?? null;
}

function sanitizeStoreSettings(settings: StoreSettings) {
  const merged = mergeStoreSettings(settings);

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => [key, value.trim()]),
  ) as StoreSettings;
}

function sanitizePolicySettings(settings: PolicySettings) {
  const merged = mergePolicySettings(settings);
  const numberRanges: Partial<Record<keyof PolicySettings, [number, number]>> = {
    bookingOpenHoursBefore: [0, 168],
    bookingMaxDaysAhead: [1, 365],
    maxConcurrentBookings: [1, 100],
    noShowAutoCancelMinutes: [0, 1440],
    noShowSuspensionDays: [0, 365],
    unpaidAutoCancelMinutes: [0, 1440],
    storePickupRefundHours: [0, 720],
    stringingRefundHours: [0, 720],
  };

  Object.entries(numberRanges).forEach(([key, [min, max]]) => {
    const value = merged[key as keyof PolicySettings];
    if (typeof value !== 'number' || value < min || value > max) {
      throw new Error(`${key} 값은 ${min} 이상 ${max} 이하여야 합니다.`);
    }
  });

  return merged;
}

function sanitizeScheduleRows(rows: ShopScheduleRow[]) {
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const normalized = normalizeShopSchedule(rows);

  return normalized.map((row) => {
    if (!timePattern.test(row.open_time) || !timePattern.test(row.close_time)) {
      throw new Error(`${row.label}요일 영업시간 형식이 올바르지 않습니다.`);
    }

    return {
      day_of_week: row.day_of_week,
      open_time: row.open_time,
      close_time: row.close_time,
      is_closed: row.is_closed,
      updated_at: new Date().toISOString(),
    };
  });
}

/**
 * 서비스 예약 상태 변경 (예: requested → approved)
 */
export async function updateServiceBookingStatus(bookingId: string, newStatus: string) {
  try {
    await requireAdminPermission('can_manage_bookings');
    await patchRow('service_bookings', bookingId, 'id', {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('[updateServiceBookingStatus]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 데모 예약 상태 변경
 */
export async function updateDemoBookingStatus(bookingId: string, newStatus: string) {
  try {
    await requireAdminPermission('can_manage_bookings');
    await patchRow('demo_bookings', bookingId, 'id', {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('[updateDemoBookingStatus]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 상품 재고 업데이트
 */
export async function updateProductStock(productId: string, newStock: number) {
  try {
    await requireAdminPermission('can_manage_products');
    if (newStock < 0) throw new Error('재고는 0 이상이어야 합니다.');
    await patchRow('shop_products', productId, 'id', {
      stock_quantity: newStock,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('[updateProductStock]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 상품 활성/비활성 토글
 */
export async function toggleProductActive(productId: string, isActive: boolean) {
  try {
    await requireAdminPermission('can_manage_products');
    await patchRow('shop_products', productId, 'id', {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    return { success: true };
  } catch (error) {
    console.error('[toggleProductActive]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 주문 상태 변경
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await requireAdminPermission('can_manage_orders');
    await patchRow('shop_orders', orderId, 'id', {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/orders');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('[updateOrderStatus]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 데모 라켓 상태 변경
 */
export async function updateDemoRacketStatus(racketId: string, newStatus: string) {
  try {
    await requireAdminPermission('can_manage_demo_rackets');
    await patchRow('demo_rackets', racketId, 'id', {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/demo');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('[updateDemoRacketStatus]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 고객(프로필) 상태 변경 (정상 ↔ suspended)
 */
export async function updateProfileStatus(profileId: string, newStatus: 'active' | 'suspended') {
  try {
    await requireAdminPermission('can_ban_users');
    await patchRow('profiles', profileId, 'id', {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/customers');
    return { success: true };
  } catch (error) {
    console.error('[updateProfileStatus]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 실제 고객 목록 조회 (Server Action으로도 사용 가능)
 */
export async function loadProfiles(limit = 100) {
  await requireAdminPermission('can_ban_users');

  if (!supabaseUrl || !serviceRoleKey) return [];

  const url = new URL('/rest/v1/profiles', supabaseUrl);
  url.searchParams.set('select', 'id,username,nickname,phone,email,status,role,created_at');
  url.searchParams.set('order', 'created_at.desc');
  url.searchParams.set('limit', `${limit}`);

  const res = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!res.ok) {
    console.error('[loadProfiles]', res.status);
    return [];
  }

  return res.json() as Promise<{
    id: string;
    username: string | null;
    nickname: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    role: string;
    created_at: string;
  }[]>;
}

export async function loadProfileById(profileId: string) {
  await requireAdminPermission('can_ban_users');
  assertUuid(profileId, '사용자 ID');

  return getProfile(profileId);
}

export async function sendAnnouncementNotification(
  announcementKey: string,
  input: {
    title: string;
    body: string;
    type: 'notice' | 'event';
  },
) {
  try {
    await requireAdminPermission('can_post_notice');

    if (!announcementKey.startsWith('announcement:')) {
      throw new Error('공지 식별자가 올바르지 않습니다.');
    }

    const title = trimRequired(input.title, '알림 제목', 80);
    const body = trimRequired(input.body, '알림 내용', 500);
    const targets = await loadNotificationTargets();
    const sentAt = new Date().toISOString();
    const notificationType = input.type === 'event' ? 'event' : 'announcement';

    await bulkInsertNotifications(
      targets.map((target) => ({
        user_id: target.id,
        title,
        body,
        notification_type: notificationType,
        data: {
          announcementKey,
          type: input.type,
        },
        read: false,
        sent_at: sentAt,
      })),
    );

    return { success: true, sentCount: targets.length };
  } catch (error) {
    console.error('[sendAnnouncementNotification]', error);
    return { success: false, error: String(error), sentCount: 0 };
  }
}

export async function createAnnouncement(payload: {
  title: string;
  body: string;
  type: 'notice' | 'event';
  status?: 'published' | 'draft';
  startsAt?: string | null;
  endsAt?: string | null;
}) {
  try {
    await requireAdminPermission('can_post_notice');

    const title = trimRequired(payload.title, '제목', 80);
    const body = trimRequired(payload.body, '본문', 1000);
    const type = normalizeAnnouncementType(payload.type);
    const status = normalizeAnnouncementStatus(payload.status ?? 'published');
    const now = new Date().toISOString();
    const key = `announcement:${Date.now()}`;
    const rowPayload = {
      audience: '전체',
      body,
      endsAt: payload.endsAt || null,
      publishedAt: status === 'published' ? now : null,
      startsAt: payload.startsAt || null,
      status,
      title,
      type,
      views: 0,
    };

    await insertRows('app_content_blocks', [
      {
        key,
        payload: rowPayload,
        description: '관리자 공지/이벤트 게시물',
        is_active: status === 'published',
        created_at: now,
        updated_at: now,
      },
    ]);

    const notificationResult =
      status === 'published'
        ? await sendAnnouncementNotification(key, { title, body, type })
        : { success: true, sentCount: 0 };

    revalidatePath('/admin/announcements');
    return {
      success: notificationResult.success,
      key,
      sentCount: notificationResult.sentCount,
      error: notificationResult.success ? undefined : notificationResult.error,
    };
  } catch (error) {
    console.error('[createAnnouncement]', error);
    return { success: false, error: String(error), sentCount: 0 };
  }
}

export async function updateAnnouncementStatus(
  announcementKey: string,
  status: 'published' | 'draft' | 'archived',
) {
  try {
    await requireAdminPermission('can_post_notice');

    if (!announcementKey.startsWith('announcement:')) {
      throw new Error('공지 식별자가 올바르지 않습니다.');
    }

    const normalizedStatus = normalizeAnnouncementStatus(status);
    const isActive = normalizedStatus === 'published';
    const current = await loadAnnouncementBlock(announcementKey);
    const now = new Date().toISOString();
    const currentPayload =
      current.payload && typeof current.payload === 'object'
        ? current.payload
        : {};

    await patchRow('app_content_blocks', announcementKey, 'key', {
      is_active: isActive,
      payload: {
        ...currentPayload,
        publishedAt:
          normalizedStatus === 'published'
            ? currentPayload.publishedAt ?? now
            : currentPayload.publishedAt ?? null,
        status: normalizedStatus,
      },
      updated_at: now,
    });

    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error) {
    console.error('[updateAnnouncementStatus]', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteAnnouncement(announcementKey: string) {
  try {
    await requireAdminPermission('can_post_notice');

    if (!announcementKey.startsWith('announcement:')) {
      throw new Error('공지 식별자가 올바르지 않습니다.');
    }

    await deleteRow('app_content_blocks', announcementKey, 'key');
    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error) {
    console.error('[deleteAnnouncement]', error);
    return { success: false, error: String(error) };
  }
}

export async function appointAdminFromWeb(userId: string) {
  try {
    assertUuid(userId, '사용자 ID');
    const { profile: actor } = await requireSuperAdmin();
    const actorId = actor.id;
    const beforeProfile = await getProfile(userId);

    if (beforeProfile.role === 'super_admin') {
      throw new Error('슈퍼 관리자는 다시 임명할 수 없습니다.');
    }

    await patchRow('profiles', userId, 'id', {
      role: 'admin',
      updated_at: new Date().toISOString(),
    });

    const [permissions] = await upsertRow<AdminPermissionRow>(
      'admin_permissions',
      normalizeAdminPermissions(userId, null),
      'admin_id',
    );
    const afterProfile = await getProfile(userId);

    await insertAuditLog(
      actorId,
      'admin.appoint',
      'profiles',
      userId,
      { profile: beforeProfile },
      { profile: afterProfile, permissions },
    );

    revalidatePath('/admin/super/admins');
    revalidatePath('/admin/customers');
    return { success: true };
  } catch (error) {
    console.error('[appointAdminFromWeb]', error);
    return { success: false, error: String(error) };
  }
}

export async function dismissAdminFromWeb(adminId: string) {
  try {
    assertUuid(adminId, '관리자 ID');
    const { profile: actor } = await requireSuperAdmin();
    const actorId = actor.id;

    if (actorId === adminId) {
      throw new Error('자기 자신은 해임할 수 없습니다.');
    }

    const beforeProfile = await getProfile(adminId);
    if (beforeProfile.role !== 'admin') {
      throw new Error('일반 관리자만 해임할 수 있습니다.');
    }

    const [beforePermissions] = await fetchRows<AdminPermissionRow>('admin_permissions', {
      select: '*',
      admin_id: `eq.${adminId}`,
      limit: '1',
    });

    await patchRow('profiles', adminId, 'id', {
      role: 'user',
      updated_at: new Date().toISOString(),
    });
    await deleteRow('admin_permissions', adminId, 'admin_id');
    const afterProfile = await getProfile(adminId);

    await insertAuditLog(
      actorId,
      'admin.dismiss',
      'profiles',
      adminId,
      { profile: beforeProfile, permissions: beforePermissions ?? null },
      { profile: afterProfile, permissions: null },
    );

    revalidatePath('/admin/super/admins');
    revalidatePath('/admin/customers');
    return { success: true };
  } catch (error) {
    console.error('[dismissAdminFromWeb]', error);
    return { success: false, error: String(error) };
  }
}

export async function updateAdminPermissionsFromWeb(
  adminId: string,
  permissions: Partial<Record<AdminPermissionKey, boolean>>,
) {
  try {
    assertUuid(adminId, '관리자 ID');
    const { profile: actor } = await requireSuperAdmin();
    const actorId = actor.id;

    if (actorId === adminId) {
      throw new Error('자기 자신의 권한은 직접 변경할 수 없습니다.');
    }

    const targetProfile = await getProfile(adminId);
    if (targetProfile.role !== 'admin') {
      throw new Error('일반 관리자 권한만 변경할 수 있습니다.');
    }

    const [beforePermissions] = await fetchRows<AdminPermissionRow>('admin_permissions', {
      select: '*',
      admin_id: `eq.${adminId}`,
      limit: '1',
    });
    const nextPermissions = normalizeAdminPermissions(adminId, {
      ...(beforePermissions ?? {}),
      ...sanitizePermissionUpdate(permissions),
      admin_id: adminId,
    });
    const [savedPermissions] = await upsertRow<AdminPermissionRow>(
      'admin_permissions',
      nextPermissions,
      'admin_id',
    );

    await insertAuditLog(
      actorId,
      'admin.permissions.update',
      'admin_permissions',
      adminId,
      beforePermissions ?? null,
      savedPermissions,
    );

    revalidatePath('/admin/super/admins');
    return { success: true, permissions: savedPermissions };
  } catch (error) {
    console.error('[updateAdminPermissionsFromWeb]', error);
    return { success: false, error: String(error) };
  }
}

export async function updateMenuSettingFromWeb(menuId: MenuId, enabled: boolean) {
  try {
    const { profile: actor } = await requireSuperAdmin();
    const allMenuItems = menuGroups.flatMap((group) => group.items);
    const targetMenu = allMenuItems.find((item) => item.id === menuId);

    if (!targetMenu) {
      throw new Error('알 수 없는 메뉴입니다.');
    }

    if (targetMenu.locked && enabled === false) {
      throw new Error('잠긴 메뉴는 비활성화할 수 없습니다.');
    }

    const actorId = actor.id;
    const beforeSetting = await getCurrentMenuSetting();
    const nextSettings = mergeMenuSettings(beforeSetting?.value ?? null);
    nextSettings[menuId] = enabled;
    nextSettings['audit-log'] = true;

    const [savedSetting] = await upsertRow<AppSettingRow>(
      'app_settings',
      {
        key: MENU_SETTINGS_KEY,
        value: { menus: nextSettings },
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      },
      'key',
    );

    await insertAuditLog(
      actorId,
      'app.menu.update',
      'app_settings',
      null,
      beforeSetting,
      savedSetting,
    );

    revalidatePath('/admin/super/menus');
    return { success: true, settings: nextSettings };
  } catch (error) {
    console.error('[updateMenuSettingFromWeb]', error);
    return { success: false, error: String(error) };
  }
}

export async function updateStoreSettingsFromWeb(
  settings: StoreSettings,
  scheduleRows: ShopScheduleRow[],
) {
  try {
    const { profile: actor } = await requireAdminPermission('can_toggle_app_menu');
    const actorId = actor.id;
    const nextSettings = sanitizeStoreSettings(settings);
    const nextScheduleRows = sanitizeScheduleRows(scheduleRows);
    const [beforeSetting, beforeSchedule] = await Promise.all([
      getCurrentAppSetting(STORE_SETTINGS_KEY),
      fetchRows<ShopScheduleRow>('shop_schedule', {
        select: 'day_of_week,open_time,close_time,is_closed,updated_at',
        order: 'day_of_week.asc',
      }),
    ]);

    const [savedSetting, savedSchedule] = await Promise.all([
      upsertRow<AppSettingRow>(
        'app_settings',
        {
          key: STORE_SETTINGS_KEY,
          value: nextSettings,
          updated_by: actorId,
          updated_at: new Date().toISOString(),
        },
        'key',
      ),
      upsertRows<ShopScheduleRow>('shop_schedule', nextScheduleRows, 'day_of_week'),
    ]);

    await insertAuditLog(
      actorId,
      'store.settings.update',
      'app_settings',
      null,
      { setting: beforeSetting, schedule: beforeSchedule },
      { setting: savedSetting[0] ?? null, schedule: savedSchedule },
    );

    revalidatePath('/admin/settings');
    revalidatePath('/');
    return {
      success: true,
      settings: nextSettings,
      schedule: normalizeShopSchedule(savedSchedule),
    };
  } catch (error) {
    console.error('[updateStoreSettingsFromWeb]', error);
    return { success: false, error: String(error) };
  }
}

export async function updatePolicySettingsFromWeb(settings: PolicySettings) {
  try {
    const { profile: actor } = await requireSuperAdmin();
    const actorId = actor.id;
    const beforeSetting = await getCurrentAppSetting(POLICY_SETTINGS_KEY);
    const nextSettings = sanitizePolicySettings(settings);
    const [savedSetting] = await upsertRow<AppSettingRow>(
      'app_settings',
      {
        key: POLICY_SETTINGS_KEY,
        value: nextSettings,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      },
      'key',
    );

    await insertAuditLog(
      actorId,
      'app.policy.update',
      'app_settings',
      null,
      beforeSetting,
      savedSetting,
    );

    revalidatePath('/admin/super/policies');
    return { success: true, settings: mergePolicySettings(savedSetting?.value ?? nextSettings) };
  } catch (error) {
    console.error('[updatePolicySettingsFromWeb]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 데모 라켓 상세 정보 전체 업데이트
 * (상태, Storage 이미지 경로, 설명, 그립사이즈, 무게, 헤드사이즈, 데모 활성 여부)
 */
export async function updateDemoRacketDetail(
  racketId: string,
  payload: {
    status?: string;
    photo_url?: string | null;
    description?: string | null;
    grip_size?: string | null;
    weight?: number | null;
    head_size?: string | null;
    is_demo_enabled?: boolean;
    is_active?: boolean;
  },
) {
  try {
    await requireAdminPermission('can_manage_demo_rackets');
    await patchRow('demo_rackets', racketId, 'id', {
      ...payload,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/demo');
    revalidatePath(`/admin/demo/${racketId}`);
    return { success: true };
  } catch (error) {
    console.error('[updateDemoRacketDetail]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 상품 상세 정보 전체 업데이트
 * (이름, 카테고리, 정가, 판매가, Storage 이미지 경로, 태그, 정렬순서, 활성 여부, 재고수량)
 */
export async function updateProductDetail(
  productId: string,
  payload: {
    name?: string;
    category?: string;
    price?: number;
    sale_price?: number;
    image_path?: string | null;
    image_url?: string | null;
    tag?: string | null;
    sort_order?: number;
    is_active?: boolean;
    stock_quantity?: number;
  },
) {
  try {
    await requireAdminPermission('can_manage_products');
    await patchRow('shop_products', productId, 'id', {
      ...payload,
      updated_at: new Date().toISOString(),
    });
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath('/admin/inventory');
    return { success: true };
  } catch (error) {
    console.error('[updateProductDetail]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Supabase Storage에 이미지 파일 업로드 (app-assets 버킷)
 * @returns 업로드된 파일의 Storage 경로와 공개 URL
 */
export async function uploadStorageImage(
  formData: FormData,
  folder: 'products' | 'demo-rackets',
): Promise<{ path: string | null; url: string | null; error?: string }> {
  try {
    if (folder === 'products') {
      await requireAdminPermission('can_manage_products');
    } else {
      await requireAdminPermission('can_manage_demo_rackets');
    }

    const file = formData.get('file') as File | null;
    if (!file) return { path: null, url: null, error: '파일이 없습니다.' };

    const allowedTypes = new Map([
      ['image/png', 'png'],
      ['image/jpeg', 'jpg'],
      ['image/webp', 'webp'],
    ]);
    const ext = allowedTypes.get(file.type);

    if (!ext) {
      return {
        path: null,
        url: null,
        error: 'PNG, JPG, WEBP 이미지만 업로드할 수 있습니다.',
      };
    }

    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const buffer = await file.arrayBuffer();
    const uploadUrl = `${supabaseUrl}/storage/v1/object/app-assets/${filename}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': file.type || 'image/jpeg',
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        path: null,
        url: null,
        error: `업로드 실패 (${res.status}): ${text}`,
      };
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/app-assets/${filename}`;
    return { path: filename, url: publicUrl };
  } catch (error) {
    console.error('[uploadStorageImage]', error);
    return { path: null, url: null, error: String(error) };
  }
}

/**
 * 신규 상품 등록 (shop_products INSERT)
 */
export async function createProduct(payload: {
  name: string;
  category: string;
  price: number;
  sale_price: number;
  image_path?: string | null;
  image_url?: string | null;
  tag?: string | null;
  stock_quantity?: number;
  sort_order?: number;
  is_active?: boolean;
  tone?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdminPermission('can_manage_products');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
    }

    /* 상품 ID: name을 slug로 변환 후 타임스탬프 접미사 */
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24);
    const id = `prod-${slug}-${Date.now().toString(36)}`;

    const url = `${supabaseUrl}/rest/v1/shop_products`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id,
        name: payload.name,
        category: payload.category,
        price: payload.price,
        sale_price: payload.sale_price,
        image_path: payload.image_path ?? null,
        image_url: payload.image_url ?? null,
        tag: payload.tag ?? null,
        stock_quantity: payload.stock_quantity ?? 0,
        sort_order: payload.sort_order ?? 0,
        is_active: payload.is_active ?? true,
        tone: payload.tone ?? 'card',
        rating_average: 0,
        review_count: 0,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`상품 생성 실패 (${res.status}): ${text}`);
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    return { success: true, id };
  } catch (error) {
    console.error('[createProduct]', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 신규 시타 라켓 등록 (demo_rackets INSERT)
 */
export async function createDemoRacket(payload: {
  brand: string;
  model: string;
  grip_size?: string | null;
  weight?: number | null;
  head_size?: string | null;
  photo_url?: string | null;
  description?: string | null;
  status?: string;
  is_demo_enabled?: boolean;
  is_active?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdminPermission('can_manage_demo_rackets');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase 서비스 키가 설정되지 않았습니다.');
    }

    const url = `${supabaseUrl}/rest/v1/demo_rackets`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        brand: payload.brand,
        model: payload.model,
        grip_size: payload.grip_size ?? null,
        weight: payload.weight ?? null,
        head_size: payload.head_size ?? null,
        photo_url: payload.photo_url ?? null,
        description: payload.description ?? null,
        status: payload.status ?? 'active',
        is_demo_enabled: payload.is_demo_enabled ?? true,
        is_active: payload.is_active ?? true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`시타 라켓 생성 실패 (${res.status}): ${text}`);
    }

    const rows = await res.json();
    const newId = Array.isArray(rows) ? rows[0]?.id : rows?.id;

    revalidatePath('/admin/demo');
    return { success: true, id: newId };
  } catch (error) {
    console.error('[createDemoRacket]', error);
    return { success: false, error: String(error) };
  }
}
