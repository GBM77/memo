import { useEffect } from 'react';
import {
  BellRing,
  Volume2,
  Clock,
  Check,
  RotateCcw,
  X,
  Pill,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { RingtoneType } from '../../types';
import { startAlarmLoop, stopAlarmLoop } from '../../utils/audioAlarm';

export interface AlarmEvent {
  id: string;
  type: 'medication' | 'departure' | 'todo';
  title: string;
  subtitle: string;
  timeStr: string;
  payload?: any;
}

interface AlarmModalProps {
  alarmEvent: AlarmEvent | null;
  ringtone: RingtoneType;
  volume: number;
  vibration: boolean;
  onConfirmAction: (event: AlarmEvent) => void;
  onSnooze: (event: AlarmEvent, minutes: number) => void;
  onDismiss: () => void;
}

export function AlarmModal({
  alarmEvent,
  ringtone,
  volume,
  vibration,
  onConfirmAction,
  onSnooze,
  onDismiss,
}: AlarmModalProps) {
  useEffect(() => {
    if (alarmEvent) {
      startAlarmLoop(ringtone, volume, vibration);
    } else {
      stopAlarmLoop();
    }
    return () => {
      stopAlarmLoop();
    };
  }, [alarmEvent, ringtone, volume, vibration]);

  if (!alarmEvent) return null;

  const handleAction = () => {
    stopAlarmLoop();
    onConfirmAction(alarmEvent);
  };

  const handleSnooze = () => {
    stopAlarmLoop();
    onSnooze(alarmEvent, 10);
  };

  const handleClose = () => {
    stopAlarmLoop();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-4 border-amber-400 text-center relative overflow-hidden">
        {/* Ringing Glow Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-amber-400 via-red-500 to-amber-400 animate-pulse" />

        {/* Pulsing Bell Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 border-4 border-amber-300 flex items-center justify-center text-amber-600 mb-4 animate-bounce">
          <BellRing className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Badges */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black tracking-wide mb-2">
          <Volume2 className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
          <span>鬧鈴響起 · 準時提醒</span>
          <span className="font-mono ml-1 font-bold">({alarmEvent.timeStr})</span>
        </div>

        {/* Titles */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 leading-snug">
          {alarmEvent.title}
        </h3>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 mt-3 text-left">
          <div className="flex items-start gap-2.5">
            {alarmEvent.type === 'medication' ? (
              <Pill className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            ) : alarmEvent.type === 'departure' ? (
              <Calendar className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {alarmEvent.subtitle}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {alarmEvent.type === 'medication'
                  ? '請依劑量配溫開水服用，服後點擊下方按鈕打卡完成。'
                  : alarmEvent.type === 'departure'
                  ? '最晚出發時間已到，請檢查健保卡與藥袋準備出發！'
                  : '排定待辦事項時間已到，請確認處理。'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleAction}
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-2xl font-black text-base shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>
              {alarmEvent.type === 'medication'
                ? '我吃了（立即打卡）'
                : alarmEvent.type === 'departure'
                ? '出發啟程 / 查看路線'
                : '標記完成'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSnooze}
              className="py-3 px-3 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>延遲 10 分鐘再響</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>關閉鬧鈴</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
