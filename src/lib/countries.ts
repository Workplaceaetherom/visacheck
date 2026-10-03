// VisaCheck — supported destination countries registry.
//
// This module is pure data. No I/O, no React, no storage.
// Add new countries by appending to COUNTRIES.
//
// Each entry captures the published-rule context for a destination country:
//   - identity (ISO alpha-2, emoji flag, localized names)
//   - the official immigration authority that owns the rules + a deep link to its guidance
//   - practical metadata (currency, official language, IANA timezone)
//   - which visa category IDs are loaded for this country (see rules-data.ts)
//   - the top origin nationalities that typically apply here (used to surface popular routes)
//
// Localization: name and authority.name ship in en / ur (Urdu, RTL) / bn (Bengali),
// matching the LANG_META contract in src/lib/i18n.ts.

/**
 * A destination country supported by VisaCheck.
 *
 * `available` reflects whether rule data has been loaded for this country.
 * A country can be listed here with `available: false` to advertise "coming soon"
 * without breaking the engine.
 */
export interface Country {
  /** ISO 3166-1 alpha-2 code, uppercase (e.g. "GB", "US", "CA", "AU", "DE", "AE"). */
  iso: string;
  /** Emoji regional-indicator flag (e.g. "🇬🇧", "🇺🇸", "🇨🇦", "🇦🇺", "🇩🇪", "🇦🇪"). */
  flag: string;
  /** Localized country name in en / ur / bn. */
  name: { en: string; ur: string; bn: string };
  /** Official immigration authority that owns the published rules. */
  authority: {
    /** Localized official authority name in en / ur / bn. */
    name: { en: string; ur: string; bn: string };
    /** Short regulator acronym / brand used in UI badges (e.g. "UKVI", "USCIS"). */
    shortName: string;
    /** Official guidance landing page (https). */
    url: string;
  };
  /** ISO 4217 currency code (e.g. "GBP", "USD", "CAD", "AUD", "EUR", "AED"). */
  currency: string;
  /** Official language(s) as a human-readable string (e.g. "English", "English/French"). */
  officialLanguage: string;
  /** IANA timezone string for the country's capital / primary business hub. */
  timezone: string;
  /** true if rule data is loaded for this country; false marks "coming soon". */
  available: boolean;
  /** Visa category IDs available for this country (see rules-data.ts). */
  categoryIds: string[];
  /** Top origin nationalities that typically apply here (e.g. ["India","Pakistan","Nigeria"]). */
  popularRoutes: string[];
}

/**
 * Registry of supported destination countries.
 * Append new entries here; do not mutate at runtime.
 */
