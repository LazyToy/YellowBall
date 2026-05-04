import { createProfileService } from '../src/services/profileService';

const profile = {
  id: 'user-1',
  username: 'yellow01',
  nickname: '옐로우',
  phone: '010-0000-0000',
  role: 'user',
  status: 'active',
  created_at: '2026-04-30T00:00:00.000Z',
  updated_at: '2026-04-30T00:00:00.000Z',
};

describe('profileService', () => {
  test('getProfile은 profiles에서 본인 프로필을 단건 조회한다', async () => {
    const single = jest.fn().mockResolvedValue({ data: profile, error: null });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createProfileService({ from } as never);

    await expect(service.getProfile('user-1')).resolves.toEqual(profile);

    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(single).toHaveBeenCalledTimes(1);
  });

  test('updateProfile은 허용된 필드만 업데이트하고 갱신된 프로필을 반환한다', async () => {
    const updatedProfile = { ...profile, nickname: '새닉네임' };
    const single = jest
      .fn()
      .mockResolvedValue({ data: updatedProfile, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ update }));
    const service = createProfileService({ from } as never);

    await expect(
      service.updateProfile('user-1', {
        nickname: '새닉네임',
        role: 'admin',
      } as never),
    ).resolves.toEqual(updatedProfile);

    expect(from).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: '새닉네임',
        updated_at: expect.any(String),
      }),
    );
    expect(update.mock.calls[0][0]).not.toHaveProperty('role');
    expect(eq).toHaveBeenCalledWith('id', 'user-1');
    expect(select).toHaveBeenCalledWith('*');
    expect(single).toHaveBeenCalledTimes(1);
  });

  test('전화번호 변경 전 타인 중복 전화번호를 확인한다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const neq = jest.fn(() => ({ maybeSingle }));
    const eqForPhone = jest.fn(() => ({ neq }));
    const selectForPhone = jest.fn(() => ({ eq: eqForPhone }));

    const updatedProfile = { ...profile, phone: '010-1111-2222' };
    const single = jest
      .fn()
      .mockResolvedValue({ data: updatedProfile, error: null });
    const selectForUpdate = jest.fn(() => ({ single }));
    const eqForUpdate = jest.fn(() => ({ select: selectForUpdate }));
    const update = jest.fn(() => ({ eq: eqForUpdate }));
    const from = jest
      .fn()
      .mockReturnValueOnce({ select: selectForPhone })
      .mockReturnValueOnce({ update });
    const updateUser = jest.fn().mockResolvedValue({ data: {}, error: null });
    const service = createProfileService({ from, auth: { updateUser } } as never);

    await expect(
      service.updateProfile('user-1', { phone: '010-1111-2222' }),
    ).resolves.toEqual(updatedProfile);

    expect(selectForPhone).toHaveBeenCalledWith('id');
    expect(eqForPhone).toHaveBeenCalledWith('phone', '010-1111-2222');
    expect(neq).toHaveBeenCalledWith('id', 'user-1');
    expect(updateUser).toHaveBeenCalledWith({ phone: '010-1111-2222' });
  });

  test('Auth 전화번호 수정이 실패하면 profiles 업데이트를 실행하지 않는다', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const neq = jest.fn(() => ({ maybeSingle }));
    const eq = jest.fn(() => ({ neq }));
    const select = jest.fn(() => ({ eq }));
    const update = jest.fn();
    const from = jest.fn().mockReturnValue({ select, update });
    const updateUser = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'otp required' } });
    const service = createProfileService({ from, auth: { updateUser } } as never);

    await expect(
      service.updateProfile('user-1', { phone: '010-1111-2222' }),
    ).rejects.toThrow('인증 전화번호를 수정하지 못했습니다.');

    expect(update).not.toHaveBeenCalled();
  });

  test('중복 전화번호가 있으면 프로필을 수정하지 않는다', async () => {
    const maybeSingle = jest
      .fn()
      .mockResolvedValue({ data: { id: 'other-user' }, error: null });
    const neq = jest.fn(() => ({ maybeSingle }));
    const eq = jest.fn(() => ({ neq }));
    const select = jest.fn(() => ({ eq }));
    const update = jest.fn();
    const from = jest.fn().mockReturnValue({ select, update });
    const service = createProfileService({ from } as never);

    await expect(
      service.updateProfile('user-1', { phone: '010-1111-2222' }),
    ).rejects.toThrow('이미 사용 중인 전화번호입니다.');

    expect(update).not.toHaveBeenCalled();
  });

  test('Supabase 오류가 발생하면 한국어 오류로 변환한다', async () => {
    const single = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createProfileService({ from } as never);

    await expect(service.getProfile('user-1')).rejects.toThrow(
      '프로필을 불러오지 못했습니다.',
    );
  });
});
