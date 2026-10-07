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
  /** True when the destination scores applicants on a published points grid (CA/AU/GB/NZ/FR/KR). */
  hasPointsSystem: boolean;
  /** Indicative years from arrival to permanent residence/settlement on this route (0 = unknown). */
  settlementYears: number;
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
  // Added for full 21-country coverage (approximate mid-2026 rates).
  SEK: 0.095,
  JPY: 0.0067,
  KRW: 0.00073,
  HKD: 0.128,
  SAR: 0.267,
  MYR: 0.22,
  BRL: 0.185,
  // Applicant-side currencies (wizard salary/investment may be entered in the
  // user's home currency; these let us normalise accurately to USD).
  PKR: 0.0036,   // ≈278 PKR/USD
  INR: 0.0113,   // ≈88 INR/USD
  BDT: 0.0083,   // ≈121 BDT/USD
  NPR: 0.0075,
  LKR: 0.0033,
  AFN: 0.0143,
  PHP: 0.0174,
  IDR: 0.000061,
  VND: 0.00004,
  THB: 0.0275,
  TRY: 0.024,
  EGP: 0.02,
  NGN: 0.00065,
  GHS: 0.0082,
  KEN: 0.0078,
  ZAR: 0.055,
  MAD: 0.1,
  TND: 0.32,
  DZD: 0.0074,
  IQD: 0.00076,
  IRR: 0.00002,
  JOD: 1.41,
  LBP: 0.000011,
  SYP: 0.00074,
  YER: 0.004,
  OMR: 2.6,
  QAR: 0.275,
  BHD: 2.65,
  KWD: 3.25,
  UAH: 0.024,
  RUB: 0.011,
  PLN: 0.25,
  RON: 0.22,
  RSD: 0.0092,
  ALB: 0.011,
  MKD: 0.018,
  BAM: 0.55,
  MXN: 0.052,
  COP: 0.00025,
  PEN: 0.27,
  CLP: 0.0011,
  ARS: 0.001,
  UYU: 0.025,
  PAB: 1,
  DOP: 0.017,
  HTG: 0.0075,
  FJD: 0.45,
  TZS: 0.00039,
  UGX: 0.00026,
  ETB: 0.008,
  SOS: 0.0018,
  SDG: 0.0017,
  MNT: 0.0029,
  MMK: 0.00048,
  KHR: 0.00025,
  LAK: 0.000046,
  BTN: 0.011,
  MVR: 0.065,
};

/** Convert an amount in the given currency to USD using the static rate table. */
function toUsd(amount: number, currency: string): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const rate = USD_RATES[currency] ?? EXTRA_RATES[currency] ?? 1;
  return amount * rate;
}

/**
 * Best-effort currency resolution for a nationality name (as stored in
 * `Answers.nationality`). The wizard collects salary and investment amounts
 * in the destination currency, but users frequently think in their home
 * currency (a Pakistani applicant typing "PKR 8,000,000" into a UK form).
 * When the entered magnitude is wildly below the destination threshold yet
 * plausible in the applicant's home currency, we reinterpret it so scores
 * and shortfall messages stay accurate instead of collapsing to 0%.
 */
const NATIONALITY_CURRENCY: Record<string, string> = {
  Pakistan: 'PKR', India: 'INR', Bangladesh: 'BDT', Nepal: 'NPR',
  'Sri Lanka': 'LKR', Afghanistan: 'AFN', Philippines: 'PHP', Indonesia: 'IDR',
  Vietnam: 'VND', Thailand: 'THB', Turkey: 'TRY', Egypt: 'EGP', Nigeria: 'NGN',
  Ghana: 'GHS', Kenya: 'KES', 'South Africa': 'ZAR', Morocco: 'MAD',
  Tunisia: 'TND', Algeria: 'DZD', Iraq: 'IQD', Iran: 'IRR', Jordan: 'JOD',
  Lebanon: 'LBP', Syria: 'SYP', Yemen: 'YER', Ukraine: 'UAH', Poland: 'PLN',
  Romania: 'RON', Mexico: 'MXN', Colombia: 'COP', Peru: 'PEN', Chile: 'CLP',
  Argentina: 'ARS', China: 'CNY',
};

