# Medium syndication guide

Republish Hebrew blog posts on Medium to reach English/Hebrew readers while keeping **tamir.li as the canonical source**.

## Workflow

1. **Publish on tamir.li first** — article must be live at `https://tamir.li/blog/{slug}` with full SEO (Article JSON-LD, sitemap).
2. **Wait 24–48h** — let Google crawl the canonical URL.
3. **Import to Medium** — use *Stories → Import a story* with the tamir.li URL, or paste content manually.
4. **Set canonical** — in Medium story settings, set canonical URL to the tamir.li blog post.
5. **Add syndication note on tamir.li** — `syndicationNote` field in `src/lib/blog-data.ts` (see pilot: `how-to-convert-jpg-to-png`).
6. **Link back** — end Medium post with “Original (Hebrew): https://tamir.li/blog/…”

## Pilot article

| Field | Value |
|-------|-------|
| Slug | `how-to-convert-jpg-to-png` |
| Canonical | `https://tamir.li/blog/how-to-convert-jpg-to-png` |
| On-site note | Rendered below article body when `syndicationNote` is set |

## Do not

- Publish on Medium *before* tamir.li (duplicate without canonical hurts SEO).
- Remove internal tool links when syndicating — keep links to `/jpg-to-png`, etc.
- Syndicate more than 1–2 posts/month without monitoring GSC for duplicate issues.

## Metrics

Track in GSC: impressions/clicks on `/blog/how-to-convert-jpg-to-png` before and 30 days after Medium import.
