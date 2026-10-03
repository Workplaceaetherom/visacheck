'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard, Search, GitCompare, BookOpen, Megaphone, Home, X } from 'lucide-react';

interface ShortcutDef {
  key: string;
  description: string;
  icon: typeof Search;
}

const SHORTCUTS: ShortcutDef[] = [
  { key: '/', description: 'Focus search', icon: Search },
  { key: 'c', description: 'Open comparison dashboard', icon: GitCompare },
  { key: 'g', description: 'Open glossary', icon: BookOpen },
  { key: 'a', description: 'Open announcements', icon: Megaphone },
  { key: 'h', description: 'Go to home page', icon: Home },
  { key: 'Esc', description: 'Close any open overlay', icon: X },
];

export function ShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 vc-display">
            <Keyboard className="h-5 w-5 text-primary" aria-hidden="true" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="sr-only">
            List of keyboard shortcuts for VisaCheck
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium">{s.description}</span>
                </div>
                <kbd className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border border-border bg-muted px-2 font-mono text-xs font-bold text-foreground shadow-sm">
                  {s.key}
                </kbd>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Shortcuts are ignored while typing in form fields.
        </p>
      </DialogContent>
    </Dialog>
  );
}
