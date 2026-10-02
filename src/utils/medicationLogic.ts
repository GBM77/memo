import {
  Medication,
  MedicationTiming,
  DoseLog,
  AppSettings,
} from '../types';
import {
  formatDateTaipei,
  formatTime24,
  diffMinutes,
  isSameDay,
  addMinutes,
} from './dateUtils';

export const TIMING_LABELS: Record<MedicationTiming, string> = {
  before_breakfast: '早餐前 (空腹)',
  after_breakfast: '早餐後',
  before_lunch: '午餐前',
  after_lunch: '午餐後',
  before_dinner: '晚餐前',
  after_dinner: '晚餐後',
  bedtime: '睡前',
  custom: '自訂時段',
};

export const SHAPE_LABELS: Record<string, string> = {
  round: '圓形錠劑',
  oval: '橢圓形',
  capsule: '膠囊',
  square: '方形',
  other: '其他形狀 / 粉劑',
};

export interface DailySlot {
  slotKey: string;
  timeStr: string; // "08:00"
  fullDateTimeStr: string; // "2026-10-02T08:00"
  timing: MedicationTiming;
  title: string; // "早餐後"
  medications: {
    med: Medication;
    status: 'taken' | 'skipped' | 'missed' | 'pending';
    log?: DoseLog;
    isSnoozed?: boolean;
    snoozedUntil?: string;
  }[];
  isAllTaken: boolean;
  hasMissed: boolean;
  isOverdue15: boolean;
  isOverdue30: boolean;
  minutesOverdue: number;
}

/**
 * 依時機與使用者偏好設定取得預定時分
 */
export function getTimeForTiming(timing: MedicationTiming, settings: AppSettings): string {
  const [bH, bM] = settings.mealTimes.breakfast.split(':').map(Number);
  const [lH, lM] = settings.mealTimes.lunch.split(':').map(Number);
  const [dH, dM] = settings.mealTimes.dinner.split(':').map(Number);
  const [sH, sM] = settings.mealTimes.bedtime.split(':').map(Number);

  const pad = (n: number) => String(n).padStart(2, '0');

  switch (timing) {
    case 'before_breakfast': {
      // 30 mins before breakfast
      let mins = bH * 60 + bM - 30;
      if (mins < 0) mins += 1440;
      return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
    }
    case 'after_breakfast':
      return settings.mealTimes.breakfast;
    case 'before_lunch': {
      let mins = lH * 60 + lM - 30;
      return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
    }
    case 'after_lunch':
      return settings.mealTimes.lunch;
    case 'before_dinner': {
      let mins = dH * 60 + dM - 30;
      return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
    }
    case 'after_dinner':
      return settings.mealTimes.dinner;
    case 'bedtime':
      return settings.mealTimes.bedtime;
    default:
      return '12:00';
  }
}

/**
 * 檢查藥品在指定日期是否應該服用
 */
export function isMedicationScheduledOnDate(med: Medication, date: Date): boolean {
  if (!med.isActive) return false;

  const targetDateStr = date.toISOString().split('T')[0];
  if (med.startDate > targetDateStr) return false;
  if (med.endDate && med.endDate < targetDateStr) return false;

  if (med.frequency === 'prn') {
    return true; // 需要時才吃隨時可取用
  }

  if (med.frequency === 'daily') {
    return true;
  }

  if (med.frequency === 'weekdays' && med.specificDays) {
    return med.specificDays.includes(date.getDay());
  }

  if (med.frequency === 'interval' && med.intervalDays) {
    const start = new Date(med.startDate).getTime();
    const current = new Date(targetDateStr).getTime();
    const dayDiff = Math.floor((current - start) / (1000 * 60 * 60 * 24));
    return dayDiff >= 0 && dayDiff % med.intervalDays === 0;
  }

  return true;
}

/**
 * 取得指定日期的所有合併時段清單 (同時間多種藥合併為一則提醒)
 */
