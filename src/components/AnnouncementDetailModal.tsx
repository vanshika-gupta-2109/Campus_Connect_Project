import { useEffect, useState } from 'react';
import { X, GraduationCap, CalendarDays, Home, Search, Users, Trophy, Siren, Megaphone, Clock, AlertCircle, AlertTriangle, User, Building2, CalendarClock, EyeOff, CalendarPlus, Check, BadgeCheck, MessageSquare, Mail, KeyRound, Heart, HelpCircle, Trash2, Pencil, Loader2 } from 'lucide-react';
import type { Announcement } from '@/lib/supabase';
import { CATEGORIES, PRIORITIES, societyDisplay, ACADEMIC_BRANCHES } from '@/lib/supabase';
import { getGoogleCalendarUrl, downloadICSFile } from '@/lib/calendar';
import UpdateThread from '@/components/UpdateThread';
import { isLiked } from '@/lib/likes';
import { checkUncertainty } from '@/lib/uncertainty';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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

type AnnouncementDetailModalProps = {
  announcement: Announcement | null;
  onClose: () => void;
  onDismiss: (id: string) => void;
  onContact: (announcement: Announcement) => void;
  onClaim: (announcement: Announcement) => void;
  onLike: (announcement: Announcement) => void;
  liked: boolean;
  onDeleted: (id: string) => void;
  onEdited: () => void;
};

