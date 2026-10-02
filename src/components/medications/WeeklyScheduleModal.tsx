import { Printer, X, Download } from 'lucide-react';
import { Medication, AppSettings } from '../../types';
import { TIMING_LABELS } from '../../utils/medicationLogic';

interface WeeklyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  settings: AppSettings;
}

const DAYS_NAMES = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

export function WeeklyScheduleModal({
  isOpen,
  onClose,
  medications,
  settings,
}: WeeklyScheduleModalProps) {
  if (!isOpen) return null;

  const activeMeds = medications.filter((m) => m.isActive);

  const handlePrint = () => {
    window.print();
  };

  const timingSlots: { key: string; label: string; time: string }[] = [
    { key: 'before_breakfast', label: '早餐前', time: '07:30' },
    { key: 'after_breakfast', label: '早餐後', time: settings.mealTimes.breakfast },
    { key: 'before_lunch', label: '午餐前', time: '12:00' },
    { key: 'after_lunch', label: '午餐後', time: settings.mealTimes.lunch },
    { key: 'before_dinner', label: '晚餐前', time: '18:00' },
    { key: 'after_dinner', label: '晚餐後', time: settings.mealTimes.dinner },
    { key: 'bedtime', label: '睡前', time: settings.mealTimes.bedtime },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div>
            <h3 className="text-xl font-bold text-slate-900">每週個人服藥課表</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              一目了然各時段用藥計畫，可列印後張貼於冰箱或藥盒旁
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>列印 / 存為 PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Container */}
        <div className="mt-4 print:mt-0 print:m-0">
          <div className="text-center pb-3 border-b border-slate-200">
            <h2 className="text-lg font-black text-slate-900">【安時備忘】個人專屬每週服藥指引表</h2>
            <p className="text-xs text-slate-500 mt-1">
              就診藥局諮詢：{settings.pharmacyName}（{settings.pharmacyPhone}） · 緊急聯絡：{settings.emergencyContactName}（{settings.emergencyContactPhone}）
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-300 p-2 text-center w-24">時段 / 時程</th>
                  <th className="border border-slate-300 p-2">服用藥品與劑量</th>
                  <th className="border border-slate-300 p-2 w-32">外觀與特徵</th>
                  <th className="border border-slate-300 p-2">飲食注意事項與備註</th>
                </tr>
              </thead>
              <tbody>
                {timingSlots.map((slot) => {
                  const matched = activeMeds.filter((m) => m.timings.includes(slot.key as any));
                  if (matched.length === 0) return null;

                  return (
                    <tr key={slot.key} className="hover:bg-slate-50/50">
                      <td className="border border-slate-300 p-2.5 text-center bg-slate-50 font-semibold">
                        <div className="font-bold text-slate-900">{slot.label}</div>
                        <div className="text-[11px] font-mono text-slate-500">{slot.time}</div>
                      </td>
                      <td className="border border-slate-300 p-2.5">
                        <div className="space-y-1.5">
                          {matched.map((m) => (
                            <div key={m.id} className="font-medium text-slate-900">
                              <span className="font-bold text-teal-800">{m.name}</span>
                              <span className="ml-1 text-slate-600 font-semibold">[{m.dosage}]</span>
                              {m.frequency === 'weekdays' && m.specificDays && (
                                <span className="text-[11px] text-amber-700 ml-1">
                                  (每週{m.specificDays.map((d) => DAYS_NAMES[d]).join('、')})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2.5 text-slate-600">
                        {matched.map((m) => (
                          <div key={m.id} className="text-[11px]">
                            {m.appearance?.color} {m.appearance?.description || ''}
                          </div>
                        ))}
                      </td>
                      <td className="border border-slate-300 p-2.5 text-slate-600">
                        {matched.map((m) => (
                          <div key={m.id} className="text-[11px]">
                            {m.foodNotes || '無特殊忌口，配溫開水'}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}

                {/* PRN Row */}
                {activeMeds.some((m) => m.frequency === 'prn') && (
                  <tr className="bg-amber-50/40">
                    <td className="border border-slate-300 p-2.5 text-center font-bold text-amber-900 bg-amber-100/50">
                      需要時服用 (PRN)
                    </td>
                    <td className="border border-slate-300 p-2.5">
                      {activeMeds
                        .filter((m) => m.frequency === 'prn')
                        .map((m) => (
                          <div key={m.id} className="font-medium text-slate-900">
                            <span className="font-bold text-amber-800">{m.name}</span>
                            <span className="ml-1 text-slate-600">[{m.dosage}]</span>
                            <span className="text-[11px] text-slate-500 ml-1">
                              (每日最多 {m.maxDailyDoses} 次，最短間隔 {m.minIntervalHours} 小時)
                            </span>
                          </div>
                        ))}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-600">
                      {activeMeds
                        .filter((m) => m.frequency === 'prn')
                        .map((m) => (
                          <div key={m.id} className="text-[11px]">
                            {m.appearance?.color} {m.appearance?.description || ''}
                          </div>
                        ))}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-slate-600">
                      {activeMeds
                        .filter((m) => m.frequency === 'prn')
                        .map((m) => (
                          <div key={m.id} className="text-[11px]">
                            {m.foodNotes || '疼痛發作或必要時才服用'}
                          </div>
                        ))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
            ⚠️ 本課表僅為提醒工具，不能取代醫師或藥師的指示。若有漏吃或服藥疑慮，請立即向藥師諮詢。
          </div>
        </div>
      </div>
    </div>
  );
}
