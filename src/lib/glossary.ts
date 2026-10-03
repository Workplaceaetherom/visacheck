// VisaCheck glossary — plain-language explanations of visa terms.
// Pure data module — no I/O, no React, no storage.

import type { Lang } from '@/lib/i18n';

export interface GlossaryTerm {
  term: string;
  acronym?: string;
  explanation: { en: string; ur: string; bn: string };
  category: 'sponsorship' | 'financial' | 'language' | 'general' | 'health';
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Certificate of Sponsorship',
    acronym: 'CoS',
    explanation: {
      en: 'A digital record assigned by a licensed sponsor that allows you to apply for a work visa. It contains details about the job, salary, and your personal information.',
      ur: 'ایک ڈیجیٹل ریکارڈ جو لائسنس یافتہ اسپانسر کے ذریعہ فراہم کیا جاتا ہے جو آپ کو ورک ویزے کے لیے درخواست دینے کی اجازت دیتا ہے۔ اس میں نوکری، تنخواہ، اور آپ کی ذاتی معلومات شامل ہوتی ہیں۔',
      bn: 'একটি ডিজিটাল রেকর্ড যা একজন লাইসেন্সপ্রাপ্ত স্পন্সর দ্বারা নির্ধারিত হয় যা আপনাকে ওয়ার্ক ভিসার জন্য আবেদন করার অনুমতি দেয়। এতে কাজ, বেতন এবং আপনার ব্যক্তিগত তথ্য অন্তর্ভুক্ত থাকে।',
    },
    category: 'sponsorship',
  },
  {
    term: 'Confirmation of Acceptance for Studies',
    acronym: 'CAS',
    explanation: {
      en: 'A reference number issued by a licensed student sponsor (university/college) that confirms you have an unconditional offer of a place on a course.',
      ur: 'ایک ریفرنس نمبر جو لائسنس یافتہ اسٹوڈنٹ اسپانسر (یونیورسٹی/کالج) کے ذریعے جاری کیا جاتا ہے جو تصدیق کرتا ہے کہ آپ کے پاس کورس میں ایک غیر مشروط پیشکش ہے۔',
      bn: 'একটি রেফারেন্স নম্বর যা একজন লাইসেন্সপ্রাপ্ত ছাত্র স্পন্সর (বিশ্ববিদ্যালয়/কলেজ) দ্বারা জারি করা হয় যা নিশ্চিত করে যে আপনার কাছে একটি কোর্সে নিঃশর্ত প্রস্তাব রয়েছে।',
    },
    category: 'sponsorship',
  },
  {
    term: 'Common European Framework of Reference',
    acronym: 'CEFR',
    explanation: {
      en: 'An international standard for describing language ability. Six levels from A1 (beginner) to C2 (mastery). Most work visas require B1 (intermediate) or above.',
      ur: 'زبان کی صلاحیت کو بیان کرنے کے لیے ایک بین الاقوامی معیار۔ چھ لیولز A1 (ابتدائی) سے C2 (مہارت) تک۔ زیادہ تر ورک ویزا B1 (درمیانی) یا اس سے زیادہ کی ضرورت کرتے ہیں۔',
      bn: 'ভাষার দক্ষতা বর্ণনা করার জন্য একটি আন্তর্জাতিক মান। ছয়টি স্তর A1 (শিক্ষানবিশ) থেকে C2 (দক্ষতা) পর্যন্ত। বেশিরভাগ ওয়ার্ক ভিসা B1 (মধ্যবর্তী) বা তার বেশি প্রয়োজন।',
    },
    category: 'language',
  },
  {
    term: 'Immigration Health Surcharge',
    acronym: 'IHS',
    explanation: {
      en: 'A fee paid by visa applicants that gives access to the UK National Health Service (NHS) during their stay. Currently £1,035 per year for adults.',
      ur: 'ویزا درخواست گزاروں کی طرف سے ادا کیا جانے والا فیس جو آپ کے قیام کے دوران برطانوی نیشنل ہیلتھ سروس (NHS) تک رسائی دیتا ہے۔ فی الحال بالغوں کے لیے £1,035 سالانہ ہے۔',
      bn: 'ভিসা আবেদনকারীদের দ্বারা পরিশোধিত একটি ফি যা আপনার অবস্থানকালে যুক্তরাজ্যের জাতীয় স্বাস্থ্য পরিষেবা (NHS) অ্যাক্সেস দেয়। বর্তমানে প্রাপ্তবয়স্কদের জন্য £1,035 প্রতি বছর।',
    },
    category: 'health',
  },
  {
    term: 'Standard Occupational Classification',
    acronym: 'SOC',
    explanation: {
      en: 'A system used to classify occupations by skill level and type. Visa rules use SOC codes to determine the going rate salary for each job.',
      ur: 'پیشوں کو مہارت کی سطح اور قسم کے مطابق درجہ بندی کرنے کے لیے استعمال کیا جانے والا نظام۔ ویزا قواعد ہر نوکری کے لیے گوئنگ ریٹ تنخواہ کا تعین کرنے کے لیے SOC کوڈز استعمال کرتے ہیں۔',
      bn: 'দক্ষতার স্তর এবং ধরন অনুসারে পেশা শ্রেণীবদ্ধ করতে ব্যবহৃত একটি সিস্টেম। ভিসা নিয়ম প্রতিটি কাজের জন্য গোয়িং রেট বেতন নির্ধারণ করতে SOC কোড ব্যবহার করে।',
    },
    category: 'general',
  },
  {
    term: 'Biometric Residence Permit',
    acronym: 'BRP',
    explanation: {
      en: 'A card that proves your immigration status in the UK. It contains your biometric data (fingerprints, photo) and visa details.',
      ur: 'ایک کارڈ جو برطانیہ میں آپ کے امیگریشن کے درجے کا ثبوت ہے۔ اس میں آپ کے بایو میٹرک ڈیٹا (فنگر پرنٹس، تصویر) اور ویزا کی تفصیلات شامل ہیں۔',
      bn: 'একটি কার্ড যা যুক্তরাজ্যে আপনার অভিবাসন অবস্থার প্রমাণ। এতে আপনার বায়োমেট্রিক ডেটা (ফিঙ্গারপ্রিন্ট, ছবি) এবং ভিসার বিবরণ অন্তর্ভুক্ত।',
    },
    category: 'general',
  },
  {
    term: 'Indefinite Leave to Remain',
    acronym: 'ILR',
    explanation: {
      en: 'Permanent residency status in the UK. After holding ILR for 12 months, you may be eligible to apply for British citizenship.',
      ur: 'برطانیہ میں مستقل رہائش کا درجہ۔ ILR رکھنے کے 12 ماہ بعد، آپ برطانوی شہریت کے لیے درخواست دینے کے اہل ہو سکتے ہیں۔',
      bn: 'যুক্তরাজ্যে স্থায়ী বাসস্থানের অবস্থা। ILR ধরে রাখার ১২ মাস পর, আপনি ব্রিটিশ নাগরিকত্বের জন্য আবেদন করার যোগ্য হতে পারেন।',
    },
    category: 'general',
  },
  {
    term: 'Express Entry',
    explanation: {
      en: 'Canada\'s immigration application system for skilled workers. It manages applications for Federal Skilled Worker, Federal Skilled Trades, and Canadian Experience Class programs.',
      ur: 'ہنر مند کارکنوں کے لیے کینیڈا کا امیگریشن درخواست سسٹم۔ یہ فیڈرل ہنر مند کارکن، فیڈرل ہنر مند تجارت، اور کینیڈین تجربہ کلاس پروگراموں کے لیے درخواستوں کا انتظام کرتا ہے۔',
      bn: 'দক্ষ কর্মীদের জন্য কানাডার অভিবাসন আবেদন সিস্টেম। এটি ফেডারেল স্কিলড ওয়ার্কার, ফেডারেল স্কিলড ট্রেডস, এবং কানাডিয়ান এক্সপেরিয়েন্স ক্লাস প্রোগ্রামের জন্য আবেদন পরিচালনা করে।',
    },
    category: 'general',
  },
  {
    term: 'Labor Condition Application',
    acronym: 'LCA',
    explanation: {
      en: 'A document filed by US employers with the Department of Labor before hiring an H-1B worker. It certifies the employer will pay the prevailing wage.',
      ur: 'ایچ-1بی ورکر کو ملازمت دینے سے پہلے امریکی ملازمین کی طرف سے محکمہ لیبر کے ساتھ داخل کیا جانے والا دستاویز۔ یہ تصدیق کرتا ہے کہ ملازم حاوی تنخواہ ادا کرے گا۔',
      bn: 'একজন H-1B কর্মী নিয়োগ করার আগে মার্কিন নিয়োগকারীদের দ্বারা শ্রম বিভাগে দাখিলকৃত একটি নথি। এটি নিশ্চিত করে যে নিয়োগকর্তা প্রচলিত বেতন প্রদান করবে।',
    },
    category: 'financial',
  },
  {
    term: 'Designated Learning Institution',
    acronym: 'DLI',
    explanation: {
      en: 'A school approved by a provincial or territorial government to host international students in Canada. You must have an acceptance letter from a DLI to apply for a study permit.',
      ur: 'ایک اسکول جو بین الاقوامی طلبہ کو میزبانی کرنے کے لیے صوبائی یا علاقائی حکومت کے ذریعہ منظور کیا گیا ہے۔ آپ کے پاس اسٹڈی پرمٹ کے لیے درخواست دینے کے لیے DLI سے قبولیت کا خط ہونا چاہیے।',
      bn: 'একটি স্কুল যা আন্তর্জাতিক শিক্ষার্থীদের হোস্ট করার জন্য প্রাদেশিক বা আঞ্চলিক সরকার দ্বারা অনুমোদিত। স্টাডি পারমিটের জন্য আবেদন করতে আপনার কাছে DLI থেকে গ্রহণের চিঠি থাকতে হবে।',
    },
    category: 'sponsorship',
  },
  {
    term: 'Temporary Skill Shortage',
    acronym: 'TSS',
    explanation: {
      en: 'An Australian work visa (subclass 482) that allows employers to sponsor overseas workers for positions they cannot fill locally. Has short-term and medium-term streams.',
      ur: 'ایک آسٹریلوی ورک ویزا (سب کلاس 482) جو ملازمین کو ان عہدوں کے لیے غیر ملکی کارکنوں کو اسپانسر کرنے کی اجازت دیتا ہے جو وہ مقامی طور پر پُر نہیں کر سکتے۔ اس میں شارٹ ٹرم اور میڈیم ٹرم سٹریمز ہیں۔',
      bn: 'একটি অস্ট্রেলিয়ান ওয়ার্ক ভিসা (সাবক্লাস 482) যা নিয়োগকারীদের এমন পদের জন্য বিদেশী কর্মীদের স্পন্সর করার অনুমতি দেয় যা তারা স্থানীয়ভাবে পূরণ করতে পারে না। শর্ট-টার্ম এবং মিডিয়াম-টার্ম স্ট্রিম রয়েছে।',
    },
    category: 'sponsorship',
  },
  {
    term: 'Maintenance Funds',
    explanation: {
      en: 'Money you must show you have to support yourself without relying on public funds. The amount and holding period (usually 28 days) vary by country and visa type.',
      ur: 'پیسہ جو آپ کو دکھانا ہوتا ہے کہ آپ پبلک فنڈز پر انحصار کیے بغیر اپنی مدد کر سکتے ہیں۔ رقم اور حراست کی مدت (عام طور پر 28 دن) ملک اور ویزا کی قسم کے لحاظ سے مختلف ہوتی ہے۔',
      bn: 'টাকা যা আপনাকে দেখাতে হবে যে আপনি পাবলিক ফান্ডের উপর নির্ভর না করে নিজেকে সমর্থন করতে পারেন। পরিমাণ এবং ধরে রাখার সময়কাল (সাধারণত ২৮ দিন) দেশ এবং ভিসার ধরন অনুযায়ী ভিন্ন।',
    },
    category: 'financial',
  },
  {
    term: 'Tuberculosis Test',
    acronym: 'TB Test',
    explanation: {
      en: 'A medical test required for visa applicants from certain countries. Must be done at an approved clinic and is valid for 6 months. Required for stays over 6 months.',
      ur: 'مخصوص ممالک سے ویزا درخواست گزاروں کے لیے ضروری طبی ٹیسٹ۔ یہ منظور شدہ کلینک پر ہونا چاہیے اور 6 ماہ تک درست ہے۔ 6 ماہ سے زیادہ قیام کے لیے ضروری ہے۔',
      bn: 'নির্দিষ্ট দেশ থেকে ভিসা আবেদনকারীদের জন্য প্রয়োজনীয় একটি মেডিকেল পরীক্ষা। এটি একটি অনুমোদিত ক্লিনিকে করতে হবে এবং ৬ মাসের জন্য বৈধ। ৬ মাসের বেশি অবস্থানের জন্য প্রয়োজন।',
    },
    category: 'health',
  },
  {
    term: 'Biometrics',
    explanation: {
      en: 'The collection of fingerprints and a digital photograph at a visa application center. Most applicants must provide biometrics as part of their application.',
      ur: 'ویزا درخواست مرکز پر فنگر پرنٹس اور ڈیجیٹل تصویر کی جمع آوری۔ زیادہ تر درخواست گزاروں کو اپنی درخواست کے حصے کے طور پر بایو میٹرکس فراہم کرنے ہوتے ہیں।',
      bn: 'ভিসা আবেদন কেন্দ্রে ফিঙ্গারপ্রিন্ট এবং একটি ডিজিটাল ছবি সংগ্রহ। বেশিরভাগ আবেদনকারীকে তাদের আবেদনের অংশ হিসেবে বায়োমেট্রিক্স দিতে হবে।',
    },
    category: 'general',
  },
  {
    term: 'Priority Service',
    explanation: {
      en: 'A paid service that gives your visa application faster processing (usually within 5 working days). Costs extra on top of the standard visa fee.',
      ur: 'ایک ادا شدہ سروس جو آپ کی ویزا درخواست کو تیز عمل دیتا ہے (عام طور پر 5 کام کرنے والے دنوں میں)۔ معیاری ویزا فیس کے علاوہ اضافی لاگت۔',
      bn: 'একটি অর্থ প্রদানকৃত পরিষেবা যা আপনার ভিসা আবেদনকে দ্রুত প্রক্রিয়াকরণ দেয় (সাধারণত ৫ কর্মদিবসের মধ্যে)। মানক ভিসা ফির উপরে অতিরিক্ত খরচ।',
    },
    category: 'general',
  },
  {
    term: 'Schengen Visa',
    explanation: {
      en: 'A short-stay visa that allows travel within the 27 Schengen Area countries in Europe for up to 90 days in any 180-day period.',
      ur: 'ایک مختصر قیام کا ویزا جو یورپ میں 27 شینجن ایریا ممالک میں سفر کی اجازت دیتا ہے، 180 دن کی مدت میں 90 دن تک۔',
      bn: 'একটি স্বল্প-অবস্থান ভিসা যা ইউরোপের ২৭টি শেনজেন এলাকা দেশে ১৮০ দিনের যেকোনো সময়ে ৯০ দিন পর্যন্ত ভ্রমণের অনুমতি দেয়।',
    },
    category: 'general',
  },
  {
    term: 'Points-Based System',
    acronym: 'PBS',
    explanation: {
      en: 'A visa system where applicants must earn enough points (from salary, qualifications, English, etc.) to qualify. Used by UK, Australia, and Canada.',
      ur: 'ایک ویزا سسٹم جہاں درخواست گزاروں کو اہل ہونے کے لیے کافی پوائنٹس (تنخواہ، قابلیت، انگریزی وغیرہ سے) حاصل کرنے ہوتے ہیں۔ برطانیہ، آسٹریلیا، اور کینیڈا کے استعمال شدہ۔',
      bn: 'একটি ভিসা সিস্টেম যেখানে আবেদনকারীদের যোগ্য হতে পর্যাপ্ত পয়েন্ট (বেতন, যোগ্যতা, ইংরেজি ইত্যাদি থেকে) অর্জন করতে হবে। যুক্তরাজ্য, অস্ট্রেলিয়া এবং কানাডা দ্বারা ব্যবহৃত।',
    },
    category: 'general',
  },
  {
    term: 'Prevailing Wage',
    explanation: {
      en: 'The minimum wage rate that employers must pay to foreign workers in a specific occupation and location. Set by the Department of Labor in the US.',
      ur: 'کم سے کم تنخواہ کی شرح جو ملازمین کو ایک مخصوص پیشے اور مقام میں غیر ملکی کارکنوں کو ادا کرنی ہوتی ہے۔ امریکا میں محکمہ لیبر کے ذریعہ مقرر۔',
      bn: 'ন্যূনতম মজুরি হার যা নিয়োগকারীদের একটি নির্দিষ্ট পেশা এবং অবস্থানে বিদেশী কর্মীদের দিতে হবে। মার্কিন যুক্তরাষ্ট্রে শ্রম বিভাগ দ্বারা নির্ধারিত।',
    },
    category: 'financial',
  },
  {
    term: 'No Recourse to Public Funds',
    acronym: 'NRPF',
    explanation: {
      en: 'A condition on many visas that prevents the holder from claiming most state benefits, including Universal Credit, housing benefit, and council tax support.',
      ur: 'بہت سے ویزاں پر ایک شرط جو دھارہ کو زیادہ تر ریاستی فوائد، بشمول یونیورسل کریڈٹ، ہاؤسنگ بینیفٹ، اور کونسل ٹیکس سپورٹ کا دعوی کرنے سے روکتی ہے۔',
      bn: 'অনেক ভিসায় একটি শর্ত যা ধারককে বেশিরভাগ রাষ্ট্রীয় সুবিধা, যার মধ্যে ইউনিভার্সাল ক্রেডিট, হাউজিং সুবিধা এবং কাউন্সিল ট্যাক্স সমর্থন দাবি করতে বাধা দেয়।',
    },
    category: 'financial',
  },
];

export const GLOSSARY_CATEGORIES: { id: GlossaryTerm['category']; label: { en: string; ur: string; bn: string } }[] = [
  { id: 'sponsorship', label: { en: 'Sponsorship', ur: 'اسپانسرشپ', bn: 'স্পন্সরশিপ' } },
  { id: 'financial', label: { en: 'Financial', ur: 'مالی', bn: 'আর্থিক' } },
  { id: 'language', label: { en: 'Language', ur: 'زبان', bn: 'ভাষা' } },
  { id: 'health', label: { en: 'Health', ur: 'صحت', bn: 'স্বাস্থ্য' } },
  { id: 'general', label: { en: 'General', ur: 'عمومی', bn: 'সাধারণ' } },
];

export function getGlossaryTerm(term: string, lang: Lang = 'en'): GlossaryTerm | undefined {
  const lower = term.toLowerCase();
  return GLOSSARY.find(
    (g) =>
      g.term.toLowerCase() === lower ||
      g.acronym?.toLowerCase() === lower
  );
}
