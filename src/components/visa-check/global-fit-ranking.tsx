'use client';

// VisaCheck — Global Fit Ranking.
// When the user's selected destination offers few viable routes for their
// profile, this panel ranks EVERY supported country (including the current
// pick) by match percentage, best route, and indicative time-to-permanent-
// residence. It answers the question official sites never do: "OK, then
// where CAN I actually go?"

import { useMemo } from 'react';
import { useVisaStore } from './store';
import { EMPTY_ANSWERS } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, ArrowRight } from 'lucide-react';
import { rankAllCountries, type GlobalFitRow } from '@/lib/pathway-engine';

export function GlobalFitRanking() {
  const { lang, result, countryIso, answers, setCountry, setCategory, setUsedOnce, setStage } =
    useVisaStore();

  const rows = useMemo<GlobalFitRow[]>(() => {
    if (!result) return [];
    try {
      return rankAllCountries(answers || EMPTY_ANSWERS);
    } catch {
      return [];
    }
  }, [result, answers]);

  // Only surface when the current destination is NOT already the top fit —
  // i.e. there genuinely is a better option elsewhere worth showing.
  const currentBest = rows.find((r) => r.countryIso === countryIso);
  const topRow = rows[0];
  const shouldShow =
    rows.length > 1 &&
    topRow &&
    (!currentBest || topRow.matchScore - currentBest.matchScore >= 15);

  if (!shouldShow) return null;

  const onPick = (r: GlobalFitRow) => {
    // Keep the profile — recompute everything for the new destination.
    setCountry(r.countryIso);
    setCategory(r.bestCategoryId);
    setUsedOnce(true);
    try { localStorage.setItem('vcUsedOnce', '1'); } catch { /* private mode */ }
    setStage('wizard');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section aria-label="Global fit ranking" className="mt-8">
      <Card className="vc-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 vc-display">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
            </div>
            {lang === 'ur'
              ? 'عالمی بہترین مطابقت'
              : lang === 'bn'
              ? 'বৈশ্বিক সেরা মিল'
              : 'Where you fit best — ranked worldwide'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang === 'ur'
              ? 'آپ کے پروفائل کی بنیاد پر ہر ملک کا میچ فیصد، بہترین راستہ اور مستقل رہائش کا تخمینی وقت۔'
              : lang === 'bn'
              ? 'আপনার প্রোফাইলের ভিত্তিতে প্রতিটি দেশের মিল শতাংশ, সেরা রুট এবং স্থায়ী বসতির আনুমানিক সময়।'
              : 'Match % for every supported country based on your actual profile — with the single best route and indicative time to permanent residence. Advisory only; verify on official sources.'}
          </p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {rows.slice(0, 8).map((r, i) => {
              const barColor =
                r.matchScore >= 70 ? 'bg-emerald-500' : r.matchScore >= 45 ? 'bg-amber-500' : 'bg-slate-400';
              return (
                <li
                  key={r.countryIso}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    r.countryIso === countryIso ? 'border-primary/40 bg-primary/[0.04]' : 'hover:bg-muted/40'
                  }`}
                >
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-xl shrink-0" aria-hidden="true">{r.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {r.countryName}
                        {r.countryIso === countryIso && (
                          <span className="ml-1.5 text-[10px] font-medium text-primary">
                            ({lang === 'ur' ? 'موجودہ' : lang === 'bn' ? 'বর্তমান' : 'current'})
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs font-bold tabular-nums">{r.matchScore}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${r.matchScore}%` }} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{r.bestCategoryName.replace(/^\w/, (c) => c.toUpperCase())}</span>
                      {r.settlementYears > 0 ? (
                        <span>PR ~{r.settlementYears} yr</span>
                      ) : (
                        <span>No settlement track</span>
                      )}
                      {r.hasPointsSystem && <span className="font-semibold text-primary">Points system</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => onPick(r)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold hover:bg-muted/50"
                  >
                    {lang === 'ur' ? 'دیکھیں' : lang === 'bn' ? 'দেখুন' : 'View'}
                    <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
