import {
  getBusinessHoursLabel,
  getCalendarDateStatus,
} from '../src/utils/bookingCalendarStatus';
import type { ClosedDate, ShopSchedule } from '../src/services/scheduleService';

const schedule: ShopSchedule[] = [
  { day_of_week: 0, open_time: '10:00:00', close_time: '17:00:00', is_closed: true },
  { day_of_week: 1, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  {
    day_of_week: 2,
    open_time: '11:00:00',
    close_time: '16:00:00',
    is_closed: false,
  },
  { day_of_week: 3, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  { day_of_week: 4, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  { day_of_week: 5, open_time: '09:00:00', close_time: '18:00:00', is_closed: false },
  { day_of_week: 6, open_time: '10:00:00', close_time: '17:00:00', is_closed: false },
];

const closedDates: ClosedDate[] = [
  {
    closed_date: '2099-05-06',
    reason: '임시 휴무',
    created_by: null,
  },
];

describe('bookingCalendarStatus', () => {
  test('캘린더 날짜 상태는 정상영업, 휴무, 영업종료를 구분한다', () => {
    expect(getCalendarDateStatus('2099-05-04', schedule, closedDates)).toBe(
      'normal',
    );
    expect(getCalendarDateStatus('2099-05-03', schedule, closedDates)).toBe(
      'closed',
    );
    expect(getCalendarDateStatus('2099-05-05', schedule, closedDates)).toBe(
      'normal',
    );
    expect(
      getCalendarDateStatus(
        '2099-05-05',
        schedule,
        closedDates,
        new Date('2099-05-05T07:30:00.000Z'),
      ),
    ).toBe(
      'ended',
    );
    expect(getCalendarDateStatus('2099-05-06', schedule, closedDates)).toBe(
      'closed',
    );
  });

  test('선택한 날짜의 영업시간 안내 문구를 만든다', () => {
    expect(getBusinessHoursLabel('2099-05-04', schedule, [])).toBe(
      '영업시간 09:00 - 18:00',
    );
    expect(
      getBusinessHoursLabel(
        '2099-05-05',
        schedule,
        [],
        new Date('2099-05-05T07:30:00.000Z'),
      ),
    ).toBe('영업 종료 11:00 - 16:00');
    expect(getBusinessHoursLabel('2099-05-03', schedule, [])).toBe('휴무');
    expect(getBusinessHoursLabel('2099-05-06', schedule, closedDates)).toBe(
      '휴무',
    );
  });
});
