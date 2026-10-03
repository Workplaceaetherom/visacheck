'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe2, Layers, ScrollText, Megaphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';

interface Stat {
  /** Numeric target the counter animates towards. */
  value: number;
  /** Optional suffix appended after the number (e.g. "+"). */
  suffix?: string;
  /** i18n key for the label rendered below the number. */
  labelKey: 'stat_countries_label' | 'stat_categories_label' | 'stat_rules_label' | 'stat_announcements_label';
  icon: LucideIcon;
}

const STATS: Stat[] = [
  { value: 6, labelKey: 'stat_countries_label', icon: Globe2 },
  { value: 6, labelKey: 'stat_categories_label', icon: Layers },
  { value: 30, suffix: '+', labelKey: 'stat_rules_label', icon: ScrollText },
  { value: 12, labelKey: 'stat_announcements_label', icon: Megaphone },
];

const DURATION_MS = 900;

/** Read prefers-reduced-motion once. SSR-safe (returns false on server). */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Custom hook that counts up from 0 → target on mount using rAF.
 * Respects prefers-reduced-motion (returns target immediately via lazy init,
 * so the effect never needs to call setState synchronously).
 */
function useCountUp(target: number, durationMs: number = DURATION_MS): number {
  // Lazy initialiser so the reduced-motion path never needs an in-effect setState.
  const [value, setValue] = useState(() => {
    if (prefersReducedMotion() || target <= 0) return target;
    return 0;
  });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip animation if user prefers reduced motion (lazy init already set value = target).
    if (prefersReducedMotion() || target <= 0) return;
    if (typeof window === 'undefined') return;

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutCubic — feels smooth without bouncing
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs]);

  return value;
}

function StatCard({ stat, delay }: { stat: Stat; delay: number }) {
  const { lang } = useVisaStore();
  const count = useCountUp(stat.value);
  const Icon = stat.icon;

  return (
    <Card
      className="vc-card vc-fade"
      style={{ animationDelay: `${delay}ms` }}
      role="group"
      aria-label={`${stat.value}${stat.suffix ?? ''} ${t(lang, stat.labelKey)}`}
    >
      <CardContent className="flex flex-col items-center gap-1.5 p-4 text-center sm:p-5">
        <div className="mb-1 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
        <div
          className="vc-display text-2xl font-extrabold tabular-nums text-foreground sm:text-3xl"
          aria-live="polite"
        >
          {count}
          {stat.suffix ?? ''}
        </div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
          {t(lang, stat.labelKey)}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCounter() {
  const { lang } = useVisaStore();
  return (
    <section
      aria-label={t(lang, 'stats_eyebrow')}
      className="mx-auto mt-7 max-w-3xl"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={stat.labelKey} stat={stat} delay={i * 80} />
        ))}
      </div>
    </section>
  );
}
