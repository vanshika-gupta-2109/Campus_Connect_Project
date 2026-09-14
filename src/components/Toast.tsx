import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export type ToastData = {
  id: number;
  message: string;
};

type ToastProps = {
  toast: ToastData | null;
  onClose: () => void;
};

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => onClose(), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-bounce-in">
      <div className="flex items-center gap-3 pl-4 pr-3 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-emerald-100 dark:border-emerald-500/30 max-w-sm">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1">{toast.message}</p>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
