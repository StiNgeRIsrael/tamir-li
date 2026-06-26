# Benchmark PR draft — Tamir.li vs desktop converters

**Status:** Draft for outreach (not published). Use for HARO, Israeli tech blogs, or comparison roundups.

---

## Headline options

1. **Israeli browser-based converter matches desktop speed for image tasks — no install**
2. **Tamir.li benchmark: JPG→PNG in-browser vs local tools (2026)**

## Key findings (fill after running local benchmark)

| Task | Tamir.li (browser) | Desktop reference | Notes |
|------|-------------------|-------------------|-------|
| JPG→PNG (2 MB) | _TBD_ s | _TBD_ s | Client-side canvas |
| Image compress 50% | _TBD_ s | _TBD_ s | |
| Word→PDF (1 page) | _TBD_ s | _TBD_ s | |

## Talking points

- **Hebrew-first UX** — built for Israel; ILS pricing; no English-only friction.
- **Privacy** — many tools process in-browser; files not stored on server after conversion.
- **Freemium** — 5 free conversions/day; premium removes ads and limits.
- **No install** — works on Chrome, Safari, mobile; PWA available at `/install`.

## Honest limitations

- Large video files and server-side formats are still rolling out (“coming soon” in UI).
- Free tier file size cap (50 MB marketing; FAQ mentions up to 500 MB premium).
- Not a replacement for batch enterprise ETL — aimed at consumers and small business.

## Suggested quote (spokesperson)

> "Most Israelis don't need another desktop app — they need a fast Hebrew page that converts a file and gets out of the way. We benchmark in-browser image conversion against local tools and publish results transparently."

## Distribution targets

- Geektime, Ice, Ynet Tech (Hebrew)
- Product Hunt (English one-pager linking to `/en/alternatives/freeconvert`)
- Reddit r/israel, r/webdev (benchmark table only — no spam)

## CTA links

- Homepage: https://tamir.li/
- Comparison: https://tamir.li/alternatives/freeconvert
- Widget: https://tamir.li/widget

---

*Run `npm test` and manual timing on jpg-to-png / image-compressor before sending to press.*
