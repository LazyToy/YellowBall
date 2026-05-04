import type { SupabaseClient } from '@supabase/supabase-js';

import type { Address, AddressInsert, AddressUpdate, Database } from '@/types/database';

type AddressClient = Pick<SupabaseClient<Database>, 'from'>;
type NewAddress = Omit<AddressInsert, 'id' | 'created_at' | 'is_default'> & {
  is_default?: boolean;
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

const getAddressOwner = async (client: AddressClient, addressId: string) => {
  const { data, error } = await client
    .from('addresses')
    .select('user_id')
    .eq('id', addressId)
    .single();

  if (error || !data) {
    throw toServiceError('주소를 찾을 수 없습니다.', error);
  }

  return data.user_id;
};

const getFirstAddress = async (client: AddressClient, userId: string) => {
  const { data, error } = await client
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    throw toServiceError('기본 주소를 이전하지 못했습니다.', error);
  }

  return data?.[0] ?? null;
};

export const createAddressService = (client: AddressClient) => ({
  async getAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await client
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw toServiceError('주소 목록을 불러오지 못했습니다.', error);
    }

    return data ?? [];
  },

  async addAddress(data: NewAddress): Promise<Address> {
    const existing = await this.getAddresses(data.user_id);
    const shouldDefault = data.is_default ?? existing.length === 0;

    if (shouldDefault) {
      await client
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', data.user_id);
    }

    const { data: address, error } = await client
      .from('addresses')
      .insert({ ...data, is_default: shouldDefault })
      .select('*')
      .single();

    if (error || !address) {
      throw toServiceError('주소를 추가하지 못했습니다.', error);
    }

    return address;
  },

  async updateAddress(id: string, data: AddressUpdate): Promise<Address> {
    const userId = await getAddressOwner(client, id);

    if (data.is_default) {
      await client
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data: address, error } = await client
      .from('addresses')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !address) {
      throw toServiceError('주소를 수정하지 못했습니다.', error);
    }

    return address;
  },

  async deleteAddress(id: string): Promise<void> {
    const userId = await getAddressOwner(client, id);
    const current = await client
      .from('addresses')
      .select('is_default')
      .eq('id', id)
      .single();
    const wasDefault = Boolean(current.data?.is_default);
    const { error } = await client.from('addresses').delete().eq('id', id);

    if (error) {
      throw toServiceError('주소를 삭제하지 못했습니다.', error);
    }

    if (wasDefault) {
      const nextAddress = await getFirstAddress(client, userId);

      if (nextAddress) {
        await this.setDefaultAddress(nextAddress.id);
      }
    }
  },

  async setDefaultAddress(id: string): Promise<Address> {
    const userId = await getAddressOwner(client, id);

    await client
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    const { data, error } = await client
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw toServiceError('기본 주소를 설정하지 못했습니다.', error);
    }

    return data;
  },
});

const getDefaultAddressService = async () => {
  const { supabase } = await import('./supabase');

  return createAddressService(supabase);
};

export const getAddresses = (userId: string) =>
  getDefaultAddressService().then((service) => service.getAddresses(userId));

export const addAddress = (data: NewAddress) =>
  getDefaultAddressService().then((service) => service.addAddress(data));

export const updateAddress = (id: string, data: AddressUpdate) =>
  getDefaultAddressService().then((service) => service.updateAddress(id, data));

export const deleteAddress = (id: string) =>
  getDefaultAddressService().then((service) => service.deleteAddress(id));

export const setDefaultAddress = (id: string) =>
  getDefaultAddressService().then((service) => service.setDefaultAddress(id));
