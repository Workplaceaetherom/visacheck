// VisaCheck — Alternative Pathway Engine.
//
// When a user's profile doesn't meet the requirements for their originally
// selected country + visa category, this engine suggests OTHER countries
// where the same profile would more likely qualify. This is the "beast"
// feature — finding hidden paths the user may not have considered.
//
// Design contract:
//   - Pure functions only. No React/Next imports (only types + data from
//     sibling lib modules: rules-data, countries, visa-categories).
//   - No console.log, no localStorage, no I/O, no side effects.
//   - Currency conversion uses a static, approximate USD-rate table — there
//     is no live FX feed by design (store-nothing, deterministic, offline).
//   - Scores are normalised to 0-100. Reasons are templated from each
//     destination's real published thresholds so the user sees concrete
//     numbers (e.g. "SGD $5,000/month"), not hand-wavy hints.
//   - The PENDING_HUMAN_CLICK gate is intentionally untouched here — pathway
//     suggestions are advisory only and never override the rules-engine's
//     displayed verdict. The UI is responsible for surfacing the gate.
//
// Scoring philosophy:
//   The engine evaluates EVERY visa category loaded for each candidate
//   country and keeps the highest-scoring (country, category) pair. This
//   means a user who failed UK Skilled Worker but has $500k+ to invest
//   will be routed to US EB-5 / UAE Investor — a genuine "hidden path".
//   A small bias (+5) is applied when the candidate category equals the
//   user's original selection, so the engine prefers the same pathway
//   in another country when scores are otherwise tied.

import type { Answers, RuleCategory } from '@/lib/rules-data';
import { RULES, rulesForCountryCategory } from '@/lib/rules-data';
import { COUNTRIES, getCountry } from '@/lib/countries';
import type { Country } from '@/lib/countries';
import { getCategory } from '@/lib/visa-categories';

// ---------------------------------------------------------------------------
// Public types (exported as specified in the task contract)
// ---------------------------------------------------------------------------

export interface PathwaySuggestion {
  countryIso: string;
  countryName: string;
  flag: string;
  authority: string;
  categoryId: string;
  categoryName: string;
  matchScore: number;        // 0-100, how well the profile matches
  matchLabel: 'strong' | 'moderate' | 'weak';
  reason: string;            // why this country is suggested
  estimatedRules: number;    // how many rules are loaded
  isAlternative: boolean;    // true if this is a different country than originally selected
}

export interface PathwayAnalysis {
  originalCountry: string;
  originalCategory: string;
  suggestions: PathwaySuggestion[];
}

// ---------------------------------------------------------------------------
// Static metadata — per-country pathway profile + FX rates
// ---------------------------------------------------------------------------

/**
 * Approximate USD exchange rates. Each entry is "how many USD per 1 unit of
 * the listed currency" as of late 2024. These are intentionally approximate
 * — used only for cross-country threshold comparison, never for any financial
 * calculation. Update when currency drift becomes material (no live FX feed).
 */
const USD_RATES: Record<string, number> = {
  USD: 1,
  GBP: 1.27,
  EUR: 1.08,
  CAD: 0.74,
  AUD: 0.66,
  AED: 0.27,
  SGD: 0.74,
  NZD: 0.60,
};

/** Convert an amount in the given currency to USD using the static rate table. */
function toUsd(amount: number, currency: string): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const rate = USD_RATES[currency] ?? 1;
  return amount * rate;
}

/** Currency symbol prefix used for human-readable money strings. */
const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'C$',
  AUD: 'A$',
  AED: 'AED ',
  SGD: 'S$',
  NZD: 'NZ$',
};

/** Format a money amount in its native currency, e.g. "£40,000" or "AED 48,000". */
function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? '';
  const rounded = Math.round(amount);
  return `${sym}${rounded.toLocaleString('en-US')}`;
}

