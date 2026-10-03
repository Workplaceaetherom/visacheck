'use client';

import { useVisaStore, EMPTY_ANSWERS } from './store';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowRight,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMemo } from 'react';
import type { Answers } from '@/lib/rules-data';
import type { CheckResult } from '@/lib/rules-engine';
import { DestinationPicker } from './pickers';
import { COUNTRIES } from '@/lib/countries';
import { VISA_CATEGORIES } from '@/lib/visa-categories';
import { currencySymbol, currencyCode } from '@/lib/format';
import { getOccupationSystem } from '@/lib/occupation-systems';
import { stepsForCategory, validateStep } from './wizard-steps';

const COUNTRY_HINTS = [
  'Afghanistan', 'Bangladesh', 'Brazil', 'Canada', 'China', 'Egypt', 'Ghana',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Jamaica', 'Malaysia',
  'Malta', 'Nigeria', 'Pakistan', 'Philippines', 'Singapore', 'South Africa',
  'Sri Lanka', 'Sudan', 'Thailand', 'Trinidad and Tobago', 'USA',
  'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'United Kingdom', 'Germany',
  'Australia', 'Mexico', 'Turkey', 'Syria', 'Romania',
];

export function Wizard() {
  const {
    lang, step, setStep, setStage, answers, patchAnswers, setResult, submitting,
    setSubmitting, resetAnswers, countryIso, categoryId,
  } = useVisaStore();

  const steps = useMemo(() => stepsForCategory(categoryId), [categoryId]);
  const meta = steps[step];
  const Icon = meta.icon;
  const isLast = step === steps.length - 1;
  const currentStepId = meta.id;

  const canProceed = useMemo(() => {
    if (currentStepId === 0) return !!countryIso && !!categoryId;
    return validateStep(currentStepId, answers);
  }, [currentStepId, answers, countryIso, categoryId]);

  const onNext = () => {
    if (!canProceed) {
      toast.error(t(lang, 'e_validation'));
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };

  const onBack = () => {
    if (step > 0) setStep(step - 1);
    else setStage('home');
  };

  const onSubmit = async () => {
    if (!countryIso || !categoryId) {
      toast.error(t(lang, 'e_validation'));
      return;
    }
    setSubmitting(true);
    const tid = toast.loading(t(lang, 'submitting'));
    try {
      const payload: Record<string, unknown> = {
        ...answers,
        lang,
        countryIso,
        categoryId,
      };
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        mode: 'same-origin',
      });
      if (!res.ok) throw new Error('http_' + res.status);
      const data: CheckResult = await res.json();
      setResult(data);
      // Track in recently checked (in-memory only)
      if (countryIso && categoryId) {
        useVisaStore.getState().addRecentCheck(countryIso, categoryId);
      }
      toast.dismiss(tid);
      setSubmitting(false);
      setStage('results');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      toast.dismiss(tid);
      setSubmitting(false);
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        toast.error(t(lang, 'e_offline'));
      } else {
        toast.error(t(lang, 'e_generic'));
      }
    }
  };

  const onRestart = () => {
    resetAnswers();
    setStage('home');
  };

  const country = countryIso ? COUNTRIES.find((c) => c.iso === countryIso) : null;
  const category = categoryId ? VISA_CATEGORIES.find((c) => c.id === categoryId) : null;

  return (
    <main id="main" className="vc-container flex-1 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header: country + category context */}
        {country && category && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">{country.flag}</span>
              <span className="font-semibold">{country.name[lang]}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-base" aria-hidden="true">{category.icon}</span>
              <span className="font-medium">{category.name[lang]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] font-medium">
                {country.authority.shortName}
              </Badge>
              <button
                onClick={onRestart}
                className="text-muted-foreground hover:text-foreground"
                aria-label={t(lang, 'change_country')}
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Step header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:underline"
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t(lang, 'back')}
          </button>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t(lang, 'step_label', { n: step + 1, total: steps.length })}
          </span>
          <button
            onClick={onRestart}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            aria-label="Restart"
          >
            ✕
          </button>
        </div>

        {/* Progress bar + Step dots */}
        <div className="mb-8">
          {/* Progress bar */}
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs font-bold tabular-nums text-muted-foreground">
              {Math.round(((step + 1) / steps.length) * 100)}%
            </span>
          </div>
          {/* Step dots */}
          <ol className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Steps">
            {steps.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'todo';
              return (
                <li key={s.id} className="flex items-center gap-1.5">
                  <span
                    className="vc-step-dot"
                    data-state={state}
                    aria-current={i === step ? 'step' : undefined}
                    aria-label={`Step ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="h-px w-4 bg-border sm:w-6" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Step content */}
        <Card className="vc-card vc-fade" key={step}>
          <CardContent className="p-6 sm:p-8">
            <div className="mb-5 flex items-start gap-3">
              <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="vc-display text-xl font-bold leading-tight">{t(lang, meta.titleKey)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t(lang, meta.descKey)}</p>
              </div>
            </div>

            {currentStepId === 0 && (
              <DestinationPicker
                onContinue={() => {
                  if (canProceed) setStep(1);
                }}
              />
            )}
            {currentStepId === 1 && <StepPersonal a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 2 && <Step1 a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 3 && <Step2 a={answers} patch={patchAnswers} lang={lang} countryIso={countryIso ?? undefined} />}
            {currentStepId === 4 && <Step7 a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 5 && <Step3 a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 6 && <Step4 a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 7 && <Step5 a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 8 && <Step6 a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 9 && <Step8 a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 10 && <Step9 a={answers} patch={patchAnswers} lang={lang} />}
            {currentStepId === 11 && <Step10 a={answers} patch={patchAnswers} lang={lang} countryIso={countryIso ?? undefined} />}
          </CardContent>
        </Card>

        {/* Footer actions — hidden on step 0 (DestinationPicker has its own Next button) */}
        {step > 0 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={onBack} disabled={submitting}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {t(lang, 'back')}
            </Button>
            {!isLast ? (
              <Button onClick={onNext} disabled={!canProceed} className="gap-1.5">
                {t(lang, 'next')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={onSubmit} disabled={submitting} className="gap-1.5">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                )}
                {t(lang, 'submit')}
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

interface StepProps {
  a: Answers;
  patch: (p: Partial<Answers>) => void;
  lang: 'en' | 'ur' | 'bn';
  countryIso?: string;
}

// StepPersonal — general personal profile (age, education, marital, employment, experience)
function StepPersonal({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      {/* Age */}
      <div className="space-y-1.5">
        <Label htmlFor="age">{t(lang, 'field_age')}</Label>
        <Input
          id="age"
          type="number"
          min={18}
          max={65}
          value={a.age === 0 ? '' : a.age}
          onChange={(e) => patch({ age: Number(e.target.value) || 0 })}
          placeholder="e.g. 28"
          inputMode="numeric"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">{t(lang, 'field_age_hint')}</p>
      </div>

      {/* Education */}
      <div className="space-y-2">
        <Label>{t(lang, 'field_education')}</Label>
        <select
          value={a.education}
          onChange={(e) => patch({ education: e.target.value as Answers['education'] })}
          className="w-full rounded-lg border border-border bg-card p-2.5 text-sm"
        >
          <option value="">— Select —</option>
          <option value="secondary">{t(lang, 'field_education_secondary')}</option>
          <option value="diploma">{t(lang, 'field_education_diploma')}</option>
          <option value="bachelor">{t(lang, 'field_education_bachelor')}</option>
          <option value="master">{t(lang, 'field_education_master')}</option>
          <option value="doctorate">{t(lang, 'field_education_doctorate')}</option>
        </select>
      </div>

      {/* Marital status */}
      <div className="space-y-2">
        <Label>{t(lang, 'field_marital_status')}</Label>
        <select
          value={a.maritalStatus}
          onChange={(e) => patch({ maritalStatus: e.target.value as Answers['maritalStatus'] })}
          className="w-full rounded-lg border border-border bg-card p-2.5 text-sm"
        >
          <option value="">— Select —</option>
          <option value="single">{t(lang, 'field_marital_single')}</option>
          <option value="married">{t(lang, 'field_marital_married')}</option>
          <option value="partner">{t(lang, 'field_marital_partner')}</option>
        </select>
      </div>

      {/* Employment status */}
      <div className="space-y-2">
        <Label>{t(lang, 'field_employment_status')}</Label>
        <select
          value={a.employmentStatus}
          onChange={(e) => patch({ employmentStatus: e.target.value as Answers['employmentStatus'] })}
          className="w-full rounded-lg border border-border bg-card p-2.5 text-sm"
        >
          <option value="">— Select —</option>
          <option value="employed">{t(lang, 'field_employment_employed')}</option>
          <option value="self_employed">{t(lang, 'field_employment_self_employed')}</option>
          <option value="student">{t(lang, 'field_employment_student')}</option>
          <option value="unemployed">{t(lang, 'field_employment_unemployed')}</option>
        </select>
      </div>

      {/* Work experience */}
      <div className="space-y-1.5">
        <Label htmlFor="experience">{t(lang, 'field_work_experience')}</Label>
        <Input
          id="experience"
          type="number"
          min={0}
          max={40}
          value={a.workExperienceYears === 0 ? '' : a.workExperienceYears}
          onChange={(e) => patch({ workExperienceYears: Number(e.target.value) || 0 })}
          placeholder="e.g. 5"
          inputMode="numeric"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">{t(lang, 'field_work_experience_hint')}</p>
      </div>
    </div>
  );
}

function Step1({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="nationality">{t(lang, 'field_nationality')}</Label>
        <Input
          id="nationality"
          list="countries"
          value={a.nationality}
          placeholder={t(lang, 'field_nationality_placeholder')}
          onChange={(e) => patch({ nationality: e.target.value })}
          autoComplete="country-name"
        />
        <datalist id="countries">
          {COUNTRY_HINTS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_current_visa')}</Label>
        <RadioGroup
          value={a.applyingFromOutsideUK ? 'outside' : 'inside'}
          onValueChange={(v) => patch({ applyingFromOutsideUK: v === 'outside' })}
          className="grid gap-2"
        >
          <RadioRow id="visa_outside" value="outside" label={t(lang, 'field_current_visa_yes')} checked={a.applyingFromOutsideUK} />
          <RadioRow id="visa_inside" value="inside" label={t(lang, 'field_current_visa_no')} checked={!a.applyingFromOutsideUK} />
        </RadioGroup>
      </div>
    </div>
  );
}

function Step2({ a, patch, lang, countryIso }: StepProps) {
  const sym = currencySymbol(countryIso ?? 'GB');
  const code = currencyCode(countryIso ?? 'GB');
  const occSystem = getOccupationSystem(countryIso ?? 'GB');
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="jobTitle">{t(lang, 'field_job_title')}</Label>
        <Input
          id="jobTitle"
          value={a.jobTitle}
          onChange={(e) => patch({ jobTitle: e.target.value })}
          placeholder="e.g. Senior software engineer"
          autoComplete="off"
        />
      </div>
      {occSystem && (
        <div className="space-y-1.5">
          <Label htmlFor="socCode">{occSystem.codeLabel}</Label>
          <Input
            id="socCode"
            value={a.socCode}
            onChange={(e) => patch({ socCode: e.target.value })}
            placeholder={occSystem.codePlaceholder}
            inputMode="numeric"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">{occSystem.codeHint}</p>
          <a
            href={occSystem.lookupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            Look up your code on the official site ↗
          </a>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="salary">
          {t(lang, 'field_salary')} <span className="text-muted-foreground">({code})</span>
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{sym}</span>
          <Input
            id="salary"
            type="number"
            min={0}
            step={500}
            value={a.salary === 0 ? '' : a.salary}
            onChange={(e) => patch({ salary: Number(e.target.value) || 0 })}
            placeholder="38700"
            inputMode="numeric"
            className="pl-8"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t(lang, 'field_salary_hint')}</p>
      </div>
    </div>
  );
}

function Step3({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(lang, 'field_has_cos')}</Label>
        <RadioGroup
          value={a.hasCos ? 'yes' : 'no'}
          onValueChange={(v) => patch({ hasCos: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="cos_yes" value="yes" label={t(lang, 'field_has_cos_yes')} checked={a.hasCos} />
          <RadioRow id="cos_no" value="no" label={t(lang, 'field_has_cos_no')} checked={!a.hasCos} />
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_sponsor_licensed')}</Label>
        <RadioGroup
          value={a.sponsorLicensed}
          onValueChange={(v) => patch({ sponsorLicensed: v as Answers['sponsorLicensed'] })}
          className="grid gap-2"
        >
          <RadioRow id="sl_yes" value="yes" label={t(lang, 'field_sponsor_licensed_yes')} checked={a.sponsorLicensed === 'yes'} />
          <RadioRow id="sl_no" value="unsure" label={t(lang, 'field_sponsor_licensed_no')} checked={a.sponsorLicensed === 'unsure'} />
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_new_entrant')}</Label>
        <RadioGroup
          value={a.newEntrant ? 'yes' : 'no'}
          onValueChange={(v) => patch({ newEntrant: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="ne_yes" value="yes" label={t(lang, 'field_new_entrant_yes')} checked={a.newEntrant} />
          <RadioRow id="ne_no" value="no" label={t(lang, 'field_new_entrant_no')} checked={!a.newEntrant} />
        </RadioGroup>
      </div>
    </div>
  );
}

function Step4({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(lang, 'field_english_met')}</Label>
        <RadioGroup
          value={a.englishMet ? 'yes' : 'no'}
          onValueChange={(v) => patch({ englishMet: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="en_yes" value="yes" label={t(lang, 'field_english_met_yes')} checked={a.englishMet} />
          <RadioRow id="en_no" value="no" label={t(lang, 'field_english_met_no')} checked={!a.englishMet} />
        </RadioGroup>
      </div>
    </div>
  );
}

function Step5({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(lang, 'field_funds_met')}</Label>
        <RadioGroup
          value={a.fundsMet ? 'yes' : 'no'}
          onValueChange={(v) => patch({ fundsMet: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="fu_yes" value="yes" label={t(lang, 'field_funds_met_yes')} checked={a.fundsMet} />
          <RadioRow id="fu_no" value="no" label={t(lang, 'field_funds_met_no')} checked={!a.fundsMet} />
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_ihs_aware')}</Label>
        <RadioGroup
          value={a.ihsAware ? 'yes' : 'no'}
          onValueChange={(v) => patch({ ihsAware: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="ihs_yes" value="yes" label={t(lang, 'field_ihs_aware_yes')} checked={a.ihsAware} />
          <RadioRow id="ihs_no" value="no" label={t(lang, 'field_ihs_aware_no')} checked={!a.ihsAware} />
        </RadioGroup>
      </div>
    </div>
  );
}

function Step6({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(lang, 'field_criminal_cert')}</Label>
        <RadioGroup
          value={a.criminalCert ? 'yes' : 'no'}
          onValueChange={(v) => patch({ criminalCert: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="cc_yes" value="yes" label={t(lang, 'field_criminal_cert_yes')} checked={a.criminalCert} />
          <RadioRow id="cc_no" value="no" label={t(lang, 'field_criminal_cert_no')} checked={!a.criminalCert} />
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_passport_valid')}</Label>
        <RadioGroup
          value={a.passportValid ? 'yes' : 'no'}
          onValueChange={(v) => patch({ passportValid: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="pp_yes" value="yes" label={t(lang, 'field_passport_valid_yes')} checked={a.passportValid} />
          <RadioRow id="pp_no" value="no" label={t(lang, 'field_passport_valid_no')} checked={!a.passportValid} />
        </RadioGroup>
      </div>
    </div>
  );
}

// Step 7 — Education (Student category)
function Step7({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(lang, 'field_admission_offer')}</Label>
        <RadioGroup
          value={a.admissionOffer ? 'yes' : 'no'}
          onValueChange={(v) => patch({ admissionOffer: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="ao_yes" value="yes" label={t(lang, 'field_admission_offer_yes')} checked={a.admissionOffer} />
          <RadioRow id="ao_no" value="no" label={t(lang, 'field_admission_offer_no')} checked={!a.admissionOffer} />
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_study_funds')}</Label>
        <RadioGroup
          value={a.studyFundsMet ? 'yes' : 'no'}
          onValueChange={(v) => patch({ studyFundsMet: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="sf_yes" value="yes" label={t(lang, 'field_study_funds_yes')} checked={a.studyFundsMet} />
          <RadioRow id="sf_no" value="no" label={t(lang, 'field_study_funds_no')} checked={!a.studyFundsMet} />
        </RadioGroup>
      </div>
    </div>
  );
}

// Step 8 — Relationship (Family category)
function Step8({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(lang, 'field_relationship_proof')}</Label>
        <RadioGroup
          value={a.relationshipProof ? 'yes' : 'no'}
          onValueChange={(v) => patch({ relationshipProof: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="rp_yes" value="yes" label={t(lang, 'field_relationship_proof_yes')} checked={a.relationshipProof} />
          <RadioRow id="rp_no" value="no" label={t(lang, 'field_relationship_proof_no')} checked={!a.relationshipProof} />
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_sponsor_income')}</Label>
        <RadioGroup
          value={a.sponsorIncomeMet ? 'yes' : 'no'}
          onValueChange={(v) => patch({ sponsorIncomeMet: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="si_yes" value="yes" label={t(lang, 'field_sponsor_income_yes')} checked={a.sponsorIncomeMet} />
          <RadioRow id="si_no" value="no" label={t(lang, 'field_sponsor_income_no')} checked={!a.sponsorIncomeMet} />
        </RadioGroup>
      </div>
    </div>
  );
}

// Step 9 — Visit (Visitor category)
function Step9({ a, patch, lang }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(lang, 'field_visit_purpose')}</Label>
        <RadioGroup
          value={a.visitPurposeValid ? 'yes' : 'no'}
          onValueChange={(v) => patch({ visitPurposeValid: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="vp_yes" value="yes" label={t(lang, 'field_visit_purpose_yes')} checked={a.visitPurposeValid} />
          <RadioRow id="vp_no" value="no" label={t(lang, 'field_visit_purpose_no')} checked={!a.visitPurposeValid} />
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_return_ticket')}</Label>
        <RadioGroup
          value={a.returnTicket ? 'yes' : 'no'}
          onValueChange={(v) => patch({ returnTicket: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="rt_yes" value="yes" label={t(lang, 'field_return_ticket_yes')} checked={a.returnTicket} />
          <RadioRow id="rt_no" value="no" label={t(lang, 'field_return_ticket_no')} checked={!a.returnTicket} />
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>{t(lang, 'field_health_insurance')}</Label>
        <RadioGroup
          value={a.healthInsurance ? 'yes' : 'no'}
          onValueChange={(v) => patch({ healthInsurance: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="hi_yes" value="yes" label={t(lang, 'field_health_insurance_yes')} checked={a.healthInsurance} />
          <RadioRow id="hi_no" value="no" label={t(lang, 'field_health_insurance_no')} checked={!a.healthInsurance} />
        </RadioGroup>
      </div>
    </div>
  );
}

// Step 10 — Investment (Business / Investor category)
function Step10({ a, patch, lang, countryIso }: StepProps) {
  const sym = currencySymbol(countryIso ?? 'GB');
  const code = currencyCode(countryIso ?? 'GB');
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t(lang, 'field_business_plan')}</Label>
        <RadioGroup
          value={a.businessPlan ? 'yes' : 'no'}
          onValueChange={(v) => patch({ businessPlan: v === 'yes' })}
          className="grid gap-2"
        >
          <RadioRow id="bp_yes" value="yes" label={t(lang, 'field_business_plan_yes')} checked={a.businessPlan} />
          <RadioRow id="bp_no" value="no" label={t(lang, 'field_business_plan_no')} checked={!a.businessPlan} />
        </RadioGroup>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="investmentAmount">
          {t(lang, 'field_investment_amount')} <span className="text-muted-foreground">({code})</span>
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{sym}</span>
          <Input
            id="investmentAmount"
            type="number"
            min={0}
            step={10000}
            value={a.investmentAmount === 0 ? '' : a.investmentAmount}
            onChange={(e) => patch({ investmentAmount: Number(e.target.value) || 0 })}
            placeholder="500000"
            inputMode="numeric"
            className="pl-8"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t(lang, 'field_investment_amount_hint')}</p>
      </div>
    </div>
  );
}

function RadioRow({
  id, value, label, checked,
}: {
  id: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <Label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
    >
      <RadioGroupItem value={value} id={id} />
      <span className="font-medium">{label}</span>
    </Label>
  );
}

export const _EMPTY = EMPTY_ANSWERS;
