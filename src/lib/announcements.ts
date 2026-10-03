// VisaCheck announcements — pending rule changes per country.
//
// Pure data. No I/O. The UI surfaces these for the user's selected
// country so they don't miss upcoming shifts.
//
// Each entry captures a pending or recently-announced change to a visa
// route — a consultation, a proposed rule, an announcement with an
// expected-effective date — and links back to the official authority.
//
// Localization: title, summary, and statusLabel all ship in
// en / ur (Urdu, RTL) / bn (Bengali), matching the LANG_META contract
// in src/lib/i18n.ts.
//
// Helper functions: `announcementsForCountry(iso)`,
// `announcementsForCategory(countryIso, categoryId)`,
// `upcomingAnnouncements(withinDays)`, and `getAnnouncementById(id)`.
// Add new announcements by appending to ANNOUNCEMENTS.

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Lifecycle status of a pending rule change.
 *
 * - `consultation`    — the authority is gathering public input; the rule
 *                       shape is not yet final.
 * - `proposed`        — a draft rule has been published but not yet enacted.
 * - `announced`       — the authority has formally announced the change
 *                       with a committed effective date.
 * - `deferred`        — the change has been pushed back / paused.
 * - `effective_soon`  — the rule has been confirmed and is taking effect
 *                       within a short window.
 */
export type AnnouncementStatus =
  | 'consultation'
  | 'proposed'
  | 'announced'
  | 'deferred'
  | 'effective_soon';

/**
 * A pending or recently-announced rule change for a destination country.
 *
 * Stored as pure data — the UI reads this registry to surface upcoming
 * shifts alongside the live rule checks so users aren't blindsided by
 * changes that take effect shortly after their planned application.
 */
export interface Announcement {
  /** Unique slug id, e.g. "us-h1b-cap-reform-2026-q2". */
  id: string;
  /** Destination ISO alpha-2 (e.g. "GB", "US", "CA", "AU", "DE", "AE"). */
  countryIso: string;
  /** Visa category id this announcement affects (see visa-categories.ts). */
  categoryId: string;
  /** Localized short title (en / ur / bn). */
  title: { en: string; ur: string; bn: string };
  /** 1-3 sentence localized summary (en / ur / bn). */
  summary: { en: string; ur: string; bn: string };
  /** Lifecycle status of the rule change. */
  status: AnnouncementStatus;
  /** Localized human-readable status label (en / ur / bn). */
  statusLabel: { en: string; ur: string; bn: string };
  /** Official authority short name (e.g. "USCIS", "UKVI", "IRCC", "Home Affairs", "BAMF", "ICP"). */
  authorityName: string;
  /** ISO date the announcement was first published. */
  publishedAt: string;
  /** ISO date the rule is expected to take effect. */
  expectedEffectiveAt: string;
  /** https URL to the official consultation / press release / announcement. */
  sourceUrl: string;
  /** How impactful the change is for prospective applicants. */
  impactLevel: 'low' | 'medium' | 'high';
}