/** Normalise a nationality string for lookup (trim + collapse whitespace). */
function normaliseNationality(n: string): string {
  return n.trim().replace(/\s+/g, ' ');
}

/** Rate-table alias lookup for currencies keyed by ISO code above. */
const EXTRA_RATES: Record<string, number> = {
  KES: 0.0078, CNY: 0.14,
};

/**
 * If the amount looks like it was entered in the applicant's home currency
 * (i.e. converting it PKR→USD etc. lands within ±60% of the destination
 * threshold while the raw value under the destination currency is <25% of
 * it), treat the amount as home-currency and convert. Returns the USD value.
 */
function resolveAmountUsd(
  amount: number,
  destCurrency: string,
  nationality: string,
  thresholdUsd: number,
): number {
  const naive = toUsd(amount, destCurrency);
  if (thresholdUsd <= 0 || amount <= 0) return naive;
  if (naive >= thresholdUsd * 0.25) return naive; // plausible as-is
  const home = NATIONALITY_CURRENCY[normaliseNationality(nationality)];
  if (!home || home === destCurrency) return naive;
  const converted = toUsd(amount, home);
  // Accept the reinterpretation only when it produces a sensible band.
  if (converted >= thresholdUsd * 0.4 && converted <= thresholdUsd * 4) {
    return converted;
  }
  return naive;
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
  SEK: 'SEK ',
  JPY: '¥',
  KRW: '₩',
  HKD: 'HK$',
  SAR: 'SAR ',
  MYR: 'RM ',
  BRL: 'R$ ',
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
      salaryThresholdAnnual: 38700, // Skilled Worker general threshold (uplifted Apr 2025); new-entrant band £30,960
      salaryLabel: '£38,700/year (Skilled Worker; £30,960 new-entrant)',
      englishLevel: 'B1',
    },
    student: { englishLevel: 'B2' },
    investor: {
      amountThreshold: 2000000, // Innovator Founder: £50k endorsement funds; Tier 1 Investor closed Feb 2022 — surfaced as the £2M founder/enterprise capital band
      amountLabel: '£50,000 endorsement funds (Innovator Founder); Tier 1 Investor route closed Feb 2022',
    },
    business: { requiresBusinessPlan: true }, // Innovator Founder & Global Talent rules loaded
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
      amountThreshold: 500000, // EB-5: $800k–$1.05M after the 2022 Reform & Integrity Act set-aside programme; label reflects current statutory bands
      amountLabel: '$800,000 (EB-5 targeted employment) / $1,050,000 standard',
    },
    business: { requiresBusinessPlan: true }, // E-2 Treaty Investor, L-1 Intracompany & O-1 rules loaded
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
    investor: {
      amountThreshold: 1200000, // Start-Up Visa: ~CAD 1.2M designated-investment package (or CAD 300k for Angel groups)
      amountLabel: 'CAD 1,200,000 (Start-Up Visa — VC package; CAD 300k angel / CAD 75k incubator tiers)',
    },
    business: { requiresBusinessPlan: true }, // Intra-Company Transfer, Self-Employed Persons & Startup rules loaded
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  AU: {
    currency: 'AUD',
    englishSpeaking: true,
    skilledWorker: {
      salaryThresholdAnnual: 76515, // Core Skills Income Threshold (CSIT) — indexed from 1 July 2025 (was TSMIT $73,150)
      salaryLabel: 'AUD $76,515/year (CSIT, from 1 Jul 2025)',
      englishLevel: 'IELTS 6.0 (Competent) for 189/190; +bands for points',
    },
    student: { englishLevel: 'IELTS 6.0 (subclassed 500 VET/degree)' },
    investor: {
      amountThreshold: 1400000, // Business Innovation and Investment (Provisional) 888: significant-business stream AUD 1.4M + state nomination
      amountLabel: 'AUD 1,400,000 (subclass 888 significant-business stream)',
    },
    business: { requiresBusinessPlan: true }, // subclass 188 entrepreneur streams rules loaded
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  DE: {
    currency: 'EUR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 43759, // EU Blue Card 2026: €43,759.81 general (50% of contributory ceiling); shortage occupations €39,347.40
      salaryLabel: '€43,759/year (EU Blue Card) / Fachkräftesicherung §18b',
      englishLevel: 'B1 English / A1 German (for settlement)',
    },
    student: { englishLevel: 'B1' },
    investor: {
      amountThreshold: 250000, // §21 self-employed/founder residence: business plan + ~€250k capital is the common approval benchmark
      amountLabel: '≈€250,000 investment (§21 founder residence — economic-interest test)',
    },
    business: { requiresBusinessPlan: true }, // §21 Selbstständiger & startup-with-VC rules loaded
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
    business: { requiresBusinessPlan: true }, // UAE Freelance Visa & Investor/Partner residency rules loaded
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  SG: {
    currency: 'SGD',
    englishSpeaking: true,
    skilledWorker: {
      salaryThresholdAnnual: 60000, // S Pass floor ≈ SGD $3,150/month (COMPASS-assessed); EP bands higher
      salaryLabel: 'SGD $3,150–$5,600/month (S Pass / Employment Pass + COMPASS)',
      englishLevel: 'B1 (English is the working language)',
    },
    student: { englishLevel: 'B1' },
    investor: {
      amountThreshold: 2500000, // Global Investor Programme: SGD 2.5M business investment
      amountLabel: 'SGD 2,500,000 (Global Investor Programme)',
    },
    business: { requiresBusinessPlan: true }, // EntrePass rules loaded
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true }, // SPVP/LTVP rules loaded
  },
  NZ: {
    currency: 'NZD',
    englishSpeaking: true,
    skilledWorker: {
      // Skilled Migrant Category 2023 rework: 6-points system (skill + experience + qualification).
      salaryThresholdAnnual: null,
      salaryLabel: 'Skilled Migrant Category (6-point system)',
      englishLevel: 'IELTS 6.0',
    },
    student: { englishLevel: 'IELTS 5.5' },
    investor: {
      amountThreshold: 5000000, // Active Investor Plus: NZD 5M growth fund / NZD 10M balanced
      amountLabel: 'NZD 5,000,000 (Active Investor Plus — growth fund)',
    },
    business: { requiresBusinessPlan: true }, // Entrepreneur Work Visa rules loaded
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
    investor: {
      amountThreshold: 1000000, // IIP was shut down Feb 2023; step-up path to Stamp 4 remains for existing holders
      amountLabel: '€1,000,000 (IIP — closed to new applicants Feb 2023)',
    },
    business: { requiresBusinessPlan: true }, // Start-Up Entrepreneur (STEP) & Supplier Entrepreneur rules loaded
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  FR: {
    currency: 'EUR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 35000, // ~1.8× SMIC for "Passeport Talent – salarié qualifié"
      salaryLabel: '€35,000/year (Passeport Talent)',
      englishLevel: 'B1 English / A2 French',
    },
    student: { englishLevel: 'B1/B2 (French-taught programmes need B2 French)' },
    investor: {
      amountThreshold: 30000, // "Passeport Talent – investisseur économique": ≥€30k own capital invested in a French business
      amountLabel: '€30,000 (Passeport Talent — economic investor capital)',
    },
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  NL: {
    currency: 'EUR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 35000, // Highly Skilled Migrant (2026 age-banded threshold, approx.)
      salaryLabel: '€35,000/year (Hooggeschoold migrant)',
      englishLevel: 'none (English widely used; inloopverklaring MVV may apply)',
    },
    student: { englishLevel: 'IELTS 6.0 / TOEFL 80' },
    investor: {
      amountThreshold: 1250000, // Startup Visa: €1.25M external VC/founder investment + facilitator
      amountLabel: '€1,250,000 (Startup Visa — VC-backed capital)',
    },
    business: { requiresBusinessPlan: true }, // Self-employed founder (points) & DAFT rules loaded
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  ES: {
    currency: 'EUR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 30000, // Unidad de Alto Cualificado reference (approx.)
      salaryLabel: '€30,000/year (Highly Qualified Work Permit)',
      englishLevel: 'none (Spanish helpful, not mandatory)',
    },
    student: { englishLevel: 'B1 Spanish / B1 English (English-taught)' },
    investor: {
      amountThreshold: 500000, // Spain's Golden Visa closed to new applicants 3 Apr 2025 — shown for transparency; route is CLOSED
      amountLabel: 'Golden Visa CLOSED (Apr 2025) — see entrepreneurship / non-lucrative routes',
    },
    business: { requiresBusinessPlan: true }, // Entrepreneur visa & self-employed rules loaded
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  PT: {
    currency: 'EUR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 10000, // D1 work visa ≈ Portuguese minimum wage annualised (€870/month in 2026)
      salaryLabel: '≈€10,440/year (D1 work visa, min. wage)',
      englishLevel: 'none (A2 Portuguese for PR/citizenship)',
    },
    student: { englishLevel: 'B1 (Portuguese or English-taught)' },
    investor: {
      amountThreshold: 500000, // Golden Visa: real-estate option abolished Oct 2023; fund contribution from €500k (€250–500k cultural/rare-property options exist)
      amountLabel: '€500,000 fund contribution (ARI — real-estate option abolished Oct 2023)',
    },
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  IT: {
    currency: 'EUR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 28500, // EU Blue Card Italy (2026 approx., below €30.5k gross floor)
      salaryLabel: '€28,500/year (EU Blue Card)',
      englishLevel: 'B1 English / A2 Italian',
    },
    student: { englishLevel: 'B1/B2 (Italian unis often require B2 Italian)' },
    investor: {
      amountThreshold: 500000,
      amountLabel: '€500,000 (Italy Investor Visa — start-up/innovative company)',
    },
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  SE: {
    currency: 'SEK',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 326160, // Maintenance requirement uplifted to SEK 27,180/month from 1 Jun 2025 (×12) — the work-permit salary floor
      salaryLabel: 'SEK 326,160/year (SEK 27,180/month maintenance level, from Jun 2025)',
      englishLevel: 'none (English widely used in Swedish tech)',
    },
    student: { englishLevel: 'IELTS 6.5 / English 6 equivalent' },
    investor: null, // Sweden has no residence-by-investment route; self-employed is handled under `business`
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  JP: {
    currency: 'JPY',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 4000000, // ¥4M/year ≈ typical Engineer/Specialist visa floor
      salaryLabel: '¥4,000,000/year (Engineer/Specialist visa)',
      englishLevel: 'none (JLPT N3 helpful; HSP points route favours English)',
    },
    student: { englishLevel: 'JLPT N5 / EJU; English-track needs TOEFL/IELTS' },
    investor: {
      amountThreshold: 50000000, // ¥50M capital for Business Manager visa
      amountLabel: '¥50,000,000 (Business Manager visa capital)',
    },
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  KR: {
    currency: 'KRW',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 40000000, // ≈GNI 1.5× for E-7; F-2 points route similar band
      salaryLabel: '₩40,000,000/year (E-7 / F-2 points)',
      englishLevel: 'TOPIK 3+ or EPIK level (varies by route)',
    },
    student: { englishLevel: 'TOPIK 1+ Korean / English-track needs TOEFL' },
    investor: {
      amountThreshold: 500000000, // F-2 investment visa ≈KRW 500M
      amountLabel: '₩500,000,000 (F-2 investor residency)',
    },
    business: null,
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  HK: {
    currency: 'HKD',
    englishSpeaking: true,
    skilledWorker: {
      salaryThresholdAnnual: null, // General Employment Policy: market-rate salary, no fixed floor
      salaryLabel: 'Market-rate salary (GEP / TTPS points-based)',
      englishLevel: 'none (English is an official language)',
    },
    student: { englishLevel: 'IELTS 6.0 / university admission requirement' },
    investor: null, // Capital Investment Entrant Scheme closed to direct property; not loaded
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  SA: {
    currency: 'SAR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 96000, // SAR 8,000/month premium-residency employment band
      salaryLabel: 'SAR 8,000/month (work visa + Premium Iqama bands)',
      englishLevel: 'none (English widely used in business)',
    },
    student: { englishLevel: 'B1 English / Arabic foundation year' },
    investor: {
      amountThreshold: 4000000, // SAR 4M Special Premium Residency (real estate)
      amountLabel: 'SAR 4,000,000 (Premium Residency real estate)',
    },
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  MY: {
    currency: 'MYR',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 60000, // RM 5,000/month Employment Pass (Category I band varies)
      salaryLabel: 'RM 5,000/month (Employment Pass)',
      englishLevel: 'none (English widely used professionally)',
    },
    student: { englishLevel: 'IELTS 5.0–6.0 (varies by institution)' },
    investor: {
      amountThreshold: 1000000, // MM2H deposit tier (varies); PVIP RM1M fixed deposit
      amountLabel: 'RM 1,000,000 (PVIP deposit / MM2H tiers)',
    },
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
  BR: {
    currency: 'BRL',
    englishSpeaking: false,
    skilledWorker: {
      salaryThresholdAnnual: 70000, // ≈BRL 6,000/month technical-professional VITEM IV/V band
      salaryLabel: 'BRL 6,000/month (work visa, CNIG rules)',
      englishLevel: 'none (Portuguese recommended)',
    },
    student: { englishLevel: 'none (Portuguese Proficiency Celpe-Bras for degrees)' },
    investor: {
      amountThreshold: 1000000, // R$ 1,000,000 real-estate investor visa (Rio/Lisbon-equivalent tier)
      amountLabel: 'R$ 1,000,000 (investor visa — varies by region)',
    },
    business: { requiresBusinessPlan: true },
    visitor: { requiresReturnTicket: true, requiresFunds: true },
    family: { requiresRelationship: true, requiresSponsorIncome: true },
  },
};

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

/**
 * Destinations whose primary skilled routes run on a published points grid
 * that VisaCheck can compute exactly (see points-calculator.ts). When the
 * user's selected country is one of these and their profile doesn't stack
 * up, the results UI surfaces "your score vs. recent invitation cutoffs"
 * plus cross-country suggestions ranked by fit.
 */
const POINTS_SYSTEM_COUNTRIES = new Set(['CA', 'AU', 'GB', 'NZ', 'FR', 'KR']);

/** Whether the destination has a native points calculator wired into the app. */
export function hasPointsCalculator(countryIso: string): boolean {
  return POINTS_SYSTEM_COUNTRIES.has(countryIso.trim().toUpperCase());
}

/**
 * Indicative time-to-settlement (permanent residence) in years, per
 * destination + category, based on published residence requirements as of
 * Oct 2026. 0 means "no defined settlement track" (e.g. UAE/Gulf residency
 * is renewable but not citizenship-by-residence; SG PR is discretionary).
 */
const SETTLEMENT_YEARS: Record<string, Partial<Record<string, number>>> = {
  GB: { skilled_worker: 5, student: 6, investor: 5, business: 3, family: 5 },      // ILR at 5y (Innovator Founder 3y; Student→SW = 5y post-switch)
  US: { skilled_worker: 10, student: 9, investor: 4, business: 7, family: 3 },     // EB backlogs vary wildly for IN/CN/PK; EAD+AP ≈ 3-5y after I-485 filing
  CA: { skilled_worker: 3, student: 4, investor: 3, business: 3, family: 3 },      // PR on approval; PGWP→EE typical ≈ 3-4y
  AU: { skilled_worker: 4, student: 5, investor: 4, business: 4, family: 4 },      // 189/190 PR on grant; 489/491→191 at 3-4y; student time counts partially
  DE: { skilled_worker: 3, student: 5, investor: 5, business: 5, family: 5 },      // Blue Card BR at 21 months w/ B1; regular §18c at 5y (2024 law)
  AE: { skilled_worker: 0, student: 0, investor: 10, business: 0, family: 0 },     // Golden visa ≠ citizenship; naturalisation ≈ 10y residence marriage exception
  SG: { skilled_worker: 5, student: 6, investor: 2, business: 5, family: 3 },      // PR discretionary; GIP fast-track to PR
  NZ: { skilled_worker: 2, student: 4, investor: 3, business: 3, family: 2 },      // SMC PR on approval; work→residence typical 2-4y
  IE: { skilled_worker: 5, student: 6, investor: 5, business: 5, family: 5 },      // Stamp 4 at 5y reckonable residence; Critical Skills at 2y
  FR: { skilled_worker: 5, student: 5, investor: 5, business: 5, family: 4 },      // Carte de résident at 5y (student year counts half)
  NL: { skilled_worker: 5, student: 5, investor: 5, business: 5, family: 5 },      // Inburgering at 5y continuous
  ES: { skilled_worker: 5, student: 5, investor: 0, business: 5, family: 5 },      // Residencia de larga duración at 5y (Golden closed)
  PT: { skilled_worker: 5, student: 5, investor: 5, business: 5, family: 3 },      // CP at 5y (A2 Portuguese); family at 3y
  IT: { skilled_worker: 5, student: 5, investor: 5, business: 5, family: 5 },      // Lungo periodo UE at 5y
  SE: { skilled_worker: 4, student: 4, business: 4, family: 4 },                   // Permanent upplysning typically granted ~3-4y under 2022 rules
  JP: { skilled_worker: 10, student: 10, investor: 10, business: 10, family: 5 },  // PR at 10y; HSP points route 1-3y fast-track
  KR: { skilled_worker: 5, student: 5, investor: 3, business: 5, family: 2 },      // F-5 points route ≈ 5y work; marriage M-7 at 2y
  HK: { skilled_worker: 7, student: 7, business: 7, family: 7 },                   // Right of land at 7y ordinary residence
  SA: { skilled_worker: 0, student: 0, investor: 0, business: 0, family: 0 },      // No citizenship-by-residence track (premium residency stays renewable)
  MY: { skilled_worker: 10, student: 10, investor: 10, business: 10, family: 10 }, // MM2H/PVIP are long-term visas; PR extremely rare (~10y+, discretionary)
  BR: { skilled_worker: 4, student: 4, investor: 5, business: 5, family: 4 },      // Naturalisation at 4y residence (1y for married/child); investor VIPER→permanent
};

/** Look up indicative settlement years for a (country, category) pair. */
export function settlementYearsFor(iso: string, categoryId: string): number {
  return SETTLEMENT_YEARS[iso.trim().toUpperCase()]?.[categoryId] ?? 0;
}

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

  // Skilled routes reward professional experience even without a job offer —
  // several countries (Germany §18c opportunity card, NZ SMC, Canada EE) let
  // qualified applicants enter or get invited to apply on experience alone.
  if (a.workExperienceYears >= 5 && !a.hasCos) {
    score += 6;
    reasons.push(
      `Your ${Math.floor(a.workExperienceYears)} years of work experience strengthens points-based skilled routes in ${country.name.en}`,
    );
  } else if (a.workExperienceYears >= 3 && !a.hasCos) {
    score += 4;
  }

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
    // Guard against home-currency entry (e.g. a Pakistani typing PKR into a
    // GBP field) so scores and shortfalls stay truthful.
    const salaryUsdAdj = resolveAmountUsd(a.salary, originalCurrency, a.nationality, thresholdUsd);
    if (thresholdUsd > 0 && salaryUsdAdj >= thresholdUsd) {
      score += 25;
      reasons.push(
        `Your salary of ${formatMoney(a.salary, originalCurrency)} meets ${country.name.en}'s ${categoryName} threshold (${sw.salaryLabel})`,
      );
    } else if (thresholdUsd > 0 && salaryUsdAdj >= thresholdUsd * 0.85) {
      // Close to threshold — partial credit, no reason text.
      score += 12;
    } else if (thresholdUsd > 0) {
      const gapLocal = Math.max(0, sw.salaryThresholdAnnual - salaryUsdAdj / (USD_RATES[profile.currency] ?? 1));
      reasons.push(
        `You are ${formatMoney(gapLocal, profile.currency)}/year below ${country.name.en}'s ${sw.salaryLabel}`,
      );
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
    // On genuine points grids (CRS / SMC / UK PBS), age, education and
    // experience directly buy invitation probability — reward them here so a
    // strong young master's graduate without an offer still sees real numbers.
    if (POINTS_SYSTEM_COUNTRIES.has(country.iso)) {
      const yrs = Math.floor(a.workExperienceYears ?? 0);
      if (yrs >= 3) {
        score += 8;
        reasons.push(
          `${yrs} years' experience + your profile add CRS/SMC-equivalent ranking points in ${country.name.en}`,
        );
      }
      if (a.education === 'master' || a.education === 'doctorate') score += 7;
      if (a.age >= 20 && a.age <= 32) score += 6;
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
    // Guard against home-currency entry (e.g. "PKR 40 crore" typed into a GBP field).
    const investUsdAdj = resolveAmountUsd(a.investmentAmount, originalCurrency, a.nationality, thresholdUsd);
    if (thresholdUsd > 0 && investUsdAdj >= thresholdUsd) {
      score += 50;
      reasons.push(
        `Your investment of ${formatMoney(a.investmentAmount, originalCurrency)} qualifies for ${country.name.en}'s ${categoryName} visa (${inv.amountLabel})`,
      );
    } else if (thresholdUsd > 0 && investUsdAdj >= thresholdUsd * 0.5) {
      // Substantial but below threshold — partial credit, with a concrete gap.
      score += 20;
      const gapLocal = Math.max(0, inv.amountThreshold - investUsdAdj / (USD_RATES[profile.currency] ?? 1));
      reasons.push(
        `You are ${formatMoney(gapLocal, profile.currency)} short of ${country.name.en}'s investor threshold (${inv.amountLabel})`,
      );
    } else if (thresholdUsd > 0) {
      reasons.push(
        `${country.name.en}'s ${categoryName} route requires ${inv.amountLabel} — your current capital is below that band`,
      );
    }
  } else {
    reasons.push(
      `${country.name.en}'s ${categoryName} route threshold: ${inv.amountLabel}`,
    );
  }

  if (a.businessPlan) {
    score += 20;
    reasons.push(`You have a business plan suitable for ${country.name.en}'s investor route`);
  }

  // Source-of-funds / liquid savings is checked on every investor & golden-visa application.
  if (a.fundsMet && !a.businessPlan) {
    reasons.push(
      `Your documented maintenance funds support the source-of-funds check for ${country.name.en}'s ${categoryName} visa`,
    );
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
      hasPointsSystem: POINTS_SYSTEM_COUNTRIES.has(country.iso),
      settlementYears: settlementYearsFor(country.iso, bestCategoryId),
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

/**
 * Rank EVERY supported destination (including the user's current pick) for
 * the given profile — used when the selected country has few or no viable
 * routes and we must answer "where CAN I actually go, in %?" across the board.
 */
export interface GlobalFitRow {
  countryIso: string;
  countryName: string;
  flag: string;
  bestCategoryId: string;
  bestCategoryName: string;
  matchScore: number;
  settlementYears: number;
  hasPointsSystem: boolean;
}

export function rankAllCountries(answers: Answers): GlobalFitRow[] {
  const rows: GlobalFitRow[] = [];
  for (const country of COUNTRIES) {
    if (!country.available) continue;
    const profile = COUNTRY_PROFILES[country.iso];
    if (!profile) continue;
    const salaryUsd = toUsd(answers.salary, country.currency);
    const investmentUsd = toUsd(answers.investmentAmount, country.currency);

    const candidateCategories = new Set<RuleCategory>();
    for (const r of RULES) {
      if (r.countryIso === country.iso) candidateCategories.add(r.category);
    }

    let best: GlobalFitRow | null = null;
    for (const categoryId of candidateCategories) {
      const visaCat = getCategory(categoryId);
      const categoryName = visaCat?.name.en ?? categoryId;
      const ctx: ScoreContext = {
        a: answers,
        country,
        profile,
        originalCurrency: country.currency,
        salaryUsd,
        investmentUsd,
        categoryName,
      };
      const result = scoreCategory(categoryId, ctx);
      if (!best || result.score > best.matchScore) {
        best = {
          countryIso: country.iso,
          countryName: country.name.en,
          flag: country.flag,
          bestCategoryId: categoryId,
          bestCategoryName: categoryName,
          matchScore: clampScore(result.score),
          settlementYears: settlementYearsFor(country.iso, categoryId),
          hasPointsSystem: POINTS_SYSTEM_COUNTRIES.has(country.iso),
        };
      }
    }
    if (best) rows.push(best);
  }
  rows.sort((a, b) => b.matchScore - a.matchScore || a.countryName.localeCompare(b.countryName));
  return rows;
}
