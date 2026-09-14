const STORAGE_KEY = 'liked_announcements';

export function getLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function isLiked(id: string): boolean {
  return getLikedIds().has(id);
}

export function toggleLike(id: string): boolean {
  const ids = getLikedIds();
  let liked: boolean;
  if (ids.has(id)) {
    ids.delete(id);
    liked = false;
  } else {
    ids.add(id);
    liked = true;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // storage may be full or unavailable
  }
  return liked;
}
