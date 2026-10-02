import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Pill,
} from 'lucide-react';
import { Medication, DoseLog, AppSettings } from '../types';
import {
  getDailySlots,
  generateLineShareText,
  DailySlot,
} from '../utils/medicationLogic';
import { formatTime24 } from '../utils/dateUtils';

interface TodayMedsStatusCardProps {
  now: Date;
  medications: Medication[];
  doseLogs: DoseLog[];
  settings: AppSettings;
  onOpenPRNModal: () => void;
  onGoToMedicationsTab: () => void;
  onShowToast: (message: string) => void;
}

export function TodayMedsStatusCard({
  now,
  medications,
  doseLogs,
  settings,
  onOpenPRNModal,
  onGoToMedicationsTab,
  onShowToast,
}: TodayMedsStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const dailySlots = getDailySlots(now, medications, doseLogs, settings, now);

  // PRN logs today
  const todayStr = now.toISOString().split('T')[0];
  const prnLogsToday = doseLogs.filter(
    (l) => l.slotKey.startsWith('prn') && l.status === 'taken' && l.actualTime && l.actualTime.startsWith(todayStr)
  );

  const totalSlotsCount = dailySlots.length;
  const takenSlotsCount = dailySlots.filter((s) => s.isAllTaken).length;
  const hasMissed = dailySlots.some((s) => s.hasMissed);

  const handleShareToLine = () => {
    const text = generateLineShareText(now, dailySlots, prnLogsToday);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onShowToast('✓ 已複製今日用藥狀態文字！可直接切換至 LINE 貼上給家人。');
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      onShowToast('複製失敗，請手動複製');
    });
  };

  // Determine overall status phrase
  let statusBadge = {
    text: '今日全部服完',
    subtext: '太棒了！今日排定藥品皆已按時服用',
    bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  };

  if (totalSlotsCount === 0) {
    statusBadge = {
      text: '今日無排程用藥',
      subtext: '今天沒有排定的常規用藥時段',
      bgColor: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: Pill,
      iconColor: 'text-slate-500',
    };
  } else if (hasMissed) {
    statusBadge = {
      text: '有時段尚未服用 / 漏吃',
      subtext: '請盡速確認藥袋指示並登記打卡',
      bgColor: 'bg-amber-50 text-amber-900 border-amber-300',
      icon: AlertCircle,
      iconColor: 'text-amber-600',
    };
  } else if (takenSlotsCount < totalSlotsCount) {
    statusBadge = {
      text: `已服用 ${takenSlotsCount} / ${totalSlotsCount} 個時段`,
      subtext: '進行中，尚有時段待服用',
      bgColor: 'bg-teal-50 text-teal-900 border-teal-300',
      icon: Clock,
      iconColor: 'text-teal-600',
    };
  }

  const BadgeIcon = statusBadge.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 mb-6">
      {/* Header with big "今天吃過了嗎？" action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                今天吃過了嗎？
              </h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bgColor}`}>
                <BadgeIcon className={`w-3.5 h-3.5 ${statusBadge.iconColor}`} />
                <span>{statusBadge.text}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{statusBadge.subtext}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleShareToLine}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#05963f] border border-[#06C755]/30 rounded-lg text-xs font-bold transition-all"
            title="複製今日用藥狀態字串至剪貼簿，可直接貼入 LINE 群組"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? '已複製！' : '分享狀態至 LINE'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenPRNModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            title="記錄止痛藥、急救藥等需要時才吃的藥物"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>需要時服藥(PRN)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label={isExpanded ? '收合' : '展開'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Daily Slots Breakdown */}
      {isExpanded && (
        <div className="mt-4 space-y-2.5">
          {dailySlots.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-3">今日無常規排程用藥。</p>
          ) : (
            dailySlots.map((slot: DailySlot) => {
              const meds = slot.medications;
              return (
                <div
                  key={slot.slotKey}
                  className={`p-3 rounded-xl border transition-all ${
                    slot.isAllTaken
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : slot.hasMissed
                      ? 'bg-amber-50/70 border-amber-200'
                      : slot.isOverdue15
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {slot.timeStr}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{slot.title}</span>
                    </div>

                    {/* Status Badge with Icon + Text + Color */}
                    {slot.isAllTaken ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          ✓ 已於{' '}
                          {slot.medications[0]?.log?.actualTime
                            ? formatTime24(slot.medications[0].log.actualTime)
                            : slot.timeStr}{' '}
                          全部服用
                        </span>
                      </div>
                    ) : slot.hasMissed ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>⚠️ 漏吃 / 尚未服用</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>⏳ 待服用</span>
                      </div>
                    )}
                  </div>

                  {/* Medications list under this slot */}
                  <div className="mt-2 text-xs space-y-1 pl-1">
                    {meds.map(({ med, status, log }) => (
                      <div key={med.id} className="flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">·</span>
                          <span className="font-medium text-slate-900">{med.name}</span>
                          <span className="text-slate-500 font-mono">({med.dosage})</span>
                          {med.appearance?.description && (
                            <span className="text-slate-400 text-[11px] hidden sm:inline">
                              [{med.appearance.description}]
                            </span>
                          )}
                        </div>

                        <div>
                          {status === 'taken' ? (
                            <span className="text-emerald-700 font-mono text-[11px] font-semibold">
                              已吃 ({log?.actualTime ? formatTime24(log.actualTime) : ''})
                              {log?.isForced && (
                                <span className="text-red-600 font-bold ml-1">【強制紀錄】</span>
                              )}
                            </span>
                          ) : status === 'skipped' ? (
                            <span className="text-slate-400 text-[11px]">已跳過</span>
                          ) : status === 'missed' ? (
                            <span className="text-amber-700 font-bold text-[11px]">未吃</span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">未打卡</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Quick link to detailed interactive cards */}
          <div className="pt-1 text-right">
            <button
              type="button"
              onClick={onGoToMedicationsTab}
              className="text-xs text-teal-700 hover:text-teal-900 font-bold hover:underline"
            >
              進入「服藥專區」進行打卡、跳過或延遲提醒 &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
