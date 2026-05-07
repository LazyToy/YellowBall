// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type RequestBody = {
  userId: string;
  title: string;
  body: string;
  notificationType: string;
  data?: Record<string, unknown>;
  pushToken?: string | null;
  silent?: boolean;
};

const adminNotificationTypes = new Set([
  'admin_new_booking',
  'admin_booking_cancelled',
  'admin_booking_cancel_requested',
  'admin_reschedule_requested',
  'admin_demo_overdue',
  'admin_no_show_risk',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const assertString = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} 값이 올바르지 않습니다.`);
  }

  return value.trim();
};

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get('Authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    throw new Error('인증 토큰이 필요합니다.');
  }

  return match[1];
};

const getCaller = async (supabaseUrl: string, anonKey: string, token: string) => {
  const authClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    throw new Error('인증 사용자를 확인하지 못했습니다.');
  }

  return data.user;
};

const getProfile = async (supabase, userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('사용자 권한을 확인하지 못했습니다.');
  }

  return data;
};

const isAdminRole = (role: string) => role === 'admin' || role === 'super_admin';

const getBookingTable = (bookingType: unknown) => {
  if (bookingType === 'service') {
    return 'service_bookings';
  }

  if (bookingType === 'demo') {
    return 'demo_bookings';
  }

  throw new Error('예약 유형이 올바르지 않습니다.');
};

const assertBookingAccess = async (
  supabase,
  payload: RequestBody,
  callerId: string,
) => {
  const bookingId = assertString(payload.data?.bookingId, '예약 ID');
  const bookingType = assertString(payload.data?.bookingType, '예약 유형');
  const tableName = getBookingTable(bookingType);
  const expectedStatus = payload.notificationType.replace(`${bookingType}_`, '');
  const { data, error } = await supabase
    .from(tableName)
    .select('user_id, status')
    .eq('id', bookingId)
    .single();

  if (error || !data) {
    throw new Error('예약 정보를 확인하지 못했습니다.');
  }

  if (data.user_id !== callerId) {
    throw new Error('본인 예약 알림만 요청할 수 있습니다.');
  }

  if (
    !adminNotificationTypes.has(payload.notificationType) &&
    data.status !== expectedStatus
  ) {
    throw new Error('예약 상태와 알림 유형이 일치하지 않습니다.');
  }
};

const assertNotificationPermission = async (
  supabase,
  payload: RequestBody,
  callerId: string,
) => {
  const callerProfile = await getProfile(supabase, callerId);
  const targetProfile = await getProfile(supabase, payload.userId);
  const callerIsAdmin = isAdminRole(callerProfile.role);
  const targetIsAdmin = isAdminRole(targetProfile.role);

  if (adminNotificationTypes.has(payload.notificationType)) {
    if (!targetIsAdmin) {
      throw new Error('관리자 알림 대상이 올바르지 않습니다.');
    }

    if (callerIsAdmin) {
      return;
    }

    if (payload.notificationType !== 'admin_new_booking') {
      throw new Error('관리자만 운영 알림을 발송할 수 있습니다.');
    }

    await assertBookingAccess(supabase, payload, callerId);
    return;
  }

  if (callerIsAdmin) {
    return;
  }

  if (payload.userId !== callerId) {
    throw new Error('본인 알림만 발송할 수 있습니다.');
  }

  await assertBookingAccess(supabase, payload, callerId);
};

const sendExpoPush = async (
  token: string | null | undefined,
  message: Pick<RequestBody, 'title' | 'body' | 'data' | 'silent'>,
) => {
  if (!token) {
    return;
  }

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      title: message.title,
      body: message.body,
      data: message.data ?? {},
      sound: message.silent ? undefined : 'default',
    }),
  });
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = (await request.json()) as RequestBody;
    payload.userId = assertString(payload.userId, '수신자 ID');
    payload.title = assertString(payload.title, '알림 제목');
    payload.body = assertString(payload.body, '알림 내용');
    payload.notificationType = assertString(
      payload.notificationType,
      '알림 유형',
    );

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const caller = await getCaller(supabaseUrl, anonKey, getBearerToken(request));
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await assertNotificationPermission(supabase, payload, caller.id);

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body,
        notification_type: payload.notificationType,
        data: payload.data ?? null,
        sent_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await sendExpoPush(payload.pushToken, payload);

    return new Response(JSON.stringify({ ok: true, notification }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