/**
 * Per-country pathway profile. Captures the published thresholds and
 * requirement shape for each visa category loaded in that country, plus
 * an English-speaking flag that boosts scores for English-proficient
 * applicants.
 *
 * `null` for a category means VisaCheck has no rules loaded for it in this
 * country, so the engine will skip it during evaluation.
 */
interface CountryPathwayProfile {
  /** Destination currency code (mirrors `Country.currency`). */
  currency: string;
  /** True if English is a primary official language (favours English-proficient applicants). */
  englishSpeaking: boolean;
  /** Skilled Worker route details, or null if not loaded. */
  skilledWorker: {
    /** Annual salary threshold in destination currency, or null for points-based systems (CA, NZ). */
    salaryThresholdAnnual: number | null;
    /** Human-readable threshold label, e.g. "SGD $5,000/month" or "£38,700/year". */
    salaryLabel: string;
    /** English level required (CEFR / IELTS label). */
    englishLevel: string;
  } | null;
  /** Student route details, or null if not loaded. */
  student: {
    englishLevel: string;
  } | null;
  /** Investor route details, or null if not loaded. */
  investor: {
    /** Minimum investment amount in destination currency. */
    amountThreshold: number;
    /** Human-readable threshold label, e.g. "AED 2,000,000 (10-year investor visa)". */
    amountLabel: string;
  } | null;
  /** Business route details, or null if not loaded. */
  business: {
    /** True if a business plan is the primary requirement. */
    requiresBusinessPlan: boolean;
  } | null;
  /** Visitor route details, or null if not loaded. */
  visitor: {
    requiresReturnTicket: boolean;
    requiresFunds: boolean;
  } | null;
  /** Family route details, or null if not loaded. */
  family: {
    requiresRelationship: boolean;
    requiresSponsorIncome: boolean;
  } | null;
}

/**
 * Country pathway profile registry. Keys are ISO alpha-2 codes.
 * Only countries with rules loaded in `RULES` need entries here —
 * others are filtered out by `rulesForCountryCategory` lookups anyway.
 */
