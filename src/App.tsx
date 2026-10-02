import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Appointment,
  Medication,
  DoseLog,
  TodoItem,
  AppSettings,
} from './types';
import {
  loadAppointments,
  saveAppointments,
  loadMedications,
  saveMedications,
  loadDoseLogs,
  saveDoseLogs,
  loadTodos,
  saveTodos,
  loadSettings,
  saveSettings,
  getDefaultAppointments,
  getDefaultMedications,
  getDefaultDoseLogs,
  getDefaultTodos,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { getNowTaipei, isSameDay, diffMinutes } from './utils/dateUtils';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { HomeView } from './components/home/HomeView';
import { AppointmentList } from './components/appointments/AppointmentList';
import { MedicationList } from './components/medications/MedicationList';
import { TodoList } from './components/todos/TodoList';
import { SettingsView } from './components/settings/SettingsView';
import { SeniorView } from './components/senior/SeniorView';
import { Toast } from './components/common/Toast';
import { PhoneDialModal } from './components/common/PhoneDialModal';
import { HoldToConfirmModal } from './components/medications/HoldToConfirmModal';
import { PRNModal } from './components/medications/PRNModal';
import { ImageRecognizeModal } from './components/common/ImageRecognizeModal';
import { AlarmModal, AlarmEvent } from './components/common/AlarmModal';
import { DailySlot, checkDuplicateDose, getDailySlots } from './utils/medicationLogic';
import { calculateDepartureTime } from './utils/appointmentLogic';
import { THEME_CONFIGS } from './utils/theme';
import { Smartphone } from 'lucide-react';

export default function App() {
  const [now, setNow] = useState<Date>(getNowTaipei());

  // Core Data
  const [appointments, setAppointments] = useState<Appointment[]>(loadAppointments);
  const [medications, setMedications] = useState<Medication[]>(loadMedications);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>(loadDoseLogs);
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Initialize currentTab from URL hash or defaultLandingPage
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'appointments', 'medications', 'todos', 'settings'].includes(hash)) {
        return hash as TabType;
      }
    }
    const saved = loadSettings();
    return (saved.defaultLandingPage as TabType) || 'home';
  });

  const handleNavigateTab = useCallback((tab: TabType) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Listen to browser Back / Forward buttons (URL hashchange)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'appointments', 'medications', 'todos', 'settings'].includes(hash)) {
        setCurrentTab(hash as TabType);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isPRNModalOpen, setIsPRNModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanDefaultHint, setScanDefaultHint] = useState<'appointment' | 'medication' | 'todo' | undefined>(undefined);
  const [appointmentDraft, setAppointmentDraft] = useState<Partial<Appointment> | null>(null);

  // Active Alarm State (REQUEST 3)
  const [activeAlarm, setActiveAlarm] = useState<AlarmEvent | null>(null);
  const firedAlarmsRef = useRef<Set<string>>(new Set());

  const handleOpenScanModal = (hint?: 'appointment' | 'medication' | 'todo') => {
    setScanDefaultHint(hint);
    setIsScanModalOpen(true);
  };

  // Hold To Confirm Modal state (Anti-duplicate override)
  const [holdModalData, setHoldModalData] = useState<{
    isOpen: boolean;
    med?: Medication;
    slotKey: string;
    warningMessage: string;
    lastTakenTimeText?: string;
  }>({
    isOpen: false,
    slotKey: '',
    warningMessage: '',
  });

  // Keep clock fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(getNowTaipei());
    }, 10000); // update every 10 seconds for calculations
    return () => clearInterval(timer);
  }, []);

  // Alarm Runner Effect (REQUEST 3)
  useEffect(() => {
    if (!settings.alarm.enabled) return;

    const checkAlarms = () => {
      const current = getNowTaipei();
      const todayStr = current.toISOString().split('T')[0];

      // 1. Check Appointment Departure
      if (settings.alarm.notifyDeparture) {
        const upcomingToday = appointments.filter(
          (a) => a.status === 'upcoming' && a.dateTime.startsWith(todayStr)
        );

        for (const app of upcomingToday) {
          const dep = calculateDepartureTime(
            app.dateTime,
            app.transportMode,
            app.drivingTime,
            app.parkingSearchTime,
            app.walkFromParkingTime,
            app.checkInEarlyTime,
            app.safetyBufferTime,
            current
          );

          // If departure time is due right now (between 0 and -2 minutes)
          if (dep.minutesUntilDeparture <= 1 && dep.minutesUntilDeparture >= -3) {
            const alarmKey = `dep_${app.id}_${dep.departureTimeStr}`;
            if (!firedAlarmsRef.current.has(alarmKey)) {
              firedAlarmsRef.current.add(alarmKey);
              setActiveAlarm({
                id: alarmKey,
                type: 'departure',
                title: '🏥 就診出發時間到了！',
                subtitle: `${app.hospital}（${app.department || ''}），最晚出發時間為 ${dep.departureTimeStr}！`,
                timeStr: dep.departureTimeStr,
                payload: app,
              });
              return;
            }
          }
        }
      }

      // 2. Check Medication Slots
      if (settings.alarm.notifyMedication) {
        const slots = getDailySlots(current, medications, doseLogs, settings, current);
        for (const slot of slots) {
          if (!slot.isAllTaken) {
            const slotDate = new Date(slot.fullDateTimeStr);
            const diff = diffMinutes(slotDate, current); // scheduled - current
            // If due right now (diff between -2 and 1)
            if (diff <= 1 && diff >= -2) {
              const alarmKey = `med_${slot.slotKey}`;
              if (!firedAlarmsRef.current.has(alarmKey)) {
                firedAlarmsRef.current.add(alarmKey);
                const medNames = slot.medications
                  .filter((m) => m.status !== 'taken')
                  .map((m) => m.med.name)
                  .join('、');
                setActiveAlarm({
                  id: alarmKey,
                  type: 'medication',
                  title: '⏰ 服藥時間到了！',
                  subtitle: `現在是【${slot.title} (${slot.timeStr})】，請服用：${medNames}`,
                  timeStr: slot.timeStr,
                  payload: slot,
                });
                return;
              }
            }
          }
        }
      }
    };

    const interval = setInterval(checkAlarms, 6000);
    checkAlarms();
    return () => clearInterval(interval);
  }, [settings.alarm, appointments, medications, doseLogs]);

  // Alarm Actions
  const handleConfirmAlarm = (event: AlarmEvent) => {
    setActiveAlarm(null);
    if (event.type === 'medication' && event.payload) {
      handleTakeBatchSlot(event.payload as DailySlot);
      showToast(`✓ 已記錄【${event.timeStr}】服藥打卡！`);
    } else if (event.type === 'departure' && event.payload) {
      setAppointmentDraft(event.payload);
      handleNavigateTab('appointments');
      showToast(`✓ 請確認攜帶物品與出發路線！`);
    }
  };

  const handleSnoozeAlarm = (event: AlarmEvent, minutes: number = 10) => {
    setActiveAlarm(null);
    showToast(`🔔 鬧鈴已延遲 ${minutes} 分鐘後再次提醒！`);
    setTimeout(() => {
      // Re-trigger alarm after snooze
      setActiveAlarm({
        ...event,
        title: `🔔 [延遲提醒] ${event.title}`,
      });
    }, minutes * 60 * 1000);
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // Update Settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Reload all from storage (used after JSON import)
  const handleReloadAll = () => {
    setAppointments(loadAppointments());
    setMedications(loadMedications());
    setDoseLogs(loadDoseLogs());
    setTodos(loadTodos());
    setSettings(loadSettings());
  };

  // Reset to default sample data
  const handleResetToDefault = () => {
    const defApps = getDefaultAppointments();
    const defMeds = getDefaultMedications();
    const defLogs = getDefaultDoseLogs();
    const defTodos = getDefaultTodos();
    saveAppointments(defApps);
    saveMedications(defMeds);
    saveDoseLogs(defLogs);
    saveTodos(defTodos);
    saveSettings(DEFAULT_SETTINGS);
    setAppointments(defApps);
    setMedications(defMeds);
    setDoseLogs(defLogs);
    setTodos(defTodos);
    setSettings(DEFAULT_SETTINGS);
  };

  // --- APPOINTMENTS HANDLERS ---
  const handleSaveAppointment = (app: Appointment) => {
    const existingIndex = appointments.findIndex((a) => a.id === app.id);
    let updated: Appointment[];
    if (existingIndex >= 0) {
      updated = [...appointments];
      updated[existingIndex] = app;
    } else {
      updated = [app, ...appointments];
    }
    setAppointments(updated);
    saveAppointments(updated);
  };

  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter((a) => a.id !== id);
    setAppointments(updated);
    saveAppointments(updated);
    showToast('已刪除該就診行程。');
  };

  const handleToggleAppointmentItem = (appId: string, item: string) => {
    const updated = appointments.map((a) => {
      if (a.id !== appId) return a;
      const currentChecked = a.checkedItems || [];
      const newChecked = currentChecked.includes(item)
        ? currentChecked.filter((i) => i !== item)
        : [...currentChecked, item];
      return { ...a, checkedItems: newChecked };
    });
    setAppointments(updated);
    saveAppointments(updated);
  };

  const handleCompleteAppointment = (app: Appointment, nextVisitDate?: string) => {
    const updated = appointments.map((a) =>
      a.id === app.id
        ? {
            ...a,
            status: 'completed' as const,
            nextVisitDate: nextVisitDate || a.nextVisitDate,
          }
        : a
    );
    setAppointments(updated);
    saveAppointments(updated);

    // If nextVisitDate is filled, auto create a follow-up draft
    if (nextVisitDate) {
      const followUpDraft: Partial<Appointment> = {
        hospital: app.hospital,
        department: app.department,
        doctor: app.doctor,
        dateTime: `${nextVisitDate}T${app.dateTime.split('T')[1] || '14:30'}`,
        address: app.address,
        transportMode: app.transportMode,
        drivingTime: app.drivingTime,
        parkingSearchTime: app.parkingSearchTime,
        walkFromParkingTime: app.walkFromParkingTime,
        checkInEarlyTime: app.checkInEarlyTime,
        safetyBufferTime: app.safetyBufferTime,
        itemsToBring: app.itemsToBring,
        notes: `由 ${app.dateTime.split('T')[0]} 門診預約之複診`,
      };
      setAppointmentDraft(followUpDraft);
      handleNavigateTab('appointments');
    }
  };

  const handleCreateAppointmentDraft = (draft: Partial<Appointment>) => {
    setAppointmentDraft(draft);
    handleNavigateTab('appointments');
  };

  // --- MEDICATIONS HANDLERS ---
  const handleSaveMedication = (med: Medication) => {
    const existingIndex = medications.findIndex((m) => m.id === med.id);
    let updated: Medication[];
    if (existingIndex >= 0) {
      updated = [...medications];
      updated[existingIndex] = med;
    } else {
      updated = [med, ...medications];
    }
    setMedications(updated);
    saveMedications(updated);
    showToast('✓ 藥品資料已更新！');
  };

  const handleDeleteMedication = (id: string) => {
    const updated = medications.filter((m) => m.id !== id);
    setMedications(updated);
    saveMedications(updated);
    showToast('已刪除該藥品。');
  };

  const handleToggleActiveMedication = (id: string) => {
    const updated = medications.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    setMedications(updated);
    saveMedications(updated);
    showToast('已更新藥品啟用狀態。');
  };

  // Take dose (Single or batch)
  const handleTakeDose = (
    medId: string,
    slotKey: string,
    slotName: string,
    scheduledTime: string,
    isForced: boolean = false,
    forcedReason?: string
  ) => {
    const med = medications.find((m) => m.id === medId);
    if (!med) return;

    // Check duplicate or interval unless isForced
    if (!isForced) {
      const dupCheck = checkDuplicateDose(med, slotKey, doseLogs, now);
      if (dupCheck.isDuplicate) {
        setHoldModalData({
          isOpen: true,
          med,
          slotKey,
          warningMessage: dupCheck.reason,
          lastTakenTimeText: dupCheck.lastTakenLog?.actualTime
            ? `上次記錄時間：${dupCheck.lastTakenLog.actualTime}`
            : undefined,
        });
        return;
      }
    }

    const newLog: DoseLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      medicationId: med.id,
      medicationName: med.name,
      slotKey,
      slotName,
      scheduledTime,
      actualTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'taken',
      timestamp: Date.now(),
      isForced,
      forcedReason,
    };

    const updatedLogs = [newLog, ...doseLogs];
    setDoseLogs(updatedLogs);
    saveDoseLogs(updatedLogs);

    // Deduct stock by 1
    const updatedMeds = medications.map((m) => {
      if (m.id === med.id) {
        return { ...m, totalStock: Math.max(0, (m.totalStock || 0) - 1) };
      }
      return m;
    });
    setMedications(updatedMeds);
    saveMedications(updatedMeds);

    showToast(`✓ 已記錄【${med.name}】服藥打卡！`);
  };

  // Snooze dose
  const handleSnoozeDose = (medId: string, slotKey: string, minutes: number) => {
    const med = medications.find((m) => m.id === medId);
    if (!med) return;

    const snoozedUntil = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
    const existingLog = doseLogs.find((l) => l.medicationId === medId && l.slotKey === slotKey);

    let updatedLogs: DoseLog[];
    if (existingLog) {
      updatedLogs = doseLogs.map((l) =>
        l.id === existingLog.id ? { ...l, snoozedUntil } : l
      );
    } else {
      const newLog: DoseLog = {
        id: `snooze-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        medicationId: med.id,
        medicationName: med.name,
        slotKey,
        slotName: '延遲提醒',
        scheduledTime: now.toISOString(),
        status: 'missed',
        timestamp: Date.now(),
        snoozedUntil,
      };
      updatedLogs = [newLog, ...doseLogs];
    }

    setDoseLogs(updatedLogs);
    saveDoseLogs(updatedLogs);
    showToast(`🔔 已延遲 ${minutes} 分鐘後再次提醒！`);
  };

  // Skip dose
  const handleSkipDose = (medId: string, slotKey: string, reason?: string) => {
    const med = medications.find((m) => m.id === medId);
    if (!med) return;

    const newLog: DoseLog = {
      id: `skip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      medicationId: med.id,
      medicationName: med.name,
      slotKey,
      slotName: '略過服用',
      scheduledTime: now.toISOString(),
      status: 'skipped',
      timestamp: Date.now(),
      notes: reason,
    };

    const updatedLogs = [newLog, ...doseLogs];
    setDoseLogs(updatedLogs);
    saveDoseLogs(updatedLogs);
    showToast(`⚪ 已標記【${med.name}】跳過此次服用。`);
  };

  // Batch take slot helper
  const handleTakeBatchSlot = (slot: DailySlot, specificMedId?: string) => {
    const targetMeds = specificMedId
      ? slot.medications.filter((m) => m.med.id === specificMedId)
      : slot.medications;

    for (const item of targetMeds) {
      if (item.status === 'taken') {
        // already taken
        setHoldModalData({
          isOpen: true,
          med: item.med,
          slotKey: slot.slotKey,
          warningMessage: `你在先前已吃過此藥品，請勿重複服用！如需強制更正紀錄，請長按 2 秒確認。`,
          lastTakenTimeText: item.log?.actualTime,
        });
        return;
      }
      handleTakeDose(item.med.id, slot.slotKey, slot.title, slot.fullDateTimeStr);
    }
  };

  // --- TODOS HANDLERS ---
  const handleSaveTodo = (todo: TodoItem) => {
    const existingIndex = todos.findIndex((t) => t.id === todo.id);
    let updated: TodoItem[];
    if (existingIndex >= 0) {
      updated = [...todos];
      updated[existingIndex] = todo;
    } else {
      updated = [todo, ...todos];
    }
    setTodos(updated);
    saveTodos(updated);
  };

  const handleDeleteTodo = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    saveTodos(updated);
    showToast('已刪除該日常瑣事。');
  };

  const handleToggleTodo = (id: string) => {
    const updated = todos.map((t) => {
      if (t.id !== id) return t;
      const isNowCompleted = !t.isCompleted;
      return {
        ...t,
        isCompleted: isNowCompleted,
        completedAt: isNowCompleted ? new Date().toISOString() : undefined,
      };
    });
    setTodos(updated);
    saveTodos(updated);
  };

  // Count active badges for navigation
  const upcomingAppointmentToday = appointments.some(
    (a) => a.status === 'upcoming' && isSameDay(a.dateTime, now)
  );

  const pendingDoseCount = medications.filter((m) => m.isActive).length;
  const pendingTodosCount = todos.filter((t) => !t.isCompleted && isSameDay(t.dueDate, now)).length;

  // Font size class: when in mobile view (forceMobileView), maximize font size to the fullest!
  const getFontSizeClass = () => {
    if (settings.forceMobileView) {
      return 'text-lg sm:text-xl font-medium leading-relaxed tracking-tight';
    }
    switch (settings.fontSize) {
      case 'large':
        return 'text-[17px]';
      case 'extraLarge':
        return 'text-[19px] leading-relaxed';
      default:
        return 'text-[15px]';
    }
  };

  const isMobileSim = settings.forceMobileView;

  const contentJsx = (
    <div className={`flex flex-col min-h-full flex-1 ${getFontSizeClass()}`}>
      {/* Sticky App Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
        onOpenScanModal={() => handleOpenScanModal()}
        onShowToast={showToast}
      />

      {/* Global Navigation (Desktop Top Sticky Bar / Mobile Bottom Fixed Bar) */}
      <Navigation
        currentTab={currentTab}
        onChangeTab={handleNavigateTab}
        upcomingAppointmentToday={upcomingAppointmentToday}
        pendingDoseCount={pendingDoseCount}
        pendingTodosCount={pendingTodosCount}
        forceMobileView={isMobileSim}
      />

      {/* Main Container - Perfect fit for mobile with full-width optimization */}
      <main className={`flex-1 w-full mx-auto px-2.5 sm:px-4 py-3 sm:py-5 pb-24 ${isMobileSim ? 'pb-24 max-w-[480px] w-full' : 'md:pb-12 max-w-4xl'}`}>
        {currentTab === 'home' && (
          settings.isSeniorMode ? (
            <SeniorView
              now={now}
              appointments={appointments}
              medications={medications}
              doseLogs={doseLogs}
              todos={todos}
              settings={settings}
              onExitSeniorMode={() => {
                handleUpdateSettings({
                  ...settings,
                  isSeniorMode: false,
                  fontSize: 'standard',
                });
                showToast('✓ 已切換回一般完整版模式！');
              }}
              onTakeSlot={handleTakeBatchSlot}
              onOpenPRNModal={() => setIsPRNModalOpen(true)}
              onOpenScanModal={handleOpenScanModal}
              onOpenPhoneModal={() => setIsPhoneModalOpen(true)}
              onToggleTodo={handleToggleTodo}
              onShowToast={showToast}
            />
          ) : (
            <HomeView
              now={now}
              appointments={appointments}
              medications={medications}
              doseLogs={doseLogs}
              todos={todos}
              settings={settings}
              onNavigateToTab={handleNavigateTab}
              onSelectAppointment={(app) => {
                setAppointmentDraft(app);
                handleNavigateTab('appointments');
              }}
              onCreateAppointmentDraft={handleCreateAppointmentDraft}
              onOpenPRNModal={() => setIsPRNModalOpen(true)}
              onTakeSlot={handleTakeBatchSlot}
              onSnoozeSlot={(slot, mins) => {
                for (const m of slot.medications) {
                  if (m.status !== 'taken') handleSnoozeDose(m.med.id, slot.slotKey, mins);
                }
              }}
              onSkipSlot={(slot) => {
                for (const m of slot.medications) {
                  if (m.status !== 'taken') handleSkipDose(m.med.id, slot.slotKey);
                }
              }}
              onOpenHoldConfirm={(med, slotKey, reasonMsg, lastTakenStr) => {
                setHoldModalData({
                  isOpen: true,
                  med,
                  slotKey,
                  warningMessage: reasonMsg,
                  lastTakenTimeText: lastTakenStr,
                });
              }}
              onToggleTodo={handleToggleTodo}
              onToggleAppointmentItem={handleToggleAppointmentItem}
              onCompleteAppointment={handleCompleteAppointment}
              onShowToast={showToast}
              onOpenScanModal={handleOpenScanModal}
            />
          )
        )}

        {currentTab === 'appointments' && (
          <AppointmentList
            now={now}
            appointments={appointments}
            activeMedications={medications.filter((m) => m.isActive)}
            settings={settings}
            onSaveAppointment={handleSaveAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onToggleItemChecked={handleToggleAppointmentItem}
            onCompleteAppointment={handleCompleteAppointment}
            onShowToast={showToast}
            prefilledDraft={appointmentDraft}
            onClearDraft={() => setAppointmentDraft(null)}
            onOpenScanModal={() => handleOpenScanModal('appointment')}
          />
        )}

        {currentTab === 'medications' && (
          <MedicationList
            now={now}
            medications={medications}
            doseLogs={doseLogs}
            settings={settings}
            onSaveMedication={handleSaveMedication}
            onDeleteMedication={handleDeleteMedication}
            onToggleActive={handleToggleActiveMedication}
            onTakeDose={handleTakeDose}
            onSnoozeDose={handleSnoozeDose}
            onSkipDose={handleSkipDose}
            onCreateAppointmentDraft={handleCreateAppointmentDraft}
            onShowToast={showToast}
            onOpenScanModal={() => handleOpenScanModal('medication')}
          />
        )}

        {currentTab === 'todos' && (
          <TodoList
            now={now}
            todos={todos}
            onSaveTodo={handleSaveTodo}
            onDeleteTodo={handleDeleteTodo}
            onToggleTodo={handleToggleTodo}
            onShowToast={showToast}
            onOpenScanModal={() => handleOpenScanModal('todo')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onReloadAllData={handleReloadAll}
            onResetToDefaultData={handleResetToDefault}
            onShowToast={showToast}
          />
        )}
      </main>
    </div>
  );

  return (
    <div
      data-theme={settings.themeColor}
      data-mobile-view={isMobileSim ? 'true' : 'false'}
      className={`min-h-screen ${
        isMobileSim
          ? 'bg-slate-900/90 py-0 sm:py-6 px-0 sm:px-4 flex flex-col items-center justify-start transition-colors duration-300'
          : 'bg-slate-50 text-slate-900 flex flex-col font-sans'
      }`}
    >
      {isMobileSim ? (
        <>
          {/* Top Banner on Desktop previewing mobile mode */}
          <div className="hidden sm:flex items-center justify-between w-full max-w-[480px] mb-2 px-3 text-slate-300 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-teal-400">
              <Smartphone className="w-4 h-4" />
              <span>手機版閱讀模式（版面完美適配 · 字體最大化）</span>
            </span>
            <button
              type="button"
              onClick={() => {
                handleUpdateSettings({ ...settings, forceMobileView: false });
                showToast('✓ 已恢復寬版自適應模式！');
              }}
              className="text-xs text-slate-300 hover:text-white underline font-semibold cursor-pointer"
            >
              還原全寬模式
            </button>
          </div>

          {/* Centered Phone Shell - Fits mobile screen perfectly */}
          <div className="w-full max-w-[480px] bg-slate-50 min-h-screen sm:min-h-[860px] sm:max-h-[96vh] sm:rounded-3xl shadow-2xl sm:border-[6px] sm:border-slate-800 flex flex-col overflow-y-auto overflow-x-hidden relative">
            {contentJsx}
          </div>
        </>
      ) : (
        contentJsx
      )}

      {/* Quick Phone Call Dialog */}
      <PhoneDialModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        settings={settings}
      />

      {/* AI Smart Image Recognition Modal */}
      <ImageRecognizeModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        defaultHint={scanDefaultHint}
        settings={settings}
        activeMedications={medications.filter((m) => m.isActive)}
        onAddAppointment={(app) => {
          handleSaveAppointment(app);
          handleNavigateTab('appointments');
        }}
        onAddMedication={(med) => {
          handleSaveMedication(med);
          handleNavigateTab('medications');
        }}
        onAddTodo={(todo) => {
          handleSaveTodo(todo);
          handleNavigateTab('todos');
        }}
        onShowToast={showToast}
      />

      {/* Active Alarm Modal (REQUEST 3) */}
      <AlarmModal
        alarmEvent={activeAlarm}
        ringtone={settings.alarm.ringtone}
        volume={settings.alarm.volume}
        vibration={settings.alarm.vibration}
        onConfirmAction={handleConfirmAlarm}
        onSnooze={handleSnoozeAlarm}
        onDismiss={() => setActiveAlarm(null)}
      />

      {/* PRN Check-in Modal */}
      <PRNModal
        isOpen={isPRNModalOpen}
        onClose={() => setIsPRNModalOpen(false)}
        medications={medications}
        doseLogs={doseLogs}
        now={now}
        onConfirmPRN={(med, notes) => {
          handleTakeDose(
            med.id,
            `prn_${Date.now()}`,
            '需要時服用 (PRN)',
            now.toISOString(),
            false,
            notes
          );
        }}
      />

      {/* Long press 2-sec confirmation override */}
      <HoldToConfirmModal
        isOpen={holdModalData.isOpen}
        onClose={() => setHoldModalData({ isOpen: false, slotKey: '', warningMessage: '' })}
        onConfirm={(reason) => {
          if (holdModalData.med) {
            handleTakeDose(
              holdModalData.med.id,
              holdModalData.slotKey,
              '強制更正紀錄',
              now.toISOString(),
              true,
              reason
            );
            setHoldModalData({ isOpen: false, slotKey: '', warningMessage: '' });
          }
        }}
        warningMessage={holdModalData.warningMessage}
        medicationName={holdModalData.med?.name || ''}
        lastTakenTimeText={holdModalData.lastTakenTimeText}
      />

      {/* Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
