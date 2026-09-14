import type { Announcement } from '@/lib/supabase';

export type UncertaintyResult = {
  isUncertain: boolean;
  reasons: string[];
};

const DATE_PATTERNS = [
  /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/,
  /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b/i,
  /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i,
  /\b\d{1,2}:\d{2}\s*(am|pm)\b/i,
  /\btoday\b/i,
  /\btomorrow\b/i,
  /\btonight\b/i,
  /\bnext\s+(week|month|mon|tue|wed|thu|fri|sat|sun)\b/i,
];

const LINK_PATTERNS = [
  /https?:\/\/\S+/i,
  /\bwww\.\S+/i,
  /bit\.ly\/\S+/i,
  /forms\.gle\/\S+/i,
  /docs\.google\.com\/forms/i,
  /\blink\b[:\s]/i,
  /\bregister\s+(at|here|on)\b/i,
];

const DEADLINE_KEYWORDS = [
  /\bdeadline\b/i,
  /\bdue\b/i,
  /\bsubmit\s+by\b/i,
  /\bby\s+\d/i,
  /\bcloses?\s+(on|at)\b/i,
  /\blast\s+day\b/i,
  /\bends?\s+(on|at)\b/i,
];

const REGISTER_KEYWORDS = [
  /\bregister\b/i,
  /\brsvp\b/i,
  /\bsign\s*up\b/i,
  /\benroll\b/i,
  /\bjoin\b/i,
  /\bsign\s*in\b/i,
];

const VENUE_KEYWORDS = [
  /\bvenue\b/i,
  /\blocation\b/i,
  /\bwhere\b/i,
  /\bhall\b/i,
  /\broom\b/i,
  /\bauditorium\b/i,
  /\bground\b/i,
  /\bblock\b/i,
  /\bbuilding\b/i,
];

export function checkUncertainty(a: Announcement): UncertaintyResult {
  const reasons: string[] = [];
  const body = a.body || '';
  const lowerBody = body.toLowerCase();

  const hasDate = DATE_PATTERNS.some((p) => p.test(body));
  const hasLink = LINK_PATTERNS.some((p) => p.test(body));
  const mentionsDeadline = DEADLINE_KEYWORDS.some((p) => p.test(body));
  const mentionsRegister = REGISTER_KEYWORDS.some((p) => p.test(body));
  const mentionsVenue = VENUE_KEYWORDS.some((p) => p.test(body));

  // Events and academic: should have dates
  if (a.category === 'events' || a.category === 'academic') {
    if (!hasDate && !a.expires_at) {
      reasons.push('No date or time mentioned');
    }
  }

  // If the body mentions a deadline but no date is given
  if (mentionsDeadline && !hasDate && !a.expires_at) {
    reasons.push('Mentions a deadline but no specific date');
  }

  // If the body mentions registration/RSVP but no link
  if (mentionsRegister && !hasLink) {
    reasons.push('Mentions registration but no link provided');
  }

  // Events should have a venue
  if (a.category === 'events' && !mentionsVenue) {
    reasons.push('No venue or location specified');
  }

  // Housing and lost-found should have contact email
  if ((a.category === 'housing' || a.category === 'lost-found') && !a.contact_email) {
    reasons.push('No contact information provided');
  }

  // Very short body might be incomplete
  if (body.trim().length < 20) {
    reasons.push('Very brief description');
  }

  // Clubs/sports events without dates
  if ((a.category === 'clubs' || a.category === 'sports') && mentionsRegister && !hasDate && !a.expires_at) {
    reasons.push('No date or time for the activity');
  }

  return {
    isUncertain: reasons.length > 0,
    reasons,
  };
}
