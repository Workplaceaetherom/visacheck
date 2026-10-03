// VisaCheck currency + locale helpers.
// Pure functions — no I/O, no storage.

import { COUNTRIES } from '@/lib/countries';

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  CAD: 'C$',
  AUD: 'A$',
  EUR: '€',
  AED: 'د.إ',
  SGD: 'S$',
  NZD: 'NZ$',
  SEK: 'kr',
  JPY: '¥',
  KRW: '₩',
  HKD: 'HK$',
  SAR: '﷼',
  MYR: 'RM',
  BRL: 'R$',
};

const CURRENCY_NAMES: Record<string, string> = {
  GBP: 'GBP', USD: 'USD', CAD: 'CAD', AUD: 'AUD', EUR: 'EUR', AED: 'AED',
  SGD: 'SGD', NZD: 'NZD', SEK: 'SEK', JPY: 'JPY', KRW: 'KRW', HKD: 'HKD',
  SAR: 'SAR', MYR: 'MYR', BRL: 'BRL',
};

/**
 * Get the currency symbol for a country ISO code.
 * Falls back to the ISO code itself if unknown.
 */
export function currencySymbol(countryIso: string): string {
  const country = COUNTRIES.find((c) => c.iso === countryIso.toUpperCase());
  if (!country) return '$';
  return CURRENCY_SYMBOLS[country.currency] ?? country.currency;
}

/**
 * Get the currency code (e.g. "USD", "GBP") for a country ISO code.
 */
export function currencyCode(countryIso: string): string {
  const country = COUNTRIES.find((c) => c.iso === countryIso.toUpperCase());
  return country?.currency ?? 'USD';
}

/**
 * Format a number as a currency string for the given country.
 * Uses Intl.NumberFormat for proper grouping.
 */
export function formatCurrency(amount: number, countryIso: string): string {
  const code = currencyCode(countryIso);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOLS[code] ?? ''}${amount.toLocaleString()}`;
  }
}

/**
 * Get the authority's domain (e.g. "gov.uk", "uscis.gov") for display.
 * Used to replace hardcoded "gov.uk" references in the UI.
 */
export function authorityDomain(countryIso: string): string {
  const country = COUNTRIES.find((c) => c.iso === countryIso.toUpperCase());
  if (!country) return 'the official authority';
  try {
    const url = new URL(country.authority.url);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return country.authority.shortName;
  }
}

/**
 * Build a deep-link share URL for a country + category selection.
 * The URL uses the hash fragment (not query string) so no data is sent to the server.
 * Format: /#/{countryIso}/{categoryId}
 * This is store-nothing: only the selection is encoded, never user answers.
 */
export function buildShareUrl(countryIso: string, categoryId: string): string {
  if (typeof window === 'undefined') return '';
  const base = window.location.origin + window.location.pathname;
  return `${base}#/${countryIso.toUpperCase()}/${categoryId}`;
}

/**
 * Parse a share URL hash fragment back into { countryIso, categoryId }.
 * Returns null if the hash is missing or malformed.
 */
export function parseShareUrl(hash: string): { countryIso: string; categoryId: string } | null {
  // Expected format: /#/GB/skilled_worker
  const match = hash.match(/^#\/([A-Z]{2})\/([a-z_]+)$/);
  if (!match) return null;
  return { countryIso: match[1], categoryId: match[2] };
}
