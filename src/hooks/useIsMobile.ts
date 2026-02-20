import { useEffect, useState } from 'react';

const MOBILE_WIDTH = 768;
let cachedIsMobile =
  typeof window !== 'undefined' ? window.innerWidth <= MOBILE_WIDTH || 'ontouchstart' in window : false;

const listeners = new Set<(value: boolean) => void>();
let isListening = false;

const computeIsMobile = () =>
  typeof window !== 'undefined' ? window.innerWidth <= MOBILE_WIDTH || 'ontouchstart' in window : false;

const notifyListeners = () => {
  const next = computeIsMobile();
  if (next === cachedIsMobile) {
    return;
  }
  cachedIsMobile = next;
  listeners.forEach((listener) => listener(next));
};

const startListening = () => {
  if (isListening || typeof window === 'undefined') {
    return;
  }
  isListening = true;
  window.addEventListener('resize', notifyListeners);
  window.addEventListener('orientationchange', notifyListeners);
};

const stopListening = () => {
  if (!isListening || typeof window === 'undefined') {
    return;
  }
  isListening = false;
  window.removeEventListener('resize', notifyListeners);
  window.removeEventListener('orientationchange', notifyListeners);
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(cachedIsMobile);

  useEffect(() => {
    listeners.add(setIsMobile);
    startListening();
    notifyListeners();
    return () => {
      listeners.delete(setIsMobile);
      if (listeners.size === 0) {
        stopListening();
      }
    };
  }, []);

  return isMobile;
};