export function getDailySlots(
  date: Date,
  medications: Medication[],
  doseLogs: DoseLog[],
  settings: AppSettings,
  now: Date = new Date()
): DailySlot[] {
  const dateStr = date.toISOString().split('T')[0];
  const activeMeds = medications.filter((m) => isMedicationScheduledOnDate(m, date));

  // Map of slotKey -> DailySlot
  const slotMap: Record<string, DailySlot> = {};

  for (const med of activeMeds) {
    if (med.frequency === 'prn') continue; // PRN 另外獨立處理

    const targetTimings: { timing: MedicationTiming; timeStr: string }[] = [];

    if (med.timings && med.timings.length > 0) {
      for (const t of med.timings) {
        if (t === 'custom') {
          for (const ct of med.customTimes || ['08:00']) {
            targetTimings.push({ timing: 'custom', timeStr: ct });
          }
        } else {
          targetTimings.push({ timing: t, timeStr: getTimeForTiming(t, settings) });
        }
      }
    } else {
      targetTimings.push({ timing: 'after_breakfast', timeStr: settings.mealTimes.breakfast });
    }

    for (const item of targetTimings) {
      const slotKey = `${dateStr}_${item.timeStr.replace(':', '')}_${item.timing}`;
      const scheduledDateTimeStr = `${dateStr}T${item.timeStr}:00`;

      if (!slotMap[slotKey]) {
        slotMap[slotKey] = {
          slotKey,
          timeStr: item.timeStr,
          fullDateTimeStr: scheduledDateTimeStr,
          timing: item.timing,
          title: TIMING_LABELS[item.timing] || item.timeStr,
          medications: [],
          isAllTaken: false,
          hasMissed: false,
          isOverdue15: false,
          isOverdue30: false,
          minutesOverdue: 0,
        };
      }

      // Check log
      const matchedLog = doseLogs.find(
        (l) => l.medicationId === med.id && (l.slotKey === slotKey || (l.scheduledTime && l.scheduledTime.startsWith(`${dateStr}T${item.timeStr}`)))
      );

      let status: 'taken' | 'skipped' | 'missed' | 'pending' = 'pending';
      let isSnoozed = false;
      let snoozedUntil: string | undefined = undefined;

      if (matchedLog) {
        status = matchedLog.status;
        if (matchedLog.snoozedUntil && new Date(matchedLog.snoozedUntil).getTime() > now.getTime()) {
          isSnoozed = true;
          snoozedUntil = matchedLog.snoozedUntil;
        }
      } else {
        // If not logged, check if overdue
        const schedTime = new Date(scheduledDateTimeStr);
        const diff = diffMinutes(now, schedTime); // now - scheduled
        if (diff > 30) {
          status = 'missed'; // 逾時30分階梯
        }
      }

      slotMap[slotKey].medications.push({
        med,
        status,
        log: matchedLog,
        isSnoozed,
        snoozedUntil,
      });
    }
  }

  // Finalize slot states and sort by time
  const slots = Object.values(slotMap).map((slot) => {
    const isAllTaken = slot.medications.length > 0 && slot.medications.every((m) => m.status === 'taken');
    const hasMissed = slot.medications.some((m) => m.status === 'missed');

    const schedDate = new Date(slot.fullDateTimeStr);
    const diff = diffMinutes(now, schedDate);
    const isOverdue15 = !isAllTaken && diff >= 15;
    const isOverdue30 = !isAllTaken && diff >= 30;

    return {
      ...slot,
      isAllTaken,
      hasMissed,
      isOverdue15,
      isOverdue30,
      minutesOverdue: diff > 0 ? diff : 0,
    };
  });

  return slots.sort((a, b) => a.timeStr.localeCompare(b.timeStr));
}

/**
 * 檢查藥品今日是否重複或間隔不足
 */
export function checkDuplicateDose(
  med: Medication,
  targetSlotKey: string,
  doseLogs: DoseLog[],
  now: Date = new Date()
): {
  isDuplicate: boolean;
  reason: string;
  lastTakenLog?: DoseLog;
  dosesTodayCount: number;
  isMaxReached: boolean;
  hoursSinceLastDose?: number;
} {
  const todayStr = now.toISOString().split('T')[0];

  // 1. Same slot check
  const sameSlotLog = doseLogs.find(
    (l) => l.medicationId === med.id && l.slotKey === targetSlotKey && l.status === 'taken'
  );
  if (sameSlotLog) {
    const timeFormatted = sameSlotLog.actualTime ? formatTime24(sameSlotLog.actualTime) : '';
    return {
      isDuplicate: true,
      reason: `你在 ${timeFormatted || '稍早'} 已吃過此時段藥物，請勿重複服用！`,
      lastTakenLog: sameSlotLog,
      dosesTodayCount: 1,
      isMaxReached: false,
    };
  }

  // 2. Count taken today
  const todayTakenLogs = doseLogs
    .filter(
      (l) =>
        l.medicationId === med.id &&
        l.status === 'taken' &&
        l.actualTime &&
        isSameDay(l.actualTime, now)
    )
    .sort((a, b) => new Date(b.actualTime!).getTime() - new Date(a.actualTime!).getTime());

  const dosesTodayCount = todayTakenLogs.length;

  // 3. Max daily doses check
  const isMaxReached = med.maxDailyDoses > 0 && dosesTodayCount >= med.maxDailyDoses;
  if (isMaxReached) {
    return {
      isDuplicate: true,
      reason: `今日已達每日上限 (${med.maxDailyDoses} 次)，今日已吃完，請勿再服用！`,
      lastTakenLog: todayTakenLogs[0],
      dosesTodayCount,
      isMaxReached: true,
    };
  }

  // 4. Minimum interval check
  if (todayTakenLogs.length > 0 && med.minIntervalHours > 0) {
    const lastTaken = todayTakenLogs[0];
    const lastTakenDate = new Date(lastTaken.actualTime!);
    const diffHours = (now.getTime() - lastTakenDate.getTime()) / (1000 * 60 * 60);

    if (diffHours < med.minIntervalHours) {
      const waitMinutes = Math.ceil((med.minIntervalHours - diffHours) * 60);
      return {
        isDuplicate: true,
        reason: `距離上次服用 (${formatTime24(lastTakenDate)}) 僅間隔 ${diffHours.toFixed(1)} 小時，未達規定最短間隔 ${med.minIntervalHours} 小時！還需等待約 ${waitMinutes} 分鐘。`,
        lastTakenLog: lastTaken,
        dosesTodayCount,
        isMaxReached: false,
        hoursSinceLastDose: diffHours,
      };
    }
  }

  return {
    isDuplicate: false,
    reason: '',
    lastTakenLog: todayTakenLogs[0],
    dosesTodayCount,
    isMaxReached: false,
  };
}

