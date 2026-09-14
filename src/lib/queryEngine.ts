import type { Announcement } from '@/lib/supabase';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  results?: Announcement[];
};

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'shall', 'to', 'of', 'in',
  'on', 'at', 'by', 'for', 'with', 'about', 'as', 'into', 'like',
  'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'without', 'before', 'under', 'around', 'among', 'and', 'or', 'but',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'this',
  'that', 'these', 'those', 'i', 'me', 'my', 'we', 'us', 'our', 'you',
  'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them',
  'their', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where',
  'why', 'how', 'all', 'any', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'there', 'here', 'from', 'up', 'down', 'off', 'above', 'below',
  'find', 'get', 'tell', 'show', 'give', 'list', 'want', 'need', 'know',
  'see', 'look', 'check', 'ask', 'any', 'for', 'me', 'please',
]);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  academic: ['assignment', 'exam', 'midterm', 'final', 'registration', 'course', 'class', 'professor', 'grade', 'deadline', 'submission', 'fee', 'tuition', 'schedule', 'syllabus', 'quiz', 'homework', 'study', 'library', 'wifi', 'wi-fi', 'internet'],
  events: ['event', 'fair', 'career', 'festival', 'concert', 'audition', 'exhibition', 'open mic', 'tournament', 'competition', 'sign-up', 'signup', 'register', 'registration'],
  housing: ['housing', 'apartment', 'dorm', 'room', 'sublet', 'rent', 'roommate', 'lease'],
  'lost-found': ['lost', 'found', 'missing', 'water bottle', 'wallet', 'phone', 'keys', 'bag', 'jacket'],
  clubs: ['club', 'society', 'meeting', 'robotics', 'drama', 'debate', 'chess', 'photography', 'music', 'volunteer', 'tutor'],
  sports: ['sports', 'basketball', 'game', 'match', 'tournament', 'team', 'gym', 'athletics', 'soccer', 'football', 'tennis'],
  emergency: ['emergency', 'closed', 'closure', 'cancelled', 'canceled', 'danger', 'alert', 'warning', 'evacuation', 'damage'],
  general: ['general', 'announcement', 'notice', 'info', 'update'],
};

const SOCIETY_KEYWORDS: Record<string, string[]> = {
  'Tarannum': ['music', 'open mic', 'singing', 'band', 'instrument', 'song', 'tarannum'],
  'Avira': ['martial arts', 'karate', 'taekwondo', 'self defense', 'avira', 'martial'],
  'Hypnotics': ['dance', 'choreography', 'hip hop', 'dance crew', 'hypnotics'],
  'Greensphere': ['eco', 'environment', 'sustainability', 'green', 'nature', 'greensphere', 'tree', 'plantation'],
  'Rotaract Club': ['volunteer', 'tutor', 'community', 'engagement', 'after-school', 'service', 'rotaract'],
  'Synergy': ['athletics', 'track', 'running', 'sports', 'basketball', 'football', 'cricket', 'synergy'],
  'Bhav': ['debate', 'speaking', 'argument', 'tournament', 'bhav', 'public speaking'],
  'Soch': ['arts', 'painting', 'drawing', 'sketch', 'creative', 'soch', 'art club'],
  'TechNeeds': ['tech', 'technology', 'coding', 'programming', 'techneeds', 'hackathon'],
  'AssetMerkle': ['blockchain', 'crypto', 'web3', 'assetmerkle', 'defi', 'fintech'],
  'Robolution': ['robotics', 'robot', 'engineering', 'circuits', 'robolution', 'iot', 'automation'],
  'ACM Student Chapter': ['acm', 'coding', 'competitive programming', 'algorithm', 'acm student chapter', 'contest'],
  'TechnoLiterati': ['technical', 'literature', 'tech writing', 'technoliterati', 'quiz', 'tech quiz'],
};

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function scoreAnnouncement(announcement: Announcement, query: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  let score = 0;
  const titleLower = announcement.title.toLowerCase();
  const bodyLower = announcement.body.toLowerCase();
  const allText = `${titleLower} ${bodyLower} ${announcement.author_name.toLowerCase()} ${announcement.society?.toLowerCase() || ''} ${announcement.author_role.toLowerCase()}`;

  for (const token of tokens) {
    if (titleLower.includes(token)) score += 3;
    if (bodyLower.includes(token)) score += 1;
    if (announcement.society?.toLowerCase().includes(token)) score += 2;
    if (announcement.author_name.toLowerCase().includes(token)) score += 1;
  }

  // Category keyword matching
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (announcement.category === cat) {
      for (const kw of keywords) {
        if (query.toLowerCase().includes(kw)) {
          score += 2;
        }
      }
    }
  }

  // Society keyword matching
  for (const [society, keywords] of Object.entries(SOCIETY_KEYWORDS)) {
    if (announcement.society === society) {
      for (const kw of keywords) {
        if (query.toLowerCase().includes(kw)) {
          score += 2;
        }
      }
    }
  }

  // Boost official announcements slightly
  if (announcement.is_official) score += 0.5;

  // Boost urgent/important
  if (announcement.priority === 'urgent') score += 1;
  if (announcement.priority === 'important') score += 0.5;

  return score;
}

const SUGGESTED_QUESTIONS = [
  'Where is the Math assignment submission box?',
  'Are there any hackathons accepting registrations today?',
  'What is the deadline for fee payment for 2nd year B.Tech?',
  'Any career fairs coming up?',
  'When is the next Synergy sports event?',
  'Is the library open?',
  'Are there any lost and found items?',
  'What events are happening this week?',
];

export function searchAnnouncements(query: string, announcements: Announcement[]): Announcement[] {
  if (!query.trim()) return [];

  const scored = announcements
    .map((a) => ({ announcement: a, score: scoreAnnouncement(a, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.announcement);

  return scored;
}

export function generateResponse(query: string, results: Announcement[]): string {
  if (results.length === 0) {
    const tokens = tokenize(query);
    if (tokens.some((t) => ['deadline', 'due', 'when'].includes(t))) {
      return "I couldn't find any announcements matching your question about deadlines. Try browsing the Academic or Events categories, or check back later as new announcements are posted regularly.";
    }
    if (tokens.some((t) => ['where', 'location', 'room', 'building'].includes(t))) {
      return "I couldn't find a specific announcement about that location. Try searching for the event or topic name, or check the Academic or Events categories for location details.";
    }
    return "I couldn't find any announcements matching your question. Try rephrasing or using different keywords. You can also browse by category or society using the filters above.";
  }

  if (results.length === 1) {
    const r = results[0];
    const officialTag = r.is_official ? ' (Official)' : ' (Student-posted)';
    return `Here's what I found:\n\n"${r.title}"${officialTag}\n${r.body.slice(0, 200)}${r.body.length > 200 ? '...' : ''}\n\nPosted by ${r.author_name} (${r.author_role})${r.society ? ` from ${r.society}` : ''}.`;
  }

  const summary = results
    .map((r, i) => `${i + 1}. ${r.title}${r.is_official ? ' [Official]' : ' [Student]'}`)
    .join('\n');

  const officialCount = results.filter((r) => r.is_official).length;
  const trustNote = officialCount > 0
    ? `\n\n${officialCount} of these are official announcements from campus staff.`
    : '';

  return `I found ${results.length} relevant announcements:\n\n${summary}${trustNote}\n\nTap any result below to view full details.`;
}

export { SUGGESTED_QUESTIONS };
