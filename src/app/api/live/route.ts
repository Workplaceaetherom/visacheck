// VisaCheck — Live destination intelligence endpoint.
//
// When a user picks a destination country, the client calls this route, which
// fetches REAL-TIME immigration-policy news from Google News RSS (no API key
// required) and returns parsed, relevance-filtered headlines with a simple
// policy-mood sentiment gauge computed from headline vocabulary.
//
// Design notes:
// - Google News RSS supports per-country editions (hl/gl/ceid) and query
//   operators like `when:60d`, so results are genuinely live and geo-scoped.
// - In-memory TTL cache per country (5 min) to be polite to upstream and fast
//   for repeat visitors. No user data is stored — only public feed payloads.
// - On any upstream failure we return 502 with `fallback: 'curated'` so the UI
//   can gracefully show the curated official announcements instead.
// - Relevance filter keeps ONLY headlines that actually concern visas /
//   immigration / borders / settlement for that country, dropping generic
//   stories that merely mention one of those words in passing.

import { NextRequest, NextResponse } from 'next/server';
import { getCountry } from '@/lib/countries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes per country
const UPSTREAM_TIMEOUT_MS = 9000;
const MAX_ITEMS = 10;

interface CacheEntry {
  fetchedAt: number;
  payload: LivePayload;
}
const cache = new Map<string, CacheEntry>();

export interface LiveHeadline {
  title: string;
  link: string;
  publishedAt: string; // ISO
  source: string; // publisher name from <source> tag when present
  sentiment: 'restrictive' | 'friendly' | 'neutral';
}

export interface LiveSentimentGauge {
  restrictive: number;
  friendly: number;
  neutral: number;
  /** -1 (hostile climate) .. +1 (welcoming climate) */
  score: number;
  label: 'restrictive' | 'tightening' | 'mixed' | 'opening' | 'welcoming';
}

interface LivePayload {
  schema: 'visacheck/live/v1';
  countryIso: string;
  countryName: string;
  fetchedAt: string;
  cached: boolean;
  headlines: LiveHeadline[];
  sentiment: LiveSentimentGauge;
  searchUrl: string;
}

