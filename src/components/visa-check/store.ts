'use client';

// VisaCheck client state — Zustand. PECR-minimal: only vcLang, vcTheme, vcUsedOnce in localStorage.
// Country, category, answers, results, and wizard step live in-memory only.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Lang, SUPPORTED_LANGS } from '@/lib/i18n';
import type { CheckResult } from '@/lib/rules-engine';
import type { Answers } from '@/lib/rules-data';

export type VisaStage = 'home' | 'wizard' | 'results';

interface VisaState {
  // Persisted: language + used-once flag. (vcTheme handled by next-themes with storageKey vcTheme.)
  lang: Lang;
  usedOnce: boolean;
  // In-memory only — NEVER persisted.
  stage: VisaStage;
  step: number;
  countryIso: string | null;            // selected destination country (e.g. "GB", "US")
  categoryId: string | null;            // selected visa category (e.g. "skilled_worker")
  answers: Answers;
  result: CheckResult | null;
  submitting: boolean;
  lastAnnouncementFetch: number;       // epoch ms — for auto-refresh UI
  // actions
  setLang: (l: Lang) => void;
  setUsedOnce: (v: boolean) => void;
  setStage: (s: VisaStage) => void;
  setStep: (n: number) => void;
  setCountry: (iso: string | null) => void;
  setCategory: (id: string | null) => void;
  patchAnswers: (patch: Partial<Answers>) => void;
  resetAnswers: () => void;
  setResult: (r: CheckResult | null) => void;
  setSubmitting: (v: boolean) => void;
  markAnnouncementFetch: () => void;
  // Recently checked — in-memory only, never persisted
  recentChecks: { countryIso: string; categoryId: string; timestamp: number }[];
  addRecentCheck: (countryIso: string, categoryId: string) => void;
}

export const EMPTY_ANSWERS: Answers = {
  // Sensible default working age so points calculators & pathway scores are
  // meaningful out of the box; users overwrite it in the profile step.
  age: 30,
  education: '',
  maritalStatus: '',
  employmentStatus: '',
  workExperienceYears: 0,
  nationality: '',
  applyingFromOutsideUK: true,
  jobTitle: '',
  socCode: '',
  salary: 0,
  hasCos: false,
  sponsorLicensed: 'unsure',
  newEntrant: false,
  englishMet: false,
  fundsMet: false,
  ihsAware: false,
  criminalCert: false,
  passportValid: false,
  admissionOffer: false,
  studyFundsMet: false,
  relationshipProof: false,
  sponsorIncomeMet: false,
  businessPlan: false,
  investmentAmount: 0,
  visitPurposeValid: false,
  returnTicket: false,
  healthInsurance: false,
};

const safeLang = (l: string | null): Lang =>
  l && (SUPPORTED_LANGS as string[]).includes(l) ? (l as Lang) : 'en';

export const useVisaStore = create<VisaState>()(
  persist(
    (set) => ({
      lang: 'en',
      usedOnce: false,
      stage: 'home',
      step: 1,
      countryIso: null,
      categoryId: null,
      answers: { ...EMPTY_ANSWERS },
      result: null,
      submitting: false,
      lastAnnouncementFetch: 0,
      recentChecks: [],
      setLang: (l) => set({ lang: l }),
      setUsedOnce: (v) => set({ usedOnce: v }),
      setStage: (s) => set({ stage: s }),
      setStep: (n) => set({ step: n }),
      setCountry: (iso) => set({ countryIso: iso }),
      setCategory: (id) => set({ categoryId: id }),
      patchAnswers: (patch) =>
        set((state) => ({ answers: { ...state.answers, ...patch } })),
      resetAnswers: () => set({ answers: { ...EMPTY_ANSWERS }, step: 1, result: null }),
      setResult: (r) => set({ result: r }),
      setSubmitting: (v) => set({ submitting: v }),
      markAnnouncementFetch: () => set({ lastAnnouncementFetch: Date.now() }),
      addRecentCheck: (countryIso, categoryId) =>
        set((state) => {
          // Remove duplicates (same country+category), keep last 3, prepend new
          const filtered = state.recentChecks.filter(
            (r) => !(r.countryIso === countryIso && r.categoryId === categoryId)
          );
          return {
            recentChecks: [{ countryIso, categoryId, timestamp: Date.now() }, ...filtered].slice(0, 3),
          };
        }),
    }),
    {
      name: 'vcLang',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lang: state.lang,
        usedOnce: state.usedOnce,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!SUPPORTED_LANGS.includes(state.lang)) state.lang = 'en';
        }
      },
      migrate: (persisted: unknown) => {
        if (typeof persisted === 'string') {
          return { lang: safeLang(persisted), usedOnce: false } as Partial<VisaState>;
        }
        if (persisted && typeof persisted === 'object') {
          const p = persisted as Partial<VisaState>;
          return { lang: safeLang((p.lang as string) ?? 'en'), usedOnce: !!p.usedOnce };
        }
        return { lang: 'en', usedOnce: false };
      },
      version: 3,
    }
  )
);

export const ls = {
  get usedOnce(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('vcUsedOnce') === '1';
  },
  markUsedOnce() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vcUsedOnce', '1');
  },
};
