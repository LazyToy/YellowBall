import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { BookingActionButtons } from '@/components/admin/booking-action-buttons';
import { BookingsFilterPanel } from '@/components/admin/bookings-filter-panel';
import { Clock, Download, Phone, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  getAdminBookingsPageData,
  hasAdminReadKey,
  money,
  type AdminBookingListItem,
} from '@/lib/admin-data';

function BookingAvatar({ booking }: { booking: AdminBookingListItem }) {
  return (
    <div className="size-8 rounded-full bg-secondary text-foreground grid place-items-center text-xs font-bold shrink-0">
      {booking.customer.slice(0, 1)}
    </div>
  );
}

export default async function AdminBookingsPage() {
  const { pendingRequests, bookings } = await getAdminBookingsPageData();

  return (
    <div>
      <AdminPageHeader
        label="RESERVATION MANAGEMENT"
        title="예약 관리"
        description="service_bookings와 demo_bookings의 실제 예약 데이터를 관리합니다."
        actions={
          <>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold flex items-center gap-1.5 hover:bg-secondary">
              <Download className="size-3.5" />
              내보내기
            </button>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90">
              <Plus className="size-3.5" />
              새 예약
            </button>
          </>
        }
      />

      {!hasAdminReadKey ? (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          예약 테이블은 RLS 보호 대상입니다. 실제 예약을 보려면
          NEXT_SUPABASE_SERVICE_ROLE_KEY를 서버 환경변수로 설정해야 합니다.
        </div>
      ) : null}

      {/* ── 승인 대기 섹션 (상단 고정, 항상 표시) ── */}
      <section className="mb-6 rounded-2xl border-2 border-accent/40 bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-accent/15 border-b border-accent/30">
          <div className="size-8 rounded-lg bg-accent text-accent-foreground grid place-items-center">
            <Clock className="size-4" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-sm text-foreground">
              예약 승인 대기
              {pendingRequests.length > 0 && (
                <span className="ml-2 inline-flex size-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              고객이 요청한 신규 예약과 변경 요청입니다.
            </p>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {pendingRequests.length === 0 ? (
            <li className="px-5 py-6 text-center text-xs text-muted-foreground">
              승인 대기 중인 예약이 없습니다.
            </li>
          ) : (
            pendingRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 transition"
              >
                <Link
                  href={`/admin/bookings/${r.bookingType}/${r.realId}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <BookingAvatar booking={r} />
                  <div className="grid grid-cols-12 gap-4 flex-1 min-w-0">
                  <div className="col-span-3 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {r.customer}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3" />
                      {r.phone}
                    </p>
                  </div>
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm text-foreground truncate">{r.racket}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{r.detail}</p>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1">
                      <Clock className="size-3.5 text-primary" />
                      {r.visit}
                    </p>
                    <p className="text-[11px] text-muted-foreground">요청 {r.requested}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {r.estimated > 0 ? `${money(r.estimated)}원` : '-'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">예상 결제</p>
                  </div>
                  </div>
                </Link>
                <BookingActionButtons
                  realId={r.realId}
                  bookingType={r.bookingType}
                  currentStatus={r.status}
                />
              </li>
            ))
          )}
        </ul>
      </section>

      {/* ── 필터 패널 + 테이블 (클라이언트 컴포넌트) ── */}
      <BookingsFilterPanel bookings={bookings} />
    </div>
  );
}
