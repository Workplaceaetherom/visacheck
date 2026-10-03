'use client';

import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ScrollText } from 'lucide-react';

export function Modals({
  open,
  onOpenChange,
  type,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: 'privacy' | 'terms' | null;
}) {
  const { lang } = useVisaStore();
  const isPrivacy = type === 'privacy';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto scroll-soft sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 vc-display">
            {isPrivacy ? (
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <ScrollText className="h-5 w-5 text-primary" aria-hidden="true" />
            )}
            {isPrivacy ? t(lang, 'privacy_title') : t(lang, 'terms_title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isPrivacy ? t(lang, 'privacy_title') : t(lang, 'terms_title')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>{isPrivacy ? t(lang, 'privacy_body') : t(lang, 'terms_body')}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="gap-1.5">
            {t(lang, 'close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
