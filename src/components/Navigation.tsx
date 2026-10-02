import {
  Home,
  CalendarClock,
  Pill,
  CheckSquare,
  Settings,
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
    },
    {
      id: 'appointments' as TabType,
      label: '就診',
      icon: CalendarClock,
      badge: upcomingAppointmentToday ? '今日' : null,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'medications' as TabType,
      label: '服藥',
      icon: Pill,
      badge: pendingDoseCount > 0 ? String(pendingDoseCount) : null,
      badgeColor: 'bg-teal-600',
    },
    {
      id: 'todos' as TabType,
      label: '瑣事',
      icon: CheckSquare,
      badge: pendingTodosCount > 0 ? String(pendingTodosCount) : null,
      badgeColor: 'bg-slate-500',
    },
    {
      id: 'settings' as TabType,
      label: '設定',
      icon: Settings,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="行動版導航"
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg ${
          forceMobileView ? 'block max-w-md mx-auto' : 'md:hidden'
        }`}
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                  isActive
                    ? 'text-teal-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 text-teal-600 stroke-[2.5]' : ''
                    }`}
                  />
                  {tab.badge && (
                    <span
                      className={`absolute -top-1.5 -right-3 text-[10px] text-white font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 leading-none">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-6 h-0.5 bg-teal-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Top Sub-Nav bar */}
      {!forceMobileView && (
        <nav
          aria-label="電腦版導航"
          className="hidden md:block bg-white border-b border-slate-200"
        >
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-start gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${
                    isActive
                      ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] text-white font-bold px-1.5 py-0.2 rounded-full ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
