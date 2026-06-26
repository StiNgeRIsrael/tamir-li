# Embeddable conversion widget

Public page: **https://tamir.li/widget** (Hebrew) / **https://tamir.li/en/widget** (English).

## What it does

Provides a copy-paste `<iframe>` snippet that embeds the live **JPG → PNG** tool on third-party sites (blogs, tutorials, partner pages).

## Embed code

```html
<iframe
  src="https://tamir.li/jpg-to-png"
  title="Tamir.li — JPG to PNG"
  width="100%"
  height="520"
  style="border:0;border-radius:12px;max-width:640px"
  loading="lazy"
  allow="clipboard-write"
></iframe>
```

Use locale-prefixed URLs for non-Hebrew pages, e.g. `https://tamir.li/en/jpg-to-png`.

## Attribution

Keep a visible link or text credit to [tamir.li](https://tamir.li/) on the page where the widget appears. Do not remove branding or present the tool as your own product.

## SEO value

- Earns referral traffic and branded searches from tutorial sites.
- `llms.txt` and sitemap list `/widget` for AI crawlers.
- iframe `src` points at canonical tool URLs (indexable separately).

## Limitations

- No custom styling API yet — iframe only.
- Default tool is JPG→PNG; other tools can be linked directly without the widget page.
