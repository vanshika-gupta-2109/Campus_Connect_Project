import { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle, AlertTriangle, Clock, Building2, BadgeCheck, GraduationCap, Mail, ShieldCheck, KeyRound, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AnnouncementInput } from '@/lib/supabase';
import { CATEGORIES, PRIORITIES, SOCIETIES, societyDisplay, ACADEMIC_BRANCHES } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type CreateAnnouncementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  onSignInRequired: () => void;
};

const EMPTY_FORM: AnnouncementInput = {
  title: '',
  body: '',
  category: 'general',
  priority: 'info',
  author_name: '',
  author_role: '',
  society: null,
  is_official: false,
  contact_email: null,
  security_question: null,
  security_answer: null,
  academic_branch: null,
  expires_at: null,
};

const PRIORITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Clock,
  important: AlertCircle,
  urgent: AlertTriangle,
};

export default function CreateAnnouncementModal({ isOpen, onClose, onCreated, onSignInRequired }: CreateAnnouncementModalProps) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState<AnnouncementInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        contact_email: prev.contact_email || user?.email || null,
        academic_branch: prev.academic_branch || profile?.academic_branch || null,
      }));
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.body.trim() || !form.author_name.trim() || !form.author_role.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...form,
      society: form.society || null,
      is_official: form.is_official,
      contact_email: form.contact_email || null,
      expires_at: form.expires_at || null,
      user_id: user?.id || null,
    };
    const { error: insertError } = await supabase.from('announcements').insert(payload);
    setSubmitting(false);

    if (insertError) {
      setError('Failed to post announcement. Please try again.');
      return;
    }

    setForm(EMPTY_FORM);
    onCreated();
    onClose();
  };

  const field = (key: keyof AnnouncementInput, value: string | null | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const showContactField = form.category === 'housing' || form.category === 'lost-found';
  const showSecurityFields = form.category === 'lost-found';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between sm:rounded-t-3xl z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Announcement</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!user && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Sign in for a verified badge</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Signed-in posters get a "Verified" tag so others know the info is legit.{' '}
                  <button type="button" onClick={onSignInRequired} className="font-semibold underline">
                    Sign in now
                  </button>
                </p>
              </div>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
              <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Posting as <span className="font-semibold">{user.email}</span> — your post will show a Verified badge.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => field('title', e.target.value)}
              placeholder="e.g. Library Hours Extended for End-Sem Exams"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Message *</label>
            <textarea
              value={form.body}
              onChange={(e) => field('body', e.target.value)}
              rows={4}
              placeholder="Write the full announcement details here..."
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => field('category', e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Priority *</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRIORITIES.map((p) => {
                  const PIcon = PRIORITY_ICON[p.value] || Clock;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => field('priority', p.value)}
                      className={`flex flex-col items-center gap-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                        form.priority === p.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <PIcon className="w-4 h-4" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {profile?.academic_branch ? (
            <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Posting from <span className="font-semibold">{profile.academic_branch}</span>
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Academic Branch (optional)</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <select
                  value={form.academic_branch || ''}
                  onChange={(e) => field('academic_branch', e.target.value || null)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                  <option value="">No specific branch</option>
                  {ACADEMIC_BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Society / Club (optional)</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <select
                value={form.society || ''}
                onChange={(e) => field('society', e.target.value || null)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              >
                <option value="">No specific society</option>
                {SOCIETIES.map((s) => (
                  <option key={s} value={s}>{societyDisplay(s)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Post Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => field('is_official', false)}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                  !form.is_official
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Student Post
              </button>
              <button
                type="button"
                onClick={() => field('is_official', true)}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                  form.is_official
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <BadgeCheck className="w-4 h-4" />
                Official Post
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Your Name *</label>
              <input
                type="text"
                value={form.author_name}
                onChange={(e) => field('author_name', e.target.value)}
                placeholder="Priya Sharma"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Your Role *</label>
              <input
                type="text"
                value={form.author_role}
                onChange={(e) => field('author_role', e.target.value)}
                placeholder="e.g. Student, Professor, Club Secretary"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {(showContactField || form.contact_email) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Contact Email {showContactField && '*'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={form.contact_email || ''}
                  onChange={(e) => field('contact_email', e.target.value || null)}
                  placeholder="How others can reach you"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              {showContactField && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  A "Contact" button will appear on your announcement so interested people can email you.
                </p>
              )}
            </div>
          )}

          {showSecurityFields && (
            <div className="p-4 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Claim Verification (optional)</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Set a secret question that claimants must answer before seeing your contact info.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Security Question</label>
                <input
                  type="text"
                  value={form.security_question || ''}
                  onChange={(e) => field('security_question', e.target.value || null)}
                  placeholder="e.g. What colour is the phone case?"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Answer</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={form.security_answer || ''}
                    onChange={(e) => field('security_answer', e.target.value || null)}
                    placeholder="e.g. Blue"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">The answer is checked case-insensitively when someone tries to claim the item.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Expiration Date (optional)</label>
            <input
              type="date"
              value={form.expires_at ? form.expires_at.split('T')[0] : ''}
              onChange={(e) => field('expires_at', e.target.value ? `${e.target.value}T23:59:59Z` : null)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Announcement'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
