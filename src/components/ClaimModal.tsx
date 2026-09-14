import { useEffect, useState } from 'react';
import { X, KeyRound, Lock, Unlock, Mail, User, BadgeCheck, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import type { Announcement } from '@/lib/supabase';

type ClaimModalProps = {
  announcement: Announcement | null;
  onClose: () => void;
  onClaimed: (announcement: Announcement) => void;
};

export default function ClaimModal({ announcement, onClose, onClaimed }: ClaimModalProps) {
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimerName, setClaimerName] = useState('');
  const [claimerContact, setClaimerContact] = useState('');

  useEffect(() => {
    if (announcement) {
      document.body.style.overflow = 'hidden';
      setAnswer('');
      setAttempts(0);
      setVerified(false);
      setError(null);
      setClaimerName('');
      setClaimerContact('');
      return () => { document.body.style.overflow = ''; };
    }
  }, [announcement]);

  if (!announcement) return null;

  const hasSecurityQuestion = !!announcement.security_question && !!announcement.security_answer;
  const recipientEmail = announcement.contact_email;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!answer.trim()) {
      setError('Please enter your answer.');
      return;
    }

    const expected = (announcement.security_answer || '').trim().toLowerCase();
    const provided = answer.trim().toLowerCase();

    if (provided === expected) {
      setVerified(true);
      setError(null);
    } else {
      setAttempts((a) => a + 1);
      setError('Incorrect answer. Please try again.');
    }
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    onClaimed(announcement);
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
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-br from-amber-500 to-orange-600 sm:rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Claim Item</h2>
              <p className="text-xs text-amber-100">Verify ownership to reveal contact details</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Item summary */}
          <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl mb-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Item</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{announcement.title}</p>
          </div>

          {!hasSecurityQuestion && (
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded-xl mb-4">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                The poster didn't set a security question. You can proceed to view their contact information.
              </p>
            </div>
          )}

          {/* Step 1: Answer security question */}
          {hasSecurityQuestion && !verified && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Security Question</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-xl mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">{announcement.security_question}</p>
              </div>

              {error && (
                <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Your Answer</label>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  <Unlock className="w-4 h-4" />
                  Verify Answer
                </button>
              </form>

              {attempts >= 2 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                  Multiple incorrect attempts. Make sure you're the rightful owner of this item.
                </p>
              )}
            </div>
          )}

          {/* Step 2: Contact info revealed */}
          {(verified || !hasSecurityQuestion) && (
            <div className="animate-bounce-in">
              {hasSecurityQuestion && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-xl mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Verified! Contact details unlocked.</p>
                </div>
              )}

              {/* Poster contact info revealed */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/15 dark:to-teal-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-xl mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {announcement.author_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{announcement.author_name}</p>
                      {announcement.user_id && <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{announcement.author_role}</p>
                  </div>
                </div>
                {recipientEmail && (
                  <a
                    href={`mailto:${recipientEmail}?subject=Re: ${encodeURIComponent(announcement.title)}`}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-400 transition-all group"
                  >
                    <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate flex-1">{recipientEmail}</span>
                    <span className="text-xs text-emerald-500 dark:text-emerald-400 group-hover:underline shrink-0">Email now</span>
                  </a>
                )}
                {!recipientEmail && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">No contact email provided. Use the Contact Person button to send a message.</p>
                )}
              </div>

              {/* Optional: claimant info */}
              <form onSubmit={handleClaim} className="space-y-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Let the poster know who you are (optional):</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={claimerName}
                      onChange={(e) => setClaimerName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={claimerContact}
                      onChange={(e) => setClaimerContact(e.target.value)}
                      placeholder="Your email"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Claim
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
