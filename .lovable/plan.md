
# Internationalization (i18n) -- Making Tamirly Global

## Overview

Transform the site from a Hebrew-only site into a multilingual platform supporting **7 languages**:
- **Hebrew (he)** -- root `/` (RTL, Israel-focused, "תמיר לי")
- **English (en)** -- `/en/` (LTR, global default, "Tamirly")
- **Spanish (es)** -- `/es/` (LTR, "Tamirly")
- **Russian (ru)** -- `/ru/` (LTR, "Tamirly")
- **German (de)** -- `/de/` (LTR, "Tamirly")
- **French (fr)** -- `/fr/` (LTR, "Tamirly")
- **Italian (it)** -- `/it/` (LTR, "Tamirly")

## How Google Recognizes Each Language Version

Google uses three signals to understand multilingual sites:

1. **`hreflang` tags** -- Added to every page, telling Google "this page also exists in Italian at /it/jpg-to-png". Google then shows the Italian version to Italian users.
2. **Subdirectory structure** (`/it/`, `/fr/`, etc.) -- Google crawls each path as a separate page with its own content.
3. **Content language** -- The actual text on the page being in the target language confirms it for that audience.

Combined, these make Google treat `/it/jpg-to-png` as the Italian page for "convert JPG to PNG" and rank it in Italian Google search results.

## URL Structure

```text
/                    --> Hebrew homepage (Israel)
/jpg-to-png          --> Hebrew tool page
/blog                --> Hebrew blog
/blog/article-slug   --> Hebrew blog article

/en/                 --> English homepage (global)
/en/jpg-to-png       --> English tool page
/en/blog             --> English blog
/en/blog/article-slug

/it/                 --> Italian homepage
/it/jpg-to-png       --> Italian tool page
/it/blog             --> Italian blog index
/it/blog/article-slug

(same for /es/, /ru/, /de/, /fr/)
```

## Architecture

Due to the scale of this change (hundreds of translated strings, 20 blog articles x 7 languages, all UI components), this will be implemented in **phases**.

### Phase 1: i18n Foundation + English (this implementation)

Build the full infrastructure and English as the first non-Hebrew language, which serves as the template for all other languages.

### Phase 2: Remaining 5 languages (follow-up)

Add Spanish, Russian, German, French, Italian translations using the same pattern established in Phase 1.

---

## Technical Plan -- Phase 1

### 1. Create i18n System

**New file: `src/lib/i18n.tsx`**
- Define `Locale` type: `"he" | "en" | "es" | "ru" | "de" | "fr" | "it"`
- Create `LocaleContext` with React Context
- `LocaleProvider` component that reads locale from URL prefix
- `useLocale()` hook for accessing current locale
- `useT()` hook that returns translated strings
- `localePath(path, locale)` helper to prefix paths with locale
- `isRTL(locale)` helper (true only for `he`)

**New file: `src/lib/translations/en.ts`**
- All UI strings in English: navbar, footer, homepage, tool pages, blog index, error pages
- Tool names and descriptions in English
- Category labels in English
- Stats, features, FAQs, testimonials in English

**New file: `src/lib/translations/he.ts`**
- Extract all current Hebrew strings into this file (same structure as en.ts)

**New file: `src/lib/translations/index.ts`**
- Export translation map keyed by locale

### 2. Update Routing (`src/App.tsx`)

Add locale-prefixed routes:

```text
/:locale/               --> Index (with locale)
/:locale/:slug           --> ToolPage (with locale)
/:locale/blog            --> BlogIndex (with locale)
/:locale/blog/:slug      --> BlogPost (with locale)
/                        --> Index (Hebrew default)
/:slug                   --> ToolPage (Hebrew default)
/blog                    --> BlogIndex (Hebrew default)
/blog/:slug              --> BlogPost (Hebrew default)
```

Wrap entire app in `LocaleProvider` that reads `:locale` param.

### 3. Update Layout Direction

