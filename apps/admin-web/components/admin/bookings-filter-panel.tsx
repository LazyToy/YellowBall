'use client';

/**
 * 예약 목록 필터 패널 (클라이언트 컴포넌트)
 * - 상태 탭 필터: 전체 / 접수 / 승인 / 작업중 / 완료 / 관리자 취소 / 노쇼
 * - 날짜 범위 필터: 시작일 ~ 종료일 (방문 일시 기준)
 * - 예약 유형 필터: 전체 / 스트링 / 시타
 * - 텍스트 검색: 고객명 / 예약번호
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookingStatusMenu } from '@/components/admin/booking-status-menu';
import {
  Calendar,
  ChevronDown,
  Phone,
  Search,
  SlidersHorizontal,
  X,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { AdminBookingListItem } from '@/lib/admin-data';

// ─── 상수 ─────────────────────────────────────────────────────────────────────

type StatusTab = {
  key: string;
  label: string;
  statuses: readonly string[] | null;
  color?: string;
};

const STATUS_TABS: readonly StatusTab[] = [
  { key: 'all', label: '전체', statuses: null },
  {
    key: 'requested',
    label: '접수',
    statuses: [
      'requested',
      'reschedule_requested',
      'cancelled_user',
      'rejected',
    ],
    color: 'text-destructive',
  },
  {
    key: 'approved',
    label: '승인',
    statuses: ['approved', 'visit_pending'],
    color: 'text-primary',
  },
  {
    key: 'in_progress',
    label: '작업중',
    statuses: ['racket_received', 'in_progress'],
    color: 'text-chart-4',
  },
  {
    key: 'completed',
    label: '완료',
    statuses: [
      'completed',
      'pickup_ready',
      'delivered',
      'done',
      'refund_pending',
      'refund_done',
    ],
    color: 'text-muted-foreground',
  },
  {
    key: 'cancelled_admin',
    label: '관리자 취소',
    statuses: ['cancelled_admin'],
    color: 'text-muted-foreground',
  },
  {
    key: 'no_show',
    label: '노쇼',
    statuses: ['no_show'],
    color: 'text-destructive',
  },
];

const TYPE_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: '스트링', label: '스트링' },
  { key: '시타', label: '시타' },
] as const;

const STATUS_STYLE: Record<string, string> = {
  requested: 'bg-secondary text-foreground',
  reschedule_requested: 'bg-secondary text-foreground',
  approved: 'bg-primary/10 text-primary',
  visit_pending: 'bg-primary/10 text-primary',
  racket_received: 'bg-accent text-accent-foreground',
  in_progress: 'bg-accent text-accent-foreground',
  completed: 'bg-chart-4/15 text-chart-4',
  pickup_ready: 'bg-chart-4/15 text-chart-4',
  delivered: 'bg-chart-4/15 text-chart-4',
  done: 'bg-chart-4/15 text-chart-4',
  cancelled_user: 'bg-secondary text-foreground',
  cancelled_admin: 'bg-secondary text-foreground',
  rejected: 'bg-secondary text-foreground',
  no_show: 'bg-destructive/10 text-destructive',
  refund_pending: 'bg-chart-4/15 text-chart-4',
  refund_done: 'bg-chart-4/15 text-chart-4',
};

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

/** "5/6 14:30" 같은 포맷에서 Date 복원이 어려우므로, raw visit 문자열을 비교 대신
 *  실제 필터는 booking.visitRaw (ISO) 기준으로 해야 하지만
 *  AdminBookingListItem에 rawVisit을 추가하는 대신
 *  visit 문자열("M/D HH:mm")을 오늘 연도 기준으로 파싱하는 헬퍼 사용 */
function parseVisitDate(visitStr: string): Date | null {
  // "5/6 14:30" → 올해 5월 6일 14:30 로 파싱
  const match = visitStr.match(/(\d{1,2})\/(\d{1,2})\s+(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, month, day, hour, minute] = match.map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), month - 1, day, hour, minute);
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface BookingAvatarProps {
  name: string;
}

function BookingAvatar({ name }: BookingAvatarProps) {
  return (
    <div className="size-8 rounded-full bg-secondary text-foreground grid place-items-center text-xs font-bold shrink-0">
      {name.slice(0, 1)}
    </div>
  );
}

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  onClear: () => void;
}

