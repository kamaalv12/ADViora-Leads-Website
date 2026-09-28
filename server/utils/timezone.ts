import { toZonedTime } from 'date-fns-tz';
import { APP_TIMEZONE } from '../../lib/constants';

/**
 * Returns year, month (0-indexed), and day in Asia/Kolkata for a given Date.
 */
export function getPartsInIST(date: Date = new Date()): { year: number; month: number; day: number } {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth(),
    day: zoned.getDate(),
  };
}

/**
 * Returns an exact UTC Date corresponding to midnight (00:00:00.000) in Asia/Kolkata.
 * Asia/Kolkata is UTC+05:30 (standard time with zero DST shifts).
 */
export function getMidnightIST(year: number, month: number, day: number): Date {
  // Midnight in IST is (year, month, day, 00:00:00 +05:30)
  // Which in UTC is equivalent to 18:30:00 of the previous calendar day.
  const utcMillis = Date.UTC(year, month, day, 0, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000;
  return new Date(utcMillis);
}

export interface DateRangeBounds {
  start: Date | null;
  end: Date | null;
  isAllTime: boolean;
  label: string;
}

/**
 * Calculates mathematically exact half-open intervals [start, end) for a given date range preset.
 * All boundaries are computed in the authoritative Asia/Kolkata timezone.
 */
export function getDateRangeBounds(
  range: 'today' | '7days' | 'all' | 'custom',
  customStartDate?: string,
  customEndDate?: string
): DateRangeBounds {
  const now = new Date();
  const { year, month, day } = getPartsInIST(now);

  if (range === 'today') {
    const start = getMidnightIST(year, month, day);
    const end = getMidnightIST(year, month, day + 1); // Next day midnight exclusive
    return {
      start,
      end,
      isAllTime: false,
      label: `Today (${formatDateLabel(start)})`,
    };
  }

  if (range === '7days') {
    // 7 full calendar days including today: [today - 6 days, today + 1 day)
    const start = getMidnightIST(year, month, day - 6);
    const end = getMidnightIST(year, month, day + 1);
    return {
      start,
      end,
      isAllTime: false,
      label: `Last 7 Days (${formatDateLabel(start)} – ${formatDateLabel(new Date(end.getTime() - 1))})`,
    };
  }

  if (range === 'custom') {
    if (!customStartDate || !customEndDate) {
      throw new Error('startDate and endDate are required for custom date range');
    }

    const startMatch = customStartDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const endMatch = customEndDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!startMatch || !endMatch) {
      throw new Error('Dates must be in valid YYYY-MM-DD format');
    }

    const startYear = parseInt(startMatch[1], 10);
    const startMonth = parseInt(startMatch[2], 10) - 1;
    const startDay = parseInt(startMatch[3], 10);

    const endYear = parseInt(endMatch[1], 10);
    const endMonth = parseInt(endMatch[2], 10) - 1;
    const endDay = parseInt(endMatch[3], 10);

    const start = getMidnightIST(startYear, startMonth, startDay);
    // End date is inclusive of the whole calendar day: boundary is next day midnight exclusive
    const end = getMidnightIST(endYear, endMonth, endDay + 1);

    if (start.getTime() >= end.getTime()) {
      throw new Error('startDate must be before or equal to endDate');
    }

    return {
      start,
      end,
      isAllTime: false,
      label: `Custom Range (${formatDateLabel(start)} – ${formatDateLabel(new Date(end.getTime() - 1))})`,
    };
  }

  // 'all'
  return {
    start: null,
    end: null,
    isAllTime: true,
    label: 'All Time',
  };
}

function formatDateLabel(date: Date): string {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  return zoned.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: APP_TIMEZONE,
  });
}

/**
 * Formats a Date to a human-readable IST string.
 */
export function formatISTDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const zoned = toZonedTime(d, APP_TIMEZONE);
  return zoned.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: APP_TIMEZONE,
  });
}
