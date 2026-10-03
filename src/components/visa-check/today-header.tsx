'use client';

import { useEffect, useState } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { CalendarDays, Clock, RefreshCw, Globe2 } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';

function formatDateLocalized(date: Date, lang: 'en' | 'ur' | 'bn'): string {
  // Intl with the user's locale code from our supported langs.
  const localeMap = { en: 'en-GB', ur: 'ur-PK', bn: 'bn-BD' };
  const locale = localeMap[lang] || 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTimeLocalized(date: Date, lang: 'en' | 'ur' | 'bn'): string {
  const localeMap = { en: 'en-GB', ur: 'ur-PK', bn: 'bn-BD' };
  return new Intl.DateTimeFormat(localeMap[lang] || 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date) + ' UTC';
}

export function TodayHeader() {
  const { lang, countryIso } = useVisaStore();
  const [now, setNow] = useState<Date | null>(null);

  // Tick every minute so the time stays current.
  // Initial state must be set in an effect because the server cannot compute "now".
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Get the destination country's timezone for display
  const country = countryIso ? COUNTRIES.find((c) => c.iso === countryIso) : null;
  const tzTime = now && country
    ? new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: country.timezone,
      }).format(now) + ' ' + country.timezone.split('/').pop()
    : null;

  return (
    <div className="vc-container py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="font-medium">{t(lang, 'today_is')}:</span>
          <span className="font-semibold text-foreground">
            {now ? formatDateLocalized(now, lang) : '—'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          {country && tzTime && (
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-medium">{country.flag}</span>
              <span>{tzTime}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-[spin_3s_linear_infinite]" aria-hidden="true" />
            <span>{t(lang, 'auto_refresh')}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
