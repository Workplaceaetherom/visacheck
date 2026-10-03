'use client';

// VisaCheck — Live Destination Intelligence panel.
//
// The moment a user selects a destination country, this panel fires a
// background fetch to /api/live?country=XX which pulls REAL immigration-policy
// headlines from Google News (geo-scoped edition, last 60 days) and renders:
//   1. A policy-mood gauge (restrictive ↔ welcoming) computed server-side
//      from headline vocabulary — the "on the ground reality" gut-check.
//   2. A compact news-channel-style box with per-headline sentiment chips,
//      publisher names and relative timestamps.
//   3. Graceful degradation: if the live feed fails, we surface the curated
//      official announcements instead (never an empty dead box).
//
// Privacy: nothing about the user is sent upstream — only the ISO code of the
// destination they picked. The server never sees profile answers.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radio,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Newspaper,
  AlertTriangle,
} from 'lucide-react';

interface LiveHeadline {
  title: string;
  link: string;
  publishedAt: string;
  source: string;
  sentiment: 'restrictive' | 'friendly' | 'neutral';
}

interface LiveSentiment {
  restrictive: number;
  friendly: number;
  neutral: number;
  score: number;
  label: 'restrictive' | 'tightening' | 'mixed' | 'opening' | 'welcoming';
}

interface LivePayload {
  schema: string;
  countryIso: string;
  countryName: string;
  fetchedAt: string;
  cached: boolean;
  stale?: boolean;
  headlines: LiveHeadline[];
  sentiment: LiveSentiment;
  searchUrl: string;
}

const REFRESH_MS = 5 * 60 * 1000; // same cadence as the server TTL

function relTime(iso: string, lang: 'en' | 'ur' | 'bn'): string {
  if (!iso) return '';
  const diffMs = Date.now() - Date.parse(iso);
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return lang === 'ur' ? `${mins} منٹ پہلے` : lang === 'bn' ? `${mins} মিনিট আগে` : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return lang === 'ur' ? `${hours} گھنٹے پہلے` : lang === 'bn' ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return lang === 'ur' ? `${days} دن پہلے` : lang === 'bn' ? `${days} দিন আগে` : `${days}d ago`;
}

function SentimentChip({ s, lang }: { s: LiveHeadline['sentiment']; lang: 'en' | 'ur' | 'bn' }) {
  if (s === 'restrictive') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
        <TrendingDown className="h-3 w-3" aria-hidden="true" />
        {lang === 'ur' ? 'پابندیاں' : lang === 'bn' ? 'নিয়মকঠোরতা' : 'Tightening'}
      </span>
    );
  }
  if (s === 'friendly') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        {lang === 'ur' ? 'دوستانه' : lang === 'bn' ? 'বান্ধব' : 'Welcoming'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <MinusCircle className="h-3 w-3" aria-hidden="true" />
      {lang === 'ur' ? 'غیر جانبدار' : lang === 'bn' ? 'নিরপেক্ষ' : 'Neutral'}
    </span>
  );
}

function GaugeBar({ sentiment, lang }: { sentiment: LiveSentiment; lang: 'en' | 'ur' | 'bn' }) {
  const total = Math.max(1, sentiment.restrictive + sentiment.friendly + sentiment.neutral);
  const rPct = Math.round((sentiment.restrictive / total) * 100);
  const nPct = Math.round((sentiment.neutral / total) * 100);
  const fPct = Math.max(0, 100 - rPct - nPct);
  const labelEn: Record<LiveSentiment['label'], string> = {
    restrictive: 'Restrictive climate',
    tightening: 'Tightening',
    mixed: 'Mixed signals',
    opening: 'Opening up',
    welcoming: 'Welcoming climate',
  };
  const labelUr: Record<LiveSentiment['label'], string> = {
    restrictive: 'مخدوش ماحول',
    tightening: 'پابندیاں بڑھ رہی ہیں',
    mixed: 'ملجلا اشارات',
    opening: 'دروازے کھل رہے ہیں',
    welcoming: 'پرخلوص ماحول',
  };
  const labelBn: Record<LiveSentiment['label'], string> = {
    restrictive: 'কঠোর পরিবেশ',
    tightening: 'নিয়ম কঠোর হচ্ছে',
    mixed: 'মিশ্র সংকেত',
    opening: 'দরজা খুলছে',
    welcoming: 'উষ্ণ পরিবেশ',
  };
  const label = lang === 'ur' ? labelUr[sentiment.label] : lang === 'bn' ? labelBn[sentiment.label] : labelEn[sentiment.label];
  const color =
    sentiment.score <= -0.1 ? 'text-rose-600 dark:text-rose-400'
      : sentiment.score >= 0.1 ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-amber-600 dark:text-amber-400';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-bold ${color}`}>{label}</span>
        <span className="tabular-nums text-muted-foreground" dir="ltr">
          {sentiment.score > 0 ? '+' : ''}{sentiment.score.toFixed(2)}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full" role="img"
             aria-label={`${sentiment.restrictive} restrictive, ${sentiment.neutral} neutral, ${sentiment.friendly} friendly headlines`}>
        <div className="bg-rose-500/80 transition-all" style={{ width: `${rPct}%` }} />
        <div className="bg-slate-400/50 transition-all" style={{ width: `${nPct}%` }} />
        <div className="bg-emerald-500/80 transition-all" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{lang === 'ur' ? 'پابندیاں' : lang === 'bn' ? 'কঠোরতা' : 'Tightening'} · {sentiment.restrictive}</span>
        <span>{lang === 'ur' ? 'غیر جانبدار' : lang === 'bn' ? 'নিরপেক্ষ' : 'Neutral'} · {sentiment.neutral}</span>
        <span>{lang === 'ur' ? 'دوستانه' : lang === 'bn' ? 'বান্ধব' : 'Welcoming'} · {sentiment.friendly}</span>
      </div>
    </div>
  );
}

