const STORAGE_KEY = 'dismissed_announcements';

export function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function dismissAnnouncement(id: string): void {
  const ids = getDismissedIds();
  ids.add(id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // storage may be full or unavailable
  }
}

export function undismissAnnouncement(id: string): void {
  const ids = getDismissedIds();
  ids.delete(id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // storage may be full or unavailable
  }
}

export function isDismissed(id: string): boolean {
  return getDismissedIds().has(id);
}
