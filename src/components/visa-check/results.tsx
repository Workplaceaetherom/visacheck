'use client';

import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RotateCcw,
  Printer,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  CircleSlash,
  Hourglass,
  Info,
  CalendarClock,
  Landmark,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RuleVerdict } from '@/lib/rules-engine';
import { COUNTRIES } from '@/lib/countries';
import { authorityDomain } from '@/lib/format';
import { AnnouncementsFeed } from './announcements-feed';
import { SocialShareDialog } from './social-share';
import { FeedbackWidget } from './feedback-widget';
import { PathwaySuggestions } from './pathway-suggestions';
import { toast } from 'sonner';

type Filter = 'all' | 'pending' | 'passed' | 'failed' | 'na';

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'all', labelKey: 'results_filter_all' },
  { key: 'pending', labelKey: 'results_filter_pending' },
  { key: 'passed', labelKey: 'results_filter_passed' },
  { key: 'failed', labelKey: 'results_filter_failed' },
  { key: 'na', labelKey: 'results_filter_na' },
];

const CATEGORY_LABELS: Record<string, string> = {
  core: 'category_core',
  job: 'category_job',
  funds: 'category_funds',
  language: 'category_language',
  character: 'category_character',
  skilled_worker: 'category_job',
  student: 'category_language',
  visitor: 'category_core',
  family: 'category_character',
  business: 'category_job',
  investor: 'category_funds',
};

function StatusPill({ verdict, lang }: { verdict: RuleVerdict; lang: 'en' | 'ur' | 'bn' }) {
  const map: Record<RuleVerdict, { label: string; icon: typeof Hourglass }> = {
    pending: { label: 'rule_status_pending', icon: Hourglass },
    pass: { label: 'rule_status_pass', icon: CheckCircle2 },
    fail: { label: 'rule_status_fail', icon: XCircle },
    na: { label: 'rule_status_na', icon: CircleSlash },
  };
  const { label, icon: Icon } = map[verdict];
  const status = verdict === 'pass' ? 'pass' : verdict === 'fail' ? 'fail' : verdict === 'na' ? 'na' : 'pending';
  return (
    <span className="vc-status-pill" data-status={status}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(lang, label)}
    </span>
  );
}

