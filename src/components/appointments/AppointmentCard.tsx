import { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Bike,
  Bus,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  CalendarPlus,
  ShieldAlert,
} from 'lucide-react';
import { Appointment, TransportMode } from '../../types';
import { calculateDepartureTime } from '../../utils/appointmentLogic';
import { formatDateTaipei, formatTime24 } from '../../utils/dateUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  now: Date;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onToggleItemChecked: (appId: string, item: string) => void;
  onCompleteAppointment: (app: Appointment, nextVisitDate?: string) => void;
}

export function AppointmentCard({
  appointment,
  now,
  onEdit,
  onDelete,
  onToggleItemChecked,
  onCompleteAppointment,
}: AppointmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [nextDateInput, setNextDateInput] = useState('');

  const depInfo = calculateDepartureTime(
    appointment.dateTime,
    appointment.transportMode,
    appointment.drivingTime,
    appointment.parkingSearchTime,
    appointment.walkFromParkingTime,
    appointment.checkInEarlyTime,
    appointment.safetyBufferTime,
    now
  );

  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';
  const isRescheduled = appointment.status === 'rescheduled';

  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'car':
        return Car;
      case 'scooter':
        return Bike;
      case 'transit':
        return Bus;
      default:
        return Footprints;
    }
  };

  const getTransportLabel = (mode: TransportMode) => {
    switch (mode) {
      case 'car':
        return '汽車';
      case 'scooter':
        return '機車';
      case 'transit':
        return '大眾運輸';
      default:
        return '步行';
    }
  };

  const TransportIcon = getTransportIcon(appointment.transportMode);

  const handleOpenMaps = () => {
    const query = encodeURIComponent(`${appointment.hospital} ${appointment.address || ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleConfirmCompletion = () => {
    onCompleteAppointment(appointment, nextDateInput || undefined);
    setIsCompleting(false);
  };

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isCompleted
          ? 'bg-emerald-50/40 border-emerald-200'
          : isCancelled
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : depInfo.isOverdue
          ? 'bg-red-50/50 border-red-300 ring-2 ring-red-300/40'
          : depInfo.urgencyLevel === 'urgent'
          ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-300/40'
          : 'bg-white border-slate-200 shadow-xs'
      }`}
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                {formatDateTaipei(appointment.dateTime)} {formatTime24(appointment.dateTime)}
              </span>

              {appointment.number && (
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                  診號：{appointment.number}
                </span>
              )}

              {/* Status Badge */}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>已完成就診</span>
                </span>
              ) : isCancelled ? (
                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                  已取消
                </span>
              ) : depInfo.isOverdue ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-md">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>⚠️ 來不及了，請立刻出發或改約！</span>
                </span>
              ) : depInfo.urgencyLevel === 'urgent' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>🚨 距離出發還有 {depInfo.minutesUntilDeparture} 分鐘</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>預計 {depInfo.departureTimeStr} 出發</span>
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {appointment.hospital}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
              {appointment.department && (
                <span className="font-semibold text-slate-800">
                  {appointment.department}
                </span>
              )}
              {appointment.doctor && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{appointment.doctor}</span>
                </>
              )}
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 font-medium">
                <TransportIcon className="w-3.5 h-3.5 text-slate-500" />
                {getTransportLabel(appointment.transportMode)} (單程約 {appointment.drivingTime} 分)
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
              title="編輯就診"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`確定要刪除「${appointment.hospital}」的就診紀錄嗎？`)) {
                  onDelete(appointment.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
              title="刪除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Departure Timeline Bar */}
        <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>就診出發動態時程推算：</span>
            </span>
            <span className="font-mono font-bold text-teal-800 text-xs">
              最晚出發：{depInfo.departureTimeStr}
            </span>
          </div>

          <div className="font-mono text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 text-center tracking-tight">
            {depInfo.timelineText}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-4 border-t border-slate-100 pt-3 space-y-3">
          {/* Precautions (Only display when filled) */}
          {appointment.precautions && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>就診注意事項：</span>
              </div>
              <p className="leading-relaxed font-medium">{appointment.precautions}</p>
            </div>
          )}

          {/* Items To Bring Checklist */}
          {appointment.itemsToBring && appointment.itemsToBring.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                出發前攜帶物品核對（點選即可打勾）：
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {appointment.itemsToBring.map((item) => {
                  const isChecked = appointment.checkedItems?.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onToggleItemChecked(appointment.id, item)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs text-left border transition-colors ${
                        isChecked
                          ? 'bg-teal-50 border-teal-200 text-teal-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                          isChecked
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={isChecked ? 'line-through text-slate-400' : 'font-medium'}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Address & Notes */}
          {(appointment.address || appointment.notes) && (
            <div className="text-xs text-slate-500 space-y-1">
              {appointment.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{appointment.address}</span>
                </div>
              )}
              {appointment.notes && (
                <div className="text-slate-600 italic">備註：{appointment.notes}</div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleOpenMaps}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Google 地圖路線</span>
            </button>

            {!isCompleted && !isCancelled && (
              <button
                type="button"
                onClick={() => setIsCompleting(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>標記看診完成</span>
              </button>
            )}
          </div>

          {/* Complete with Next Visit Draft popup */}
          {isCompleting && (
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 mt-2 space-y-2.5">
              <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                <CalendarPlus className="w-4 h-4 text-emerald-700" />
                <span>標記完成並預約「下次回診日」一鍵建立複診草稿：</span>
              </h5>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={nextDateInput}
                  onChange={(e) => setNextDateInput(e.target.value)}
                  className="text-xs p-2 bg-white border border-emerald-300 rounded-lg"
                />
                <span className="text-[11px] text-emerald-800">
                  （若有預約下次，將自動帶入本科別與交通參數）
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmCompletion}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  確認完成
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompleting(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
