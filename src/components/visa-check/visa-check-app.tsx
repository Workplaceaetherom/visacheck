'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Header } from './header';
import { Footer } from './footer';
import { Home } from './home';
import { Wizard } from './wizard';
import { Results } from './results';
import { Modals } from './modals';
import { ServiceWorkerRegistration } from './sw-register';
import { InstallBanner } from './install-banner';
import { TodayHeader } from './today-header';
import { GlobalAnnouncementsDashboard } from './global-announcements';
import { ComparisonDashboard } from './comparison-dashboard';
import { GlossaryModal } from './glossary-modal';
import { ShortcutsHelp } from './shortcuts-help';
import { PageTransition } from './page-transition';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';
import { useVisaStore } from './store';
import { parseShareUrl } from '@/lib/format';
import { COUNTRIES } from '@/lib/countries';
import { VISA_CATEGORIES } from '@/lib/visa-categories';

export function VisaCheckApp() {
  const { stage } = useVisaStore();
  const [modal, setModal] = useState<'privacy' | 'terms' | null>(null);
  const [showGlobalAnnouncements, setShowGlobalAnnouncements] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const urlParsed = useRef(false);

  // Keyboard shortcuts: / search, c compare, g glossary, a announcements, h home, ? help, Esc close
  useKeyboardShortcuts({
    onCompare: () => setShowComparison(true),
    onGlossary: () => setShowGlossary(true),
    onAnnouncements: () => setShowGlobalAnnouncements(true),
    onHome: () => {
      useVisaStore.getState().setStage('home');
    },
    onHelp: () => setShowShortcutsHelp(true),
    onEscape: () => {
      // Close in priority order: help > modals > overlays > wizard
      if (showShortcutsHelp) setShowShortcutsHelp(false);
      else if (showGlossary) setShowGlossary(false);
      else if (modal) setModal(null);
      else if (showGlobalAnnouncements) setShowGlobalAnnouncements(false);
      else if (showComparison) setShowComparison(false);
      else if (stage === 'wizard') useVisaStore.getState().setStage('home');
    },
  });

  useEffect(() => {
    if (urlParsed.current) return;
    urlParsed.current = true;
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);

    // Parse deep-link share URL from hash fragment (e.g. /#/US/student)
    const shared = parseShareUrl(window.location.hash);
    if (shared) {
      const country = COUNTRIES.find((c) => c.iso === shared.countryIso);
      const category = VISA_CATEGORIES.find((c) => c.id === shared.categoryId);
      if (country && category) {
        useVisaStore.getState().setCountry(shared.countryIso);
        useVisaStore.getState().setCategory(shared.categoryId);
        // Clean the hash without triggering a navigation
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }

    const go = url.searchParams.get('go');
    const open = url.searchParams.get('open');
    if (go === 'form') {
      useVisaStore.getState().setStage('wizard');
      localStorage.setItem('vcUsedOnce', '1');
      useVisaStore.getState().setUsedOnce(true);
    }
    if (open === 'announcements') {
      queueMicrotask(() => setShowGlobalAnnouncements(true));
    }
    if (open === 'compare') {
      queueMicrotask(() => setShowComparison(true));
    }
    if (open === 'glossary') {
      queueMicrotask(() => setShowGlossary(true));
    }
    const wanted = open === 'privacy' ? 'privacy' : open === 'terms' ? 'terms' : null;
    if (wanted) {
      queueMicrotask(() => setModal(wanted));
    }
    if (url.searchParams.has('go') || url.searchParams.has('open')) {
      url.searchParams.delete('go');
      url.searchParams.delete('open');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  }, []);

  return (
    <>
      <Header />
      <TodayHeader />
      <AnimatePresence mode="wait">
        {stage === 'home' && (
          <PageTransition key="home" pageKey="home">
            <Home
              onOpenGlobalAnnouncements={() => setShowGlobalAnnouncements(true)}
              onOpenComparison={() => setShowComparison(true)}
            />
          </PageTransition>
        )}
        {stage === 'wizard' && (
          <PageTransition key="wizard" pageKey="wizard">
            <Wizard />
          </PageTransition>
        )}
        {stage === 'results' && (
          <PageTransition key="results" pageKey="results">
            <Results />
          </PageTransition>
        )}
      </AnimatePresence>
      <Footer
        onPrivacy={() => setModal('privacy')}
        onTerms={() => setModal('terms')}
        onGlossary={() => setShowGlossary(true)}
      />
      <ServiceWorkerRegistration />
      <InstallBanner />
      <Modals open={modal !== null} onOpenChange={(v) => !v && setModal(null)} type={modal} />
      {showGlobalAnnouncements && (
        <GlobalAnnouncementsDashboard onClose={() => setShowGlobalAnnouncements(false)} />
      )}
      {showComparison && (
        <ComparisonDashboard onClose={() => setShowComparison(false)} />
      )}
      <GlossaryModal open={showGlossary} onOpenChange={setShowGlossary} />
      <ShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />
    </>
  );
}
