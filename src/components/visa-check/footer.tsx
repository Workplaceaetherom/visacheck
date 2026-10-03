'use client';

import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { ShieldCheck, BookOpen } from 'lucide-react';

export function Footer({
  onPrivacy,
  onTerms,
  onGlossary,
}: {
  onPrivacy: () => void;
  onTerms: () => void;
  onGlossary?: () => void;
}) {
  const { lang } = useVisaStore();
  return (
    <footer className="mt-auto border-t border-border bg-background/60">
      <div className="vc-container flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
          <span className="max-w-prose leading-relaxed">{t(lang, 'footer_imprint')}</span>
        </div>
        <nav className="flex items-center gap-4 text-xs" aria-label="Footer">
          {onGlossary && (
            <button
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
              onClick={onGlossary}
            >
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              Glossary
            </button>
          )}
          <button
            className="font-medium text-foreground underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
            onClick={onPrivacy}
          >
            {t(lang, 'privacy_link')}
          </button>
          <button
            className="font-medium text-foreground underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
            onClick={onTerms}
          >
            {t(lang, 'terms_link')}
          </button>
        </nav>
      </div>
    </footer>
  );
}
