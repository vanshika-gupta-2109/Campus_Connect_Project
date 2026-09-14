import { Megaphone, ArrowRight, Siren, Bell, CalendarDays, GraduationCap, Users, Trophy, Home, Search } from 'lucide-react';

type HeroBannerProps = {
  announcementCount: number;
  urgentCount: number;
  onPostClick: () => void;
};

export default function HeroBanner({ announcementCount, urgentCount, onPostClick }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-700 rounded-3xl mb-8 animate-gradient shadow-xl shadow-blue-500/20">
      {/* Decorative floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-6 right-12 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float">
          <GraduationCap className="w-7 h-7 text-white/70" />
        </div>
        <div className="absolute top-20 right-40 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float-slow">
          <Users className="w-6 h-6 text-white/60" />
        </div>
        <div className="absolute bottom-16 right-20 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float-reverse">
          <Trophy className="w-8 h-8 text-white/70" />
        </div>
        <div className="absolute top-1/2 right-60 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float">
          <CalendarDays className="w-5 h-5 text-white/50" />
        </div>
        <div className="absolute bottom-8 right-52 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float-slow">
          <Home className="w-5 h-5 text-white/50" />
        </div>
        <div className="absolute top-10 right-72 w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float-reverse">
          <Search className="w-4 h-4 text-white/40" />
        </div>
      </div>

      {/* Glow orbs */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3.5 py-1.5 bg-red-500/20 backdrop-blur rounded-full text-xs font-semibold text-red-50 dark:text-red-100 flex items-center gap-1.5 border border-red-400/20">
              <Siren className="w-3.5 h-3.5 animate-pulse" />
              {urgentCount} urgent announcement{urgentCount > 1 ? 's' : ''}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="px-3.5 py-1.5 bg-white/15 backdrop-blur rounded-full text-xs font-medium text-blue-50 dark:text-blue-100 flex items-center gap-2 border border-white/10 dark:border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            {announcementCount} active announcements
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight max-w-xl mb-3">
          Stay informed with campus announcements
        </h1>
        <p className="text-blue-100 text-base max-w-md mb-6 leading-relaxed">
          Academic updates, events, emergencies, lost & found, and more. All in one place.
        </p>

        <button
          onClick={onPostClick}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold text-sm rounded-full hover:shadow-2xl hover:scale-105 transition-all"
        >
          <Megaphone className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Post Announcement
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex flex-wrap gap-5 mt-8 pt-8 border-t border-white/15 dark:border-white/10">
          <div className="flex items-center gap-2 text-blue-50 dark:text-blue-100 text-sm">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-blue-200 dark:text-blue-300" />
            </div>
            Real-time updates
          </div>
          <div className="flex items-center gap-2 text-blue-50 dark:text-blue-100 text-sm">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Siren className="w-3.5 h-3.5 text-blue-200 dark:text-blue-300" />
            </div>
            Emergency alerts
          </div>
          <div className="flex items-center gap-2 text-blue-50 dark:text-blue-100 text-sm">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-blue-200 dark:text-blue-300" />
            </div>
            Event notices
          </div>
        </div>
      </div>
    </div>
  );
}
