import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  PlusCircle,
} from 'lucide-react';
import { Medication, DoseLog } from '../../types';
import { formatTime24, isSameDay } from '../../utils/dateUtils';
import { SHAPE_LABELS } from '../../utils/medicationLogic';

interface PRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  doseLogs: DoseLog[];
  now: Date;
  onConfirmPRN: (med: Medication, notes?: string) => void;
}

export function PRNModal({
  isOpen,
  onClose,
  medications,
  doseLogs,
  now,
  onConfirmPRN,
}: PRNModalProps) {
  const prnMeds = medications.filter((m) => m.isActive && (m.frequency === 'prn' || m.timings.includes('custom')));
  const [selectedMedId, setSelectedMedId] = useState<string>(prnMeds[0]?.id || '');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentMed = medications.find((m) => m.id === selectedMedId) || prnMeds[0];

  let todayLogs: DoseLog[] = [];
  let dosesTodayCount = 0;
  let lastTakenTimeStr = '';
  let hoursSinceLast = 999;
  let isIntervalBlocked = false;
  let isMaxReached = false;
  let waitMinutesRemaining = 0;

  if (currentMed) {
    todayLogs = doseLogs
      .filter(
        (l) =>
          l.medicationId === currentMed.id &&
          l.status === 'taken' &&
          l.actualTime &&
          isSameDay(l.actualTime, now)
      )
      .sort((a, b) => new Date(b.actualTime!).getTime() - new Date(a.actualTime!).getTime());

    dosesTodayCount = todayLogs.length;

    if (todayLogs.length > 0) {
      const lastTakenDate = new Date(todayLogs[0].actualTime!);
      lastTakenTimeStr = formatTime24(lastTakenDate);
      hoursSinceLast = (now.getTime() - lastTakenDate.getTime()) / (1000 * 60 * 60);

      if (currentMed.minIntervalHours > 0 && hoursSinceLast < currentMed.minIntervalHours) {
        isIntervalBlocked = true;
        waitMinutesRemaining = Math.ceil((currentMed.minIntervalHours - hoursSinceLast) * 60);
      }
    }

    if (currentMed.maxDailyDoses > 0 && dosesTodayCount >= currentMed.maxDailyDoses) {
      isMaxReached = true;
    }
  }

  const handleConfirm = () => {
    if (!currentMed || isMaxReached || isIntervalBlocked) return;
    onConfirmPRN(currentMed, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">需要時服藥打卡 (PRN)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {prnMeds.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            目前無設定「需要時才吃 (PRN)」的藥品。可在藥品設定中將頻率設為「需要時才吃」。
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Med Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                選擇藥品：
              </label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
                className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              >
                {prnMeds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}（{m.dosage}）
                  </option>
                ))}
              </select>
            </div>

            {/* Current Med Status Box */}
            {currentMed && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>
                    藥品外觀：{currentMed.appearance?.color || '無特記'}{' '}
                    {SHAPE_LABELS[currentMed.appearance?.shape] || ''}
                  </span>
                  <span>庫存剩餘：{currentMed.totalStock} 顆/包</span>
                </div>

                {/* TODAY COUNT & LAST TIME */}
                <div className="bg-white p-3 rounded-lg border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">今天已吃次數：</span>
                    <span className="font-bold text-slate-900">
                      {dosesTodayCount} 次 / 上限 {currentMed.maxDailyDoses} 次
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">上次服用時間：</span>
                    <span className="font-bold font-mono text-slate-900">
                      {lastTakenTimeStr ? `${lastTakenTimeStr} (${hoursSinceLast.toFixed(1)} 小時前)` : '今天尚未服用'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">規定最短間隔：</span>
                    <span className="font-semibold text-slate-700">
                      {currentMed.minIntervalHours} 小時
                    </span>
                  </div>
                </div>

                {/* BLOCK WARNINGS */}
                {isMaxReached && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">❌ 今日已達最高服用次數上限 ({currentMed.maxDailyDoses} 次)！</p>
                      <p className="mt-0.5 text-red-700">
                        為防藥物過量中毒，系統已安全阻擋本次打卡。若症狀持續未緩解，請儘速就醫或諮詢醫師。
                      </p>
                    </div>
                  </div>
                )}

                {isIntervalBlocked && !isMaxReached && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        ⚠️ 間隔時間不足！規定最短間隔 {currentMed.minIntervalHours} 小時
                      </p>
                      <p className="mt-0.5 text-red-700">
                        距離上次吃藥僅隔 {hoursSinceLast.toFixed(1)} 小時，還需等待約 {waitMinutesRemaining} 分鐘才可再次服用。
                      </p>
                    </div>
                  </div>
                )}

                {!isMaxReached && !isIntervalBlocked && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ 符合用藥安全間隔與次數限制，可正常服用並打卡。</span>
                  </div>
                )}
              </div>
            )}

            {/* Note input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                服用原因 / 症狀紀錄（選填）：
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如：偏頭痛發作服用一顆"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isMaxReached || isIntervalBlocked || !currentMed}
                className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                確認服用並記錄
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
