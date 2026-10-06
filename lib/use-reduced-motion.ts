'use client';

import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

// Keep the server and first client render identical when this preference changes markup.
export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
