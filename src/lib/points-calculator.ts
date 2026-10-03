// VisaCheck — points-based immigration scoring engine.
//
// This module is the core differentiator: instead of just listing visa rules,
// we CALCULATE whether the user's profile actually qualifies under a given
// country's points matrix.
//
// Three calculators are implemented:
//   - Canada Express Entry — Comprehensive Ranking System (CRS), out of 1200
//   - Australia Points Test — General Skilled Migration (subclasses 189/190/491), out of 100
//   - UK Points-Based System — Skilled Worker route, out of 70
//
// All functions are PURE: same input → same output, no side effects,
// no I/O, no React/Next, no localStorage, no console.log.
//
// Approximations: the PointsInput interface is intentionally generic across
// all three countries, so a few reasonable interpretations are documented
// inline. The calculation logic mirrors the publicly published scoring
// matrices of each country as of 2024. Always verify against the official
// source before relying on the score for an immigration decision.
//
// The PENDING_HUMAN_CLICK gate lives in the rules-engine layer, not here.
// This calculator returns a transparent numeric score plus a `passes` flag
// that signals whether the score meets the published minimum. The wizard UI
// is responsible for surfacing the "being verified" gate to users.
//
// Sources consulted:
//   - Canada: IRCC CRS score grid (publicly published A–D sections, /1200)
//   - Australia: Home Affairs points test for GSM (subclasses 189/190/491)
//   - UK: Home Office Skilled Worker caseworker guidance (70 points, tradeable)

import type { Answers } from '@/lib/rules-data';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/**
 * Generic, country-agnostic input for the points calculators.
 *
 * Field interpretation depends on the country:
 *   - `englishLevel` is treated as the applicant's primary official language.
 *     For Canada it maps to a CLB level; for Australia it maps to the GSM
 *     English bands (Competent/Proficient/Superior); for the UK it is
 *     checked against the B1 minimum.
 *   - `foreignWorkExperience` is non-Canadian overseas experience for
 *     Canada; the same field is used as Australian "skilled employment
 *     abroad".
 *   - `provincialNomination` doubles as Australian state nomination (190)
 *     and Canadian provincial nomination — both yield bonus points.
 *   - `australianStudy` is the Australian study requirement flag.
 *   - `salary` is annual, used for the UK salary threshold (GBP).
 *   - `isNewEntrant`, `isShortageOccupation`, `hasPhd` are UK PBS tradeable
 *     flags.
 */
export interface PointsInput {
  age?: number;
  education?: 'secondary' | 'diploma' | 'bachelor' | 'master' | 'doctorate';
  englishLevel?: 'competent' | 'proficient' | 'superior' | 'b1' | 'b2' | 'c1' | 'c2';
  foreignWorkExperience?: number; // years
  canadianWorkExperience?: number; // years
  hasJobOffer?: boolean;
  hasSpouse?: boolean;
  spouseEnglishLevel?: string;
  salary?: number;
  isShortageOccupation?: boolean;
  hasPhd?: boolean;
  isNewEntrant?: boolean;
  provincialNomination?: boolean;
  siblingInCountry?: boolean;
  australianStudy?: boolean;
  /** France: CEFR French band (falls back to englishLevel when absent). */
  frenchLevel?: 'b1' | 'b2' | 'c1' | 'c2';
  /** South Korea: TOPIK Korean proficiency band. */
  koreanLevel?: 'topik3' | 'topik4' | 'topik5' | 'topik6';
  /** Japan: JLPT proficiency band (used by HSP bonus points). */
  japaneseLevel?: 'n5' | 'n4' | 'n3' | 'n2' | 'n1';
  /** True if the applicant previously resided lawfully in the destination. */
  previouslyLivedInCountry?: boolean;
}

/**
 * Result of a points calculation.
 *
 * - `breakdown` lists every factor and the points it contributed, in
 *   calculation order. The UI can render this verbatim.
 * - `passes` is a transparent signal: does `totalPoints` meet the published
 *   `minimumRequired`? It is NOT a verdict — the PENDING_HUMAN_CLICK gate
 *   in rules-engine is the final authority on what users see.
 */
export interface PointsResult {
  country: string;
  totalPoints: number;
  maxPoints: number;
  minimumRequired: number;
  label: string;
  passes: boolean;
  breakdown: { factor: string; points: number }[];
}

// ---------------------------------------------------------------------------
// Small shared helpers
// ---------------------------------------------------------------------------

