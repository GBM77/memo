import { X, PhoneCall, HeartPulse, Building2, User } from 'lucide-react';
import { AppSettings } from '../../types';

interface PhoneDialModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

export function PhoneDialModal({ isOpen, onClose, settings }: PhoneDialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-teal-800">
            <PhoneCall className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-slate-900">醫療與緊急快速撥號</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {/* Pharmacy */}
          {settings.pharmacyPhone ? (
            <a
              href={`tel:${settings.pharmacyPhone}`}
              className="flex items-center justify-between p-3.5 bg-teal-50 hover:bg-teal-100 text-teal-950 rounded-xl border border-teal-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-teal-900">
                    {settings.pharmacyName || '常看診所/藥局'}
                  </div>
                  <div className="font-mono text-sm font-black text-teal-800">
                    {settings.pharmacyPhone}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-teal-600 text-white rounded-lg shadow-2xs">
                撥打
              </span>
            </a>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
              可在「設定」中填入常看藥局電話
            </div>
          )}

          {/* Emergency Contact */}
          {settings.emergencyContactPhone ? (
            <a
              href={`tel:${settings.emergencyContactPhone}`}
              className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl border border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-700">
                    {settings.emergencyContactName || '緊急聯絡人'}
                  </div>
                  <div className="font-mono text-sm font-black text-slate-900">
                    {settings.emergencyContactPhone}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-800 text-white rounded-lg shadow-2xs">
                撥打
              </span>
            </a>
          ) : null}

          {/* Emergency 119 */}
          <a
            href="tel:119"
            className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 text-red-900 rounded-xl border border-red-200 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-red-900">緊急救護車（119）</div>
                <div className="text-[11px] text-red-700">緊急身體不適、呼吸困難</div>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-red-600 text-white rounded-lg shadow-2xs">
              撥打 119
            </span>
          </a>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
          點擊號碼直接啟動手機電話撥號
        </div>
      </div>
    </div>
  );
}
