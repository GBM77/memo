import { X, CheckCircle2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Medication, DoseLog, AppSettings } from '../../types';
import { calculate30DayAdherence } from '../../utils/medicationLogic';

interface AdherenceStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  doseLogs: DoseLog[];
  settings: AppSettings;
  now: Date;
}

export function AdherenceStatsModal({
  isOpen,
  onClose,
  medications,
  doseLogs,
  settings,
  now,
}: AdherenceStatsModalProps) {
  if (!isOpen) return null;

  const stats = calculate30DayAdherence(medications, doseLogs, settings, now);

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (rate >= 75) return 'text-teal-700 bg-teal-50 border-teal-200';
    if (rate >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-emerald-500';
    if (rate >= 75) return 'bg-teal-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">過去 30 天服藥率與遵囑分析</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Overall Metric */}
        <div className="mt-4 p-5 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
              30 天平均服藥遵從率
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-teal-900">
                {stats.overallRate}%
              </span>
              <span className="text-xs text-teal-700 font-semibold">
                （應服 {stats.totalScheduled} 次 · 實際按時完成 {stats.totalTaken} 次）
              </span>
            </div>
            <p className="text-xs text-teal-800 mt-2">
              {stats.overallRate >= 85
                ? '🌟 太棒了！您的按時服藥率表現極佳，能有效穩定控制病情！'
                : stats.overallRate >= 65
                ? '👍 表現良好，建議搭配本 App 鬧鐘提醒，減少偶爾遺漏。'
                : '⚠️ 遺漏次數較多，請注意定期服藥，必要時可與醫師討論簡化劑型。'}
            </p>
          </div>

          <div className="w-20 h-20 rounded-full border-4 border-teal-600 flex items-center justify-center shrink-0 bg-white shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-teal-600" />
          </div>
        </div>

        {/* 30 Day Mini Trend Chart */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>近 30 天每日服藥達標長條趨勢</span>
            </h4>
            <span className="text-[11px] text-slate-400">綠色: 100% · 黃色: 部分 · 紅色: 未吃</span>
          </div>

          <div className="flex items-end gap-1 h-32 p-3 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
            {stats.daysData.map((d) => (
              <div
                key={d.dateStr}
                className="flex-1 min-w-[12px] flex flex-col items-center justify-end h-full group relative"
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${getBarColor(d.rate)}`}
                  style={{ height: `${Math.max(8, d.rate)}%` }}
                />
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap">
                    {d.dayLabel}: {d.takenCount}/{d.scheduledCount} ({d.rate}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1 font-mono">
            <span>30 天前 ({stats.daysData[0]?.dayLabel})</span>
            <span>今天 ({stats.daysData[stats.daysData.length - 1]?.dayLabel})</span>
          </div>
        </div>

        {/* Details List */}
        <div className="mt-4 max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {stats.daysData.slice().reverse().map((d) => (
            <div key={d.dateStr} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
              <span className="font-semibold text-slate-800">{d.dateStr} ({d.dayLabel})</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">
                  應服 {d.scheduledCount} 次 / 已服 {d.takenCount} 次
                </span>
                <span className={`px-2 py-0.5 rounded-md font-bold border ${getRateColor(d.rate)}`}>
                  {d.rate}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
