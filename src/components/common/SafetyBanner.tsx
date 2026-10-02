import { PhoneCall, ShieldCheck, AlertCircle } from 'lucide-react';
import { AppSettings } from '../../types';

interface SafetyBannerProps {
  settings: AppSettings;
  variant?: 'footer' | 'missedAlert' | 'card';
  compact?: boolean;
}

export function SafetyBanner({ settings, variant = 'footer', compact = false }: SafetyBannerProps) {
  if (variant === 'missedAlert') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-amber-950 mb-1">
              漏吃了，請依藥袋說明或詢問藥師/醫師，不要自行加倍服用。
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed mb-3">
              若超過服用時間太久，隨意加倍吃藥可能引起嚴重不良反應。請撥打諮詢電話或參閱診所領藥藥袋指示。
            </p>
            {settings.pharmacyPhone && (
              <a
                href={`tel:${settings.pharmacyPhone}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>撥打諮詢：{settings.pharmacyName || '診所藥局'} ({settings.pharmacyPhone})</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 py-2 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>本 App 僅為提醒工具，不能取代醫師或藥師的指示。</span>
      </div>
    );
  }

  return (
    <footer className="mt-8 mb-16 sm:mb-8 pt-4 pb-6 border-t border-slate-200/80 text-center">
      <div className="max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full mb-2">
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          <span>醫療安全聲明</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          本 App 僅為個人日常與用藥輔助提醒工具，絕不提供補吃、劑量或藥物交互作用等醫療建議，亦不能取代合格醫師或專業藥師之指示與處方。
        </p>
        {settings.pharmacyPhone && (
          <div className="mt-2 text-xs text-slate-600">
            常看診所 / 藥局諮詢專線：
            <a
              href={`tel:${settings.pharmacyPhone}`}
              className="text-teal-700 font-semibold hover:underline ml-1"
            >
              {settings.pharmacyName} ({settings.pharmacyPhone})
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
