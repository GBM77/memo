import { Appointment, Medication, TransportMode } from '../types';
import { formatTime24, subMinutes, addMinutes, diffMinutes } from './dateUtils';

export interface TimelineNode {
  timeStr: string;
  label: string;
  minutesBeforeVisit: number;
}

export interface DepartureCalculation {
  departureDate: Date;
  departureTimeStr: string;
  totalLeadMinutes: number;
  timelineText: string;
  nodes: TimelineNode[];
  isOverdue: boolean;
  minutesUntilDeparture: number;
  urgencyLevel: 'urgent' | 'warning' | 'normal' | 'late';
}

/**
 * 最晚出發時間 = 看診時間 − 提前報到 − 停車後步行 − (若汽車/機車則加找車位) − 單程車程 − 安全緩衝
 */
export function calculateDepartureTime(
  visitDateTime: string | Date,
  transportMode: TransportMode,
  drivingTime: number,
  parkingSearchTime: number,
  walkFromParkingTime: number,
  checkInEarlyTime: number,
  safetyBufferTime: number,
  now: Date = new Date()
): DepartureCalculation {
  const visitDate = typeof visitDateTime === 'string' ? new Date(visitDateTime) : visitDateTime;

  const actualParkingSearch = (transportMode === 'car' || transportMode === 'scooter') ? Number(parkingSearchTime || 0) : 0;
  const actualWalkFromParking = Number(walkFromParkingTime || 0);
  const actualDriving = Number(drivingTime || 0);
  const actualCheckInEarly = Number(checkInEarlyTime || 0);
  const actualSafetyBuffer = Number(safetyBufferTime || 0);

  // Total minutes before visit needed
  const totalLeadMinutes =
    actualDriving +
    actualParkingSearch +
    actualWalkFromParking +
    actualCheckInEarly +
    actualSafetyBuffer;

  const departureDate = subMinutes(visitDate, totalLeadMinutes);
  const departureTimeStr = formatTime24(departureDate);

  // Calculate milestone timestamps for timeline
  // 1. 出發: departureDate
  // 2. 停妥/下車: departureDate + drivingTime + parkingSearchTime
  // 3. 報到: visitDate - checkInEarlyTime
  // 4. 看診: visitDate
  const arrivedParkingDate = addMinutes(departureDate, actualDriving + actualParkingSearch);
  const checkInDate = subMinutes(visitDate, actualCheckInEarly);

  const nodes: TimelineNode[] = [
    {
      timeStr: departureTimeStr,
      label: '出發',
      minutesBeforeVisit: totalLeadMinutes,
    },
  ];

  if (actualParkingSearch > 0 || actualWalkFromParking > 0) {
    nodes.push({
      timeStr: formatTime24(arrivedParkingDate),
      label: transportMode === 'transit' ? '下車步行' : '停好車',
      minutesBeforeVisit: actualWalkFromParking + actualCheckInEarly + actualSafetyBuffer,
    });
  }

  nodes.push({
    timeStr: formatTime24(checkInDate),
    label: '報到',
    minutesBeforeVisit: actualCheckInEarly,
  });

  nodes.push({
    timeStr: formatTime24(visitDate),
    label: '看診',
    minutesBeforeVisit: 0,
  });

  // Timeline representation: "14:30 看診 ← 14:15 報到 ← 14:00 停好車 ← 13:15 出發"
  const reversedNodes = [...nodes].reverse();
  const timelineText = reversedNodes.map((n) => `${n.timeStr} ${n.label}`).join(' ← ');

  const minutesUntilDeparture = diffMinutes(departureDate, now);
  const isOverdue = minutesUntilDeparture < 0;

  let urgencyLevel: 'urgent' | 'warning' | 'normal' | 'late' = 'normal';
  if (isOverdue) {
    urgencyLevel = 'late'; // 來不及了
  } else if (minutesUntilDeparture <= 15) {
    urgencyLevel = 'urgent'; // 15分內出發
  } else if (minutesUntilDeparture <= 45) {
    urgencyLevel = 'warning'; // 45分內出發
  }

  return {
    departureDate,
    departureTimeStr,
    totalLeadMinutes,
    timelineText,
    nodes,
    isOverdue,
    minutesUntilDeparture,
    urgencyLevel,
  };
}

