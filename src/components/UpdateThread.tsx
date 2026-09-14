import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Send, Loader2, CheckCircle2, ShieldCheck, BadgeCheck, Plus, X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AnnouncementUpdate } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type UpdateThreadProps = {
  announcementId: string;
  announcementUserId: string | null;
  authorName: string;
  isOwner: boolean;
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
  return `${days}d ago`;
}

export default function UpdateThread({ announcementId, announcementUserId, authorName, isOwner }: UpdateThreadProps) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<AnnouncementUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState('');
  const [markResolved, setMarkResolved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    const { data } = await supabase
      .from('announcement_updates')
      .select('*')
      .eq('announcement_id', announcementId)
      .order('created_at', { ascending: true });
    setUpdates(data || []);
    setLoading(false);
  }, [announcementId]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError('Please write an update message.');
      return;
    }

    if (!isOwner) {
      setError('Only the person who posted this announcement can add updates.');
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('announcement_updates').insert({
      announcement_id: announcementId,
      author_name: user?.email?.split('@')[0] || authorName,
      body: body.trim(),
      is_resolved: markResolved,
      user_id: user?.id || null,
    });
    setSubmitting(false);

    if (insertError) {
      setError('Failed to post update. Only the announcement owner can add updates.');
      return;
    }

    setBody('');
    setMarkResolved(false);
    setShowForm(false);
    fetchUpdates();
  };

  const handleDeleteUpdate = async (updateId: string) => {
    setDeletingId(updateId);
    const { error: deleteError } = await supabase
      .from('announcement_updates')
      .delete()
      .eq('id', updateId);
    setDeletingId(null);

    if (deleteError) {
      setError('Failed to delete update. You may not have permission.');
      return;
    }

    fetchUpdates();
  };

  const hasResolved = updates.some((u) => u.is_resolved);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Updates {updates.length > 0 && `(${updates.length})`}
        </h3>
        {hasResolved && (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-400 dark:text-gray-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => (
            <div
              key={update.id}
              className={`p-3 rounded-xl border ${
                update.is_resolved
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {update.author_name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{update.author_name}</span>
                {update.user_id && (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{timeAgo(update.created_at)}</span>
                {isOwner && (
                  <button
                    onClick={() => handleDeleteUpdate(update.id)}
                    disabled={deletingId === update.id}
                    className="ml-1 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-all disabled:opacity-60"
                    title="Delete update"
                  >
                    {deletingId === update.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
              {update.is_resolved && (
                <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolved
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{update.body}</p>
            </div>
          ))}

          {updates.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No updates yet. The poster can add updates here as things progress.</p>
          )}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 p-4 bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Post an Update</p>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="e.g. The lost water bottle has been found! Thanks everyone for looking out."
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
          />

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={markResolved}
                onChange={(e) => setMarkResolved(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Mark as resolved</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg hover:shadow-md transition-all disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Update
              </>
            )}
          </button>
        </form>
      ) : isOwner ? (
        <button
          onClick={() => setShowForm(true)}
          className="group flex items-center gap-1.5 mt-3 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-all"
        >
          <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
          Add Update
        </button>
      ) : (
        !user && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Only the announcement owner can post updates
          </p>
        )
      )}

      {!user && isOwner === false && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Sign in for a verified badge on your updates
        </p>
      )}
    </div>
  );
}