**`src/components/AppLayout.tsx`**
- Read locale from context
- Set `dir="rtl"` for Hebrew, `dir="ltr"` for all others
- Adjust body class dynamically

**`index.html`**
- Remove hardcoded `dir="rtl"` and `lang="he"` (set dynamically via JS)

### 4. Update Components to Use Translations

Every component with hardcoded Hebrew text gets updated to use `useT()`:

- **`TopNavbar.tsx`** -- Brand name ("Tamirly" vs "תמיר לי"), button text, category labels
- **`SiteFooter.tsx`** -- All footer text, SEO block, copyright
- **`Index.tsx`** -- Hero text, stats, features, formats, FAQs, testimonials
- **`ToolPage.tsx`** -- UI strings (buttons, labels, error messages)
- **`BlogIndex.tsx`** -- Page title, description
- **`BlogPost.tsx`** -- Breadcrumb, sidebar labels
- **`SEOHead.tsx`** -- Dynamic canonical URLs with locale prefix
- **`tools-data.ts`** -- Tool names/descriptions keyed by locale
- **`blog-data.ts`** -- Blog articles keyed by locale (English versions)

### 5. Add Language Switcher

**New component: `src/components/LanguageSwitcher.tsx`**
- Dropdown in the navbar showing current language flag/code
- Links to same page in other languages
- Shows on all pages

### 6. SEO for Multilingual

**hreflang tags** (in `SEOHead.tsx`):
```html
<link rel="alternate" hreflang="he" href="https://tamirli.co.il/jpg-to-png" />
<link rel="alternate" hreflang="en" href="https://tamirli.co.il/en/jpg-to-png" />
<link rel="alternate" hreflang="it" href="https://tamirli.co.il/it/jpg-to-png" />
<link rel="alternate" hreflang="x-default" href="https://tamirli.co.il/en/jpg-to-png" />
```

**`public/sitemap.xml`** -- Add all locale-prefixed URLs.

**`public/robots.txt`** -- Add sitemap reference.

### 7. Blog Content in English

Create English versions of all 20 blog articles in `src/lib/translations/blog-en.ts` with:
- Translated titles, descriptions, keywords
- Full English article content (1000+ words each)
- Internal links updated to `/en/` prefix

---

## Files to Create
| File | Purpose |
|------|---------|
| `src/lib/i18n.tsx` | Locale context, hooks, helpers |
| `src/lib/translations/he.ts` | Hebrew strings (extracted from current code) |
| `src/lib/translations/en.ts` | English strings |
| `src/lib/translations/index.ts` | Translation registry |
| `src/lib/translations/blog-en.ts` | 20 English blog articles |
| `src/components/LanguageSwitcher.tsx` | Language dropdown component |

## Files to Modify
| File | Change |
|------|--------|
| `index.html` | Remove hardcoded `lang`/`dir`, add dynamic setting |
| `src/App.tsx` | Add locale-prefixed routes, wrap in LocaleProvider |
| `src/components/AppLayout.tsx` | Dynamic dir/lang based on locale |
| `src/components/TopNavbar.tsx` | Use translations, add LanguageSwitcher |
| `src/components/SiteFooter.tsx` | Use translations |
| `src/pages/Index.tsx` | Use translations for all UI strings |
| `src/pages/ToolPage.tsx` | Use translations, locale-aware navigation |
| `src/pages/BlogIndex.tsx` | Use translations, locale-filtered articles |
| `src/pages/BlogPost.tsx` | Use translations, locale-filtered content |
| `src/components/SEOHead.tsx` | Add hreflang tags, locale-aware canonical |
| `src/lib/tools-data.ts` | Add locale-keyed names/descriptions |
| `src/lib/blog-data.ts` | Add locale support |
| `public/sitemap.xml` | Add all locale URLs |
| `public/robots.txt` | Add Sitemap reference |

## Implementation Note

This is a very large change (30+ files, thousands of lines of translated content). Phase 1 delivers the full i18n infrastructure + English, making it trivial to add the remaining 5 languages in Phase 2 by simply creating new translation files following the same pattern.
