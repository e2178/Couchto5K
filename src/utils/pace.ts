export const computePace = (durationSeconds: number, distanceKm: number): number => {
  if (!distanceKm || distanceKm <= 0) return 0;
  return Math.round(durationSeconds / distanceKm);
};

export const formatPace = (secondsPerKm: number, units: 'km' | 'mi'): string => {
  if (!secondsPerKm) return '—';
  const perUnit = units === 'mi' ? secondsPerKm * 1.60934 : secondsPerKm;
  const m = Math.floor(perUnit / 60);
  const s = Math.round(perUnit % 60);
  const label = units === 'mi' ? '/mi' : '/km';
  return `${m}:${String(s).padStart(2, '0')} ${label}`;
};

export const formatPaceShort = (secondsPerKm: number, units: 'km' | 'mi'): string => {
  if (!secondsPerKm) return '—';
  return formatPace(secondsPerKm, units).split(' ')[0];
};

export const formatDistance = (km: number, units: 'km' | 'mi'): string => {
  if (units === 'mi') return `${(km / 1.60934).toFixed(2)} mi`;
  return `${km.toFixed(2)} km`;
};

export const formatDistanceShort = (km: number, units: 'km' | 'mi'): string => {
  if (units === 'mi') return `${(km / 1.60934).toFixed(1)} mi`;
  return `${km.toFixed(1)} km`;
};

export const totalDistance = (km: number, units: 'km' | 'mi'): string => {
  return units === 'mi' ? (km / 1.60934).toFixed(1) : km.toFixed(1);
};