/**
 * Registry of pending rule changes per country.
 * Append new entries here; do not mutate at runtime.
 */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'us-h1b-cap-reform-2026-q2',
    countryIso: 'US',
    categoryId: 'student',
    title: {
      en: 'H-1B cap reform consultation',
      ur: 'H-1B کیپ اصلاح پر مشاورت',
      bn: 'H-1B ক্যাপ সংস্কার পরামর্শ',
    },
    summary: {
      en: 'USCIS has opened a public consultation on H-1B cap allocation reform, including the proposed shift from a single registration window to a multi-phase selection process. The change would affect F-1 students transitioning to specialty-occupation work. Comments are open until late Q1 2026.',
      ur: 'یوایسسیس نے H-1B کیپ الاٹمنٹ اصلاح پر عوامی مشاورت کا آغاز کیا ہے، جس میں سنگل رجسٹریشن ونڈو سے ملٹی فیز سلیکشن پروسیس میں تبدیلی کی تجویز شامل ہے۔ یہ تبدیلی F-1 طلبہ کو خصوصی روزگار میں منتقل ہونے پر اثر انداز ہوگی۔ تبصرے مارچ 2026 کے آخر تک کھلے ہیں۔',
      bn: 'ইউএসসিস এইচ-১বি ক্যাপ বণ্টন সংস্কারের জন্য একটি সর্বজনীন পরামর্শ শুরু করেছে, যার মধ্যে একক নিবন্ধন উইন্ডো থেকে মাল্টি-ফেজ নির্বাচন প্রক্রিয়ায় রূপান্তরের প্রস্তাব অন্তর্ভুক্ত রয়েছে। এই পরিবর্তনটি F-1 শিক্ষার্থীদের স্পেশালটি-অকুপেশন কাজে উত্তরণে প্রভাব ফেলবে। মন্তব্য ২০২৬ সালের প্রথম প্রান্তিকের শেষ পর্যন্ত গ্রহণ করা হবে।',
    },
    status: 'consultation',
    statusLabel: {
      en: 'Consultation open',
      ur: 'مشاورت جاری',
      bn: 'পরামর্শ চলছে',
    },
    authorityName: 'USCIS',
    publishedAt: '2025-12-15T00:00:00Z',
    expectedEffectiveAt: '2026-04-01T00:00:00Z',
    sourceUrl: 'https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations',
    impactLevel: 'high',
  },
  {
    id: 'us-h1b-wage-selection-2026',
    countryIso: 'US',
    categoryId: 'skilled_worker',
    title: {
      en: 'H-1B wage-based selection rule revision',
      ur: 'H-1B تنخواہ پر مبنی انتخاب کے اصول میں ترمیم',
      bn: 'H-1B বেতন-ভিত্তিক নির্বাচন নিয়ম সংশোধন',
    },
    summary: {
      en: 'USCIS has announced a revision to the H-1B selection rule to weight registrations by prevailing wage level, prioritizing higher-paid positions. The final rule is effective 2026-01-01 and applies to all FY2027 registrations.',
      ur: 'یوایسسیس نے H-1B سلیکشن رول میں ترمیم کا اعلان کیا ہے تاکہ رجسٹریشنز کو حاوی تنخواہ کی سطح کے لحاظ سے ترجیح دی جا سکے، جس میں زیادہ معاوضہ والے عہدوں کو ترجیح دی جائے گی۔ حتمی اصول 2026-01-01 سے نافذ ہے اور تمام FY2027 رجسٹریشنز پر لاگو ہوگا۔',
      bn: 'ইউএসসিস এইচ-১বি নির্বাচন নিয়মে একটি সংশোধনের ঘোষণা দিয়েছে যাতে নিবন্ধনগুলিকে প্রচলিত বেতন স্তর অনুসারে ওজন করা হয়, উচ্চতর-বেতনের পদগুলিকে অগ্রাধিকার দেওয়া হয়। চূড়ান্ত নিয়মটি 2026-01-01 থেকে কার্যকর এবং সমস্ত FY2027 নিবন্ধনে প্রযোজ্য।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'USCIS',
    publishedAt: '2025-11-01T00:00:00Z',
    expectedEffectiveAt: '2026-01-01T00:00:00Z',
    sourceUrl: 'https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations',
    impactLevel: 'high',
  },
  {
    id: 'gb-graduate-route-review-2026',
    countryIso: 'GB',
    categoryId: 'student',
    title: {
      en: 'Graduate route visa review (2-year post-study)',
      ur: 'گریجویٹ روٹ ویزا کا جائزہ (2 سالہ پوسٹ اسٹڈی)',
      bn: 'গ্র্যাজুয়েট রুট ভিসা পর্যালোচনা (২ বছর পোস্ট-স্টাডি)',
    },
    summary: {
      en: 'The UK Home Office has opened a consultation on the future of the Graduate route visa, which currently allows international students to stay for two years post-study. The review is considering reductions to the duration and tighter eligibility criteria. Expected effective September 2026.',
      ur: 'یوکے ہوم آفس نے گریجویٹ روٹ ویزا کے مستقبل پر مشاورت کھول دی ہے، جو فی الحال بین الاقوامی طلبہ کو پوسٹ اسٹڈی دو سال تک رہنے کی اجازت دیتا ہے۔ جائزے میں مدت میں کمی اور سخت اہلیت کے معیارات پر غور کیا جا رہا ہے۔ متوقع ستمبر 2026 میں نافذ۔',
      bn: 'যুক্তরাজ্য হোম অফিস গ্র্যাজুয়েট রুট ভিসার ভবিষ্যৎ সম্পর্কে একটি পরামর্শ শুরু করেছে, যা বর্তমানে আন্তর্জাতিক শিক্ষার্থীদের পড়াশোনার পর দুই বছর থাকার অনুমতি দেয়। পর্যালোচনায় সময়কাল হ্রাস এবং কঠোর যোগ্যতার মানদণ্ড বিবেচনা করা হচ্ছে। সেপ্টেম্বর 2026 সালে কার্যকর হবে বলে আশা করা হচ্ছে।',
    },
    status: 'consultation',
    statusLabel: {
      en: 'Consultation open',
      ur: 'مشاورت جاری',
      bn: 'পরামর্শ চলছে',
    },
    authorityName: 'UKVI',
    publishedAt: '2026-01-20T00:00:00Z',
    expectedEffectiveAt: '2026-09-01T00:00:00Z',
    sourceUrl: 'https://www.gov.uk/government/consultations',
    impactLevel: 'high',
  },
  {
    id: 'gb-salary-threshold-shortage-2026',
    countryIso: 'GB',
    categoryId: 'skilled_worker',
    title: {
      en: 'Salary threshold review for shortage occupations',
      ur: 'قلیل روزگار پیشوں کے لیے تنخواہ کی حد کا جائزہ',
      bn: 'ঘাটতি পেশার জন্য বেতন সীমা পর্যালোচনা',
    },
    summary: {
      en: 'UKVI is proposing adjustments to the salary thresholds for Shortage Occupation routes, with a possible reduction in minimum pay for selected STEM and healthcare roles. Expected effective April 2026.',
      ur: 'یوکے وی آئی قلیل روزگار پیشوں کے لیے تنخواہ کی حد میں ترمیم کی تجویز کر رہا ہے، جس میں منتخب شدہ اسٹیم اور صحت کے پیشوں کے لیے کم سے کم معاوضے میں کمی ممکن ہے۔ متوقع اپریل 2026 میں نافذ۔',
      bn: 'ইউকেভিআই ঘাটতি পেশার রুটের জন্য বেতন সীমা সমন্বয়ের প্রস্তাব করছে, নির্বাচিত স্টেম এবং স্বাস্থ্যসেবা ভূমিকার জন্য সর্বনিম্ন বেতন হ্রাস সম্ভব। এপ্রিল 2026 সালে কার্যকর হবে বলে আশা করা হচ্ছে।',
    },
    status: 'proposed',
    statusLabel: {
      en: 'Proposed',
      ur: 'تجویز کردہ',
      bn: 'প্রস্তাবিত',
    },
    authorityName: 'UKVI',
    publishedAt: '2025-10-15T00:00:00Z',
    expectedEffectiveAt: '2026-04-01T00:00:00Z',
    sourceUrl: 'https://www.gov.uk/government/publications/skilled-worker-visa-eligible-occupations-and-codes',
    impactLevel: 'medium',
  },
  {
    id: 'ca-express-entry-stem-2026',
    countryIso: 'CA',
    categoryId: 'skilled_worker',
    title: {
      en: 'Express Entry STEM draw category expansion',
      ur: 'ایکسپریس انٹری اسٹیم ڈراش زمرہ کی توسیع',
      bn: 'এক্সপ্রেস এন্ট্রি স্টেম ড্র বিভাগ সম্প্রসারণ',
    },
    summary: {
      en: 'IRCC has announced an expansion of the STEM category-based Express Entry draws, adding four new occupations including data scientists and AI specialists. Effective March 2026.',
      ur: 'آئرسی نے ایکسپریس انٹری کے اسٹیم زمرہ مبنی ڈراش میں توسیع کا اعلان کیا ہے، جس میں ڈیٹا سائنٹسٹ اور اے آئی اسپیشلسٹ سمیت چار نئے پیشے شامل کیے گئے ہیں۔ مارچ 2026 سے نافذ।',
      bn: 'আইআরসিসি স্টেম ক্যাটাগরি-ভিত্তিক এক্সপ্রেস এন্ট্রি ড্র-এর সম্প্রসারণের ঘোষণা দিয়েছে, যাতে ডেটা সায়েন্টিস্ট এবং এআই বিশেষজ্ঞসহ চারটি নতুন পেশা অন্তর্ভুক্ত করা হয়েছে। মার্চ 2026 থেকে কার্যকর।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'IRCC',
    publishedAt: '2025-12-05T00:00:00Z',
    expectedEffectiveAt: '2026-03-15T00:00:00Z',
    sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html',
    impactLevel: 'medium',
  },
  {
    id: 'ca-study-permit-attestation-2026',
    countryIso: 'CA',
    categoryId: 'student',
    title: {
      en: 'New attestation letter requirement for study permits',
      ur: 'اسٹڈی پرمٹ کے لیے نئی تصدیقی خط کی ضرورت',
      bn: 'স্টাডি পারমিটের জন্য নতুন সত্যায়ন পত্রের প্রয়োজনীয়তা',
    },
    summary: {
      en: 'IRCC has confirmed a new provincial attestation letter requirement for all study permit applications submitted from 2026-01-01. Applicants must obtain the letter from their destination province before applying.',
      ur: 'آئرسی نے 2026-01-01 سے جمع کرائے گئے تمام اسٹڈی پرمٹ درخواستوں کے لیے نئے صوبائی تصدیقی خط کی ضرورت کی تصدیق کی ہے۔ درخواست گزاروں کو اپنے منزل کے صوبے سے خط حاصل کرنا ہوگا۔',
      bn: 'আইআরসিসি 2026-01-01 থেকে জমা দেওয়া সমস্ত স্টাডি পারমিট আবেদনের জন্য একটি নতুন প্রাদেশিক সত্যায়ন পত্রের প্রয়োজনীয়তা নিশ্চিত করেছে। আবেদনকারীদের আবেদন করার আগে তাদের গন্তব্য প্রদেশ থেকে পত্রটি সংগ্রহ করতে হবে।',
    },
    status: 'effective_soon',
    statusLabel: {
      en: 'Effective soon',
      ur: 'جلد نافذ',
      bn: 'শীঘ্রই কার্যকর',
    },
    authorityName: 'IRCC',
    publishedAt: '2025-11-10T00:00:00Z',
    expectedEffectiveAt: '2026-01-01T00:00:00Z',
    sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html',
    impactLevel: 'high',
  },
  {
    id: 'au-tss-482-pr-pathway-2026',
    countryIso: 'AU',
    categoryId: 'skilled_worker',
    title: {
      en: 'Subclass 482 pathway to PR expansion',
      ur: 'سب کلاس 482 کا PR پاتھ وے توسیع',
      bn: 'সাবক্লাস 482 পিআর পথ সম্প্রসারণ',
    },
    summary: {
      en: 'The Department of Home Affairs has announced an expansion of the Temporary Skill Shortage (subclass 482) pathway to permanent residency, reducing the required work period from three years to two. Effective July 2026.',
      ur: 'محکمہ ہوم افیئرز نے عارضی ہنر قلت (سب کلاس 482) پاتھ وے کا مستقل رہائش میں توسیع کا اعلان کیا ہے، جس میں مطلوبہ کام کی مدت کو تین سال سے دو سال تک کم کیا گیا ہے۔ جولائی 2026 سے نافذ۔',
      bn: 'স্বরাষ্ট্র বিভাগ টেম্পোরারি স্কিল শর্টেজ (সাবক্লাস 482) পথকে স্থায়ী বাসস্থানে সম্প্রসারণের ঘোষণা দিয়েছে, প্রয়োজনীয় কাজের সময়কাল তিন বছর থেকে কমিয়ে দুই বছর করেছে। জুলাই 2026 থেকে কার্যকর।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'Home Affairs',
    publishedAt: '2025-12-01T00:00:00Z',
    expectedEffectiveAt: '2026-07-01T00:00:00Z',
    sourceUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-skill-shortage-482',
    impactLevel: 'high',
  },
  {
    id: 'au-genuine-student-requirement-2026',
    countryIso: 'AU',
    categoryId: 'student',
    title: {
      en: 'Genuine Student (GS) requirement introduction',
      ur: 'اصلی طالب علم (GS) کی ضرورت کا آغاز',
      bn: 'জেনুইন স্টুডেন্ট (GS) প্রয়োজনীয়তা প্রবর্তন',
    },
    summary: {
      en: 'Home Affairs has confirmed the Genuine Student (GS) requirement replacing the Genuine Temporary Entrant test for all Student visa (subclass 500) applications lodged from 2026-01-01. Applicants must answer targeted questions about study intent.',
      ur: 'ہوم افیئرز نے 2026-01-01 سے جمع کردہ تمام اسٹوڈنٹ ویزا (سب کلاس 500) درخواستوں کے لیے جینوین ٹیمپوریری اینٹرنٹ ٹیسٹ کی جگہ لینے والے اصلی طالب علم (GS) کی ضرورت کی تصدیق کی ہے۔ درخواست گزاروں کو تعلیم کے ارادے کے بارے میں مخصوص سوالات کا جواب دینا ہوگا।',
      bn: 'হোম অ্যাফেয়ার্স 2026-01-01 থেকে দাখিল করা সমস্ত স্টুডেন্ট ভিসা (সাবক্লাস 500) আবেদনের জন্য জেনুইন টেম্পোরারি এন্ট্র্যান্ট পরীক্ষার পরিবর্তে জেনুইন স্টুডেন্ট (GS) প্রয়োজনীয়তা নিশ্চিত করেছে। আবেদনকারীদের অধ্যয়নের উদ্দেশ্য সম্পর্কে লক্ষিত প্রশ্নের উত্তর দিতে হবে।',
    },
    status: 'effective_soon',
    statusLabel: {
      en: 'Effective soon',
      ur: 'جلد نافذ',
      bn: 'শীঘ্রই কার্যকর',
    },
    authorityName: 'Home Affairs',
    publishedAt: '2025-10-20T00:00:00Z',
    expectedEffectiveAt: '2026-01-01T00:00:00Z',
    sourceUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500',
    impactLevel: 'high',
  },
  {
    id: 'de-chancenkarte-expansion-2026',
    countryIso: 'DE',
    categoryId: 'skilled_worker',
    title: {
      en: 'Chancenkarte (opportunity card) expansion',
      ur: 'چانسنکارٹے (موقع کارڈ) کی توسیع',
      bn: 'চানসেনকার্টে (সুযোগ কার্ড) সম্প্রসারণ',
    },
    summary: {
      en: 'BAMF has announced an expansion of the Chancenkarte (opportunity card) scheme under the Skilled Immigration Act, adding a fast-track pathway for IT professionals with vocational experience. Effective June 2026.',
      ur: 'بامف نے ہنر مند امیگریشن ایکٹ کے تحت چانسنکارٹے (موقع کارڈ) اسکیم کی توسیع کا اعلان کیا ہے، جس میں پیشہ ورانہ تجربہ رکھنے والے آئی ٹی پیشہ ور افراد کے لیے فاسٹ ٹریک پاتھ وے شامل کیا گیا ہے۔ جون 2026 سے نافذ۔',
      bn: 'বিএএমএফ দক্ষ অভিবাসন আইনের অধীনে চানসেনকার্টে (সুযোগ কার্ড) প্রকল্পের সম্প্রসারণের ঘোষণা দিয়েছে, যাতে পেশাগত অভিজ্ঞতা সহ আইটি পেশাদারদের জন্য একটি ফাস্ট-ট্র্যাক পথ যোগ করা হয়েছে। জুন 2026 থেকে কার্যকর।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'BAMF',
    publishedAt: '2025-11-25T00:00:00Z',
    expectedEffectiveAt: '2026-06-01T00:00:00Z',
    sourceUrl: 'https://www.bamf.de/EN/Themen/MigrationAufenthalt/Zuwanderung/FachkraefteEinreise/Chancenkarte/chancenkarte-node.html',
    impactLevel: 'medium',
  },
  {
    id: 'de-etias-preauthorization-pilot-2026',
    countryIso: 'DE',
    categoryId: 'visitor',
    title: {
      en: 'Digital ETIAS-style pre-authorization pilot (Schengen)',
      ur: 'ڈیجیٹل ETIAS طرز کا پری آتھورائزیشن پائلٹ (شینجن)',
      bn: 'ডিজিটাল ETIAS-স্টাইল প্রি-অথোরাইজেশন পাইলট (শেনজেন)',
    },
    summary: {
      en: 'BAMF is consulting on a Schengen-wide digital pre-authorization pilot modelled on ETIAS, intended to streamline visa-exempt short stays. Expected effective October 2026.',
      ur: 'بامف ETIAS پر مبنی شینجن وائیڈ ڈیجیٹل پری آتھورائزیشن پائلٹ پر مشاورت کر رہا ہے، جس کا مقصد ویزا سے مبرور مختصر قیام کو آسان بنانا ہے۔ متوقع اکتوبر 2026 میں نافذ۔',
      bn: 'বিএএমএফ ইটিআইএস-এর আদলে একটি শেনজেন-ব্যাপী ডিজিটাল প্রি-অথোরাইজেশন পাইলট নিয়ে পরামর্শ করছে, যার লক্ষ্য ভিসা-মুক্ত সংক্ষিপ্ত অবস্থানকে সহজ করা। অক্টোবর 2026 সালে কার্যকর হবে বলে আশা করা হচ্ছে।',
    },
    status: 'proposed',
    statusLabel: {
      en: 'Proposed',
      ur: 'تجویز کردہ',
      bn: 'প্রস্তাবিত',
    },
    authorityName: 'BAMF',
    publishedAt: '2026-07-10T00:00:00Z',
    expectedEffectiveAt: '2026-10-01T00:00:00Z',
    sourceUrl: 'https://www.bamf.de/EN/',
    impactLevel: 'low',
  },
  {
    id: 'ae-green-visa-expansion-2026',
    countryIso: 'AE',
    categoryId: 'skilled_worker',
    title: {
      en: 'Green Visa expansion for skilled talent',
      ur: 'ہنر مند افراد کے لیے گرین ویزا کی توسیع',
      bn: 'দক্ষ প্রতিভার জন্য গ্রিন ভিসা সম্প্রসারণ',
    },
    summary: {
      en: 'ICP has announced an expansion of the Green Visa programme for skilled talent, adding new eligibility categories for healthcare, sustainability, and creative-industries professionals. Effective March 2026.',
      ur: 'آئیسیپی نے ہنر مند افراد کے لیے گرین ویزا پروگرام کی توسیع کا اعلان کیا ہے، جس میں صحت، پائیداری، اور تخلیقی صنعتوں کے پیشہ ور افراد کے لیے نئی اہلیت کی اقسام شامل کی گئی ہیں۔ مارچ 2026 سے نافذ۔',
      bn: 'আইসিপি দক্ষ প্রতিভার জন্য গ্রিন ভিসা কর্মসূচির সম্প্রসারণের ঘোষণা দিয়েছে, স্বাস্থ্যসেবা, স্থায়িত্ব এবং সৃজনশীল শিল্পের পেশাদারদের জন্য নতুন যোগ্যতার বিভাগ যোগ করেছে। মার্চ 2026 থেকে কার্যকর।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'ICP',
    publishedAt: '2025-12-20T00:00:00Z',
    expectedEffectiveAt: '2026-03-01T00:00:00Z',
    sourceUrl: 'https://icp.gov.ae/en/',
    impactLevel: 'medium',
  },
  {
    id: 'ae-five-year-tourist-visa-2026',
    countryIso: 'AE',
    categoryId: 'visitor',
    title: {
      en: 'Five-year multi-entry tourist visa expansion',
      ur: 'پانچ سالہ ملٹی انٹری ٹورسٹ ویزا کی توسیع',
      bn: 'পাঁচ বছরের মাল্টি-এন্ট্রি ট্যুরিস্ট ভিসা সম্প্রসারণ',
    },
    summary: {
      en: 'ICP has announced a five-year multi-entry tourist visa available to all nationalities, replacing the previous 90-day single-entry scheme. Effective February 2026.',
      ur: 'آئیسیپی نے تمام قومیتوں کے لیے دستیاب پانچ سالہ ملٹی انٹری ٹورسٹ ویزا کا اعلان کیا ہے، جو پچھلے 90 روزہ سنگل انٹری اسکیم کی جگہ لے گا۔ فروری 2026 سے نافذ۔',
      bn: 'আইসিপি সমস্ত জাতীয়তার জন্য উপলব্ধ পাঁচ বছরের মাল্টি-এন্ট্রি ট্যুরিস্ট ভিসার ঘোষণা দিয়েছে, যা পূর্ববর্তী ৯০ দিনের একক-এন্ট্রি প্রকল্পের স্থান নেবে। ফেব্রুয়ারি 2026 থেকে কার্যকর।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'ICP',
    publishedAt: '2025-11-15T00:00:00Z',
    expectedEffectiveAt: '2026-02-01T00:00:00Z',
    sourceUrl: 'https://icp.gov.ae/en/',
    impactLevel: 'low',
  },
  {
    id: 'sg-ep-salary-threshold-review-2026',
    countryIso: 'SG',
    categoryId: 'skilled_worker',
    title: {
      en: 'Employment Pass salary threshold review',
      ur: 'ایمپلائمنٹ پاس تنخواہ کی حد کا جائزہ',
      bn: 'এমপ্লয়মেন্ট পাস বেতন সীমা পর্যালোচনা',
    },
    summary: {
      en: 'MOM is reviewing the Employment Pass (EP) minimum salary threshold, with a proposal to raise it from SGD $5,000 to SGD $5,500 per month for all new and renewal applications. The change aligns EP salaries with the local workforce wage trajectory. Expected effective July 2026.',
      ur: 'ایم او ایم ایمپلائمنٹ پاس (EP) کی کم سے کم تنخواہ کی حد کا جائزہ لے رہا ہے، جس میں تمام نئی اور تجدید کی درخواستوں کے لیے اسے ماہانہ ایس جی ڈی $5,000 سے $5,550 تک بڑھانے کی تجویز شامل ہے۔ یہ تبدیلی EP تنخواہوں کو مقامی کام کرنے والوں کی تنخواہ کے رجحان سے ہم آہنگ کرے گی۔ متوقع جولائی 2026 میں نافذ۔',
      bn: 'এমওএম এমপ্লয়মেন্ট পাস (EP)-এর ন্যূনতম বেতন সীমা পর্যালোচনা করছে, যাতে সমস্ত নতুন ও নবায়ন আবেদনের জন্য এটি মাসিক SGD $5,000 থেকে $5,550-এ উন্নীত করার প্রস্তাব রয়েছে। এই পরিবর্তনটি EP বেতনকে স্থানীয় কর্মীবাহিনীর মজুরি প্রবণতার সাথে সামঞ্জস্যপূর্ণ করবে। জুলাই 2026-এ কার্যকর হবে বলে আশা করা হচ্ছে।',
    },
    status: 'consultation',
    statusLabel: {
      en: 'Consultation open',
      ur: 'مشاورت جاری',
      bn: 'পরামর্শ চলছে',
    },
    authorityName: 'MOM',
    publishedAt: '2026-01-15T00:00:00Z',
    expectedEffectiveAt: '2026-07-01T00:00:00Z',
    sourceUrl: 'https://www.mom.gov.sg/employment-pass',
    impactLevel: 'high',
  },
  {
    id: 'sg-bilateral-visa-free-pilot-2026',
    countryIso: 'SG',
    categoryId: 'visitor',
    title: {
      en: 'New bilateral visa-free arrangement pilot',
      ur: 'نئے دو طرفہ ویزا فری انتظام کا پائلٹ',
      bn: 'নতুন দ্বিপাক্ষিক ভিসা-মুক্ত ব্যবস্থা পাইলট',
    },
    summary: {
      en: 'Singapore is piloting an extended visa-free stay arrangement for ASEAN+ countries, allowing qualifying nationals up to 90 days visa-free for tourism and short business visits. The pilot deepens regional people-to-people ties. Expected effective June 2026.',
      ur: 'سنگاپور اے سی این + ممالک کے لیے توسیع شدہ ویزا فری قیام کا انتظام پائلٹ کر رہا ہے، جس کے تحت اہل قومیتوں کو سیاحت اور مختصر کاروباری دوروں کے لیے 90 دن تک ویزا فری قیام کی اجازت ہے۔ یہ پائلٹ علاقائی لوگوں کے درمیان تعلقات کو گہرا کرے گا۔ متوقع جون 2026 میں نافذ۔',
      bn: 'সিঙ্গাপুর ASEAN+ দেশগুলির জন্য একটি সম্প্রসারিত ভিসা-মুক্ত অবস্থান ব্যবস্থা পাইলট করছে, যা যোগ্য নাগরিকদের পর্যটন এবং সংক্ষিপ্ত ব্যবসায়িক সফরের জন্য 90 দিন পর্যন্ত ভিসা-মুক্ত থাকার অনুমতি দেয়। এই পাইলটটি আঞ্চলিক জনগণের মধ্যে সম্পর্ক গভীর করবে। জুন 2026-এ কার্যকর হবে বলে আশা করা হচ্ছে।',
    },
    status: 'proposed',
    statusLabel: {
      en: 'Proposed',
      ur: 'تجویز کردہ',
      bn: 'প্রস্তাবিত',
    },
    authorityName: 'MOM',
    publishedAt: '2026-02-10T00:00:00Z',
    expectedEffectiveAt: '2026-06-01T00:00:00Z',
    sourceUrl: 'https://www.mom.gov.sg/passes-and-permits',
    impactLevel: 'low',
  },
  {
    id: 'nz-smc-points-threshold-2026',
    countryIso: 'NZ',
    categoryId: 'skilled_worker',
    title: {
      en: 'Skilled Migrant Category points threshold adjustment',
      ur: 'ہنر مند مہاجر زمرہ کے پوائنٹس کی حد میں ترمیم',
      bn: 'স্কিলড মাইগ্র্যান্ট ক্যাটাগরি পয়েন্ট সীমা সমন্বয়',
    },
    summary: {
      en: 'INZ is adjusting the points threshold for the Skilled Migrant Category (SMC) from 160 to 180 points, raising the bar for residency under the expression of interest system. Applicants will need additional points from qualifications, work experience, or NZ-based employment. Effective October 2026.',
      ur: 'آئی این زی ہنر مند مہاجر زمرہ (ایس ایم سی) کے لیے پوائنٹس کی حد کو 160 سے 180 پوائنٹس تک ایڈجسٹ کر رہا ہے، جس سے اظہار دلچسپی کے نظام کے تحت رہائش کے لیے حد بڑھ جائے گی۔ درخواست گزاروں کو تعلیمی اسناد، کام کے تجربے، یا نیوزی لینڈ میں روزگار سے اضافی پوائنٹس کی ضرورت ہوگی۔ اکتوبر 2026 سے نافذ۔',
      bn: 'আইএনজেড স্কিলড মাইগ্র্যান্ট ক্যাটাগরির (SMC) জন্য পয়েন্ট সীমা 160 থেকে 180 পয়েন্টে সমন্বয় করছে, যা এক্সপ্রেশন অফ ইন্টারেস্ট সিস্টেমের অধীনে বাসস্থানের মানদণ্ড বাড়াবে। আবেদনকারীদের যোগ্যতা, কাজের অভিজ্ঞতা বা নিউজিল্যান্ড-ভিত্তিক কর্মসংস্থান থেকে অতিরিক্ত পয়েন্টের প্রয়োজন হবে। অক্টোবর 2026 থেকে কার্যকর।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'INZ',
    publishedAt: '2025-12-10T00:00:00Z',
    expectedEffectiveAt: '2026-10-01T00:00:00Z',
    sourceUrl: 'https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/tools-and-information/work-and-skilled-migrant',
    impactLevel: 'high',
  },
  {
    id: 'nz-post-study-work-extension-2027',
    countryIso: 'NZ',
    categoryId: 'student',
    title: {
      en: 'Post-study work visa extension review',
      ur: 'پوسٹ اسٹڈی ورک ویزا کی توسیع کا جائزہ',
      bn: 'পোস্ট-স্টাডি ওয়ার্ক ভিসা সম্প্রসারণ পর্যালোচনা',
    },
    summary: {
      en: 'INZ is reviewing an extension of post-study work rights from 3 to 4 years for degree-level graduates (Level 7 and above), to better support retention of skilled talent. The consultation is gathering feedback from institutions and employers. Expected effective January 2027.',
      ur: 'آئی این زی ڈگری لیول کے گریجویٹس (لیول 7 اور اس سے اوپر) کے لیے پوسٹ اسٹڈی ورک رائٹس کو 3 سے 4 سال تک بڑھانے کا جائزہ لے رہا ہے، تاکہ ہنر مند افراد کو برقرار رکھنے میں بہتر مدد مل سکے۔ مشاورت اداروں اور آجروں سے رائے حاصل کر رہی ہے۔ متوقع جنوری 2027 میں نافذ۔',
      bn: 'আইএনজেড ডিগ্রি-স্তরের গ্র্যাজুয়েটদের (লেভেল 7 এবং তদূর্ধ্ব) জন্য পোস্ট-স্টাডি ওয়ার্ক রাইটস 3 থেকে 4 বছরে সম্প্রসারণ পর্যালোচনা করছে, দক্ষ প্রতিভা ধরে রাখতে সহায়তা করার জন্য। পরামর্শটি প্রতিষ্ঠান এবং নিয়োগকর্তাদের কাছ থেকে মতামত সংগ্রহ করছে। জানুয়ারি 2027-এ কার্যকর হবে বলে আশা করা হচ্ছে।',
    },
    status: 'consultation',
    statusLabel: {
      en: 'Consultation open',
      ur: 'مشاورت جاری',
      bn: 'পরামর্শ চলছে',
    },
    authorityName: 'INZ',
    publishedAt: '2026-03-05T00:00:00Z',
    expectedEffectiveAt: '2027-01-01T00:00:00Z',
    sourceUrl: 'https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/tools-and-information/about-visa/post-study-work-visa',
    impactLevel: 'medium',
  },
  {
    id: 'ie-critical-skills-list-expansion-2026',
    countryIso: 'IE',
    categoryId: 'skilled_worker',
    title: {
      en: 'Critical Skills occupation list expansion',
      ur: 'ہنر مہارت پیشوں کی فہرست کی توسیع',
      bn: 'ক্রিটিক্যাল স্কিলস অকুপেশন তালিকা সম্প্রসারণ',
    },
    summary: {
      en: 'INIS is expanding the Critical Skills Employment Permit occupation list to include AI specialists, data engineers, and machine learning researchers, addressing acute talent shortages in high-growth sectors. Effective March 2026.',
      ur: 'آئی این آئی ایس ہنر مہارت روزگار پرمٹ کے پیشوں کی فہرست میں توسیع کر رہا ہے، جس میں اے آئی اسپیشلسٹ، ڈیٹا انجینئرز، اور مشین لرننگ محققین کو شامل کیا گیا ہے، تاکہ تیزی سے بڑھتی ہوئی شعبوں میں ہنر مند افراد کی شدید قلت کو دور کیا جا سکے۔ مارچ 2026 سے نافذ۔',
      bn: 'আইএনআইএস ক্রিটিক্যাল স্কিলস এমপ্লয়মেন্ট পারমিট অকুপেশন তালিকা সম্প্রসারণ করছে, যাতে এআই বিশেষজ্ঞ, ডেটা ইঞ্জিনিয়ার এবং মেশিন লার্নিং গবেষকদের অন্তর্ভুক্ত করা হবে, উচ্চ-প্রবৃদ্ধি খাতে তীব্র প্রতিভা ঘাটতি মোকাবিলায়। মার্চ 2026 থেকে কার্যকর।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'INIS',
    publishedAt: '2025-12-18T00:00:00Z',
    expectedEffectiveAt: '2026-03-01T00:00:00Z',
    sourceUrl: 'https://enterprise.gov.ie/en/What-We-Do/Workplace-and-Skills/Employment-Permits/',
    impactLevel: 'medium',
  },
  {
    id: 'ie-third-level-graduate-scheme-2026',
    countryIso: 'IE',
    categoryId: 'student',
    title: {
      en: 'Third-level graduate scheme extension',
      ur: 'تھرڈ لیول گریجویٹ اسکیم کی توسیع',
      bn: 'থার্ড-লেভেল গ্র্যাজুয়েট স্কিম সম্প্রসারণ',
    },
    summary: {
      en: 'Ireland is extending the Third Level Graduate Scheme from 1 to 2 years for graduates with Level 9+ qualifications (masters and above), allowing them to seek employment in Ireland after graduation. Effective September 2026.',
      ur: 'آئرلینڈ لیول 9+ کی تعلیمی اسناد (ماسٹرز اور اس سے اوپر) رکھنے والے گریجویٹس کے لیے تھرڈ لیول گریجویٹ اسکیم کو 1 سے 2 سال تک بڑھا رہا ہے، جس سے انہیں گریجویشن کے بعد آئرلینڈ میں روزگار تلاش کرنے کی اجازت ملے گی۔ ستمبر 2026 سے نافذ۔',
      bn: 'আয়ারল্যান্ড লেভেল 9+ যোগ্যতা (মাস্টার্স এবং তদূর্ধ্ব) সম্পন্ন গ্র্যাজুয়েটদের জন্য থার্ড লেভেল গ্র্যাজুয়েট স্কিম 1 থেকে 2 বছরে সম্প্রসারণ করছে, যা তাদের স্নাতক হওয়ার পর আয়ারল্যান্ডে কর্মসংস্থান খুঁজতে সক্ষম করবে। সেপ্টেম্বর 2026 থেকে কার্যকর।',
    },
    status: 'announced',
    statusLabel: {
      en: 'Announced',
      ur: 'اعلان کردہ',
      bn: 'ঘোষিত',
    },
    authorityName: 'INIS',
    publishedAt: '2026-02-20T00:00:00Z',
    expectedEffectiveAt: '2026-09-01T00:00:00Z',
    sourceUrl: 'https://www.irishimmigration.ie/',
    impactLevel: 'high',
  },
];

/**
 * Return all announcements for a given destination country.
 *
 * @param iso - 2-letter ISO alpha-2 code. Case-insensitive; whitespace trimmed.
 * @returns array of `Announcement` (empty if no match).
 */
export function announcementsForCountry(iso: string): Announcement[] {
  const needle = iso.trim().toUpperCase();
  return ANNOUNCEMENTS.filter((a) => a.countryIso === needle);
}

/**
 * Return all announcements for a given destination country AND visa category.
 *
 * @param countryIso - 2-letter ISO alpha-2 code. Case-insensitive; whitespace trimmed.
 * @param categoryId - visa category id. Case-insensitive; whitespace trimmed.
 * @returns array of `Announcement` (empty if no match).
 */
export function announcementsForCategory(
  countryIso: string,
  categoryId: string,
): Announcement[] {
  const isoNeedle = countryIso.trim().toUpperCase();
  const catNeedle = categoryId.trim().toLowerCase();
  return ANNOUNCEMENTS.filter(
    (a) => a.countryIso === isoNeedle && a.categoryId === catNeedle,
  );
}

/**
 * Return all announcements whose `expectedEffectiveAt` is within
 * `withinDays` days of now (absolute distance — both upcoming and
 * recently-effective entries are surfaced).
 *
 * @param withinDays - window size in days. Negative values are treated as 0.
 * @returns array of `Announcement`.
 */
export function upcomingAnnouncements(withinDays: number): Announcement[] {
  const days = Math.max(0, withinDays);
  const now = Date.now();
  const windowMs = days * DAY_MS;
  return ANNOUNCEMENTS.filter((a) => {
    const t = Date.parse(a.expectedEffectiveAt);
    if (Number.isNaN(t)) return false;
    return Math.abs(t - now) <= windowMs;
  });
}

/**
 * Look up an announcement by its unique slug id.
 *
 * @param id - exact slug id (e.g. "us-h1b-cap-reform-2026-q2")
 * @returns the matching `Announcement`, or `undefined` if not found.
 */
export function getAnnouncementById(id: string): Announcement | undefined {
  return ANNOUNCEMENTS.find((a) => a.id === id);
}
