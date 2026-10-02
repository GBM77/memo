import { useState, useRef } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  PhoneCall,
  Clock,
  Car,
  Type,
  Layout,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Palette,
  Smartphone,
  BellRing,
  Volume2,
  Play,
  Vibrate,
  Sliders,
  Monitor,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  AppSettings,
  FontSizeSetting,
  TransportMode,
  ThemeColor,
  LayoutStyle,
  RingtoneType,
  DefaultPageSetting,
} from '../../types';
import {
  exportBackupJSON,
  importBackupJSON,
  DEFAULT_SETTINGS,
} from '../../utils/storage';
import { THEME_CONFIGS } from '../../utils/theme';
import { playRingtoneOnce } from '../../utils/audioAlarm';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onReloadAllData: () => void;
  onResetToDefaultData: () => void;
  onShowToast: (msg: string) => void;
}

export function SettingsView({
  settings,
  onUpdateSettings,
  onReloadAllData,
  onResetToDefaultData,
  onShowToast,
}: SettingsViewProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anshi-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('✓ 已成功匯出備份 JSON 檔案！');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importBackupJSON(content);
      if (result.success) {
        setImportSuccess(result.message);
        onReloadAllData();
        onShowToast('✓ 備份資料匯入成功！');
      } else {
        setImportError(result.message);
      }
    };
    reader.onerror = () => {
      setImportError('讀取檔案失敗，請重新選取。');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updateSettingField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const updateAlarmField = <K extends keyof AppSettings['alarm']>(key: K, value: AppSettings['alarm'][K]) => {
    onUpdateSettings({
      ...settings,
      alarm: {
        ...settings.alarm,
        [key]: value,
      },
    });
  };

  const updateVisibleSection = (sectionKey: keyof AppSettings['visibleSections'], visible: boolean) => {
    onUpdateSettings({
      ...settings,
      visibleSections: {
        ...settings.visibleSections,
        [sectionKey]: visible,
      },
    });
  };

  const updateMealTime = (meal: keyof AppSettings['mealTimes'], timeStr: string) => {
    onUpdateSettings({
      ...settings,
      mealTimes: {
        ...settings.mealTimes,
        [meal]: timeStr,
      },
    });
  };

  const handleTestRingtone = (rt?: RingtoneType) => {
    const targetTone = rt || settings.alarm.ringtone;
    setIsPlayingTest(true);
    playRingtoneOnce(targetTone, settings.alarm.volume);
    setTimeout(() => setIsPlayingTest(false), 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-600" />
          <span>個人化設定與系統配置</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          主題風格與配色 · 手機版閱讀模式 · 鬧鈴與鈴聲設定 · JSON 備份還原
        </p>
      </div>

      {/* 1. Theme Color & Layout Style (REQUEST 1) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Palette className="w-4 h-4 text-teal-600" />
          <span>版面風格與主題配色（多款高辨識度色彩）</span>
        </h3>

        {/* Theme Swatches */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            選擇主色調：
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(Object.keys(THEME_CONFIGS) as ThemeColor[]).map((cKey) => {
              const cfg = THEME_CONFIGS[cKey];
              const isSelected = settings.themeColor === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => {
                    updateSettingField('themeColor', cKey);
                    onShowToast(`✓ 已套用「${cfg.name}」主題！`);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-xs bg-slate-50 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full shrink-0 shadow-2xs border ${cfg.badgeBg} ${cfg.badgeBorder}`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {cfg.name}
                    </div>
                    {isSelected && (
                      <div className="text-[10px] text-teal-700 font-semibold">使用中</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Style */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            排版形式風格：
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'standard', label: '舒適標準', desc: '適度留白，適合大部分情境' },
              { id: 'cards', label: '圓潤大卡片', desc: '強調卡片層次與視覺分隔' },
              { id: 'compact', label: '緊湊高密度', desc: '精簡間距，一屏顯示更多事項' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => updateSettingField('layoutStyle', style.id as LayoutStyle)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.layoutStyle === style.id
                    ? 'border-teal-500 bg-teal-50/70 font-bold text-teal-950 ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{style.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Mobile View Setting (REQUEST 2) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                手機版排版模式（方便閱讀與單手操作）
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                在寬螢幕/電腦上模擬手機視窗居中排版，加大觸控面積與按鈕尺寸，極方便長輩閱讀。
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.forceMobileView}
              onChange={(e) => {
                updateSettingField('forceMobileView', e.target.checked);
                onShowToast(e.target.checked ? '✓ 已切換為手機版居中閱讀模式！' : '✓ 已切換回自適應寬版模式！');
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
          <p>
            📱 <b>功能特色</b>：開啟後在電腦或平板上將自動約束至舒適的手機單欄比例（480px 寬度並居中），底部常駐手機導航條，不用在大螢幕上頻繁大幅度移滑鼠。
          </p>
        </div>
      </div>

      {/* 2.1 長輩專用版模式 (簡單易懂好操作) */}
      <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border-2 border-amber-400 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-bold shrink-0 shadow-2xs">
              👵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-amber-950">
                  長輩專用版模式（簡單易懂好操作）
                </h3>
                <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-md">
                  長輩推薦
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                超大字體 · 超大觸控按鈕 · 親切語音朗讀 · 一鍵撥打兒女診所電話
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.isSeniorMode}
              onChange={(e) => {
                const nextVal = e.target.checked;
                onUpdateSettings({
                  ...settings,
                  isSeniorMode: nextVal,
                  fontSize: nextVal ? 'extraLarge' : settings.fontSize,
                });
                onShowToast(nextVal ? '👵 已切換為長輩專用版！' : '✓ 已切換回一般完整版！');
              }}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-amber-950">
          <div className="p-3 bg-white/90 rounded-xl border border-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <span>🔤</span>
              <span>特大字體與超清晰色塊</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              字體放大至最高清晰度，標題與時間皆顯眼突出，不戴老花眼鏡也能輕鬆看懂。
            </p>
          </div>

          <div className="p-3 bg-white/90 rounded-xl border border-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <span>👆</span>
              <span>巨型防呆打卡按鈕</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              按鈕加大至手掌指尖一觸即發，點擊後大綠勾鎖定，絕不重複服藥、不漏吃。
            </p>
          </div>

          <div className="p-3 bg-white/90 rounded-xl border border-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <span>🔊</span>
              <span>親切語音朗讀提醒</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              按下「唸給我聽」，自動以繁體中文語音清晰朗讀今天該吃什麼藥、幾點要出門看病。
            </p>
          </div>

          <div className="p-3 bg-white/90 rounded-xl border border-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <span>📞</span>
              <span>兒女與常看診所一鍵撥號</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              將家人兒女與常看診所電話做成巨大按鈕，直接點擊即刻撥出，免翻通訊錄。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => {
              onUpdateSettings({
                ...settings,
                isSeniorMode: true,
                fontSize: 'extraLarge',
              });
              onShowToast('👵 已切換為長輩專用版！');
              window.location.hash = 'home';
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>👉 立即啟用並前往「長輩專用版」首頁</span>
          </button>
        </div>
      </div>

      {/* 2.5 電腦版獨立分頁與跳轉設定 (REQUEST 2.5) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-teal-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              電腦版獨立頁面與快速跳轉設定
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              電腦版支援直接跳轉獨立頁面、專屬網址、書籤儲存及鍵盤數字 [1~5] 快捷鍵
            </p>
          </div>
        </div>

        {/* Default Landing Page */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            打開 App 時預設啟動之獨立頁面：
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'home', label: '首頁', desc: '最該做的一件事' },
              { id: 'appointments', label: '就診頁面', desc: '預約與出發時間軸' },
              { id: 'medications', label: '服藥頁面', desc: '打卡與藥品庫存' },
              { id: 'todos', label: '瑣事頁面', desc: '家務採買與繳費' },
              { id: 'settings', label: '設定頁面', desc: '系統自訂配置' },
            ].map((p) => {
              const isSelected = (settings.defaultLandingPage || 'home') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    updateSettingField('defaultLandingPage', p.id as DefaultPageSetting);
                    onShowToast(`✓ 已設定預設開啟「${p.label}」！`);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/80 font-bold text-teal-950 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{p.desc}</div>
                  {isSelected && (
                    <div className="text-[10px] text-teal-700 font-bold mt-1">目前預設</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Independent Page Direct Links */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
              <span>各模組獨立分頁專屬網址（支援直接分享或加入瀏覽器我的最愛）：</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {[
              { tab: 'home', name: '首頁', path: '#home' },
              { tab: 'appointments', name: '就診行程獨立頁', path: '#appointments' },
              { tab: 'medications', name: '服藥專區獨立頁', path: '#medications' },
              { tab: 'todos', name: '日常瑣事獨立頁', path: '#todos' },
            ].map((item) => (
              <div
                key={item.tab}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-slate-900 truncate">{item.name}</span>
                  <code className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                    {item.path}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const fullUrl = `${window.location.origin}${window.location.pathname}${item.path}`;
                    navigator.clipboard.writeText(fullUrl).then(() => {
                      onShowToast(`✓ 已複製「${item.name}」獨立網址！`);
                    });
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 px-2 py-1 rounded hover:bg-teal-50 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>複製</span>
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            💡 提示：在電腦版任何畫面，直接按下鍵盤數字鍵 <b>[1] 首頁</b>、<b>[2] 就診</b>、<b>[3] 服藥</b>、<b>[4] 瑣事</b>、<b>[5] 設定</b> 即可秒速跳轉！
          </p>
        </div>
      </div>

      {/* 3. Audio Alarm & Sound Notifications (REQUEST 3) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                鬧鈴聲音與震動提醒設定
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                到達就診最晚出發時間或服藥時程時，主動發出鈴聲與震動防呆
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.alarm.enabled}
              onChange={(e) => updateAlarmField('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {settings.alarm.enabled && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* Ringtone Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  鬧鈴鈴聲種類：
                </label>
                <button
                  type="button"
                  onClick={() => handleTestRingtone()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition-colors"
                >
                  <Play className={`w-3 h-3 ${isPlayingTest ? 'text-teal-600 animate-spin' : ''}`} />
                  <span>試聽當前鈴聲</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'gentleChime', label: '柔和和弦鐘聲', desc: '馬林巴琴和弦 (悅耳不刺耳)' },
                  { id: 'digitalAlarm', label: '經典電子鬧鐘', desc: '規律嗶嗶聲 (高醒覺度)' },
                  { id: 'bellRinger', label: '清脆響鈴', desc: '叮咚鈴聲 (清晰明亮)' },
                  { id: 'hospitalBeep', label: '就診提示音', desc: '脈衝提示音 (專業醫療感)' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      updateAlarmField('ringtone', r.id as RingtoneType);
                      handleTestRingtone(r.id as RingtoneType);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      settings.alarm.ringtone === r.id
                        ? 'border-teal-600 bg-teal-50/80 font-bold text-teal-950 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-slate-500" />
                  <span>鬧鈴音量大小：</span>
                </span>
                <span className="font-mono font-bold text-teal-700">
                  {Math.round(settings.alarm.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={settings.alarm.volume}
                onChange={(e) => updateAlarmField('volume', Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Vibration & Alarm Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="flex items-center gap-2 font-semibold text-slate-800">
                  <Vibrate className="w-4 h-4 text-slate-600" />
                  <span>手機振動提示（需設備支援）</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.alarm.vibration}
                  onChange={(e) => updateAlarmField('vibration', e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="font-semibold text-slate-800">
                  🏥 就診最晚出發時間鬧鈴
                </span>
                <input
                  type="checkbox"
                  checked={settings.alarm.notifyDeparture}
                  onChange={(e) => updateAlarmField('notifyDeparture', e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="font-semibold text-slate-800">
                  💊 服藥時段準時鬧鈴
                </span>
                <input
                  type="checkbox"
                  checked={settings.alarm.notifyMedication}
                  onChange={(e) => updateAlarmField('notifyMedication', e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="font-semibold text-slate-800">
                  📝 重要日常瑣事鬧鈴
                </span>
                <input
                  type="checkbox"
                  checked={settings.alarm.notifyTodos}
                  onChange={(e) => updateAlarmField('notifyTodos', e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 4. Font Size Customization */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Type className="w-4 h-4 text-teal-600" />
          <span>字體大小模式（友善長輩與近視閱讀）</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'standard', label: '標準 (16px)', desc: '適中日常排版' },
            { id: 'large', label: '大字 (18px)', desc: '清晰醒目推薦' },
            { id: 'extraLarge', label: '超大字 (20px)', desc: '長輩長照首選' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateSettingField('fontSize', item.id as FontSizeSetting)}
              className={`p-3 text-left rounded-xl border transition-all ${
                settings.fontSize === item.id
                  ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm">{item.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Homepage Sections Visibility Customization */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Layout className="w-4 h-4 text-teal-600" />
          <span>首頁區塊顯示與自訂控制</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            {
              key: 'heroPriority' as const,
              label: '現在最該做的一件事 (焦點醒目英雄區)',
            },
            {
              key: 'todayMedsStatus' as const,
              label: '今天吃過了嗎？速查卡與 LINE 分享',
            },
            {
              key: 'appointments' as const,
              label: '今日就診出發動態時間軸',
            },
            {
              key: 'medicationSlots' as const,
              label: '今日服藥時段卡片',
            },
            {
              key: 'lowStockAlerts' as const,
              label: '藥品低存量警示卡',
            },
            {
              key: 'todos' as const,
              label: '日常待辦瑣事清單',
            },
          ].map((sec) => (
            <label
              key={sec.key}
              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200"
            >
              <span className="font-semibold text-slate-800">{sec.label}</span>
              <input
                type="checkbox"
                checked={settings.visibleSections[sec.key]}
                onChange={(e) => updateVisibleSection(sec.key, e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 6. Meal Times Schedule Customization */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600" />
          <span>每日用餐時段基準設定（用於推算服藥提醒時間）</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">早餐基準時間</label>
            <input
              type="time"
              value={settings.mealTimes.breakfast}
              onChange={(e) => updateMealTime('breakfast', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">午餐基準時間</label>
            <input
              type="time"
              value={settings.mealTimes.lunch}
              onChange={(e) => updateMealTime('lunch', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">晚餐基準時間</label>
            <input
              type="time"
              value={settings.mealTimes.dinner}
              onChange={(e) => updateMealTime('dinner', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">睡前基準時間</label>
            <input
              type="time"
              value={settings.mealTimes.bedtime}
              onChange={(e) => updateMealTime('bedtime', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>
        </div>
      </div>

      {/* 7. Travel & Safety Buffer Defaults */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Car className="w-4 h-4 text-teal-600" />
          <span>就診預設參數與低庫存警戒值</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              藥品庫存預警天數 (3~30天)
            </label>
            <input
              type="number"
              min="3"
              max="30"
              value={settings.lowStockThresholdDays}
              onChange={(e) => updateSettingField('lowStockThresholdDays', Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              就診提前報到時間 (分鐘)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={settings.defaultCheckInEarlyMinutes}
              onChange={(e) => updateSettingField('defaultCheckInEarlyMinutes', Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              安全緩衝時間 (分鐘)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={settings.defaultSafetyBufferMinutes}
              onChange={(e) => updateSettingField('defaultSafetyBufferMinutes', Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
            />
          </div>
        </div>
      </div>

      {/* 8. Emergency Contacts & Pharmacy Phone */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-teal-600" />
          <span>常用諮詢藥局與緊急聯絡電話（漏藥諮詢與快速直撥）</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              藥局 / 門診諮詢電話名稱
            </label>
            <input
              type="text"
              value={settings.pharmacyName}
              onChange={(e) => updateSettingField('pharmacyName', e.target.value)}
              placeholder="如 台大醫院藥劑諮詢室"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              藥局 / 門診電話號碼
            </label>
            <input
              type="text"
              value={settings.pharmacyPhone}
              onChange={(e) => updateSettingField('pharmacyPhone', e.target.value)}
              placeholder="如 02-2312-3456"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              家人 / 緊急聯絡人稱謂
            </label>
            <input
              type="text"
              value={settings.emergencyContactName}
              onChange={(e) => updateSettingField('emergencyContactName', e.target.value)}
              placeholder="如 大兒子 / 家人"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              緊急聯絡人電話
            </label>
            <input
              type="text"
              value={settings.emergencyContactPhone}
              onChange={(e) => updateSettingField('emergencyContactPhone', e.target.value)}
              placeholder="如 0912-345-678"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* 9. JSON Backup & Restore */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Download className="w-4 h-4 text-teal-600" />
          <span>資料備份與還原（免登入免後端，LocalStorage 持久化）</span>
        </h3>
        <p className="text-xs text-slate-500">
          提供完整「匯出 / 匯入 JSON」備份（含就診、藥品、服藥紀錄、瑣事、畫面設定）。換手機或電腦時可隨時無痛轉移。
        </p>

        {importError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">匯入失敗（已保留原既有資料）：</span>
              <span className="block mt-0.5">{importError}</span>
            </div>
          </div>
        )}

        {importSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>匯出完整 JSON 備份檔</span>
          </button>

          <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>選取 JSON 檔案匯入</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('確定要將資料重設為系統初始範例嗎？（建議先匯出備份）')) {
                onResetToDefaultData();
                onShowToast('✓ 已重設為初始示範資料！');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200 transition-colors ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重設為示範資料</span>
          </button>
        </div>
      </div>
    </div>
  );
}
