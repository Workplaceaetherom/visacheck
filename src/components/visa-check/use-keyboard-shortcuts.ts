'use client';

import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  onSearch?: () => void;
  onCompare?: () => void;
  onGlossary?: () => void;
  onAnnouncements?: () => void;
  onEscape?: () => void;
  onHome?: () => void;
  onHelp?: () => void;
}

const IGNORED_TAG_NAMES = ['INPUT', 'TEXTAREA', 'SELECT', 'TEXTAREA'];

/**
 * Global keyboard shortcuts for VisaCheck.
 *
 * Shortcuts:
 *   /  — focus the search input (if visible)
 *   c  — open the comparison dashboard
 *   g  — open the glossary
 *   a  — open the global announcements dashboard
 *   Esc — close any open modal/overlay
 *   h  — go to the home page
 *
 * Shortcuts are ignored when the user is typing in an input/textarea/select.
 */
export function useKeyboardShortcuts(opts: KeyboardShortcutOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if the user is typing in a form field
      const target = e.target as HTMLElement | null;
      if (target && IGNORED_TAG_NAMES.includes(target.tagName)) {
        // Always allow Escape to blur/close even from inputs
        if (e.key === 'Escape' && opts.onEscape) {
          opts.onEscape();
        }
        return;
      }

      // Escape always works
      if (e.key === 'Escape' && opts.onEscape) {
        e.preventDefault();
        opts.onEscape();
        return;
      }

      // Don't trigger on modifier keys
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case '/':
          if (opts.onSearch) {
            e.preventDefault();
            opts.onSearch();
          }
          break;
        case 'c':
        case 'C':
          if (opts.onCompare) {
            e.preventDefault();
            opts.onCompare();
          }
          break;
        case 'g':
        case 'G':
          if (opts.onGlossary) {
            e.preventDefault();
            opts.onGlossary();
          }
          break;
        case 'a':
        case 'A':
          if (opts.onAnnouncements) {
            e.preventDefault();
            opts.onAnnouncements();
          }
          break;
        case 'h':
        case 'H':
          if (opts.onHome) {
            e.preventDefault();
            opts.onHome();
          }
          break;
        case '?':
          if (opts.onHelp) {
            e.preventDefault();
            opts.onHelp();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opts]);
}
