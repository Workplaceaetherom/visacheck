'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, BellRing } from 'lucide-react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallBanner() {
  const { lang, usedOnce } = useVisaStore();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Spec §3.3 — show ONLY after vcUsedOnce flag set.
      if (localStorage.getItem('vcUsedOnce') === '1') {
        setHidden(false);
      }
    };

    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
      toast.success(t(lang, 'install_yes') + ' ✓');
    };

    const onUsedOnce = () => {
      // Custom event from home CTA — gives the banner a chance to show even if
      // beforeinstallprompt already fired before vcUsedOnce was set.
      if (deferred) setHidden(false);
    };

    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('vc-used-once', onUsedOnce);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('vc-used-once', onUsedOnce);
    };
  }, [deferred, lang]);

  // If we never get beforeinstallprompt (iOS, desktop Firefox), don't render.
  if (!deferred) return null;

  const onInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setHidden(true);
      }
    } catch {
      // swallow — never break UX
    } finally {
      setDeferred(null);
    }
  };

  const onDismiss = () => setHidden(true);

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t(lang, 'install_text')}
      hidden={hidden || !usedOnce}
      className="install-banner"
    >
      <BellRing className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="ib-text">{t(lang, 'install_text')}</span>
      <Button
        size="sm"
        className="h-8 gap-1 px-3"
        onClick={onInstall}
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        {t(lang, 'install_yes')}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onDismiss}
        aria-label={t(lang, 'install_no')}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
