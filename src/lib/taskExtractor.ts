import type { Announcement } from '@/lib/supabase';

export type ExtractedTask = {
  title: string;
  announcementId: string;
};

const ACTION_PATTERNS: RegExp[] = [
  /\b(?:register|registration|sign\s?up|enroll|apply|application|submit|submission)\b/i,
  /\b(?:deadline|due|by\s+\w+day|before\s+\w+)/i,
  /\b(?:attend|join|participate|RSVP|rsvp)\b/i,
  /\b(?:pay|fee|payment|deposit|installment)\b/i,
  /\b(?:collect|pick\s?up|get|obtain|collect)\s+(?:your|the|an?)\b/i,
  /\b(?:fill|complete|fill\s?out)\s+(?:the|a|an)?\s*form\b/i,
  /\b(?:vote|election|nominate|nomination)\b/i,
  /\b(?:book|reserve|slot|appointment|book\s?your)\b/i,
  /\b(?:renew|extend|update|verify|confirm)\b/i,
  /\b(?:audition|tryouts?|try\s?out|interview)\b/i,
  /\b(?:RSVP|register\s+now|sign\s+up\s+now|apply\s+now)\b/i,
  /\b(?:id\s*card|identity\s*card|student\s*id|gate\s*pass|library\s*card)\b/i,
];

const NEGATIVE_PATTERNS: RegExp[] = [
  /\b(?:lost|found|missing)\b/i,
  /\b(?:cancelled|canceled|closed)\b/i,
];

function extractTaskTitle(announcement: Announcement): string | null {
  const text = `${announcement.title} ${announcement.body}`;

  const hasAction = ACTION_PATTERNS.some((p) => p.test(text));
  const isNegative = NEGATIVE_PATTERNS.some((p) => p.test(announcement.title));

  if (!hasAction || isNegative) return null;

  const title = announcement.title.trim();

  if (/register|registration|sign\s?up|enroll/i.test(text)) {
    if (announcement.society) {
      return `Register for ${announcement.society} — ${truncate(title)}`;
    }
    return `Register: ${truncate(title)}`;
  }

  if (/apply|application/i.test(text)) {
    return `Apply: ${truncate(title)}`;
  }

  if (/id\s*card|identity\s*card|student\s*id|gate\s*pass|library\s*card/i.test(text)) {
    return `Get your ID card: ${truncate(title)}`;
  }

  if (/pay|fee|payment|deposit|installment/i.test(text)) {
    return `Pay: ${truncate(title)}`;
  }

  if (/submit|submission/i.test(text)) {
    return `Submit: ${truncate(title)}`;
  }

  if (/attend|join|participate|rsvp/i.test(text)) {
    return `Attend: ${truncate(title)}`;
  }

  if (/audition|tryout|try\s?out|interview/i.test(text)) {
    return `Audition/Interview: ${truncate(title)}`;
  }

  if (/book|reserve|slot|appointment/i.test(text)) {
    return `Book: ${truncate(title)}`;
  }

  if (/fill|complete|fill\s?out.*form/i.test(text)) {
    return `Fill form: ${truncate(title)}`;
  }

  if (/vote|election|nominate|nomination/i.test(text)) {
    return `Vote: ${truncate(title)}`;
  }

  if (/renew|extend|update|verify|confirm/i.test(text)) {
    return `${capitalizeFirstMatch(text)}: ${truncate(title)}`;
  }

  return `Follow up: ${truncate(title)}`;
}

function truncate(s: string, max = 80): string {
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

function capitalizeFirstMatch(text: string): string {
  const match = text.match(/\b(renew|extend|update|verify|confirm)\b/i);
  return match ? match[0].charAt(0).toUpperCase() + match[0].slice(1) : 'Follow up';
}

export function extractTasksFromAnnouncements(announcements: Announcement[]): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];

  for (const a of announcements) {
    const title = extractTaskTitle(a);
    if (title) {
      tasks.push({ title, announcementId: a.id });
    }
  }

  return tasks;
}
