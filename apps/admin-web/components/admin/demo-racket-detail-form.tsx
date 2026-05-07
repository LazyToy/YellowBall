'use client';

/**
 * 시타 라켓 상세 편집 폼 (Client Component)
 * - 상태, 이미지, 설명, 그립사이즈, 무게, 헤드사이즈, 데모/활성 여부 편집
 * - 저장 시 updateDemoRacketDetail Server Action 호출
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { updateDemoRacketDetail } from '@/lib/admin-actions';
import type { DemoRacketRow } from '@/lib/admin-data';
import { StorageImageUpload } from './storage-image-upload';
import { ActionFeedbackDialog } from './action-dialogs';

/** 허용된 데모 라켓 상태값 */
const DEMO_STATUSES = [
  { value: 'active', label: '시타 가능' },
  { value: 'inactive', label: '비활성' },
  { value: 'maintenance', label: '정비 중' },
  { value: 'damaged', label: '파손' },
  { value: 'sold', label: '판매 완료' },
  { value: 'hidden', label: '숨김' },
];

interface DemoRacketDetailFormProps {
  racket: DemoRacketRow;
}

/** 시타 라켓 상세 편집 폼 */
export function DemoRacketDetailForm({ racket }: DemoRacketDetailFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 폼 상태
  const [status, setStatus] = useState(racket.status ?? 'active');
  const [photoPath, setPhotoPath] = useState(racket.photo_url ?? '');
  const [description, setDescription] = useState(racket.description ?? '');
  const [gripSize, setGripSize] = useState(racket.grip_size ?? '');
  const [weight, setWeight] = useState(racket.weight != null ? String(racket.weight) : '');
  const [headSize, setHeadSize] = useState(racket.head_size ?? '');
  const [isDemoEnabled, setIsDemoEnabled] = useState(racket.is_demo_enabled ?? true);
  const [isActive, setIsActive] = useState(racket.is_active ?? true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /** 저장 핸들러 */
  const handleSave = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedWeight = weight.trim() !== '' ? parseInt(weight, 10) : null;
    if (weight.trim() !== '' && isNaN(parsedWeight!)) {
      setErrorMsg('무게는 숫자로 입력해주세요.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateDemoRacketDetail(racket.id, {
          status,
          photo_url: photoPath.trim() || null,
          description: description.trim() || null,
          grip_size: gripSize.trim() || null,
          weight: parsedWeight,
          head_size: headSize.trim() || null,
          is_demo_enabled: isDemoEnabled,
          is_active: isActive,
        });

        if (result.success) {
          setShowSuccess(true);
        } else {
          setErrorMsg(`저장 실패: ${result.error}`);
        }
      } catch (err) {
        setErrorMsg(`오류: ${err}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <ActionFeedbackDialog
        open={showSuccess}
        title="시타 라켓 정보가 저장되었습니다"
        description="확인을 누르면 시타 라켓 목록으로 이동합니다."
        onConfirm={() => router.push('/admin/demo')}
      />
      {/* 피드백 메시지 */}
      {successMsg && (
        <div className="rounded-lg bg-chart-4/15 text-chart-4 px-4 py-3 text-sm font-semibold">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
          ✗ {errorMsg}
        </div>
      )}

      {/* 기본 정보 (읽기 전용) */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          기본 정보 (읽기 전용)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <LabelValue label="브랜드" value={racket.brand} />
          <LabelValue label="모델명" value={racket.model} />
        </div>
      </section>

      {/* 상태 설정 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          상태 설정
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 라켓 상태 */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              라켓 상태
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {DEMO_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* 데모 활성 여부 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">데모 활성화</p>
            <button
              type="button"
              onClick={() => setIsDemoEnabled((v) => !v)}
              className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-semibold transition ${
                isDemoEnabled
                  ? 'bg-chart-4/15 text-chart-4 border-chart-4/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {isDemoEnabled ? (
                <><ToggleRight className="size-4" /> 데모 활성</>
              ) : (
                <><ToggleLeft className="size-4" /> 데모 비활성</>
              )}
            </button>
          </div>

          {/* 전체 노출 여부 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">앱 노출</p>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-semibold transition ${
                isActive
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {isActive ? (
                <><ToggleRight className="size-4" /> 노출 중</>
              ) : (
                <><ToggleLeft className="size-4" /> 숨김</>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 스펙 정보 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          스펙 정보
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label="그립 사이즈"
            placeholder="예: G2"
            value={gripSize}
            onChange={setGripSize}
          />
          <FormField
            label="무게 (g)"
            placeholder="예: 285"
            value={weight}
            onChange={setWeight}
            type="number"
          />
          <FormField
            label="헤드 사이즈"
            placeholder="예: 100sq"
            value={headSize}
            onChange={setHeadSize}
          />
        </div>
      </section>

      {/* 이미지 및 설명 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          이미지 및 설명
        </h2>
        <div className="space-y-4">
          <StorageImageUpload
            folder="demo-rackets"
            label="시타 라켓 이미지"
            value={photoPath}
            onChange={setPhotoPath}
          />
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              라켓 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="시타 라켓에 대한 설명을 입력하세요"
              rows={3}
              className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </section>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isPending ? '저장 중...' : '변경사항 저장'}
        </button>
      </div>
    </div>
  );
}

/** 레이블 + 읽기 전용 값 표시 */
function LabelValue({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value || '-'}</p>
    </div>
  );
}

/** 공통 텍스트 인풋 필드 */
function FormField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
