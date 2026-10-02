import {
  Appointment,
  Medication,
  DoseLog,
  TodoItem,
  AppSettings,
  BackupData,
} from '../types';
import { toDateInputValue } from './dateUtils';

const STORAGE_KEYS = {
  APPOINTMENTS: 'anshi_appointments_v1',
  MEDICATIONS: 'anshi_medications_v1',
  DOSE_LOGS: 'anshi_doselogs_v1',
  TODOS: 'anshi_todos_v1',
  SETTINGS: 'anshi_settings_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  isSeniorMode: false,
  fontSize: 'standard',
  themeColor: 'teal',
  layoutStyle: 'standard',
  forceMobileView: false,
  defaultLandingPage: 'home',
  alarm: {
    enabled: true,
    ringtone: 'gentleChime',
    volume: 0.8,
    vibration: true,
    notifyDeparture: true,
    notifyMedication: true,
    notifyTodos: true,
    snoozeMinutes: 10,
  },
  lowStockThresholdDays: 7,
  defaultTransportMode: 'car',
  defaultCheckInEarlyMinutes: 15,
  defaultSafetyBufferMinutes: 10,
  pharmacyPhone: '02-2312-3456', // 範例：台大醫院藥劑部/諮詢
  pharmacyName: '台大醫院藥劑部諮詢電話',
  emergencyContactName: '家人聯絡',
  emergencyContactPhone: '0912-345-678',
  mealTimes: {
    breakfast: '08:00',
    lunch: '12:30',
    dinner: '18:30',
    bedtime: '22:00',
  },
  visibleSections: {
    heroPriority: true,
    todayMedsStatus: true,
    appointments: true,
    medicationSlots: true,
    lowStockAlerts: true,
    todos: true,
  },
};

/**
 * 預設範例就診資料
 */
export function getDefaultAppointments(): Appointment[] {
  const today = toDateInputValue();
  return [
    {
      id: 'app-sample-1',
      hospital: '國立臺灣大學醫學院附設醫院 (總院)',
      department: '心臟內科',
      doctor: '林醫師',
      dateTime: `${today}T14:30`,
      number: '28 號',
      address: '台北市中正區中山南路 7 號',
      transportMode: 'car',
      drivingTime: 25,
      parkingSearchTime: 15,
      walkFromParkingTime: 5,
      checkInEarlyTime: 15,
      safetyBufferTime: 10,
      itemsToBring: [
        '健保卡',
        '身分證 / 健保快易通',
        '錢包 / 現金',
        '近期藥袋或處方箋',
        '目前服用中的藥物清單（脈優錠 5mg、阿斯匹靈腸溶膜衣錠 100mg）',
      ],
      checkedItems: ['健保卡', '身分證 / 健保快易通'],
      precautions: '空腹抽血檢查（看診前需禁食 8 小時，可少量喝水）；攜帶上月血壓紀錄本。',
      status: 'upcoming',
      notes: '舊大樓二樓心臟科門診，記得先至診間門口插卡報到。',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'app-sample-2',
      hospital: '台北榮民總醫院',
      department: '新陳代謝科',
      doctor: '陳主任',
      dateTime: '2026-10-15T09:30',
      number: '14 號',
      address: '台北市北投區石牌路二段 201 號',
      transportMode: 'transit',
      drivingTime: 35,
      parkingSearchTime: 0,
      walkFromParkingTime: 8,
      checkInEarlyTime: 15,
      safetyBufferTime: 10,
      itemsToBring: ['健保卡', '身分證', '連續處方箋領藥本'],
      checkedItems: [],
      precautions: '免禁食，提早驗尿。',
      status: 'upcoming',
      notes: '捷運石牌站轉乘接駁車',
      createdAt: new Date().toISOString(),
    },
  ];
}

/**
 * 預設範例藥品資料
 */
