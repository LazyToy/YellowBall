import type { SupabaseClient } from '@supabase/supabase-js';

import { createStorageService } from './storageService';
import type {
  Database,
  RacketConditionCheck,
  RacketConditionCheckInsert,
} from '@/types/database';

type ConditionCheckClient = Pick<SupabaseClient<Database>, 'from' | 'storage'>;

export type ConditionPhotoInput = {
  fileUri: string;
  blob: Blob;
};

export type AddConditionCheckInput = Omit<
  RacketConditionCheckInsert,
  'id' | 'photo_urls' | 'checked_at'
> & {
  photos?: ConditionPhotoInput[];
  photoUrls?: string[];
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

const assertCheckType = (checkType: AddConditionCheckInput['check_type']) => {
  if (!['before_rental', 'after_return'].includes(checkType)) {
    throw new Error('지원하지 않는 시타 상태 체크 유형입니다.');
  }
};

const normalizeDepositDeduction = (value?: number | null) => {
  if (value === undefined || value === null) {
    return 0;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error('보증금 차감액은 0 이상의 정수여야 합니다.');
  }

  return value;
};

export const createConditionCheckService = (
  client: ConditionCheckClient,
  storageService = createStorageService(client),
) => ({
  async addCheck(input: AddConditionCheckInput): Promise<RacketConditionCheck> {
    assertCheckType(input.check_type);
    const depositDeduction = normalizeDepositDeduction(input.deposit_deduction);
    const uploadedUrls = await Promise.all(
      (input.photos ?? []).map((photo) =>
        storageService.uploadConditionPhoto(
          input.checked_by,
          photo.fileUri,
          photo.blob,
        ),
      ),
    );
    const photoUrls = [...(input.photoUrls ?? []), ...uploadedUrls];

    const { data, error } = await client
      .from('racket_condition_checks')
      .insert({
        demo_booking_id: input.demo_booking_id,
        check_type: input.check_type,
        photo_urls: photoUrls,
        scratch_notes: input.scratch_notes ?? null,
        string_condition: input.string_condition ?? null,
        grip_condition: input.grip_condition ?? null,
        damage_detected: input.damage_detected ?? false,
        deposit_deduction: depositDeduction,
        checked_by: input.checked_by,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('시타 상태 체크를 저장하지 못했습니다.', error);
    }

    return data;
  },

  async getChecks(bookingId: string): Promise<RacketConditionCheck[]> {
    const { data, error } = await client
      .from('racket_condition_checks')
      .select('*')
      .eq('demo_booking_id', bookingId)
      .order('checked_at', { ascending: true });

    if (error) {
      throw toServiceError('시타 상태 체크를 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },
});

const getDefaultConditionCheckService = async () => {
  const { supabase } = await import('./supabase');

  return createConditionCheckService(supabase);
};

export const addConditionCheck = (input: AddConditionCheckInput) =>
  getDefaultConditionCheckService().then((service) => service.addCheck(input));

export const getConditionChecks = (bookingId: string) =>
  getDefaultConditionCheckService().then((service) =>
    service.getChecks(bookingId),
  );
