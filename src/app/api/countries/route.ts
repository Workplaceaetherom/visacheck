// VisaCheck countries endpoint — read-only, lists supported destination countries.
// Stable data — cache aggressively.

import { NextResponse } from 'next/server';
import { COUNTRIES } from '@/lib/countries';

export const runtime = 'nodejs';

export async function GET() {
  const body = {
    schema: 'visacheck/countries/v1',
    count: COUNTRIES.length,
    fetchedAt: new Date().toISOString(),
    countries: COUNTRIES.map((c) => ({
      iso: c.iso,
      flag: c.flag,
      name: c.name,
      authority: c.authority,
      currency: c.currency,
      officialLanguage: c.officialLanguage,
      timezone: c.timezone,
      available: c.available,
      categoryIds: c.categoryIds,
      popularRoutes: c.popularRoutes,
    })),
  };
  const res = NextResponse.json(body, { status: 200 });
  res.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}
