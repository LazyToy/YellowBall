import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

type StorageClient = Pick<SupabaseClient<Database>, 'storage'>;
type PublicPhotoBucket =
  | 'racket-photos'
  | 'string-photos'
  | 'demo-racket-photos';
export type PublicStorageBucket = PublicPhotoBucket | 'app-assets';

const publicUrlSchemes = /^(https?:|file:|data:|blob:)/i;
const publicStorageBuckets: PublicStorageBucket[] = [
  'app-assets',
  'racket-photos',
  'string-photos',
  'demo-racket-photos',
];
const extensionContentTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const encodeStoragePath = (path: string) =>
  path
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');

const resolveBucketAndPath = (
  bucket: PublicStorageBucket,
  value: string,
) => {
  const path = value.trim().replace(/^\/+/, '');

  for (const candidate of publicStorageBuckets) {
    const publicPrefix = `storage/v1/object/public/${candidate}/`;

    if (path.startsWith(publicPrefix)) {
      return {
        bucket: candidate,
        path: path.slice(publicPrefix.length),
      };
    }

    if (path.startsWith(`${candidate}/`)) {
      return {
        bucket: candidate,
        path: path.slice(candidate.length + 1),
      };
    }
  }

  return { bucket, path };
};

export const getPublicStorageUrl = (
  bucket: PublicStorageBucket,
  value?: string | null,
) => {
  const trimmed = value?.trim();

  if (!trimmed || publicUrlSchemes.test(trimmed)) {
    return trimmed || null;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');

  if (!supabaseUrl) {
    return trimmed;
  }

  const resolved = resolveBucketAndPath(bucket, trimmed);

  return `${supabaseUrl}/storage/v1/object/public/${resolved.bucket}/${encodeStoragePath(
    resolved.path,
  )}`;
};

export const getAppAssetUrl = (value?: string | null) =>
  getPublicStorageUrl('app-assets', value);

export const getRacketPhotoUrl = (value?: string | null) =>
  getPublicStorageUrl('racket-photos', value);

export const getStringPhotoUrl = (value?: string | null) =>
  getPublicStorageUrl('string-photos', value);

export const getDemoRacketPhotoUrl = (value?: string | null) =>
  getPublicStorageUrl('demo-racket-photos', value);

const getPhotoFileInfo = (fileUri: string, blob: Blob) => {
  const mimeExtension = blob.type.split('/')[1]?.replace('jpeg', 'jpg');
  const uriExtension = fileUri
    .split(/[?#]/)[0]
    .split('.')
    .pop()
    ?.toLowerCase();
  const extension =
    mimeExtension && extensionContentTypes[mimeExtension]
      ? mimeExtension
      : uriExtension && extensionContentTypes[uriExtension]
        ? uriExtension
        : 'jpg';

  return {
    extension,
    contentType: extensionContentTypes[extension] ?? 'image/jpeg',
  };
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

export const createStorageService = (client: StorageClient) => ({
  async uploadPublicPhoto(
    bucket: PublicPhotoBucket,
    ownerId: string,
    fileUri: string,
    blob: Blob,
  ) {
    const { contentType, extension } = getPhotoFileInfo(fileUri, blob);
    const path = `${ownerId}/${Date.now()}.${extension}`;
    const bucketClient = client.storage.from(bucket);
    const { data, error } = await bucketClient.upload(path, blob, {
      contentType,
      upsert: false,
    });

    if (error || !data) {
      throw toServiceError('사진을 업로드하지 못했습니다.', error);
    }

    const publicUrl = bucketClient.getPublicUrl(data.path);

    return publicUrl.data.publicUrl;
  },

  async uploadRacketPhoto(userId: string, fileUri: string, blob: Blob) {
    return this.uploadPublicPhoto('racket-photos', userId, fileUri, blob);
  },

  async uploadStringPhoto(adminId: string, fileUri: string, blob: Blob) {
    return this.uploadPublicPhoto('string-photos', adminId, fileUri, blob);
  },

  async uploadDemoRacketPhoto(adminId: string, fileUri: string, blob: Blob) {
    return this.uploadPublicPhoto('demo-racket-photos', adminId, fileUri, blob);
  },

  async uploadConditionPhoto(adminId: string, fileUri: string, blob: Blob) {
    const { contentType, extension } = getPhotoFileInfo(fileUri, blob);
    const path = `${adminId}/${Date.now()}.${extension}`;
    const { data, error } = await client.storage
      .from('condition-photos')
      .upload(path, blob, {
        contentType,
        upsert: false,
      });

    if (error || !data) {
      throw toServiceError('?곹깭 ?ъ쭊???낅줈?쒗븯吏 紐삵뻽?듬땲??', error);
    }

    return data.path;
  },

  async createConditionPhotoSignedUrl(path: string, expiresIn = 60 * 10) {
    const { data, error } = await client.storage
      .from('condition-photos')
      .createSignedUrl(path, expiresIn);

    if (error || !data) {
      throw toServiceError('?곹깭 ?ъ쭊 URL??留뚮뱾吏 紐삵뻽?듬땲??', error);
    }

    return data.signedUrl;
  },

  async deleteRacketPhoto(path: string) {
    const { error } = await client.storage.from('racket-photos').remove([path]);

    if (error) {
      throw toServiceError('라켓 사진을 삭제하지 못했습니다.', error);
    }
  },
});

const getDefaultStorageService = async () => {
  const { supabase } = await import('./supabase');

  return createStorageService(supabase);
};

export const uploadRacketPhoto = (
  userId: string,
  fileUri: string,
  blob: Blob,
) =>
  getDefaultStorageService().then((service) =>
    service.uploadRacketPhoto(userId, fileUri, blob),
  );

export const uploadStringPhoto = (
  adminId: string,
  fileUri: string,
  blob: Blob,
) =>
  getDefaultStorageService().then((service) =>
    service.uploadStringPhoto(adminId, fileUri, blob),
  );

export const uploadDemoRacketPhoto = (
  adminId: string,
  fileUri: string,
  blob: Blob,
) =>
  getDefaultStorageService().then((service) =>
    service.uploadDemoRacketPhoto(adminId, fileUri, blob),
  );

export const uploadConditionPhoto = (
  adminId: string,
  fileUri: string,
  blob: Blob,
) =>
  getDefaultStorageService().then((service) =>
    service.uploadConditionPhoto(adminId, fileUri, blob),
  );

export const createConditionPhotoSignedUrl = (
  path: string,
  expiresIn?: number,
) =>
  getDefaultStorageService().then((service) =>
    service.createConditionPhotoSignedUrl(path, expiresIn),
  );

export const deleteRacketPhoto = (path: string) =>
  getDefaultStorageService().then((service) => service.deleteRacketPhoto(path));
