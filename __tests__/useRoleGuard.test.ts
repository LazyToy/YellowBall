import { renderHook, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

describe('useRoleGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('비관리자가 관리자 화면에 접근하면 탭 화면으로 리다이렉트한다', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'user-1' } },
      isLoading: false,
      isAdmin: false,
      isSuperAdmin: false,
    });

    const { useRoleGuard } = require('../src/hooks/useRoleGuard');
    const { result } = renderHook(() => useRoleGuard());

    expect(result.current.canAccess).toBe(false);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
  });

  test('관리자는 관리자 화면 접근을 허용한다', async () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'admin-1' } },
      isLoading: false,
      isAdmin: true,
      isSuperAdmin: false,
    });

    const { useRoleGuard } = require('../src/hooks/useRoleGuard');
    const { result } = renderHook(() => useRoleGuard());

    expect(result.current.canAccess).toBe(true);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