export function getDefaultMedications(): Medication[] {
  const today = toDateInputValue();
  return [
    {
      id: 'med-sample-1',
      name: '脈優錠 (Amlodipine 5mg)',
      purpose: '高血壓控制',
      dosage: '每日 1 次，每次 1 顆',
      appearance: {
        color: '白色',
        shape: 'round',
        description: '白色八角圓形錠劑，一面刻有 AML 5 字樣',
      },
      timings: ['after_breakfast'],
      customTimes: [],
      frequency: 'daily',
      startDate: today,
      maxDailyDoses: 1,
      minIntervalHours: 20,
      totalStock: 14, // 剩餘 14 顆 (約14天)
      foodNotes: '整顆吞服，避免葡萄柚或葡萄柚汁一同食用以免影響血壓。',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'med-sample-2',
      name: '阿斯匹靈腸溶膜衣錠 (Bokey 100mg)',
      purpose: '預防心血管血栓',
      dosage: '每日 1 次，每次 1 顆',
      appearance: {
        color: '白色',
        shape: 'round',
        description: '白色圓形膜衣錠，表面光滑',
      },
      timings: ['after_breakfast'],
      customTimes: [],
      frequency: 'daily',
      startDate: today,
      maxDailyDoses: 1,
      minIntervalHours: 20,
      totalStock: 5, // 剩餘 5 顆 (小於 7 天，觸發領藥提醒！)
      foodNotes: '建議飯後搭配溫開水整顆吞服，切勿嚼碎。',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'med-sample-3',
      name: '立普妥膜衣錠 (Atorvastatin 20mg)',
      purpose: '降低膽固醇、血脂',
      dosage: '每日 1 次，每次 1 顆',
      appearance: {
        color: '白色',
        shape: 'oval',
        description: '白色橢圓形錠劑，一面刻有 20 字樣',
      },
      timings: ['bedtime'],
      customTimes: [],
      frequency: 'daily',
      startDate: today,
      maxDailyDoses: 1,
      minIntervalHours: 20,
      totalStock: 28,
      foodNotes: '睡前服用效果最佳，服藥期間請避免飲酒與葡萄柚。',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'med-sample-4',
      name: '普拿疼加強錠 (Acetaminophen 500mg)',
      purpose: '頭痛或關節疼痛緩解',
      dosage: '需要時服用，每次 1 顆',
      appearance: {
        color: '紅白雙色',
        shape: 'capsule',
        description: '紅白兩色長橢圓形膠囊狀錠劑',
      },
      timings: ['custom'],
      customTimes: [],
      frequency: 'prn', // 需要時才吃
      startDate: today,
      maxDailyDoses: 3,
      minIntervalHours: 4, // 最少間隔 4 小時
      totalStock: 10,
      foodNotes: '請勿與其他含乙醯胺酚藥物重複服用，不可飲酒。',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

/**
 * 預設範例服用紀錄 (模擬今天早上已吃了早餐藥)
 */
export function getDefaultDoseLogs(): DoseLog[] {
  const today = toDateInputValue();
  return [
    {
      id: 'log-sample-1',
      medicationId: 'med-sample-1',
      medicationName: '脈優錠 (Amlodipine 5mg)',
      slotKey: `${today}_0800_after_breakfast`,
      slotName: '早餐後',
      scheduledTime: `${today}T08:00:00`,
      actualTime: `${today}T08:12:00`,
      status: 'taken',
      timestamp: Date.now() - 4 * 60 * 60 * 1000,
      notes: '早餐飯後正常服用，量測血壓 124/82',
    },
    {
      id: 'log-sample-2',
      medicationId: 'med-sample-2',
      medicationName: '阿斯匹靈腸溶膜衣錠 (Bokey 100mg)',
      slotKey: `${today}_0800_after_breakfast`,
      slotName: '早餐後',
      scheduledTime: `${today}T08:00:00`,
      actualTime: `${today}T08:12:00`,
      status: 'taken',
      timestamp: Date.now() - 4 * 60 * 60 * 1000,
    },
  ];
}

/**
 * 預設範例日常瑣事
 */
export function getDefaultTodos(): TodoItem[] {
  const today = toDateInputValue();
  return [
    {
      id: 'todo-sample-1',
      title: '至健保特約藥局領取第二個月慢性病連續處方箋',
      category: '採買',
      dueDate: today,
      dueTime: '17:00',
      priority: 'high',
      isCompleted: false,
      recurrence: 'monthly',
      notes: '記得帶健保卡、慢箋單張、之前藥袋。阿斯匹靈只剩 5 天份！',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'todo-sample-2',
      title: '記錄並整理本週早晚血壓與血糖數值（就診供醫師參考）',
      category: '家務',
      dueDate: today,
      dueTime: '13:00',
      priority: 'high',
      isCompleted: false,
      recurrence: 'weekly',
      notes: '收錄至血壓小本子。',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'todo-sample-3',
      title: '繳交本月水電瓦斯與健保自付保費',
      category: '繳費',
      dueDate: '2026-10-05',
      dueTime: '20:00',
      priority: 'medium',
      isCompleted: false,
      recurrence: 'monthly',
      notes: '超商條碼繳費或行動支付扣款。',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function loadAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (!raw) {
      const def = getDefaultAppointments();
      saveAppointments(def);
      return def;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load appointments:', err);
    return getDefaultAppointments();
  }
}

export function saveAppointments(items: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save appointments:', err);
  }
}

export function loadMedications(): Medication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
    if (!raw) {
      const def = getDefaultMedications();
      saveMedications(def);
      return def;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load medications:', err);
    return getDefaultMedications();
  }
}

export function saveMedications(items: Medication[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save medications:', err);
  }
}

export function loadDoseLogs(): DoseLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOSE_LOGS);
    if (!raw) {
      const def = getDefaultDoseLogs();
      saveDoseLogs(def);
      return def;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load dose logs:', err);
    return getDefaultDoseLogs();
  }
}

export function saveDoseLogs(items: DoseLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save dose logs:', err);
  }
}

