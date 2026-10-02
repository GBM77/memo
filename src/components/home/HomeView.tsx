import {
  Calendar,
  Clock,
  Pill,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Package,
  Camera,
  Sparkles,
} from 'lucide-react';
import {
  Appointment,
  Medication,
  DoseLog,
  TodoItem,
  AppSettings,
} from '../../types';
import { HeroAction } from '../HeroAction';
import { ImportantReminders } from './ImportantReminders';
import { TodayMedsStatusCard } from '../TodayMedsStatusCard';
import { DoseSlotCard } from '../medications/DoseSlotCard';
import { AppointmentCard } from '../appointments/AppointmentCard';
import { SafetyBanner } from '../common/SafetyBanner';
import { getDailySlots, calculateRemainingDays, DailySlot } from '../../utils/medicationLogic';
import { isSameDay, formatDateTaipei } from '../../utils/dateUtils';

interface HomeViewProps {
  now: Date;
  appointments: Appointment[];
  medications: Medication[];
  doseLogs: DoseLog[];
  todos: TodoItem[];
  settings: AppSettings;
  onNavigateToTab: (tab: 'home' | 'appointments' | 'medications' | 'todos' | 'settings') => void;
  onSelectAppointment: (app: Appointment) => void;
  onCreateAppointmentDraft: (draft: Partial<Appointment>) => void;
  onOpenPRNModal: () => void;
  onTakeSlot: (slot: DailySlot, specificMedId?: string) => void;
  onSnoozeSlot: (slot: DailySlot, minutes: number) => void;
  onSkipSlot: (slot: DailySlot) => void;
  onOpenHoldConfirm: (med: Medication, slotKey: string, reasonMsg: string, lastTakenStr?: string) => void;
  onToggleTodo: (id: string) => void;
  onToggleAppointmentItem: (appId: string, item: string) => void;
  onCompleteAppointment: (app: Appointment, nextVisitDate?: string) => void;
  onShowToast: (msg: string) => void;
  onOpenScanModal?: (hint?: 'appointment' | 'medication' | 'todo') => void;
}

