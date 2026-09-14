import type { Announcement } from '@/lib/supabase';

function getEventDate(announcement: Announcement): { start: Date; end: Date } | null {
  if (announcement.expires_at) {
    const start = new Date(announcement.expires_at);
    if (!isNaN(start.getTime())) {
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      return { start, end };
    }
  }
  const start = new Date(announcement.created_at);
  if (!isNaN(start.getTime())) {
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }
  return null;
}

function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function getGoogleCalendarUrl(announcement: Announcement): string | null {
  const dates = getEventDate(announcement);
  if (!dates) return null;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: announcement.title,
    dates: `${formatGoogleDate(dates.start)}/${formatGoogleDate(dates.end)}`,
    details: `${announcement.body}\n\nPosted by: ${announcement.author_name} (${announcement.author_role})`,
  });

  if (announcement.society) {
    params.set('location', announcement.society);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadICSFile(announcement: Announcement): boolean {
  const dates = getEventDate(announcement);
  if (!dates) return false;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Connect//Announcement//EN',
    'BEGIN:VEVENT',
    `UID:${announcement.id}@campusboard`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(dates.start)}`,
    `DTEND:${formatICSDate(dates.end)}`,
    `SUMMARY:${escapeICS(announcement.title)}`,
    `DESCRIPTION:${escapeICS(announcement.body)}\\n\\nPosted by: ${escapeICS(announcement.author_name)} (${escapeICS(announcement.author_role)})`,
    announcement.society ? `LOCATION:${escapeICS(announcement.society)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${announcement.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
