'use client';

import { COUNTRIES } from '@/lib/countries';
import { VISA_CATEGORIES } from '@/lib/visa-categories';
import { RULES } from '@/lib/rules-data';
import { t } from '@/lib/i18n';
import { useVisaStore } from './store';
import { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CountryPicker({
  onPicked,
  compact = false,
}: {
  onPicked?: () => void;
  compact?: boolean;
}) {
  const { lang, countryIso, setCountry, categoryId, setCategory } = useVisaStore();
  const [query, setQuery] = useState('');

  const filtered = COUNTRIES.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.en.toLowerCase().includes(q) ||
      c.name.ur.includes(query) ||
      c.name.bn.includes(query) ||
      c.iso.toLowerCase().includes(q) ||
      c.authority.shortName.toLowerCase().includes(q)
    );
  });

  const pick = (iso: string) => {
    setCountry(iso);
    // If the current category isn't available for this country, clear it
    const country = COUNTRIES.find((c) => c.iso === iso);
    if (country && categoryId && !country.categoryIds.includes(categoryId)) {
      setCategory(null);
    }
    onPicked?.();
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {COUNTRIES.map((c) => (
          <button
            key={c.iso}
            onClick={() => pick(c.iso)}
            className={
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ' +
              (countryIso === c.iso
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card hover:bg-accent/40')
            }
            aria-pressed={countryIso === c.iso}
          >
            <span className="text-base" aria-hidden="true">{c.flag}</span>
            <span>{c.name[lang]}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(lang, 'pick_destination')}
          className="pl-9"
          aria-label={t(lang, 'pick_destination')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const selected = countryIso === c.iso;
          return (
            <button
              key={c.iso}
              onClick={() => pick(c.iso)}
              className={
                'group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all vc-hover-lift ' +
                (selected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40')
              }
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">{c.flag}</span>
                  <div>
                    <div className="vc-display font-bold leading-tight">{c.name[lang]}</div>
                    <div className="text-xs text-muted-foreground">{c.authority.shortName}</div>
                  </div>
                </div>
                {selected && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-normal text-[10px]">
                  {c.currency}
                </Badge>
                <Badge variant="outline" className="font-normal text-[10px]">
                  {t(lang, 'category_count', { n: c.categoryIds.length })}
                </Badge>
                {(() => {
                  const ruleCount = RULES.filter((r) => r.countryIso === c.iso).length;
                  return ruleCount > 0 ? (
                    <Badge variant="outline" className="font-normal text-[10px] text-primary border-primary/30">
                      {t(lang, 'rule_count', { n: ruleCount })}
                    </Badge>
                  ) : null;
                })()}
              </div>
              {!compact && c.popularRoutes.length > 0 && (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  <span className="font-medium">{t(lang, 'popular_routes')}:</span>{' '}
                  {c.popularRoutes.slice(0, 3).join(' · ')}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No countries match “{query}”.
        </div>
      )}
    </div>
  );
}

export function CategoryPicker({
  onPicked,
  compact = false,
}: {
  onPicked?: () => void;
  compact?: boolean;
}) {
  const { lang, countryIso, categoryId, setCategory } = useVisaStore();

  if (!countryIso) return null;

  // Use the static VISA_CATEGORIES list, filtered by which are available for this country
  const all = VISA_CATEGORIES;
  // We don't have country-specific availability filtering on the static category list — show all 6
  const items = all;

  const pick = (id: string) => {
    setCategory(id);
    onPicked?.();
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((cat) => (
          <button
            key={cat.id}
            onClick={() => pick(cat.id)}
            className={
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ' +
              (categoryId === cat.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card hover:bg-accent/40')
            }
            aria-pressed={categoryId === cat.id}
          >
            <span aria-hidden="true">{cat.icon}</span>
            <span>{cat.name[lang]}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((cat) => {
        const selected = categoryId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => pick(cat.id)}
            className={
              'group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-md ' +
              (selected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/40')
            }
            aria-pressed={selected}
          >
            <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="vc-display font-bold leading-tight">{cat.name[lang]}</div>
              <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {cat.description[lang]}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-normal text-[10px]">
                  {cat.typicalDuration}
                </Badge>
                {cat.requiresSponsorship && (
                  <Badge variant="outline" className="font-normal text-[10px]">Sponsor</Badge>
                )}
                {cat.requiresFinancialProof && (
                  <Badge variant="outline" className="font-normal text-[10px]">Funds</Badge>
                )}
              </div>
            </div>
            {selected && (
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Combined picker used in step 0 of the wizard
export function DestinationPicker({ onContinue }: { onContinue: () => void }) {
  const { lang, countryIso, categoryId } = useVisaStore();
  const ready = !!countryIso && !!categoryId;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="vc-display mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t(lang, 'pick_destination')}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">{t(lang, 'pick_destination_desc')}</p>
        <CountryPicker />
      </div>
      {countryIso && (
        <div className="vc-fade">
          <h3 className="vc-display mb-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t(lang, 'pick_category')}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">{t(lang, 'pick_category_desc')}</p>
          <CategoryPicker />
        </div>
      )}
      <Button disabled={!ready} onClick={onContinue} className="w-full sm:w-auto">
        {t(lang, 'next')}
      </Button>
    </div>
  );
}
