'use client';

import { useVisaStore, ls } from './store';
import { t } from '@/lib/i18n';
import { VisaCheckLogo } from './logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ClipboardList,
  ScanLine,
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  ScrollText,
  Globe2,
  GitCompare,
  Zap,
  Clock,
} from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';
import { VISA_CATEGORIES } from '@/lib/visa-categories';
import { CountryPicker, CategoryPicker } from './pickers';
import { AnnouncementsFeed } from './announcements-feed';
import { StatCounter } from './stat-counter';
import { FAQSection } from './faq-section';
import { QUICK_CHECK_PROFILES, type QuickCheckProfile } from '@/lib/quick-check';
import { toast } from 'sonner';

const HONESTY_NOTES = [
  { key: 'honesty_note_1_title', body: 'honesty_note_1_body' },
  { key: 'honesty_note_2_title', body: 'honesty_note_2_body' },
  { key: 'honesty_note_3_title', body: 'honesty_note_3_body' },
] as const;

const STEP_CARDS = [
  { icon: ClipboardList, key: 'step_card_1_title', body: 'step_card_1_body' },
  { icon: ScanLine, key: 'step_card_2_title', body: 'step_card_2_body' },
  { icon: BadgeCheck, key: 'step_card_3_title', body: 'step_card_3_body' },
] as const;

