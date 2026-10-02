import { useState, useEffect } from 'react';
import {
  formatDateTaipei,
  formatTime24,
  getNowTaipei,
} from '../utils/dateUtils';
import { AppSettings, FontSizeSetting } from '../types';
import {
  PhoneCall,
  Type,
  Clock,
  HeartPulse,
  Camera,
  Sparkles,
  Smartphone,
  Palette,
} from 'lucide-react';
import { ThemeColor } from '../types';
import { THEME_CONFIGS } from '../utils/theme';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenPhoneModal: () => void;
  onOpenScanModal?: () => void;
  onShowToast?: (msg: string) => void;
}

export function Header({
  settings,
  onUpdateSettings,
  onOpenPhoneModal,
  onOpenScanModal,
  onShowToast,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date>(getNowTaipei());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getNowTaipei());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCycleFontSize = () => {
    const sequence: FontSizeSetting[] = ['standard', 'large', 'extraLarge'];
    const currentIndex = sequence.indexOf(settings.fontSize);
    const nextSize = sequence[(currentIndex + 1) % sequence.length];
    onUpdateSettings({ ...settings, fontSize: nextSize });
  };

  const handleCycleTheme = () => {
    const themes: ThemeColor[] = ['teal', 'emerald', 'blue', 'amber', 'indigo', 'highContrast'];
    const currIdx = themes.indexOf(settings.themeColor);
    const nextTheme = themes[(currIdx + 1) % themes.length];
    onUpdateSettings({ ...settings, themeColor: nextTheme });
    if (onShowToast) onShowToast(`✓ 主題已切換為：${THEME_CONFIGS[nextTheme]?.name}`);
  };

  const handleToggleMobileView = () => {
    const nextState = !settings.forceMobileView;
    onUpdateSettings({
      ...settings,
      forceMobileView: nextState,
      fontSize: nextState ? 'extraLarge' : settings.fontSize,
    });
    if (onShowToast) {
      onShowToast(
        nextState
          ? '📱 已切換為手機版：版面完美適配，字體已自動放大至最大！'
          : '✓ 已恢復自適應寬版！'
      );
    }
  };

  const handleToggleSeniorMode = () => {
    const nextState = !settings.isSeniorMode;
    onUpdateSettings({
      ...settings,
      isSeniorMode: nextState,
      fontSize: nextState ? 'extraLarge' : settings.fontSize,
    });
    if (onShowToast) {
      onShowToast(
        nextState
          ? '👵 已切換為長輩專用版（超大字體、超大觸控按鈕、親切語音朗讀）！'
          : '✓ 已切換回一般完整版模式！'
      );
    }
  };

  const getFontSizeLabel = () => {
    switch (settings.fontSize) {
      case 'large':
        return '大字';
      case 'extraLarge':
        return '特大';
      default:
        return '標準';
    }
  };

  const currentThemeCfg = THEME_CONFIGS[settings.themeColor] || THEME_CONFIGS.teal;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Date */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${currentThemeCfg.primaryBg} ${currentThemeCfg.primaryText} flex items-center justify-center shadow-xs shrink-0`}>
            <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none truncate">
                安時備忘
              </h1>
              {settings.isSeniorMode && (
                <span className="text-[10px] font-black text-amber-950 bg-amber-300 px-2 py-0.5 rounded-md border border-amber-400">
                  👵 長輩版
                </span>
              )}
              {settings.forceMobileView && !settings.isSeniorMode && (
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded hidden sm:inline-block">
                  📱 手機模式
                </span>
              )}
            </div>
            {/* Live date in Asia/Taipei */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
              <span className="font-semibold text-slate-800 truncate">
                {formatDateTaipei(currentTime)}
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 font-mono text-slate-700 shrink-0">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatTime24(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Toggle Senior Mode (長輩專用版) */}
          <button
            type="button"
            onClick={handleToggleSeniorMode}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer ${
              settings.isSeniorMode
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-2 border-amber-500 ring-2 ring-amber-400/30'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
            }`}
            title={settings.isSeniorMode ? '點擊切換回一般完整版' : '切換為長輩專用版（大字體、大按鈕、親切語音、簡單清楚）'}
          >
            <span>👵</span>
            <span>{settings.isSeniorMode ? '一般版' : '長輩版'}</span>
          </button>

          {/* AI Scan button */}
          {onOpenScanModal && (
            <button
              type="button"
              onClick={onOpenScanModal}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg ${currentThemeCfg.primaryBg} ${currentThemeCfg.primaryHover} ${currentThemeCfg.primaryText} text-xs font-bold shadow-xs transition-colors`}
              title="拍照或上傳圖檔，AI 自動辨識加入就診、藥袋或瑣事"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">辨識</span>
            </button>
          )}

          {/* Quick Toggle Mobile View (REQUEST 2) */}
          <button
            type="button"
            onClick={handleToggleMobileView}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
              settings.forceMobileView
                ? 'bg-teal-100 text-teal-900 border-teal-300 font-bold'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
            title={settings.forceMobileView ? '目前為手機版閱讀模式，點擊切換為寬版' : '切換為手機版閱讀模式（方便長輩與集中視線）'}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {/* Quick Theme Switcher (REQUEST 1) */}
          <button
            type="button"
            onClick={handleCycleTheme}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
            title={`目前配色：${currentThemeCfg.name}，點擊切換下一個主題`}
          >
            <Palette className="w-3.5 h-3.5 text-slate-600" />
          </button>

          {/* Quick Font Size Switcher */}
          <button
            type="button"
            onClick={handleCycleFontSize}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
            title="調整文字大小（適合長輩閱讀）"
          >
            <Type className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">字體:{getFontSizeLabel()}</span>
            <span className="sm:hidden">{getFontSizeLabel()}</span>
          </button>

          {/* Quick Pharmacy / Emergency Dial */}
          <button
            type="button"
            onClick={onOpenPhoneModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors"
            title="快速撥打診所藥局或緊急聯絡電話"
          >
            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">電話</span>
          </button>
        </div>
      </div>
    </header>
  );
}
