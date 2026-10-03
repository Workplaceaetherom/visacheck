// VisaCheck rules engine endpoint — store-nothing by design.
// Receives answers + lang + countryIso + categoryId, evaluates in-memory, returns verdicts.
// Nothing is logged, nothing is persisted. The PENDING_HUMAN_CLICK gate runs in the engine.

import { NextRequest, NextResponse } from 'next/server';
import { runCheck } from '@/lib/rules-engine';
import { Lang, SUPPORTED_LANGS } from '@/lib/i18n';
import { Answers, RuleCategory } from '@/lib/rules-data';
import { getCountry } from '@/lib/countries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: RuleCategory[] = [
  'skilled_worker', 'student', 'visitor', 'family', 'business', 'investor',
];

export async function POST(req: NextRequest) {
  // STORE-NOTHING: read body, evaluate, return.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'bad_json', message: 'Expected JSON body.' },
      { status: 400 }
    );
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json(
      { error: 'bad_body', message: 'Expected an object body.' },
      { status: 400 }
    );
  }

  const obj = body as Record<string, unknown>;
  const langRaw = typeof obj.lang === 'string' ? (obj.lang as Lang) : 'en';
  const lang: Lang = SUPPORTED_LANGS.includes(langRaw) ? langRaw : 'en';

  const countryIsoRaw = typeof obj.countryIso === 'string' ? obj.countryIso : '';
  const country = getCountry(countryIsoRaw);
  if (!country) {
    return NextResponse.json(
      { error: 'unknown_country', message: 'Country not supported. See /api/countries.' },
      { status: 400 }
    );
  }

  const categoryIdRaw = typeof obj.categoryId === 'string' ? obj.categoryId : 'all';
  const categoryId: RuleCategory | 'all' =
    categoryIdRaw === 'all' || VALID_CATEGORIES.includes(categoryIdRaw as RuleCategory)
      ? (categoryIdRaw as RuleCategory | 'all')
      : 'all';

  // Extract answers defensively — only whitelisted fields, primitive coercion.
  const answers: Answers = {
    age: typeof obj.age === 'number' && Number.isFinite(obj.age) ? obj.age : 0,
    education: ['secondary','diploma','bachelor','master','doctorate'].includes(obj.education as string)
      ? (obj.education as Answers['education']) : '',
    maritalStatus: ['single','married','partner'].includes(obj.maritalStatus as string)
      ? (obj.maritalStatus as Answers['maritalStatus']) : '',
    employmentStatus: ['employed','self_employed','student','unemployed'].includes(obj.employmentStatus as string)
      ? (obj.employmentStatus as Answers['employmentStatus']) : '',
    workExperienceYears: typeof obj.workExperienceYears === 'number' && Number.isFinite(obj.workExperienceYears) ? obj.workExperienceYears : 0,
    nationality: typeof obj.nationality === 'string' ? obj.nationality.trim() : '',
    applyingFromOutsideUK: typeof obj.applyingFromOutsideUK === 'boolean' ? obj.applyingFromOutsideUK : true,
    jobTitle: typeof obj.jobTitle === 'string' ? obj.jobTitle.trim() : '',
    socCode: typeof obj.socCode === 'string' ? obj.socCode.trim() : '',
    salary: typeof obj.salary === 'number' && Number.isFinite(obj.salary) ? obj.salary : 0,
    hasCos: typeof obj.hasCos === 'boolean' ? obj.hasCos : false,
    sponsorLicensed:
      obj.sponsorLicensed === 'yes' || obj.sponsorLicensed === 'no' || obj.sponsorLicensed === 'unsure'
        ? (obj.sponsorLicensed as Answers['sponsorLicensed'])
        : 'unsure',
    newEntrant: typeof obj.newEntrant === 'boolean' ? obj.newEntrant : false,
    englishMet: typeof obj.englishMet === 'boolean' ? obj.englishMet : false,
    fundsMet: typeof obj.fundsMet === 'boolean' ? obj.fundsMet : false,
    ihsAware: typeof obj.ihsAware === 'boolean' ? obj.ihsAware : false,
    criminalCert: typeof obj.criminalCert === 'boolean' ? obj.criminalCert : false,
    passportValid: typeof obj.passportValid === 'boolean' ? obj.passportValid : false,
    admissionOffer: typeof obj.admissionOffer === 'boolean' ? obj.admissionOffer : false,
    studyFundsMet: typeof obj.studyFundsMet === 'boolean' ? obj.studyFundsMet : false,
    relationshipProof: typeof obj.relationshipProof === 'boolean' ? obj.relationshipProof : false,
    sponsorIncomeMet: typeof obj.sponsorIncomeMet === 'boolean' ? obj.sponsorIncomeMet : false,
    businessPlan: typeof obj.businessPlan === 'boolean' ? obj.businessPlan : false,
    investmentAmount: typeof obj.investmentAmount === 'number' && Number.isFinite(obj.investmentAmount) ? obj.investmentAmount : 0,
    visitPurposeValid: typeof obj.visitPurposeValid === 'boolean' ? obj.visitPurposeValid : false,
    returnTicket: typeof obj.returnTicket === 'boolean' ? obj.returnTicket : false,
    healthInsurance: typeof obj.healthInsurance === 'boolean' ? obj.healthInsurance : false,
  };

  // Empty payload guard — refuse to evaluate against blank answers.
  const meaningful =
    answers.nationality.length > 0 ||
    answers.jobTitle.length > 0 ||
    answers.salary > 0 ||
    answers.hasCos ||
    answers.admissionOffer ||
    answers.investmentAmount > 0 ||
    answers.relationshipProof ||
    answers.visitPurposeValid;
  if (!meaningful) {
    return NextResponse.json(
      { error: 'empty_answers', message: 'Please answer at least one question.' },
      { status: 400 }
    );
  }

  const result = runCheck(answers, lang, country.iso, categoryId);

  const res = NextResponse.json(result, { status: 200 });
  // Never cache the response — it contains user-derived data.
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

// GET — basic endpoint info, no user data, can be cached briefly.
export async function GET() {
  const body = {
    schema: 'visacheck/endpoint-info',
    method: 'POST',
    storeNothing: true,
    accepts: ['countryIso', 'categoryId', 'lang', ...'answer fields'],
    categories: VALID_CATEGORIES,
  };
  const res = NextResponse.json(body, { status: 200 });
  res.headers.set('Cache-Control', 'public, max-age=300');
  return res;
}