export const COUNTRIES: Country[] = [
  {
    iso: 'GB',
    flag: '🇬🇧',
    name: {
      en: 'United Kingdom',
      ur: 'برطانیہ',
      bn: 'যুক্তরাজ্য',
    },
    authority: {
      name: {
        en: 'UK Visas and Immigration',
        ur: 'یوکے وی آئی',
        bn: 'ইউকেভিআই',
      },
      shortName: 'UKVI',
      url: 'https://www.gov.uk/browse/visas-immigration',
    },
    currency: 'GBP',
    officialLanguage: 'English',
    timezone: 'Europe/London',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['India', 'Pakistan', 'Nigeria', 'Bangladesh'],
  },
  {
    iso: 'US',
    flag: '🇺🇸',
    name: {
      en: 'United States',
      ur: 'امریکہ',
      bn: 'যুক্তরাষ্ট্র',
    },
    authority: {
      name: {
        en: 'U.S. Citizenship and Immigration Services',
        ur: 'یوایسسیس',
        bn: 'ইউএসসিআইএস',
      },
      shortName: 'USCIS',
      url: 'https://www.uscis.gov/',
    },
    currency: 'USD',
    officialLanguage: 'English',
    timezone: 'America/New_York',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['India', 'China', 'Mexico', 'Philippines'],
  },
  {
    iso: 'CA',
    flag: '🇨🇦',
    name: {
      en: 'Canada',
      ur: 'کینیڈا',
      bn: 'কানাডা',
    },
    authority: {
      name: {
        en: 'Immigration, Refugees and Citizenship Canada',
        ur: 'آئرسی',
        bn: 'আইআরসিসি',
      },
      shortName: 'IRCC',
      url: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
    },
    currency: 'CAD',
    officialLanguage: 'English/French',
    timezone: 'America/Toronto',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['India', 'Philippines', 'China', 'Nigeria'],
  },
  {
    iso: 'AU',
    flag: '🇦🇺',
    name: {
      en: 'Australia',
      ur: 'آسٹریلیا',
      bn: 'অস্ট্রেলিয়া',
    },
    authority: {
      name: {
        en: 'Department of Home Affairs',
        ur: 'ہوم افیئرز',
        bn: 'হোম অ্যাফেয়ার্স',
      },
      shortName: 'Home Affairs',
      url: 'https://immi.homeaffairs.gov.au/',
    },
    currency: 'AUD',
    officialLanguage: 'English',
    timezone: 'Australia/Sydney',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['India', 'China', 'UK', 'Philippines'],
  },
  {
    iso: 'DE',
    flag: '🇩🇪',
    name: {
      en: 'Germany',
      ur: 'جرمنی',
      bn: 'জার্মানি',
    },
    authority: {
      name: {
        en: 'Federal Office for Migration and Refugees',
        ur: 'بامف',
        bn: 'বিএএমএফ',
      },
      shortName: 'BAMF',
      url: 'https://www.bamf.de/EN/',
    },
    currency: 'EUR',
    officialLanguage: 'German',
    timezone: 'Europe/Berlin',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['Turkey', 'Syria', 'India', 'Romania'],
  },
  {
    iso: 'AE',
    flag: '🇦🇪',
    name: {
      en: 'United Arab Emirates',
      ur: 'متحدہ عرب امارات',
      bn: 'সংযুক্ত আরব আমিরাত',
    },
    authority: {
      name: {
        en: 'Federal Authority for Identity and Citizenship',
        ur: 'آئیسیپی',
        bn: 'আইসিপি',
      },
      shortName: 'ICP',
      url: 'https://icp.gov.ae/en/',
    },
    currency: 'AED',
    officialLanguage: 'Arabic',
    timezone: 'Asia/Dubai',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['India', 'Pakistan', 'Egypt', 'Philippines'],
  },
  {
    iso: 'SG',
    flag: '🇸🇬',
    name: {
      en: 'Singapore',
      ur: 'سنگاپور',
      bn: 'সিঙ্গাপুর',
    },
    authority: {
      name: {
        en: 'Ministry of Manpower',
        ur: 'محکمہ افرادی قوت',
        bn: 'শ্রম মন্ত্রণালয়',
      },
      shortName: 'MOM',
      url: 'https://www.mom.gov.sg/',
    },
    currency: 'SGD',
    officialLanguage: 'English/Malay/Tamil',
    timezone: 'Asia/Singapore',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['India', 'China', 'Malaysia', 'Indonesia'],
  },
  {
    iso: 'NZ',
    flag: '🇳🇿',
    name: {
      en: 'New Zealand',
      ur: 'نیوزی لینڈ',
      bn: 'নিউজিল্যান্ড',
    },
    authority: {
      name: {
        en: 'Immigration New Zealand',
        ur: 'امیگریشن نیوزی لینڈ',
        bn: 'ইমিগ্রেশন নিউজিল্যান্ড',
      },
      shortName: 'INZ',
      url: 'https://www.immigration.govt.nz/',
    },
    currency: 'NZD',
    officialLanguage: 'English/Maori',
    timezone: 'Pacific/Auckland',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['India', 'China', 'UK', 'Philippines'],
  },
  {
    iso: 'IE',
    flag: '🇮🇪',
    name: {
      en: 'Ireland',
      ur: 'آئرلینڈ',
      bn: 'আয়ারল্যান্ড',
    },
    authority: {
      name: {
        en: 'Irish Naturalisation and Immigration Service',
        ur: 'آئرش نیچرلائزیشن اینڈ امیگریشن سروس',
        bn: 'আইরিশ ন্যাচারালাইজেশন অ্যান্ড ইমিগ্রেশন সার্ভিস',
      },
      shortName: 'INIS',
      url: 'https://www.irishimmigration.ie/',
    },
    currency: 'EUR',
    officialLanguage: 'English/Irish',
    timezone: 'Europe/Dublin',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family', 'business', 'investor'],
    popularRoutes: ['India', 'Brazil', 'Nigeria', 'Poland'],
  },
  {
    iso: 'FR',
    flag: '🇫🇷',
    name: {
      en: 'France',
      ur: 'فرانس',
      bn: 'ফ্রান্স',
    },
    authority: {
      name: {
        en: "Office Français de l'Immigration et de l'Intégration",
        ur: 'آفس فرانسیز ڈے لیمیگریشن اے ڈے لانٹیگریشن',
        bn: 'অফিস ফ্রান্সে দে লিমিগ্রেশন এ দে লান্তেগ্রেশন',
      },
      shortName: 'OFII',
      url: 'https://www.ofii.fr/',
    },
    currency: 'EUR',
    officialLanguage: 'French',
    timezone: 'Europe/Paris',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family'],
    popularRoutes: ['Morocco', 'Algeria', 'Tunisia', 'Senegal'],
  },
  {
    iso: 'NL',
    flag: '🇳🇱',
    name: {
      en: 'Netherlands',
      ur: 'نیدرلینڈز',
      bn: 'নেদারল্যান্ডস',
    },
    authority: {
      name: {
        en: 'Immigration and Naturalisation Service',
        ur: 'امیگریشن اور نیچرلائزیشن سروس',
        bn: 'ইমিগ্রেশন অ্যান্ড ন্যাচারালাইজেশন সার্ভিস',
      },
      shortName: 'IND',
      url: 'https://ind.nl/',
    },
    currency: 'EUR',
    officialLanguage: 'Dutch',
    timezone: 'Europe/Amsterdam',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family'],
    popularRoutes: ['India', 'Turkey', 'Morocco', 'Poland'],
  },
  {
    iso: 'ES',
    flag: '🇪🇸',
    name: {
      en: 'Spain',
      ur: 'ہسپانیہ',
      bn: 'স্পেন',
    },
    authority: {
      name: {
        en: 'Oficina de Extranjería',
        ur: 'آفسینا ڈی ایکسٹرانجیریا',
        bn: 'অফিসিনা দে এক্সট্রানজেরিয়া',
      },
      shortName: 'Extranjería',
      url: 'https://www.extranjeria.inmigracion.gob.es/',
    },
    currency: 'EUR',
    officialLanguage: 'Spanish',
    timezone: 'Europe/Madrid',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family'],
    popularRoutes: ['Morocco', 'Romania', 'UK', 'Colombia'],
  },
  {
    iso: 'PT',
    flag: '🇵🇹',
    name: {
      en: 'Portugal',
      ur: 'پرتگال',
      bn: 'পর্তুগাল',
    },
    authority: {
      name: {
        en: 'Serviço de Estrangeiros e Fronteiras',
        ur: 'سرویسو ڈی اسٹرنجیرس ای فرنٹیرس',
        bn: 'সেরভিকো দে এস্ট্রাঞ্জিরোস ই ফ্রন্টেইরাস',
      },
      shortName: 'AIMA',
      url: 'https://aima.gov.pt/',
    },
    currency: 'EUR',
    officialLanguage: 'Portuguese',
    timezone: 'Europe/Lisbon',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family'],
    popularRoutes: ['Brazil', 'Angola', 'Cape Verde', 'UK'],
  },
  {
    iso: 'IT',
    flag: '🇮🇹',
    name: {
      en: 'Italy',
      ur: 'اٹلی',
      bn: 'ইতালি',
    },
    authority: {
      name: {
        en: "Sportello Unico per l'Immigrazione",
        ur: 'اسپورٹیلو اونیکو پیر لیممیگرازیونی',
        bn: 'স্পোর্টেল্লো উনিকো পের লিমিগ্রাজিওনি',
      },
      shortName: 'SUI',
      url: 'https://www.interno.gov.it/it/temi/immigrazione-e-asilo',
    },
    currency: 'EUR',
    officialLanguage: 'Italian',
    timezone: 'Europe/Rome',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family'],
    popularRoutes: ['Romania', 'Morocco', 'Albania', 'Bangladesh'],
  },
  {
    iso: 'SE',
    flag: '🇸🇪',
    name: {
      en: 'Sweden',
      ur: 'سویڈن',
      bn: 'সুইডেন',
    },
    authority: {
      name: {
        en: 'Swedish Migration Agency',
        ur: 'سویڈش مائیگریشن ایجنسی',
        bn: 'সুইডিশ মাইগ্রেশন এজেন্সি',
      },
      shortName: 'Migrationsverket',
      url: 'https://www.migrationsverket.se/',
    },
    currency: 'SEK',
    officialLanguage: 'Swedish',
    timezone: 'Europe/Stockholm',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'family'],
    popularRoutes: ['Syria', 'Afghanistan', 'India', 'Iraq'],
  },
  {
    iso: 'JP',
    flag: '🇯🇵',
    name: {
      en: 'Japan',
      ur: 'جاپان',
      bn: 'জাপান',
    },
    authority: {
      name: {
        en: 'Immigration Services Agency',
        ur: 'امیگریشن سروسز ایجنسی',
        bn: 'ইমিগ্রেশন সার্ভিসেস এজেন্সি',
      },
      shortName: 'ISA',
      url: 'https://www.moj.go.jp/isa/',
    },
    currency: 'JPY',
    officialLanguage: 'Japanese',
    timezone: 'Asia/Tokyo',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor'],
    popularRoutes: ['China', 'Vietnam', 'Philippines', 'Brazil'],
  },
  {
    iso: 'KR',
    flag: '🇰🇷',
    name: {
      en: 'South Korea',
      ur: 'جنوبی کوریا',
      bn: 'দক্ষিণ কোরিয়া',
    },
    authority: {
      name: {
        en: 'Korea Immigration Service',
        ur: 'کوریا امیگریشن سروس',
        bn: 'কোরিয়া ইমিগ্রেশন সার্ভিস',
      },
      shortName: 'KIS',
      url: 'https://www.hikorea.go.kr/',
    },
    currency: 'KRW',
    officialLanguage: 'Korean',
    timezone: 'Asia/Seoul',
    available: true,
    categoryIds: ['skilled_worker', 'student'],
    popularRoutes: ['China', 'Vietnam', 'Thailand', 'USA'],
  },
  {
    iso: 'HK',
    flag: '🇭🇰',
    name: {
      en: 'Hong Kong',
      ur: 'ہانگ کانگ',
      bn: 'হং কং',
    },
    authority: {
      name: {
        en: 'Immigration Department',
        ur: 'محکمہ امیگریشن',
        bn: 'ইমিগ্রেশন বিভাগ',
      },
      shortName: 'ImmD',
      url: 'https://www.immd.gov.hk/',
    },
    currency: 'HKD',
    officialLanguage: 'Chinese/English',
    timezone: 'Asia/Hong_Kong',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor'],
    popularRoutes: ['Philippines', 'Indonesia', 'India', 'UK'],
  },
  {
    iso: 'SA',
    flag: '🇸🇦',
    name: {
      en: 'Saudi Arabia',
      ur: 'سعودی عرب',
      bn: 'সৌদি আরব',
    },
    authority: {
      name: {
        en: 'Saudi Passport Directorate',
        ur: 'سعودی پاسپورٹ ڈائریکٹوریٹ',
        bn: 'সৌদি পাসপোর্ট অধিদপ্তর',
      },
      shortName: 'Jawazat',
      url: 'https://www.spa.gov.sa/',
    },
    currency: 'SAR',
    officialLanguage: 'Arabic',
    timezone: 'Asia/Riyadh',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor'],
    popularRoutes: ['Egypt', 'India', 'Pakistan', 'Philippines'],
  },
  {
    iso: 'MY',
    flag: '🇲🇾',
    name: {
      en: 'Malaysia',
      ur: 'ملائیشیا',
      bn: 'মালয়েশিয়া',
    },
    authority: {
      name: {
        en: 'Immigration Department of Malaysia',
        ur: 'محکمہ امیگریشن ملائیشیا',
        bn: 'ইমিগ্রেশন বিভাগ মালয়েশিয়া',
      },
      shortName: 'JIM',
      url: 'https://www.imi.gov.my/',
    },
    currency: 'MYR',
    officialLanguage: 'Malay',
    timezone: 'Asia/Kuala_Lumpur',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor'],
    popularRoutes: ['Indonesia', 'Bangladesh', 'Nepal', 'India'],
  },
  {
    iso: 'BR',
    flag: '🇧🇷',
    name: {
      en: 'Brazil',
      ur: 'برازیل',
      bn: 'ব্রাজিল',
    },
    authority: {
      name: {
        en: 'Conselho Nacional de Imigração',
        ur: 'کونسیلو ناسیونال ڈی امیگراسائو',
        bn: 'কনসেলহো ন্যাসিওনাল দে ইমিগ্রাসাও',
      },
      shortName: 'CNIg',
      url: 'http://www.migrante.gov.br/',
    },
    currency: 'BRL',
    officialLanguage: 'Portuguese',
    timezone: 'America/Sao_Paulo',
    available: true,
    categoryIds: ['skilled_worker', 'student', 'visitor', 'family'],
    popularRoutes: ['Portugal', 'Haiti', 'Venezuela', 'Bolivia'],
  },
];

/**
 * Look up a country by its ISO 3166-1 alpha-2 code. Case-insensitive.
 *
 * @param iso - 2-letter country code (e.g. "GB", "gb", "Gb")
 * @returns the matching `Country`, or `undefined` if not found.
 */
export function getCountry(iso: string): Country | undefined {
  const needle = iso.trim().toUpperCase();
  return COUNTRIES.find((c) => c.iso === needle);
}

/**
 * All supported destination flags joined by a single space.
 * Quick-reference string for UI surfaces (e.g. hero meta, manifest badges).
 * Order matches the order of `COUNTRIES`.
 */
export const SUPPORTED_FLAGS: string = COUNTRIES.map((c) => c.flag).join(' ');