export function Home({ onOpenGlobalAnnouncements, onOpenComparison }: { onOpenGlobalAnnouncements?: () => void; onOpenComparison?: () => void }) {
  const { lang, setStage, resetAnswers, setUsedOnce, countryIso, categoryId, recentChecks } = useVisaStore();

  const onStart = () => {
    ls.markUsedOnce();
    setUsedOnce(true);
    resetAnswers();
    setStage('wizard');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vc-used-once'));
    }
  };

  const onQuickCheck = async (profile: QuickCheckProfile) => {
    ls.markUsedOnce();
    setUsedOnce(true);
    // Set country + category from the profile
    useVisaStore.getState().setCountry(profile.countryIso);
    useVisaStore.getState().setCategory(profile.categoryId);
    // Set the pre-filled answers
    useVisaStore.getState().resetAnswers();
    useVisaStore.getState().patchAnswers(profile.answers as any);

    // Submit the check directly to the API
    useVisaStore.getState().setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        ...profile.answers,
        lang,
        countryIso: profile.countryIso,
        categoryId: profile.categoryId,
      };
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        mode: 'same-origin',
      });
      if (!res.ok) throw new Error('http_' + res.status);
      const data = await res.json();
      useVisaStore.getState().setResult(data);
      // Track in recently checked (in-memory only)
      useVisaStore.getState().addRecentCheck(profile.countryIso, profile.categoryId);
      useVisaStore.getState().setSubmitting(false);
      useVisaStore.getState().setStage('results');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      useVisaStore.getState().setSubmitting(false);
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        toast.error(t(lang, 'e_offline'));
      } else {
        toast.error(t(lang, 'e_generic'));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vc-used-once'));
    }
  };

  const canStart = !!countryIso && !!categoryId;

  return (
    <main id="main" className="vc-container flex-1 py-8 sm:py-12">
      {/* Hero */}
      <section className="vc-fade vc-hero mx-auto max-w-4xl text-center">
        <div className="mb-5 flex items-center justify-center">
          <span className="vc-eyebrow">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t(lang, 'hero_eyebrow')}
          </span>
        </div>
        <div className="mb-5 flex items-center justify-center">
          <VisaCheckLogo size={64} />
        </div>
        <h1 className="vc-display text-balance text-3xl font-extrabold sm:text-5xl">
          {t(lang, 'hero_title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          {t(lang, 'hero_subtitle')}
        </p>

        {/* Country flags row — quick visual confirmation of global scope */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {COUNTRIES.map((c) => (
            <span
              key={c.iso}
              title={`${c.name[lang]} · ${c.authority.shortName}`}
              className="text-xl"
              aria-hidden="true"
            >
              {c.flag}
            </span>
          ))}
        </div>

        {/* Live coverage stats — counts up on mount */}
        <StatCounter />
      </section>

      {/* Recently checked — in-memory quick access bar (only shows if there are recent checks) */}
      {recentChecks.length > 0 && (
        <section className="mx-auto mt-6 max-w-4xl">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-3">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {recentChecks.map((rc) => {
                const c = COUNTRIES.find((x) => x.iso === rc.countryIso);
                const cat = VISA_CATEGORIES.find((x) => x.id === rc.categoryId);
                if (!c || !cat) return null;
                return (
                  <button
                    key={`${rc.countryIso}-${rc.categoryId}-${rc.timestamp}`}
                    onClick={() => {
                      useVisaStore.getState().setCountry(rc.countryIso);
                      useVisaStore.getState().setCategory(rc.categoryId);
                      onStart();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span aria-hidden="true">{c.flag}</span>
                    <span>{c.name[lang]}</span>
                    <span className="text-muted-foreground">·</span>
                    <span aria-hidden="true">{cat.icon}</span>
                    <span className="text-muted-foreground">{cat.name[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Honesty notes */}
      <section
        aria-label="Honesty notes"
        className="mx-auto mt-10 grid max-w-4xl gap-3"
      >
        {HONESTY_NOTES.map((note, i) => (
          <div key={note.key} className="vc-honesty vc-fade" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"
                aria-hidden="true"
              />
              <div>
                <p className="vc-honesty-title">{t(lang, note.key)}</p>
                <p className="vc-honesty-body">{t(lang, note.body)}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Quick Check — pre-filled scenarios for instant results */}
      <section className="mx-auto mt-10 max-w-4xl">
        <Card className="vc-card border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="vc-display flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-4 w-4" aria-hidden="true" />
              </div>
              Quick Check
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Skip the form — see results instantly for a common scenario. You can always run a full check after.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {QUICK_CHECK_PROFILES.map((profile) => {
                const country = COUNTRIES.find((c) => c.iso === profile.countryIso);
                return (
                  <button
                    key={profile.id}
                    onClick={() => onQuickCheck(profile)}
                    className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md vc-hover-lift"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">{profile.emoji}</span>
                      <span className="text-sm font-bold leading-tight">{profile.label[lang]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{profile.description[lang]}</p>
                    {country && (
                      <div className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {country.authority.shortName}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Country + category picker */}
      <section className="mx-auto mt-10 max-w-4xl space-y-6">
        <Card className="vc-card">
          <CardHeader>
            <CardTitle className="vc-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              {t(lang, 'pick_destination')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t(lang, 'pick_destination_desc')}</p>
          </CardHeader>
          <CardContent>
            <CountryPicker />
          </CardContent>
        </Card>

        {countryIso && (
          <Card className="vc-card vc-fade">
            <CardHeader>
              <CardTitle className="vc-display flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                {t(lang, 'pick_category')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t(lang, 'pick_category_desc')}</p>
            </CardHeader>
            <CardContent>
              <CategoryPicker />
            </CardContent>
          </Card>
        )}

        {/* Start CTA — gated on country + category selection */}
        <div className="flex flex-col items-center gap-3">
          <Button
            id="startBtn"
            size="lg"
            className="h-12 gap-2 px-7 text-base shadow-md"
            onClick={onStart}
            disabled={!canStart}
            aria-disabled={!canStart}
          >
            {t(lang, 'start_cta')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
          {!canStart && (
            <p className="text-xs text-muted-foreground">
              {!countryIso
                ? t(lang, 'pick_destination')
                : t(lang, 'pick_category')}
            </p>
          )}
          {onOpenComparison && (
            <button
              onClick={onOpenComparison}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              <GitCompare className="h-3 w-3" aria-hidden="true" />
              Compare destinations
            </button>
          )}
        </div>
      </section>

      {/* Announcements feed — shows pending rule changes for the selected country */}
      <section className="mx-auto mt-10 max-w-4xl">
        {onOpenGlobalAnnouncements && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="vc-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t(lang, 'announcements_title')}
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={onOpenGlobalAnnouncements}
            >
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              <span>{t(lang, 'announcements_view_all')}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </Button>
          </div>
        )}
        <AnnouncementsFeed limit={3} />
      </section>

      {/* How it works */}
      <section aria-label={t(lang, 'how_it_works')} className="mx-auto mt-12 max-w-4xl">
        <h2 className="vc-display mb-5 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t(lang, 'how_it_works')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEP_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <Card key={card.key} className="vc-card vc-fade" style={{ animationDelay: `${i * 80}ms` }}>
                <CardHeader className="pb-3">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-base font-bold">{t(lang, card.key)}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {t(lang, card.body)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ section */}
      <FAQSection />

      {/* Closing disclaimer */}
      <section className="mx-auto mt-10 max-w-3xl rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <div className="flex items-start gap-2.5">
          <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
          <p className="leading-relaxed">{t(lang, 'results_disclaimer', { authority: 'the official authority' })}</p>
        </div>
      </section>
    </main>
  );
}
