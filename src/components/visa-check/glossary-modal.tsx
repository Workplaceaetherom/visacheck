'use client';

import { useState, useMemo } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, X } from 'lucide-react';
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryTerm } from '@/lib/glossary';

export function GlossaryModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { lang } = useVisaStore();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GlossaryTerm['category'] | 'all'>('all');

  const filtered = useMemo(() => {
    return GLOSSARY.filter((g) => {
      if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matches =
          g.term.toLowerCase().includes(q) ||
          g.acronym?.toLowerCase().includes(q) ||
          g.explanation.en.toLowerCase().includes(q) ||
          g.explanation.ur.includes(query) ||
          g.explanation.bn.includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [query, categoryFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 vc-display">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            Visa Glossary
          </DialogTitle>
          <DialogDescription className="sr-only">
            Plain-language explanations of common visa terms
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search visa terms…"
            className="pl-9"
            aria-label="Search glossary"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={
              'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ' +
              (categoryFilter === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card hover:bg-accent/40')
            }
            aria-pressed={categoryFilter === 'all'}
          >
            All
          </button>
          {GLOSSARY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ' +
                (categoryFilter === cat.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card hover:bg-accent/40')
              }
              aria-pressed={categoryFilter === cat.id}
            >
              {cat.label[lang]}
            </button>
          ))}
        </div>

        {/* Terms list */}
        <div className="max-h-[50vh] space-y-2 overflow-y-auto scroll-soft pr-1">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No terms match “{query}”.
            </div>
          ) : (
            filtered.map((g) => (
              <div
                key={g.term}
                className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold leading-tight">{g.term}</h4>
                    {g.acronym && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {g.acronym}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {g.explanation[lang]}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
