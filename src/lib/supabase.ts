import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Announcement = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  author_name: string;
  author_role: string;
  society: string | null;
  is_official: boolean;
  contact_email: string | null;
  user_id: string | null;
  security_question: string | null;
  security_answer: string | null;
  like_count: number;
  academic_branch: string | null;
  created_at: string;
  expires_at: string | null;
};

export type AnnouncementInput = Omit<Announcement, 'id' | 'created_at' | 'user_id'>;

export type AnnouncementUpdate = {
  id: string;
  announcement_id: string;
  author_name: string;
  body: string;
  is_resolved: boolean;
  user_id: string | null;
  created_at: string;
};

export const CATEGORIES = [
  { value: 'academic', label: 'Academic', icon: 'GraduationCap' },
  { value: 'events', label: 'Events', icon: 'CalendarDays' },
  { value: 'housing', label: 'Housing', icon: 'Home' },
  { value: 'lost-found', label: 'Lost & Found', icon: 'Search' },
  { value: 'clubs', label: 'Clubs', icon: 'Users' },
  { value: 'sports', label: 'Sports', icon: 'Trophy' },
  { value: 'emergency', label: 'Emergency', icon: 'Siren' },
  { value: 'general', label: 'General', icon: 'Megaphone' },
] as const;

export const PRIORITIES = [
  { value: 'info', label: 'Info', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', border: 'border-sky-200' },
  { value: 'important', label: 'Important', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
] as const;

export const ACADEMIC_BRANCHES = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biotechnology',
  'Architecture',
  'Business Administration',
  'Economics',
  'Arts & Humanities',
  'Sciences (Physics/Chemistry/Maths)',
] as const;

export const SOCIETIES = [
  'Tarannum',
  'Avira',
  'Hypnotics',
  'Greensphere',
  'Rotaract Club',
  'Synergy',
  'Bhav',
  'Soch',
  'TechNeeds',
  'AssetMerkle',
  'Robolution',
  'ACM Student Chapter',
  'TechnoLiterati',
  'Finivesta',
] as const;

export const SOCIETY_EMOJIS: Record<string, string> = {
  'Tarannum': '🎵',
  'Avira': '🥋',
  'Hypnotics': '🕺',
  'Greensphere': '🌳',
  'Rotaract Club': '🤝',
  'Synergy': '🏀',
  'Bhav': '💬',
  'Soch': '🎨',
  'TechNeeds': '💻',
  'AssetMerkle': '🔗',
  'Robolution': '🤖',
  'ACM Student Chapter': '🏆',
  'TechnoLiterati': '📚',
  'Finivesta': '💰',
};

export function societyDisplay(name: string | null): string {
  if (!name) return '';
  const emoji = SOCIETY_EMOJIS[name];
  return emoji ? `${name} ${emoji}` : name;
}
