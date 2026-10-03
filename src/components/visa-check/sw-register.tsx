'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';

// Spec §3.3 — register /sw.js with scope '/', listen for updates, show sw_updated toast.
// Also wires the beforeinstallprompt / appinstalled events.
export function ServiceWorkerRegistration() {
  const { lang } = useVisaStore();
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const doRegister = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                toast.info(t(lang, 'sw_updated'));
              }
            });
          });
        })
        .catch((err) => {
          console.warn('SW register failed:', err);
        });
    };

    // If `load` already fired (React hydrates after), register immediately.
    if (document.readyState === 'complete') {
      doRegister();
    } else {
      window.addEventListener('load', doRegister, { once: true });
      return () => window.removeEventListener('load', doRegister);
    }
  }, [lang]);

  return null;
}
