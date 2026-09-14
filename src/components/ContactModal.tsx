import { useEffect, useState } from 'react';
import { X, Mail, Send, Loader2, User, BadgeCheck, ShieldCheck, EyeOff, Eye } from 'lucide-react';
import type { Announcement } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type ContactModalProps = {
  announcement: Announcement | null;
  onClose: () => void;
  onSent: (recipientName: string) => void;
};

export default function ContactModal({ announcement, onClose, onSent }: ContactModalProps) {
  const { user } = useAuth();
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (announcement) {
      document.body.style.overflow = 'hidden';
      if (user?.email) {
        setSenderEmail(user.email);
        setSenderName(user.email.split('@')[0]);
      }
      return () => { document.body.style.overflow = ''; };
    }
  }, [announcement, user]);

  if (!announcement) return null;

  const recipientEmail = announcement.contact_email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAnonymous && !senderName.trim()) {
      setError('Please enter your name or switch to anonymous mode.');
      return;
    }
    if (!isAnonymous && !senderEmail.trim()) {
      setError('Please enter your email or switch to anonymous mode.');
      return;
    }
    if (!message.trim()) {
      setError('Please type a message.');
      return;
    }

    setSending(true);

    const { error: insertError } = await supabase.from('messages').insert({
      announcement_id: announcement.id,
      sender_name: isAnonymous ? 'Anonymous' : senderName.trim(),
      sender_email: isAnonymous ? null : senderEmail.trim(),
      body: message.trim(),
      is_anonymous: isAnonymous,
    });

    setSending(false);

    if (insertError) {
      setError('Failed to send message. Please try again.');
      return;
    }

    onSent(announcement.author_name);
    setMessage('');
    setSenderName('');
    setSenderEmail('');
    setIsAnonymous(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-br from-blue-500 to-cyan-600 sm:rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Contact Person</h2>
              <p className="text-xs text-blue-100">Send a message to the poster</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Recipient info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {announcement.author_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{announcement.author_name}</p>
                {announcement.user_id && (
                  <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{announcement.author_role}</p>
              {recipientEmail && (
                <p className="text-xs text-blue-500 dark:text-blue-400 truncate flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" />
                  {recipientEmail}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Anonymous toggle */}
            <button
              type="button"
              onClick={() => setIsAnonymous((v) => !v)}
              className={`group flex items-center gap-2.5 w-full p-3 rounded-xl border transition-all ${
                isAnonymous
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/40 shadow-sm'
                  : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isAnonymous ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-600'
              }`}>
                {isAnonymous ? (
                  <EyeOff className="w-4.5 h-4.5 text-white" />
                ) : (
                  <Eye className="w-4.5 h-4.5 text-gray-500 dark:text-gray-300" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className={`text-sm font-semibold ${isAnonymous ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>
                  Send anonymously
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isAnonymous
                    ? 'Your name and email will be hidden from the poster'
                    : 'Toggle to hide your identity from the poster'}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all ${
                isAnonymous
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-gray-300 dark:border-slate-600'
              }`}>
                {isAnonymous && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>

            {!isAnonymous && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Your Name *</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Your Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="you@campus.edu"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Hi, I'm interested in your announcement. Could you share more details about..."
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
              />
            </div>

            {isAnonymous && (
              <div className="flex items-start gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  Your identity is protected. The poster will only see the message content, not your name or email.
                </p>
              </div>
            )}

            {!recipientEmail && !isAnonymous && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  The poster didn't share a contact email. Your message will be delivered to their inbox on Campus Connect.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="group flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  {isAnonymous ? 'Send Anonymously' : 'Send Message'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
