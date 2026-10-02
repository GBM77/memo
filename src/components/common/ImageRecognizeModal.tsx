import { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  Calendar,
  Pill,
  CheckSquare,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Appointment, Medication, TodoItem, AppSettings } from '../../types';
import { toDateInputValue } from '../../utils/dateUtils';
import { generateDefaultItemsToBring } from '../../utils/appointmentLogic';

interface ImageRecognizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultHint?: 'appointment' | 'medication' | 'todo';
  settings: AppSettings;
  activeMedications: Medication[];
  onAddAppointment: (app: Appointment) => void;
  onAddMedication: (med: Medication) => void;
  onAddTodo: (todo: TodoItem) => void;
  onShowToast: (msg: string) => void;
}

export function ImageRecognizeModal({
  isOpen,
  onClose,
  defaultHint,
  settings,
  activeMedications,
  onAddAppointment,
  onAddMedication,
  onAddTodo,
  onShowToast,
}: ImageRecognizeModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [targetHint, setTargetHint] = useState<string>(defaultHint || 'auto');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState<'appointment' | 'medication' | 'todo'>('appointment');

  // Form states for editable extracted fields
  // 1. Appointment fields
  const [appHospital, setAppHospital] = useState('');
  const [appDepartment, setAppDepartment] = useState('');
  const [appDoctor, setAppDoctor] = useState('');
  const [appDate, setAppDate] = useState(toDateInputValue());
  const [appTime, setAppTime] = useState('14:30');
  const [appNumber, setAppNumber] = useState('');
  const [appAddress, setAppAddress] = useState('');
  const [appPrecautions, setAppPrecautions] = useState('');

  // 2. Medication fields
  const [medName, setMedName] = useState('');
  const [medPurpose, setMedPurpose] = useState('');
  const [medDosage, setMedDosage] = useState('每次 1 顆');
  const [medColor, setMedColor] = useState('白色');
  const [medShape, setMedShape] = useState<any>('round');
  const [medDescription, setMedDescription] = useState('');
  const [medTimings, setMedTimings] = useState<any[]>(['after_breakfast']);
  const [medFoodNotes, setMedFoodNotes] = useState('');
  const [medStock, setMedStock] = useState<number>(30);

  // 3. Todo fields
  const [todoTitle, setTodoTitle] = useState('');
  const [todoCategory, setTodoCategory] = useState('繳費');
  const [todoDueDate, setTodoDueDate] = useState(toDateInputValue());
  const [todoDueTime, setTodoDueTime] = useState('18:00');
  const [todoPriority, setTodoPriority] = useState<any>('high');
  const [todoNotes, setTodoNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    setErrorMsg(null);
    setParsedResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartRecognition = async () => {
    if (!imagePreview) {
      setErrorMsg('請先上傳或拍攝一張清晰的照片。');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType,
          targetHint: targetHint !== 'auto' ? targetHint : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || '辨識失敗，請重試');
      }

      const data = json.data;
      setParsedResult(data);

      const detected = data.detectedType || (targetHint !== 'auto' ? targetHint : 'appointment');
      setSelectedType(detected);

      // Populate appointment
      if (data.appointmentData) {
        const ad = data.appointmentData;
        setAppHospital(ad.hospital || '');
        setAppDepartment(ad.department || '');
        setAppDoctor(ad.doctor || '');
        setAppDate(ad.date || toDateInputValue());
        setAppTime(ad.time || '14:30');
        setAppNumber(ad.number || '');
        setAppAddress(ad.address || '');
        setAppPrecautions(ad.precautions || '');
      }

      // Populate medication
      if (data.medicationData) {
        const md = data.medicationData;
        setMedName(md.name || '');
        setMedPurpose(md.purpose || '');
        setMedDosage(md.dosage || '每次 1 顆');
        setMedColor(md.appearance?.color || '白色');
        setMedShape(md.appearance?.shape || 'round');
        setMedDescription(md.appearance?.description || '');
        setMedTimings(md.timings?.length > 0 ? md.timings : ['after_breakfast']);
        setMedFoodNotes(md.foodNotes || '');
        setMedStock(Number(md.totalStock) || 30);
      }

      // Populate todo
      if (data.todoData) {
        const td = data.todoData;
        setTodoTitle(td.title || '');
        setTodoCategory(td.category || '繳費');
        setTodoDueDate(td.dueDate || toDateInputValue());
        setTodoDueTime(td.dueTime || '18:00');
        setTodoPriority(td.priority || 'high');
        setTodoNotes(td.notes || '');
      }

      onShowToast('✓ AI 辨識完成！請確認下方萃取欄位。');
    } catch (err: any) {
      setErrorMsg(err.message || '辨識過程發生錯誤，請確認網路連線與圖片清晰度。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (selectedType === 'appointment') {
      if (!appHospital.trim()) {
        setErrorMsg('醫院名稱不可為空');
        return;
      }
      const newApp: Appointment = {
        id: `app-${Date.now()}`,
        hospital: appHospital.trim(),
        department: appDepartment.trim(),
        doctor: appDoctor.trim(),
        dateTime: `${appDate}T${appTime}`,
        number: appNumber.trim(),
        address: appAddress.trim(),
        transportMode: settings.defaultTransportMode || 'car',
        drivingTime: 25,
        parkingSearchTime: 15,
        walkFromParkingTime: 5,
        checkInEarlyTime: settings.defaultCheckInEarlyMinutes || 15,
        safetyBufferTime: settings.defaultSafetyBufferMinutes || 10,
        itemsToBring: generateDefaultItemsToBring(activeMedications),
        checkedItems: ['健保卡', '身分證 / 健保快易通'],
        precautions: appPrecautions.trim(),
        status: 'upcoming',
        notes: `由圖檔智慧辨識建立`,
        createdAt: new Date().toISOString(),
      };
      onAddAppointment(newApp);
      onShowToast(`✓ 已成功將【${newApp.hospital}】加入就診備忘！`);
      onClose();
    } else if (selectedType === 'medication') {
      if (!medName.trim()) {
        setErrorMsg('藥品名稱不可為空');
        return;
      }
      const newMed: Medication = {
        id: `med-${Date.now()}`,
        name: medName.trim(),
        purpose: medPurpose.trim(),
        dosage: medDosage.trim(),
        appearance: {
          color: medColor.trim(),
          shape: medShape,
          description: medDescription.trim(),
          photoUrl: imagePreview || undefined,
        },
        timings: medTimings,
        customTimes: [],
        frequency: 'daily',
        startDate: toDateInputValue(),
        maxDailyDoses: 1,
        minIntervalHours: 20,
        totalStock: medStock,
        foodNotes: medFoodNotes.trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      onAddMedication(newMed);
      onShowToast(`✓ 已成功將【${newMed.name}】加入藥品清單！`);
      onClose();
    } else {
      if (!todoTitle.trim()) {
        setErrorMsg('瑣事標題不可為空');
        return;
      }
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: todoTitle.trim(),
        category: todoCategory.trim() || '其他',
        dueDate: todoDueDate,
        dueTime: todoDueTime,
        priority: todoPriority,
        isCompleted: false,
        recurrence: 'none',
        notes: todoNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      onAddTodo(newTodo);
      onShowToast(`✓ 已成功將【${newTodo.title}】加入瑣事清單！`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <span>拍照 / 圖檔 AI 智慧辨識加入備忘</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-teal-50 text-teal-700 border border-teal-200 rounded-md">
                  Gemini AI
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                自動解析掛號單、就診通知、藥袋處方箋或生活繳費便條
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Target Hint Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              辨識模式 / 偏好類型：
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'auto', label: '🤖 自動判斷' },
                { id: 'appointment', label: '🏥 就診掛號單' },
                { id: 'medication', label: '💊 藥袋與藥品' },
                { id: 'todo', label: '📝 繳費單/便條' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTargetHint(m.id)}
                  className={`py-2 px-2.5 rounded-xl border text-center font-bold transition-all ${
                    targetHint === m.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload / Capture Box */}
          <div className="space-y-2">
            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 hover:bg-teal-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    點擊拍攝或從相簿選擇圖片
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    支援醫院掛號單、藥袋說明、看診通知單、繳費單或手寫便條
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={imagePreview}
                  alt="辨識照片預覽"
                  className="w-full sm:w-40 h-36 object-contain rounded-xl bg-black/5 border border-slate-200"
                />
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-xs font-bold text-slate-800">已就緒照片</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-teal-700 hover:underline font-semibold"
                    >
                      重新選擇
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    點擊「開始 AI 辨識」，系統將自動萃取關鍵文字與資訊。
                  </p>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleStartRecognition}
                    className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI 正在辨識影像資訊中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>開始 AI 智慧辨識</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Confirmation & Editing */}
          {parsedResult && (
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-4">
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-bold text-teal-950">
                    辨識結果確認（可自由調整）
                  </span>
                </div>
                {parsedResult.confidenceSummary && (
                  <span className="text-[11px] text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md font-medium">
                    {parsedResult.confidenceSummary}
                  </span>
                )}
              </div>

              {/* Detected Type Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">分類為：</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedType('appointment')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      selectedType === 'appointment'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    🏥 就診行程
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('medication')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      selectedType === 'medication'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    💊 藥品管理
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType('todo')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      selectedType === 'todo'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    📝 日常瑣事
                  </button>
                </div>
              </div>

              {/* TYPE 1: APPOINTMENT EDITABLE FORM */}
              {selectedType === 'appointment' && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-teal-200/80 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">醫院 / 診所 *</label>
                    <input
                      type="text"
                      value={appHospital}
                      onChange={(e) => setAppHospital(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">科別</label>
                      <input
                        type="text"
                        value={appDepartment}
                        onChange={(e) => setAppDepartment(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">醫師</label>
                      <input
                        type="text"
                        value={appDoctor}
                        onChange={(e) => setAppDoctor(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">診號</label>
                      <input
                        type="text"
                        value={appNumber}
                        onChange={(e) => setAppNumber(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">看診日期</label>
                      <input
                        type="date"
                        value={appDate}
                        onChange={(e) => setAppDate(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">看診時間</label>
                      <input
                        type="time"
                        value={appTime}
                        onChange={(e) => setAppTime(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">注意事項（空腹抽血等）</label>
                    <input
                      type="text"
                      value={appPrecautions}
                      onChange={(e) => setAppPrecautions(e.target.value)}
                      placeholder="如 空腹8小時抽血"
                      className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* TYPE 2: MEDICATION EDITABLE FORM */}
              {selectedType === 'medication' && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-teal-200/80 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">藥品名稱 *</label>
                    <input
                      type="text"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">用途 / 適應症</label>
                      <input
                        type="text"
                        value={medPurpose}
                        onChange={(e) => setMedPurpose(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">劑量</label>
                      <input
                        type="text"
                        value={medDosage}
                        onChange={(e) => setMedDosage(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">外觀特徵</label>
                      <input
                        type="text"
                        value={medDescription || `${medColor}錠劑`}
                        onChange={(e) => setMedDescription(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">領藥剩餘顆數</label>
                      <input
                        type="number"
                        value={medStock}
                        onChange={(e) => setMedStock(Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">飲食注意與忌口</label>
                    <input
                      type="text"
                      value={medFoodNotes}
                      onChange={(e) => setMedFoodNotes(e.target.value)}
                      placeholder="如 隨餐服用、避免葡萄柚"
                      className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* TYPE 3: TODO EDITABLE FORM */}
              {selectedType === 'todo' && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-teal-200/80 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">瑣事待辦名稱 *</label>
                    <input
                      type="text"
                      value={todoTitle}
                      onChange={(e) => setTodoTitle(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">分類</label>
                      <input
                        type="text"
                        value={todoCategory}
                        onChange={(e) => setTodoCategory(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">優先級</label>
                      <select
                        value={todoPriority}
                        onChange={(e) => setTodoPriority(e.target.value as any)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                      >
                        <option value="high">高優先</option>
                        <option value="medium">中優先</option>
                        <option value="low">低優先</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">截止到期日</label>
                      <input
                        type="date"
                        value={todoDueDate}
                        onChange={(e) => setTodoDueDate(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">截止時間</label>
                      <input
                        type="time"
                        value={todoDueTime}
                        onChange={(e) => setTodoDueTime(e.target.value)}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">備註說明</label>
                    <input
                      type="text"
                      value={todoNotes}
                      onChange={(e) => setTodoNotes(e.target.value)}
                      className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>確認加入備忘錄</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
