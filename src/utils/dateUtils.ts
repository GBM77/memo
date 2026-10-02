/**
 * Date and Time utilities for Asia/Taipei timezone
 * Format: 2026/10/02(五) and 24-hour HH:mm
 */

const TAIWAN_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * Returns current Date in Asia/Taipei
 */
export function getNowTaipei(): Date {
  return new Date();
}

/**
 * Formats a date object or string into `2026/10/02(五)`
 */
export function formatDateTaipei(dateInput: Date | string | number): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dayOfWeek = TAIWAN_WEEKDAYS[d.getDay()];

  return `${yyyy}/${mm}/${dd}(${dayOfWeek})`;
}

/**
 * Formats a date into `YYYY-MM-DD`
 */
export function toDateInputValue(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats a date into `HH:mm` (24-hour)
 */
export function formatTime24(dateInput: Date | string | number): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/**
 * Formats a date into `YYYY/MM/DD(週幾) HH:mm`
 */
export function formatDateTimeTaipei(dateInput: Date | string | number): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  return `${formatDateTaipei(d)} ${formatTime24(d)}`;
}

/**
 * Calculate difference in minutes between two dates (target - base)
 */
export function diffMinutes(target: Date | string, base: Date | string = new Date()): number {
  const t = typeof target === 'string' ? new Date(target).getTime() : target.getTime();
  const b = typeof base === 'string' ? new Date(base).getTime() : base.getTime();
  return Math.round((t - b) / (1000 * 60));
}

/**
 * Adds minutes to a Date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Subtracts minutes from a Date
 */
export function subMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

/**
 * Checks if two date objects or ISO strings are on the exact same calendar day
 */
export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
  const date2 = typeof d2 === 'string' ? new Date(d2) : d2;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Format relative countdown string (e.g., "35 分鐘後", "已過期 10 分鐘")
 */
export function formatRelativeCountdown(targetDate: Date | string, now: Date = new Date()): {
  text: string;
  isOverdue: boolean;
  minutesLeft: number;
} {
  const mins = diffMinutes(targetDate, now);
  if (mins < 0) {
    const overdueMins = Math.abs(mins);
    if (overdueMins < 60) {
      return { text: `已逾期 ${overdueMins} 分鐘`, isOverdue: true, minutesLeft: mins };
    }
    const hours = Math.floor(overdueMins / 60);
    const remMins = overdueMins % 60;
    return {
      text: remMins > 0 ? `已逾期 ${hours} 小時 ${remMins} 分鐘` : `已逾期 ${hours} 小時`,
      isOverdue: true,
      minutesLeft: mins,
    };
  } else if (mins === 0) {
    return { text: '就在現在', isOverdue: false, minutesLeft: 0 };
  } else if (mins < 60) {
    return { text: `${mins} 分鐘後`, isOverdue: false, minutesLeft: mins };
  } else {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return {
      text: remMins > 0 ? `${hours} 小時 ${remMins} 分鐘後` : `${hours} 小時後`,
      isOverdue: false,
      minutesLeft: mins,
    };
  }
}
