'use client';

/**
 * 신규 시타 라켓 등록 폼 (Client Component)
 * - 브랜드/모델/스펙 입력 → createDemoRacket Server Action
 * - 이미지는 Supabase Storage 업로드 지원
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle } from 'lucide-react';
import { createDemoRacket } from '@/lib/admin-actions';
import { StorageImageUpload } from './storage-image-upload';
import { ActionFeedbackDialog } from './action-dialogs';

const DEMO_STATUSES = [
  { value: 'active', label: '시타 가능' },
  { value: 'inactive', label: '비활성' },
  { value: 'maintenance', label: '정비 중' },
];

export function NewDemoRacketForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 폼 상태
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [gripSize, setGripSize] = useState('');
  const [weight, setWeight] = useState('');
  const [headSize, setHeadSize] = useState('');
  const [photoPath, setPhotoPath] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [isDemoEnabled, setIsDemoEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /** 등록 제출 */
  const handleSubmit = () => {
    setErrorMsg(null);

    if (!brand.trim()) { setErrorMsg('브랜드를 입력해주세요.'); return; }
    if (!model.trim()) { setErrorMsg('모델명을 입력해주세요.'); return; }

    const parsedWeight = weight.trim() !== '' ? parseInt(weight, 10) : null;
    if (weight.trim() !== '' && isNaN(parsedWeight!)) {
      setErrorMsg('무게는 숫자로 입력해주세요.');
      return;
    }

    startTransition(async () => {
      const result = await createDemoRacket({
        brand: brand.trim(),
        model: model.trim(),
        grip_size: gripSize.trim() || null,
        weight: parsedWeight,
        head_size: headSize.trim() || null,
        photo_url: photoPath.trim() || null,
        description: description.trim() || null,
        status,
        is_demo_enabled: isDemoEnabled,
        is_active: isActive,
      });

      if (result.success && result.id) {
        setShowSuccess(true);
      } else {
        setErrorMsg(`등록 실패: ${result.error}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <ActionFeedbackDialog
        open={showSuccess}
        title="시타 라켓이 등록되었습니다"
        description="확인을 누르면 시타 라켓 목록으로 이동합니다."
        onConfirm={() => router.push('/admin/demo')}
      />
      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
          ✗ {errorMsg}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-4">라켓 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="브랜드 *" value={brand} onChange={setBrand} placeholder="예: Wilson, Babolat" />
          <FormField label="모델명 *" value={model} onChange={setModel} placeholder="예: Pro Staff RF97 v14" />
        </div>
      </section>

      {/* 상태 설정 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-4">상태 설정</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 라켓 상태 */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">라켓 상태</label>
            <select
              value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {DEMO_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* 데모 활성화 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">데모 활성화</p>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => setIsDemoEnabled(v)}
                  className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition ${
                    isDemoEnabled === v
                      ? v ? 'bg-chart-4/15 text-chart-4 border-chart-4/30' : 'bg-muted text-muted-foreground border-border'
                      : 'bg-transparent border-border text-muted-foreground'
                  }`}
                >
                  {v ? '활성' : '비활성'}
                </button>
              ))}
            </div>
          </div>

          {/* 앱 노출 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">앱 노출</p>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => setIsActive(v)}
                  className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition ${
                    isActive === v
                      ? v ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border'
                      : 'bg-transparent border-border text-muted-foreground'
                  }`}
                >
                  {v ? '노출' : '숨김'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 스펙 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-4">스펙 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="그립 사이즈" value={gripSize} onChange={setGripSize} placeholder="예: G2" />
          <FormField label="무게 (g)" value={weight} onChange={setWeight} placeholder="예: 285" type="number" />
          <FormField label="헤드 사이즈" value={headSize} onChange={setHeadSize} placeholder="예: 100sq" />
        </div>
      </section>

      {/* 이미지 및 설명 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-4">이미지 및 설명</h2>
        <div className="space-y-4">
          <StorageImageUpload
            folder="demo-rackets"
            label="시타 라켓 이미지"
            value={photoPath}
            onChange={setPhotoPath}
          />

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">라켓 설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="라켓에 대한 설명을 입력하세요" rows={3}
              className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </section>

      {/* 등록 버튼 */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="h-10 px-5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary">
          취소
        </button>
        <button onClick={handleSubmit} disabled={isPending}
          className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition">
          {isPending ? <><Loader2 className="size-4 animate-spin" /> 등록 중...</> : <><PlusCircle className="size-4" /> 라켓 등록</>}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
