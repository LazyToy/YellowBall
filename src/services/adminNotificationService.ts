import type { SupabaseClient } from '@supabase/supabase-js';

import { adminNotificationTypes } from './bookingNotificationService';
import type { AppNotification, Database } from '@/types/database';

type AdminNotificationClient = Pick<SupabaseClient<Database>, 'from'>;
export type AdminNotificationType = (typeof adminNotificationTypes)[number];

export type AdminNotificationFilters = {
  type?: AdminNotificationType | 'all';
  unreadOnly?: boolean;
};

const toServiceError = (message: string, error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return new Error(`${message} ${error.message}`);
  }

  return new Error(message);
};

const assertAdmin = async (
  client: AdminNotificationClient,
  adminId: string,
) => {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single();

  if (error || !data || !['admin', 'super_admin'].includes(data.role)) {
    throw toServiceError('관리자만 알림센터를 볼 수 있습니다.', error);
  }
};

export const createAdminNotificationService = (
  client: AdminNotificationClient,
) => ({
  async getAdminNotifications(
    adminId: string,
    filters: AdminNotificationFilters = {},
  ): Promise<AppNotification[]> {
    await assertAdmin(client, adminId);

    let query = client
      .from('notifications')
      .select('*')
      .eq('user_id', adminId)
      .in('notification_type', [...adminNotificationTypes]);

    if (filters.type && filters.type !== 'all') {
      query = query.eq('notification_type', filters.type);
    }

    if (filters.unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      throw toServiceError('관리자 알림 목록을 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },

  async getUnreadAdminNotificationCount(adminId: string): Promise<number> {
    const rows = await this.getAdminNotifications(adminId, { unreadOnly: true });

    return rows.length;
  },

  async markAdminNotificationAsRead(
    adminId: string,
    notificationId: string,
  ): Promise<AppNotification> {
    await assertAdmin(client, adminId);

    const { data, error } = await client
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', adminId)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('관리자 알림을 읽음 처리하지 못했습니다.', error);
    }

    return data;
  },
});

const getDefaultAdminNotificationService = async () => {
  const { supabase } = await import('./supabase');

  return createAdminNotificationService(supabase);
};

export const getAdminNotifications = (
  adminId: string,
  filters?: AdminNotificationFilters,
) =>
  getDefaultAdminNotificationService().then((service) =>
    service.getAdminNotifications(adminId, filters),
  );

export const getUnreadAdminNotificationCount = (adminId: string) =>
  getDefaultAdminNotificationService().then((service) =>
    service.getUnreadAdminNotificationCount(adminId),
  );

export const markAdminNotificationAsRead = (
  adminId: string,
  notificationId: string,
) =>
  getDefaultAdminNotificationService().then((service) =>
    service.markAdminNotificationAsRead(adminId, notificationId),
  );
