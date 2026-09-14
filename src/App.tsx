import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/supabase';
import { getDismissedIds, dismissAnnouncement, undismissAnnouncement } from '@/lib/dismissals';
import { getLikedIds, toggleLike } from '@/lib/likes';
import { useAuth } from '@/lib/auth';
import Header from '@/components/Header';
import CategoryBar from '@/components/CategoryBar';
import SocietyFilter from '@/components/SocietyFilter';
import AnnouncementCard from '@/components/AnnouncementCard';
import AnnouncementDetailModal from '@/components/AnnouncementDetailModal';
import CreateAnnouncementModal from '@/components/CreateAnnouncementModal';
import AuthModal from '@/components/AuthModal';
import ContactModal from '@/components/ContactModal';
import ClaimModal from '@/components/ClaimModal';
import Toast, { type ToastData } from '@/components/Toast';
import EmptyState from '@/components/EmptyState';
import HeroBanner from '@/components/HeroBanner';
import AskMyCampus from '@/components/AskMyCampus';
import MessageInbox from '@/components/MessageInbox';
import TaskPanel from '@/components/TaskPanel';
import { Loader2, EyeOff, Eye, Heart, Siren, AlertTriangle, ChevronRight, BadgeCheck } from 'lucide-react';

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

type SortMode = 'newest' | 'oldest' | 'priority';

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, important: 1, info: 2 };

