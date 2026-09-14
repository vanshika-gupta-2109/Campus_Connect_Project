import { Megaphone, Plus, Search, LogIn, LogOut, BadgeCheck, Inbox, ListTodo, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/useTheme';

type HeaderProps = {
  onPostClick: () => void;
  onLogoClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSignInClick: () => void;
  onInboxClick: () => void;
  onTaskPanelClick: () => void;
  unreadMessageCount?: number;
  pendingTaskCount?: number;
};

export default function Header({ onPostClick, onLogoClick, searchQuery, onSearchChange, onSignInClick, onInboxClick, onTaskPanelClick, unreadMessageCount = 0, pendingTaskCount = 0 }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/40 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <button onClick={onLogoClick} className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight">Campus Connect</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 leading-tight">Announcements & news</span>
            </div>
          </button>

          <div className="flex-1 max-w-md relative group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search announcements..."
              className="relative w-full pl-10 pr-4 py-2.5 text-sm bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-full focus:bg-white dark:focus:bg-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggle}
              className="flex items-center justify-center w-9 h-9 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onInboxClick}
                  className="relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                  title="Message inbox"
                >
                  <Inbox className="w-4 h-4" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </button>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/15 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 truncate max-w-[120px]">
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}

            <button
              onClick={onPostClick}
              className="group relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-full transition-all hover:scale-105"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-shadow" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity animate-gradient" />
              <Plus className="relative w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span className="relative hidden sm:inline">Post</span>
            </button>

            <button
              onClick={onTaskPanelClick}
              className="group relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-full transition-all hover:scale-105"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 group-hover:shadow-xl group-hover:shadow-emerald-500/40 transition-shadow" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity animate-gradient" />
              <ListTodo className="relative w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="relative hidden sm:inline">Tasks</span>
              {pendingTaskCount > 0 && (
                <span className="relative flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-emerald-700 bg-white rounded-full">
                  {pendingTaskCount > 9 ? '9+' : pendingTaskCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