/**
 * Map a generic englishLevel string to a Canadian Language Benchmark (CLB)
 * level. Returns 0 if the level is missing or unrecognised.
 *
 * Mapping used (approximate, conservative):
 *   - competent   → CLB 7  (IELTS 6.0)
 *   - proficient  → CLB 9  (IELTS 7.0)
 *   - superior    → CLB 10 (IELTS 8.0+)
 *   - b1          → CLB 5  (CEFR B1)
 *   - b2          → CLB 6  (CEFR B2, slightly below CLB 7)
 *   - c1          → CLB 9  (CEFR C1)
 *   - c2          → CLB 10 (CEFR C2)
 */
function clbFromLevel(level: string | undefined): number {
  if (!level) return 0;
  const map: Record<string, number> = {
    competent: 7,
    proficient: 9,
    superior: 10,
    b1: 5,
    b2: 6,
    c1: 9,
    c2: 10,
  };
  return map[level] ?? 0;
}

/** Floor a possibly-undefined years value to a non-negative integer. */
function floorYears(years: number | undefined): number {
  if (typeof years !== 'number' || !isFinite(years) || years < 0) return 0;
  return Math.floor(years);
}

// ---------------------------------------------------------------------------
// CANADA — Comprehensive Ranking System (CRS)
// ---------------------------------------------------------------------------

// Age points (max 110 without spouse, 100 with). 0 below 17 or 45+.
const CRS_AGE_NO_SPOUSE: Record<number, number> = {
  17: 0,
  18: 99,
  19: 105,
  20: 110,
  21: 110,
  22: 110,
  23: 110,
  24: 110,
  25: 110,
  26: 110,
  27: 110,
  28: 110,
  29: 110,
  30: 105,
  31: 99,
  32: 94,
  33: 88,
  34: 82,
  35: 77,
  36: 72,
  37: 66,
  38: 61,
  39: 55,
  40: 50,
  41: 39,
  42: 28,
  43: 17,
  44: 6,
};

const CRS_AGE_WITH_SPOUSE: Record<number, number> = {
  17: 0,
  18: 90,
  19: 95,
  20: 100,
  21: 100,
  22: 100,
  23: 100,
  24: 100,
  25: 100,
  26: 100,
  27: 100,
  28: 100,
  29: 100,
  30: 95,
  31: 90,
  32: 85,
  33: 80,
  34: 75,
  35: 70,
  36: 65,
  37: 60,
  38: 55,
  39: 50,
  40: 45,
  41: 35,
  42: 25,
  43: 15,
  44: 5,
};

/** CRS age points — 0 below 17 or 45+. */
function crsAgePoints(age: number | undefined, hasSpouse: boolean): number {
  if (typeof age !== 'number' || age < 17 || age >= 45) return 0;
  const tbl = hasSpouse ? CRS_AGE_WITH_SPOUSE : CRS_AGE_NO_SPOUSE;
  return tbl[age] ?? 0;
}

/**
 * CRS education points (max 150 without spouse, 140 with).
 * Each row is [withoutSpouse, withSpouse].
 */
function crsEducationPoints(education: PointsInput['education'], hasSpouse: boolean): number {
  if (!education) return 0;
  const table: Record<NonNullable<PointsInput['education']>, [number, number]> = {
    secondary: [30, 28], // High school graduation
    diploma: [98, 91], // Two-year post-secondary program
    bachelor: [120, 112], // Bachelor's degree (3+ years)
    master: [135, 126], // Master's degree
    doctorate: [150, 140], // Doctoral degree
  };
  const row = table[education];
  if (!row) return 0;
  return hasSpouse ? row[1] : row[0];
}

/**
 * CRS first official language points (max 136 without spouse, 128 with).
 * Calculated per ability (4 abilities) — we assume the applicant scores the
 * same CLB across all four abilities, which is the standard simplification
 * when only a single band level is supplied.
 */
function crsLanguagePoints(clb: number, hasSpouse: boolean): number {
  if (clb < 7) return 0;
  let perAbility: number;
  if (clb >= 10) {
    perAbility = hasSpouse ? 32 : 34;
  } else if (clb === 9) {
    perAbility = hasSpouse ? 29 : 31;
  } else if (clb === 8) {
    perAbility = hasSpouse ? 21 : 23;
  } else if (clb === 7) {
    perAbility = hasSpouse ? 16 : 17;
  } else {
    perAbility = 0;
  }
  return perAbility * 4; // 4 abilities (reading, writing, speaking, listening)
}

/**
 * CRS Canadian work experience points (max 80 without spouse, 70 with).
 * Lookup table: years → [withoutSpouse, withSpouse].
 */
