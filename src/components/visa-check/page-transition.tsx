'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  /** Optional key — forces remount/animation when value changes. */
  pageKey?: string;
}

/**
 * Lightweight page transition wrapper used between Home / Wizard / Results.
 *
 * - Fades in + small downward slide on mount
 * - Fades out + small upward slide on exit
 * - Respects prefers-reduced-motion (instant swap, no animation)
 *
 * The wrapper is intentionally minimal so it never competes with the in-page
 * `.vc-fade` animations on individual cards/sections.
 */
export function PageTransition({ children, pageKey }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div key={pageKey}>{children}</div>;
  }

  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