const COUNTRY_PROFILES: Record<string, CountryPathwayProfile> = {
  GB: {
    currency: 'GBP',
    englishSpeaking: true,
    skilledWorker: {
      salaryThresholdAnnual: 38700,
      salaryLabel: '£38,700/year',
      englishLevel: 'B1',
    },
    student: { englishLevel: 'B2' },
    investor: null,
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: false, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  US: {
    currency: 'USD',
    englishSpeaking: true,
    skilledWorker: {
      salaryThresholdAnnual: 60000,
      salaryLabel: '$60,000/year (prevailing wage)',
      englishLevel: 'B1',
    },
    student: { englishLevel: 'B1' },
    investor: {
      amountThreshold: 500000,
      amountLabel: '$500,000 (EB-5 TEA)',
    },
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  CA: {
    currency: 'CAD',
    englishSpeaking: true,
    skilledWorker: {
      // Express Entry is points-based (CRS), not a single salary threshold.
      salaryThresholdAnnual: null,
      salaryLabel: 'Express Entry (CRS points-based)',
      englishLevel: 'CLB 7',
    },
    student: { englishLevel: 'CLB 7' },
    investor: null,
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  AU: {
    currency: 'AUD',
    englishSpeaking: true,
    skilledWorker: {
      salaryThresholdAnnual: 73150,
      salaryLabel: 'AUD $73,150/year (TSMIT)',
      englishLevel: 'B1',
    },
    student: { englishLevel: 'B1' },
    investor: {
      amountThreshold: 2500000,
      amountLabel: 'AUD $2,500,000 (Significant Investor Visa)',
    },
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  DE: {
    currency: 'EUR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 45300,
      salaryLabel: '€45,300/year (EU Blue Card)',
      englishLevel: 'A1 German / B1 English',
    },
    student: { englishLevel: 'B1' },
    investor: null,
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  AE: {
    currency: 'AED',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 48000, // AED 4,000/month × 12
      salaryLabel: 'AED 4,000/month (skilled category)',
      englishLevel: 'none (English widely used in business)',
    },
    student: { englishLevel: 'B1' },
    investor: {
      amountThreshold: 2000000,
      amountLabel: 'AED 2,000,000 (10-year investor visa)',
    },
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  SG: {
    currency: 'SGD',
    englishSpeaking: true,
    skilledWorker: {
      salaryThresholdAnnual: 60000, // SGD $5,000/month × 12
      salaryLabel: 'SGD $5,000/month',
      englishLevel: 'B1',
    },
    student: { englishLevel: 'B1' },
    investor: null,
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  NZ: {
    currency: 'NZD',
    englishSpeaking: true,
    skilledWorker: {
      // Skilled Migrant Category — points-based (160+).
      salaryThresholdAnnual: null,
      salaryLabel: 'Skilled Migrant Category (160+ points)',
      englishLevel: 'IELTS 6.5',
    },
    student: { englishLevel: 'IELTS 5.5' },
    investor: null,
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  IE: {
    currency: 'EUR',
    englishSpeaking: true,
    skilledWorker: {
      salaryThresholdAnnual: 32000,
      salaryLabel: '€32,000/year (Critical Skills)',
      englishLevel: 'B1',
    },
    student: { englishLevel: 'B1' },
    investor: null,
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
};

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

interface ScoreContext {
  a: Answers;
  country: Country;
  profile: CountryPathwayProfile;
  originalCurrency: string;
  salaryUsd: number;
  investmentUsd: number;
  categoryName: string;
}

interface ScoreResult {
  score: number;
  reasons: string[];
}

/** Clamp a score to the 0-100 range. */
function clampScore(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

/** Label for a score band, per the task spec. */
function labelForScore(n: number): 'strong' | 'moderate' | 'weak' {
  if (n >= 80) return 'strong';
  if (n >= 60) return 'moderate';
  if (n >= 40) return 'weak';
  // Below the "weak" floor — still returned but flagged as weak.
  return 'weak';
}

/** Skilled Worker scoring. Maximum raw score ≈ 100. */
function scoreSkilledWorker(ctx: ScoreContext): ScoreResult {
  const { a, country, profile, originalCurrency, salaryUsd, categoryName } = ctx;
  const sw = profile.skilledWorker;
  if (!sw) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  // Job offer / CoS is the load-bearing requirement for every employer-sponsored route.
  if (a.hasCos) {
    score += 30;
    reasons.push(
      `You have a job offer / CoS — a mandatory prerequisite for ${country.name.en}'s ${categoryName} route`,
    );
  }

  // Salary threshold (USD-normalised) when a numeric threshold exists.
  if (sw.salaryThresholdAnnual !== null && a.salary > 0) {
    const thresholdUsd = toUsd(sw.salaryThresholdAnnual, profile.currency);
    if (thresholdUsd > 0 && salaryUsd >= thresholdUsd) {
      score += 25;
      reasons.push(
        `Your salary of ${formatMoney(a.salary, originalCurrency)} meets ${country.name.en}'s ${categoryName} threshold (${sw.salaryLabel})`,
      );
    } else if (thresholdUsd > 0 && salaryUsd >= thresholdUsd * 0.85) {
      // Close to threshold — partial credit, no reason text.
      score += 12;
    }
  } else if (sw.salaryThresholdAnnual === null) {
    // Points-based system (CA Express Entry, NZ SMC) — credit job + English together.
    if (a.hasCos && a.englishMet) {
      score += 15;
      reasons.push(
        `Your job offer + English proficiency position you well for ${country.name.en}'s points-based ${categoryName} route`,
      );
    } else if (a.hasCos) {
      score += 8;
    }
  }

  // English proficiency — bigger boost for English-speaking destinations.
  if (a.englishMet && profile.englishSpeaking) {
    score += 20;
    reasons.push(
      `Your English proficiency meets ${country.name.en}'s ${categoryName} requirement (${sw.englishLevel})`,
    );
  } else if (a.englishMet) {
    score += 10;
  }

  // Maintenance funds.
  if (a.fundsMet) {
    score += 10;
  }

  // Sponsor-licensed bonus (small but real signal).
  if (a.sponsorLicensed === 'yes') {
    score += 5;
  }

  // Nationality-based popular-route alignment.
  if (country.popularRoutes.includes(a.nationality)) {
    score += 10;
    reasons.push(
      `Your nationality ${a.nationality} is a popular route to ${country.name.en}`,
    );
  }

  return { score: clampScore(score), reasons };
}

/** Student scoring. Maximum raw score ≈ 100. */
function scoreStudent(ctx: ScoreContext): ScoreResult {
  const { a, country, profile, categoryName } = ctx;
  const st = profile.student;
  if (!st) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  if (a.admissionOffer) {
    score += 35;
    reasons.push(
      `You have an admission offer — the core requirement for ${country.name.en}'s ${categoryName} route`,
    );
  }

  if (a.studyFundsMet) {
    score += 25;
    reasons.push(`Your study funds satisfy ${country.name.en}'s financial capacity check`);
  }

  if (a.englishMet && profile.englishSpeaking) {
    score += 20;
    reasons.push(
      `Your English proficiency meets ${country.name.en}'s ${categoryName} requirement (${st.englishLevel})`,
    );
  } else if (a.englishMet) {
    score += 10;
  }

  if (a.fundsMet) {
    score += 5;
  }

  if (country.popularRoutes.includes(a.nationality)) {
    score += 10;
    reasons.push(
      `Your nationality ${a.nationality} is a popular route to ${country.name.en}`,
    );
  }

  // Tie-breaker: a valid passport + clean character smooth student applications.
  if (a.passportValid && a.criminalCert) {
    score += 5;
  }

  return { score: clampScore(score), reasons };
}

/** Investor / Golden Visa scoring. Maximum raw score ≈ 100. */
function scoreInvestor(ctx: ScoreContext): ScoreResult {
  const { a, country, profile, originalCurrency, investmentUsd, categoryName } = ctx;
  const inv = profile.investor;
  if (!inv) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  // Investment threshold is the load-bearing requirement.
  if (a.investmentAmount > 0) {
    const thresholdUsd = toUsd(inv.amountThreshold, profile.currency);
    if (thresholdUsd > 0 && investmentUsd >= thresholdUsd) {
      score += 50;
      reasons.push(
        `Your investment of ${formatMoney(a.investmentAmount, originalCurrency)} qualifies for ${country.name.en}'s ${categoryName} visa (${inv.amountLabel})`,
      );
    } else if (thresholdUsd > 0 && investmentUsd >= thresholdUsd * 0.5) {
      // Substantial but below threshold — partial credit.
      score += 20;
    }
  }

  if (a.businessPlan) {
    score += 20;
    reasons.push(`You have a business plan suitable for ${country.name.en}'s investor route`);
  }

  if (a.englishMet) {
    score += 15;
  }

  if (a.fundsMet) {
    score += 10;
  }

  if (country.popularRoutes.includes(a.nationality)) {
    score += 5;
    reasons.push(
      `Your nationality ${a.nationality} is a popular route to ${country.name.en}`,
    );
  }

  return { score: clampScore(score), reasons };
}

/** Business (innovator / entrepreneur) scoring. Maximum raw score ≈ 100. */
function scoreBusiness(ctx: ScoreContext): ScoreResult {
  const { a, country, profile, categoryName } = ctx;
  const biz = profile.business;
  if (!biz) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  if (a.businessPlan) {
    score += 45;
    reasons.push(
      `Your business plan is the core requirement for ${country.name.en}'s ${categoryName} route`,
    );
  }

  if (a.investmentAmount > 0) {
    // Business routes don't usually have a fixed capital threshold, but
    // having capital to deploy is a strong positive signal.
    score += 15;
    reasons.push(
      `You have capital (${formatMoney(a.investmentAmount, ctx.originalCurrency)}) ready to deploy`,
    );
  }

  if (a.englishMet) {
    score += 15;
  }

  if (a.fundsMet) {
    score += 10;
  }

  if (country.popularRoutes.includes(a.nationality)) {
    score += 10;
    reasons.push(
      `Your nationality ${a.nationality} is a popular route to ${country.name.en}`,
    );
  }

  if (a.criminalCert) {
    score += 5;
  }

  return { score: clampScore(score), reasons };
}

/** Visitor / tourist scoring. Maximum raw score ≈ 100. */
function scoreVisitor(ctx: ScoreContext): ScoreResult {
  const { a, country, profile, categoryName } = ctx;
  const vs = profile.visitor;
  if (!vs) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  if (a.visitPurposeValid) {
    score += 30;
    reasons.push(
      `Your stated visit purpose is permitted under ${country.name.en}'s ${categoryName} rules`,
    );
  }

  if (a.returnTicket) {
    score += 25;
    reasons.push(`You have a return / onward ticket (required by ${country.name.en})`);
  }

  if (a.fundsMet) {
    score += 20;
    reasons.push(`Your maintenance funds satisfy ${country.name.en}'s visitor funds check`);
  }

  if (a.healthInsurance) {
    score += 15;
    reasons.push(`Your travel / health insurance aligns with ${country.name.en}'s visitor requirements`);
  }

  if (country.popularRoutes.includes(a.nationality)) {
    score += 10;
    reasons.push(
      `Your nationality ${a.nationality} is a popular route to ${country.name.en}`,
    );
  }

  return { score: clampScore(score), reasons };
}

/** Family / partner route scoring. Maximum raw score ≈ 100. */
function scoreFamily(ctx: ScoreContext): ScoreResult {
  const { a, country, profile, categoryName } = ctx;
  const fam = profile.family;
  if (!fam) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  if (a.relationshipProof) {
    score += 35;
    reasons.push(
      `Your proof of relationship is the core requirement for ${country.name.en}'s ${categoryName} route`,
    );
  }

  if (a.sponsorIncomeMet) {
    score += 30;
    reasons.push(`Your sponsor meets ${country.name.en}'s income threshold`);
  }

  if (a.englishMet) {
    score += 15;
  }

  if (a.fundsMet) {
    score += 10;
  }

  if (country.popularRoutes.includes(a.nationality)) {
    score += 10;
    reasons.push(
      `Your nationality ${a.nationality} is a popular route to ${country.name.en}`,
    );
  }

  return { score: clampScore(score), reasons };
}

/**
 * Dispatch a single (country, category) scoring call.
 * Returns `{ score: 0, reasons: [] }` if the category isn't loaded for the country.
 */
function scoreCategory(
  categoryId: string,
  ctx: ScoreContext,
): ScoreResult {
  switch (categoryId) {
    case 'skilled_worker':
      return scoreSkilledWorker(ctx);
    case 'student':
      return scoreStudent(ctx);
    case 'investor':
      return scoreInvestor(ctx);
    case 'business':
      return scoreBusiness(ctx);
    case 'visitor':
      return scoreVisitor(ctx);
    case 'family':
      return scoreFamily(ctx);
    default:
      return { score: 0, reasons: [] };
  }
}

// ---------------------------------------------------------------------------
// Reason composition
// ---------------------------------------------------------------------------

/**
 * Compose a single human-readable reason string from a list of contributing
 * reasons. Picks up to two of the strongest signals to keep the suggestion
 * card concise; additional signals are dropped (the score already reflects
 * them).
 */
function composeReason(reasons: string[]): string {
  const top = reasons.slice(0, 2);
  if (top.length === 0) {
    return 'Your profile is broadly compatible with this destination.';
  }
  return top.join('. ') + '.';
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Analyse the user's profile against every OTHER supported destination and
 * return up to 5 ranked alternative-pathway suggestions.
 *
 * Algorithm:
 *   1. Resolve the original country + currency (so the user's salary /
 *      investment can be normalised to USD for cross-country comparison).
 *   2. For each candidate country (excluding the original, must be marked
 *      `available: true` and have a pathway profile):
 *        For each visa category loaded in that country:
 *          - Compute matchScore (0-100) + reason clauses
 *          - Add a small (+5) bias when the category equals the original
 *        Keep the highest-scoring (category, score, reasons) triple.
 *   3. Drop countries whose best score is below 30 (too weak to surface).
 *   4. Sort by score descending, take the top 5.
 *
 * The result is deterministic and side-effect-free.
 */
export function analyzePathways(
  answers: Answers,
  originalCountryIso: string,
  originalCategoryId: string,
): PathwayAnalysis {
  const originalIso = originalCountryIso.trim().toUpperCase();
  const originalCountry = getCountry(originalIso);
  const originalCurrency = originalCountry?.currency ?? 'USD';

  // Normalise the user's salary + investment to USD once, using the original
  // country's currency. This lets us compare against every candidate country's
  // destination-currency threshold via the static USD rate table.
  const salaryUsd = toUsd(answers.salary, originalCurrency);
  const investmentUsd = toUsd(answers.investmentAmount, originalCurrency);

  const suggestions: PathwaySuggestion[] = [];

  for (const country of COUNTRIES) {
    // Skip the originally selected country — only suggest alternatives.
    if (country.iso === originalIso) continue;
    // Skip countries flagged as not-yet-available.
    if (!country.available) continue;
    // Skip countries without a pathway profile (no rule data loaded).
    const profile = COUNTRY_PROFILES[country.iso];
    if (!profile) continue;

    // Iterate every category that has at least one rule loaded for this country.
    const candidateCategories = new Set<RuleCategory>();
    for (const r of RULES) {
      if (r.countryIso === country.iso) {
        candidateCategories.add(r.category);
      }
    }
    if (candidateCategories.size === 0) continue;

    let bestScore = 0;
    let bestReasons: string[] = [];
    let bestCategoryId: RuleCategory | null = null;

    for (const categoryId of candidateCategories) {
      const visaCat = getCategory(categoryId);
      const categoryName = visaCat?.name.en ?? categoryId;
      const ctx: ScoreContext = {
        a: answers,
        country,
        profile,
        originalCurrency,
        salaryUsd,
        investmentUsd,
        categoryName,
      };
      let result = scoreCategory(categoryId, ctx);
      // Bias toward the same pathway the user originally selected — keeps
      // suggestions relevant when scores are otherwise tied.
      if (categoryId === originalCategoryId) {
        result = { score: clampScore(result.score + 5), reasons: result.reasons };
      }
      if (result.score > bestScore) {
        bestScore = result.score;
        bestReasons = result.reasons;
        bestCategoryId = categoryId;
      }
    }

    if (bestCategoryId === null) continue;
    // Drop suggestions below the 30-point floor — too weak to surface.
    if (bestScore < 30) continue;

    const visaCat = getCategory(bestCategoryId);
    const categoryName = visaCat?.name.en ?? bestCategoryId;
    const ruleCount = rulesForCountryCategory(country.iso, bestCategoryId).length;

    suggestions.push({
      countryIso: country.iso,
      countryName: country.name.en,
      flag: country.flag,
      authority: country.authority.shortName,
      categoryId: bestCategoryId,
      categoryName,
      matchScore: bestScore,
      matchLabel: labelForScore(bestScore),
      reason: composeReason(bestReasons),
      estimatedRules: ruleCount,
      isAlternative: true,
    });
  }

  // Sort by matchScore descending; tie-break alphabetically by country name.
  suggestions.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.countryName.localeCompare(b.countryName);
  });

  const top5 = suggestions.slice(0, 5);

  return {
    originalCountry: originalIso,
    originalCategory: originalCategoryId,
    suggestions: top5,
  };
}
