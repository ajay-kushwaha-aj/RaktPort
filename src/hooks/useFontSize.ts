// src/hooks/useFontSize.ts
// Global font-size controller — 5 stages, persisted in localStorage,
// applied to document.documentElement so every element on the page scales.

import { useState, useEffect, useCallback } from 'react';

export const FONT_SIZES = [0.85, 0.92, 1, 1.1, 1.2] as const; // em values relative to 16px
export const DEFAULT_INDEX = 2; // index 2 = 1.0 (100%)
const LS_KEY = 'rp-font-size-idx';

function applySize(idx: number) {
  const em = FONT_SIZES[idx];
  document.documentElement.style.setProperty('--rp-fs', String(em));
  document.documentElement.style.fontSize = `${em * 16}px`;
}

export function useFontSize() {
  const [idx, setIdx] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      const n = stored !== null ? parseInt(stored, 10) : DEFAULT_INDEX;
      return Number.isFinite(n) && n >= 0 && n < FONT_SIZES.length ? n : DEFAULT_INDEX;
    } catch {
      return DEFAULT_INDEX;
    }
  });

  // Apply on mount + whenever idx changes
  useEffect(() => {
    applySize(idx);
    try { localStorage.setItem(LS_KEY, String(idx)); } catch { /* ignore */ }
  }, [idx]);

  const decrease = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const increase = useCallback(() => setIdx(i => Math.min(FONT_SIZES.length - 1, i + 1)), []);
  const reset    = useCallback(() => setIdx(DEFAULT_INDEX), []);

  return { idx, decrease, increase, reset, min: 0, max: FONT_SIZES.length - 1 };
}