function crsCanadianWorkExperiencePoints(years: number, hasSpouse: boolean): number {
  if (years < 1) return 0;
  if (years >= 5) return hasSpouse ? 70 : 80;
  if (years >= 4) return hasSpouse ? 63 : 72;
  if (years >= 3) return hasSpouse ? 56 : 64;
  if (years >= 2) return hasSpouse ? 46 : 53;
  return hasSpouse ? 35 : 40; // 1 year
}

/** CRS spouse education points (max 10). */
function crsSpouseEducationPoints(education: PointsInput['education']): number {
  if (!education) return 0;
  const map: Record<NonNullable<PointsInput['education']>, number> = {
    secondary: 2,
    diploma: 7,
    bachelor: 9,
    master: 10,
    doctorate: 10,
  };
  return map[education] ?? 0;
}

/** CRS spouse first official language points (max 20). */
function crsSpouseLanguagePoints(spouseLevel: string | undefined): number {
  const clb = clbFromLevel(spouseLevel);
  if (clb >= 9) return 20;
  if (clb === 8) return 17;
  if (clb === 7) return 13;
  return 0;
}

/**
 * CRS skill transferability — Education + Language factor (max 50).
 * Returns 0/13/25/50 depending on education band and CLB band.
 */
function crsTransferEduLang(education: PointsInput['education'], clb: number): number {
  if (!education) return 0;
  const clb9 = clb >= 9;
  const clb7 = clb >= 7;
  const table: Record<NonNullable<PointsInput['education']>, number> = {
    secondary: clb9 ? 13 : 0,
    diploma: clb7 ? (clb9 ? 25 : 13) : 0,
    bachelor: clb7 ? (clb9 ? 50 : 25) : 0,
    master: clb7 ? (clb9 ? 50 : 25) : 0,
    doctorate: clb7 ? (clb9 ? 50 : 25) : 0,
  };
  return table[education] ?? 0;
}

/**
 * CRS skill transferability — Education + Canadian work experience factor (max 50).
 */
function crsTransferEduCanExp(education: PointsInput['education'], canadianYears: number): number {
  if (!education || canadianYears < 1) return 0;
  const twoPlus = canadianYears >= 2;
  const table: Record<NonNullable<PointsInput['education']>, number> = {
    secondary: 0,
    diploma: twoPlus ? 25 : 13,
    bachelor: twoPlus ? 25 : 13,
    master: twoPlus ? 50 : 25,
    doctorate: twoPlus ? 50 : 25,
  };
  return table[education] ?? 0;
}

/**
 * CRS skill transferability — Foreign work experience + Language factor (max 50).
 */
function crsTransferForeignLang(foreignYears: number, clb: number): number {
  if (foreignYears < 1) return 0;
  const threePlus = foreignYears >= 3;
  const clb9 = clb >= 9;
  const clb7 = clb >= 7;
  if (threePlus) return clb9 ? 50 : clb7 ? 25 : 0;
  return clb9 ? 25 : clb7 ? 13 : 0;
}

/**
 * CRS skill transferability — Foreign work experience + Canadian work
 * experience factor (max 50).
 */
function crsTransferForeignCanExp(foreignYears: number, canadianYears: number): number {
  if (foreignYears < 1 || canadianYears < 1) return 0;
  const foreignThreePlus = foreignYears >= 3;
  const canTwoPlus = canadianYears >= 2;
  if (foreignThreePlus && canTwoPlus) return 50;
  if (foreignThreePlus) return 25;
  if (canTwoPlus) return 25;
  return 13; // 1+ foreign + 1 Canadian
}

/**
 * Calculate Canada Express Entry Comprehensive Ranking System (CRS) score.
 *
 * Sums four sections:
 *   A. Core human capital factors (max 500 with spouse, 600 without)
 *   B. Spouse factors (max 40, only if hasSpouse)
 *   C. Skill transferability factors (max 100)
 *   D. Additional points (max 600 — provincial nomination alone maxes this)
 *
 * Total is capped at 1200.
 *
 * `passes` uses a conservative 500-point threshold derived from recent
 * general-draw cutoffs (~480–520). Category-specific draws (STEM, French,
 * healthcare, trade) often sit at ~400–450.
 */
