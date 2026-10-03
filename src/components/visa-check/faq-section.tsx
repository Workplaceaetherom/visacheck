'use client';

import { useState, useMemo } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FAQ_ITEMS, FAQ_CATEGORIES } from '@/lib/faq';

export function FAQSection() {
  const { lang } = useVisaStore();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matches =
          item.question.en.toLowerCase().includes(q) ||
          item.answer.en.toLowerCase().includes(q) ||
          item.question.ur.includes(query) ||
          item.answer.ur.includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [query, categoryFilter]);

  return (
    <section aria-label="FAQ" className="mx-auto mt-10 max-w-4xl">
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </div>
        <h2 className="vc-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Frequently Asked Questions
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="pl-9"
          aria-label="Search FAQ"
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
      <div className="mb-4 flex flex-wrap gap-1.5">
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
        {FAQ_CATEGORIES.map((cat) => (
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

      {/* FAQ items */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No questions match “{query}”.
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-xl border border-border bg-card px-4 transition-colors hover:border-primary/30"
            >
              <AccordionTrigger className="text-left text-sm font-bold hover:no-underline">
                {item.question[lang]}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.answer[lang]}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </section>
  );
}
