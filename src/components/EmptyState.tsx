import { Megaphone, SearchX } from 'lucide-react';

type EmptyStateProps = {
  hasFilters: boolean;
  onReset: () => void;
};

export default function EmptyState({ hasFilters, onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 blur-2xl opacity-50" />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/15 dark:to-cyan-500/15 flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-blue-500/20 animate-float">
          {hasFilters ? (
            <SearchX className="w-12 h-12 text-blue-300 dark:text-blue-400" />
          ) : (
            <Megaphone className="w-12 h-12 text-blue-300 dark:text-blue-400" />
          )}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {hasFilters ? 'No matching announcements' : 'No announcements yet'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        {hasFilters
          ? 'Try adjusting your search or category filter.'
          : 'Be the first to post a campus announcement.'}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="group px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