// ---- Google News locale mapping per ISO -------------------------------
// hl = language, gl = region, ceid = edition. Falls back to US English.
const GN_LOCALE: Record<string, { hl: string; gl: string; ceid: string }> = {
  GB: { hl: 'en-GB', gl: 'GB', ceid: 'GB:en' },
  US: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  CA: { hl: 'en-CA', gl: 'CA', ceid: 'CA:en' },
  AU: { hl: 'en-AU', gl: 'AU', ceid: 'AU:en' },
  DE: { hl: 'de', gl: 'DE', ceid: 'DE:de' },
  AE: { hl: 'en', gl: 'AE', ceid: 'AE:en-USA' },
  SG: { hl: 'en', gl: 'SG', ceid: 'SG:en' },
  NZ: { hl: 'en-NZ', gl: 'NZ', ceid: 'NZ:en' },
  IE: { hl: 'en-IE', gl: 'IE', ceid: 'IE:en' },
  FR: { hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  NL: { hl: 'nl', gl: 'NL', ceid: 'NL:nl' },
  ES: { hl: 'es', gl: 'ES', ceid: 'ES:es' },
  PT: { hl: 'pt-br', gl: 'PT', ceid: 'PT:pt-150' },
  IT: { hl: 'it', gl: 'IT', ceid: 'IT:it' },
  SE: { hl: 'sv', gl: 'SE', ceid: 'SE:sv' },
  JP: { hl: 'ja', gl: 'JP', ceid: 'JP:ja' },
  KR: { hl: 'ko', gl: 'KR', ceid: 'KR:ko' },
  HK: { hl: 'zh-HK', gl: 'HK', ceid: 'HK:zh-Hant' },
  SA: { hl: 'ar', gl: 'SA', ceid: 'SA:ar' },
  MY: { hl: 'en', gl: 'MY', ceid: 'MY:en' },
  BR: { hl: 'pt-br', gl: 'BR', ceid: 'BR:pt-BR' },
};

// Local-language immigration terms so non-English feeds stay relevant.
const LOCAL_TERMS: Record<string, string[]> = {
  de: ['einwanderung', 'visum', 'asyl', 'fachkräfte', 'aufenthalt'],
  fr: ['immigration', 'visa', 'asile', 'séjour', 'naturalisation'],
  nl: ['immigratie', 'visum', 'asiel', 'verblijf'],
  es: ['inmigración', 'visado', 'visa', 'asilo', 'extranjería'],
  pt: ['imigração', 'visto', 'asilo', 'nacionalidade'],
  it: ['immigrazione', 'visto', 'asilo', 'permesso di soggiorno'],
  sv: ['invandring', 'visum', 'uppehållstillstånd'],
  ja: ['移民', 'ビザ', '在留', '入管'],
  ko: ['이민', '비자', '체류', '국적'],
  zh: ['移民', '签证', '居留', '入境'],
  ar: ['هجرة', 'تأشيرة', 'إقامة', 'جنسية'],
};

// Words that make a headline immigration-relevant AT ALL.
// Strong terms: a single hit makes the headline immigration-relevant.
const STRONG_RELEVANCE_TERMS = [
  'immigrat', 'emigrat', 'migration', 'migrant', 'asylum', 'refugee',
  'citizenship', 'naturali', 'residency', 'work permit', 'express entry',
  'green card', 'permanent residence', 'deport', 'entry clearance',
  'sponsorship', 'skilled worker', 'points-based', 'visa scheme', 'visa rule',
  'einwanderung', 'fachkräfte', 'asyl', 'aufenthaltstitel', 'abschiebung',
  'immigrazione', 'invandring', 'immigratie', 'inmigración', 'imigração',
  'uppehållstillstånd', 'verblijf', 'asiel', 'extranjería',
  '移民', '在留', '入管', '이민', '체류', '签证', '居留', 'هجرة', 'تأشيرة',
];

// Weak terms: only count when paired with a policy word (2-of-2 rule),
// which filters out consumer "best credit card" style noise.
const WEAK_TERMS = ['visa', 'visas', 'border', 'permit', 'removal', 'settlement', 'passport'];
const POLICY_CONTEXT_TERMS = [
  'rule', 'rules', 'policy', 'law', 'reform', 'scheme', 'program', 'programme',
  'government', 'minister', 'ministry', 'agency', 'quota', 'cap', 'ban', 'cut',
  'fee', 'salary', 'threshold', 'requirement', 'apply', 'application', 'applicant',
  'worker', 'student', 'graduate', 'sponsor', 'renewal', 'nationale', 'politik',
  'gesetz', 'regierung', 'migrationspaket', 'politique', 'prefecture',
  'governo', 'minist', 'réglement', '政策', '制度', '入管', '難民', '정책', '비자',
  '新政', '规定', 'قانون', 'وزارة',
];

// Headline vocabulary signalling a TIGHTENING / restrictive direction.
const RESTRICTIVE_WORDS = [
  'ban', 'banned', 'tougher', 'tighten', 'tightening', 'cut', 'cuts', 'cap', 'caps', 'capped',
  'limit', 'limits', 'raise', 'raises', 'increase', 'increases', 'scraps', 'scrap', 'axed',
  'deport', 'deportation', 'removal', 'remove', 'crackdown', 'crack down', 'deny', 'denied',
  'reject', 'rejected', 'suspend', 'suspended', 'pause', 'paused', 'closed', 'closes', 'closure',
  'record low', 'backlog', 'queue', 'delay', 'delays', 'overhaul', 'harder', 'stricter',
  'restrict', 'restriction', 'fine', 'fined', 'penalty', 'abolish', 'abolished',
  'ends', 'ended', 'curb', 'curbs', 'expel', 'excluded',
];

// Headline vocabulary signalling a WELCOMING / opening direction.
const FRIENDLY_WORDS = [
  'welcome', 'welcomes', 'opens', 'open', 'expand', 'expands', 'expansion', 'new route',
  'new visa', 'new pathway', 'pathway', 'launch', 'launches', 'introduce', 'introduces',
  'boost', 'boosts', 'shortage', 'labor shortage', 'labour shortage', 'skills shortage',
  'recruit', 'recruits', 'fast-track', 'fast track', 'ease', 'eases', 'relax', 'relaxes',
  'relaxation', 'extend', 'extends', 'extension', 'amnesty', 'regulariz', 'legaliz',
  'grant', 'grants', 'approve', 'approved', 'approval', 'eligible', 'invitation',
  'attract', 'talent',
];

function normalize(s: string): string {
  return s.normalize('NFKD').toLowerCase();
}

function containsAny(haystack: string, words: string[]): boolean {
  return words.some((w) => haystack.includes(w));
}

function classifySentiment(title: string): 'restrictive' | 'friendly' | 'neutral' {
  const h = normalize(title);
  const r = containsAny(h, RESTRICTIVE_WORDS);
  const f = containsAny(h, FRIENDLY_WORDS);
  if (r && !f) return 'restrictive';
  if (f && !r) return 'friendly';
  return 'neutral'; // both or neither → no clear signal
}

function buildGauge(headlines: LiveHeadline[]): LiveSentimentGauge {
  let restrictive = 0;
  let friendly = 0;
  let neutral = 0;
  for (const h of headlines) {
    if (h.sentiment === 'restrictive') restrictive++;
    else if (h.sentiment === 'friendly') friendly++;
    else neutral++;
  }
  const total = headlines.length || 1;
  const raw = (friendly - restrictive) / total; // -1..+1
  const score = Math.round(raw * 100) / 100;
  let label: LiveSentimentGauge['label'];
  if (score <= -0.35) label = 'restrictive';
  else if (score < -0.1) label = 'tightening';
  else if (score <= 0.1) label = 'mixed';
  else if (score < 0.35) label = 'opening';
  else label = 'welcoming';
  return { restrictive, friendly, neutral, score, label };
}

// Minimal RSS item extractor — Google News feeds are well-formed single-line
// XML; regex parsing avoids shipping an XML parser dependency.
function extractItems(xml: string): LiveHeadline[] {
  const out: LiveHeadline[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && out.length < 40) {
    const block = m[1];
    const title = decodeEntities(firstMatch(block, /<title>([\s\S]*?)<\/title>/) ?? '');
    const link = (firstMatch(block, /<link>([\s\S]*?)<\/link/) ?? '').trim();
    const pub = (firstMatch(block, /<pubDate>([\s\S]*?)<\/pubDate>/) ?? '').trim();
    const source = decodeEntities(firstMatch(block, /<source[^>]*>([\s\S]*?)<\/source>/) ?? '');
    if (!title || !link) continue;
    let iso = '';
    const t = Date.parse(pub);
    if (!Number.isNaN(t)) iso = new Date(t).toISOString();
    out.push({ title, link, publishedAt: iso, source, sentiment: classifySentiment(title) });
  }
  return out;
}

function firstMatch(s: string, re: RegExp): string | null {
  const m = re.exec(s);
  return m ? m[1] : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRelevant(title: string, localTerms: string[]): boolean {
  const h = normalize(title);
  if (containsAny(h, STRONG_RELEVANCE_TERMS)) return true;
  if (containsAny(h, localTerms)) return true;
  // Weak term alone is not enough — require a policy-context word too.
  return containsAny(h, WEAK_TERMS) && containsAny(h, POLICY_CONTEXT_TERMS);
}

async function fetchGoogleNews(query: string, loc: { hl: string; gl: string; ceid: string }): Promise<string> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${loc.hl}&gl=${loc.gl}&ceid=${loc.ceid}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'VisaCheckBot/1.0 (destination intelligence)' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`gn_${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const iso = url.searchParams.get('country')?.trim().toUpperCase() ?? '';
  if (!iso || iso.length !== 2) {
    return NextResponse.json({ error: 'missing_country' }, { status: 400 });
  }
  const country = getCountry(iso);
  if (!country) {
    return NextResponse.json({ error: 'unknown_country' }, { status: 400 });
  }

  // Serve from cache when fresh.
  const hit = cache.get(iso);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ...hit.payload, cached: true });
  }

  const loc = GN_LOCALE[iso] ?? GN_LOCALE.US;
  const enName = country.name.en;
  const localTerms = LOCAL_TERMS[loc.hl.split('-')[0]] ?? [];
  // Two queries merged: broad immigration policy + visa-specific changes.
  const queries = [
    `"${enName}" (visa OR immigration OR "work permit" OR citizenship) when:60d`,
    `${enName} immigration policy (rules OR points OR quota OR asylum OR deportation) when:60d`,
  ];

  try {
    const bodies = await Promise.allSettled(queries.map((q) => fetchGoogleNews(q, loc)));
    const seen = new Set<string>();
    let items: LiveHeadline[] = [];
    for (const b of bodies) {
      if (b.status !== 'fulfilled') continue;
      for (const it of extractItems(b.value)) {
        const key = it.title.toLowerCase().replace(/[^a-z]/g, '').slice(0, 60);
        if (seen.has(key)) continue;
        seen.add(key);
        items.push(it);
      }
    }
    // Keep only immigration-relevant headlines, most recent first.
    items = items
      .filter((it) => isRelevant(it.title, localTerms))
      .sort((a, b) => Date.parse(b.publishedAt || '0') - Date.parse(a.publishedAt || '0'))
      .slice(0, MAX_ITEMS);

    const payload: LivePayload = {
      schema: 'visacheck/live/v1',
      countryIso: iso,
      countryName: enName,
      fetchedAt: new Date().toISOString(),
      cached: false,
      headlines: items,
      sentiment: buildGauge(items),
      searchUrl: `https://news.google.com/search?q=${encodeURIComponent(queries[0])}&hl=${loc.hl}&gl=${loc.gl}&ceid=${loc.ceid}`,
    };
    cache.set(iso, { fetchedAt: Date.now(), payload });
    const res = NextResponse.json(payload);
    res.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    return res;
  } catch {
    // Stale-cache fallback beats nothing at all.
    if (hit) {
      return NextResponse.json({ ...hit.payload, cached: true, stale: true });
    }
    return NextResponse.json(
      { error: 'live_unavailable', fallback: 'curated', countryIso: iso },
      { status: 502 }
    );
  }
}
