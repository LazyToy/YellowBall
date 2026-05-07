import {
  createStorageService,
  getPublicStorageUrl,
  getStringPhotoUrl,
} from '../src/services/storageService';

describe('storageService', () => {
  const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://yellowball.supabase.co';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  });

  test('getPublicStorageUrl converts object paths to public Storage URLs', () => {
    expect(getStringPhotoUrl('seed/hyper-g.png')).toBe(
      'https://yellowball.supabase.co/storage/v1/object/public/string-photos/seed/hyper-g.png',
    );
    expect(getPublicStorageUrl('app-assets', 'app-assets/seed/racket.png')).toBe(
      'https://yellowball.supabase.co/storage/v1/object/public/app-assets/seed/racket.png',
    );
    expect(getStringPhotoUrl('app-assets/seed/hyper-g.png')).toBe(
      'https://yellowball.supabase.co/storage/v1/object/public/app-assets/seed/hyper-g.png',
    );
  });

  test('getPublicStorageUrl leaves existing URLs unchanged', () => {
    expect(getStringPhotoUrl('https://cdn.example.com/string.png')).toBe(
      'https://cdn.example.com/string.png',
    );
  });

  test('uploadRacketPhoto는 racket-photos 버킷에 업로드하고 public URL을 반환한다', async () => {
    const upload = jest
      .fn()
      .mockResolvedValue({ data: { path: 'user-1/123.jpg' }, error: null });
    const getPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/user-1/123.jpg' },
    });
    const from = jest.fn(() => ({ upload, getPublicUrl }));
    const service = createStorageService({ storage: { from } } as never);
    const blob = new Blob(['photo'], { type: 'image/jpeg' });

    await expect(
      service.uploadRacketPhoto('user-1', 'file:///photo.jpg', blob),
    ).resolves.toBe('https://storage.example.com/user-1/123.jpg');

    expect(from).toHaveBeenCalledWith('racket-photos');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/\d+\.jpg$/),
      blob,
      expect.objectContaining({ contentType: 'image/jpeg' }),
    );
  });

  test('uploadStringPhoto는 string-photos 버킷에 업로드한다', async () => {
    const upload = jest
      .fn()
      .mockResolvedValue({ data: { path: 'admin-1/123.jpg' }, error: null });
    const getPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/admin-1/123.jpg' },
    });
    const from = jest.fn(() => ({ upload, getPublicUrl }));
    const service = createStorageService({ storage: { from } } as never);
    const blob = new Blob(['photo'], { type: 'image/jpeg' });

    await expect(
      service.uploadStringPhoto('admin-1', 'file:///string.jpg', blob),
    ).resolves.toBe('https://storage.example.com/admin-1/123.jpg');

    expect(from).toHaveBeenCalledWith('string-photos');
  });

  test('uploadConditionPhoto는 condition-photos 버킷에 업로드한다', async () => {
    const upload = jest
      .fn()
      .mockResolvedValue({ data: { path: 'admin-1/123.png' }, error: null });
    const getPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/admin-1/123.png' },
    });
    const createSignedUrl = jest.fn();
    const from = jest.fn(() => ({ upload, getPublicUrl, createSignedUrl }));
    const service = createStorageService({ storage: { from } } as never);
    const blob = new Blob(['photo'], { type: 'image/png' });

    await expect(
      service.uploadConditionPhoto('admin-1', 'file:///condition.png', blob),
    ).resolves.toBe('admin-1/123.png');

    expect(from).toHaveBeenCalledWith('condition-photos');
    expect(getPublicUrl).not.toHaveBeenCalled();
    expect(createSignedUrl).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^admin-1\/\d+\.png$/),
      blob,
      expect.objectContaining({ contentType: 'image/png' }),
    );
  });

  test('createConditionPhotoSignedUrl??private ?곹깭 ?ъ쭊???쒗븳??signed URL??諛섑솚?쒕떎', async () => {
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed/condition.png' },
      error: null,
    });
    const from = jest.fn(() => ({ createSignedUrl }));
    const service = createStorageService({ storage: { from } } as never);

    await expect(
      service.createConditionPhotoSignedUrl('admin-1/123.png', 300),
    ).resolves.toBe('https://storage.example.com/signed/condition.png');

    expect(from).toHaveBeenCalledWith('condition-photos');
    expect(createSignedUrl).toHaveBeenCalledWith('admin-1/123.png', 300);
  });
});
