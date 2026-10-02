import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Pill,
  ChevronRight,
  Package,
  ArrowRight,
} from 'lucide-react';
import {
  Appointment,
  Medication,
  DoseLog,
  TodoItem,
  AppSettings,
} from '../types';
import { calculateDepartureTime } from '../utils/appointmentLogic';
import {
  getDailySlots,
  calculateRemainingDays,
} from '../utils/medicationLogic';
import { isSameDay, formatTime24 } from '../utils/dateUtils';

interface HeroActionProps {
  now: Date;
  appointments: Appointment[];
  medications: Medication[];
  doseLogs: DoseLog[];
  todos: TodoItem[];
  settings: AppSettings;
  onNavigateToTab: (tab: 'home' | 'appointments' | 'medications' | 'todos' | 'settings') => void;
  onSelectAppointment?: (app: Appointment) => void;
  onCreateAppointmentDraft?: (draft: Partial<Appointment>) => void;
}

export function HeroAction({
  now,
  appointments,
  medications,
  doseLogs,
  todos,
  settings,
  onNavigateToTab,
  onSelectAppointment,
  onCreateAppointmentDraft,
}: HeroActionProps) {
  // 1. Check today's active appointments
  const upcomingAppointments = appointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const todayAppointment = upcomingAppointments.find((a) => isSameDay(a.dateTime, now));

  let appointmentDepInfo = null;
  if (todayAppointment) {
    appointmentDepInfo = calculateDepartureTime(
      todayAppointment.dateTime,
      todayAppointment.transportMode,
      todayAppointment.drivingTime,
      todayAppointment.parkingSearchTime,
      todayAppointment.walkFromParkingTime,
      todayAppointment.checkInEarlyTime,
      todayAppointment.safetyBufferTime,
      now
    );
  }

  // 2. Check today's medication slots
  const dailySlots = getDailySlots(now, medications, doseLogs, settings, now);

  // Find most urgent slot
  const pendingSlots = dailySlots.filter((s) => !s.isAllTaken);
  // Sort pending by earliest
  const mostUrgentSlot = pendingSlots[0];

  // 3. Check low stock medications
  const lowStockMeds = medications.filter(
    (m) => m.isActive && calculateRemainingDays(m) <= settings.lowStockThresholdDays
  );

  // 4. Check today's urgent todos
  const pendingUrgentTodo = todos.find(
    (t) => !t.isCompleted && t.priority === 'high' && isSameDay(t.dueDate, now)
  );

  // DETERMINE THE SINGLE TOP PRIORITY ITEM
  // Case A: Departure is OVERDUE for an appointment today (and appointment hasn't ended)
  if (
    todayAppointment &&
    appointmentDepInfo &&
    appointmentDepInfo.isOverdue &&
    appointmentDepInfo.minutesUntilDeparture > -240 // within 4 hours
  ) {
    const overdueMins = Math.abs(appointmentDepInfo.minutesUntilDeparture);
    return (
      <section
        aria-label="現在最該做的一件事"
        className="bg-red-500 text-white rounded-2xl p-5 shadow-lg shadow-red-500/20 border-2 border-red-600 mb-6 transition-all"
      >
        <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-1 rounded-md w-fit mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-200 animate-bounce" />
          <span>現在最該做的一件事 · 緊急就診出發警示</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              ⚠️ 來不及了！請立刻出發或致電改約
            </h2>
            <p className="text-red-100 text-sm font-medium">
              目標：{todayAppointment.hospital} · {todayAppointment.department}（{todayAppointment.doctor}）
            </p>
            <p className="text-xs text-white/90 font-mono">
              原定最晚出發時間：{appointmentDepInfo.departureTimeStr}（已逾期 {overdueMins} 分鐘）
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onNavigateToTab('appointments');
              if (onSelectAppointment) onSelectAppointment(todayAppointment);
            }}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-white text-red-700 hover:bg-red-50 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <span>立即查看就診時間軸與路線</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  // Case B: Appointment departure is SOON (within 45 mins)
  if (
    todayAppointment &&
    appointmentDepInfo &&
    !appointmentDepInfo.isOverdue &&
    appointmentDepInfo.minutesUntilDeparture <= 45
  ) {
    return (
      <section
        aria-label="現在最該做的一件事"
        className="bg-amber-500 text-slate-950 rounded-2xl p-5 shadow-lg shadow-amber-500/20 border-2 border-amber-600 mb-6"
      >
        <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase bg-black/10 px-2.5 py-1 rounded-md w-fit mb-3 text-slate-900">
          <Clock className="w-4 h-4" />
          <span>現在最該做的一件事 · 準備出門</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black leading-tight text-slate-950">
              🚨 距離最晚出發還有 {appointmentDepInfo.minutesUntilDeparture} 分鐘！
            </h2>
            <p className="text-sm font-semibold text-slate-900">
              {todayAppointment.hospital} · {todayAppointment.department}（預計 {appointmentDepInfo.departureTimeStr} 出發）
            </p>
            <p className="text-xs text-slate-800">
              請備妥健保卡、身分證、近期藥袋與用藥清單，檢查隨身物品準備啟程。
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onNavigateToTab('appointments');
              if (onSelectAppointment) onSelectAppointment(todayAppointment);
            }}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-slate-950 text-white hover:bg-slate-900 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <span>確認攜帶物品與出發</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  // Case C: Medication is Missed or Due Now
  if (mostUrgentSlot) {
    const isMissed = mostUrgentSlot.hasMissed || mostUrgentSlot.isOverdue30;
    const isOverdue15 = mostUrgentSlot.isOverdue15;

    const unTakenMeds = mostUrgentSlot.medications.filter((m) => m.status !== 'taken');
    const medNamesStr = unTakenMeds.map((m) => `${m.med.name} (${m.med.dosage})`).join('、');

    return (
      <section
        aria-label="現在最該做的一件事"
        className={`rounded-2xl p-5 shadow-lg border-2 mb-6 ${
          isMissed
            ? 'bg-amber-600 text-white border-amber-700 shadow-amber-600/20'
            : isOverdue15
            ? 'bg-teal-700 text-white border-teal-800 shadow-teal-700/20'
            : 'bg-teal-600 text-white border-teal-700 shadow-teal-600/20'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-1 rounded-md w-fit mb-3">
          <Pill className="w-4 h-4" />
          <span>現在最該做的一件事 · 服藥提醒</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
              {isMissed
                ? `⚠️【服藥提醒】${mostUrgentSlot.title} 已逾時，請盡速確認用藥`
                : `⏰【服藥時間到了】現在是 ${mostUrgentSlot.title} (${mostUrgentSlot.timeStr})`}
            </h2>
            <p className="text-sm font-medium text-teal-100">
              待服藥物：<span className="font-bold text-white">{medNamesStr}</span>
            </p>
            <p className="text-xs text-white/90">
              {isMissed
                ? '若已超過太久，請依藥袋指示或諮詢醫師藥師，切勿自行加倍服用！'
                : '請依藥袋劑量配溫開水服用，服後記得打卡登記防呆。'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('medications')}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-white text-teal-900 hover:bg-teal-50 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <span>前往服藥打卡</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  // Case D: Today's Appointment Later Today
  if (todayAppointment && appointmentDepInfo) {
    return (
      <section
        aria-label="現在最該做的一件事"
        className="bg-indigo-700 text-white rounded-2xl p-5 shadow-lg shadow-indigo-700/20 border-2 border-indigo-800 mb-6"
      >
        <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-1 rounded-md w-fit mb-3">
          <Calendar className="w-4 h-4" />
          <span>今日重點行程 · 就診提醒</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black leading-tight text-white">
              🏥 今日看診：{todayAppointment.hospital}
            </h2>
            <p className="text-sm font-medium text-indigo-100">
              {todayAppointment.department} · {todayAppointment.doctor}（診號 {todayAppointment.number}）
            </p>
            <p className="text-xs text-indigo-200">
              看診時間：{formatTime24(todayAppointment.dateTime)} · 最晚出發時間：
              <span className="font-bold text-white ml-1">{appointmentDepInfo.departureTimeStr}</span>
              （距離出發約 {Math.floor(appointmentDepInfo.minutesUntilDeparture / 60)} 小時 {appointmentDepInfo.minutesUntilDeparture % 60} 分）
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onNavigateToTab('appointments');
              if (onSelectAppointment) onSelectAppointment(todayAppointment);
            }}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <span>查看出發時間軸與檢查清單</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  // Case E: Low stock medication alert
  if (lowStockMeds.length > 0) {
    const med = lowStockMeds[0];
    const daysLeft = calculateRemainingDays(med);
    return (
      <section
        aria-label="現在最該做的一件事"
        className="bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-2xl p-5 shadow-md mb-6"
      >
        <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase bg-amber-200/80 px-2.5 py-1 rounded-md w-fit mb-3 text-amber-900">
          <Package className="w-4 h-4 text-amber-700" />
          <span>藥品存量偏低提醒</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-amber-950">
              💊 提醒：{med.name} 僅剩約 {daysLeft} 天份
            </h2>
            <p className="text-xs text-amber-800">
              庫存剩餘 {med.totalStock} 顆/包，低於警戒值（{settings.lowStockThresholdDays} 天）。請儘速至診所或健保藥局領取慢性病連續處方箋。
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onCreateAppointmentDraft) {
                onCreateAppointmentDraft({
                  hospital: '就近健保藥局 / 門診',
                  department: '慢箋領藥 / 回診',
                  notes: `因【${med.name}】庫存僅剩 ${daysLeft} 天，預約領藥回診`,
                });
              }
            }}
            className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
          >
            <span>一鍵建立領藥就診草稿</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    );
  }

  // Case F: High priority todo today
  if (pendingUrgentTodo) {
    return (
      <section
        aria-label="現在最該做的一件事"
        className="bg-slate-800 text-white rounded-2xl p-5 shadow-lg mb-6 border border-slate-700"
      >
        <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-1 rounded-md w-fit mb-3">
          <span>今日重要代辦事項</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              📌 {pendingUrgentTodo.title}
            </h2>
            <p className="text-xs text-slate-300">
              分類：{pendingUrgentTodo.category} · 到期時間：{pendingUrgentTodo.dueTime || '今日'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('todos')}
            className="shrink-0 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs"
          >
            前往瑣事清單
          </button>
        </div>
      </section>
    );
  }

  // Case G: All clear!
  return (
    <section
      aria-label="現在最該做的一件事"
      className="bg-emerald-600 text-white rounded-2xl p-5 shadow-md border-2 border-emerald-500 mb-6"
    >
      <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase bg-white/20 px-2.5 py-1 rounded-md w-fit mb-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
        <span>狀態良好 · 一切就緒</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black leading-snug">
            ✓ 今日目前的服藥與排程皆按時完成！
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            健康作息、按時吃藥是維持身體健康的最好良方。隨時查看下方時段速覽。
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab('medications')}
          className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/30 transition-colors"
        >
          查看今日完整服藥表記錄
        </button>
      </div>
    </section>
  );
}
