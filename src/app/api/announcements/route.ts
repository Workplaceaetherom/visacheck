// VisaCheck announcements endpoint — read-only, country-filtered.
// Returns pending rule changes / consultations for the requested country.
// Cache-Control: short max-age so the UI auto-refreshes (simulating live rule updates).

import { NextRequest, NextResponse } from 'next/server';
import {
  announcementsForCountry,
  announcementsForCategory,
  upcomingAnnouncements,
} from '@/lib/announcements';
import { getCountry } from '@/lib/countries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const countryIso = url.searchParams.get('country')?.trim().toUpperCase() ?? '';
  const categoryId = url.searchParams.get('category')?.trim().toLowerCase() ?? '';
  const upcoming = url.searchParams.get('upcoming');

  const body: Record<string, unknown> = {
    schema: 'visacheck/announcements/v1',
    fetchedAt: new Date().toISOString(),
  };

  if (upcoming) {
    const days = Math.max(0, Math.min(365, parseInt(upcoming, 10) || 30));
    body.upcomingDays = days;
    body.announcements = upcomingAnnouncements(days);
  } else if (countryIso) {
    const country = getCountry(countryIso);
    if (!country) {
      return NextResponse.json(
        { error: 'unknown_country', message: 'Country not supported.' },
        { status: 400 }
      );
    }
    body.countryIso = country.iso;
    body.countryName = country.name.en;
    body.authority = country.authority;
    body.announcements = categoryId
      ? announcementsForCategory(country.iso, categoryId)
      : announcementsForCountry(country.iso);
  } else {
    // No filter — return all announcements (used by the global announcements feed).
    body.announcements = upcomingAnnouncements(365);
  }

  const res = NextResponse.json(body, { status: 200 });
  // Short max-age so the client auto-refreshes announcements periodically.
  // s-maxage for any CDN edge cache, stale-while-revalidate for liveness.
  res.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}