export function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODOS);
    if (!raw) {
      const def = getDefaultTodos();
      saveTodos(def);
      return def;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load todos:', err);
    return getDefaultTodos();
  }
}

export function saveTodos(items: TodoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save todos:', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * 匯出完整 JSON 備份
 */
export function exportBackupJSON(): string {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appointments: loadAppointments(),
    medications: loadMedications(),
    doseLogs: loadDoseLogs(),
    todos: loadTodos(),
    settings: loadSettings(),
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * 驗證並匯入 JSON 備份
 * 格式錯誤時擲出錯誤訊息，絕不覆蓋原資料
 */
export function importBackupJSON(jsonString: string): {
  success: boolean;
  message: string;
  backupData?: BackupData;
} {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      throw new Error('匯入的檔案不是有效的 JSON 物件格式。');
    }

    if (!Array.isArray(data.appointments)) {
      throw new Error('資料結構不合規：缺少就診資料 (appointments) 陣列。');
    }

    if (!Array.isArray(data.medications)) {
      throw new Error('資料結構不合規：缺少藥品資料 (medications) 陣列。');
    }

    if (!Array.isArray(data.doseLogs)) {
      throw new Error('資料結構不合規：缺少服藥紀錄 (doseLogs) 陣列。');
    }

    if (!Array.isArray(data.todos)) {
      throw new Error('資料結構不合規：缺少日常瑣事 (todos) 陣列。');
    }

    // Validate essential properties of items
    for (const app of data.appointments) {
      if (!app.id || !app.hospital || !app.dateTime) {
        throw new Error('就診資料存在無效項目（需包含 id、醫院及就診時間）。');
      }
    }

    for (const med of data.medications) {
      if (!med.id || !med.name) {
        throw new Error('藥品資料存在無效項目（需包含 id 及藥品名稱）。');
      }
    }

    // Settings fallback
    const settings = data.settings && typeof data.settings === 'object'
      ? { ...DEFAULT_SETTINGS, ...data.settings }
      : DEFAULT_SETTINGS;

    const validatedBackup: BackupData = {
      version: data.version || 1,
      exportedAt: data.exportedAt || new Date().toISOString(),
      appointments: data.appointments,
      medications: data.medications,
      doseLogs: data.doseLogs,
      todos: data.todos,
      settings,
    };

    // Save to localStorage safely
    saveAppointments(validatedBackup.appointments);
    saveMedications(validatedBackup.medications);
    saveDoseLogs(validatedBackup.doseLogs);
    saveTodos(validatedBackup.todos);
    saveSettings(validatedBackup.settings);

    return {
      success: true,
      message: `成功還原備份！共匯入 ${validatedBackup.appointments.length} 筆就診、${validatedBackup.medications.length} 種藥品、${validatedBackup.doseLogs.length} 筆服藥紀錄、${validatedBackup.todos.length} 項瑣事。`,
      backupData: validatedBackup,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `備份檔案格式錯誤，未變更任何資料：${error.message || '未知錯誤'}`,
    };
  }
}
