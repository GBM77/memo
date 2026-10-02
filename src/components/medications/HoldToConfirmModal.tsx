import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Check } from 'lucide-react';

interface HoldToConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
  warningMessage: string;
  medicationName: string;
  lastTakenTimeText?: string;
}

export function HoldToConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '重複服藥安全警示',
  warningMessage,
  medicationName,
  lastTakenTimeText,
}: HoldToConfirmModalProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [reason, setReason] = useState('修正先前漏記或誤按');
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const HOLD_DURATION_MS = 2000; // 2 seconds required

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsHolding(false);
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    }
  }, [isOpen]);

  const handleStartHold = () => {
    setIsHolding(true);
    startTimeRef.current = performance.now();

    const updateLoop = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setProgress(pct);

      if (pct >= 100) {
        setIsHolding(false);
        onConfirm(reason);
      } else {
        timerRef.current = requestAnimationFrame(updateLoop);
      }
    };

    timerRef.current = requestAnimationFrame(updateLoop);
  };

  const handleEndHold = () => {
    setIsHolding(false);
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-red-600 font-semibold">【防呆安全機制啟動】</p>
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 leading-relaxed font-medium">
              {warningMessage}
            </div>
          </div>
          {lastTakenTimeText && (
            <div className="mt-2 text-xs text-red-700 bg-red-100/70 p-2 rounded-lg">
              系統紀錄：{lastTakenTimeText}
            </div>
          )}
        </div>

        <div className="mb-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <p className="font-semibold text-slate-800 mb-1">⚠️ 醫療安全提示：</p>
          <p>
            重複服用降血壓、抗凝血或降血糖等藥物可能引發危險低血壓或出血風險。若為補吃或加倍劑量，請立即停止並諮詢藥師或醫師。
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            強制更正紀錄原因（選填）:
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500"
            placeholder="例如：剛才家人代為記錄，實際現在才服用"
          />
        </div>

        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
            <div
              className="absolute left-0 top-0 bottom-0 bg-red-500 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
            <button
              type="button"
              onMouseDown={handleStartHold}
              onMouseUp={handleEndHold}
              onMouseLeave={handleEndHold}
              onTouchStart={handleStartHold}
              onTouchEnd={handleEndHold}
              className="relative w-full py-3.5 px-4 text-center font-bold text-sm select-none transition-colors touch-none"
            >
              <span className={progress > 40 ? 'text-white' : 'text-slate-900'}>
                {isHolding
                  ? `持續按住... (${Math.round((progress / 100) * 2 * 10) / 10}秒 / 2秒)`
                  : '長按 2 秒確認強制記錄更正'}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            取消並遵照安全指示
          </button>
        </div>
      </div>
    </div>
  );
}
