import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

export const OPERATION_POLICY_KEY = 'operation_policy';

export type OperationPolicySettings = {
  bookingOpenHoursBefore: number;
  bookingMaxDaysAhead: number;
  maxConcurrentBookings: number;
  noShowAutoCancelMinutes: number;
  noShowSuspensionDays: number;
  unpaidAutoCancelMinutes: number;
  suspendedLoginBlocked: boolean;
  storePickupRefundHours: number;
  stringingRefundHours: number;
  autoRefundEnabled: boolean;
  notifyBookingConfirmation: boolean;
  notifyPickupReady: boolean;
  notifyMarketing: boolean;
};

type OperationPolicyClient = Pick<SupabaseClient<Database>, 'from'>;

const defaultOperationPolicySettings: OperationPolicySettings = {
  bookingOpenHoursBefore: 2,
  bookingMaxDaysAhead: 14,
  maxConcurrentBookings: 1,
  noShowAutoCancelMinutes: 20,
  noShowSuspensionDays: 14,
  unpaidAutoCancelMinutes: 10,
  suspendedLoginBlocked: true,
  storePickupRefundHours: 3,
  stringingRefundHours: 6,
  autoRefundEnabled: true,
  notifyBookingConfirmation: true,
  notifyPickupReady: true,
  notifyMarketing: false,
};

const numberPolicyKeys = new Set<keyof OperationPolicySettings>([
  'bookingOpenHoursBefore',
  'bookingMaxDaysAhead',
  'maxConcurrentBookings',
  'noShowAutoCancelMinutes',
  'noShowSuspensionDays',
  'unpaidAutoCancelMinutes',
  'storePickupRefundHours',
  'stringingRefundHours',
]);

const booleanPolicyKeys = new Set<keyof OperationPolicySettings>([
  'suspendedLoginBlocked',
  'autoRefundEnabled',
  'notifyBookingConfirmation',
  'notifyPickupReady',
  'notifyMarketing',
]);

export function createDefaultOperationPolicySettings(): OperationPolicySettings {
  return { ...defaultOperationPolicySettings };
}

export function mergeOperationPolicySettings(
  value: unknown,
): OperationPolicySettings {
  const settings = createDefaultOperationPolicySettings();

  if (!value || typeof value !== 'object') {
    return settings;
  }

  Object.entries(value as Record<string, unknown>).forEach(([key, nextValue]) => {
    const policyKey = key as keyof OperationPolicySettings;

    if (
      numberPolicyKeys.has(policyKey) &&
      typeof nextValue === 'number' &&
      Number.isFinite(nextValue)
    ) {
      settings[policyKey] = Math.max(0, nextValue) as never;
      return;
    }

    if (booleanPolicyKeys.has(policyKey) && typeof nextValue === 'boolean') {
      settings[policyKey] = nextValue as never;
    }
  });

  settings.maxConcurrentBookings = Math.max(1, settings.maxConcurrentBookings);
  return settings;
}

export const createOperationPolicyService = (
  client: OperationPolicyClient,
) => ({
  async getSettings(): Promise<OperationPolicySettings> {
    try {
      const { data, error } = await client
        .from('app_settings')
        .select('value')
        .eq('key', OPERATION_POLICY_KEY)
        .maybeSingle();

      if (error) {
        console.warn(
          '[operationPolicyService] Unable to load operation policy:',
          error.message,
        );
        return createDefaultOperationPolicySettings();
      }

      return mergeOperationPolicySettings(data?.value ?? null);
    } catch (error) {
      console.warn(
        '[operationPolicyService] Unable to process operation policy:',
        error,
      );
      return createDefaultOperationPolicySettings();
    }
  },
});

const getDefaultOperationPolicyService = async () => {
  const { supabase } = await import('./supabase');

  return createOperationPolicyService(supabase);
};

export const getOperationPolicySettings = () => {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve(createDefaultOperationPolicySettings());
  }

  return getDefaultOperationPolicyService().then((service) =>
    service.getSettings(),
  );
};
