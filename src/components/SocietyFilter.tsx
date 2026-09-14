import { Building2, X } from 'lucide-react';
import { SOCIETIES, societyDisplay } from '@/lib/supabase';

type SocietyFilterProps = {
  activeSociety: string | null;
  onSocietyChange: (society: string | null) => void;
  counts: Record<string, number>;
};

export default function SocietyFilter({ activeSociety, onSocietyChange, counts }: SocietyFilterProps) {
  return (
    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border-b border-white/40 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 shrink-0 pr-1">
            <div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <span className="hidden sm:inline">Societies</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => onSocietyChange(null)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeSociety === null
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:shadow-gray-200/50'
              }`}
            >
              All Societies
            </button>
            {SOCIETIES.map((society) => {
              const isActive = activeSociety === society;
              const count = counts[society] || 0;
              return (
                <button
                  key={society}
                  onClick={() => onSocietyChange(isActive ? null : society)}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                      : count > 0
                        ? 'bg-white/60 dark:bg-slate-800/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:shadow-gray-200/50'
                        : 'bg-gray-50/60 dark:bg-slate-700/40 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {societyDisplay(society)}
                  {count > 0 && (
                    <span className={`text-[10px] ${isActive ? 'text-cyan-100' : 'text-gray-400 dark:text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            {activeSociety && (
              <button
                onClick={() => onSocietyChange(null)}
                className="group flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 shrink-0 transition-all"
              >
                <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
