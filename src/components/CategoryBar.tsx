import { GraduationCap, CalendarDays, Home, Search, Users, Trophy, Siren, Megaphone, LayoutGrid } from 'lucide-react';
import { CATEGORIES } from '@/lib/supabase';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  CalendarDays,
  Home,
  Search,
  Users,
  Trophy,
  Siren,
  Megaphone,
};

type CategoryBarProps = {
  activeCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  counts: Record<string, number>;
};

export default function CategoryBar({ activeCategory, onCategoryChange, counts }: CategoryBarProps) {
  return (
    <div className="glass border-b border-white/40 dark:border-white/10 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
          <button
            onClick={() => onCategoryChange(null)}
            className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === null
                ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg shadow-gray-800/20'
                : 'bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:shadow-gray-200/50'
            }`}
          >
            <LayoutGrid className={`w-4 h-4 transition-transform ${activeCategory === null ? '' : 'group-hover:scale-110'}`} />
            All
            <span className={`text-xs ${activeCategory === null ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
              {Object.values(counts).reduce((a, b) => a + b, 0)}
            </span>
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Megaphone;
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(isActive ? null : cat.value)}
                className={`group flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:shadow-gray-200/50'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-125 group-hover:-rotate-6'}`} />
                {cat.label}
                <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                  {counts[cat.value] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
