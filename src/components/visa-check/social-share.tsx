'use client';

import { useState } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Twitter,
  MessageCircle,
  Linkedin,
  Mail,
  Check,
  Copy,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { buildShareUrl } from '@/lib/format';
import { COUNTRIES } from '@/lib/countries';
import { VISA_CATEGORIES } from '@/lib/visa-categories';
import { toast } from 'sonner';

interface ShareOption {
  id: string;
  label: string;
  icon: typeof Twitter;
  color: string;
  getUrl: (shareUrl: string, text: string) => string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'twitter',
    label: 'Twitter / X',
    icon: Twitter,
    color: 'text-sky-500',
    getUrl: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    color: 'text-green-500',
    getUrl: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-600',
    getUrl: (url, text) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    color: 'text-amber-600',
    getUrl: (url, text) =>
      `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

export function SocialShareDialog({
  open,
  onOpenChange,
  countryIso,
  categoryId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  countryIso: string;
  categoryId: string;
}) {
  const { lang } = useVisaStore();
  const [copied, setCopied] = useState(false);

  const country = COUNTRIES.find((c) => c.iso === countryIso);
  const category = VISA_CATEGORIES.find((c) => c.id === categoryId);

  const shareUrl = buildShareUrl(countryIso, categoryId);
  const shareText = country && category
    ? `Check visa rules for ${category.name[lang]} in ${country.name[lang]} with VisaCheck — free, private, nothing stored.`
    : 'Check visa rules with VisaCheck — free, private, nothing stored.';

  const onCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t(lang, 'results_share_copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t(lang, 'results_share_failed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 vc-display">
            <Share2 className="h-5 w-5 text-primary" aria-hidden="true" />
            {t(lang, 'results_share')}
          </DialogTitle>
          <DialogDescription>
            {t(lang, 'results_share_hint')}
          </DialogDescription>
        </DialogHeader>

        {/* Share URL preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Link to share
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs text-foreground">{shareUrl}</code>
            <button
              onClick={onCopy}
              className={
                'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ' +
                (copied
                  ? 'border-green-500/40 bg-green-50 text-green-600 dark:bg-green-950/20'
                  : 'border-border bg-card hover:bg-accent')
              }
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
          {country && category && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span aria-hidden="true">{country.flag}</span>
              <span>{country.name[lang]}</span>
              <span>·</span>
              <span aria-hidden="true">{category.icon}</span>
              <span>{category.name[lang]}</span>
            </div>
          )}
        </div>

        {/* Social share buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SHARE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <a
                key={opt.id}
                href={opt.getUrl(shareUrl, shareText)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm vc-hover-lift"
              >
                <Icon className={'h-5 w-5 ' + opt.color} aria-hidden="true" />
                <span className="text-[11px] font-medium">{opt.label}</span>
              </a>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Only the country + category are shared. Your answers are never included.
        </p>
      </DialogContent>
    </Dialog>
  );
}
