'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload } from 'lucide-react';
import { uploadStorageImage } from '@/lib/admin-actions';

type StorageImageUploadProps = {
  folder: 'products' | 'demo-rackets';
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const getStoragePreviewUrl = (value: string) => {
  const trimmed = value.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!trimmed) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(trimmed) || !supabaseUrl) {
    return trimmed;
  }

  const path = trimmed
    .replace(/^\/+/, '')
    .replace(/^app-assets\//, '')
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/app-assets/${path}`;
};

export function StorageImageUpload({
  folder,
  label,
  value,
  onChange,
}: StorageImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);
  const previewUrl = getStoragePreviewUrl(value);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadStorageImage(formData, folder);

      if (result.path) {
        onChange(result.path);
        setStatus('done');
      } else {
        setError(result.error ?? '업로드에 실패했습니다.');
        setStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={status === 'uploading'}
          className="h-9 px-4 rounded-lg border border-dashed border-primary/50 text-xs font-semibold text-primary hover:bg-primary/5 flex items-center gap-2 disabled:opacity-50"
        >
          {status === 'uploading' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              업로드 중...
            </>
          ) : status === 'done' || value ? (
            <>
              <Upload className="size-4" />
              이미지 변경
            </>
          ) : (
            <>
              <ImagePlus className="size-4" />
              이미지 등록
            </>
          )}
        </button>
        {status === 'done' ? (
          <span className="text-xs text-chart-4 font-semibold">
            업로드 완료
          </span>
        ) : null}
        {status === 'error' && error ? (
          <span className="text-xs text-destructive">{error}</span>
        ) : null}
      </div>

      {previewUrl ? (
        <div className="mt-3 size-24 rounded-xl bg-secondary overflow-hidden border border-border">
          <img
            src={previewUrl}
            alt={`${label} 미리보기`}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          PNG, JPG, WEBP 이미지를 업로드하세요.
        </p>
      )}
    </div>
  );
}
