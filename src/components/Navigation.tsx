import { useEffect } from 'react';
import {
  Home,
  CalendarClock,
  Pill,
  CheckSquare,
  Settings,
  ExternalLink,
} from 'lucide-react';

export type TabType = 'home' | 'appointments' | 'medications' | 'todos' | 'settings';

interface NavigationProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingDoseCount?: number;
  upcomingAppointmentToday?: boolean;
  pendingTodosCount?: number;
  forceMobileView?: boolean;
}

export function Navigation({
  currentTab,
  onChangeTab,
  pendingDoseCount = 0,
  upcomingAppointmentToday = false,
  pendingTodosCount = 0,
  forceMobileView = false,
}: NavigationProps) {
  const tabs = [
    {
      id: 'home' as TabType,
      label: '首頁',
      icon: Home,
      badge: upcomingAppointmentToday ? '看診' : null,
      badgeColor: 'bg-red-500',
      keyShortcut: '1',
      desc: '現在最該做的一件事與重要提醒',
    },
    {
      id: 'appointments' as TabType,
      label: '就診',
      icon: CalendarClock,
      badge: upcomingAppointmentToday ? '今日' : null,
      badgeColor: 'bg-amber-500',
      keyShortcut: '2',
      desc: '就診預約與最晚出發倒數時間軸',
    },
    {
      id: 'medications' as TabType,
      label: '服藥',
      icon: Pill,
      badge: pendingDoseCount > 0 ? String(pendingDoseCount) : null,
      badgeColor: 'bg-teal-600',
      keyShortcut: '3',
      desc: '防重複服藥打卡與防漏吃專區',
    },
    {
      id: 'todos' as TabType,
      label: '瑣事',
      icon: CheckSquare,
      badge: pendingTodosCount > 0 ? String(pendingTodosCount) : null,
      badgeColor: 'bg-slate-500',
      keyShortcut: '4',
      desc: '日常家務、採買、繳費與備忘',
    },
    {
      id: 'settings' as TabType,
      label: '設定',
      icon: Settings,
      badge: null,
      badgeColor: '',
      keyShortcut: '5',
      desc: '主題風格、手機版模式與鬧鈴配置',
    },
  ];

  // Listen to keyboard shortcuts [1-5] for fast tab switching on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '1') onChangeTab('home');
      else if (e.key === '2') onChangeTab('appointments');
      else if (e.key === '3') onChangeTab('medications');
      else if (e.key === '4') onChangeTab('todos');
      else if (e.key === '5') onChangeTab('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChangeTab]);

  return (
    <>
      {/* 1. Desktop Top Navigation Bar (電腦版頂部獨立頁面跳轉列) */}
      {!forceMobileView && (
        <nav
          aria-label="電腦版獨立分頁導航"
          className="hidden md:block sticky top-[57px] sm:top-[65px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs"
        >
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
            {/* Left: 5 tabs matching user's exact mobile bottom bar styling */}
            <div className="flex items-center gap-1 sm:gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChangeTab(tab.id)}
                    title={`按 [${tab.keyShortcut}] 鍵跳轉至【${tab.label}】獨立管理頁面（${tab.desc}）`}
                    className={`relative flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-all border-b-[3px] -mb-[2px] cursor-pointer group ${
                      isActive
                        ? 'border-teal-600 text-teal-800 bg-teal-50/60'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative">
                      <Icon
                        className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-teal-600 stroke-[2.5]' : 'text-slate-500'
                        }`}
                      />
                      {tab.badge && (
                        <span
                          className={`absolute -top-2 -right-3 text-[10px] text-white font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white shadow-xs ${tab.badgeColor}`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>

                    <span className="tracking-tight">{tab.label}</span>

                    {/* Keyboard shortcut hint */}
                    <span className="hidden lg:inline-block text-[10px] font-mono text-slate-400 bg-slate-100 group-hover:bg-slate-200 px-1.5 py-0.2 rounded border border-slate-200">
                      {tab.keyShortcut}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Independent Page Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>電腦版獨立頁面：</span>
              <code className="text-teal-700 font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                #{currentTab}
              </code>
            </div>
          </div>
        </nav>
      )}

      {/* 2. Mobile Bottom Navigation Bar (行動版/手機模式底部導航列 - 完美適配版面) */}
      <nav
        aria-label="行動版導航"
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg ${
          forceMobileView ? 'block max-w-[480px] mx-auto' : 'md:hidden'
        }`}
      >
        <div className="grid grid-cols-5 h-[64px] max-w-[480px] mx-auto px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] cursor-pointer ${
                  isActive
                    ? 'text-teal-700 font-black'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5.5 h-5.5 transition-transform ${
                      isActive ? 'scale-110 text-teal-600 stroke-[2.5]' : ''
                    }`}
                  />
                  {tab.badge && (
                    <span
                      className={`absolute -top-1.5 -right-3.5 text-[10px] text-white font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white shadow-2xs ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[12px] mt-1 font-bold leading-none">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-7 h-1 bg-teal-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
