# Ad UX recommendations — tamir.li

Actionable improvements for Adsterra display ads on the Hebrew-first dark utility hub. Based on ui-ux-pro-max design system (`utility SaaS file converter ad placement dark mode`), layout audit (`AppLayout`, `DesktopAdRail`, `AdSlot`, `Index`), and `docs/adsterra-setup.md`.

## Current state (pain points)

| Issue | Cause in code |
|-------|----------------|
| Content squeezed center | `AppLayout` renders **two** `DesktopAdRail` at `xl` (≥1280px), each **300px** + **two** stacked 300×250 units |
| Loud gambling/crypto creatives | Adsterra fill + no category filter; bright creatives on `#1C1917` dark UI |
| No visible “פרסומת” on live ads | `t.adLabel` used only for `aria-label`; live iframe is `border-0 bg-transparent` |
| Hero competes with banner | `Index` places `home-top-banner` immediately below hero |
| High density on tool pages | Rails + sidebar inline/banner + converting/wait slots + download gate |

---

## 1. Visual integration

- **Card-style ad wells** — extend `.ad-slot` to live units: `bg-card border border-border rounded-md` (solid, not dashed), inner `bg-muted/60` matte behind iframe to dampen neon creatives.
- **Visible disclosure** — small label above every unit: `פרסומת` / `t.adLabel`, `text-[10px] uppercase tracking-wider text-muted-foreground` (aligns with freemium Cycle 8).
- **Clip contrast** — `overflow-hidden rounded-[inherit]` on iframe wrapper; optional `ring-1 ring-border/50` so loud ads feel “contained.”
- **Tokens** — match design system: operation orange accents on CTA only; ads stay neutral (`muted`, `border`) so they don’t fight primary.
- **Reserve space** — keep `aspect-ratio` (already in `AdSlot`); skill flags layout shift as high severity.

## 2. Layout

- **Single rail or alternating** — drop second unit per rail (`DesktopAdRail` `-2` slot) or show **one** rail (RTL: `end` only) → reclaim ~300px content width.
- **Breakpoint** — consider `2xl` (1536px) instead of `xl` for rails; at 1280px content column ≈ 656px after two rails.
- **Content max-width** — keep `max-w-7xl` / `2xl:max-w-[1440px]` on page inner containers; don’t shrink further when rails present.
- **Sticky offset** — rails use `top-[3.75rem]`; verify against `TopNavbar` height on mobile/desktop; add `max-h-[calc(100dvh-4rem)]` + `overflow-auto` if tall stacks return.
- **Premium page** — `hideSideAds` on `/premium` already correct; keep sales path clean.

## 3. Density & placement

| Page | Keep | Reduce / move |
|------|------|----------------|
| **Home** | 1× native mid-page, optional 1× inline below tool grid | Top banner below fold; **one** rail max; no duplicate 300×250 stack |
| **Tool** | Converting/wait inline (`eager`), download-area inline, download gate | Duplicate `tool-sidebar-banner` if rails active; `tool-mobile-banner` only &lt;xl |
| **Blog** | Top banner + one mid inline | Sidebar duplicate units |

- **Home vs tool** — home = discovery (lighter); tool = intent (wait slots + gate OK per `freemium-messaging.md`).
- **Native over display** — `AdNativeSlot` blends better than 728×90 gambling banners on home.

## 4. Creative quality (Adsterra dashboard)

- **Website category** — set tamir.li as Utilities / Productivity (not Entertainment).
- **Category / advertiser filters** — enable blocks for Gambling, Betting, Crypto, Adult where dashboard allows; **limits**: no client-side block of specific creatives; filters are network/account-level, not per-zone in code.
- **Geo** — prioritize **IL** for Hebrew traffic; RU/CIS gambling (1win, etc.) often targets RU geo — tighten geo or ask Partner Care for IL-safe inventory.
- **Separate zones** — keep unique keys per placement (SPA requirement); use a “brand-safe” zone for home/rails vs aggressive zone only on download vignette if split is allowed.
- **ads.txt** — complete authorization line per `adsterra-setup.md` for better fill quality.

## 5. UX patterns

- **Consent-gated** — already: no scripts until `useAdsConsent()` ✓
- **Don’t compete with hero** — move `home-top-banner` below search/tool grid or above FAQ only.
- **Lazy load** — set `eager={false}` on rail `AdSlot`s and home mid-page units; keep `eager` on processing/download only.
- **Popunder** — optional; use sparingly; premium removes all ✓
- **Accessibility** — visible label + `role="complementary"` (already); avoid auto-playing audio creatives (report in dashboard).

## 6. Revenue without harm

- **Download gate** — two-step download (`download-gate.ts`) is high-intent; keep understated copy (Cycle 5) ✓
- **Converting wait slots** — `tool-converting-inline`, processing banners: good RPM, user expects wait ✓
- **Premium** — `isPremium` nulls all components; surface “ללא פרסומות” in comparison table ✓
- **Trade-off** — fewer rail impressions → better engagement/SEO signals → more tool conversions → gate + wait ads

## 7. Quick wins (ranked)

### P0 — do first

| Action | Where |
|--------|--------|
| Block gambling/crypto + set Utilities category | Adsterra dashboard |
| IL geo / restrict RU-heavy campaigns | Adsterra dashboard |
| Remove 2nd 300×250 per rail (`-2` slot) | `DesktopAdRail.tsx` |
| Visible `פרסומת` label + solid card well on live ads | `AdSlot.tsx` + `.ad-slot` in `index.css` |
| Move home top banner below tool grid | `Index.tsx` |

### P1 — next sprint

| Action | Where |
|--------|--------|
| Rails only at `2xl`, or single rail | `DesktopAdRail.tsx` / `AppLayout.tsx` |
| `eager={false}` on rails and home inline | `DesktopAdRail`, `Index` |
| Drop duplicate sidebar banner on tool page when rails visible | `ToolPage.tsx` |
| Enable native mid-content; reduce 728×90 on home | Admin `/admin/ads` |

### P2 — experiment

| Action | Where |
|--------|--------|
| A/B one rail vs two | Feature flag or route split |
| Home: native-only, no side rails | `AppLayout hideSideAds` on Index |
| Matte backdrop filter behind iframe | CSS only |
| RPM vs bounce analytics per slot | GTM events on `data-ad-slot-id` |

## 8. Anti-patterns (skill + product)

- **Do not** strip `aspect-ratio` / reserved height → CLS (ux: Content Jumping, High).
- **Do not** stack multiple fixed/sticky layers without offset (nav + dual sticky ad columns).
- **Do not** use bright dashed placeholders that read as broken UI on live path.
- **Do not** bypass consent or load ads for premium users.
- **Do not** add fake “close” buttons on third-party creatives.
- **Do not** optimize RPM with 4 side units + top banner + native on same viewport — erodes trust on a utility brand.
- **Do not** use neumorphism on ad frames (design system: neumorphism breaks in dark mode).

---

*Generated for tamir.li ad placement review. Implementation tracked separately from Adsterra dashboard changes.*