export function HomeView({
  now,
  appointments,
  medications,
  doseLogs,
  todos,
  settings,
  onNavigateToTab,
  onSelectAppointment,
  onCreateAppointmentDraft,
  onOpenPRNModal,
  onTakeSlot,
  onSnoozeSlot,
  onSkipSlot,
  onOpenHoldConfirm,
  onToggleTodo,
  onToggleAppointmentItem,
  onCompleteAppointment,
  onShowToast,
  onOpenScanModal,
}: HomeViewProps) {
  const dailySlots = getDailySlots(now, medications, doseLogs, settings, now);

  // Today's upcoming or latest appointment
  const upcomingAppointments = appointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const todayAppointment = upcomingAppointments.find((a) => isSameDay(a.dateTime, now));
  const nextAppointment = todayAppointment || upcomingAppointments[0];

  // Low stock medications
  const lowStockMeds = medications.filter(
    (m) => m.isActive && calculateRemainingDays(m) <= settings.lowStockThresholdDays
  );

  // Today's pending todos
  const todayTodos = todos.filter((t) => !t.isCompleted && isSameDay(t.dueDate, now));

  return (
    <div className="space-y-6">
      {/* 1. 一眼看懂：首頁只突出「現在最該做的一件事」 */}
      {settings.visibleSections.heroPriority && (
        <HeroAction
          now={now}
          appointments={appointments}
          medications={medications}
          doseLogs={doseLogs}
          todos={todos}
          settings={settings}
          onNavigateToTab={onNavigateToTab}
          onSelectAppointment={onSelectAppointment}
          onCreateAppointmentDraft={onCreateAppointmentDraft}
        />
      )}

      {/* 每天 和 每週 的重要小提醒 (簡單清楚) */}
      <ImportantReminders
        now={now}
        appointments={appointments}
        medications={medications}
        doseLogs={doseLogs}
        todos={todos}
        settings={settings}
        onNavigateToTab={onNavigateToTab}
        onSelectAppointment={onSelectAppointment}
        onCreateAppointmentDraft={onCreateAppointmentDraft}
        onToggleTodo={onToggleTodo}
        onShowToast={onShowToast}
      />

      {/* AI Smart Scan Quick Banner */}
      {onOpenScanModal && (
        <div
          onClick={() => onOpenScanModal()}
          className="bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl p-4 shadow-sm cursor-pointer transition-all active:scale-99 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  拍照 / 上傳圖檔 AI 自動辨識加入備忘錄
                </span>
                <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md">
                  NEW
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5">
                支援掛號單、藥袋處方箋、超商繳費單或手寫生活便條紙
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1 text-xs font-bold bg-white text-teal-800 px-3 py-1.5 rounded-xl shadow-xs">
            <span>立即拍攝</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 2. 防呆：首頁常駐「今天吃過了嗎？」大按鈕與時段速覽 */}
      {settings.visibleSections.todayMedsStatus && (
        <TodayMedsStatusCard
          now={now}
          medications={medications}
          doseLogs={doseLogs}
          settings={settings}
          onOpenPRNModal={onOpenPRNModal}
          onGoToMedicationsTab={() => onNavigateToTab('medications')}
          onShowToast={onShowToast}
        />
      )}

      {/* 3. 今日就診行程動態 */}
      {settings.visibleSections.appointments && nextAppointment && (
        <section aria-label="就診行程">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>{isSameDay(nextAppointment.dateTime, now) ? '今日就診出發動態' : '下一次就診預定'}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateToTab('appointments')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              查看所有就診 &gt;
            </button>
          </div>

          <AppointmentCard
            appointment={nextAppointment}
            now={now}
            onEdit={(a) => {
              onSelectAppointment(a);
              onNavigateToTab('appointments');
            }}
            onDelete={() => {}}
            onToggleItemChecked={onToggleAppointmentItem}
            onCompleteAppointment={onCompleteAppointment}
          />
        </section>
      )}

      {/* 4. 今日即將到來之服藥時段卡片 */}
      {settings.visibleSections.medicationSlots && dailySlots.length > 0 && (
        <section aria-label="今日服藥打卡">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>今日服藥時段（防漏吃與快速打卡）</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateToTab('medications')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              進入服藥專區 &gt;
            </button>
          </div>

          <div className="space-y-3">
            {dailySlots.slice(0, 3).map((slot) => (
              <DoseSlotCard
                key={slot.slotKey}
                slot={slot}
                settings={settings}
                onTakeSlot={onTakeSlot}
                onSnoozeSlot={onSnoozeSlot}
                onSkipSlot={onSkipSlot}
                onOpenHoldConfirm={onOpenHoldConfirm}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. 藥品低庫存領藥警示 */}
      {settings.visibleSections.lowStockAlerts && lowStockMeds.length > 0 && (
        <section aria-label="低庫存提醒">
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
            <div className="flex items-start gap-2.5">
              <Package className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-amber-950">
                  藥品庫存偏低警示（共 {lowStockMeds.length} 種藥品低於 {settings.lowStockThresholdDays} 天）
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {lowStockMeds.map((m) => `${m.name}（剩餘 ${calculateRemainingDays(m)} 天）`).join('、')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const first = lowStockMeds[0];
                onCreateAppointmentDraft({
                  hospital: '就近健保藥局 / 門診',
                  department: '慢性病回診領藥',
                  notes: `【${first.name}】等藥品存量偏低，安排領藥`,
                });
              }}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors self-end sm:self-center"
            >
              <span>一鍵建立領藥就診草稿</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* 6. 今日日常瑣事 */}
      {settings.visibleSections.todos && todayTodos.length > 0 && (
        <section aria-label="今日待辦瑣事">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-600" />
              <span>今日日常瑣事（{todayTodos.length} 項待辦）</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateToTab('todos')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              查看所有瑣事 &gt;
            </button>
          </div>

          <div className="space-y-2">
            {todayTodos.map((todo) => (
              <div
                key={todo.id}
                className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTodo(todo.id);
                      onShowToast(`✓ 已完成「${todo.title}」！`);
                    }}
                    className="w-5 h-5 rounded-md border border-slate-300 hover:border-teal-500 bg-white flex items-center justify-center"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900">{todo.title}</span>
                    <span className="text-[11px] text-slate-500 ml-2">
                      ({todo.category} · {todo.dueTime || '今日'})
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  todo.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {todo.priority === 'high' ? '高優先' : '一般'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Safety Banner */}
      <SafetyBanner settings={settings} />
    </div>
  );
}
