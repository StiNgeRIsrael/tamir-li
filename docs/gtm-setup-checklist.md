# GTM setup checklist — Tamir.li

**Your IDs (use these exactly):**

| Item | ID |
|------|-----|
| GTM container | `GTM-5GH9HV38` |
| GA4 measurement | `G-EBE6D6BPZ0` |
| GTM workspace URL | [Open container](https://tagmanager.google.com/#/container/accounts/6361787615/containers/255991148/workspaces/2) |

---

## Already done (browser automation, 2026-06-19)

- [x] Logged into GTM in Cursor browser tab
- [x] Opened container **GTM-5GH9HV38** (tamir.li, Default Workspace)
- [x] Updated **Google Tag G-EBE6D6BPZ0**:
  - Measurement ID: `G-EBE6D6BPZ0`
  - Configuration parameter: `send_page_view` = `false`
  - Consent: **Require additional consent** → `analytics_storage`
  - Trigger: Initialization - All Pages
- [ ] **Not yet done:** Custom Event triggers + GA4 Event tags (see below)
- [ ] **Not yet done:** Publish container

**Workspace status:** 1 unpublished change (the Google Tag update above).

---

## Remaining steps (click-by-click)

### Option A — Import (fastest, ~2 minutes)

1. GTM → **Admin** → **Import Container**
2. Choose file: `docs/gtm-container-template.json` from this repo
3. Select **Merge** (not Overwrite — keeps your Google Tag config)
4. Workspace: **Default Workspace** → **Confirm**
5. Review imported triggers/tags → **Submit** → version name `GA4 funnel tags` → **Publish**

### Option B — Manual (if import fails)

Open [Tags](https://tagmanager.google.com/#/container/accounts/6361787615/containers/255991148/workspaces/2/tags) or [Triggers](https://tagmanager.google.com/#/container/accounts/6361787615/containers/255991148/workspaces/2/triggers).

#### B1. Custom Event triggers (repeat 9×)

For **each** event name below:

1. Left sidebar → **Triggers** → **New**
2. Click the trigger type box → **Custom Event**
3. **Event name:** type exactly (e.g. `page_view`)
4. Name: `CE - <event name>` (e.g. `CE - page_view`)
5. **Save**

| Event name (exact) | Trigger name |
|--------------------|--------------|
| `page_view` | `CE - page_view` |
| `tool_view` | `CE - tool_view` |
| `file_upload` | `CE - file_upload` |
| `convert_start` | `CE - convert_start` |
| `convert_success` | `CE - convert_success` |
| `paywall_hit` | `CE - paywall_hit` |
| `upgrade_click` | `CE - upgrade_click` |
| `begin_checkout` | `CE - begin_checkout` |
| `purchase` | `CE - purchase` |

#### B2. GA4 Event tags (repeat 9×)

For **each** trigger from B1:

1. **Tags** → **New**
2. Tag type → **Google Analytics: GA4 Event**
3. **Configuration Tag** → select `Google Tag G-EBE6D6BPZ0` (or `GA4 - Configuration` if renamed)
4. **Event Name** → same as trigger (e.g. `page_view`)
5. **Triggering** → matching `CE - …` trigger
6. **Advanced Settings** → Consent → **Require additional consent** → `analytics_storage`
7. Name: `GA4 - <event name>` → **Save**

#### B3. Optional — `page_view` parameters

1. **Variables** → **New** → **Data Layer Variable** for each:

| Variable name | Data Layer Variable Name |
|---------------|--------------------------|
| `dlv - page_path` | `page_path` |
| `dlv - page_type` | `page_type` |
| `dlv - blog_slug` | `blog_slug` |
| `dlv - slug` | `slug` |
| `dlv - tool_id` | `tool_id` |

2. In tag **GA4 - page_view** → Event Parameters → add rows mapping to `{{dlv - …}}` variables.

#### B4. Publish

1. Top right → **Submit**
2. Version name: `GA4 funnel tags`
3. **Publish**

---

## Verify on localhost

1. Ensure `.env` has `VITE_GTM_ID=GTM-5GH9HV38`
2. Run `npm run dev` → open `http://localhost:8080`
3. Accept analytics cookies in the banner
4. Browser console: `dataLayer.filter(e => e.event)` — should show `page_view`, `tool_view`, etc. as you navigate
5. GTM → **Preview** → connect to `http://localhost:8080` → confirm tags fire on each event

### Expected dataLayer events (from codebase)

Defined in `src/lib/analytics/events.ts`:

- `page_view` — SPA route changes
- `tool_view` — tool pages
- `file_upload`, `convert_start`, `convert_success` — conversion funnel
- `paywall_hit`, `upgrade_click`, `begin_checkout`, `purchase` — premium flow
- Also emitted (add triggers if needed): `file_download`, `file_download_all`, `ad_click_download`

---

## Alignment with docs

- Full guide: `docs/google-analytics-setup.md` (Step 3)
- Import template: `docs/gtm-container-template.json`
- Code loads GTM only after consent (`src/lib/ads/consent.ts`)
- Consent Mode defaults denied in `index.html` until user accepts

---

## Blockers encountered

| Blocker | Workaround |
|---------|------------|
| GTM trigger editor clicks intercepted by overlay | Use **Import Container** (Option A) or complete triggers manually in the open GTM tab |
| File upload not automatable in Cursor browser | You upload `gtm-container-template.json` manually via Admin → Import |
| Publish requires human review | Click **Submit** → **Publish** after reviewing workspace changes |