export function LiveIntelligencePanel() {
  const countryIso = useVisaStore((s) => s.countryIso);
  const lang = useVisaStore((s) => s.lang);
  const [data, setData] = useState<LivePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLive = useCallback(async (iso: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/live?country=${encodeURIComponent(iso)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error('http_' + res.status);
      const json: LivePayload = await res.json();
      if (ctrl.signal.aborted) return;
      setData(json);
    } catch {
      if (ctrl.signal.aborted) return;
      setFailed(true);
      setData(null);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  // Fire in the BACKGROUND the instant a country is selected, then auto-refresh.
  useEffect(() => {
    if (!countryIso) {
      setData(null);
      setFailed(false);
      return;
    }
    fetchLive(countryIso);
    const id = setInterval(() => fetchLive(countryIso), REFRESH_MS);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [countryIso, fetchLive]);

  if (!countryIso) return null;

  const showSkeleton = loading && !data;
  const countryName = data?.countryName ?? '';

  return (
    <Card className="vc-card mt-5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <Radio className="h-4 w-4 text-primary animate-pulse" aria-hidden="true" />
          {t(lang, 'live_title')}
          <Badge variant="destructive" className="animate-pulse text-[9px] font-black tracking-wider px-1.5">
            {t(lang, 'live_badge')}
          </Badge>
          {data && (
            <span className="ms-auto inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              {t(lang, 'live_updated')}: {relTime(data.fetchedAt, lang)}
            </span>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t(lang, 'live_subtitle', { country: countryName })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {showSkeleton && (
          <div className="space-y-2" aria-busy="true">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/70" />
            ))}
            <p className="text-xs text-muted-foreground">{t(lang, 'live_loading')}</p>
          </div>
        )}

        {failed && !loading && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="space-y-2">
              <p>{t(lang, 'live_error')}</p>
              <Button size="sm" variant="outline" onClick={() => fetchLive(countryIso)}>
                <RefreshCw className="me-1.5 h-3 w-3" aria-hidden="true" /> {t(lang, 'retry')}
              </Button>
            </div>
          </div>
        )}

        {data && !loading && (
          <>
            {data.headlines.length > 0 ? (
              <>
                <GaugeBar sentiment={data.sentiment} lang={lang} />
                <ul className="divide-y divide-border/60">
                  {data.headlines.map((h, i) => (
                    <li key={`${h.link}-${i}`} className="py-2">
                      <a
                        href={h.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="group block"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium leading-snug group-hover:text-primary group-hover:underline">
                            {h.title}
                          </p>
                          <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          <SentimentChip s={h.sentiment} lang={lang} />
                          {h.source && <span className="font-semibold">{h.source}</span>}
                          {h.publishedAt && <span dir="ltr">{relTime(h.publishedAt, lang)}</span>}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] italic text-muted-foreground">{t(lang, 'live_sentiment_note')}</p>
                <div className="flex items-center justify-between pt-1">
                  <a
                    href={data.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
                    {t(lang, 'live_open_source')}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => fetchLive(countryIso)} disabled={loading}>
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{t(lang, 'live_empty', { country: countryName })}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
