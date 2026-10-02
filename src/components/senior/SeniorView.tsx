import { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  PhoneCall,
  CheckCircle2,
  Clock,
  Calendar,
  Pill,
  Camera,
  Heart,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  CheckSquare,
} from 'lucide-react';
import {
  Appointment,
  Medication,
  DoseLog,
  TodoItem,
  AppSettings,
} from '../../types';
import {
  formatDateTaipei,
  formatTime24,
  isSameDay,
} from '../../utils/dateUtils';
import { calculateDepartureTime } from '../../utils/appointmentLogic';
import { getDailySlots, DailySlot } from '../../utils/medicationLogic';
import { speakTaiwaneseMandarin, stopSpeech } from '../../utils/speechUtils';

interface SeniorViewProps {
  now: Date;
  appointments: Appointment[];
  medications: Medication[];
  doseLogs: DoseLog[];
  todos: TodoItem[];
  settings: AppSettings;
  onExitSeniorMode: () => void;
  onTakeSlot: (slot: DailySlot, specificMedId?: string) => void;
  onOpenPRNModal: () => void;
  onOpenScanModal: (hint?: 'appointment' | 'medication' | 'todo') => void;
  onOpenPhoneModal: () => void;
  onToggleTodo: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export function SeniorView({
  now,
  appointments,
  medications,
  doseLogs,
  todos,
  settings,
  onExitSeniorMode,
  onTakeSlot,
  onOpenPRNModal,
  onOpenScanModal,
  onOpenPhoneModal,
  onToggleTodo,
  onShowToast,
}: SeniorViewProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 1. Today's Appointment
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

  // 2. Today's Medication Slots
  const dailySlots = getDailySlots(now, medications, doseLogs, settings, now);
  const totalSlots = dailySlots.length;
  const takenSlots = dailySlots.filter((s) => s.isAllTaken).length;
  const pendingSlots = dailySlots.filter((s) => !s.isAllTaken);
  const currentSlotToTake = pendingSlots[0];

  // 3. Today's Pending Todos
  const todayTodos = todos.filter((t) => isSameDay(t.dueDate, now));
  const todayPendingTodos = todayTodos.filter((t) => !t.isCompleted);

  // Stop speech if unmounted
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // TTS Read Aloud Function
  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    const speechParts: string[] = [];
    speechParts.push(`長輩您好，今天是 ${formatDateTaipei(now)}。`);

    // Appointment
    if (todayApp && todayDepInfo) {
      speechParts.push(
        `今天有看病行程！請在 ${todayDepInfo.departureTimeStr} 前出發，前往 ${todayApp.hospital} ${todayApp.department}。記得帶健保卡和藥袋！`
      );
    } else {
      speechParts.push('今天沒有安排看醫生，請放心休息。');
    }

    // Medication
    if (currentSlotToTake) {
      const medNames = currentSlotToTake.medications.map((m) => m.med.name).join('、');
      speechParts.push(
        `現在該吃 ${currentSlotToTake.title} 的藥，請服用 ${medNames}。`
      );
    } else if (totalSlots > 0 && takenSlots === totalSlots) {
      speechParts.push('太棒了，今天排定的藥全部都吃完囉！');
    }

    // Todos
    if (todayPendingTodos.length > 0) {
      speechParts.push(`今天還有 ${todayPendingTodos.length} 件生活瑣事要處理。`);
    }

    const fullText = speechParts.join(' ');
    const started = speakTaiwaneseMandarin(fullText);
    if (started) {
      setIsSpeaking(true);
      onShowToast('🔊 正在為您朗讀今日重點...');
      setTimeout(() => setIsSpeaking(false), 12000);
    } else {
      onShowToast('此瀏覽器未啟用語音功能，請看螢幕文字。');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 頂部：長輩模式標題橫幅 */}
      <div className="bg-amber-400 text-slate-950 p-4 sm:p-6 rounded-3xl shadow-md border-3 border-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 text-yellow-300 flex items-center justify-center shrink-0 shadow-sm text-2xl font-black">
            👵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                長輩專用版 · 簡單安心
              </h1>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              字體加大 · 觸控大按鈕 · 親切語音提醒
            </p>
          </div>
        </div>

        {/* 語音按鈕與切換回標準版 */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleReadAloud}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-yellow-300 rounded-2xl text-base font-black shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-5 h-5 text-red-400 animate-pulse" />
                <span>停止朗讀</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-yellow-300" />
                <span>🔊 唸給我聽</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onExitSeniorMode}
            className="flex-1 sm:flex-none px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-400 rounded-2xl text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            切換回一般版
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 第 1 大區塊：💊 吃藥打卡（最重要核心）                    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border-3 border-teal-600 shadow-lg overflow-hidden p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b-2 border-teal-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Pill className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              1. 今天吃藥了嗎？
            </h2>
          </div>

