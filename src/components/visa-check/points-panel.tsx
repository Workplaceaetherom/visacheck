'use client';

// VisaCheck — Points Assessment panel.
//
// Surfaces the published points matrices (Canada CRS /1200, Australia GSM
// /100, UK Skilled Worker /70, NZ SMC /6) using the SAME wizard answers the
// rules check used. Pure advisory: the PENDING_HUMAN_CLICK gate on the
// rules-engine verdict is untouched — this panel never claims to be a
// eligibility decision, only an indicative score against public grids.

import { useMemo } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { calculatePoints, answersToPointsInput, type PointsResult } from '@/lib/points-calculator';

/** Official sources for each points system — linked so users can verify. */
const POINTS_SOURCES: Record<string, { url: string; label: string }> = {
  CA: { url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html', label: 'IRCC CRS grid' },
  AU: { url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested-skilled-occupation-visa', label: 'Home Affairs points test' },
  GB: { url: 'https://www.gov.uk/skilled-worker-visa', label: 'gov.uk Skilled Worker' },
  NZ: { url: 'https://www.immigration.govt.nz/new-zealand-visas/prepare-a-visa-application/skilled-migrant-category', label: 'INZ Skilled Migrant Category' },
};

export function PointsPanel() {
  const answers = useVisaStore((s) => s.answers);
  const countryIso = useVisaStore((s) => s.countryIso);
  const categoryId = useVisaStore((s) => s.categoryId);
  const lang = useVisaStore((s) => s.lang);

  const result: PointsResult | null = useMemo(() => {
    // Only meaningful for skilled routes and countries with a published matrix.
    if (!countryIso) return null;
    if (categoryId && categoryId !== 'skilled_worker') return null;
    return calculatePoints(countryIso, answersToPointsInput(answers));
  }, [answers, countryIso, categoryId]);

  if (!result) return null;

  const source = POINTS_SOURCES[countryIso ?? ''];
  const pct = Math.min(100, Math.round((result.totalPoints / result.maxPoints) * 100));

  return (
    <Card className="vc-card mt-5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-primary" aria-hidden="true" />
          {t(lang, 'points_title')}
          <Badge variant="secondary" className="ms-2 font-normal">
            {result.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress toward the published minimum */}
        <div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar"
               aria-valuenow={result.totalPoints} aria-valuemin={0} aria-valuemax={result.maxPoints}>
            <div
              className={`h-full rounded-full transition-all ${result.passes ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {result.totalPoints} / {result.maxPoints} ·{' '}
              {t(lang, 'points_minimum', { n: result.minimumRequired })}
            </span>
            {source && (
              <a href={source.url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline">
                {source.label} <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {/* Breakdown table — every factor and its contribution */}
        <ul className="divide-y divide-border/60 text-sm">
          {result.breakdown.map((b, i) => (
            <li key={`${b.factor}-${i}`} className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground">{b.factor}</span>
              <span className={`font-semibold tabular-nums ${b.points > 0 ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                {b.points > 0 ? '+' : ''}{b.points}
              </span>
            </li>
          ))}
        </ul>

        {/* Indicative status — advisory, never a verdict */}
        <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
          result.passes ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-amber-500/30 bg-amber-500/[0.05]'
        }`}>
          {result.passes ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          )}
          <p className="leading-relaxed text-muted-foreground">
            {result.passes ? t(lang, 'points_passes') : t(lang, 'points_below')}{' '}
            <span className="font-medium">{t(lang, 'points_advisory')}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
