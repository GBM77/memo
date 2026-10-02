import { useState, useEffect } from 'react';
import {
  X,
  Pill,
  Camera,
  Calendar,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  Medication,
  MedicationTiming,
  MedicationFrequency,
  MedicationShape,
} from '../../types';
import { toDateInputValue } from '../../utils/dateUtils';
import { TIMING_LABELS, calculateRemainingDays } from '../../utils/medicationLogic';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (med: Medication) => void;
  initialMed?: Medication | null;
}

const SHAPES: { id: MedicationShape; label: string }[] = [
  { id: 'round', label: '圓形錠劑' },
  { id: 'oval', label: '橢圓錠劑' },
  { id: 'capsule', label: '膠囊' },
  { id: 'square', label: '方形錠劑' },
  { id: 'other', label: '其他/水劑/粉末' },
];

const WEEKDAY_OPTIONS = [
  { val: 1, label: '週一' },
  { val: 2, label: '週二' },
  { val: 3, label: '週三' },
  { val: 4, label: '週四' },
  { val: 5, label: '週五' },
  { val: 6, label: '週六' },
  { val: 0, label: '週日' },
];

export function MedicationModal({
  isOpen,
  onClose,
  onSave,
  initialMed,
}: MedicationModalProps) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dosage, setDosage] = useState('每次 1 顆');
  const [color, setColor] = useState('白色');
  const [shape, setShape] = useState<MedicationShape>('round');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [timings, setTimings] = useState<MedicationTiming[]>(['after_breakfast']);
  const [customTimes, setCustomTimes] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<MedicationFrequency>('daily');
  const [specificDays, setSpecificDays] = useState<number[]>([1, 3, 5]);
  const [intervalDays, setIntervalDays] = useState<number>(2);
  const [startDate, setStartDate] = useState(toDateInputValue());
  const [endDate, setEndDate] = useState('');
  const [maxDailyDoses, setMaxDailyDoses] = useState<number>(1);
  const [minIntervalHours, setMinIntervalHours] = useState<number>(20);
  const [totalStock, setTotalStock] = useState<number>(30);
  const [foodNotes, setFoodNotes] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (initialMed) {
      setName(initialMed.name);
      setPurpose(initialMed.purpose || '');
      setDosage(initialMed.dosage || '每次 1 顆');
      setColor(initialMed.appearance?.color || '白色');
      setShape(initialMed.appearance?.shape || 'round');
      setDescription(initialMed.appearance?.description || '');
      setPhotoUrl(initialMed.appearance?.photoUrl || '');
      setTimings(initialMed.timings || ['after_breakfast']);
      setCustomTimes(initialMed.customTimes || []);
      setFrequency(initialMed.frequency || 'daily');
      setSpecificDays(initialMed.specificDays || [1, 3, 5]);
      setIntervalDays(initialMed.intervalDays || 2);
      setStartDate(initialMed.startDate || toDateInputValue());
      setEndDate(initialMed.endDate || '');
      setMaxDailyDoses(initialMed.maxDailyDoses ?? 1);
      setMinIntervalHours(initialMed.minIntervalHours ?? 4);
      setTotalStock(initialMed.totalStock ?? 30);
      setFoodNotes(initialMed.foodNotes || '');
      setIsActive(initialMed.isActive ?? true);
    } else {
      // reset defaults
      setName('');
      setPurpose('');
      setDosage('每次 1 顆');
      setColor('白色');
      setShape('round');
      setDescription('');
      setPhotoUrl('');
      setTimings(['after_breakfast']);
      setCustomTimes([]);
      setFrequency('daily');
      setStartDate(toDateInputValue());
      setEndDate('');
      setMaxDailyDoses(1);
      setMinIntervalHours(20);
      setTotalStock(30);
      setFoodNotes('');
      setIsActive(true);
    }
  }, [initialMed, isOpen]);

  if (!isOpen) return null;

  const toggleTiming = (t: MedicationTiming) => {
    if (timings.includes(t)) {
      if (timings.length > 1) {
        setTimings(timings.filter((x) => x !== t));
      }
    } else {
      setTimings([...timings, t]);
    }
  };

  const toggleWeekday = (val: number) => {
    if (specificDays.includes(val)) {
      setSpecificDays(specificDays.filter((x) => x !== val));
    } else {
      setSpecificDays([...specificDays, val]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preview remaining days
  const tempMed: Medication = {
    id: initialMed?.id || 'temp',
    name,
    purpose,
    dosage,
    appearance: { color, shape, description, photoUrl },
    timings,
    customTimes,
    frequency,
    specificDays,
    intervalDays,
    startDate,
    endDate,
    maxDailyDoses,
    minIntervalHours,
    totalStock,
    foodNotes,
    isActive,
    createdAt: new Date().toISOString(),
  };

  const estRemainingDays = calculateRemainingDays(tempMed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const medToSave: Medication = {
      id: initialMed?.id || `med-${Date.now()}`,
      name: name.trim(),
      purpose: purpose.trim(),
      dosage: dosage.trim(),
      appearance: {
        color: color.trim(),
        shape,
        description: description.trim(),
        photoUrl: photoUrl || undefined,
      },
      timings,
      customTimes,
      frequency,
      specificDays: frequency === 'weekdays' ? specificDays : undefined,
      intervalDays: frequency === 'interval' ? intervalDays : undefined,
      startDate,
      endDate: endDate || undefined,
      maxDailyDoses: Number(maxDailyDoses) || 1,
      minIntervalHours: Number(minIntervalHours) || 0,
      totalStock: Number(totalStock) || 0,
      foodNotes: foodNotes.trim(),
      isActive,
      createdAt: initialMed?.createdAt || new Date().toISOString(),
    };

    onSave(medToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {initialMed ? '編輯藥品設定' : '新增藥品'}
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
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                藥品名稱 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：脈優錠 (Amlodipine 5mg)"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                用途 / 適應症
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="例如：高血壓控制、胃食道逆流"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                單次服用劑量 *
              </label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="例如：每次 1 顆、每次半顆"
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                啟用狀態
              </label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="radio"
                    checked={isActive}
                    onChange={() => setIsActive(true)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>正常啟用</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-500">
                  <input
                    type="radio"
                    checked={!isActive}
                    onChange={() => setIsActive(false)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>暫停提醒</span>
                </label>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">藥品外觀特徵與照片 (防吃錯藥)</h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">顏色</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="如 白色、粉紅色"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">形狀</label>
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value as MedicationShape)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  {SHAPES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">刻痕/字樣描述</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="如 刻有 AML 5 字樣"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                藥品照片（可上傳藥丸或藥袋照片）:
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span>選擇照片 / 拍照</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={photoUrl}
                      alt="藥品預覽"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-xs text-red-600 hover:underline"
                    >
                      移除照片
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timing & Frequency */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">服用時機與頻率</h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                服用時機（可多選）：
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    'before_breakfast',
                    'after_breakfast',
                    'before_lunch',
                    'after_lunch',
                    'before_dinner',
                    'after_dinner',
                    'bedtime',
                  ] as MedicationTiming[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTiming(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      timings.includes(t)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {TIMING_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                服用頻率：
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'daily', label: '每天' },
                  { id: 'weekdays', label: '指定星期' },
                  { id: 'interval', label: '每隔 N 天' },
                  { id: 'prn', label: '需要時才吃 (PRN)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFrequency(f.id as MedicationFrequency)}
                    className={`py-2 px-2 text-center text-xs font-bold rounded-lg border transition-colors ${
                      frequency === f.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {frequency === 'weekdays' && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-slate-200">
                  {WEEKDAY_OPTIONS.map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => toggleWeekday(d.val)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                        specificDays.includes(d.val)
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}

              {frequency === 'interval' && (
                <div className="mt-2.5 flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs">
                  <span>每隔</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value))}
                    className="w-16 p-1 border border-slate-300 rounded text-center font-bold"
                  />
                  <span>天服用一次</span>
                </div>
              )}
            </div>
          </div>

          {/* Anti-Duplicate Safety Parameters */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">防呆與劑量安全設定</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  每日最多次數（達標隱藏打卡）：
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxDailyDoses}
                    onChange={(e) => setMaxDailyDoses(Number(e.target.value))}
                    className="w-24 text-xs p-2 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="text-xs text-slate-500">次 / 天</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  兩次服藥最短間隔（小時）：
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="48"
                    value={minIntervalHours}
                    onChange={(e) => setMinIntervalHours(Number(e.target.value))}
                    className="w-24 text-xs p-2 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="text-xs text-slate-500">小時（未達阻擋重複）</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock & Date */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">剩餘藥量庫存與推算</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  目前剩餘藥量（顆/包/劑）：
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={totalStock}
                    onChange={(e) => setTotalStock(Number(e.target.value))}
                    className="w-24 text-xs p-2 bg-white border border-slate-300 rounded-lg text-center font-bold"
                  />
                  <span className="text-xs text-slate-600">
                    推算約剩：<b className="text-teal-700 text-sm">{estRemainingDays}</b> 天份
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  起始日期：
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                飲食注意（純文字備註，如禁葡萄柚、隨餐服用）：
              </label>
              <textarea
                rows={2}
                value={foodNotes}
                onChange={(e) => setFoodNotes(e.target.value)}
                placeholder="例如：避免葡萄柚或葡萄柚汁一同食用；配溫開水整顆吞服。"
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Footer Submit */}
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
              儲存藥品
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
