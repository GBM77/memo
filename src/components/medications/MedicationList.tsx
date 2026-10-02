import { useState } from 'react';
import {
  Plus,
  Printer,
  TrendingUp,
  Share2,
  Package,
  ArrowRight,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  CalendarCheck2,
  Pill,
  Camera,
} from 'lucide-react';
import { Medication, DoseLog, AppSettings, Appointment } from '../../types';
import {
  getDailySlots,
  calculateRemainingDays,
  generateLineShareText,
  DailySlot,
  TIMING_LABELS,
  SHAPE_LABELS,
} from '../../utils/medicationLogic';
import { DoseSlotCard } from './DoseSlotCard';
import { PRNModal } from './PRNModal';
import { HoldToConfirmModal } from './HoldToConfirmModal';
import { WeeklyScheduleModal } from './WeeklyScheduleModal';
import { AdherenceStatsModal } from './AdherenceStatsModal';
import { MedicationModal } from './MedicationModal';
import { SafetyBanner } from '../common/SafetyBanner';
import { formatTime24 } from '../../utils/dateUtils';

interface MedicationListProps {
  now: Date;
  medications: Medication[];
  doseLogs: DoseLog[];
  settings: AppSettings;
  onSaveMedication: (med: Medication) => void;
  onDeleteMedication: (id: string) => void;
  onToggleActive: (id: string) => void;
  onTakeDose: (medId: string, slotKey: string, slotName: string, scheduledTime: string, isForced?: boolean, forcedReason?: string) => void;
  onSnoozeDose: (medId: string, slotKey: string, minutes: number) => void;
  onSkipDose: (medId: string, slotKey: string, reason?: string) => void;
  onCreateAppointmentDraft: (draft: Partial<Appointment>) => void;
  onShowToast: (msg: string) => void;
  onOpenScanModal?: () => void;
}

