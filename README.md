# VisaCheck — Phase 0 + Phase 1.5 PWA

VisaCheck is a free, privacy-first, **store-nothing** UK Skilled Worker visa rule checker built as an installable Progressive Web App. It compares a user's answers against published UK visa rules, shows which ones apply, and labels every check "being verified" until a human clicks through gov.uk — the gate is load-bearing.

This repository contains the complete Phase 0 (the app) + Phase 1.5 (the PWA layer), built end-to-end in Next.js 16 + TypeScript.

## Honesty notes (load-bearing — do not remove)

1. **Verification is load-bearing.** Every rule ships with a `PENDING_HUMAN_CLICK` marker. Until a human clicks through gov.uk, every check shows the safe "being verified" state. That is the gate working, not a bug.
2. **Competitor reviews are unverified.** Any competitor comparisons referenced in research notes are training data only.
3. **We are not lawyers.** Compliance framing is engineering practice, not legal advice.

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # Root layout: fonts, manifest link, iOS metas, theme provider
│   ├── page.tsx                # Server component → renders <VisaCheckApp/>
│   ├── globals.css             # Teal brand palette, RTL, install banner, status pills
│   └── api/check/route.ts      # POST /api/check — store-nothing rules engine
├── lib/
│   ├── i18n.ts                 # en / ur / bn dictionaries (RTL for Urdu)
│   ├── rules-data.ts           # 12 UK Skilled Worker rules, all with PENDING_HUMAN_CLICK marker
│   └── rules-engine.ts         # Pure in-memory evaluator; gate forces "pending" verdict
├── components/visa-check/
│   ├── visa-check-app.tsx      # Top-level shell + stage state machine
│   ├── header.tsx              # Brand + language switcher + theme toggle
│   ├── footer.tsx              # Footer + Privacy/Term links
│   ├── home.tsx                # Hero, 3 honesty notes, How it works, CTA
│   ├── wizard.tsx              # 6-step form (nationality, job, salary, sponsorship, English, funds)
│   ├── results.tsx             # Per-rule verdicts with filter, source links, PENDING_HUMAN_CLICK safe state
│   ├── modals.tsx              # Privacy + Terms dialogs
│   ├── install-banner.tsx      # beforeinstallprompt / appinstalled / vcUsedOnce gate
│   ├── sw-register.tsx         # /sw.js registration + updatefound toast
│   ├── store.ts                # Zustand store (persist: lang + usedOnce only)
│   └── theme-provider.tsx      # next-themes wrapper (storageKey: vcTheme)
├── proxy.ts                    # Per-request nonce CSP (Next.js 16 "proxy" convention)

public/
├── manifest.webmanifest        # PWA manifest with shortcuts + screenshots
├── sw.js                       # Service worker: shell SWR + /api/check pass-through
├── icon-192.png, icon-512.png, icon-maskable-512.png
├── screenshot-mobile-1.png, screenshot-desktop-1.png
└── apple-touch-icon.png, favicon-32.png (bonus for iOS)

_headers                        # Cloudflare Pages headers (Service-Worker-Allowed, CSP, cache)
scripts/gen-icons.mjs           # SVG → PNG icon generator (Sharp)
```

## Hard constraints satisfied

| Constraint | Status |
|---|---|
| Store-nothing (no request body, no /api/check response cached) | ✅ SW cache audited — only shell assets |
| Strict CSP, no `'unsafe-inline'` in script-src | ✅ Nonce-based CSP via `src/proxy.ts` |
| Whitelist-only vars | ✅ Engine copies only what rules use |
| PECR-minimal: only `vcLang`, `vcTheme`, `vcUsedOnce` | ✅ Verified via DevTools |
| PENDING_HUMAN_CLICK gate unchanged | ✅ Every rule's serialized JSON contains the marker |
| RTL layout works for Urdu | ✅ `<html dir="rtl">` auto-applied |
| Skip link, focus rings, aria-live, reduced-motion | ✅ All present |
| Install banner gated by `vcUsedOnce` | ✅ Only shows after Start CTA clicked |
| SW: only GET + HTTP 200 cached | ✅ Implemented + audited |
| SW: POST /api/check pass-through (never cached) | ✅ |
| SW: Turnstile pass-through | ✅ |
| SW: range requests pass-through | ✅ |
| Service-Worker-Allowed: / header | ✅ In `_headers` and `next.config.ts` |

## i18n strings added (en / ur / bn)

- `sw_updated` — "Updated — reload to use the new version."
- `e_offline` — "You appear to be offline — reconnect to run the check."
- `install_text`, `install_yes`, `install_no`
- `published` — "Published rule" (was missing in Phase 0)
- Plus the full wizard / results / modal copy for all three languages

## Manual sign-off tasks (pre-launch)

1. **Native-speaker translation review** — Urdu and Bengali translations of the 6 new strings (`sw_updated`, `e_offline`, `install_text`, `install_yes`, `install_no`, `published`) are AI-drafted. Have a native speaker review before public launch.
2. **Lawyer glance at disclaimers** — Privacy and Terms copy is engineering-drafted. Have a regulated immigration adviser review the framing.
3. **Lighthouse PWA audit on deployed URL** — Run after Cloudflare deploy; target ≥ 90.

## Local development

```bash
bun run dev        # Next.js 16 on port 3000
bun run lint       # ESLint
bun run db:push    # not used by VisaCheck (store-nothing)
```

## Deployment to Cloudflare Pages (when porting from this Next.js sandbox)

1. Build the static export (or migrate the React app to a static build).
2. Copy `_headers` to the deployment root.
3. Place `manifest.webmanifest`, `sw.js`, icons, screenshots at root.
4. Confirm `/sw.js` returns `Service-Worker-Allowed: /` header.
5. Run Lighthouse PWA audit on the live URL.