/**
 * 依藥品每日用量與庫存推算剩餘天數
 */
export function calculateRemainingDays(med: Medication): number {
  if (med.totalStock <= 0) return 0;

  let dosesPerDay = 1;
  if (med.frequency === 'daily') {
    dosesPerDay = (med.timings && med.timings.length > 0 ? med.timings.length : 1) + (med.customTimes?.length || 0);
  } else if (med.frequency === 'weekdays' && med.specificDays?.length) {
    const times = (med.timings?.length || 1);
    dosesPerDay = (times * med.specificDays.length) / 7;
  } else if (med.frequency === 'interval' && med.intervalDays) {
    dosesPerDay = (med.timings?.length || 1) / med.intervalDays;
  } else if (med.frequency === 'prn') {
    dosesPerDay = Math.max(1, med.maxDailyDoses ? med.maxDailyDoses * 0.5 : 1);
  }

  // Assume standard 1 dose unit per intake
  const daysLeft = Math.floor(med.totalStock / (dosesPerDay || 1));
  return Math.max(0, daysLeft);
}

/**
 * 產生分享到 LINE 的今日服藥狀態純文字
 */
export function generateLineShareText(
  date: Date,
  dailySlots: DailySlot[],
  prnLogs: DoseLog[]
): string {
  const dateFormatted = formatDateTaipei(date);
  const lines: string[] = [];

  lines.push(`【今日服藥狀態回報】`);
  lines.push(`📅 日期：${dateFormatted}`);
  lines.push(`-----------------------`);

  if (dailySlots.length === 0 && prnLogs.length === 0) {
    lines.push(`今日無排定服藥行程。`);
  } else {
    for (const slot of dailySlots) {
      const medSummaries = slot.medications.map((m) => {
        const doseStr = m.med.dosage ? `(${m.med.dosage})` : '';
        if (m.status === 'taken') {
          const time = m.log?.actualTime ? formatTime24(m.log.actualTime) : slot.timeStr;
          return `✓ ${m.med.name}${doseStr} [已於 ${time} 服用]`;
        } else if (m.status === 'skipped') {
          return `⚪ ${m.med.name}${doseStr} [已跳過]`;
        } else if (m.status === 'missed') {
          return `⚠️ ${m.med.name}${doseStr} [尚未服用/漏吃]`;
        } else {
          return `⏳ ${m.med.name}${doseStr} [待服用]`;
        }
      });

      lines.push(`⏰ ${slot.title} (${slot.timeStr})：`);
      lines.push(...medSummaries.map((s) => `   ${s}`));
    }

    if (prnLogs.length > 0) {
      lines.push(`💊 備用/需要時服藥紀錄：`);
      for (const log of prnLogs) {
        lines.push(`   ✓ ${log.medicationName} [於 ${log.actualTime ? formatTime24(log.actualTime) : ''} 服用]`);
      }
    }
  }

  lines.push(`-----------------------`);
  lines.push(`❤️ 我都有乖乖注意吃藥，請家人朋友放心！`);
  lines.push(`（本訊息來自安時備忘）`);

  return lines.join('\n');
}

/**
 * 計算過去 30 天服藥率與每日明細
 */
export function calculate30DayAdherence(
  medications: Medication[],
  doseLogs: DoseLog[],
  settings: AppSettings,
  now: Date = new Date()
): {
  overallRate: number;
  totalScheduled: number;
  totalTaken: number;
  daysData: {
    dateStr: string;
    dayLabel: string;
    scheduledCount: number;
    takenCount: number;
    rate: number;
  }[];
} {
  const daysData: {
    dateStr: string;
    dayLabel: string;
    scheduledCount: number;
    takenCount: number;
    rate: number;
  }[] = [];

  let grandTotalScheduled = 0;
  let grandTotalTaken = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;

    const slots = getDailySlots(d, medications, doseLogs, settings, now);

    let dayScheduled = 0;
    let dayTaken = 0;

    for (const slot of slots) {
      for (const m of slot.medications) {
        dayScheduled++;
        if (m.status === 'taken') {
          dayTaken++;
        }
      }
    }

    const rate = dayScheduled > 0 ? Math.round((dayTaken / dayScheduled) * 100) : 100;
    daysData.push({
      dateStr,
      dayLabel,
      scheduledCount: dayScheduled,
      takenCount: dayTaken,
      rate,
    });

    grandTotalScheduled += dayScheduled;
    grandTotalTaken += dayTaken;
  }

  const overallRate = grandTotalScheduled > 0 ? Math.round((grandTotalTaken / grandTotalScheduled) * 100) : 100;

  return {
    overallRate,
    totalScheduled: grandTotalScheduled,
    totalTaken: grandTotalTaken,
    daysData,
  };
}
