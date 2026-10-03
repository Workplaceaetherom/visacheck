'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Megaphone,
  ExternalLink,
  RefreshCw,
  CalendarClock,
  AlertCircle,
  CheckCircle2,
  Clock,
  Hourglass,
  Globe2,
  Filter,
  X,
} from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';
import { VISA_CATEGORIES } from '@/lib/visa-categories';
import type { Announcement } from '@/lib/announcements';

interface ApiResponse {
  announcements?: Announcement[];
}

const REFRESH_MS = 5 * 60 * 1000;

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

function formatDate(iso: string, lang: 'en' | 'ur' | 'bn'): string {
  try {
    const locale = lang === 'ur' ? 'ur-PK' : lang === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
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

type StatusFilter = 'all' | Announcement['status'];
type ImpactFilter = 'all' | Announcement['impactLevel'];

export function GlobalAnnouncementsDashboard({ onClose }: { onClose: () => void }) {
  const { lang } = useVisaStore();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all');
  const [query, setQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements?upcoming=365');
      if (!res.ok) throw new Error('http_' + res.status);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      // soft-fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const allAnnouncements = data?.announcements ?? [];

  const filtered = useMemo(() => {
    return allAnnouncements.filter((a) => {
      if (countryFilter !== 'all' && a.countryIso !== countryFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (impactFilter !== 'all' && a.impactLevel !== impactFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matches =
          a.title.en.toLowerCase().includes(q) ||
          a.title.ur.includes(query) ||
          a.title.bn.includes(query) ||
          a.summary.en.toLowerCase().includes(q) ||
          a.authorityName.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allAnnouncements, countryFilter, statusFilter, impactFilter, query]);

  // Group by country for display
  const byCountry = useMemo(() => {
    const groups: Record<string, Announcement[]> = {};
    for (const a of filtered) {
      if (!groups[a.countryIso]) groups[a.countryIso] = [];
      groups[a.countryIso].push(a);
    }
    return groups;
  }, [filtered]);

  const statusOptions: { value: StatusFilter; labelKey: string }[] = [
    { value: 'all', labelKey: 'results_filter_all' },
    { value: 'consultation', labelKey: 'announcement_consultation' },
    { value: 'proposed', labelKey: 'announcement_proposed' },
    { value: 'announced', labelKey: 'announcement_announced' },
    { value: 'effective_soon', labelKey: 'announcement_effective_soon' },
  ];

  const impactOptions: { value: ImpactFilter; label: string }[] = [
    { value: 'all', label: 'All impacts' },
    { value: 'high', label: t(lang, 'impact_high') },
    { value: 'medium', label: t(lang, 'impact_medium') },
    { value: 'low', label: t(lang, 'impact_low') },
  ];

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-background/95 backdrop-blur-sm">
      <div className="vc-container py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="vc-display text-2xl font-extrabold sm:text-3xl">
                {t(lang, 'announcements_title')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t(lang, 'auto_refresh')} · {filtered.length} {t(lang, 'announcements_title').toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchData()}
              disabled={loading}
              aria-label="Refresh"
              className="h-9 w-9"
            >
              <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="h-9 w-9">
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="vc-card mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, 'filter_by')}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search announcements…"
                className="text-sm"
              />
              {/* Country filter */}
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="all">All countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c.iso} value={c.iso}>
                    {c.flag} {c.name[lang]}
                  </option>
                ))}
              </select>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.value === 'all' ? 'All statuses' : t(lang, s.labelKey)}
                  </option>
                ))}
              </select>
              {/* Impact filter */}
              <select
                value={impactFilter}
                onChange={(e) => setImpactFilter(e.target.value as ImpactFilter)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                {impactOptions.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</div>
            <div className="vc-display text-2xl font-extrabold tabular-nums">{allAnnouncements.length}</div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-3 dark:bg-amber-950/20">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Consultations</div>
            <div className="vc-display text-2xl font-extrabold tabular-nums text-amber-700 dark:text-amber-300">
              {allAnnouncements.filter((a) => a.status === 'consultation').length}
            </div>
          </div>
          <div className="rounded-xl border border-teal-500/30 bg-teal-50/50 p-3 dark:bg-teal-950/20">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Announced</div>
            <div className="vc-display text-2xl font-extrabold tabular-nums text-teal-700 dark:text-teal-300">
              {allAnnouncements.filter((a) => a.status === 'announced').length}
            </div>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-50/50 p-3 dark:bg-rose-950/20">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Effective soon</div>
            <div className="vc-display text-2xl font-extrabold tabular-nums text-rose-700 dark:text-rose-300">
              {allAnnouncements.filter((a) => a.status === 'effective_soon').length}
            </div>
          </div>
        </div>

        {/* Announcements grouped by country */}
        {filtered.length === 0 ? (
          <Card className="vc-card">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No announcements match your filters.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {COUNTRIES.filter((c) => byCountry[c.iso]?.length > 0).map((country) => (
              <div key={country.iso}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl" aria-hidden="true">{country.flag}</span>
                  <h2 className="vc-display text-lg font-bold">{country.name[lang]}</h2>
                  <Badge variant="outline" className="text-[10px]">{country.authority.shortName}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {byCountry[country.iso].length} pending {byCountry[country.iso].length === 1 ? 'change' : 'changes'}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {byCountry[country.iso].map((a) => {
                    const cat = VISA_CATEGORIES.find((c) => c.id === a.categoryId);
                    return (
                      <div key={a.id} className={'rounded-xl border p-4 ' + STATUS_COLOR[a.status]}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                                <StatusIcon status={a.status} />
                                {t(lang, 'announcement_' + a.status)}
                              </span>
                              {cat && (
                                <Badge variant="outline" className="text-[10px]">
                                  {cat.icon} {cat.name[lang]}
                                </Badge>
                              )}
                              <span className={'text-[11px] font-semibold ' + IMPACT_COLOR[a.impactLevel]}>
                                {t(lang, 'impact_' + a.impactLevel)}
                              </span>
                            </div>
                            <h3 className="mt-1.5 text-sm font-bold leading-snug">{a.title[lang]}</h3>
                            <p className="mt-1 text-xs leading-relaxed opacity-90 line-clamp-3">{a.summary[lang]}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="inline-flex items-center gap-1 font-medium">
                                <CalendarClock className="h-3 w-3" aria-hidden="true" />
                                {formatRelativeDays(a.expectedEffectiveAt, lang)}
                              </span>
                              <span className="opacity-70">·</span>
                              <span>{t(lang, 'published_at')}: {formatDate(a.publishedAt, lang)}</span>
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
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
