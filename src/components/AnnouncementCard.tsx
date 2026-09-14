import { useState } from 'react';
import { GraduationCap, CalendarDays, Home, Search, Users, Trophy, Siren, Megaphone, Clock, AlertCircle, AlertTriangle, EyeOff, Building2, CalendarPlus, BadgeCheck, MessageSquare, KeyRound, Heart, HelpCircle } from 'lucide-react';
import type { Announcement } from '@/lib/supabase';
import { CATEGORIES, PRIORITIES, societyDisplay } from '@/lib/supabase';
import { getGoogleCalendarUrl, downloadICSFile } from '@/lib/calendar';
import { isLiked } from '@/lib/likes';
import { checkUncertainty } from '@/lib/uncertainty';

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

const PRIORITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Clock,
  important: AlertCircle,
  urgent: AlertTriangle,
};

type AnnouncementCardProps = {
  announcement: Announcement;
  onClick: () => void;
  onDismiss: (id: string) => void;
  onContact: (announcement: Announcement) => void;
  onClaim: (announcement: Announcement) => void;
  onLike: (announcement: Announcement) => void;
  liked: boolean;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AnnouncementCard({ announcement, onClick, onDismiss, onContact, onClaim, onLike, liked }: AnnouncementCardProps) {
  const [confirming, setConfirming] = useState(false);
  const category = CATEGORIES.find((c) => c.value === announcement.category);
  const priority = PRIORITIES.find((p) => p.value === announcement.priority);
  const Icon = ICON_MAP[category?.icon || 'Megaphone'] || Megaphone;
  const PriorityIcon = PRIORITY_ICON[announcement.priority] || Clock;

  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();
  const hasDeadline = announcement.category === 'academic' || announcement.category === 'events' || !!announcement.expires_at;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirming) {
      onDismiss(announcement.id);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  const handleGoogleCal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleCalendarUrl(announcement);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAppleCal = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadICSFile(announcement);
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContact(announcement);
  };

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClaim(announcement);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(announcement);
  };

  const isLostFound = announcement.category === 'lost-found';
  const uncertainty = checkUncertainty(announcement);

  return (
    <div
      onClick={onClick}
      className={`group text-left bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden border-[10px] ${priority?.border || 'border-gray-200/60 dark:border-slate-700/60'} hover:shadow-2xl hover:shadow-gray-300/40 dark:hover:shadow-black/40 transition-all duration-300 hover:-translate-y-1 relative cursor-pointer`}
    >
      {announcement.priority === 'urgent' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
      )}

      {/* Floating category icon */}
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${
            announcement.category === 'emergency' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/15 dark:to-cyan-500/15'
          }`}>
            <Icon className={`w-5 h-5 ${announcement.category === 'emergency' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {category && (
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{category.label}</span>
            )}
            {priority && (
              <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${priority.color}`}>
                <PriorityIcon className="w-3 h-3" />
                {priority.label}
              </span>
            )}
            {announcement.is_official ? (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <BadgeCheck className="w-3 h-3" />
                Official
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-500 dark:text-blue-400">
                <GraduationCap className="w-3 h-3" />
                Student
              </span>
            )}
            {uncertainty.isUncertain && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                title={uncertainty.reasons.join('\n')}
              >
                <HelpCircle className="w-3 h-3" />
                Uncertain
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto whitespace-nowrap">
            {timeAgo(announcement.created_at)}
          </span>
        </div>

        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {announcement.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
          {announcement.body}
        </p>

        {announcement.academic_branch && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{announcement.academic_branch}</span>
          </div>
        )}

        {announcement.society && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-5 h-5 rounded-md bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
              <Building2 className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{societyDisplay(announcement.society)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={handleContact}
            className="group/contact flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:shadow-md hover:shadow-blue-500/25 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 group-hover/contact:scale-110 transition-transform" />
            Contact Person
          </button>
          {isLostFound && (
            <button
              onClick={handleClaim}
              className="group/claim flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-md hover:shadow-amber-500/25 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5 group-hover/claim:scale-110 transition-transform" />
              Claim Item
            </button>
          )}
          <button
            onClick={handleLike}
            className={`group/like flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              liked
                ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-200'
                : 'bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-500 dark:hover:text-rose-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 group-hover/like:scale-125 transition-transform ${liked ? 'fill-rose-500' : ''}`} />
            {announcement.like_count > 0 && announcement.like_count}
          </button>
        </div>

        {hasDeadline && (
          <div className="flex items-center gap-2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            <button
              onClick={handleGoogleCal}
              className="group/cal flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/25 hover:shadow-md hover:shadow-blue-100 transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5 group-hover/cal:rotate-12 transition-transform" />
              Google
            </button>
            <button
              onClick={handleAppleCal}
              className="group/cal flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:shadow-md hover:shadow-gray-100 transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5 group-hover/cal:rotate-12 transition-transform" />
              Apple
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {announcement.author_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{announcement.author_name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{announcement.author_role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isExpired && (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">Expired</span>
            )}
            <button
              onClick={handleDismiss}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                confirming
                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-200'
                  : 'bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/15 hover:text-orange-600 dark:hover:text-orange-400 opacity-0 group-hover:opacity-100'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              {confirming ? 'Confirm' : 'Hide'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
