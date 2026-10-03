// VisaCheck — visa category types registry.
//
// This module is pure data. No I/O, no React, no storage.
// Add new categories by appending to VISA_CATEGORIES.
//
// Each entry captures the high-level classification of a visa route:
//   - identity (stable id, emoji icon, localized names)
//   - a one-sentence localized description of who the route is for
//   - practical metadata (typical duration, sponsorship / funds flags)
//   - the destination ISO codes where this category is most commonly used
//
// Localization: name and description ship in en / ur (Urdu, RTL) / bn (Bengali),
// matching the LANG_META contract in src/lib/i18n.ts.
//
// Country mapping: `CATEGORIES_BY_COUNTRY` is *derived* from `VISA_CATEGORIES`
// (not hardcoded), so it stays in sync when categories are added or repointed.

/**
 * A visa category type — the high-level classification of a visa route
 * (skilled worker, student, visitor, family, business, investor, ...).
 *
 * Categories are destination-agnostic: the same `id` can be offered by many
 * countries. Use `popularFor` to find the destinations where this category
 * is most commonly used.
 */
export interface VisaCategory {
  /** Stable lowercase snake_case id, e.g. "skilled_worker", "student", "visitor", "family", "business", "investor". */
  id: string;
  /** Single emoji or short symbol representing the category (e.g. "💼", "🎓"). */
  icon: string;
  /** Localized category name in en / ur / bn. */
  name: { en: string; ur: string; bn: string };
  /** One-sentence localized description of who the route is for. */
  description: { en: string; ur: string; bn: string };
  /** Human-readable typical grant duration, e.g. "1-5 years", "Up to 6 months", "Indefinite". */
  typicalDuration: string;
  /** true if a sponsor / employer / school / family member is required. */
  requiresSponsorship: boolean;
  /** true if the applicant must show funds / financial proof. */
  requiresFinancialProof: boolean;
  /** Destination ISO alpha-2 codes where this category is most commonly used (e.g. ["GB","US","CA"]). */
  popularFor: string[];
}

/**
 * Registry of visa category types.
 * Append new entries here; do not mutate at runtime.
 */
