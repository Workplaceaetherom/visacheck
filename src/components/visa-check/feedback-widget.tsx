'use client';

import { useState } from 'react';
import { useVisaStore } from './store';
import { t } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Check, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type FeedbackState = 'idle' | 'positive' | 'negative' | 'submitted';

export function FeedbackWidget() {
  const { lang } = useVisaStore();
  const [state, setState] = useState<FeedbackState>('idle');
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const onThumbsUp = () => {
    setState('positive');
    setShowComment(true);
  };

  const onThumbsDown = () => {
    setState('negative');
    setShowComment(true);
  };

  const onSubmit = () => {
    // In-memory only — no storage, no API call. Just acknowledge.
    setState('submitted');
    setShowComment(false);
    toast.success(
      state === 'positive'
        ? (lang === 'ur' ? 'شکریہ! آپ کی رائے کی قدر ہے۔' : lang === 'bn' ? 'ধন্যবাদ! আপনার মতামত আমরা গুরুত্ব দিই।' : 'Thank you! We value your feedback.')
        : (lang === 'ur' ? 'شکریہ! ہم آپ کی رائے پر غور کریں گے۔' : lang === 'bn' ? 'ধন্যবাদ! আমরা আপনার মতামত বিবেচনা করব।' : 'Thank you! We will consider your feedback.')
    );
  };

  if (state === 'submitted') {
    return (
      <Card className="vc-card border-green-500/20 bg-green-50/50 dark:bg-green-950/10">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-600">
            <Check className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {lang === 'ur' ? 'آپ کی رائے کے لیے شکریہ!' : lang === 'bn' ? 'আপনার মতামতের জন্য ধন্যবাদ!' : 'Thanks for your feedback!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="vc-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {lang === 'ur' ? 'کیا یہ چیک مفید تھا؟' : lang === 'bn' ? 'এই চেকটি কি সহায়ক ছিল?' : 'Was this check helpful?'}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === 'ur' ? 'آپ کی رائے محفوظ نہیں ہوتی' : lang === 'bn' ? 'আপনার মতামত সংরক্ষিত হয় না' : 'Your feedback is never stored'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onThumbsUp}
              className={
                'h-9 w-9 transition-colors ' +
                (state === 'positive' ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-950/20' : 'hover:border-green-500/40 hover:text-green-600')
              }
              aria-label="Yes, helpful"
            >
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onThumbsDown}
              className={
                'h-9 w-9 transition-colors ' +
                (state === 'negative' ? 'border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'hover:border-amber-500/40 hover:text-amber-600')
              }
              aria-label="No, not helpful"
            >
              <ThumbsDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {showComment && (
          <div className="mt-3 space-y-2 vc-fade">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageSquare className="h-3 w-3" aria-hidden="true" />
              {lang === 'ur' ? 'اختیاری تبصرہ (محفوظ نہیں ہوگا)' : lang === 'bn' ? 'ঐচ্ছিক মন্তব্য (সংরক্ষিত হবে না)' : 'Optional comment (not stored)'}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-card p-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={
                lang === 'ur' ? 'اپنی رائے یں لکھیں…' :
                lang === 'bn' ? 'আপনার মতামত এখানে লিখুন…' :
                'Tell us more…'
              }
              aria-label="Optional feedback comment"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowComment(false); setState('idle'); setComment(''); }}
              >
                {lang === 'ur' ? 'منسوخ کریں' : lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button size="sm" onClick={onSubmit}>
                {lang === 'ur' ? 'جمع کریں' : lang === 'bn' ? 'জমা দিন' : 'Submit'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