function DateRangePicker({ from, to, onChange, onClear }: DateRangePickerProps) {
  const hasValue = from || to;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 h-9 rounded-lg border border-border bg-card px-3 text-sm">
        <Calendar className="size-3.5 text-muted-foreground shrink-0" />
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="bg-transparent text-xs w-28 focus:outline-none text-foreground"
          placeholder="시작일"
        />
        <span className="text-muted-foreground text-xs">~</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="bg-transparent text-xs w-28 focus:outline-none text-foreground"
          placeholder="종료일"
        />
      </div>
      {hasValue && (
        <button
          onClick={onClear}
          className="h-9 w-9 rounded-lg border border-border bg-card grid place-items-center hover:bg-secondary transition"
          title="날짜 필터 초기화"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

interface BookingsFilterPanelProps {
  bookings: AdminBookingListItem[];
}

export function BookingsFilterPanel({ bookings }: BookingsFilterPanelProps) {
  const router = useRouter();
  // 필터 상태
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback((from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  }, []);

  const handleDateClear = useCallback(() => {
    setDateFrom('');
    setDateTo('');
  }, []);

  // 빠른 날짜 프리셋
  const applyPreset = useCallback((preset: 'today' | 'week' | 'month') => {
    const now = new Date();
    const toStr = now.toISOString().slice(0, 10);

    if (preset === 'today') {
      setDateFrom(toStr);
      setDateTo(toStr);
    } else if (preset === 'week') {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      setDateFrom(from.toISOString().slice(0, 10));
      setDateTo(toStr);
    } else if (preset === 'month') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(from.toISOString().slice(0, 10));
      setDateTo(toStr);
    }
  }, []);

  // 전체 초기화
  const handleReset = useCallback(() => {
    setActiveTab('all');
    setTypeFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  }, []);

  // 탭별 카운트 계산
  const tabCounts = useMemo(() => {
    return STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.key] = tab.statuses
        ? bookings.filter((b) => tab.statuses!.includes(b.status)).length
        : bookings.length;
      return acc;
    }, {});
  }, [bookings]);

  // 필터링 적용
  const filtered = useMemo(() => {
    let result = bookings;

    // 1. 탭 필터
    const tab = STATUS_TABS.find((t) => t.key === activeTab);
    if (tab?.statuses) {
      result = result.filter((b) => tab.statuses!.includes(b.status));
    }

    // 2. 유형 필터
    if (typeFilter !== 'all') {
      result = result.filter((b) => b.type === typeFilter);
    }

    // 3. 텍스트 검색 (고객명, 예약번호, 라켓)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.customer.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          b.racket.toLowerCase().includes(q) ||
          b.phone.includes(q),
      );
    }

    // 4. 날짜 필터 (방문 일시 기준)
    if (dateFrom || dateTo) {
      result = result.filter((b) => {
        const visitDate = parseVisitDate(b.visit);
        if (!visitDate) return true; // 날짜 파싱 실패 시 포함

        if (dateFrom) {
          const fromDate = new Date(dateFrom + 'T00:00:00');
          if (visitDate < fromDate) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo + 'T23:59:59');
          if (visitDate > toDate) return false;
        }
        return true;
      });
    }

    return result;
  }, [bookings, activeTab, typeFilter, searchQuery, dateFrom, dateTo]);

  // 활성 필터 수
  const activeFilterCount = [
    activeTab !== 'all',
    typeFilter !== 'all',
    searchQuery.trim() !== '',
    dateFrom !== '' || dateTo !== '',
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* ── 탭 필터 ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative h-8 px-3.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-foreground hover:bg-secondary'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.key === 'requested' && count > 0
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* 구분선 */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* 고급 필터 토글 */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={`h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
            showAdvanced || activeFilterCount > 1
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-card border-border text-muted-foreground hover:bg-secondary'
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          필터
          {activeFilterCount > 1 && (
            <span className="inline-flex items-center justify-center size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={`size-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
        </button>

        {/* 초기화 버튼 */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition"
          >
            <X className="size-3" />
            초기화
          </button>
        )}
      </div>

      {/* ── 고급 필터 패널 ── */}
      {showAdvanced && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap gap-4 items-start">
            {/* 검색 */}
            <div className="flex-1 min-w-52">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                검색
              </p>
              <div className="h-9 rounded-lg border border-border bg-background px-3 flex items-center gap-2">
                <Search className="size-3.5 text-muted-foreground shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="고객명, 전화번호, 예약번호, 라켓"
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* 예약 유형 */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                예약 유형
              </p>
              <div className="flex gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTypeFilter(opt.key)}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold border transition ${
                      typeFilter === opt.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-foreground hover:bg-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 날짜 필터 */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              방문 일시 범위
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {/* 빠른 프리셋 */}
              {[
                { key: 'today', label: '오늘' },
                { key: 'week', label: '최근 7일' },
                { key: 'month', label: '이번 달' },
              ].map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => applyPreset(preset.key as 'today' | 'week' | 'month')}
                  className="h-8 px-3 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-secondary transition"
                >
                  {preset.label}
                </button>
              ))}

              <div className="h-5 w-px bg-border" />

              {/* 날짜 범위 피커 */}
              <DateRangePicker
                from={dateFrom}
                to={dateTo}
                onChange={handleDateChange}
                onClear={handleDateClear}
              />
            </div>
            {(dateFrom || dateTo) && (
              <p className="mt-1.5 text-[11px] text-primary font-medium flex items-center gap-1">
                <Calendar className="size-3" />
                {dateFrom && dateTo
                  ? `${dateFrom} ~ ${dateTo} 방문 예약 표시 중`
                  : dateFrom
                    ? `${dateFrom} 이후 방문 예약 표시 중`
                    : `${dateTo} 이전 방문 예약 표시 중`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 결과 요약 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {filtered.length === bookings.length
              ? `전체 ${bookings.length}건`
              : `${bookings.length}건 중 ${filtered.length}건 표시`}
          </span>
          {filtered.some((b) => b.urgent) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-3" />
              급행 {filtered.filter((b) => b.urgent).length}건
            </span>
          )}
        </div>
      </div>

      {/* ── 예약 테이블 ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-xs">
              <tr>
                <th className="text-left font-semibold px-4 py-3">예약번호</th>
                <th className="text-left font-semibold px-4 py-3">고객</th>
                <th className="text-left font-semibold px-4 py-3">유형</th>
                <th className="text-left font-semibold px-4 py-3">상세</th>
                <th className="text-left font-semibold px-4 py-3">방문 일시</th>
                <th className="text-left font-semibold px-4 py-3">상태</th>
                <th className="text-right font-semibold px-4 py-3">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="size-8 opacity-30" />
                      <p className="text-sm font-medium">조건에 맞는 예약이 없습니다</p>
                      <button
                        onClick={handleReset}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        필터 초기화
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => router.push(`/admin/bookings/${b.bookingType}/${b.realId}`)}
                    className="border-t border-border hover:bg-secondary/40 transition cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {b.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BookingAvatar name={b.customer} />
                        <div>
                          <p className="font-semibold text-foreground">{b.customer}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="size-3" />
                            {b.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          b.type === '스트링'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-accent/30 text-foreground'
                        }`}
                      >
                        {b.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-[180px] truncate">
                      {b.detail}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground shrink-0" />
                        {b.visit}
                      </span>
                      {b.urgent && (
                        <span className="ml-1.5 text-[10px] font-bold text-destructive">
                          급행
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          b.hasCancelRequest
                            ? 'bg-destructive/10 text-destructive'
                            : STATUS_STYLE[b.status] ?? 'bg-secondary text-foreground'
                        }`}
                      >
                        {b.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                      <BookingStatusMenu
                        realId={b.realId}
                        bookingType={b.bookingType}
                        currentStatus={b.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 정보 바 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground bg-secondary/20">
          <span>
            {filtered.length === bookings.length
              ? `총 ${bookings.length}건`
              : `총 ${bookings.length}건 중 ${filtered.length}건 표시`}
          </span>
          <div className="flex items-center gap-3">
            {(dateFrom || dateTo) && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <Calendar className="size-3" />
                날짜 필터 적용 중
              </span>
            )}
            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
              >
                <X className="size-3" />
                필터 초기화
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
