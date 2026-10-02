import { ThemeColor, LayoutStyle } from '../types';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  ring: string;
}

export const THEME_CONFIGS: Record<ThemeColor, ThemeConfig> = {
  teal: {
    id: 'teal',
    name: '經典湖水青 (預設)',
    badgeBg: 'bg-teal-500',
    badgeBorder: 'border-teal-600',
    badgeText: 'text-teal-900',
    primaryBg: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    primaryText: 'text-white',
    accentBg: 'bg-teal-50',
    accentBorder: 'border-teal-200',
    accentText: 'text-teal-800',
    ring: 'focus:ring-teal-500',
  },
  emerald: {
    id: 'emerald',
    name: '青翠山林 (清新護眼)',
    badgeBg: 'bg-emerald-500',
    badgeBorder: 'border-emerald-600',
    badgeText: 'text-emerald-900',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryText: 'text-white',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    accentText: 'text-emerald-800',
    ring: 'focus:ring-emerald-500',
  },
  blue: {
    id: 'blue',
    name: '沉穩海軍藍 (專業醫療)',
    badgeBg: 'bg-blue-500',
    badgeBorder: 'border-blue-600',
    badgeText: 'text-blue-900',
    primaryBg: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText: 'text-white',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentText: 'text-blue-800',
    ring: 'focus:ring-blue-500',
  },
  amber: {
    id: 'amber',
    name: '暖陽晨曦 (溫馨親切)',
    badgeBg: 'bg-amber-500',
    badgeBorder: 'border-amber-600',
    badgeText: 'text-amber-950',
    primaryBg: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-700',
    primaryText: 'text-white',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    accentText: 'text-amber-900',
    ring: 'focus:ring-amber-500',
  },
  indigo: {
    id: 'indigo',
    name: '星夜深靛 (寧靜優雅)',
    badgeBg: 'bg-indigo-500',
    badgeBorder: 'border-indigo-600',
    badgeText: 'text-indigo-900',
    primaryBg: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    primaryText: 'text-white',
    accentBg: 'bg-indigo-50',
    accentBorder: 'border-indigo-200',
    accentText: 'text-indigo-800',
    ring: 'focus:ring-indigo-500',
  },
  highContrast: {
    id: 'highContrast',
    name: '長輩高對比 (極黑護眼)',
    badgeBg: 'bg-yellow-400',
    badgeBorder: 'border-yellow-500',
    badgeText: 'text-slate-950',
    primaryBg: 'bg-yellow-400',
    primaryHover: 'hover:bg-yellow-500',
    primaryText: 'text-slate-950 font-black',
    accentBg: 'bg-zinc-800',
    accentBorder: 'border-yellow-400',
    accentText: 'text-yellow-300',
    ring: 'focus:ring-yellow-400',
  },
};
