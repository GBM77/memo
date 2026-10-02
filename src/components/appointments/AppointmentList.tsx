import { useState } from 'react';
import { Plus, Calendar, Filter, Camera } from 'lucide-react';
import { Appointment, Medication, AppSettings } from '../../types';
import { AppointmentCard } from './AppointmentCard';
import { AppointmentModal } from './AppointmentModal';

interface AppointmentListProps {
  now: Date;
  appointments: Appointment[];
  activeMedications: Medication[];
  settings: AppSettings;
  onSaveAppointment: (app: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onToggleItemChecked: (appId: string, item: string) => void;
  onCompleteAppointment: (app: Appointment, nextVisitDate?: string) => void;
  onShowToast: (msg: string) => void;
  prefilledDraft?: Partial<Appointment> | null;
  onClearDraft?: () => void;
  onOpenScanModal?: () => void;
}

export function AppointmentList({
  now,
  appointments,
  activeMedications,
  settings,
  onSaveAppointment,
  onDeleteAppointment,
  onToggleItemChecked,
  onCompleteAppointment,
  onShowToast,
  prefilledDraft,
  onClearDraft,
  onOpenScanModal,
}: AppointmentListProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Partial<Appointment> | null>(null);

  // If there's a prefilled draft from low stock or next visit
  const handleOpenNewWithDraft = (draft?: Partial<Appointment>) => {
    setEditingApp(draft || null);
    setIsModalOpen(true);
  };

  const filtered = appointments
    .filter((a) => {
      if (filter === 'upcoming') return a.status === 'upcoming';
      if (filter === 'completed') return a.status === 'completed';
      return true;
    })
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <span>就診行程與最晚出發倒數</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            最晚出發時間即時推算 · 停車步行緩衝 · 同日衝突預警 · 自動帶入常用醫院
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenScanModal && (
            <button
              type="button"
              onClick={onOpenScanModal}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold transition-colors"
            >
              <Camera className="w-4 h-4 text-teal-600" />
              <span>拍照辨識掛號單</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenNewWithDraft(prefilledDraft || undefined)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新增就診行程</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-xs">
        <button
          type="button"
          onClick={() => setFilter('upcoming')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filter === 'upcoming'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          待看診 (
          {appointments.filter((a) => a.status === 'upcoming').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filter === 'completed'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          已完成 (
          {appointments.filter((a) => a.status === 'completed').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          全部 ({appointments.length})
        </button>
      </div>

      {/* Appointment Cards */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          {filter === 'upcoming' ? '目前沒有待看診的就診行程。' : '目前尚無相關就診記錄。'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <AppointmentCard
              key={app.id}
              appointment={app}
              now={now}
              onEdit={(a) => {
                setEditingApp(a);
                setIsModalOpen(true);
              }}
              onDelete={onDeleteAppointment}
              onToggleItemChecked={onToggleItemChecked}
              onCompleteAppointment={(a, nextDate) => {
                onCompleteAppointment(a, nextDate);
                if (nextDate) {
                  onShowToast(`✓ 已標記完成，並為您建立 ${nextDate} 複診草稿！`);
                } else {
                  onShowToast(`✓ 已標記完成！`);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Appointment Modal */}
      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingApp(null);
            if (onClearDraft) onClearDraft();
          }}
          onSave={(saved) => {
            onSaveAppointment(saved);
            onShowToast('✓ 就診行程已儲存！');
            if (onClearDraft) onClearDraft();
          }}
          initialAppointment={editingApp}
          existingAppointments={appointments}
          activeMedications={activeMedications}
          settings={settings}
          now={now}
        />
      )}
    </div>
  );
}
