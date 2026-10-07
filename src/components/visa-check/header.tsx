'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Languages, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVisaStore } from './store';
import { LANG_META, SUPPORTED_LANGS, t } from '@/lib/i18n';
import { VisaCheckLogo } from './logo';

export function Header({ onHomeClick }: { onHomeClick?: () => void }) {
  const { lang, setLang, stage, setStage } = useVisaStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes renders different markup on server vs client; mounted guard avoids
  // hydration mismatch. The single setState on mount is the documented pattern.
   
  useEffect(() => setMounted(true), []);

  // Sync <html lang> + <html dir> for screen readers + RTL.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = LANG_META[lang].dir;
  }, [lang]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="vc-container flex h-14 items-center justify-between gap-3">
        <button
          onClick={() => {
            onHomeClick?.();
            setStage('home');
          }}
          className="group flex items-center gap-2 rounded-md outline-none"
          aria-label="VisaCheck home"
        >
          <VisaCheckLogo size={28} className="transition-transform group-hover:scale-105" />
          <span className="vc-display text-base font-extrabold tracking-tight">
            Visa<span className="text-primary">Check</span>
          </span>
          {stage !== 'home' && (
            <span className="ml-2 hidden text-xs font-medium text-muted-foreground sm:inline">
              {t(lang, 'brand')} · {t(lang, 'tagline')}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 px-2"
                aria-label={t(lang, 'switch_language')}
              >
                <Languages className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm">{LANG_META[lang].label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              <DropdownMenuLabel>{t(lang, 'switch_language')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SUPPORTED_LANGS.map((l) => (
                <DropdownMenuItem
                  key={l}
                  onSelect={() => setLang(l)}
                  className="flex items-center justify-between gap-3"
                  dir={LANG_META[l].dir}
                >
                  <span>{LANG_META[l].label}</span>
                  {l === lang && <Check className="h-4 w-4" aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label={t(lang, 'toggle_theme')}
            className="h-9 w-9"
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )
            ) : (
              <Sun className="h-4 w-4 opacity-0" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
