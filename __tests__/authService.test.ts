import { createAuthService } from '../src/services/authService';

const activeProfile = {
  id: 'user-1',
  username: 'yellow01',
  nickname: '옐로볼',
  phone: '010-0000-0000',
  role: 'user',
  status: 'active',
  expo_push_token: null,
  created_at: '2026-04-30T00:00:00.000Z',
  updated_at: '2026-04-30T00:00:00.000Z',
};

const createProfilesQuery = (profile = activeProfile, error = null) => {
  const single = jest.fn().mockResolvedValue({ data: profile, error });
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));

  return { from, select, eq, single };
};

describe('authService', () => {
  test('signUp은 Supabase Auth에 전화번호, 비밀번호, 사용자 메타데이터를 전달한다', async () => {
    const signUp = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });
    const service = createAuthService({
      auth: { signUp },
      functions: { invoke: jest.fn() },
    } as never);

    await expect(
      service.signUp('010-1234-5678', 'Yellow1!', 'yellow_01', '옐로볼'),
    ).resolves.toEqual({ user: { id: 'user-1' }, session: null });

    expect(signUp).toHaveBeenCalledWith({
      phone: '010-1234-5678',
      password: 'Yellow1!',
      options: {
        data: {
          username: 'yellow_01',
          nickname: '옐로볼',
        },
      },
    });
  });

  test('checkUsernameAvailable은 Edge Function 결과만 boolean으로 반환한다', async () => {
    const invoke = jest.fn().mockResolvedValue({
      data: { available: false },
      error: null,
    });
    const service = createAuthService({
      auth: { signUp: jest.fn() },
      functions: { invoke },
    } as never);

    await expect(service.checkUsernameAvailable('taken_01')).resolves.toBe(false);

    expect(invoke).toHaveBeenCalledWith('check-username', {
      body: { username: 'taken_01' },
    });
  });

  test('Supabase 오류는 한국어 사용자 메시지로 변환한다', async () => {
    const signUp = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });
    const service = createAuthService({
      auth: { signUp },
      functions: { invoke: jest.fn() },
    } as never);

    await expect(
      service.signUp('010-1234-5678', 'Yellow1!', 'yellow_01', '옐로볼'),
    ).rejects.toThrow('회원가입에 실패했습니다. User already registered');
  });

  test('signIn은 전화번호와 비밀번호로 로그인하고 프로필 상태를 확인한다', async () => {
    const session = { user: { id: 'user-1' } };
    const signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1' }, session },
      error: null,
    });
    const query = createProfilesQuery();
    const service = createAuthService({
      auth: {
        signUp: jest.fn(),
        signInWithPassword,
        signOut: jest.fn(),
      },
      functions: { invoke: jest.fn() },
      from: query.from,
    } as never);

    await expect(
      service.signIn('010-1234-5678', 'Yellow1!'),
    ).resolves.toEqual({
      session,
      user: { id: 'user-1' },
      error: null,
    });

    expect(signInWithPassword).toHaveBeenCalledWith({
      phone: '010-1234-5678',
      password: 'Yellow1!',
    });
    expect(query.from).toHaveBeenCalledWith('profiles');
    expect(query.eq).toHaveBeenCalledWith('id', 'user-1');
  });

  test('signIn 실패는 한국어 오류를 반환한다', async () => {
    const signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });
    const service = createAuthService({
      auth: {
        signUp: jest.fn(),
        signInWithPassword,
        signOut: jest.fn(),
      },
      functions: { invoke: jest.fn() },
      from: jest.fn(),
    } as never);

    await expect(
      service.signIn('010-1234-5678', 'Wrong1!'),
    ).resolves.toMatchObject({
      session: null,
      user: null,
      error: expect.objectContaining({
        message: '전화번호 또는 비밀번호가 올바르지 않습니다.',
      }),
    });
  });

  test('suspended 사용자는 로그인 직후 로그아웃 처리하고 차단 오류를 반환한다', async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null });
    const query = createProfilesQuery({
      ...activeProfile,
      status: 'suspended',
    });
    const service = createAuthService({
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1' },
            session: { user: { id: 'user-1' } },
          },
          error: null,
        }),
        signOut,
      },
      functions: { invoke: jest.fn() },
      from: query.from,
    } as never);

    await expect(
      service.signIn('010-1234-5678', 'Yellow1!'),
    ).resolves.toMatchObject({
      session: null,
      user: null,
      error: expect.objectContaining({
        message: '계정이 제재되었습니다.',
      }),
    });
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  test('deleted_pending 사용자는 탈퇴 처리 중 오류로 로그인 차단한다', async () => {
    const query = createProfilesQuery({
      ...activeProfile,
      status: 'deleted_pending',
    });
    const service = createAuthService({
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1' },
            session: { user: { id: 'user-1' } },
          },
          error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
      functions: { invoke: jest.fn() },
      from: query.from,
    } as never);

    await expect(
      service.signIn('010-1234-5678', 'Yellow1!'),
    ).resolves.toMatchObject({
      session: null,
      user: null,
      error: expect.objectContaining({
        message: '탈퇴 처리 중인 계정입니다.',
      }),
    });
  });

  test('signOut은 Supabase 세션과 로컬 세션 저장소를 함께 삭제한다', async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null });
    const removeItem = jest.fn().mockResolvedValue(undefined);
    const service = createAuthService(
      {
        auth: {
          signUp: jest.fn(),
          signOut,
        },
        functions: { invoke: jest.fn() },
      } as never,
      { removeItem, storageKey: 'yellowball-auth-session' },
    );

    await expect(service.signOut()).resolves.toBeUndefined();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(removeItem).toHaveBeenCalledWith('yellowball-auth-session');
  });

  test('requestAccountDeletion은 비밀번호 확인 후 deleted_pending으로 전환하고 로그아웃한다', async () => {
    const signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
    const signOut = jest.fn().mockResolvedValue({ error: null });
    const rpc = jest.fn().mockResolvedValue({ error: null });
    const removeItem = jest.fn().mockResolvedValue(undefined);
    const service = createAuthService(
      {
        auth: {
          signUp: jest.fn(),
          signInWithPassword,
          signOut,
        },
        functions: { invoke: jest.fn() },
        from: jest.fn(),
        rpc,
      } as never,
      { removeItem, storageKey: 'yellowball-auth-session' },
    );

    await expect(
      service.requestAccountDeletion('user-1', 'Yellow1!', activeProfile as never),
    ).resolves.toBeUndefined();

    expect(signInWithPassword).toHaveBeenCalledWith({
      phone: '010-0000-0000',
      password: 'Yellow1!',
    });
    expect(rpc).toHaveBeenCalledWith('request_profile_account_deletion', {
      p_user_id: 'user-1',
    });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(removeItem).toHaveBeenCalledWith('yellowball-auth-session');
  });

  test('requestAccountDeletion은 최고 관리자를 차단한다', async () => {
    const service = createAuthService({
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
      functions: { invoke: jest.fn() },
      from: jest.fn(),
    } as never);

    await expect(
      service.requestAccountDeletion('user-1', 'Yellow1!', {
        ...activeProfile,
        role: 'super_admin',
      } as never),
    ).rejects.toThrow('최고 관리자는 탈퇴할 수 없습니다.');
  });
});
