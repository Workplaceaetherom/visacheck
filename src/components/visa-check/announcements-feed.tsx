'use client';

import { useEffect, useState, useCallback } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Megaphone,
  ExternalLink,
  RefreshCw,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  Clock,
  Hourglass,
} from 'lucide-react';
import type { Announcement } from '@/lib/announcements';

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes — auto-refresh

interface ApiResponse {
  announcements?: Announcement[];
  countryName?: string;
  authority?: { shortName: string; officialName: string; url: string };
}

function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function formatRelativeDays(iso: string, lang: 'en' | 'ur' | 'bn'): string {
  const days = daysUntil(iso);
  if (days > 1) return t(lang, 'days_until', { n: days });
  if (days === 1) return t(lang, 'days_until_one');
  if (days === 0) return t(lang, 'days_until_zero');
  return t(lang, 'days_until_past', { n: Math.abs(days) });
}

function StatusIcon({ status }: { status: Announcement['status'] }) {
  switch (status) {
    case 'consultation': return <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />;
    case 'proposed': return <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />;
    case 'announced': return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />;
    case 'effective_soon': return <Clock className="h-3.5 w-3.5" aria-hidden="true" />;
    case 'deferred': return <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />;
    default: return <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />;
  }
}

const STATUS_COLOR: Record<Announcement['status'], string> = {
  consultation: 'border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
  proposed: 'border-orange-500/40 bg-orange-50 text-orange-900 dark:bg-orange-950/30 dark:text-orange-200',
  announced: 'border-teal-500/40 bg-teal-50 text-teal-900 dark:bg-teal-950/30 dark:text-teal-200',
  effective_soon: 'border-rose-500/40 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200',
  deferred: 'border-slate-400/40 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
};

const IMPACT_COLOR: Record<Announcement['impactLevel'], string> = {
  low: 'text-muted-foreground',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-rose-600 dark:text-rose-400',
};

function statusLabelKey(status: Announcement['status']): string {
  return `announcement_${status}`;
}

export function AnnouncementsFeed({ limit }: { limit?: number }) {
  const { lang, countryIso, categoryId, markAnnouncementFetch, lastAnnouncementFetch } = useVisaStore();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!countryIso) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ country: countryIso });
      if (categoryId) params.set('category', categoryId);
      const res = await fetch(`/api/announcements?${params.toString()}`);
      if (!res.ok) throw new Error('http_' + res.status);
      const json: ApiResponse = await res.json();
      setData(json);
      markAnnouncementFetch();
    } catch (e) {
      // Soft-fail — keep showing whatever we had; offline mode shouldn't kill the UI.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setError('offline');
      } else {
        setError('error');
      }
    } finally {
      setLoading(false);
    }
  }, [countryIso, categoryId, markAnnouncementFetch]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes (the spec: "auto-update when new rule comes").
    const id = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  // Also refetch when the tab regains focus (so users returning see fresh data).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const stale = Date.now() - lastAnnouncementFetch > REFRESH_MS;
        if (stale) fetchData();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [lastAnnouncementFetch, fetchData]);

  if (!countryIso) {
    return (
      <Card className="vc-card border-dashed">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <Megaphone className="h-5 w-5 shrink-0 text-primary/60" aria-hidden="true" />
          <span>{t(lang, 'announcements_no_country')}</span>
        </CardContent>
      </Card>
    );
  }

  const announcements = data?.announcements ?? [];
  const display = limit ? announcements.slice(0, limit) : announcements;
  const countryName = data?.countryName ?? countryIso;
  const authority = data?.authority;

  return (
    <section aria-live="polite" aria-label={t(lang, 'announcements_title')} className="space-y-3">
      <Card className="vc-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 vc-display">
                <Megaphone className="h-5 w-5 text-primary" aria-hidden="true" />
                {t(lang, 'announcements_title')}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(lang, 'announcements_subtitle', { country: countryName })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => fetchData()}
              aria-label={t(lang, 'auto_refresh')}
              disabled={loading}
            >
              <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} aria-hidden="true" />
            </Button>
          </div>
          {authority && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge variant="outline" className="font-medium">
                {authority.shortName}
              </Badge>
              <span className="text-muted-foreground">{t(lang, 'auto_refresh')}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {loading && announcements.length === 0 ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="mt-1.5 space-y-1">
                    <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-muted/70" />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted/50" />
                    <div className="h-3 w-16 animate-pulse rounded bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No pending rule changes right now.
            </div>
          ) : (
            <ul className="space-y-3">
              {display.map((a) => {
                const rel = formatRelativeDays(a.expectedEffectiveAt, lang);
                return (
                  <li
                    key={a.id}
                    className={
                      'rounded-xl border p-3 ' + STATUS_COLOR[a.status]
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold">
                            <StatusIcon status={a.status} />
                            {t(lang, statusLabelKey(a.status))}
                          </span>
                          <span className={'text-[11px] font-semibold ' + IMPACT_COLOR[a.impactLevel]}>
                            {t(lang, 'impact_' + a.impactLevel)}
                          </span>
                        </div>
                        <h4 className="mt-1 text-sm font-bold leading-snug">{a.title[lang]}</h4>
                        <p className="mt-1 text-xs leading-relaxed opacity-90">{a.summary[lang]}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <CalendarClock className="h-3 w-3" aria-hidden="true" />
                            {t(lang, 'expected_effective')}: {rel}
                          </span>
                          <span className="opacity-70">·</span>
                          <span className="inline-flex items-center gap-1 font-medium">
                            {t(lang, 'published_at')}: {new Date(a.publishedAt).toISOString().slice(0, 10)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-end">
                      <a
                        href={a.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline"
                      >
                        {t(lang, 'authority_official')}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {error && (
            <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              Showing cached data — couldn’t reach the announcements endpoint.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
