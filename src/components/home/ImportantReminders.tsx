import { useState } from 'react';
import {
  Bell,
  Calendar,
  Pill,
  CheckSquare,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  Package,
  CalendarClock,
  CheckCircle2,
  Info,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import {
  Appointment,
  Medication,
  DoseLog,
  TodoItem,
  AppSettings,
} from '../../types';
import {
  isSameDay,
  formatDateTaipei,
  formatTime24,
  addMinutes,
  diffMinutes,
} from '../../utils/dateUtils';
import { calculateDepartureTime } from '../../utils/appointmentLogic';
import {
  getDailySlots,
  calculateRemainingDays,
  calculate30DayAdherence,
} from '../../utils/medicationLogic';

interface ImportantRemindersProps {
  now: Date;
  appointments: Appointment[];
  medications: Medication[];
  doseLogs: DoseLog[];
  todos: TodoItem[];
  settings: AppSettings;
  onNavigateToTab: (tab: 'home' | 'appointments' | 'medications' | 'todos' | 'settings') => void;
  onSelectAppointment: (app: Appointment) => void;
  onCreateAppointmentDraft: (draft: Partial<Appointment>) => void;
  onToggleTodo: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export function ImportantReminders({
  now,
  appointments,
  medications,
  doseLogs,
  todos,
  settings,
  onNavigateToTab,
  onSelectAppointment,
  onCreateAppointmentDraft,
  onToggleTodo,
  onShowToast,
}: ImportantRemindersProps) {
  // Mode: 'daily' (每天) vs 'weekly' (每週)
  const [activeMode, setActiveMode] = useState<'daily' | 'weekly'>('daily');

  // --- 1. DAILY CALCULATIONS ---
  // Today's appointment
  const todayApps = appointments
    .filter((a) => a.status === 'upcoming' && isSameDay(a.dateTime, now))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const todayApp = todayApps[0];

  let todayDepInfo: ReturnType<typeof calculateDepartureTime> | null = null;
  if (todayApp) {
    todayDepInfo = calculateDepartureTime(
      todayApp.dateTime,
      todayApp.transportMode,
      todayApp.drivingTime,
      todayApp.parkingSearchTime,
      todayApp.walkFromParkingTime,
      todayApp.checkInEarlyTime,
      todayApp.safetyBufferTime,
      now
    );
  }

  // Today's medications status
  const dailySlots = getDailySlots(now, medications, doseLogs, settings, now);
  const totalSlots = dailySlots.length;
  const takenSlots = dailySlots.filter((s) => s.isAllTaken).length;
  const pendingSlots = dailySlots.filter((s) => !s.isAllTaken);
  const nextSlot = pendingSlots[0];
  const hasMissedSlot = dailySlots.some((s) => s.hasMissed);

  // Today's pending todos
  const todayPendingTodos = todos.filter(
    (t) => !t.isCompleted && isSameDay(t.dueDate, now)
  );

  // Today's completed count
  const todayCompletedTodos = todos.filter(
    (t) => t.isCompleted && isSameDay(t.dueDate, now)
  );

  // --- 2. WEEKLY CALCULATIONS (Next 7 Days) ---
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Upcoming appointments in next 7 days
  const weeklyApps = appointments
    .filter((a) => {
      if (a.status !== 'upcoming') return false;
      const appDate = new Date(a.dateTime);
      return appDate >= now && appDate <= sevenDaysLater;
    })
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Low stock medications in next 7 days
  const weeklyLowStockMeds = medications.filter((m) => {
    if (!m.isActive) return false;
    const remainingDays = calculateRemainingDays(m);
    return remainingDays <= 7;
  });

  // Upcoming todos in next 7 days
  const weeklyPendingTodos = todos.filter((t) => {
    if (t.isCompleted) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate >= now && dueDate <= sevenDaysLater;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // 7-day adherence rate
  const adherenceStats = calculate30DayAdherence(medications, doseLogs, settings, now);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Top Header & Simple Clear Toggle */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-slate-50 to-teal-50/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                重要小提醒
              </h2>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
                簡單清楚 · 防呆必看
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              一眼掌握當前最關鍵的就診行程、服藥進度與本週大事
            </p>
          </div>
        </div>

        {/* Tab Switcher: 每天 vs 每週 */}
        <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-xl shadow-inner shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode('daily')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'daily'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>每天重要提醒</span>
            {(todayApps.length > 0 || pendingSlots.length > 0 || todayPendingTodos.length > 0) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('weekly')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'weekly'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
            <span>每週重要提醒</span>
            {(weeklyApps.length > 0 || weeklyLowStockMeds.length > 0) && (
              <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full leading-none">
                {weeklyApps.length + weeklyLowStockMeds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* 1. 每天重要小提醒 (DAILY VIEW)            */}
      {/* ========================================= */}
      {activeMode === 'daily' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1.1 今日就診狀態 */}
            <div
              onClick={() => onNavigateToTab('appointments')}
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs relative overflow-hidden ${
                todayApp
                  ? todayDepInfo?.isOverdue
                    ? 'border-red-300 bg-red-50/70 text-red-950'
                    : 'border-amber-300 bg-amber-50/60 text-amber-950'
                  : 'border-slate-200 bg-slate-50/60 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>今日就診行程</span>
                </span>
                {todayApp ? (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      todayDepInfo?.isOverdue
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {todayDepInfo?.isOverdue ? '⚠️ 來不及出發' : '今日看診'}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                    無排診
                  </span>
                )}
              </div>

              {todayApp && todayDepInfo ? (
                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {todayApp.hospital} · {todayApp.department}
                  </div>
                  <div className="text-xs text-slate-700">
                    看診時間：<b className="font-mono text-slate-900">{todayApp.dateTime.split('T')[1]}</b>
                    {todayApp.number ? `（${todayApp.number}）` : ''}
                  </div>
                  <div
                    className={`text-xs font-bold p-1.5 rounded-lg flex items-center gap-1 ${
                      todayDepInfo.isOverdue
                        ? 'bg-red-100 text-red-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>最晚出發時間：{todayDepInfo.departureTimeStr}</span>
                  </div>
                  {todayApp.precautions && (
                    <div className="text-[11px] text-amber-800 line-clamp-1">
                      備註：{todayApp.precautions}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>今天沒有安排任何看診，生活愉快！</span>
                </div>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-teal-700">
                <span>查看所有就診預約</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 1.2 今日服藥打卡進度 */}
            <div
              onClick={() => onNavigateToTab('medications')}
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs relative overflow-hidden ${
                hasMissedSlot
                  ? 'border-orange-300 bg-orange-50/70 text-orange-950'
                  : pendingSlots.length === 0 && totalSlots > 0
                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                  : 'border-teal-200 bg-teal-50/50 text-teal-950'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>今日服藥進度</span>
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    hasMissedSlot
                      ? 'bg-orange-500 text-white'
                      : pendingSlots.length === 0 && totalSlots > 0
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-600 text-white'
                  }`}
                >
                  {hasMissedSlot
                    ? '有漏吃提醒'
                    : pendingSlots.length === 0 && totalSlots > 0
                    ? '今日全吃完'
                    : `待服用 ${pendingSlots.length} 次`}
                </span>
              </div>

              <div className="space-y-2">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>
                      已完成 {takenSlots} / {totalSlots} 個時段
                    </span>
                    <span className="text-teal-700 font-mono">
                      {totalSlots > 0 ? Math.round((takenSlots / totalSlots) * 100) : 100}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        hasMissedSlot ? 'bg-orange-500' : 'bg-teal-600'
                      }`}
                      style={{
                        width: `${totalSlots > 0 ? (takenSlots / totalSlots) * 100 : 100}%`,
                      }}
                    />
                  </div>
                </div>

                {nextSlot ? (
                  <div className="text-xs bg-white/80 p-2 rounded-lg border border-slate-200 text-slate-800">
                    <span className="text-slate-500">下次服藥：</span>
                    <b className="text-teal-900">{nextSlot.title} ({nextSlot.timeStr})</b>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">
                      {nextSlot.medications.map((m) => m.med.name).join('、')}
                    </div>
                  </div>
                ) : (
                  <div className="py-1 text-xs text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>太棒了！今天的所有排定藥品均已服用完成。</span>
                  </div>
                )}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-teal-700">
                <span>前往服藥打卡專區</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 1.3 今日日常瑣事 */}
            <div
              onClick={() => onNavigateToTab('todos')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 transition-all cursor-pointer hover:shadow-xs relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                  <span>今日必辦瑣事</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                  待辦 {todayPendingTodos.length} 項
                </span>
              </div>

              {todayPendingTodos.length > 0 ? (
                <div className="space-y-1.5">
                  {todayPendingTodos.slice(0, 2).map((todo) => (
                    <div
                      key={todo.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTodo(todo.id);
                        onShowToast(`✓ 已標記【${todo.title}】為完成！`);
                      }}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-teal-400 text-xs flex items-center gap-2 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={todo.isCompleted}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="truncate font-medium text-slate-800 flex-1">
                        {todo.title}
                      </span>
                      {todo.priority === 'high' && (
                        <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 py-0.2 rounded shrink-0">
                          緊急
                        </span>
                      )}
                    </div>
                  ))}
                  {todayPendingTodos.length > 2 && (
                    <div className="text-[11px] text-slate-500 text-right">
                      還有 {todayPendingTodos.length - 2} 項未列出...
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>今天沒有未完成的待辦瑣事，輕鬆無負擔！</span>
                </div>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-teal-700">
                <span>查看所有瑣事清單</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* 今日健康與生活貼心叮嚀條 */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-900">今日叮嚀：</span>
              <span>
                {todayApp
                  ? `出門看診請務必攜帶【健保卡、身分證】及【目前正在使用的慢性病藥袋】。`
                  : hasMissedSlot
                  ? `有漏吃藥品，請依藥袋指示或撥打藥局詢問，切勿自行加倍劑量。`
                  : `天氣多變，出門請注意保暖與補水；按時服藥並留意血壓與心跳狀況。`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 2. 每週重要小提醒 (WEEKLY VIEW - 未來7天) */}
      {/* ========================================= */}
      {activeMode === 'weekly' && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2.1 本週門診行程總覽 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-teal-600" />
                  <span>未來 7 天內就診預約（{weeklyApps.length} 場）</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('appointments')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900"
                >
                  就診管理 &gt;
                </button>
              </div>

              {weeklyApps.length > 0 ? (
                <div className="space-y-2">
                  {weeklyApps.map((app) => {
                    const appDate = new Date(app.dateTime);
                    const isToday = isSameDay(app.dateTime, now);
                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          onSelectAppointment(app);
                          onNavigateToTab('appointments');
                        }}
                        className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-3 hover:border-teal-400 cursor-pointer transition-all ${
                          isToday ? 'border-amber-400 ring-1 ring-amber-300' : 'border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {app.hospital} · {app.department}
                            </span>
                            {isToday && (
                              <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded">
                                今天
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {formatDateTaipei(appDate)} · {formatTime24(appDate)}
                            {app.doctor ? `（${app.doctor}）` : ''}
                          </div>
                        </div>

                        <span className="text-xs font-bold text-teal-700 shrink-0">
                          查看詳情 &gt;
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500">
                  未來 7 天內尚無已排定的回診行程。
                </div>
              )}
            </div>

            {/* 2.2 本週藥品存量預警 (7 天內即將用罄) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>本週即將用罄藥品（{weeklyLowStockMeds.length} 種）</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('medications')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900"
                >
                  藥品庫存 &gt;
                </button>
              </div>

              {weeklyLowStockMeds.length > 0 ? (
                <div className="space-y-2">
                  {weeklyLowStockMeds.map((med) => {
                    const days = calculateRemainingDays(med);
                    return (
                      <div
                        key={med.id}
                        className="p-3 rounded-xl border border-amber-300 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div>
                          <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>{med.name}</span>
                          </div>
                          <div className="text-[11px] text-amber-800 mt-0.5">
                            剩餘 <b>{med.totalStock}</b> 顆，預計 <b>{days} 天內</b>用罄！
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onCreateAppointmentDraft({
                              hospital: '就近健保藥局 / 門診',
                              department: '慢籤領藥',
                              notes: `【${med.name}】預計本週用罄，請回診領藥`,
                            });
                          }}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 self-start sm:self-center transition-colors"
                        >
                          建領藥草稿
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>太好了！目前所有藥品庫存均充足以供本週服用。</span>
                </div>
              )}
            </div>
          </div>

          {/* 2.3 本週生活重要小結條 */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-teal-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <b>本週服藥規律度：</b>過去 30 天準時遵從率為{' '}
                <b className="text-teal-900 font-mono text-sm">{adherenceStats.overallRate}%</b>
                （共記錄 {adherenceStats.totalTaken} 次服藥），維持良好習慣！
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('medications')}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 underline self-end sm:self-auto shrink-0"
            >
              檢視每週服藥表
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