export default function App() {
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSociety, setActiveSociety] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [contactAnnouncement, setContactAnnouncement] = useState<Announcement | null>(null);
  const [claimAnnouncement, setClaimAnnouncement] = useState<Announcement | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [societyCounts, setSocietyCounts] = useState<Record<string, number>>({});
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [dismissedVersion, setDismissedVersion] = useState(0);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeVersion, setLikeVersion] = useState(0);
  const [showLiked, setShowLiked] = useState(true);
  const [showHidden, setShowHidden] = useState(true);
  const [showCritical, setShowCritical] = useState(true);
  const [showInbox, setShowInbox] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
  }, [dismissedVersion]);

  useEffect(() => {
    setLikedIds(getLikedIds());
  }, [likeVersion]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
    }
    setAnnouncements(data || []);
    setLoading(false);
  }, []);

  const fetchCounts = useCallback(async () => {
    const { data } = await supabase.from('announcements').select('category, society');
    const catCounts: Record<string, number> = {};
    const socCounts: Record<string, number> = {};
    (data || []).forEach((row: { category: string; society: string | null }) => {
      catCounts[row.category] = (catCounts[row.category] || 0) + 1;
      if (row.society) {
        socCounts[row.society] = (socCounts[row.society] || 0) + 1;
      }
    });
    setCategoryCounts(catCounts);
    setSocietyCounts(socCounts);
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchCounts();
  }, [fetchAnnouncements, fetchCounts]);

  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }
    const fetchUnread = async () => {
      const { data: userAnns } = await supabase
        .from('announcements')
        .select('id')
        .eq('user_id', user.id);
      if (!userAnns || userAnns.length === 0) {
        setUnreadMessageCount(0);
        return;
      }
      const ids = userAnns.map((a) => a.id);
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('announcement_id', ids)
        .eq('is_read', false);
      setUnreadMessageCount(count || 0);
    };
    fetchUnread();
  }, [user]);

  const handleCreated = () => {
    fetchAnnouncements();
    fetchCounts();
  };

  const handleDismiss = (id: string) => {
    dismissAnnouncement(id);
    setDismissedIds((prev) => new Set([...prev, id]));
    setDismissedVersion((v) => v + 1);
    setSelectedAnnouncement(null);
  };

  const handleUnhide = (id: string) => {
    undismissAnnouncement(id);
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDismissedVersion((v) => v + 1);
  };

  const handleLike = async (announcement: Announcement) => {
    const wasLiked = likedIds.has(announcement.id);
    const nowLiked = toggleLike(announcement.id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (nowLiked) next.add(announcement.id); else next.delete(announcement.id);
      return next;
    });
    setLikeVersion((v) => v + 1);

    const newCount = Math.max(0, announcement.like_count + (nowLiked ? 1 : -1));
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === announcement.id ? { ...a, like_count: newCount } : a))
    );

    const { error } = await supabase
      .from('announcements')
      .update({ like_count: newCount })
      .eq('id', announcement.id);
    if (error) console.error('Failed to update like count:', error);
  };

  const handleContact = (announcement: Announcement) => {
    setContactAnnouncement(announcement);
  };

  const handleContactSent = (recipientName: string) => {
    setToast({ id: Date.now(), message: `Message sent to ${recipientName}!` });
  };

  const handleClaim = (announcement: Announcement) => {
    setClaimAnnouncement(announcement);
  };

  const handleClaimed = (announcement: Announcement) => {
    setToast({ id: Date.now(), message: `Claim confirmed for "${announcement.title}"!` });
  };

  const handleDeleted = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setDismissedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setSelectedAnnouncement(null);
    fetchCounts();
    setToast({ id: Date.now(), message: 'Announcement deleted.' });
  };

  const handleEdited = () => {
    fetchAnnouncements();
    setSelectedAnnouncement(null);
    setToast({ id: Date.now(), message: 'Announcement updated.' });
  };

  const showToast = (message: string) => {
    setToast({ id: Date.now(), message });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory(null);
    setActiveSociety(null);
  };

  // Build category affinity sets from liked and hidden announcements
  const likedCategories = new Set(
    announcements.filter((a) => likedIds.has(a.id)).map((a) => a.category)
  );
  const hiddenCategories = new Set(
    announcements.filter((a) => dismissedIds.has(a.id)).map((a) => a.category)
  );

  // User's society set from profile for feed customization
  const userSocieties = new Set(profile?.societies || []);
  const userBranch = profile?.academic_branch || null;

  const criticalAnnouncements = announcements
    .filter((a) => !dismissedIds.has(a.id))
    .filter((a) => !likedIds.has(a.id))
    .filter((a) => a.priority === 'urgent' || a.category === 'emergency')
    .sort((a, b) => {
      const aEmergency = a.category === 'emergency' ? 0 : 1;
      const bEmergency = b.category === 'emergency' ? 0 : 1;
      if (aEmergency !== bEmergency) return aEmergency - bEmergency;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const criticalIds = new Set(criticalAnnouncements.map((a) => a.id));

  const filtered = announcements
    .filter((a) => !dismissedIds.has(a.id))
    .filter((a) => !likedIds.has(a.id))
    .filter((a) => !criticalIds.has(a.id))
    .filter((a) => {
      if (activeCategory && a.category !== activeCategory) return false;
      if (activeSociety && a.society !== activeSociety) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.body.toLowerCase().includes(q) ||
          a.author_name.toLowerCase().includes(q) ||
          (a.society?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortMode === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortMode === 'priority') return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);

      // Smart sort: emergency/urgent first, then user's societies/branch, then liked-similar, then normal, then hidden-similar last
      const aEmergency = a.priority === 'urgent' || a.category === 'emergency' ? 0 : 1;
      const bEmergency = b.priority === 'urgent' || b.category === 'emergency' ? 0 : 1;
      if (aEmergency !== bEmergency) return aEmergency - bEmergency;

      // Prioritize announcements from the user's enrolled societies
      const aUserSoc = userSocieties.size > 0 && a.society && userSocieties.has(a.society) ? 0 : 1;
      const bUserSoc = userSocieties.size > 0 && b.society && userSocieties.has(b.society) ? 0 : 1;
      if (aUserSoc !== bUserSoc) return aUserSoc - bUserSoc;

      // Prioritize announcements from the user's academic branch
      const aUserBranch = userBranch && a.academic_branch === userBranch ? 0 : 1;
      const bUserBranch = userBranch && b.academic_branch === userBranch ? 0 : 1;
      if (aUserBranch !== bUserBranch) return aUserBranch - bUserBranch;

      const aLikedCat = likedCategories.has(a.category) ? 0 : 1;
      const bLikedCat = likedCategories.has(b.category) ? 0 : 1;
      if (aLikedCat !== bLikedCat) return aLikedCat - bLikedCat;

      const aHiddenCat = hiddenCategories.has(a.category) ? 1 : 0;
      const bHiddenCat = hiddenCategories.has(b.category) ? 1 : 0;
      if (aHiddenCat !== bHiddenCat) return aHiddenCat - bHiddenCat;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const hasFilters = !!searchQuery || !!activeCategory || !!activeSociety;
  const hiddenAnnouncements = announcements.filter((a) => dismissedIds.has(a.id));
  const likedAnnouncements = announcements.filter((a) => likedIds.has(a.id) && !dismissedIds.has(a.id));
  const urgentCount = announcements.filter(
    (a) => a.priority === 'urgent' && !dismissedIds.has(a.id) && (!a.expires_at || new Date(a.expires_at) > new Date())
  ).length;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30 overflow-hidden">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-cyan-200/20 dark:bg-cyan-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-200/15 dark:bg-teal-600/10 rounded-full blur-3xl animate-float-reverse" />
      </div>
      <div className="relative">
      <Header
        onPostClick={() => setShowCreate(true)}
        onLogoClick={resetFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSignInClick={() => setShowAuth(true)}
        onInboxClick={() => setShowInbox(true)}
        onTaskPanelClick={() => setShowTaskPanel(true)}
        unreadMessageCount={unreadMessageCount}
        pendingTaskCount={pendingTaskCount}
      />
      <CategoryBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        counts={categoryCounts}
      />
      <SocietyFilter
        activeSociety={activeSociety}
        onSocietyChange={setActiveSociety}
        counts={societyCounts}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasFilters && !loading && (
          <HeroBanner
            announcementCount={filtered.length}
            urgentCount={urgentCount}
            onPostClick={() => setShowCreate(true)}
          />
        )}

        {/* Section: Critical / Emergency Alerts */}
        {!loading && criticalAnnouncements.length > 0 && (
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 p-[1.5px] shadow-lg shadow-red-500/20 mb-4">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-slate-900 rounded-[14px]">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
                  <Siren className="w-5 h-5 text-white" />
                  <span className="absolute inset-0 rounded-xl bg-red-400 animate-ping opacity-20" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Critical Alerts
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Emergency & urgent announcements requiring immediate attention
                  </p>
                </div>
                <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                  {criticalAnnouncements.length}
                </span>
                <button
                  onClick={() => setShowCritical((v) => !v)}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ml-1 ${
                    showCritical
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 shadow-sm'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:shadow-md'
                  }`}
                >
                  {showCritical ? <EyeOff className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> : <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                  {showCritical ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>
            {showCritical && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {criticalAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="group relative bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden border-[10px] border-red-200 dark:border-red-500/40 hover:shadow-2xl hover:shadow-red-300/40 dark:hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-slide-up"
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
                    {announcement.priority === 'urgent' && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${
                          announcement.category === 'emergency' ? 'bg-red-100 dark:bg-red-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
                        }`}>
                          {announcement.category === 'emergency' ? (
                            <Siren className="w-5 h-5 text-red-600 dark:text-red-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          )}
                          <span className={`absolute inset-0 rounded-xl animate-ping opacity-20 ${announcement.category === 'emergency' ? 'bg-red-400' : 'bg-amber-400'}`} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                            announcement.priority === 'urgent'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}>
                            {announcement.priority === 'urgent' ? <AlertTriangle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {announcement.priority === 'urgent' ? 'Urgent' : 'Important'}
                          </span>
                          {announcement.is_official && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              <BadgeCheck className="w-3 h-3" />
                              Official
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto whitespace-nowrap">
                          {timeAgo(announcement.created_at)}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                        {announcement.body}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-red-100 dark:border-red-500/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                            {announcement.author_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{announcement.author_name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{announcement.author_role}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-red-500 dark:group-hover:text-red-400 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section: Hidden Announcements */}
        {!loading && hiddenAnnouncements.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center">
                <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-500 dark:text-gray-400">
                Hidden Announcements
              </h2>
              <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400">
                {hiddenAnnouncements.length}
              </span>
              <button
                onClick={() => setShowHidden((v) => !v)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ml-1 ${
                  showHidden
                    ? 'bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-600 shadow-sm'
                    : 'bg-gray-50/80 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:shadow-md'
                }`}
              >
                {showHidden ? <EyeOff className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> : <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                {showHidden ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHidden && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {hiddenAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="relative">
                    <div className="absolute inset-0 bg-gray-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center gap-3">
                      <EyeOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium text-center px-4">{announcement.title}</p>
                      <button
                        onClick={() => handleUnhide(announcement.id)}
                        className="group flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        Unhide
                      </button>
                    </div>
                    <AnnouncementCard
                      announcement={announcement}
                      onClick={() => setSelectedAnnouncement(announcement)}
                      onDismiss={handleDismiss}
                      onContact={handleContact}
                      onClaim={handleClaim}
                      onLike={handleLike}
                      liked={likedIds.has(announcement.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section: Liked Announcements */}
        {!loading && likedAnnouncements.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Liked Announcements
              </h2>
              <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-rose-100 text-rose-600">
                {likedAnnouncements.length}
              </span>
              <button
                onClick={() => setShowLiked((v) => !v)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ml-1 ${
                  showLiked
                    ? 'bg-rose-100 text-rose-700 border-rose-300 shadow-sm'
                    : 'bg-rose-50/80 text-rose-600 border-rose-200 hover:bg-rose-100 hover:shadow-md'
                }`}
              >
                {showLiked ? <EyeOff className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> : <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                {showLiked ? 'Hide' : 'Show'}
              </button>
            </div>
            {showLiked && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {likedAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onClick={() => setSelectedAnnouncement(announcement)}
                    onDismiss={handleDismiss}
                    onContact={handleContact}
                    onClaim={handleClaim}
                    onLike={handleLike}
                    liked={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section: Latest Announcements */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {hasFilters
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
                : 'Latest Announcements'}
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 hidden sm:inline">Sort by</label>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="text-sm bg-white/80 backdrop-blur border border-gray-200 rounded-full px-3 py-1.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-blue-200 blur-xl opacity-50 animate-pulse" />
                <Loader2 className="relative w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500">Loading announcements...</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onClick={() => setSelectedAnnouncement(announcement)}
                  onDismiss={handleDismiss}
                  onContact={handleContact}
                  onClaim={handleClaim}
                  onLike={handleLike}
                  liked={likedIds.has(announcement.id)}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      <footer className="border-t border-white/40 dark:border-white/10 mt-12 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Campus Connect — a prototype for campus announcements and news.
        </div>
      </footer>

      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        onDismiss={handleDismiss}
        onContact={handleContact}
        onClaim={handleClaim}
        onLike={handleLike}
        liked={selectedAnnouncement ? likedIds.has(selectedAnnouncement.id) : false}
        onDeleted={handleDeleted}
        onEdited={handleEdited}
      />
      <CreateAnnouncementModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
        onSignInRequired={() => {
          setShowCreate(false);
          setShowAuth(true);
        }}
      />
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
      />
      <ContactModal
        announcement={contactAnnouncement}
        onClose={() => setContactAnnouncement(null)}
        onSent={handleContactSent}
      />
      <ClaimModal
        announcement={claimAnnouncement}
        onClose={() => setClaimAnnouncement(null)}
        onClaimed={handleClaimed}
      />
      <MessageInbox
        isOpen={showInbox}
        onClose={() => setShowInbox(false)}
      />
      <TaskPanel
        isOpen={showTaskPanel}
        onClose={() => setShowTaskPanel(false)}
        announcements={announcements}
        onTaskCountChange={setPendingTaskCount}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <AskMyCampus
        announcements={announcements}
        onResultClick={(a) => setSelectedAnnouncement(a)}
      />
      </div>
    </div>
  );
}