/**
 * 依醫院名稱取得最近一次就診的時間與交通參數
 */
export function getPreviousHospitalParams(
  hospitalName: string,
  appointments: Appointment[]
): Partial<Appointment> | null {
  if (!hospitalName || !hospitalName.trim()) return null;
  const target = hospitalName.trim().toLowerCase();

  // Find most recent appointment matching hospital
  const matched = appointments
    .filter((a) => a.hospital.trim().toLowerCase() === target)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  if (matched.length === 0) return null;

  const prev = matched[0];
  return {
    address: prev.address,
    transportMode: prev.transportMode,
    drivingTime: prev.drivingTime,
    parkingSearchTime: prev.parkingSearchTime,
    walkFromParkingTime: prev.walkFromParkingTime,
    checkInEarlyTime: prev.checkInEarlyTime,
    safetyBufferTime: prev.safetyBufferTime,
  };
}

/**
 * 檢查同日多筆就診是否有時間衝突
 */
export function checkAppointmentConflicts(
  targetAppointment: Partial<Appointment>,
  allAppointments: Appointment[]
): { hasConflict: boolean; message: string; conflictingId?: string } {
  if (!targetAppointment.dateTime) return { hasConflict: false, message: '' };

  const targetDate = new Date(targetAppointment.dateTime);
  const targetId = targetAppointment.id;

  // Find other upcoming appointments on the same day
  const sameDayApps = allAppointments.filter((a) => {
    if (a.id === targetId || a.status === 'cancelled') return false;
    const d = new Date(a.dateTime);
    return (
      d.getFullYear() === targetDate.getFullYear() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getDate() === targetDate.getDate()
    );
  });

  if (sameDayApps.length === 0) return { hasConflict: false, message: '' };

  for (const other of sameDayApps) {
    const otherDate = new Date(other.dateTime);
    // Assume average consultation takes ~45 minutes
    const EST_CONSULT_MINUTES = 45;
    const transitEstimate = Math.max(targetAppointment.drivingTime || 20, other.drivingTime || 20);

    const earlier = targetDate < otherDate ? { app: targetAppointment, date: targetDate } : { app: other, date: otherDate };
    const later = targetDate < otherDate ? { app: other, date: otherDate } : { app: targetAppointment, date: targetDate };

    // Earlier appointment finishes around earlier.date + EST_CONSULT_MINUTES
    const earlierFinish = addMinutes(earlier.date, EST_CONSULT_MINUTES);
    // Later appointment requires departure at later departure time
    const laterDeparture = subMinutes(later.date, (later.app.drivingTime || 15) + (later.app.checkInEarlyTime || 15));

    if (earlierFinish > laterDeparture) {
      const msg = `⚠️ 與當日「${other.hospital} ${other.department} (${formatTime24(otherDate)})」時間過近！預估看診結束至下一場出發時間不足（間隔需包含兩地車程約 ${transitEstimate} 分鐘及看診時間），請確認排程。`;
      return { hasConflict: true, message: msg, conflictingId: other.id };
    }
  }

  return { hasConflict: false, message: '' };
}

/**
 * 自動產生攜帶物品清單（自動加入目前使用中的藥品清單與健保卡、身分證、藥袋等）
 */
export function generateDefaultItemsToBring(activeMedications: Medication[]): string[] {
  const baseItems = [
    '健保卡',
    '身分證 / 健保快易通',
    '錢包 / 信用卡 / 現金',
    '近期藥袋或處方箋',
  ];

  if (activeMedications.length > 0) {
    const medNames = activeMedications.map((m) => `${m.name}(${m.dosage})`).join('、');
    baseItems.push(`目前服用中的藥物清單（${medNames}）`);
  } else {
    baseItems.push('目前服用中的慢性病藥品');
  }

  return baseItems;
}