export function MedicationList({
  now,
  medications,
  doseLogs,
  settings,
  onSaveMedication,
  onDeleteMedication,
  onToggleActive,
  onTakeDose,
  onSnoozeDose,
  onSkipDose,
  onCreateAppointmentDraft,
  onShowToast,
  onOpenScanModal,
}: MedicationListProps) {
  const [subView, setSubView] = useState<'slots' | 'manage' | 'logs'>('slots');
  const [isPRNModalOpen, setIsPRNModalOpen] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);

  // Hold to confirm modal state
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

  const dailySlots = getDailySlots(now, medications, doseLogs, settings, now);

  // Low stock medications
  const lowStockMeds = medications.filter(
    (m) => m.isActive && calculateRemainingDays(m) <= settings.lowStockThresholdDays
  );

  // Share to LINE
  const handleShareToLine = () => {
    const todayStr = now.toISOString().split('T')[0];
    const prnLogs = doseLogs.filter(
      (l) => l.slotKey.startsWith('prn') && l.actualTime?.startsWith(todayStr)
    );
    const text = generateLineShareText(now, dailySlots, prnLogs);
    navigator.clipboard.writeText(text).then(() => {
      onShowToast('✓ 已複製今日用藥狀態文字！可直接切換至 LINE 貼上給家人。');
    });
  };

  const handleTakeSlot = (slot: DailySlot, specificMedId?: string) => {
    const targetMeds = specificMedId
      ? slot.medications.filter((m) => m.med.id === specificMedId)
      : slot.medications;

    for (const item of targetMeds) {
      if (item.status === 'taken') {
        // Already taken in this slot -> Trigger Duplicate Warning!
        const lastTakenStr = item.log?.actualTime ? formatTime24(item.log.actualTime) : '';
        setHoldModalData({
          isOpen: true,
          med: item.med,
          slotKey: slot.slotKey,
          warningMessage: `你在 ${lastTakenStr || '稍早'} 已吃過此藥品，請勿重複服用！如需更正紀錄，請長按 2 秒確認強制記錄。`,
          lastTakenTimeText: `前次打卡：${lastTakenStr || slot.timeStr} (已記錄服用)`,
        });
        return;
      }

      // Check min interval from last dose
      const todayTakenLogs = doseLogs
        .filter(
          (l) =>
            l.medicationId === item.med.id &&
            l.status === 'taken' &&
            l.actualTime
        )
        .sort((a, b) => new Date(b.actualTime!).getTime() - new Date(a.actualTime!).getTime());

      if (todayTakenLogs.length > 0 && item.med.minIntervalHours > 0) {
        const lastLog = todayTakenLogs[0];
        const lastDate = new Date(lastLog.actualTime!);
        const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

        if (diffHours < item.med.minIntervalHours) {
          const waitMins = Math.ceil((item.med.minIntervalHours - diffHours) * 60);
          setHoldModalData({
            isOpen: true,
            med: item.med,
            slotKey: slot.slotKey,
            warningMessage: `距離上次服用僅間隔 ${diffHours.toFixed(1)} 小時，未達規定最短間隔 ${item.med.minIntervalHours} 小時！還需等待約 ${waitMins} 分鐘。請勿提早重複服藥。`,
            lastTakenTimeText: `上次服用時間：${formatTime24(lastDate)}`,
          });
          return;
        }
      }

      // Normal check in
      onTakeDose(item.med.id, slot.slotKey, slot.title, slot.fullDateTimeStr);
    }

    onShowToast(`✓ 已記錄完成 ${slot.title} 服藥打卡！`);
  };

  const handleHoldConfirm = (forcedReason: string) => {
    if (holdModalData.med) {
      onTakeDose(
        holdModalData.med.id,
        holdModalData.slotKey,
        '強制更正紀錄',
        now.toISOString(),
        true,
        forcedReason
      );
      setHoldModalData({ isOpen: false, slotKey: '', warningMessage: '' });
      onShowToast('⚠️ 已強制記錄服藥更正！');
    }
  };

  const handleSnoozeSlot = (slot: DailySlot, minutes: number) => {
    for (const item of slot.medications) {
      if (item.status !== 'taken') {
        onSnoozeDose(item.med.id, slot.slotKey, minutes);
      }
    }
    onShowToast(`🔔 已延遲 ${minutes} 分鐘後再次提醒！`);
  };

  const handleSkipSlot = (slot: DailySlot) => {
    for (const item of slot.medications) {
      if (item.status !== 'taken') {
        onSkipDose(item.med.id, slot.slotKey, '使用者選擇跳過');
      }
    }
    onShowToast(`⚪ 已標記為跳過此次服藥。`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <span>服藥專區（最高優先級防呆機制）</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            防重複服藥 · 防漏吃提醒階梯 · 剩餘天數推算 · 遵從率統計
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenScanModal && (
            <button
              type="button"
              onClick={onOpenScanModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>拍照辨識藥袋</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareToLine}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#05963f] border border-[#06C755]/30 rounded-xl text-xs font-bold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>分享今日狀態 (LINE)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWeeklyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>每週課表</span>
          </button>

          <button
            type="button"
            onClick={() => setIsStatsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>30天遵從率</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockMeds.length > 0 && (
        <div className="space-y-2">
          {lowStockMeds.map((med) => {
            const days = calculateRemainingDays(med);
            return (
              <div
                key={med.id}
                className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950"
              >
                <div className="flex items-start gap-2.5">
                  <Package className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-900">
                      藥品即將用罄：{med.name}（剩餘 {med.totalStock} 顆，約 {days} 天份）
                    </h4>
                    <p className="text-xs text-amber-800">
                      庫存已低於警戒天數（{settings.lowStockThresholdDays} 天），請安排門診領取連續處方箋或至健保藥局領藥。
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onCreateAppointmentDraft({
                      hospital: '就近健保藥局 / 門診',
                      department: '慢性病回診領藥',
                      notes: `【${med.name}】存量僅剩 ${days} 天份，安排回診領藥`,
                    });
                  }}
                  className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors self-end sm:self-center"
                >
                  <span>一鍵建立領藥就診草稿</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => setSubView('slots')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            subView === 'slots'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          今日時段打卡 ({dailySlots.length})
        </button>
        <button
          type="button"
          onClick={() => setSubView('manage')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            subView === 'manage'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          藥品清單與庫存 ({medications.length})
        </button>
        <button
          type="button"
          onClick={() => setSubView('logs')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            subView === 'logs'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          打卡歷史紀錄
        </button>
      </div>

      {/* SUB-VIEW 1: TODAY'S SLOTS */}
      {subView === 'slots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              今日服藥時程（同時間多種藥已合併）
            </h3>
            <button
              type="button"
              onClick={() => setIsPRNModalOpen(true)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
            >
              <span>+ 需要時才吃 (PRN) 打卡</span>
            </button>
          </div>

          {dailySlots.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              今日無排定服藥時段。若有需要可使用「需要時服藥」或點擊上方「藥品清單」新增常用藥物。
            </div>
          ) : (
            <div className="space-y-4">
              {dailySlots.map((slot) => (
                <DoseSlotCard
                  key={slot.slotKey}
                  slot={slot}
                  settings={settings}
                  onTakeSlot={handleTakeSlot}
                  onSnoozeSlot={handleSnoozeSlot}
                  onSkipSlot={handleSkipSlot}
                  onOpenHoldConfirm={(med, slotKey, reasonMsg, lastTakenStr) => {
                    setHoldModalData({
                      isOpen: true,
                      med,
                      slotKey,
                      warningMessage: reasonMsg,
                      lastTakenTimeText: lastTakenStr,
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: MEDICATIONS MANAGEMENT */}
      {subView === 'manage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              所有藥品資料庫（{medications.length} 種）
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingMed(null);
                setIsAddEditOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新增藥品</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => {
              const daysLeft = calculateRemainingDays(med);
              const isLow = daysLeft <= settings.lowStockThresholdDays;

              return (
                <div
                  key={med.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                    !med.isActive
                      ? 'border-slate-200 opacity-60'
                      : isLow
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-slate-900">{med.name}</h4>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md">
                          {med.dosage}
                        </span>
                        {!med.isActive && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            已暫停
                          </span>
                        )}
                      </div>
                      {med.purpose && (
                        <p className="text-xs text-slate-500 mt-1">用途：{med.purpose}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleActive(med.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        title={med.isActive ? '暫停此藥物提醒' : '恢復啟用提醒'}
                      >
                        {med.isActive ? (
                          <ToggleRight className="w-5 h-5 text-teal-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMed(med);
                          setIsAddEditOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
                        title="編輯藥品"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`確定要刪除「${med.name}」嗎？`)) {
                            onDeleteMedication(med.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Appearance & Photo */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>
                        🎨 外觀：{med.appearance?.color} {SHAPE_LABELS[med.appearance?.shape] || ''}
                      </span>
                      <span className="font-semibold">
                        庫存：
                        <span className={isLow ? 'text-amber-700 font-bold' : 'text-slate-900'}>
                          {med.totalStock} 顆 (約 {daysLeft} 天)
                        </span>
                      </span>
                    </div>
                    {med.appearance?.description && (
                      <p className="text-slate-500 text-[11px]">{med.appearance.description}</p>
                    )}
                    {med.foodNotes && (
                      <p className="text-amber-800 text-[11px] font-medium pt-1 border-t border-slate-200/60">
                        ⚠️ {med.foodNotes}
                      </p>
                    )}
                  </div>

                  {/* Timings preview */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex flex-wrap gap-1">
                      {med.frequency === 'prn' ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                          需要時才吃 (PRN)
                        </span>
                      ) : (
                        med.timings.map((t) => (
                          <span
                            key={t}
                            className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                          >
                            {TIMING_LABELS[t]}
                          </span>
                        ))
                      )}
                    </div>
                    <span className="font-mono text-[11px]">
                      最短隔 {med.minIntervalHours}h · 上限 {med.maxDailyDoses}次/天
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: DOSE LOGS */}
      {subView === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">服藥紀錄（按時間倒序）</h3>

          {doseLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">目前尚無服用打卡紀錄。</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {doseLogs
                .slice()
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((log) => (
                  <div key={log.id} className="pt-2 pb-1 flex items-start justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.medicationName}</span>
                        <span className="text-slate-500 font-mono">[{log.slotName}]</span>
                        {log.isForced && (
                          <span className="text-red-700 bg-red-100 px-1.5 py-0.2 rounded font-bold">
                            ⚠️ 強制更正
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        實際時間：{log.actualTime || '未記載'}
                        {log.forcedReason && ` · 原因：${log.forcedReason}`}
                        {log.notes && ` · 備註：${log.notes}`}
                      </div>
                    </div>

                    <div>
                      {log.status === 'taken' ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ 已服用
                        </span>
                      ) : log.status === 'skipped' ? (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          ⚪ 跳過
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          ⚠️ 漏吃
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Safety Banner */}
      <SafetyBanner settings={settings} />

      {/* Modals */}
      <PRNModal
        isOpen={isPRNModalOpen}
        onClose={() => setIsPRNModalOpen(false)}
        medications={medications}
        doseLogs={doseLogs}
        now={now}
        onConfirmPRN={(med, notes) => {
          onTakeDose(
            med.id,
            `prn_${Date.now()}`,
            '需要時服用 (PRN)',
            now.toISOString(),
            false,
            notes
          );
          onShowToast(`✓ 已記錄【${med.name}】需要時服用打卡！`);
        }}
      />

      <HoldToConfirmModal
        isOpen={holdModalData.isOpen}
        onClose={() => setHoldModalData({ isOpen: false, slotKey: '', warningMessage: '' })}
        onConfirm={handleHoldConfirm}
        warningMessage={holdModalData.warningMessage}
        medicationName={holdModalData.med?.name || ''}
        lastTakenTimeText={holdModalData.lastTakenTimeText}
      />

      <WeeklyScheduleModal
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        medications={medications}
        settings={settings}
      />

      <AdherenceStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        medications={medications}
        doseLogs={doseLogs}
        settings={settings}
        now={now}
      />

      {isAddEditOpen && (
        <MedicationModal
          isOpen={isAddEditOpen}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditingMed(null);
          }}
          onSave={onSaveMedication}
          initialMed={editingMed}
        />
      )}
    </div>
  );
}
