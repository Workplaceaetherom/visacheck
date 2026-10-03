// VisaCheck category-aware wizard step configuration.
//
// REDESIGNED: The wizard now asks general personal questions FIRST
// (age, education, marital status, employment status, experience),
// THEN country-specific requirements.
//
// Step IDs:
//   0 = destination (country + category)
//   1 = personal_profile (age, education, marital status, employment, experience) — ALL categories
//   2 = nationality (nationality + current location) — ALL categories
//   3 = country_specific_job (job title + occupation code + salary) — skilled_worker, business
//   4 = country_specific_education (admission + study funds) — student
//   5 = sponsorship (CoS + sponsor licensed + new entrant) — skilled_worker, student, family
//   6 = language (English requirement) — skilled_worker, student
//   7 = funds (maintenance + health surcharge) — all
//   8 = character (criminal cert + passport) — all
//   9 = relationship (proof of relationship + sponsor income) — family
//   10 = visit (purpose + return ticket + insurance) — visitor
//   11 = investment (business plan + investment amount) — business, investor

import {
  Globe,
  User,
  Briefcase,
  Building2,
  Languages,
  Wallet,
  ShieldCheck,
  GraduationCap,
  Users,
  Plane,
  Landmark,
} from 'lucide-react';

export interface StepDef {
  id: number;
  icon: typeof Globe;
  titleKey: string;
  descKey: string;
}

// All possible steps
const ALL_STEPS: Record<number, StepDef> = {
  0: { id: 0, icon: Globe, titleKey: 'step0_title', descKey: 'step0_desc' },
  1: { id: 1, icon: User, titleKey: 'step_personal_title', descKey: 'step_personal_desc' },
  2: { id: 2, icon: Globe, titleKey: 'step1_title', descKey: 'step1_desc' },
  3: { id: 3, icon: Briefcase, titleKey: 'step2_title', descKey: 'step2_desc' },
  4: { id: 4, icon: GraduationCap, titleKey: 'step7_title', descKey: 'step7_desc' },
  5: { id: 5, icon: Building2, titleKey: 'step3_title', descKey: 'step3_desc' },
  6: { id: 6, icon: Languages, titleKey: 'step4_title', descKey: 'step4_desc' },
  7: { id: 7, icon: Wallet, titleKey: 'step5_title', descKey: 'step5_desc' },
  8: { id: 8, icon: ShieldCheck, titleKey: 'step6_title', descKey: 'step6_desc' },
  9: { id: 9, icon: Users, titleKey: 'step8_title', descKey: 'step8_desc' },
  10: { id: 10, icon: Plane, titleKey: 'step9_title', descKey: 'step9_desc' },
  11: { id: 11, icon: Landmark, titleKey: 'step10_title', descKey: 'step10_desc' },
};

// Which steps apply to each visa category.
// NEW FLOW: destination → personal_profile → nationality → category-specific → funds → character
const CATEGORY_STEPS: Record<string, number[]> = {
  skilled_worker: [0, 1, 2, 3, 5, 6, 7, 8],
  student:        [0, 1, 2, 4, 5, 6, 7, 8],
  visitor:        [0, 1, 2, 10, 7, 8],
  family:         [0, 1, 2, 9, 7, 8],
  business:       [0, 1, 2, 3, 11, 7, 8],
  investor:       [0, 1, 2, 11, 7, 8],
};

/**
 * Returns the ordered list of StepDef objects for the given visa category.
 */
export function stepsForCategory(categoryId: string | null): StepDef[] {
  if (!categoryId) return CATEGORY_STEPS.skilled_worker.map((id) => ALL_STEPS[id]);
  const ids = CATEGORY_STEPS[categoryId] ?? CATEGORY_STEPS.skilled_worker;
  return ids.map((id) => ALL_STEPS[id]);
}

/**
 * Validates whether the answers satisfy the requirements for the given step.
 */
export function validateStep(stepId: number, a: import('@/lib/rules-data').Answers): boolean {
  switch (stepId) {
    case 0: return true;
    case 1: return true; // personal profile — age/education/marital are optional
    case 2: return a.nationality.trim().length > 0;
    case 3: return a.jobTitle.trim().length > 0 || a.salary > 0;
    case 4: return true; // education step
    case 5: return true; // sponsorship
    case 6: return true; // language
    case 7: return true; // funds
    case 8: return true; // character
    case 9: return true; // relationship
    case 10: return true; // visit
    case 11: return true; // investment
    default: return true;
  }
}
