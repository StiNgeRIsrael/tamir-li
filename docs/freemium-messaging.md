# Freemium messaging strategy

Living notes for tamir.li monetization copy. Cycle 1 (June 2026).

## Principles

1. **Value first** — describe what Premium *feels* like (pace, quiet, convenience), not "buy Premium".
2. **Honest scarcity** — 5/day is stated plainly, without alarm colors or "almost done?" guilt.
3. **Understated upsell** — CTAs like "Try Premium" / "נסו פרימיום", not "Upgrade Now".
4. **No fake social proof** — testimonials stay empty until real quotes exist.
5. **SEO meta unchanged** — `upgradePage.seoTitle` / `seoDesc` keep keyword-rich titles; on-page hero copy is softer.
6. **Anchor pricing preserved** — ₪150 → ₪19.90 anchor remains on PremiumPage.

## Cycle 4 (ComingSoonPanel + PremiumPage)

- `ComingSoonPanel`: alt-tool box uses muted border (no primary accent).
- `PremiumPage`: Zap icons removed from CTAs; footer CTA no longer repeats strikethrough price.
- `tool.comingSoon*` (7 locales): warmer "still building" tone; factual alt-tool hints (no "Need X now?").
- `upgradePage.comparisonTitle`, `guaranteeTitle`, `guaranteeDesc`, `guarantee` — softer, less sales framing; SEO meta unchanged.

## Cycle 1b (ru locale + nav pill)

- `ru.ts`: full cycle-1 tone pass (download gate, sidebar, premium, upgradePage) — was missed in f845229.
- `UsageNavPill`: Zap icon removed; low-state only at ≤1 remaining; muted styling (no accent alarm).

## Cycle 1 changes

### Tone shift (worst "AI slop" removed)

| Before (pattern) | After (pattern) |
|------------------|-----------------|
| "Unlimited Conversions. Zero Ads." | "Quiet work. No interruptions." |
| "Upgrade Now — ₪19.90" | "Try Premium" / "Premium — ₪19.90" |
| "Almost done? Upgrade…" | "Running low today — ₪19.90 lifts the cap" |
| "Step 1 — Watch ad" | "First tap — quick pause" |
| Sidebar "Upgrade to Premium • No ads • Unlimited" | "Premium" / "Busy day? Skip the queue" |

### Keys touched (all 7 locales: he, en, de, es, fr, it, ru)

- `tool.watchAdToDownload`, `downloadNow`, `downloadGateHint`
- `tool.seoFormats` (he, en)
- `sidebarUpgrade`, `sidebarNoAds`
- `footer.seoText3` (he, en)
- `faqs[1]` free-tier answer (he, en)
- `premium.*` — `upgradeTo`, `unlimitedNoAds`, lock/unlock/ad strings, usage pill strings, upsell nudges
- `aiGenerator.upgradeToPremium` (he, en, de)
- `upgradePage` — `headline`, `subheadline`, `ctaMain`, `checkoutSuccess`, `features[]`, `finalCta`, `finalDesc`, `orGoHome`

### UI (minimal)

- `UsageNavPill`: removed Zap icon and accent alarm styling; low-state only when ≤1 remaining.

## What we did *not* change

- SEO titles/descriptions on tool pages and upgrade page meta.
- Comparison table facts (5/day, ads yes/no, file sizes).
- Download gate mechanics (`download-gate.ts` has no user-facing strings).
- Pricing numbers or billing toggle.

## Next cycle priorities (2–16)

| Cycle | Focus |
|-------|--------|
| 2 | Tool-page limit panel (`ToolPage` at-limit state) + `PremiumBanner` copy |
| 3 | Post-conversion success panel (`ConversionSuccessUsage`) — celebrate first, upsell second |
| 4 | AI generator gate + credit pack microcopy |
| 5 | Index hero / `whyChoose` — remove brochure adjectives |
| 6 | Sidebar tool lock states + video paywall A/B tone |
| 7 | Email/checkout abandonment strings (if added) |
| 8 | Consent banner + ad label humanity pass |
| 9 | Blog CTA blocks (soft internal links to Premium) |
| 10 | Terms/privacy freemium paragraphs — legal clarity, warmer tone |
| 11 | Mobile-specific copy length audit (RTL + DE) |
| 12 | Real testimonials collection workflow (still no fabrication) |
| 13 | Seasonal scarcity (honest: "5/day resets at midnight IST") |
| 14 | Premium credits page (`PremiumCredits.tsx`) |
| 15 | Analytics event labels aligned with new copy |
| 16 | Full locale QA + remove any remaining "Upgrade to Premium" grep hits |

## Copy checklist (future edits)

- [ ] Does it assume the user wants to pay, or offer an option?
- [ ] Would this sound natural in a WhatsApp message to a friend?
- [ ] Is the limit mentioned as fact, not threat?
- [ ] Does Hebrew stay direct and warm (not marketing brochure)?