          <span className="text-sm font-black bg-teal-100 text-teal-900 px-3 py-1 rounded-xl">
            已吃 {takenSlots} / 總共 {totalSlots} 次
          </span>
        </div>

        {/* 還有要吃的藥 */}
        {currentSlotToTake ? (
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 border-2 border-teal-300 rounded-2xl">
              <div className="text-base font-bold text-teal-800">
                ⏰ 現在該吃這一次的藥：
              </div>
              <div className="text-2xl font-black text-teal-950 mt-1">
                【{currentSlotToTake.title}】({currentSlotToTake.timeStr})
              </div>

              {/* 藥品清單與外觀 */}
              <div className="mt-3 space-y-2">
                {currentSlotToTake.medications.map((item) => (
                  <div
                    key={item.med.id}
                    className="p-3 bg-white rounded-xl border border-teal-200 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded-full border-2 border-teal-600 flex items-center justify-center font-bold text-xs bg-teal-50 text-teal-900 shrink-0">
                      {item.med.appearance?.color ? item.med.appearance.color.slice(0, 1) : '藥'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-black text-slate-900">
                        {item.med.name}
                      </div>
                      <div className="text-sm font-bold text-teal-700">
                        {item.med.dosage} · 外觀：{item.med.appearance?.color} {item.med.appearance?.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 超大打卡按鈕 */}
            <button
              type="button"
              onClick={() => {
                onTakeSlot(currentSlotToTake);
                speakTaiwaneseMandarin(`太棒了！已為您記錄 ${currentSlotToTake.title} 吃藥打卡！`);
                onShowToast(`✓ 好棒！已記錄【${currentSlotToTake.title}】服藥！`);
              }}
              className="w-full py-5 px-6 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-2xl text-xl sm:text-2xl font-black shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer"
            >
              <Check className="w-8 h-8 stroke-[3]" />
              <span>👉 我吃藥了！點這裡打卡</span>
            </button>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-4 text-emerald-950">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-900">
                太棒了！今天排定的藥全部都吃完囉！
              </div>
              <p className="text-sm sm:text-base font-bold text-emerald-800 mt-1">
                都有按時吃藥，身體照顧得很好，請放心休息！
              </p>
            </div>
          </div>
        )}

        {/* 若有其他備用藥 */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenPRNModal}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-base font-bold border border-slate-300 transition-colors cursor-pointer"
          >
            💊 需要時才吃的備用藥打卡（止痛藥 / 胃藥）
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 第 2 大區塊：🏥 今天要去醫院嗎？（出發防呆）               */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border-3 border-amber-500 shadow-lg overflow-hidden p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-amber-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              2. 今天要去醫院看病嗎？
            </h2>
          </div>
        </div>

        {todayApp && todayDepInfo ? (
          <div className="p-5 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-base font-black text-red-600">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <span>注意：今天有預約看病行程！</span>
            </div>

            <div className="text-2xl font-black text-slate-950">
              {todayApp.hospital} · {todayApp.department}
            </div>

            <div className="text-base font-bold text-slate-800">
              看診時間：<b className="font-mono text-xl text-slate-950">{todayApp.dateTime.split('T')[1]}</b>
              {todayApp.number ? `（診號：${todayApp.number}）` : ''}
              {todayApp.doctor ? ` · ${todayApp.doctor}` : ''}
            </div>

            {/* 最晚出發時間醒目大框 */}
            <div className="p-3 bg-red-100 border-2 border-red-300 rounded-xl text-red-950 flex items-center gap-3">
              <Clock className="w-7 h-7 text-red-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-red-800">最晚幾點出發：</div>
                <div className="text-xl sm:text-2xl font-black text-red-950 font-mono">
                  請在【{todayDepInfo.departureTimeStr}】前出門！
                </div>
              </div>
            </div>

            {/* 出門三寶 */}
            <div className="p-3 bg-white border border-amber-300 rounded-xl text-sm font-bold text-amber-950">
              🎒 出門必帶三寶：<b>健保卡</b>、<b>身分證</b>、<b>目前吃的藥袋</b>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center gap-3 text-slate-700">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                今天沒有安排看醫生！
              </div>
              <p className="text-sm font-bold text-slate-600">
                可以放心在家散步、休息，生活愉快！
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 第 3 大區塊：📞 一鍵打電話（兒女與診所）                   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border-3 border-blue-600 shadow-lg overflow-hidden p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 border-b-2 border-blue-100 pb-3">
          <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <PhoneCall className="w-6 h-6" />
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            3. 一鍵打電話找家人或診所
          </h2>
        </div>

        <p className="text-sm font-bold text-slate-600">
          點按鈕直接打電話，不用自己慢慢翻找電話簿：
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 打給兒女 */}
          {settings.emergencyContactPhone && (
            <a
              href={`tel:${settings.emergencyContactPhone}`}
              className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-7 h-7 text-white fill-white shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold opacity-90">打給家人：</div>
                  <div className="text-lg font-black">{settings.emergencyContactName || '家人兒女'}</div>
                </div>
              </div>
              <PhoneCall className="w-6 h-6" />
            </a>
          )}

          {/* 打給藥局或常看診所 */}
          {settings.pharmacyPhone && (
            <a
              href={`tel:${settings.pharmacyPhone}`}
              className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-between shadow-md active:scale-98 transition-all"
            >
              <div className="flex items-center gap-3">
                <PhoneCall className="w-7 h-7 text-white shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold opacity-90">打給診所/藥局：</div>
                  <div className="text-lg font-black truncate max-w-[160px]">
                    {settings.pharmacyName || '常看診所'}
                  </div>
                </div>
              </div>
              <PhoneCall className="w-6 h-6" />
            </a>
          )}
        </div>

        {/* 拍照問 AI */}
        <button
          type="button"
          onClick={() => onOpenScanModal()}
          className="w-full py-4 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-base sm:text-lg font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Camera className="w-6 h-6" />
          <span>📷 拍照辨識藥袋或掛號單（看不懂直接拍！）</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 第 4 大區塊：📝 今天該做的事                               */}
      {/* ======================================================== */}
      {todayTodos.length > 0 && (
        <div className="bg-white rounded-3xl border-3 border-slate-300 shadow-lg overflow-hidden p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-xs">
                <CheckSquare className="w-6 h-6" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                4. 今天該做的事（點一下完成）
              </h2>
            </div>
            <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-xl">
              待辦 {todayPendingTodos.length} 件
            </span>
          </div>

          <div className="space-y-2.5">
            {todayTodos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => {
                  onToggleTodo(todo.id);
                  onShowToast(todo.isCompleted ? '已取消標記' : `✓ 好棒！已完成【${todo.title}】！`);
                }}
                className={`p-4 rounded-2xl border-2 flex items-center gap-3.5 cursor-pointer transition-all ${
                  todo.isCompleted
                    ? 'border-slate-200 bg-slate-50 text-slate-400 line-through'
                    : 'border-slate-300 bg-white hover:border-teal-500 text-slate-950 font-bold'
                }`}
              >
                <input
                  type="checkbox"
                  checked={todo.isCompleted}
                  onChange={() => {}}
                  className="w-6 h-6 rounded-lg text-teal-600 border-2 border-slate-400 cursor-pointer"
                />
                <span className="text-lg flex-1">{todo.title}</span>
                {todo.priority === 'high' && (
                  <span className="text-xs bg-red-100 text-red-800 font-black px-2 py-0.5 rounded-md">
                    重要
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部醒目返回按鈕 */}
      <div className="p-4 text-center">
        <button
          type="button"
          onClick={onExitSeniorMode}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl text-base font-bold transition-all cursor-pointer"
        >
          <span>切換回一般完整功能模式</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
