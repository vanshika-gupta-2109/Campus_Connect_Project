import { useEffect, useState, useCallback } from 'react';
import { X, Mail, EyeOff, Inbox, Trash2, Loader2, BadgeCheck, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type MessageInboxProps = {
  isOpen: boolean;
  onClose: () => void;
};

type MessageRow = {
  id: string;
  announcement_id: string;
  sender_name: string;
  sender_email: string | null;
  body: string;
  is_anonymous: boolean;
  is_read: boolean;
  created_at: string;
  announcements: Pick<Announcement, 'title' | 'author_name'> | null;
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

export default function MessageInbox({ isOpen, onClose }: MessageInboxProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: userAnnouncements } = await supabase
      .from('announcements')
      .select('id, title, author_name')
      .eq('user_id', user.id);

    if (!userAnnouncements || userAnnouncements.length === 0) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const announcementIds = userAnnouncements.map((a) => a.id);
    const announcementMap = new Map(userAnnouncements.map((a) => [a.id, a]));

    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .in('announcement_id', announcementIds)
      .order('created_at', { ascending: false });

    const mapped: MessageRow[] = (msgData || []).map((m) => ({
      ...m,
      announcements: announcementMap.get(m.announcement_id) || null,
    }));

    setMessages(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      document.body.style.overflow = 'hidden';
      fetchMessages();
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen, user, fetchMessages]);

  const markAsRead = async (msgId: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', msgId);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, is_read: true } : m))
    );
  };

  const deleteMessage = async (msgId: string) => {
    await supabase.from('messages').delete().eq('id', msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  if (!isOpen) return null;

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-br from-indigo-500 to-blue-600 sm:rounded-t-3xl shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Message Inbox</h2>
              <p className="text-xs text-blue-100">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <Mail className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No messages yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs">
                When someone sends you a message about your announcements, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    msg.is_read
                      ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                      : 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        msg.is_anonymous
                          ? 'bg-indigo-100 dark:bg-indigo-500/20'
                          : 'bg-gradient-to-br from-blue-400 to-cyan-500'
                      }`}>
                        {msg.is_anonymous ? (
                          <EyeOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {msg.sender_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {msg.is_anonymous ? 'Anonymous' : msg.sender_name}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {msg.is_anonymous ? (
                            <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Hidden identity</span>
                          ) : (
                            msg.sender_email && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{msg.sender_email}</span>
                            )
                          )}
                          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {!msg.is_read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>

                  {msg.announcements && (
                    <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{msg.announcements.title}</p>
                    </div>
                  )}

                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap mb-3">
                    {msg.body}
                  </p>

                  <div className="flex items-center gap-2">
                    {!msg.is_read && (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-all"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-500 dark:hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
