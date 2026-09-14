import { useEffect, useState, useCallback } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle, Loader2, Sparkles, ListTodo } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Announcement } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { extractTasksFromAnnouncements, type ExtractedTask } from '@/lib/taskExtractor';

type TaskPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  onTaskCountChange?: (count: number) => void;
};

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  is_ai_generated: boolean;
  source_announcement_id: string | null;
  created_at: string;
};

export default function TaskPanel({ isOpen, onClose, announcements, onTaskCountChange }: TaskPanelProps) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);
  const [autoScanned, setAutoScanned] = useState(false);

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('todos')
      .select('id, title, completed, is_ai_generated, source_announcement_id, created_at')
      .eq('user_id', user.id)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching todos:', error);
    }
    setTodos(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      document.body.style.overflow = 'hidden';
      fetchTodos();
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen, user, fetchTodos]);

  useEffect(() => {
    const pending = todos.filter((t) => !t.completed).length;
    onTaskCountChange?.(pending);
  }, [todos, onTaskCountChange]);

  const autoExtractTasks = useCallback(async () => {
    if (!user || autoScanned || announcements.length === 0) return;

    const existingTitles = new Set(todos.map((t) => t.title.toLowerCase()));
    const existingAnnouncementIds = new Set(
      todos.filter((t) => t.source_announcement_id).map((t) => t.source_announcement_id)
    );

    const extracted = extractTasksFromAnnouncements(announcements);
    const newTasks = extracted.filter(
      (t) =>
        !existingTitles.has(t.title.toLowerCase()) &&
        !existingAnnouncementIds.has(t.announcementId)
    );

    if (newTasks.length === 0) {
      setAutoScanned(true);
      return;
    }

    const rows = newTasks.map((t) => ({
      title: t.title,
      is_ai_generated: true,
      source_announcement_id: t.announcementId,
    }));

    const { data, error } = await supabase
      .from('todos')
      .insert(rows)
      .select('id, title, completed, is_ai_generated, source_announcement_id, created_at');

    if (!error && data) {
      setTodos((prev) => [...data, ...prev]);
    }
    setAutoScanned(true);
  }, [user, autoScanned, announcements, todos]);

  useEffect(() => {
    if (isOpen && user && !autoScanned && announcements.length > 0 && todos.length >= 0) {
      autoExtractTasks();
    }
  }, [isOpen, user, autoScanned, announcements, todos.length, autoExtractTasks]);

  const handleAdd = async () => {
    if (!user || !newTask.trim()) return;
    setAdding(true);
    const { data, error } = await supabase
      .from('todos')
      .insert({ title: newTask.trim() })
      .select('id, title, completed, is_ai_generated, source_announcement_id, created_at')
      .maybeSingle();

    if (error) {
      console.error('Error adding todo:', error);
    } else if (data) {
      setTodos((prev) => [data, ...prev]);
    }
    setNewTask('');
    setAdding(false);
  };

  const handleToggle = async (id: string, completed: boolean) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
    );
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id);
    if (error) console.error('Error toggling todo:', error);
  };

  const handleDelete = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) console.error('Error deleting todo:', error);
  };

  if (!isOpen) return null;

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-sm h-[80vh] sm:h-[600px] sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-5 pt-4 pb-3 bg-gradient-to-br from-emerald-500 to-teal-600 sm:rounded-t-3xl shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">My Tasks</h2>
              <p className="text-xs text-emerald-100">
                {pending.length} pending · {completed.length} done
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Add a task..."
              className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            <button
              onClick={handleAdd}
              disabled={!newTask.trim() || adding}
              className="group w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <p className="text-xs text-gray-400 dark:text-gray-500">Loading tasks...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <ListTodo className="w-7 h-7 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No tasks yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-[200px]">
                Add tasks manually or let AI auto-detect them from announcements.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {pending.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-1">
                  Pending
                </p>
              )}
              {pending.map((todo) => (
                <TaskRow
                  key={todo.id}
                  todo={todo}
                  onToggle={() => handleToggle(todo.id, todo.completed)}
                  onDelete={() => handleDelete(todo.id)}
                />
              ))}

              {completed.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-4 mb-2 px-1">
                    Completed
                  </p>
                  {completed.map((todo) => (
                    <TaskRow
                      key={todo.id}
                      todo={todo}
                      onToggle={() => handleToggle(todo.id, todo.completed)}
                      onDelete={() => handleDelete(todo.id)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {autoScanned && pending.some((t) => t.is_ai_generated) && (
          <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/15 border-t border-emerald-100 dark:border-emerald-500/20 shrink-0">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI-suggested tasks from announcements
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ todo, onToggle, onDelete }: { todo: Todo; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="group flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
      <button
        onClick={onToggle}
        className="shrink-0 transition-transform hover:scale-110"
      >
        {todo.completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-emerald-400" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${todo.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
          {todo.title}
        </p>
        {todo.is_ai_generated && (
          <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" />
            AI-suggested
          </span>
        )}
      </div>
      <button
        onClick={onDelete}
        className="shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