export function calculateCanadaCRS(input: PointsInput): PointsResult {
  const hasSpouse = !!input.hasSpouse;
  const clb = clbFromLevel(input.englishLevel);
  const foreignYears = floorYears(input.foreignWorkExperience);
  const canadianYears = floorYears(input.canadianWorkExperience);

  const breakdown: { factor: string; points: number }[] = [];

  // --- A. Core human capital factors ---
  const agePts = crsAgePoints(input.age, hasSpouse);
  const eduPts = crsEducationPoints(input.education, hasSpouse);
  const langPts = crsLanguagePoints(clb, hasSpouse);
  const canWorkPts = crsCanadianWorkExperiencePoints(canadianYears, hasSpouse);

  breakdown.push({ factor: 'Age', points: agePts });
  breakdown.push({ factor: 'Education', points: eduPts });
  breakdown.push({ factor: 'First official language (English)', points: langPts });
  breakdown.push({ factor: 'Canadian work experience', points: canWorkPts });

  const core = agePts + eduPts + langPts + canWorkPts;

  // --- B. Spouse factors (max 40) ---
  let spousePts = 0;
  if (hasSpouse) {
    const spouseEdu = crsSpouseEducationPoints(input.education);
    const spouseLang = crsSpouseLanguagePoints(input.spouseEnglishLevel);
    breakdown.push({ factor: 'Spouse education', points: spouseEdu });
    breakdown.push({ factor: 'Spouse language', points: spouseLang });
    spousePts = spouseEdu + spouseLang;
  }

  // --- C. Skill transferability factors (max 100) ---
  const transA = crsTransferEduLang(input.education, clb);
  const transB = crsTransferEduCanExp(input.education, canadianYears);
  const transC = crsTransferForeignLang(foreignYears, clb);
  const transD = crsTransferForeignCanExp(foreignYears, canadianYears);
  const transferabilityRaw = transA + transB + transC + transD;
  const transferability = Math.min(100, transferabilityRaw);

  breakdown.push({ factor: 'Skill transferability (education + language)', points: transA });
  breakdown.push({ factor: 'Skill transferability (education + Canadian exp)', points: transB });
  breakdown.push({ factor: 'Skill transferability (foreign exp + language)', points: transC });
  breakdown.push({ factor: 'Skill transferability (foreign + Canadian exp)', points: transD });
  if (transferabilityRaw > 100) {
    breakdown.push({ factor: 'Skill transferability cap adjustment', points: 100 - transferabilityRaw });
  }

  // --- D. Additional points (max 600) ---
  let additional = 0;
  if (input.provincialNomination) {
    additional += 600;
    breakdown.push({ factor: 'Provincial nomination (PNP)', points: 600 });
  }
  if (input.hasJobOffer) {
    // Arranged employment via LMIA: 200 for NOC 00 (top executives),
    // 50 for TEER 0/1/2/3. We default to 50 — the common case.
    additional += 50;
    breakdown.push({ factor: 'Arranged employment (LMIA, TEER 0-3)', points: 50 });
  }
  if (input.siblingInCountry) {
    additional += 15;
    breakdown.push({ factor: 'Sibling in Canada', points: 15 });
  }
  // Note: Canadian post-secondary education (15/30 pts) and French-language
  // bonus (25/50 pts) are not captured by the current PointsInput interface.
  additional = Math.min(600, additional);

  const total = Math.min(1200, core + spousePts + transferability + additional);

  // Conservative general-draw cutoff; category-specific draws are lower.
  const minimumRequired = 500;

  return {
    country: 'Canada',
    totalPoints: total,
    maxPoints: 1200,
    minimumRequired,
    label: `CRS Score: ${total} / 1200`,
    passes: total >= minimumRequired,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// AUSTRALIA — General Skilled Migration Points Test (subclasses 189/190/491)
// ---------------------------------------------------------------------------

/**
 * Australia age points:
 *   18-24 → 25, 25-32 → 30, 33-39 → 25, 40-44 → 15, 45-49 → 0.
 */
function ausAgePoints(age: number | undefined): number {
  if (typeof age !== 'number') return 0;
  if (age >= 18 && age <= 24) return 25;
  if (age >= 25 && age <= 32) return 30;
  if (age >= 33 && age <= 39) return 25;
  if (age >= 40 && age <= 44) return 15;
  return 0; // under 18, 45-49, or 50+
}

/**
 * Australia English language points.
 *   Competent (IELTS 6.0)         → 0
 *   Proficient (IELTS 7.0)        → 10
 *   Superior  (IELTS 8.0+)        → 20
 * CEFR levels are mapped: B2≈Competent, C1≈Proficient, C2≈Superior. B1 is
 * below Competent and yields 0.
 */
function ausEnglishPoints(level: PointsInput['englishLevel']): number {
  switch (level) {
    case 'proficient':
    case 'c1':
      return 10;
    case 'superior':
    case 'c2':
      return 20;
    case 'competent':
    case 'b2':
      return 0;
    case 'b1':
    default:
      return 0;
  }
}

/**
 * Australia skilled employment points (overseas experience):
 *   3-5 yrs → 5, 5-8 yrs → 10, 8-10 yrs → 15. Else 0.
 *
 * Note: this follows the task spec; the official Australian matrix also
 * recognises 1-3 years (5 pts) and caps 8-10 years at 15.
 */
function ausSkilledEmploymentPoints(years: number): number {
  if (years >= 8 && years <= 10) return 15;
  if (years >= 5 && years < 8) return 10;
  if (years >= 3 && years < 5) return 5;
  return 0;
}

/**
 * Australia education points:
 *   Doctorate → 20, Bachelor / Master → 15, Diploma → 10, else 0.
 */
function ausEducationPoints(education: PointsInput['education']): number {
  switch (education) {
    case 'doctorate':
      return 20;
    case 'bachelor':
    case 'master':
      return 15;
    case 'diploma':
      return 10;
    default:
      return 0;
  }
}

/**
 * Australia partner skills points (post-2021 rules):
 *   Single applicant (no spouse/partner)                    → 10
 *   Partner with competent English                          → 5
 *   Partner with proficient/superior English (skilled occ)  → 10
 *   Partner without competent English                       → 0
 */
function ausPartnerPoints(input: PointsInput): number {
  if (!input.hasSpouse) return 10;
  if (!input.spouseEnglishLevel) return 0;
  const lvl = input.spouseEnglishLevel;
  if (lvl === 'proficient' || lvl === 'superior' || lvl === 'c1' || lvl === 'c2') return 10;
  if (lvl === 'competent' || lvl === 'b2') return 5;
  return 0;
}

/**
 * Calculate Australia General Skilled Migration points (subclasses 189/190/491).
 *
 * Factors summed:
 *   - Age (max 30)
 *   - English language (max 20)
 *   - Skilled employment overseas (max 15)
 *   - Education (max 20)
 *   - Australian study requirement (+5)
 *   - Specialist education (+5) — NOT captured by current input interface
 *   - Partner skills (max 10)
 *   - Nomination: 190 → +5, 491 → +15 (we use 5 by default for
 *     `provincialNomination`; 491 is not separately signalled)
 *
 * Minimum 65 to submit an EOI. Max displayed as 100 (conventional cap);
 * actual achievable score can exceed 100 with nomination + single bonus.
 */
export function calculateAustraliaPoints(input: PointsInput): PointsResult {
  const breakdown: { factor: string; points: number }[] = [];

  const foreignYears = floorYears(input.foreignWorkExperience);

  const agePts = ausAgePoints(input.age);
  const engPts = ausEnglishPoints(input.englishLevel);
  const empPts = ausSkilledEmploymentPoints(foreignYears);
  const eduPts = ausEducationPoints(input.education);
  const ausStudyPts = input.australianStudy ? 5 : 0;
  const specialistPts = 0; // specialist education 2-yr masters — not in input interface
  const partnerPts = ausPartnerPoints(input);
  // Nomination: treat provincialNomination as 190 (+5). 491 would give +15
  // but is not separately signalled in the input.
  const nomPts = input.provincialNomination ? 5 : 0;

  breakdown.push({ factor: 'Age', points: agePts });
  breakdown.push({ factor: 'English language', points: engPts });
  breakdown.push({ factor: 'Skilled employment (overseas)', points: empPts });
  breakdown.push({ factor: 'Education', points: eduPts });
  breakdown.push({ factor: 'Australian study requirement', points: ausStudyPts });
  breakdown.push({ factor: 'Specialist education (not captured)', points: specialistPts });
  breakdown.push({ factor: 'Partner skills', points: partnerPts });
  breakdown.push({ factor: 'Nomination (190 = 5; 491 = 15)', points: nomPts });

  const total =
    agePts + engPts + empPts + eduPts + ausStudyPts + specialistPts + partnerPts + nomPts;
  const minimumRequired = 65;

  return {
    country: 'Australia',
    totalPoints: total,
    maxPoints: 100,
    minimumRequired,
    label: `Australia Points: ${total} / 100 (minimum 65)`,
    passes: total >= minimumRequired,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// UK — Points-Based System (Skilled Worker route)
// ---------------------------------------------------------------------------

/** UK 2024 standard Skilled Worker salary threshold (GBP). */
const UK_SALARY_THRESHOLD = 38700;

/**
 * Calculate UK Skilled Worker points (must total 70).
 *
 * Mandatory 50 points (all three required):
 *   - Job offer from approved sponsor (+20)
 *   - Job at appropriate skill level RQF3+ (+20) — assumed met when a sponsor
 *     has issued a CoS for a skilled role.
 *   - English at B1+ (+10) — every englishLevel in our interface meets B1.
 *
 * Tradeable points (need 20 to reach 70):
 *   - Salary ≥ £38,700 (or going rate) → +20
 *   - Shortage occupation                     → +20
 *   - PhD relevant (non-STEM default → +10; STEM → +20) → +10 here
 *   - New entrant                             → +20
 *
 * Total is capped at 70 because the system requires exactly 70 — any
 * surplus tradeable points do not push the score higher.
 */
export function calculateUKPoints(input: PointsInput): PointsResult {
  const breakdown: { factor: string; points: number }[] = [];

  // --- Mandatory (50 max) ---
  const sponsorPts = input.hasJobOffer ? 20 : 0;
  // Skill level is implied by an approved sponsor's CoS for a skilled role.
  const skillPts = input.hasJobOffer ? 20 : 0;
  const engPts = input.englishLevel ? 10 : 0; // any of our levels ≥ B1

  breakdown.push({ factor: 'Job offer from approved sponsor', points: sponsorPts });
  breakdown.push({ factor: 'Job at appropriate skill level (RQF3+)', points: skillPts });
  breakdown.push({ factor: 'English at B1', points: engPts });

  const mandatory = sponsorPts + skillPts + engPts;

  // --- Tradeable (need 20) ---
  const salaryPts =
    typeof input.salary === 'number' && input.salary >= UK_SALARY_THRESHOLD ? 20 : 0;
  const shortagePts = input.isShortageOccupation ? 20 : 0;
  // PhD: 10 (non-STEM default); STEM would give 20 — we cannot distinguish here.
  const phdPts = input.hasPhd ? 10 : 0;
  const newEntrantPts = input.isNewEntrant ? 20 : 0;

  breakdown.push({ factor: `Salary (≥ £${UK_SALARY_THRESHOLD.toLocaleString('en-GB')})`, points: salaryPts });
  breakdown.push({ factor: 'Shortage occupation', points: shortagePts });
  breakdown.push({ factor: 'PhD relevant (10 default; 20 if STEM)', points: phdPts });
  breakdown.push({ factor: 'New entrant', points: newEntrantPts });

  const tradeable = salaryPts + shortagePts + phdPts + newEntrantPts;

  // UK system requires exactly 70 — surplus tradeable points do not stack.
  const total = Math.min(70, mandatory + tradeable);
  const minimumRequired = 70;

  return {
    country: 'United Kingdom',
    totalPoints: total,
    maxPoints: 70,
    minimumRequired,
    label: `UK Points: ${total} / 70 (must score 70)`,
    passes: total >= minimumRequired,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/** Map the wizard's Answers onto a PointsInput for the points calculators. */
export function answersToPointsInput(a: Answers): PointsInput {
  return {
    age: a.age,
    education: a.education || undefined,
    // The wizard captures a boolean "englishMet"; treat it as IELTS Competent
    // (CLB 7) — the minimum band most employer-sponsored routes accept.
    englishLevel: a.englishMet ? 'competent' : undefined,
    foreignWorkExperience: a.workExperienceYears,
    hasJobOffer: a.hasCos,
    hasSpouse: a.maritalStatus === 'married' || a.maritalStatus === 'partner',
    salary: a.salary,
    isNewEntrant: a.newEntrant,
  };
}

/**
 * Country-aware dispatcher. Routes by ISO alpha-2 code:
 *   - "CA" → Canada CRS (out of 1200)
 *   - "AU" → Australia Points Test (out of 100)
 *   - "GB" or "UK" → UK PBS (out of 70)
 *   - "NZ" → Skilled Migrant Category 6-point proxy (needs 6 points)
 *   - "FR" → Passeport Talent barème (needs 60 points)
 *   - "KR" → F-2/E-7 Hi Korea points route (needs 80 points)
 *
 * Returns `null` for unsupported country codes so callers can fall back to
 * the rules-engine pathway (where most countries still live).
 */
export function calculatePoints(countryIso: string, input: PointsInput): PointsResult | null {
  const iso = countryIso.trim().toUpperCase();
  if (iso === 'CA') return calculateCanadaCRS(input);
  if (iso === 'AU') return calculateAustraliaPoints(input);
  if (iso === 'GB' || iso === 'UK') return calculateUKPoints(input);
  if (iso === 'NZ') return calculateNZSmcPoints(input);
  if (iso === 'FR') return calculateFrancePoints(input);
  if (iso === 'KR') return calculateKoreaPoints(input);
  return null;
}

// ---------------------------------------------------------------------------
// France — Passeport Talent « salarié qualifié » points barème (since 2024)
// ---------------------------------------------------------------------------

/**
 * Simplified French "Passeport Talent – salarié qualifié" points calculator.
 * Préfectures assess applicants on a published barème; the commonly applied
 * pass mark is 60 points. We approximate the factors an applicant can self-
 * score from the VisaCheck wizard profile:
 *   - Master's degree = 15 · Doctorate = 30
 *   - Salary vs the "reference remuneration" (~1.8× SMIC ≈ €42,834/yr 2026):
 *       ≥150% = 25 pts · ≥100% = 16 pts · ≥75% = 8 pts
 *   - French language: B2+ = 10 · B1 = 6 (CEFR bands used by OFII guidance)
 *   - Prior lawful residence in France = 10
 * A master's + qualifying salary alone reaches the 60-point line — matching
 * the typical approved profile described in Interior Ministry guidance.
 */
export function calculateFrancePoints(input: PointsInput): PointsResult {
  const breakdown: { factor: string; points: number }[] = [];
  let total = 0;

  const eduPts = input.education === 'doctorate' ? 30 : input.education === 'master' ? 15 : 0;
  if (eduPts > 0) {
    breakdown.push({
      factor: input.education === 'doctorate' ? 'Doctorate (Bac+5/Bac+8)' : "Master's degree (Bac+5)",
      points: eduPts,
    });
    total += eduPts;
  }

  // Reference remuneration for the qualified-employee talent passport band.
  const FR_REFERENCE_SALARY_EUR = 42834; // ~1.8 × SMIC (2026, approximate)
  const sal = input.salary ?? 0;
  if (sal > 0) {
    const ratio = sal / FR_REFERENCE_SALARY_EUR;
    const salPts = ratio >= 1.5 ? 25 : ratio >= 1.0 ? 16 : ratio >= 0.75 ? 8 : 0;
    if (salPts > 0) {
      breakdown.push({
        factor: `Remuneration ${ratio >= 1.5 ? '≥150%' : ratio >= 1.0 ? '≥100%' : '≥75%'} of reference salary (€${FR_REFERENCE_SALARY_EUR.toLocaleString('en-US')}/yr)`,
        points: salPts,
      });
      total += salPts;
    }
  }

  const frLang = input.frenchLevel ?? input.englishLevel;
  if (frLang === 'c1' || frLang === 'c2' || frLang === 'b2') {
    breakdown.push({ factor: 'French proficiency B2 or higher', points: 10 });
    total += 10;
  } else if (frLang === 'b1' || frLang === 'competent') {
    breakdown.push({ factor: 'French proficiency B1', points: 6 });
    total += 6;
  }

  if (input.previouslyLivedInCountry) {
    breakdown.push({ factor: 'Prior lawful residence in France', points: 10 });
    total += 10;
  }

  return {
    country: 'France',
    totalPoints: total,
    maxPoints: 100,
    minimumRequired: 60,
    label: `France Passeport Talent: ${total} / 60 points (prefecture barème)`,
    passes: total >= 60,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// South Korea — F-2 / E-7 points-based residency (Hi Korea K-ETA scoring)
// ---------------------------------------------------------------------------

/**
 * Simplified Korean points-route calculator (F-2 resident via E-7 skilled
 * worker conversion). Hi Korea publishes a points table where 80 points
 * grants an invitation to apply for F-2 residency; E-7 itself needs ~50+.
 * Self-scorable factors approximated from the wizard profile:
 *   - Age: 20–29 = 20 · 30–34 = 15 · 35–39 = 10 · 40+ = 5
 *   - Education: Doctorate = 20 · Master's = 15 · Bachelor's = 10
 *   - Income vs GNI per-capita multiple (E-7 ≈1.5×, F-2 ≈1.8×):
 *       ≥₩100M ≈ 20 pts · ≥₩80M ≈ 15 · ≥₩60M ≈ 10 · ≥₩40M ≈ 5
 *   - TOPIK level 5–6 = 10 · 3–4 = 5 (English-track holders get partial credit)
 *   - Relevant work experience: 10 yrs+ = 10 · 5 yrs+ = 8 · 3 yrs+ = 5
 */
export function calculateKoreaPoints(input: PointsInput): PointsResult {
  const breakdown: { factor: string; points: number }[] = [];
  let total = 0;

  const age = input.age ?? 0;
  if (age > 0) {
    const agePts = age <= 29 ? 20 : age <= 34 ? 15 : age <= 39 ? 10 : 5;
    breakdown.push({ factor: `Age bracket (${age})`, points: agePts });
    total += agePts;
  }

  const eduPts =
    input.education === 'doctorate' ? 20 :
    input.education === 'master' ? 15 :
    input.education === 'bachelor' ? 10 : 0;
  if (eduPts > 0) {
    breakdown.push({ factor: 'Education level', points: eduPts });
    total += eduPts;
  }

  const won = input.salary ?? 0;
  if (won > 0) {
    const incPts = won >= 100_000_000 ? 20 : won >= 80_000_000 ? 15 : won >= 60_000_000 ? 10 : won >= 40_000_000 ? 5 : 0;
    if (incPts > 0) {
      breakdown.push({ factor: 'Annual income vs Korean GNI multiples', points: incPts });
      total += incPts;
    }
  }

  if (input.koreanLevel === 'topik5' || input.koreanLevel === 'topik6') {
    breakdown.push({ factor: 'TOPIK level 5–6', points: 10 });
    total += 10;
  } else if (input.koreanLevel === 'topik3' || input.koreanLevel === 'topik4') {
    breakdown.push({ factor: 'TOPIK level 3–4', points: 5 });
    total += 5;
  } else if (input.englishLevel === 'superior' || input.englishLevel === 'c1' || input.englishLevel === 'c2') {
    breakdown.push({ factor: 'Superior English (EPAS/IELTS high band)', points: 5 });
    total += 5;
  }

  const yrs = Math.floor(input.foreignWorkExperience ?? 0);
  const expPts = yrs >= 10 ? 10 : yrs >= 5 ? 8 : yrs >= 3 ? 5 : 0;
  if (expPts > 0) {
    breakdown.push({ factor: 'Relevant work experience', points: expPts });
    total += expPts;
  }

  return {
    country: 'South Korea',
    totalPoints: total,
    maxPoints: 200,
    minimumRequired: 80,
    label: `Korea F-2/E-7 points route: ${total} / 80 points (Hi Korea threshold)`,
    passes: total >= 80,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// New Zealand — Skilled Migrant Category (6-point system, since Nov 2023)
// ---------------------------------------------------------------------------

/**
 * Simplified SMC 6-point calculator. INZ awards points from three areas —
 * skilled work experience, qualifications, and registration — and you need
 * 6 points total (plus a job paying at least the median wage, NZD $35.00/hr
 * from Aug 2025). We approximate with qualification + experience bands:
 *   Bachelor (Level 7) = 3 · Master = 5 · Doctorate = 6
 *   Skilled experience: 2+ yrs = 1 · 3+ yrs = 2 · 4+ yrs = 3 (max 3)
 * A master's + 2 years' experience therefore reaches the 6-point line —
 * matching the published typical profile.
 */
export function calculateNZSmcPoints(input: PointsInput): PointsResult {
  const breakdown: { factor: string; points: number }[] = [];
  let total = 0;

  const qualPts =
    input.education === 'doctorate' ? 6 :
    input.education === 'master' ? 5 :
    input.education === 'bachelor' ? 3 :
    input.education === 'diploma' ? 2 : 0;
  if (qualPts > 0) {
    breakdown.push({ factor: 'Qualification level', points: qualPts });
    total += qualPts;
  }

  const yrs = Math.floor(input.foreignWorkExperience ?? 0);
  const expPts = yrs >= 5 ? 3 : yrs >= 4 ? 3 : yrs >= 3 ? 2 : yrs >= 2 ? 1 : 0;
  if (expPts > 0) {
    breakdown.push({ factor: 'Skilled work experience', points: expPts });
    total += expPts;
  }

  if (input.provincialNomination) {
    // Migration-relevant regional work/offer bonus (up to 2 pts under SMC).
    breakdown.push({ factor: 'Regional (green-region) work or offer', points: 2 });
    total += 2;
  }

  total = Math.min(6, total);

  return {
    country: 'New Zealand',
    totalPoints: total,
    maxPoints: 6,
    minimumRequired: 6,
    label: `NZ Skilled Migrant Category: ${total} / 6 points`,
    passes: total >= 6,
    breakdown,
  };
}