function formatDate(iso: string, lang: 'en' | 'ur' | 'bn'): string {
  try {
    const locale = lang === 'ur' ? 'ur-PK' : lang === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function Results() {
  const { lang, result, setStage, resetAnswers, countryIso, categoryId } = useVisaStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [showShare, setShowShare] = useState(false);

  const counts = result?.counts ?? { total: 0, pending: 0, pass: 0, fail: 0, na: 0 };
  const country = countryIso ? COUNTRIES.find((c) => c.iso === countryIso) : null;

  const filtered = useMemo(() => {
    if (!result) return [];
    if (filter === 'all') return result.rules;
    const map: Record<Filter, RuleVerdict | null> = {
      all: null, pending: 'pending', passed: 'pass', failed: 'fail', na: 'na',
    };
    const want = map[filter];
    if (!want) return result.rules;
    return result.rules.filter((r) => r.displayedVerdict === want);
  }, [filter, result]);

  if (!result) {
    return (
      <main id="main" className="vc-container flex-1 py-12">
        <Button variant="ghost" onClick={() => setStage('home')}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {t(lang, 'back')}
        </Button>
      </main>
    );
  }

  return (
    <main id="main" className="vc-container flex-1 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {/* Back / actions */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => { resetAnswers(); setStage('home'); }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t(lang, 'results_restart')}
          </button>
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t(lang, 'results_print')}
          </Button>
          {countryIso && categoryId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShare(true)}
              className="gap-1.5"
              aria-label={t(lang, 'results_share')}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {t(lang, 'results_share')}
            </Button>
          )}
        </div>

        {/* Heading */}
        <section className="vc-fade">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="vc-eyebrow">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              {t(lang, 'published')}
            </span>
            {country && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="text-base" aria-hidden="true">{country.flag}</span>
                <span className="font-semibold text-foreground">{country.name[lang]}</span>
                <span>·</span>
                <span>{country.authority.shortName}</span>
              </span>
            )}
          </div>
          <h1 className="vc-display text-3xl font-extrabold sm:text-4xl">
            {t(lang, 'results_heading')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {t(lang, 'results_summary_intro')}
          </p>

          {/* Authority card */}
          {country && (
            <Card className="vc-card mt-4 border-primary/20 bg-primary/[0.03]">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Landmark className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(lang, 'authority_label')}
                    </div>
                    <div className="vc-display font-bold leading-tight">
                      {country.authority.name[lang]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {country.authority.shortName} · {country.officialLanguage}
                    </div>
                  </div>
                </div>
                <a
                  href={country.authority.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {t(lang, 'authority_official')}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </CardContent>
            </Card>
          )}

          {/* Summary card — safe "being verified" framing */}
          <Card className="vc-card mt-5 border-primary/20 bg-primary/[0.03]">
            <CardContent className="flex items-start gap-3 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{t(lang, 'results_summary_pending', { authority: authorityDomain(countryIso ?? 'GB') })}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(lang, 'results_disclaimer', { authority: authorityDomain(countryIso ?? 'GB') })}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium">{t(lang, 'as_of')}:</span>{' '}
                  {formatDate(result.evaluatedAt, lang)} ·{' '}
                  <span className="font-medium">{t(lang, 'country_count', { n: 1 })}:</span>{' '}
                  {country?.name[lang] ?? countryIso}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Counts row */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {FILTERS.map((f) => {
              const count =
                f.key === 'all' ? counts.total :
                f.key === 'pending' ? counts.pending :
                f.key === 'passed' ? counts.pass :
                f.key === 'failed' ? counts.fail :
                counts.na;
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={
                    'rounded-xl border p-3 text-left transition-colors ' +
                    (active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-accent/40')
                  }
                  aria-pressed={active}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(lang, f.labelKey)}
                  </div>
                  <div className="vc-display mt-0.5 text-xl font-extrabold tabular-nums">{count}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Rule list */}
        <section aria-label={t(lang, 'results_heading')} className="mt-8 space-y-3">
          {filtered.length === 0 && (
            <Card className="vc-card">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                {t(lang, 'results_filter_na')}
              </CardContent>
            </Card>
          )}
          {filtered.map((r, i) => (
            <Card key={r.id} className="vc-card vc-fade vc-rule-card vc-hover-lift" data-authority={r.authority.shortName} style={{ animationDelay: `${i * 40}ms` }}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      {t(lang, CATEGORY_LABELS[r.category] ?? r.category)}
                    </Badge>
                    <StatusPill verdict={r.displayedVerdict} lang={lang} />
                    {!r.active && (
                      <Badge variant="outline" className="font-normal text-amber-700 dark:text-amber-300">
                        {t(lang, 'effective_from')}: {formatDate(r.effectiveFrom, lang)}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold leading-snug">
                    {r.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground">{r.summary}</p>

                {/* Authority + dates row */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Landmark className="h-3 w-3" aria-hidden="true" />
                    <span className="font-medium">{r.authority.shortName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" aria-hidden="true" />
                    <span>{t(lang, 'last_updated')}: {formatDate(r.lastUpdated, lang)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span>{t(lang, 'effective_from')}: {formatDate(r.effectiveFrom, lang)}</span>
                  </span>
                </div>

                {/* Source link */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t(lang, 'published')}</span>
                  <a
                    href={r.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {t(lang, 'source_label')}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>

                {/* Proposed change banner — if this rule has a pending change */}
                {r.proposedChange && (
                  <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-50 p-3 dark:bg-amber-950/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          {t(lang, 'results_proposed_change')} · {t(lang, 'announcement_' + r.proposedChange.status)}
                        </div>
                        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
                          {r.proposedChange.summary}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-amber-900/70 dark:text-amber-100/70">
                            {t(lang, 'expected_effective')}: {formatDate(r.proposedChange.expectedEffectiveAt, lang)}
                          </span>
                          <a
                            href={r.proposedChange.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-100"
                          >
                            {t(lang, 'authority_official')}
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Logical verdict disclosure — transparency, but gate's pending verdict wins.
                    logicalVerdict is typed as Exclude<RuleVerdict,'pending'> so the second
                    comparison would be a no-op; the displayedVerdict check alone is enough. */}
                {r.displayedVerdict === 'pending' && (
                  <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                    <span className="font-medium">
                      {t(lang, 'rule_status_' + (r.logicalVerdict === 'na' ? 'na' : r.logicalVerdict === 'pass' ? 'pass' : 'fail'))}
                    </span>
                    {' — '}
                    <span>{t(lang, 'results_disclaimer', { authority: authorityDomain(countryIso ?? 'GB') })}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Alternative pathway suggestions — the "beast" feature */}
        <PathwaySuggestions />

        {/* Announcements feed — show pending changes for the same country */}
        <section className="mt-8">
          <AnnouncementsFeed />
        </section>

        {/* Feedback widget — in-memory only, nothing stored */}
        <section className="mt-6">
          <FeedbackWidget />
        </section>

        {/* Footer disclaimer */}
        <section className="mt-8 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2.5">
            <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
            <p className="leading-relaxed">{t(lang, 'results_disclaimer', { authority: authorityDomain(countryIso ?? 'GB') })}</p>
          </div>
        </section>

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => { resetAnswers(); setStage('home'); }}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t(lang, 'results_restart')}
          </Button>
        </div>
      </div>

      {/* Social share dialog */}
      {countryIso && categoryId && (
        <SocialShareDialog
          open={showShare}
          onOpenChange={setShowShare}
          countryIso={countryIso}
          categoryId={categoryId}
        />
      )}
    </main>
  );
}
