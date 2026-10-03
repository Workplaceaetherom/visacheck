// VisaCheck comparison endpoint — returns rules for multiple countries + a category.
// Store-nothing: no user answers, just the published rule data for comparison.
// Used by the comparison UI to show side-by-side requirements across destinations.

import { NextRequest, NextResponse } from 'next/server';
import { RULES } from '@/lib/rules-data';
import { COUNTRIES } from '@/lib/countries';
import { Lang, SUPPORTED_LANGS } from '@/lib/i18n';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const countries = url.searchParams.get('countries')?.trim() ?? '';
  const categoryId = url.searchParams.get('category')?.trim().toLowerCase() ?? '';
  const langParam = url.searchParams.get('lang')?.trim() ?? 'en';
  const lang: Lang = SUPPORTED_LANGS.includes(langParam as Lang) ? (langParam as Lang) : 'en';

  if (!categoryId) {
    return NextResponse.json(
      { error: 'missing_category', message: 'Parameter "category" is required.' },
      { status: 400 }
    );
  }

  const isoList = countries
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s))
    .slice(0, 4); // max 4 countries for comparison

  if (isoList.length < 2) {
    return NextResponse.json(
      { error: 'need_at_least_2', message: 'Provide at least 2 country ISO codes in the "countries" parameter.' },
      { status: 400 }
    );
  }

  // Validate all countries exist
  const validCountries = isoList
    .map((iso) => COUNTRIES.find((c) => c.iso === iso))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  if (validCountries.length < 2) {
    return NextResponse.json(
      { error: 'invalid_countries', message: 'One or more country codes are not supported.' },
      { status: 400 }
    );
  }

  // Gather rules for each country + category
  const comparison = validCountries.map((country) => {
    const rules = RULES.filter(
      (r) => r.countryIso === country.iso && r.category === categoryId
    ).map((r) => ({
      id: r.id,
      title: r.title[lang] ?? r.title.en,
      summary: r.summary[lang] ?? r.summary.en,
      source: r.source,
      authority: r.authority,
      lastUpdated: r.lastUpdated,
      effectiveFrom: r.effectiveFrom,
      proposedChange: r.proposedChange
        ? {
            status: r.proposedChange.status,
            summary: r.proposedChange.summary,
            expectedEffectiveAt: r.proposedChange.expectedEffectiveAt,
            sourceUrl: r.proposedChange.sourceUrl,
          }
        : undefined,
    }));

    return {
      country: {
        iso: country.iso,
        flag: country.flag,
        name: country.name,
        authority: country.authority,
        currency: country.currency,
        officialLanguage: country.officialLanguage,
        timezone: country.timezone,
      },
      ruleCount: rules.length,
      rules,
    };
  });

  const body = {
    schema: 'visacheck/compare/v1',
    categoryId,
    lang,
    fetchedAt: new Date().toISOString(),
    comparison,
  };

  const res = NextResponse.json(body, { status: 200 });
  // Cache for 10 minutes — comparison data is relatively stable
  res.headers.set('Cache-Control', 'public, max-age=600, s-maxage=1800');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}
