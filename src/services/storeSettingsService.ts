/**
 * 매장 정보를 DB에서 읽어오는 서비스 모듈입니다.
 * get_store_info() RPC 함수를 통해 anon 권한으로 storeName, address를 조회합니다.
 */

export type StoreInfo = {
  storeName: string;
  address: string;
};

const DEFAULT_STORE_INFO: StoreInfo = {
  storeName: 'YellowBall',
  address: '',
};

/**
 * DB에서 매장 기본 정보를 가져옵니다.
 * 실패 시 기본값을 반환하여 앱이 중단되지 않습니다.
 */
export async function getStoreInfo(): Promise<StoreInfo> {
  try {
    const { supabase } = await import('./supabase');
    // get_store_info는 DB에 생성된 public RPC 함수이지만 타입 파일 재생성 전이므로 unknown 캐스트 사용
    const { data, error } = await (supabase as unknown as {
      rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;
    }).rpc('get_store_info');

    if (error) {
      console.warn('[storeSettingsService] get_store_info 오류:', error.message);
      return DEFAULT_STORE_INFO;
    }

    const result = data as { storeName?: string; address?: string } | null;
    return {
      storeName: result?.storeName || DEFAULT_STORE_INFO.storeName,
      address: result?.address || DEFAULT_STORE_INFO.address,
    };
  } catch (err) {
    console.warn('[storeSettingsService] 매장 정보 로드 실패:', err);
    return DEFAULT_STORE_INFO;
  }
}
