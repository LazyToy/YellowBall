import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  AdminPermission,
  Database,
  DemoRacket,
  DemoRacketInsert,
  DemoRacketStatus,
  DemoRacketUpdate,
  Json,
  Profile,
} from '@/types/database';

type DemoRacketClient = Pick<SupabaseClient<Database>, 'from'>;
type NewDemoRacket = Omit<
  DemoRacketInsert,
  'id' | 'created_at' | 'updated_at'
>;

export type DemoBookingWindow = {
  start_time: string;
  expected_return_time?: string;
  end_time?: string;
  status?: string;
};

const blockedBookingStatuses = new Set([
  'requested',
  'approved',
  'in_use',
  'overdue',
]);

const allowedStatuses: DemoRacketStatus[] = [
  'active',
  'inactive',
  'maintenance',
  'damaged',
  'sold',
  'hidden',
];

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

const toJson = (value: unknown): Json | null => {
  if (value === undefined) {
    return null;
  }

  return value as Json;
};

const getProfileRole = async (
  client: DemoRacketClient,
  actorId: string,
): Promise<Profile['role']> => {
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', actorId)
    .single();

  if (error || !data) {
    throw toServiceError('관리자 역할을 확인하지 못했습니다.', error);
  }

  return data.role;
};

const getAdminPermissions = async (
  client: DemoRacketClient,
  actorId: string,
): Promise<AdminPermission | null> => {
  const { data, error } = await client
    .from('admin_permissions')
    .select('*')
    .eq('admin_id', actorId)
    .maybeSingle();

  if (error) {
    throw toServiceError('관리자 권한을 확인하지 못했습니다.', error);
  }

  return data ?? null;
};

const assertCanManageDemoRackets = async (
  client: DemoRacketClient,
  actorId: string,
) => {
  const role = await getProfileRole(client, actorId);

  if (role === 'super_admin') {
    return;
  }

  if (role !== 'admin') {
    throw new Error('시타 라켓 관리 권한이 없습니다.');
  }

  const permissions = await getAdminPermissions(client, actorId);

  if (!permissions?.can_manage_demo_rackets) {
    throw new Error('시타 라켓 관리 권한이 없습니다.');
  }
};

const writeAuditLog = async (
  client: DemoRacketClient,
  actorId: string,
  action: string,
  targetId: string,
  beforeValue?: unknown,
  afterValue?: unknown,
) => {
  const { error } = await client.from('administrator_audit_logs').insert({
    actor_id: actorId,
    action,
    target_table: 'demo_rackets',
    target_id: targetId,
    before_value: toJson(beforeValue),
    after_value: toJson(afterValue),
  });

  if (error) {
    throw toServiceError('관리자 행동 로그를 저장하지 못했습니다.', error);
  }
};

const getWindowEnd = (window: DemoBookingWindow) =>
  window.expected_return_time ?? window.end_time ?? window.start_time;

const overlaps = (a: DemoBookingWindow, b: DemoBookingWindow) => {
  const aStart = new Date(a.start_time).getTime();
  const aEnd = new Date(getWindowEnd(a)).getTime();
  const bStart = new Date(b.start_time).getTime();
  const bEnd = new Date(getWindowEnd(b)).getTime();

  return aStart < bEnd && bStart < aEnd;
};

export const isAvailableForBooking = (
  racket: Pick<DemoRacket, 'status' | 'is_demo_enabled' | 'is_active'>,
  slot: DemoBookingWindow,
  existingBookings: DemoBookingWindow[] = [],
) => {
  if (
    racket.status !== 'active' ||
    !racket.is_demo_enabled ||
    !racket.is_active
  ) {
    return false;
  }

  const slotStart = new Date(slot.start_time).getTime();
  const slotEnd = new Date(getWindowEnd(slot)).getTime();

  if (!Number.isFinite(slotStart) || !Number.isFinite(slotEnd) || slotStart >= slotEnd) {
    return false;
  }

  return !existingBookings.some((booking) => {
    if (booking.status && !blockedBookingStatuses.has(booking.status)) {
      return false;
    }

    return overlaps(slot, booking);
  });
};

export const createDemoRacketService = (client: DemoRacketClient) => ({
  async getDemoRackets(): Promise<DemoRacket[]> {
    const { data, error } = await client
      .from('demo_rackets')
      .select('*')
      .eq('status', 'active')
      .eq('is_demo_enabled', true)
      .eq('is_active', true)
      .order('brand', { ascending: true });

    if (error) {
      throw toServiceError('시타 라켓 목록을 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },

  async getAllDemoRackets(): Promise<DemoRacket[]> {
    const { data, error } = await client
      .from('demo_rackets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('시타 라켓 관리 목록을 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },

  async getDemoRacket(id: string): Promise<DemoRacket> {
    const { data, error } = await client
      .from('demo_rackets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw toServiceError('시타 라켓을 찾지 못했습니다.', error);
    }

    return data;
  },

  async addDemoRacket(
    actorId: string,
    data: NewDemoRacket,
  ): Promise<DemoRacket> {
    await assertCanManageDemoRackets(client, actorId);

    const { data: racket, error } = await client
      .from('demo_rackets')
      .insert(data)
      .select('*')
      .single();

    if (error || !racket) {
      throw toServiceError('시타 라켓을 등록하지 못했습니다.', error);
    }

    await writeAuditLog(client, actorId, 'demo_racket.create', racket.id, null, racket);

    return racket;
  },

  async updateDemoRacket(
    actorId: string,
    id: string,
    data: DemoRacketUpdate,
  ): Promise<DemoRacket> {
    await assertCanManageDemoRackets(client, actorId);

    const before = await this.getDemoRacket(id);
    const { data: racket, error } = await client
      .from('demo_rackets')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !racket) {
      throw toServiceError('시타 라켓을 수정하지 못했습니다.', error);
    }

    await writeAuditLog(client, actorId, 'demo_racket.update', id, before, racket);

    return racket;
  },

  async updateStatus(
    actorId: string,
    id: string,
    status: DemoRacketStatus,
  ): Promise<DemoRacket> {
    if (!allowedStatuses.includes(status)) {
      throw new Error('지원하지 않는 시타 라켓 상태입니다.');
    }

    const before = await this.getDemoRacket(id);
    const racket = await this.updateDemoRacket(actorId, id, { status });

    await writeAuditLog(
      client,
      actorId,
      'demo_racket.status.update',
      id,
      before,
      racket,
    );

    return racket;
  },
});

const getDefaultDemoRacketService = async () => {
  const { supabase } = await import('./supabase');

  return createDemoRacketService(supabase);
};

export const getDemoRackets = () =>
  getDefaultDemoRacketService().then((service) => service.getDemoRackets());

export const getAllDemoRackets = () =>
  getDefaultDemoRacketService().then((service) => service.getAllDemoRackets());

export const addDemoRacket = (actorId: string, data: NewDemoRacket) =>
  getDefaultDemoRacketService().then((service) =>
    service.addDemoRacket(actorId, data),
  );

export const updateDemoRacket = (
  actorId: string,
  id: string,
  data: DemoRacketUpdate,
) =>
  getDefaultDemoRacketService().then((service) =>
    service.updateDemoRacket(actorId, id, data),
  );

export const updateStatus = (
  actorId: string,
  id: string,
  status: DemoRacketStatus,
) =>
  getDefaultDemoRacketService().then((service) =>
    service.updateStatus(actorId, id, status),
  );
