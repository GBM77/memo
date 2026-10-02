import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Car,
  Bike,
  Bus,
  Footprints,
  AlertTriangle,
  Check,
  Plus,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Appointment, Medication, TransportMode, AppSettings } from '../../types';
import {
  calculateDepartureTime,
  getPreviousHospitalParams,
  checkAppointmentConflicts,
  generateDefaultItemsToBring,
} from '../../utils/appointmentLogic';
import { toDateInputValue, formatTime24 } from '../../utils/dateUtils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (app: Appointment) => void;
  initialAppointment?: Partial<Appointment> | null;
  existingAppointments: Appointment[];
  activeMedications: Medication[];
  settings: AppSettings;
  now: Date;
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  initialAppointment,
  existingAppointments,
  activeMedications,
  settings,
  now,
}: AppointmentModalProps) {
  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [dateStr, setDateStr] = useState(toDateInputValue());
  const [timeStr, setTimeStr] = useState('14:30');
  const [number, setNumber] = useState('');
  const [address, setAddress] = useState('');
  const [transportMode, setTransportMode] = useState<TransportMode>(settings.defaultTransportMode || 'car');
  const [drivingTime, setDrivingTime] = useState<number>(25);
  const [parkingSearchTime, setParkingSearchTime] = useState<number>(15);
  const [walkFromParkingTime, setWalkFromParkingTime] = useState<number>(5);
  const [checkInEarlyTime, setCheckInEarlyTime] = useState<number>(settings.defaultCheckInEarlyMinutes || 15);
  const [safetyBufferTime, setSafetyBufferTime] = useState<number>(settings.defaultSafetyBufferMinutes || 10);
  const [itemsToBring, setItemsToBring] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [newItemInput, setNewItemInput] = useState('');
  const [precautions, setPrecautions] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'completed' | 'rescheduled' | 'cancelled'>('upcoming');

  // Past unique hospitals for quick selection
  const pastHospitals = Array.from(new Set(existingAppointments.map((a) => a.hospital.trim()).filter(Boolean)));

  useEffect(() => {
    if (initialAppointment) {
      setHospital(initialAppointment.hospital || '');
      setDepartment(initialAppointment.department || '');
      setDoctor(initialAppointment.doctor || '');
      if (initialAppointment.dateTime) {
        const parts = initialAppointment.dateTime.split('T');
        setDateStr(parts[0] || toDateInputValue());
        setTimeStr(parts[1]?.slice(0, 5) || '14:30');
      }
      setNumber(initialAppointment.number || '');
      setAddress(initialAppointment.address || '');
      setTransportMode(initialAppointment.transportMode || settings.defaultTransportMode || 'car');
      setDrivingTime(initialAppointment.drivingTime ?? 25);
      setParkingSearchTime(initialAppointment.parkingSearchTime ?? 15);
      setWalkFromParkingTime(initialAppointment.walkFromParkingTime ?? 5);
      setCheckInEarlyTime(initialAppointment.checkInEarlyTime ?? settings.defaultCheckInEarlyMinutes ?? 15);
      setSafetyBufferTime(initialAppointment.safetyBufferTime ?? settings.defaultSafetyBufferMinutes ?? 10);
      setItemsToBring(
        initialAppointment.itemsToBring && initialAppointment.itemsToBring.length > 0
          ? initialAppointment.itemsToBring
          : generateDefaultItemsToBring(activeMedications)
      );
      setCheckedItems(initialAppointment.checkedItems || []);
      setPrecautions(initialAppointment.precautions || '');
      setNotes(initialAppointment.notes || '');
      setStatus(initialAppointment.status || 'upcoming');
    } else {
      // New appointment
      setHospital('');
      setDepartment('');
      setDoctor('');
      setDateStr(toDateInputValue());
      setTimeStr('14:30');
      setNumber('');
      setAddress('');
      setTransportMode(settings.defaultTransportMode || 'car');
      setDrivingTime(25);
      setParkingSearchTime(15);
      setWalkFromParkingTime(5);
      setCheckInEarlyTime(settings.defaultCheckInEarlyMinutes || 15);
      setSafetyBufferTime(settings.defaultSafetyBufferMinutes || 10);
      const defaults = generateDefaultItemsToBring(activeMedications);
      setItemsToBring(defaults);
      setCheckedItems(['健保卡', '身分證 / 健保快易通']);
      setPrecautions('');
      setNotes('');
      setStatus('upcoming');
    }
  }, [initialAppointment, isOpen]);

  if (!isOpen) return null;

  // Hospital auto-populate previous params
  const handleSelectHospital = (name: string) => {
    setHospital(name);
    const prevParams = getPreviousHospitalParams(name, existingAppointments);
    if (prevParams) {
      if (prevParams.address) setAddress(prevParams.address);
      if (prevParams.transportMode) setTransportMode(prevParams.transportMode);
      if (prevParams.drivingTime !== undefined) setDrivingTime(prevParams.drivingTime);
      if (prevParams.parkingSearchTime !== undefined) setParkingSearchTime(prevParams.parkingSearchTime);
      if (prevParams.walkFromParkingTime !== undefined) setWalkFromParkingTime(prevParams.walkFromParkingTime);
      if (prevParams.checkInEarlyTime !== undefined) setCheckInEarlyTime(prevParams.checkInEarlyTime);
      if (prevParams.safetyBufferTime !== undefined) setSafetyBufferTime(prevParams.safetyBufferTime);
    }
  };

  // Real-time departure calculation
  const fullDateTime = `${dateStr}T${timeStr}:00`;
  const depCalculation = calculateDepartureTime(
    fullDateTime,
    transportMode,
    drivingTime,
    parkingSearchTime,
    walkFromParkingTime,
    checkInEarlyTime,
    safetyBufferTime,
    now
  );

  // Real-time conflict check
  const conflictCheck = checkAppointmentConflicts(
    {
      id: initialAppointment?.id,
      dateTime: fullDateTime,
      drivingTime,
      checkInEarlyTime,
    },
    existingAppointments
  );

  const handleAddItem = () => {
    if (!newItemInput.trim()) return;
    if (!itemsToBring.includes(newItemInput.trim())) {
      setItemsToBring([...itemsToBring, newItemInput.trim()]);
    }
    setNewItemInput('');
  };

  const handleToggleCheckItem = (item: string) => {
    if (checkedItems.includes(item)) {
      setCheckedItems(checkedItems.filter((i) => i !== item));
    } else {
      setCheckedItems([...checkedItems, item]);
    }
  };

  const handleRemoveItem = (item: string) => {
    setItemsToBring(itemsToBring.filter((i) => i !== item));
    setCheckedItems(checkedItems.filter((i) => i !== item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital.trim()) return;

    const appointmentToSave: Appointment = {
      id: initialAppointment?.id || `app-${Date.now()}`,
      hospital: hospital.trim(),
      department: department.trim(),
      doctor: doctor.trim(),
      dateTime: `${dateStr}T${timeStr}`,
      number: number.trim(),
      address: address.trim(),
      transportMode,
      drivingTime: Number(drivingTime) || 0,
      parkingSearchTime: (transportMode === 'car' || transportMode === 'scooter') ? Number(parkingSearchTime) || 0 : 0,
      walkFromParkingTime: Number(walkFromParkingTime) || 0,
      checkInEarlyTime: Number(checkInEarlyTime) || 0,
      safetyBufferTime: Number(safetyBufferTime) || 0,
      itemsToBring,
      checkedItems,
      precautions: precautions.trim(),
      status,
      notes: notes.trim(),
      nextVisitDate: initialAppointment?.nextVisitDate,
      createdAt: initialAppointment?.createdAt || new Date().toISOString(),
    };

    onSave(appointmentToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {initialAppointment?.id ? '編輯就診行程' : '新增就診提醒'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Hospital Selection with Previous Suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              就診醫院 / 診所名稱 *
            </label>
            <input
              type="text"
              required
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="例如：國立臺灣大學醫學院附設醫院 (總院)"
              className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            {pastHospitals.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  點選自動帶入上次交通參數：
                </span>
                {pastHospitals.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelectHospital(h)}
                    className="text-[11px] px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-md border border-teal-200"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Department, Doctor, Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                科別
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="如 心臟內科、新陳代謝科"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                醫師姓名
              </label>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="如 林醫師"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                診號 / 看診號碼
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="如 28 號"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                看診日期 *
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                預定看診時間 (24小時制) *
              </label>
              <input
                type="time"
                required
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              醫院地址（便於一鍵導航）
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="如 台北市中正區中山南路 7 號"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          {/* Transportation Mode */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">
              交通方式與車程參數設定
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'car', label: '汽車', icon: Car },
                { id: 'scooter', label: '機車', icon: Bike },
                { id: 'transit', label: '大眾運輸', icon: Bus },
                { id: 'walk', label: '步行', icon: Footprints },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTransportMode(item.id as TransportMode)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                      transportMode === item.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Individual minute adjustments */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  單程車程 (分)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setDrivingTime(Math.max(0, drivingTime - 5))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-l-lg text-xs hover:bg-slate-100"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={drivingTime}
                    onChange={(e) => setDrivingTime(Number(e.target.value))}
                    className="w-full text-center text-xs p-1 bg-white border-y border-slate-300 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setDrivingTime(drivingTime + 5)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-r-lg text-xs hover:bg-slate-100"
                  >
                    +5
                  </button>
                </div>
              </div>

              {(transportMode === 'car' || transportMode === 'scooter') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    找車位時間 (分)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setParkingSearchTime(Math.max(0, parkingSearchTime - 5))}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-l-lg text-xs hover:bg-slate-100"
                    >
                      -5
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={parkingSearchTime}
                      onChange={(e) => setParkingSearchTime(Number(e.target.value))}
                      className="w-full text-center text-xs p-1 bg-white border-y border-slate-300 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setParkingSearchTime(parkingSearchTime + 5)}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-r-lg text-xs hover:bg-slate-100"
                    >
                      +5
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  停車後步行 (分)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setWalkFromParkingTime(Math.max(0, walkFromParkingTime - 5))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-l-lg text-xs hover:bg-slate-100"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={walkFromParkingTime}
                    onChange={(e) => setWalkFromParkingTime(Number(e.target.value))}
                    className="w-full text-center text-xs p-1 bg-white border-y border-slate-300 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setWalkFromParkingTime(walkFromParkingTime + 5)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-r-lg text-xs hover:bg-slate-100"
                  >
                    +5
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  提前報到時間 (分)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCheckInEarlyTime(Math.max(0, checkInEarlyTime - 5))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-l-lg text-xs hover:bg-slate-100"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={checkInEarlyTime}
                    onChange={(e) => setCheckInEarlyTime(Number(e.target.value))}
                    className="w-full text-center text-xs p-1 bg-white border-y border-slate-300 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setCheckInEarlyTime(checkInEarlyTime + 5)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-r-lg text-xs hover:bg-slate-100"
                  >
                    +5
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  安全緩衝時間 (分)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setSafetyBufferTime(Math.max(0, safetyBufferTime - 5))}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-l-lg text-xs hover:bg-slate-100"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={safetyBufferTime}
                    onChange={(e) => setSafetyBufferTime(Number(e.target.value))}
                    className="w-full text-center text-xs p-1 bg-white border-y border-slate-300 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setSafetyBufferTime(safetyBufferTime + 5)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-r-lg text-xs hover:bg-slate-100"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            {/* REAL-TIME DEPARTURE TIMELINE PREVIEW */}
            <div className="mt-3 p-3.5 bg-white rounded-xl border border-teal-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span>⏱️ 最晚出發時間即時推算：</span>
                <span className="text-base text-teal-800 font-black font-mono">
                  {depCalculation.departureTimeStr} 出發
                </span>
              </div>

              {/* Timeline string representation */}
              <div className="text-xs font-mono font-semibold text-teal-900 bg-teal-50/70 p-2.5 rounded-lg border border-teal-200/60 leading-relaxed text-center">
                {depCalculation.timelineText}
              </div>

              {/* Overdue alert if departure has passed */}
              {depCalculation.isOverdue && (
                <div className="mt-2.5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">⚠️ 來不及了，請立刻出發或改約！</span>
                    <span className="block mt-0.5 text-red-700">
                      推算的最晚出發時間（{depCalculation.departureTimeStr}）已早於現在，若現在啟程可能會錯過門診報到。
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CONFLICT ALERT */}
            {conflictCheck.hasConflict && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{conflictCheck.message}</span>
              </div>
            )}
          </div>

          {/* Items to bring */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">
                攜帶物品清單（自動納入使用中藥品與健保卡）
              </h4>
            </div>

            <div className="space-y-1.5">
              {itemsToBring.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={checkedItems.includes(item)}
                      onChange={() => handleToggleCheckItem(item)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className={checkedItems.includes(item) ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                      {item}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    className="text-slate-400 hover:text-red-600 px-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newItemInput}
                onChange={(e) => setNewItemInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                placeholder="新增攜帶物品（如：血糖紀錄單、老花眼鏡）"
                className="flex-1 text-xs p-2 bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
              >
                新增
              </button>
            </div>
          </div>

          {/* Precautions (Only displayed when user enters content) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              注意事項（空腹8小時、停藥指示等，僅顯示自填內容）
            </label>
            <textarea
              rows={2}
              value={precautions}
              onChange={(e) => setPrecautions(e.target.value)}
              placeholder="例如：看診前需空腹 8 小時抽血檢查（可少量飲用溫開水）；攜帶居家量測血壓紀錄本。"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              就診備註 / 交通位置指引
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：醫療大樓 2 樓 12 診間，先插卡報到"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              看診狀態
            </label>
            <div className="flex items-center gap-3 text-xs">
              {[
                { id: 'upcoming', label: '待看診' },
                { id: 'completed', label: '已完成' },
                { id: 'rescheduled', label: '已改約' },
                { id: 'cancelled', label: '已取消' },
              ].map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === s.id}
                    onChange={() => setStatus(s.id as any)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              儲存就診
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
