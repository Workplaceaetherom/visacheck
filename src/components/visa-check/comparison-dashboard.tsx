'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GitCompare,
  X,
  RefreshCw,
  Check,
  Globe2,
  Landmark,
  CalendarClock,
  ExternalLink,
  AlertTriangle,
  FileText,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';
import { VISA_CATEGORIES } from '@/lib/visa-categories';

interface ComparisonRule {
  id: string;
  title: string;
  summary: string;
  source: string;
  authority: { shortName: string; officialName: string; url: string };
  lastUpdated: string;
  effectiveFrom: string;
  proposedChange?: {
    status: string;
    summary: string;
    expectedEffectiveAt: string;
    sourceUrl: string;
  };
}

interface ComparisonCountry {
  country: {
    iso: string;
    flag: string;
    name: { en: string; ur: string; bn: string };
    authority: { name: { en: string; ur: string; bn: string }; shortName: string; url: string };
    currency: string;
    officialLanguage: string;
    timezone: string;
  };
  ruleCount: number;
  rules: ComparisonRule[];
}

interface ApiResponse {
  comparison?: ComparisonCountry[];
  categoryId?: string;
}

function formatDate(iso: string, lang: 'en' | 'ur' | 'bn'): string {
  try {
    const locale = lang === 'ur' ? 'ur-PK' : lang === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function ComparisonDashboard({ onClose }: { onClose: () => void }) {
  const { lang, countryIso, categoryId, setCountry, setCategory, setStage } = useVisaStore();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(countryIso ? [countryIso] : []);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId ?? 'skilled_worker');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const fetchData = useCallback(async () => {
    if (selectedCountries.length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        countries: selectedCountries.join(','),
        category: selectedCategory,
        lang,
      });
      const res = await fetch(`/api/compare?${params.toString()}`);
      if (!res.ok) throw new Error('http_' + res.status);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      setError('fetch_error');
    } finally {
      setLoading(false);
    }
  }, [selectedCountries, selectedCategory, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCountry = (iso: string) => {
    setSelectedCountries((prev) => {
      if (prev.includes(iso)) {
        return prev.filter((c) => c !== iso);
      }
      if (prev.length >= 4) return prev; // max 4
      return [...prev, iso];
    });
  };

  const comparison = data?.comparison ?? [];

  // Find the max rule count to normalize the display
  const maxRules = useMemo(() => Math.max(...comparison.map((c) => c.ruleCount), 0), [comparison]);

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-background/95 backdrop-blur-sm">
      <div className="vc-container py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GitCompare className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="vc-display text-2xl font-extrabold sm:text-3xl">Compare Destinations</h1>
              <p className="text-xs text-muted-foreground">
                Side-by-side comparison of published visa rules across {selectedCountries.length} {selectedCountries.length === 1 ? 'country' : 'countries'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="h-9 w-9">
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Country + category selectors */}
        <Card className="vc-card mb-6">
          <CardContent className="p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select 2-4 countries to compare
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {COUNTRIES.map((c) => {
                const selected = selectedCountries.includes(c.iso);
                const disabled = !selected && selectedCountries.length >= 4;
                return (
                  <button
                    key={c.iso}
                    onClick={() => toggleCountry(c.iso)}
                    disabled={disabled}
                    className={
                      'flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ' +
                      (selected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : disabled
                        ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                        : 'border-border bg-card hover:border-primary/40 vc-hover-lift')
                    }
                    aria-pressed={selected}
                  >
                    <span className="text-2xl" aria-hidden="true">{c.flag}</span>
                    <span className="text-xs font-semibold">{c.name[lang]}</span>
                    <span className="text-[10px] text-muted-foreground">{c.authority.shortName}</span>
                    {selected && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-2.5 w-2.5" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category selector */}
            <div className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Visa category
            </div>
            <div className="flex flex-wrap gap-2">
              {VISA_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ' +
                    (selectedCategory === cat.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:bg-accent/40')
                  }
                  aria-pressed={selectedCategory === cat.id}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.name[lang]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison table */}
        {selectedCountries.length < 2 ? (
          <Card className="vc-card">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <Globe2 className="h-12 w-12 text-primary/40" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Select at least 2 countries above to see a side-by-side comparison of their visa rules.
              </p>
            </CardContent>
          </Card>
        ) : loading ? (
          <Card className="vc-card">
            <CardContent className="flex items-center justify-center gap-3 p-12">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">Loading comparison…</span>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="vc-card border-amber-500/40">
            <CardContent className="p-6 text-center text-sm text-amber-700 dark:text-amber-300">
              Couldn't load comparison data. Please try again.
            </CardContent>
          </Card>
        ) : comparison.length === 0 ? (
          <Card className="vc-card">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No rules found for the selected category in these countries.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* View toggle + Stats row */}
            <div className="flex items-center justify-between gap-3">
              <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${comparison.length}, minmax(0, 1fr))` }}>
                {comparison.map((item) => (
                  <div key={item.country.iso} className="rounded-xl border border-border bg-card p-3 text-center">
                    <div className="text-2xl" aria-hidden="true">{item.country.flag}</div>
                    <div className="vc-display text-sm font-bold leading-tight">{item.country.name[lang]}</div>
                    <div className="text-[10px] text-muted-foreground">{item.country.authority.shortName}</div>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      {item.ruleCount} rules
                    </div>
                  </div>
                ))}
              </div>
              {/* View toggle */}
              <div className="flex shrink-0 rounded-lg border border-border bg-card p-0.5">
                <button
                  onClick={() => setViewMode('cards')}
                  className={
                    'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ' +
                    (viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')
                  }
                  aria-label="Card view"
                  aria-pressed={viewMode === 'cards'}
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={
                    'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ' +
                    (viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')
                  }
                  aria-label="Table view"
                  aria-pressed={viewMode === 'table'}
                >
                  <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Rule comparison cards (card view) */}
            {viewMode === 'cards' && (
            <div className="space-y-3">
              {comparison.map((item) => (
                <Card key={item.country.iso} className="vc-card vc-fade">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 vc-display">
                      <span className="text-lg" aria-hidden="true">{item.country.flag}</span>
                      {item.country.name[lang]}
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {item.country.authority.shortName}
                      </Badge>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Landmark className="h-3 w-3" aria-hidden="true" />
                        {item.country.authority.name[lang]}
                      </span>
                      <span>·</span>
                      <span>{item.country.currency} · {item.country.officialLanguage}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {item.rules.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No rules loaded for this category.</p>
                    ) : (
                      <ul className="space-y-2">
                        {item.rules.map((rule) => (
                          <li key={rule.id} className="rounded-lg border border-border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold leading-snug">{rule.title}</h4>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rule.summary}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" aria-hidden="true" />
                                {formatDate(rule.effectiveFrom, lang)}
                              </span>
                              <span>·</span>
                              <span>{rule.authority.shortName}</span>
                            </div>
                            {rule.proposedChange && (
                              <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-50 p-2 text-[11px] dark:bg-amber-950/20">
                                <div className="flex items-center gap-1 font-semibold text-amber-900 dark:text-amber-200">
                                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                  {t(lang, 'announcement_' + rule.proposedChange.status)}
                                </div>
                                <p className="mt-0.5 text-amber-900/80 dark:text-amber-100/80">
                                  {rule.proposedChange.summary}
                                </p>
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-end">
                              <a
                                href={rule.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
                              >
                                {t(lang, 'source_label')}
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            )}

            {/* Table view — rows=rules, columns=countries */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto scroll-soft rounded-xl border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="sticky left-0 z-10 min-w-[180px] border-r border-border bg-muted/30 p-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Rule
                      </th>
                      {comparison.map((item) => (
                        <th key={item.country.iso} className="min-w-[200px] p-3 text-left">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base" aria-hidden="true">{item.country.flag}</span>
                              <span className="vc-display text-sm font-bold">{item.country.name[lang]}</span>
                            </div>
                            <span className="text-[10px] font-normal text-muted-foreground">
                              {item.country.authority.shortName} · {item.country.currency}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Collect all unique rule titles across countries
                      const allTitles: { title: string; id: string }[] = [];
                      const seen = new Set<string>();
                      for (const item of comparison) {
                        for (const rule of item.rules) {
                          if (!seen.has(rule.title)) {
                            seen.add(rule.title);
                            allTitles.push({ title: rule.title, id: rule.id });
                          }
                        }
                      }
                      if (allTitles.length === 0) {
                        return (
                          <tr>
                            <td colSpan={comparison.length + 1} className="p-6 text-center text-sm text-muted-foreground">
                              No rules found.
                            </td>
                          </tr>
                        );
                      }
                      return allTitles.map(({ title, id }) => (
                        <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="sticky left-0 z-10 border-r border-border bg-card p-3 align-top">
                            <span className="text-xs font-bold leading-snug">{title}</span>
                          </td>
                          {comparison.map((item) => {
                            const rule = item.rules.find((r) => r.title === title);
                            if (!rule) {
                              return (
                                <td key={item.country.iso + id} className="p-3 align-top">
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50">
                                    <span className="vc-status-dot" data-status="na" />
                                    N/A
                                  </span>
                                </td>
                              );
                            }
                            return (
                              <td key={item.country.iso + id} className="p-3 align-top">
                                <div className="space-y-1.5">
                                  <p className="text-xs leading-relaxed text-muted-foreground">
                                    {rule.summary}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span className="inline-flex items-center gap-0.5">
                                      <CalendarClock className="h-2.5 w-2.5" aria-hidden="true" />
                                      {formatDate(rule.effectiveFrom, lang)}
                                    </span>
                                    {rule.proposedChange && (
                                      <span className="inline-flex items-center gap-0.5 font-medium text-amber-600 dark:text-amber-400">
                                        <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                                        {t(lang, 'announcement_' + rule.proposedChange.status)}
                                      </span>
                                    )}
                                  </div>
                                  <a
                                    href={rule.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary underline-offset-2 hover:underline"
                                  >
                                    {t(lang, 'source_label')}
                                    <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                                  </a>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* "Start a check for this country" CTA per country */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${comparison.length}, minmax(0, 1fr))` }}>
              {comparison.map((item) => (
                <Button
                  key={item.country.iso}
                  variant="outline"
                  onClick={() => {
                    setCountry(item.country.iso);
                    setCategory(selectedCategory);
                    resetAndStart();
                    onClose();
                  }}
                  className="gap-1.5 text-xs"
                >
                  <span aria-hidden="true">{item.country.flag}</span>
                  Check {item.country.name[lang]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function resetAndStart() {
    useVisaStore.getState().resetAnswers();
    localStorage.setItem('vcUsedOnce', '1');
    useVisaStore.getState().setUsedOnce(true);
    useVisaStore.getState().setStage('wizard');
  }
}
