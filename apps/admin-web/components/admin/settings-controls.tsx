'use client';

import { useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import {
  Bell,
  Check,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Store,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  updatePolicySettingsFromWeb,
  updateStoreSettingsFromWeb,
} from '@/lib/admin-actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createDefaultPolicySettings,
  type PolicySettings,
  type ShopScheduleViewRow,
  type StoreSettings,
} from '@/lib/super-admin-data';

type StoreSectionId = 'store' | 'schedule' | 'payment' | 'notification' | 'delivery';

const storeSections: {
  id: StoreSectionId;
  label: string;
  icon: typeof Store;
}[] = [
  { id: 'store', label: '매장 정보', icon: Store },
  { id: 'schedule', label: '영업시간/휴무', icon: Clock },
  { id: 'payment', label: '결제/정산', icon: CreditCard },
  { id: 'notification', label: '알림', icon: Bell },
  { id: 'delivery', label: '배송 옵션', icon: MapPin },
];

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

export function StoreSettingsControls({
  initialSettings,
  initialSchedule,
  updatedAt,
}: {
  initialSettings: StoreSettings;
  initialSchedule: ShopScheduleViewRow[];
  updatedAt: string | null;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [activeSection, setActiveSection] = useState<StoreSectionId>('store');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateSetting = (key: keyof StoreSettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const updateSchedule = (
    day: number,
    key: 'open_time' | 'close_time' | 'is_closed',
    value: string | boolean,
  ) => {
    setSchedule((current) =>
      current.map((row) => (row.day_of_week === day ? { ...row, [key]: value } : row)),
    );
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setSchedule(initialSchedule);
    setMessage(null);
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateStoreSettingsFromWeb(settings, schedule);
      if (!result.success) {
        setMessage(result.error ?? '설정을 저장하지 못했습니다.');
        return;
      }

      if (result.settings && result.schedule) {
        setSettings(result.settings);
        setSchedule(result.schedule);
      }
      setMessage('설정을 저장했습니다.');
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-1 bg-card rounded-xl border border-border p-5 h-fit">
        <h3 className="font-display font-bold text-foreground mb-3">설정 항목</h3>
        <ul className="space-y-1 text-sm">
          {storeSections.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg transition ${
                    active
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="lg:col-span-2 space-y-5">
        {updatedAt ? (
          <p className="text-xs text-muted-foreground">마지막 저장: {updatedAt}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            저장된 매장 설정이 없어 빈 DB 설정 값을 표시합니다.
          </p>
        )}
        {activeSection === 'store' ? (
          <section className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-display font-bold text-foreground mb-4">매장 정보</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="매장명" value={settings.storeName} onChange={(v) => updateSetting('storeName', v)} />
              <Field label="대표 전화" value={settings.phone} onChange={(v) => updateSetting('phone', v)} />
              <Field
                label="사업자번호"
                value={settings.businessNumber}
                onChange={(v) => updateSetting('businessNumber', v)}
              />
              <Field
                label="대표자"
                value={settings.representative}
                onChange={(v) => updateSetting('representative', v)}
              />
              <Field label="주소" value={settings.address} onChange={(v) => updateSetting('address', v)} full />
              <TextareaField
                label="소개"
                value={settings.introduction}
                onChange={(v) => updateSetting('introduction', v)}
              />
            </div>
          </section>
        ) : null}

        {activeSection === 'schedule' ? (
          <section className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-display font-bold text-foreground mb-4">영업시간</h3>
            <div className="space-y-2">
              {schedule.map((row) => (
                <div key={row.day_of_week} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="w-8 text-sm font-semibold text-foreground">{row.label}</span>
                  <TimeSelect
                    ariaLabel={`${row.label} 시작 시간`}
                    disabled={row.is_closed}
                    value={row.open_time}
                    onChange={(value) => updateSchedule(row.day_of_week, 'open_time', value)}
                  />
                  <span className="hidden sm:inline text-xs text-muted-foreground">-</span>
                  <TimeSelect
                    ariaLabel={`${row.label} 종료 시간`}
                    disabled={row.is_closed}
                    value={row.close_time}
                    onChange={(value) => updateSchedule(row.day_of_week, 'close_time', value)}
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-auto">
                    <input
                      type="checkbox"
                      checked={!row.is_closed}
                      onChange={(event) =>
                        updateSchedule(row.day_of_week, 'is_closed', !event.target.checked)
                      }
                      className="accent-primary"
                    />
                    영업
                  </label>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === 'payment' ? (
          <TextSection
            title="결제/정산"
            label="운영 메모"
            value={settings.paymentNotice}
            onChange={(value) => updateSetting('paymentNotice', value)}
          />
        ) : null}

        {activeSection === 'notification' ? (
          <TextSection
            title="알림"
            label="알림 운영 메모"
            value={settings.notificationNotice}
            onChange={(value) => updateSetting('notificationNotice', value)}
          />
        ) : null}

        {activeSection === 'delivery' ? (
          <TextSection
            title="배송 옵션"
            label="배송 운영 메모"
            value={settings.deliveryNotice}
            onChange={(value) => updateSetting('deliveryNotice', value)}
          />
        ) : null}

        {message ? (
          <p className={`text-sm ${message.includes('저장했습니다') ? 'text-primary' : 'text-destructive'}`}>
            {message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-secondary disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <RotateCcw className="size-4" />
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export function PolicySettingsControls({
  initialSettings,
  updatedAt,
}: {
  initialSettings: PolicySettings;
  updatedAt: string | null;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateNumber = (key: keyof PolicySettings, value: string) => {
    setSettings((current) => ({ ...current, [key]: Number(value) }));
  };

  const updateBoolean = (key: keyof PolicySettings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updatePolicySettingsFromWeb(settings);
      if (!result.success) {
        setMessage(result.error ?? '정책을 저장하지 못했습니다.');
        return;
      }

      if (result.settings) {
        setSettings(result.settings);
      }
      setMessage('정책을 저장했습니다.');
    });
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {updatedAt ? (
        <p className="text-xs text-muted-foreground">마지막 저장: {updatedAt}</p>
      ) : (
        <p className="text-xs text-muted-foreground">저장된 DB 정책이 없어 기본 정책 값을 표시합니다.</p>
      )}
      <PolicySection title="예약 정책">
        <Numeric label="예약 가능 시작 시간" suffix="시간 전부터" value={settings.bookingOpenHoursBefore} onChange={(v) => updateNumber('bookingOpenHoursBefore', v)} />
        <Numeric label="최대 예약 가능 일수" suffix="일까지" value={settings.bookingMaxDaysAhead} onChange={(v) => updateNumber('bookingMaxDaysAhead', v)} />
        <Numeric label="동시 예약 가능 수" suffix="건" value={settings.maxConcurrentBookings} onChange={(v) => updateNumber('maxConcurrentBookings', v)} />
        <Numeric label="노쇼 자동 취소" suffix="분 경과 후" value={settings.noShowAutoCancelMinutes} onChange={(v) => updateNumber('noShowAutoCancelMinutes', v)} />
      </PolicySection>

      <PolicySection title="제재 정책">
        <Numeric label="3회 노쇼 자동 제재" suffix="일" value={settings.noShowSuspensionDays} onChange={(v) => updateNumber('noShowSuspensionDays', v)} />
        <Numeric label="결제 미완료 자동 취소" suffix="분" value={settings.unpaidAutoCancelMinutes} onChange={(v) => updateNumber('unpaidAutoCancelMinutes', v)} />
        <ToggleRow label="제재 사용자 로그인 차단" description="OFF면 로그인은 가능하지만 예약/구매만 제한합니다." value={settings.suspendedLoginBlocked} onChange={(v) => updateBoolean('suspendedLoginBlocked', v)} />
      </PolicySection>

      <PolicySection title="환불 정책">
        <Numeric label="시타 예약 환불 가능" suffix="시간 전" value={settings.storePickupRefundHours} onChange={(v) => updateNumber('storePickupRefundHours', v)} />
        <Numeric label="스트링 작업 환불 가능" suffix="시간 전" value={settings.stringingRefundHours} onChange={(v) => updateNumber('stringingRefundHours', v)} />
        <ToggleRow label="자동 환불 처리" description="정책 시간 내 취소 시 PG 자동 환불 호출을 허용합니다." value={settings.autoRefundEnabled} onChange={(v) => updateBoolean('autoRefundEnabled', v)} />
      </PolicySection>

      <PolicySection title="알림 정책">
        <ToggleRow label="예약 확정 즉시 알림" value={settings.notifyBookingConfirmation} onChange={(v) => updateBoolean('notifyBookingConfirmation', v)} />
        <ToggleRow label="픽업 가능 알림" value={settings.notifyPickupReady} onChange={(v) => updateBoolean('notifyPickupReady', v)} />
        <ToggleRow label="마케팅 알림 발송" description="사용자 동의가 있는 경우에만 발송합니다." value={settings.notifyMarketing} onChange={(v) => updateBoolean('notifyMarketing', v)} />
      </PolicySection>

      {message ? (
        <p className={`text-sm ${message.includes('저장했습니다') ? 'text-primary' : 'text-destructive'}`}>
          {message}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setSettings(createDefaultPolicySettings());
            setMessage(null);
          }}
          disabled={isPending}
          className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-secondary disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <RotateCcw className="size-4" />
          기본값 복원
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          정책 저장
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  full,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full h-10 rounded-lg bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function TimeSelect({
  ariaLabel,
  disabled,
  onChange,
  value,
}: {
  ariaLabel: string;
  disabled: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select disabled={disabled} onValueChange={onChange} value={value}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-9 w-28 border-border bg-background text-foreground shadow-sm transition hover:border-primary/40 focus:ring-primary/30 disabled:bg-secondary disabled:opacity-50"
      >
        <SelectValue placeholder="--:--" />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {timeOptions.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-24 w-full rounded-lg bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function TextSection({
  title,
  label,
  value,
  onChange,
}: {
  title: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-display font-bold text-foreground mb-4">{title}</h3>
      <TextareaField label={label} value={value} onChange={onChange} />
    </section>
  );
}

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-card rounded-xl border border-border">
      <header className="px-6 py-4 border-b border-border">
        <h2 className="font-display font-bold text-foreground">{title}</h2>
      </header>
      <div className="px-6">{children}</div>
    </section>
  );
}

function Numeric({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-24 h-9 rounded-lg bg-secondary px-3 text-sm text-right font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span className="text-xs text-muted-foreground w-24">{suffix}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-t border-border first:border-t-0">
      <span className="flex-1 text-sm font-medium text-foreground">
        {label}
        {description ? (
          <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition ${value ? 'bg-primary' : 'bg-secondary border border-border'}`}
        aria-pressed={value}
      >
        <span className="sr-only">{value ? '비활성화' : '활성화'}</span>
        {value ? <ToggleRight className="sr-only" /> : <ToggleLeft className="sr-only" />}
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${
            value ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}
