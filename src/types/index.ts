/**
 * Type definitions for 就診提醒 + 服藥提醒 + 日常瑣事 備忘錄
 */

export type TransportMode = 'car' | 'scooter' | 'transit' | 'walk';

export interface Appointment {
  id: string;
  hospital: string; // 醫院
  department: string; // 科別
  doctor: string; // 醫師
  dateTime: string; // 看診時間 (YYYY-MM-DDTHH:mm)
  number: string; // 號碼
  address: string; // 地址
  transportMode: TransportMode; // 交通方式
  drivingTime: number; // 單程車程 (分鐘)
  parkingSearchTime: number; // 找車位時間 (僅汽車/機車，分鐘)
  walkFromParkingTime: number; // 停車後步行 (分鐘)
  checkInEarlyTime: number; // 提前報到 (預設 15 分)
  safetyBufferTime: number; // 安全緩衝 (預設 10 分)
  itemsToBring: string[]; // 攜帶物品清單
  checkedItems: string[]; // 使用者勾選之已備妥物品
  precautions: string; // 注意事項 (空腹、停藥等，僅顯示自填內容)
  status: 'upcoming' | 'completed' | 'rescheduled' | 'cancelled';
  notes: string;
  nextVisitDate?: string; // 完成後填寫之「下次回診日」
  createdAt: string;
}

export type MedicationTiming =
  | 'before_breakfast' // 早餐前
  | 'after_breakfast'  // 早餐後
  | 'before_lunch'      // 午餐前
  | 'after_lunch'       // 午餐後
  | 'before_dinner'     // 晚餐前
  | 'after_dinner'      // 晚餐後
  | 'bedtime'           // 睡前
  | 'custom';           // 自訂時間

export type MedicationFrequency =
  | 'daily'      // 每天
  | 'weekdays'   // 指定星期
  | 'interval'   // 每隔 N 天
  | 'prn';       // 需要時才吃 (PRN)

export type MedicationShape = 'round' | 'oval' | 'capsule' | 'square' | 'other';

export interface MedicationAppearance {
  color: string; // 顏色名稱或色彩碼 (如 白色、粉紅色、藍黃雙色)
  shape: MedicationShape;
  description: string; // 外觀描述 (如「白色圓形有刻痕標記 50」)
  photoUrl?: string; // 自訂圖片 base64 或 URL
}

export interface Medication {
  id: string;
  name: string; // 藥名
  purpose: string; // 用途 (如「高血壓」、「抗凝血」)
  dosage: string; // 劑量 (如「每次 1 顆」)
  appearance: MedicationAppearance;
  timings: MedicationTiming[]; // 服用時機
  customTimes: string[]; // 若有自訂時段，如 ["08:00", "14:00"]
  frequency: MedicationFrequency;
  specificDays?: number[]; // 0=週日, 1=週一 ... 6=週六
  intervalDays?: number; // 每隔 N 天
  startDate: string; // 起始日期 (YYYY-MM-DD)
  endDate?: string; // 結束日期 (選填)
  maxDailyDoses: number; // 每日最多次數
  minIntervalHours: number; // 最短間隔 (小時)
  totalStock: number; // 剩餘藥量 (顆/包/劑)
  foodNotes: string; // 飲食注意 (純文字備註，如「隨餐服用，忌葡萄柚」)
  isActive: boolean; // 啟用 / 暫停
  createdAt: string;
}

export type DoseStatus = 'taken' | 'skipped' | 'missed';

export interface DoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  slotKey: string; // 唯一時段辨識碼，如 "2026-10-02_after_breakfast" 或 "prn_1727878800000"
  slotName: string; // 如 "早餐後"
  scheduledTime: string; // 預定時間 (YYYY-MM-DDTHH:mm)
  actualTime?: string; // 實際服用時間 (YYYY-MM-DDTHH:mm:ss)
  status: DoseStatus;
  timestamp: number;
  isForced?: boolean; // 是否為長按2秒強制記錄
  forcedReason?: string;
  notes?: string;
  snoozedUntil?: string; // 10分鐘後再提醒
}

export type TodoPriority = 'high' | 'medium' | 'low';
export type TodoRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface TodoItem {
  id: string;
  title: string;
  category: string; // 家務、採買、繳費、聯絡、其他
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: TodoPriority;
  isCompleted: boolean;
  completedAt?: string;
  recurrence: TodoRecurrence;
  notes?: string;
  createdAt: string;
}

export type FontSizeSetting = 'standard' | 'large' | 'extraLarge';
export type ThemeColor = 'teal' | 'emerald' | 'blue' | 'amber' | 'indigo' | 'highContrast';
export type LayoutStyle = 'standard' | 'cards' | 'compact';
export type RingtoneType = 'gentleChime' | 'digitalAlarm' | 'bellRinger' | 'hospitalBeep';

export interface AlarmSettings {
  enabled: boolean;
  ringtone: RingtoneType;
  volume: number; // 0.0 ~ 1.0
  vibration: boolean;
  notifyDeparture: boolean;
  notifyMedication: boolean;
  notifyTodos: boolean;
  snoozeMinutes: number;
}

export type DefaultPageSetting = 'home' | 'appointments' | 'medications' | 'todos' | 'settings';

export interface AppSettings {
  isSeniorMode: boolean; // 長輩專用版模式（超大字體、超大按鈕、親切語音朗讀、最簡化防呆操作）
  fontSize: FontSizeSetting;
  themeColor: ThemeColor;
  layoutStyle: LayoutStyle;
  forceMobileView: boolean; // 強制手機版寬度居中便於閱讀
  defaultLandingPage?: DefaultPageSetting; // 電腦版預設啟動/獨立頁面
  alarm: AlarmSettings;
  lowStockThresholdDays: number; // 低於幾天提醒領藥，預設 7
  defaultTransportMode: TransportMode;
  defaultCheckInEarlyMinutes: number; // 預設 15 分鐘
  defaultSafetyBufferMinutes: number; // 預設 10 分鐘
  pharmacyPhone: string; // 藥局或常看診所電話
  pharmacyName: string; // 藥局或常看診所名稱
  emergencyContactName: string;
  emergencyContactPhone: string;
  mealTimes: {
    breakfast: string; // "08:00"
    lunch: string;     // "12:30"
    dinner: string;    // "18:30"
    bedtime: string;   // "22:00"
  };
  visibleSections: {
    heroPriority: boolean; // 現在最該做的一件事
    todayMedsStatus: boolean; // 今天吃過了嗎速查卡
    appointments: boolean; // 就診出發時間軸
    medicationSlots: boolean; // 今日服藥打卡卡片
    lowStockAlerts: boolean; // 領藥提醒
    todos: boolean; // 日常瑣事
  };
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appointments: Appointment[];
  medications: Medication[];
  doseLogs: DoseLog[];
  todos: TodoItem[];
  settings: AppSettings;
}