export default function AnnouncementDetailModal({ announcement, onClose, onDismiss, onContact, onClaim, onLike, liked, onDeleted, onEdited }: AnnouncementDetailModalProps) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (announcement) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [announcement]);

  if (!announcement) return null;

  const category = CATEGORIES.find((c) => c.value === announcement.category);
  const priority = PRIORITIES.find((p) => p.value === announcement.priority);
  const Icon = ICON_MAP[category?.icon || 'Megaphone'] || Megaphone;
  const PriorityIcon = PRIORITY_ICON[announcement.priority] || Clock;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(announcement.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  })();

  const expiryText = announcement.expires_at
    ? new Date(announcement.expires_at) > new Date()
      ? `Expires ${new Date(announcement.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'Expired'
    : null;

  const hasDeadline = announcement.category === 'academic' || announcement.category === 'events' || !!announcement.expires_at;
  const googleCalUrl = getGoogleCalendarUrl(announcement);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss(announcement.id);
    setTimeout(() => onClose(), 400);
  };

  const handleGoogleCal = () => {
    if (googleCalUrl) window.open(googleCalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAppleCal = () => {
    downloadICSFile(announcement);
  };

  const handleContact = () => {
    onContact(announcement);
  };

  const handleClaim = () => {
    onClaim(announcement);
  };

  const handleLike = () => {
    onLike(announcement);
  };

  const isLostFound = announcement.category === 'lost-found';
  const uncertainty = checkUncertainty(announcement);
  const isOwner = !!(user?.id && announcement.user_id && user.id === announcement.user_id);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('announcements').delete().eq('id', announcement.id);
    setDeleting(false);
    if (error) {
      setConfirmDelete(false);
      return;
    }
    onDeleted(announcement.id);
    onClose();
  };

  const startEdit = () => {
    setEditTitle(announcement.title);
    setEditBody(announcement.body);
    setEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!editTitle.trim() || !editBody.trim()) {
      setEditError('Title and message cannot be empty.');
      return;
    }
    setEditSubmitting(true);
    const { error } = await supabase.from('announcements').update({
      title: editTitle.trim(),
      body: editBody.trim(),
    }).eq('id', announcement.id);
    setEditSubmitting(false);
    if (error) {
      setEditError('Failed to save changes. You may not have permission.');
      return;
    }
    setEditing(false);
    onEdited();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`relative px-6 pt-6 pb-5 ${announcement.priority === 'urgent' ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-500/15 dark:to-orange-500/15' : 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/15 dark:to-cyan-500/15'} sm:rounded-t-3xl`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              announcement.category === 'emergency' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-white dark:bg-slate-800'
            } shadow-sm`}>
              <Icon className={`w-6 h-6 ${announcement.category === 'emergency' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <div>
              {category && (
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{category.label}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {priority && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${priority.color}`}>
                    <PriorityIcon className="w-3 h-3" />
                    {priority.label}
                  </span>
                )}
                {announcement.is_official ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    <BadgeCheck className="w-3 h-3" />
                    Official
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-500 dark:text-blue-400">
                    <GraduationCap className="w-3 h-3" />
                    Student-posted
                  </span>
                )}
                {announcement.user_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
                {uncertainty.isUncertain && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    <HelpCircle className="w-3 h-3" />
                    Uncertain
                  </span>
                )}
              </div>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              {editError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400">
                  {editError}
                </div>
              )}
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-lg font-bold bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 dark:text-white"
              />
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={5}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-600 dark:text-gray-300 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg hover:shadow-md transition-all disabled:opacity-60"
                >
                  {editSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditError(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white pr-10">{announcement.title}</h2>
          )}
        </div>

        <div className="px-6 py-6">
          {!editing && (
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">{announcement.body}</p>
          )}

          {uncertainty.isUncertain && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">This announcement may be incomplete</p>
              </div>
              <ul className="space-y-1.5 ml-9">
                {uncertainty.reasons.map((reason, i) => (
                  <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                    <span className="text-amber-400 dark:text-amber-500 mt-0.5">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                <User className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">Posted by</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{announcement.author_name}</p>
                  {announcement.user_id && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{announcement.author_role}</p>
              </div>
            </div>
          </div>

          {announcement.academic_branch && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-500/15 rounded-xl mb-4">
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">Academic Branch</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{announcement.academic_branch}</p>
              </div>
            </div>
          )}

          {announcement.society && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/15 rounded-xl mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500">Society / Club</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{societyDisplay(announcement.society)}</p>
              </div>
            </div>
          )}

          {announcement.contact_email && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/15 rounded-xl mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                <Mail className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">Contact</p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">{announcement.contact_email}</p>
              </div>
            </div>
          )}

          {/* Contact + Claim + Like buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleContact}
              className="group flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Contact
            </button>
            {isLostFound && (
              <button
                onClick={handleClaim}
                className="group flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                <KeyRound className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Claim Item
              </button>
            )}
            <button
              onClick={handleLike}
              className={`group flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all ${
                liked
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-200'
                  : 'bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 hover:text-rose-500 dark:hover:text-rose-400'
              }`}
            >
              <Heart className={`w-4 h-4 group-hover:scale-125 transition-transform ${liked ? 'fill-rose-500' : ''}`} />
              {announcement.like_count > 0 && announcement.like_count}
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-slate-700 mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {timeAgo}
            </span>
            {expiryText && (
              <span className="flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4" />
                {expiryText}
              </span>
            )}
          </div>

          {hasDeadline && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                <CalendarPlus className="w-4 h-4" />
                Add to Calendar
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleCal}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Google Calendar
                </button>
                <button
                  onClick={handleAppleCal}
                  className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700/50 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Apple Calendar
                </button>
              </div>
            </div>
          )}

          {/* Updates thread */}
          <UpdateThread
            announcementId={announcement.id}
            announcementUserId={announcement.user_id}
            authorName={announcement.author_name}
            isOwner={isOwner}
          />

          {isOwner && !editing && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={startEdit}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-all"
              >
                <Pencil className="w-4 h-4" />
                Edit Post
              </button>
              {confirmDelete ? (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center justify-center gap-2 flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center justify-center gap-2 flex-1 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/15 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/25 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleDismiss}
            disabled={dismissed}
            className="flex items-center justify-center gap-2 w-full py-3 mt-6 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/15 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/25 transition-all disabled:opacity-60"
          >
            {dismissed ? (
              <>
                <Check className="w-4 h-4" />
                Hidden from your view
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Hide from my view
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
