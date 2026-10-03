'use client';

import { useMemo } from 'react';
import { useVisaStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Compass, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { analyzePathways, type PathwaySuggestion } from '@/lib/pathway-engine';
import { COUNTRIES } from '@/lib/countries';
import { VISA_CATEGORIES } from '@/lib/visa-categories';
import { EMPTY_ANSWERS } from './store';
import { t } from '@/lib/i18n';

function matchColor(label: PathwaySuggestion['matchLabel']): string {
  switch (label) {
    case 'strong': return 'border-green-500/40 bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:text-green-300';
    case 'moderate': return 'border-amber-500/40 bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300';
    case 'weak': return 'border-slate-400/40 bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400';
  }
}

function matchIcon(score: number) {
  if (score >= 80) return <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />;
  return <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />;
}

export function PathwaySuggestions() {
  const { lang, result, countryIso, categoryId, answers, setCountry, setCategory, resetAnswers, setStage, setUsedOnce } = useVisaStore();

  const suggestions = useMemo(() => {
    if (!countryIso || !categoryId) return [];
    // Use the answers from the store if available, otherwise use EMPTY_ANSWERS
    const a = answers || EMPTY_ANSWERS;
    try {
      const analysis = analyzePathways(a, countryIso, categoryId);
      return analysis.suggestions;
    } catch {
      return [];
    }
  }, [countryIso, categoryId, answers]);

  if (suggestions.length === 0) return null;

  const onTryCountry = (s: PathwaySuggestion) => {
    // Preserve the profile across the country switch so points calculators,
    // pathway scores and rule verdicts recompute instantly for the new
    // destination — resetting answers here would throw away the user's data.
    setCountry(s.countryIso);
    setCategory(s.categoryId);
    setUsedOnce(true);
    localStorage.setItem('vcUsedOnce', '1');
    setStage('wizard');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section aria-label="Alternative pathways" className="mt-8">
      <Card className="vc-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 vc-display">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </div>
            {lang === 'ur' ? 'متبادل راستے' : lang === 'bn' ? 'বিকল্প পথ' : 'Alternative Pathways'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang === 'ur'
              ? 'آپ کے پروفائل کے لیے دیگر ممالک جہاں آپ کے پاس اچھے امکانات ہو سکتے ہیں۔'
              : lang === 'bn'
              ? 'আপনার প্রোফাইলের জন্য অন্যান্য দেশ যেখানে আপনার ভালো সম্ভাবনা থাকতে পারে।'
              : 'Other destinations where your profile may have strong prospects. Not a guarantee — always verify on the official authority.'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((s) => {
              const country = COUNTRIES.find((c) => c.iso === s.countryIso);
              const category = VISA_CATEGORIES.find((c) => c.id === s.categoryId);
              return (
                <div
                  key={`${s.countryIso}-${s.categoryId}`}
                  className={
                    'flex flex-col gap-2 rounded-xl border p-3 transition-all hover:shadow-sm vc-hover-lift ' +
                    matchColor(s.matchLabel)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">{s.flag}</span>
                      <div>
                        <div className="vc-display text-sm font-bold leading-tight">{s.countryName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.authority} · {category?.icon} {s.categoryName}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-0.5 text-[11px] font-bold">
                      {matchIcon(s.matchScore)}
                      {s.matchScore}%
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{s.reason}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium">
                    {s.hasPointsSystem && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary" title="This country runs a published points grid — VisaCheck computes your exact score">
                        Points system · auto-scored
                      </span>
                    )}
                    {s.settlementYears > 0 ? (
                      <span className="rounded-full border border-current/20 px-2 py-0.5 opacity-80" title="Indicative residence requirement before permanent residence / settlement">
                        PR in ~{s.settlementYears} yr{s.settlementYears === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="rounded-full border border-current/20 px-2 py-0.5 opacity-60" title="No citizenship/permanent-residence-by-residence track on this route">
                        No settlement track
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium opacity-70">
                      {s.estimatedRules > 0
                        ? `${s.estimatedRules} rules loaded`
                        : 'Rules being verified'}
                    </span>
                    <button
                      onClick={() => onTryCountry(s)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline"
                    >
                      {lang === 'ur' ? 'یہ ملک آزمائیں' : lang === 'bn' ? 'এই দেশ চেষ্টা করুন' : 'Try this country'}
                      <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
