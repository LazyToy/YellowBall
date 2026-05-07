import { BookingStatusMenu } from '@/components/admin/booking-status-menu';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import {
  formatDateTime,
  getBookingCode,
  getCustomerName,
  getRacketName,
  getStringName,
  loadDemoBookingById,
  loadServiceBookingById,
  money,
  statusLabel,
} from '@/lib/admin-data';
import { ArrowLeft, CalendarClock, Phone, UserRound } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ type: string; id: string }>;
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold text-foreground break-words ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value ?? '-'}
      </p>
    </div>
  );
}

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const { id, type } = await params;

  if (type !== 'service' && type !== 'demo') {
    notFound();
  }

  const booking =
    type === 'service'
      ? await loadServiceBookingById(id)
      : await loadDemoBookingById(id);

  if (!booking) {
    notFound();
  }

  const bookingCode = getBookingCode(booking.id);
  const customerName = getCustomerName(booking.profiles);
  const phone = booking.profiles?.phone ?? '-';
  const bookingTypeLabel = type === 'service' ? '스트링 예약' : '시타 예약';

  const serviceBooking = type === 'service' ? booking : null;
  const demoBooking = type === 'demo' ? booking : null;
  const visitTime =
    serviceBooking?.booking_slots?.start_time ?? demoBooking?.start_time ?? null;
  const racket = serviceBooking
    ? getRacketName(serviceBooking.user_rackets)
    : getRacketName(demoBooking?.demo_rackets);
  const mainDetail = serviceBooking
    ? `${getStringName(serviceBooking.main_string)} / ${serviceBooking.tension_main}LB`
    : racket;
  const estimated = serviceBooking
    ? (serviceBooking.main_string?.price ?? 0) +
      (serviceBooking.cross_string?.name &&
      serviceBooking.cross_string?.name !== serviceBooking.main_string?.name
        ? serviceBooking.cross_string?.price ?? 0
        : 0)
    : 0;

  return (
    <div>
      <AdminPageHeader
        label="RESERVATION DETAIL"
        title={bookingCode}
        description={`${bookingTypeLabel} 상세 정보`}
        actions={
          <Link
            href="/admin/bookings"
            className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            목록으로
          </Link>
        }
      />

      <section className="mb-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold">
              {customerName.slice(0, 1)}
            </div>
            <div>
              <p className="font-display text-lg font-bold text-foreground">
                {customerName}
              </p>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Phone className="size-3" />
                {phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-secondary text-foreground">
              {statusLabel(booking.status)}
            </span>
            <BookingStatusMenu
              realId={booking.id}
              bookingType={type}
              currentStatus={booking.status}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground mb-4">
            예약 정보
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem label="예약 번호" value={bookingCode} mono />
            <DetailItem label="예약 유형" value={bookingTypeLabel} />
            <DetailItem label="방문 일시" value={formatDateTime(visitTime)} />
            <DetailItem label="접수 일시" value={formatDateTime(booking.created_at)} />
            <DetailItem label="최종 수정" value={formatDateTime(booking.updated_at)} />
            <DetailItem label="라켓" value={racket} />
            <DetailItem label="상세" value={mainDetail} />
            <DetailItem
              label="예상 결제"
              value={estimated > 0 ? `${money(estimated)}원` : '-'}
            />
            {serviceBooking ? (
              <>
                <DetailItem
                  label="크로스 스트링"
                  value={getStringName(serviceBooking.cross_string)}
                />
                <DetailItem
                  label="텐션"
                  value={`${serviceBooking.tension_main}/${serviceBooking.tension_cross}LB`}
                />
                <DetailItem
                  label="수령 방식"
                  value={serviceBooking.delivery_method ?? '-'}
                />
              </>
            ) : null}
            {demoBooking ? (
              <>
                <DetailItem
                  label="반납 예정"
                  value={formatDateTime(demoBooking.expected_return_time)}
                />
                <DetailItem
                  label="실제 반납"
                  value={formatDateTime(demoBooking.actual_return_time)}
                />
              </>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold text-foreground mb-4">
            고객 메모
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1">
                <UserRound className="size-3" />
                고객 요청사항
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                {booking.user_notes || '-'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1">
                <CalendarClock className="size-3" />
                관리자 메모
              </p>
              <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                {booking.admin_notes || '-'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
