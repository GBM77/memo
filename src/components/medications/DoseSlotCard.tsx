import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  BellRing,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';
import { Medication, DoseLog, AppSettings } from '../../types';
import { DailySlot, SHAPE_LABELS } from '../../utils/medicationLogic';
import { formatTime24 } from '../../utils/dateUtils';

interface DoseSlotCardProps {
  slot: DailySlot;
  settings: AppSettings;
  onTakeSlot: (slot: DailySlot, medId?: string) => void;
  onSnoozeSlot: (slot: DailySlot, minutes: number) => void;
  onSkipSlot: (slot: DailySlot, reason?: string) => void;
  onOpenHoldConfirm: (med: Medication, slotKey: string, reasonMsg: string, lastTakenStr?: string) => void;
}

export function DoseSlotCard({
  slot,
  settings,
  onTakeSlot,
  onSnoozeSlot,
  onSkipSlot,
}: DoseSlotCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedMeds, setSelectedMeds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of slot.medications) {
      init[item.med.id] = item.status !== 'taken' && item.status !== 'skipped';
    }
    return init;
  });

  const allTaken = slot.isAllTaken;
  const isOverdue = slot.hasMissed || slot.isOverdue30;
  const isDelayed15 = !allTaken && slot.isOverdue15;

  const toggleSelectMed = (medId: string) => {
    setSelectedMeds((prev) => ({ ...prev, [medId]: !prev[medId] }));
  };

  const handleTakeBatch = () => {
    onTakeSlot(slot);
  };

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        allTaken
          ? 'bg-emerald-50/60 border-emerald-200'
          : isOverdue
          ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/40'
          : isDelayed15
          ? 'bg-amber-50/50 border-amber-200'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      {/* Slot Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              allTaken
                ? 'bg-emerald-500 text-white'
                : isOverdue
                ? 'bg-amber-500 text-white'
                : 'bg-teal-600 text-white'
            }`}
          >
            {allTaken ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            ) : isOverdue ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {slot.timeStr}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {slot.title}
              </h3>

              {/* Status Badge */}
              {allTaken ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    ✓ 已於{' '}
                    {slot.medications[0]?.log?.actualTime
                      ? formatTime24(slot.medications[0].log.actualTime)
                      : slot.timeStr}{' '}
                    服用
                  </span>
                </span>
              ) : isOverdue ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>⚠️ 漏吃（已逾時 {slot.minutesOverdue} 分鐘）</span>
                </span>
              ) : isDelayed15 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>已延遲 {slot.minutesOverdue} 分鐘，請服用</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-100/70 px-2.5 py-1 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>準時提醒 · 待服用</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              本時段共 {slot.medications.length} 種藥物合併提醒
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          aria-label={isExpanded ? '收合' : '展開'}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Overdue Safety Reminder Note if overdue */}
      {isOverdue && !allTaken && (
        <div className="mx-4 sm:mx-5 mb-3 p-3 bg-amber-100/80 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">漏吃了，請依藥袋說明或詢問藥師/醫師，不要自行加倍服用。</span>
            {settings.pharmacyPhone && (
              <span className="block mt-0.5 text-amber-800">
                藥局諮詢電話：
                <a href={`tel:${settings.pharmacyPhone}`} className="underline font-bold text-amber-950">
                  {settings.pharmacyPhone}
                </a>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Medications List in this slot */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 space-y-3">
          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            {slot.medications.map(({ med, status, log, isSnoozed, snoozedUntil }) => {
              const isTaken = status === 'taken';
              const isSkipped = status === 'skipped';

              return (
                <div
                  key={med.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isTaken
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : isSkipped
                      ? 'bg-slate-100/70 border-slate-200 text-slate-400'
                      : 'bg-slate-50 border-slate-200/80 text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox for batch or indicator */}
                      <button
                        type="button"
                        disabled={isTaken}
                        onClick={() => toggleSelectMed(med.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                          isTaken
                            ? 'bg-emerald-600 border-emerald-600 text-white cursor-default'
                            : selectedMeds[med.id]
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 bg-white hover:border-teal-500'
                        }`}
                      >
                        {(isTaken || selectedMeds[med.id]) && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-slate-900">
                            {med.name}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                            {med.dosage}
                          </span>
                          {med.purpose && (
                            <span className="text-xs text-slate-500">
                              · 用途：{med.purpose}
                            </span>
                          )}
                        </div>

                        {/* Appearance description */}
                        {med.appearance && (
                          <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-medium">
                              🎨 外觀：{med.appearance.color} {SHAPE_LABELS[med.appearance.shape] || ''}
                            </span>
                            {med.appearance.description && (
                              <span className="text-slate-500 text-[11px]">
                                {med.appearance.description}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Food notes if any */}
                        {med.foodNotes && (
                          <p className="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded-md mt-1.5 border border-amber-200/50">
                            ⚠️ 飲食注意：{med.foodNotes}
                          </p>
                        )}

                        {/* Status text */}
                        <div className="mt-1.5 text-xs">
                          {isTaken ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              已於 {log?.actualTime ? formatTime24(log.actualTime) : ''} 服用
                              {log?.isForced && (
                                <span className="text-red-600 font-bold ml-1">【強制紀錄】</span>
                              )}
                            </span>
                          ) : isSkipped ? (
                            <span className="text-slate-400">已略過此次服用</span>
                          ) : isSnoozed ? (
                            <span className="text-teal-700 font-medium">
                              🔔 已延遲提醒至 {snoozedUntil ? formatTime24(snoozedUntil) : '10分鐘後'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Single take button if needed */}
                    {!isTaken && !allTaken && (
                      <button
                        type="button"
                        onClick={() => onTakeSlot(slot, med.id)}
                        className="px-3 py-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-50 border border-teal-300 rounded-lg shrink-0 shadow-2xs"
                      >
                        單獨打卡
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons bar */}
          {!allTaken ? (
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Primary "我吃了" check-in button */}
              <button
                type="button"
                onClick={handleTakeBatch}
                className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>我吃了（本時段全打卡）</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Snooze 10 mins */}
                <button
                  type="button"
                  onClick={() => onSnoozeSlot(slot, 10)}
                  className="flex-1 sm:flex-initial py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BellRing className="w-4 h-4 text-slate-500" />
                  <span>10分鐘後再提醒</span>
                </button>

                {/* Skip */}
                <button
                  type="button"
                  onClick={() => onSkipSlot(slot)}
                  className="flex-1 sm:flex-initial py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>這次跳過</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-center text-xs text-emerald-800 font-semibold bg-emerald-100/50 py-2 rounded-xl border border-emerald-200">
              ✓ 本時段所有藥物已完成打卡，系統已自動取消後續重複提醒。
            </div>
          )}
        </div>
      )}
    </div>
  );
}
