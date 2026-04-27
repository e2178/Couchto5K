export const formatTime = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export const formatTimeLoose = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

export const relativeDate = (iso: string): string => {
  const then = new Date(iso);
  const now = new Date();
  if (then.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (then.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const diffDays = Math.round((now.getTime() - then.getTime()) / 86400000);
  if (diffDays > 0 && diffDays < 7) return `${diffDays}d ago`;
  if (diffDays >= 7 && diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