export const VISA_CATEGORIES: VisaCategory[] = [
  {
    id: 'skilled_worker',
    icon: '💼',
    name: {
      en: 'Skilled Worker',
      ur: 'ہنر مند کارکن',
      bn: 'দক্ষ কর্মী',
    },
    description: {
      en: 'For workers sponsored by an employer in a role that meets a salary and skill threshold.',
      ur: 'ایسے کارکنوں کے لیے جنہیں کسی آجر کی طرف سے اسپانسر کیا جاتا ہے جہاں تنخواہ اور مہارت کی حد پوری ہوتی ہے۔',
      bn: 'যেসব কর্মীকে এমন একজন নিয়োগকারী স্পন্সর করেন যেখানে বেতন ও দক্ষতার সীমা পূরণ হয়।',
    },
    typicalDuration: '1-5 years (renewable)',
    requiresSponsorship: true,
    requiresFinancialProof: true,
    popularFor: ['GB', 'US', 'CA', 'AU', 'DE', 'AE'],
  },
  {
    id: 'student',
    icon: '🎓',
    name: {
      en: 'Student',
      ur: 'طالب علم',
      bn: 'ছাত্র',
    },
    description: {
      en: 'For full-time study at a recognised institution with a Confirmation of Acceptance.',
      ur: 'کسی تسلیم شدہ تعلیمی ادارے میں فل ٹائم تعلیم کے لیے، قبولیت کے تسلی نامے کے ساتھ۔',
      bn: 'স্বীকৃত শিক্ষা প্রতিষ্ঠানে ফুল-টাইম পড়াশোনার জন্য, গ্রহণের নিশ্চিতপত্র সহ।',
    },
    typicalDuration: 'Course length + short grace period',
    requiresSponsorship: true,
    requiresFinancialProof: true,
    popularFor: ['GB', 'US', 'CA', 'AU', 'DE', 'AE'],
  },
  {
    id: 'visitor',
    icon: '🧳',
    name: {
      en: 'Visitor / Tourist',
      ur: 'زائر / سیاح',
      bn: 'ভিজিটর / পর্যটক',
    },
    description: {
      en: 'For short visits — tourism, family, or business meetings. No work allowed.',
      ur: 'مختصر دوروں کے لیے — سیاحت، خاندان، یا کاروباری ملاقاتیں۔ کام کی اجازت نہیں۔',
      bn: 'সংক্ষিপ্ত সফরের জন্য — পর্যটন, পরিবার, বা ব্যবসায়িক সাক্ষাৎ। কাজের অনুমতি নেই।',
    },
    typicalDuration: 'Up to 6 months',
    requiresSponsorship: false,
    requiresFinancialProof: true,
    popularFor: ['GB', 'US', 'CA', 'AU', 'DE', 'AE'],
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧',
    name: {
      en: 'Family',
      ur: 'خاندان',
      bn: 'পরিবার',
    },
    description: {
      en: 'For joining a spouse, partner, parent, or child who is already settled in the destination.',
      ur: 'کسی ایسے شریک حیات، پارٹنر، والد یا بچے کے ساتھ ملنے کے لیے جو پہلے سے منزل میں آباد ہے۔',
      bn: 'এমন একজন স্বামী/স্ত্রী, পার্টনার, অভিভাবক বা সন্তানের সাথে যুক্ত হওয়ার জন্য যিনি ইতিমধ্যে গন্তব্যে বসতি স্থাপন করেছেন।',
    },
    typicalDuration: '2.5-5 years (route to settlement)',
    requiresSponsorship: true,
    requiresFinancialProof: true,
    popularFor: ['GB', 'US', 'CA', 'AU', 'DE', 'AE'],
  },
  {
    id: 'business',
    icon: '🏢',
    name: {
      en: 'Business / Investor',
      ur: 'کاروبار / سرمایہ کار',
      bn: 'ব্যবসা / বিনিয়োগকারী',
    },
    description: {
      en: 'For entrepreneurs, investors, and senior business people establishing or funding a venture.',
      ur: 'ایسے کاروباری افراد، سرمایہ کاروں، اور سینئر کاروباریوں کے لیے جو کوئی منصوبہ قائم یا مالی امداد کر رہے ہیں।',
      bn: 'উদ্যোক্তা, বিনিয়োগকারী এবং ঊর্ধ্বতন ব্যবসায়ীদের জন্য যারা কোনো উদ্যোগ প্রতিষ্ঠা বা অর্থায়ন করছেন।',
    },
    typicalDuration: '1-5 years (renewable)',
    requiresSponsorship: false,
    requiresFinancialProof: true,
    popularFor: ['GB', 'US', 'CA', 'AU', 'DE', 'AE'],
  },
  {
    id: 'investor',
    icon: '💰',
    name: {
      en: 'Investor (Golden Visa)',
      ur: 'سرمایہ کار (گولڈن ویزا)',
      bn: 'বিনিয়োগকারী (গোল্ডেন ভিসা)',
    },
    description: {
      en: 'For high-net-worth individuals who invest a significant capital sum in exchange for residency.',
      ur: 'ایسے دولت مند افراد کے لیے جو رہائش کے بدلے ایک بڑی رقم سرمایہ کاری کرتے ہیں۔',
      bn: 'উচ্চ-নিট-মূল্যের ব্যক্তিদের জন্য যারা বাসস্থানের বিনিময়ে একটি উল্লেখযোগ্য মূলধন বিনিয়োগ করেন।',
    },
    typicalDuration: '2-5 years (often route to citizenship)',
    requiresSponsorship: false,
    requiresFinancialProof: true,
    popularFor: ['AE', 'US', 'AU', 'GB'],
  },
];

/**
 * Look up a visa category by id. Case-insensitive.
 *
 * @param id - category id (e.g. "skilled_worker", "Skilled_Worker", "STUDENT")
 * @returns the matching `VisaCategory`, or `undefined` if not found.
 */
export function getCategory(id: string): VisaCategory | undefined {
  const needle = id.trim().toLowerCase();
  return VISA_CATEGORIES.find((c) => c.id === needle);
}

/**
 * List of all visa category ids in registry order.
 */
export function getAllCategoryIds(): string[] {
  return VISA_CATEGORIES.map((c) => c.id);
}

/**
 * Derived map of destination ISO alpha-2 code → list of visa categories
 * whose `popularFor` includes that ISO. Built once at module load from
 * `VISA_CATEGORIES`, so it cannot drift when categories are added.
 *
 * Note: the UAE ("AE") includes the "investor" category because "AE"
 * is already in `investor.popularFor` — golden-visa routes are surfaced
 * automatically without any special-casing.
 */
export const CATEGORIES_BY_COUNTRY: Record<string, VisaCategory[]> = (() => {
  // Collect the union of every destination ISO that appears in any popularFor.
  const isos = new Set<string>();
  for (const cat of VISA_CATEGORIES) {
    for (const iso of cat.popularFor) {
      isos.add(iso);
    }
  }
  const acc: Record<string, VisaCategory[]> = {};
  for (const iso of isos) {
    acc[iso] = VISA_CATEGORIES.filter((c) => c.popularFor.includes(iso));
  }
  return acc;
})();
