// VisaCheck rules engine — pure, in-memory, store-nothing.
// Supports multi-country, multi-category filtering with date validity.
//
// The PENDING_HUMAN_CLICK gate is load-bearing:
//   if JSON.stringify(rule).includes('PENDING_HUMAN_CLICK') === true
//   the displayed verdict is ALWAYS "pending" — the safe "being verified" state.
// The underlying logical verdict is computed and returned for transparency only,
// but the gate's decision is final.

import { Answers, RULES, Rule, RuleCategory, isRuleActive } from '@/lib/rules-data';
import { Lang } from '@/lib/i18n';

export type RuleVerdict = 'pass' | 'fail' | 'na' | 'pending';

export interface EvaluatedRule {
  id: string;
  countryIso: string;
  category: RuleCategory;
  authority: {
    shortName: string;
    officialName: string;
    url: string;
  };
  lastUpdated: string;
  effectiveFrom: string;
  validTo: string | null;
  title: string;            // localised
  summary: string;          // localised
  source: string;
  published: true;
  active: boolean;           // is the rule currently in effect (date-wise)?
  logicalVerdict: Exclude<RuleVerdict, 'pending'>;
  displayedVerdict: RuleVerdict;
  pending: true;
  proposedChange?: {
    status: string;
    summary: string;
    expectedEffectiveAt: string;
    sourceUrl: string;
  };
}

export interface CheckResult {
  schema: 'visacheck/result/v1';
  lang: Lang;
  countryIso: string;
  categoryId: RuleCategory | 'all';
  evaluatedAt: string;
  asOfToday: string;
  totalRules: number;
  rules: EvaluatedRule[];
  counts: {
    total: number;
    pending: number;
    pass: number;
    fail: number;
    na: number;
  };
  allPending: true;
}

export function evaluateRule(rule: Rule, a: Answers, lang: Lang, now: Date = new Date()): EvaluatedRule {
  // The gate: marker presence forces displayed verdict to "pending".
  const ruleJson = JSON.stringify(rule);
  const isPending = ruleJson.includes('PENDING_HUMAN_CLICK');

  let logical: Exclude<RuleVerdict, 'pending'>;
  if (!isRuleActive(rule, now)) {
    logical = 'na'; // rule not yet in effect / expired
  } else if (!rule.applies(a)) {
    logical = 'na';
  } else {
    logical = rule.evaluate(a);
  }

  return {
    id: rule.id,
    countryIso: rule.countryIso,
    category: rule.category,
    authority: rule.authority,
    lastUpdated: rule.lastUpdated,
    effectiveFrom: rule.effectiveFrom,
    validTo: rule.validTo ?? null,
    title: rule.title[lang] ?? rule.title.en,
    summary: rule.summary[lang] ?? rule.summary.en,
    source: rule.source,
    published: true,
    active: isRuleActive(rule, now),
    logicalVerdict: logical,
    displayedVerdict: isPending ? 'pending' : logical,
    pending: true,
    proposedChange: rule.proposedChange
      ? {
          status: rule.proposedChange.status,
          summary: rule.proposedChange.summary,
          expectedEffectiveAt: rule.proposedChange.expectedEffectiveAt,
          sourceUrl: rule.proposedChange.sourceUrl,
        }
      : undefined,
  };
}

export function runCheck(
  answers: Answers,
  lang: Lang,
  countryIso: string,
  categoryId: RuleCategory | 'all' = 'all'
): CheckResult {
  const now = new Date();
  const iso = countryIso.trim().toUpperCase();
  const rules = RULES.filter((r) => {
    if (r.countryIso !== iso) return false;
    if (categoryId === 'all') return true;
    return r.category === categoryId;
  });

  const evaluated = rules.map((r) => evaluateRule(r, answers, lang, now));
  const counts = {
    total: evaluated.length,
    pending: evaluated.filter((r) => r.displayedVerdict === 'pending').length,
    pass: evaluated.filter((r) => r.displayedVerdict === 'pass').length,
    fail: evaluated.filter((r) => r.displayedVerdict === 'fail').length,
    na: evaluated.filter((r) => r.displayedVerdict === 'na').length,
  };
  return {
    schema: 'visacheck/result/v1',
    lang,
    countryIso: iso,
    categoryId,
    evaluatedAt: now.toISOString(),
    asOfToday: now.toISOString().slice(0, 10),
    totalRules: evaluated.length,
    rules: evaluated,
    counts,
    allPending: true, // while markers ship on every rule, this is always true
  };
}
