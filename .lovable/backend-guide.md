# Tamirly — Full Backend Development Guide

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Infrastructure & Platform](#2-infrastructure--platform)
3. [User Management & Authentication](#3-user-management--authentication)
4. [Subscription & Payments (Stripe)](#4-subscription--payments-stripe)
5. [Database Schema](#5-database-schema)
6. [File Conversion Engines](#6-file-conversion-engines)
7. [AI Image Generation](#7-ai-image-generation)
8. [Usage Tracking & Rate Limiting](#8-usage-tracking--rate-limiting)
9. [File Storage & Cleanup](#9-file-storage--cleanup)
10. [Ad System](#10-ad-system)
11. [Analytics & Monitoring](#11-analytics--monitoring)
12. [Email & Notifications](#12-email--notifications)
13. [Security](#13-security)
14. [API Reference](#14-api-reference)
15. [Deployment & DevOps](#15-deployment--devops)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                     │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ToolPages│ │Premium  │ │  Blog    │ │ AI Generator     │  │
│  │(convert)│ │Page     │ │  Pages   │ │ (premium)        │  │
│  └────┬────┘ └────┬────┘ └──────────┘ └────────┬─────────┘  │
│       │           │                             │            │
│  ┌────▼───────────▼─────────────────────────────▼─────────┐  │
│  │              Supabase JS Client                         │  │
│  └────────────────────────┬────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                  LOVABLE CLOUD (Supabase)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Auth         │  │  PostgreSQL  │  │  Edge Functions   │   │
│  │  (email,      │  │  Database    │  │  (Deno runtime)   │   │
│  │   Google,     │  │              │  │                   │   │
│  │   social)     │  │  - profiles  │  │  - convert-file   │   │
│  └──────────────┘  │  - subs      │  │  - stripe-webhook │   │
│                     │  - usage     │  │  - generate-image │   │
│  ┌──────────────┐  │  - credits   │  │  - cleanup-files  │   │
│  │  Storage      │  │  - payments │  │  - send-email     │   │
│  │  (file        │  └──────────────┘  └──────────────────┘   │
│  │   uploads &   │                                           │
│  │   results)    │  ┌──────────────────────────────────┐     │
│  └──────────────┘  │  Stripe (Payments & Subscriptions) │     │
│                     └──────────────────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  External APIs                                        │   │
│  │  - FFmpeg (video/audio conversion via WASM or server) │   │
│  │  - Sharp/libvips (image processing)                   │   │
│  │  - OpenAI / Stability AI (image generation)           │   │
│  │  - Resend / SendGrid (transactional email)            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Client-side vs Server-side Processing

| Tool | Processing Location | Engine | Reason |
|------|---------------------|--------|--------|
| Image converter | **Client (browser)** | Canvas API | Fast, no upload needed, all browsers support it |
| Image compressor | **Client** | Canvas API + quality param | Same — works in browser |
| Image resizer | **Client** | Canvas API | Same |
| PNG to ICO | **Client** | Canvas API | Small files, simple format |
| SVG to PNG | **Client** | Canvas API | SVG renders natively in browsers |
| PDF Manager | **Client** | pdf-lib (already installed) | Merge/rotate is lightweight |
| Text tools | **Client** | JS string ops + marked/turndown | Pure text manipulation |
| Video converter | **Server (Edge Function)** | FFmpeg WASM or external API | Heavy processing, large files |
| Video compressor | **Server** | FFmpeg | Same |
| Audio converter | **Server** | FFmpeg | Format support varies by browser |
| PDF to Word | **Server** | LibreOffice headless or API | Complex layout parsing |
| Word to PDF | **Server** | LibreOffice headless or API | Same |
| AI Image Gen | **Server** | OpenAI DALL-E / Stability AI | Requires API key, GPU inference |

---

## 2. Infrastructure & Platform

### Required: Lovable Cloud (Supabase)

Enable Lovable Cloud to get:
- **PostgreSQL database** — users, subscriptions, usage, credits
- **Auth** — email/password, Google OAuth, magic links
- **Edge Functions** — server-side conversion, Stripe webhooks, AI generation
- **Storage** — temporary file uploads and conversion results
- **Realtime** — conversion progress updates (optional)

### Required: Stripe

Enable via Lovable's Stripe integration for:
- Monthly subscription ($1.29/mo base)
- Yearly subscription (20% discount)
- One-time credit pack purchases
- Webhook handling for payment events

### Required Secrets (Edge Functions)

| Secret | Purpose | Source |
|--------|---------|--------|
| `STRIPE_SECRET_KEY` | Stripe API calls | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures | Stripe Dashboard → Webhooks |
| `OPENAI_API_KEY` | AI image generation | OpenAI Platform |
| `RESEND_API_KEY` | Transactional emails | Resend Dashboard |

---

## 3. User Management & Authentication

### Auth Providers

| Provider | Priority | Notes |
|----------|----------|-------|
| Email/Password | **Must have** | Standard signup/login |
| Google OAuth | **Must have** | Largest user base |
| Magic Link (email) | Nice to have | Passwordless login |
| Apple Sign-In | Nice to have | iOS users |

### Database: `profiles` table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'he',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'he')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Database: `user_roles` table (security-critical)

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Password Reset Flow

1. **Forgot Password page** → calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
2. **`/reset-password` page** → reads `type=recovery` from URL hash, shows new password form, calls `supabase.auth.updateUser({ password })`

---

## 4. Subscription & Payments (Stripe)

### Products & Prices

| Product | Stripe Price ID | Amount | Interval |
|---------|----------------|--------|----------|
| Premium Monthly | `price_monthly_*` | $1.29/mo (₪4.90) | Monthly |
| Premium Yearly | `price_yearly_*` | $12.38/yr (₪47.04) | Yearly |
| 10 AI Credits | `price_credits_10` | $2.10 (₪8) | One-time |
| 30 AI Credits | `price_credits_30` | $5.25 (₪19) | One-time |
| 60 AI Credits | `price_credits_60` | $8.40 (₪32) | One-time |
| 120 AI Credits | `price_credits_120` | $18.90 (₪72) | One-time |

### Database: `subscriptions` table

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
```

### Database: `payments` table

```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL, -- in smallest currency unit (agorot/cents)
  currency TEXT NOT NULL DEFAULT 'ils',
  type TEXT NOT NULL CHECK (type IN ('subscription', 'credits')),
  status TEXT NOT NULL DEFAULT 'succeeded',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);
```

### Edge Function: `stripe-webhook`

Handles these Stripe events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription, add credits if credit purchase |
| `customer.subscription.updated` | Update subscription status, plan, period dates |
| `customer.subscription.deleted` | Mark subscription as canceled |
| `invoice.payment_succeeded` | Log payment, reset monthly AI credits (6) |
| `invoice.payment_failed` | Mark subscription as past_due, notify user |

### Edge Function: `create-checkout`

```
POST /create-checkout
Body: { plan: "monthly" | "yearly" | "credits_10" | "credits_30" | ... }
Auth: Bearer token (required)

Returns: { url: "https://checkout.stripe.com/..." }
```

### Edge Function: `manage-subscription`

```
POST /manage-subscription
Body: { action: "cancel" | "resume" | "portal" }
Auth: Bearer token (required)

Returns: { url: "..." } (for portal) or { success: true }
```

### Subscription Status Helper (client-side)

```typescript
// src/hooks/useSubscription.ts
export function useSubscription() {
  // Query subscriptions table
  // Return: { isPremium, plan, expiresAt, isLoading }
  // isPremium = status === 'active' && current_period_end > now
}
```

---

## 5. Database Schema

### Complete Schema Overview

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│ auth.users   │────▶│ profiles      │     │ user_roles     │
│ (Supabase)   │     │ - display_name│     │ - role (enum)  │
└──────┬───────┘     │ - avatar_url  │     └────────────────┘
       │             │ - locale      │
       │             └──────────────┘
       │
       ├─────▶ ┌──────────────────┐
       │       │ subscriptions     │
       │       │ - stripe_*        │
       │       │ - plan            │
       │       │ - status          │
       │       └──────────────────┘
       │
       ├─────▶ ┌──────────────────┐
       │       │ payments          │
       │       │ - amount          │
       │       │ - type            │
       │       └──────────────────┘
       │
       ├─────▶ ┌──────────────────┐
       │       │ ai_credits        │
       │       │ - balance         │
       │       │ - monthly_reset   │
       │       └──────────────────┘
       │
       ├─────▶ ┌──────────────────┐
       │       │ usage_logs        │
       │       │ - tool_id         │
       │       │ - file_size       │
       │       │ - created_at      │
       │       └──────────────────┘
       │
       └─────▶ ┌──────────────────┐
               │ conversion_jobs   │
               │ - status          │
               │ - input_path      │
               │ - output_path     │
               │ - error           │
               └──────────────────┘
```

### `ai_credits` table

```sql
CREATE TABLE public.ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  monthly_credits INTEGER NOT NULL DEFAULT 0, -- resets each billing cycle
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,
  last_monthly_reset TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.ai_credits FOR SELECT
  USING (auth.uid() = user_id);
```

### `usage_logs` table

```sql
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- for anonymous users
  tool_id TEXT NOT NULL,
  from_format TEXT,
  to_format TEXT,
  file_size_bytes BIGINT,
  processing_time_ms INTEGER,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Index for rate limiting queries
CREATE INDEX idx_usage_logs_user_day
  ON public.usage_logs(user_id, created_at);

CREATE INDEX idx_usage_logs_session_day
  ON public.usage_logs(session_id, created_at);
```

### `conversion_jobs` table (server-side conversions only)

```sql
CREATE TABLE public.conversion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tool_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_storage_path TEXT,
  output_storage_path TEXT,
  from_format TEXT NOT NULL,
  to_format TEXT NOT NULL,
  file_size_bytes BIGINT,
  error_message TEXT,
  priority BOOLEAN DEFAULT FALSE, -- premium users get priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.conversion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON public.conversion_jobs FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 6. File Conversion Engines

### Client-Side Engines (already working or partially implemented)

#### Image Converter (Canvas API)
- **Status**: ✅ Implemented
- **How it works**: Loads image into `<canvas>`, exports via `canvas.toBlob(type)`
- **Supported**: JPG ↔ PNG ↔ WEBP ↔ GIF ↔ BMP ↔ TIFF
- **Limits**: Max ~50MB (browser memory)

#### Image Compressor (Canvas API)
- **Status**: ✅ Implemented (`customComponent: "image-compressor"`)
- **How it works**: Re-encodes image at lower quality via `canvas.toBlob(type, quality)`

#### Image Resizer (Canvas API)
- **Status**: ✅ Implemented (`customComponent: "image-resizer"`)
- **How it works**: Draws image to canvas at target dimensions

#### PNG to ICO
- **Status**: ✅ Implemented
- **How it works**: Resizes to 16x16, 32x32, 48x48, encodes ICO binary format

#### SVG to PNG
- **Status**: ✅ Implemented
- **How it works**: Renders SVG into canvas, exports as PNG

#### PDF Manager
- **Status**: ✅ Implemented (`customComponent: "pdf-manager"`)
- **Engine**: `pdf-lib` (already installed)
- **Features**: Merge, reorder pages, rotate pages

#### Text Tools
- **Status**: ✅ Implemented (`customComponent: "text-tools"`)
- **Engine**: `marked` + `turndown` (already installed)
- **Features**: MD↔HTML↔TXT, word count, case conversion

### Server-Side Engines (require Edge Functions)

#### Video Converter & Compressor — FFmpeg

**Option A: External conversion API (recommended for MVP)**
- Use a service like CloudConvert, Transloadit, or Coconut.co
- Pros: No infrastructure management, scales automatically
- Cons: Per-conversion cost

**Option B: FFmpeg WASM in Edge Function**
- Run FFmpeg compiled to WebAssembly
- Pros: No external dependency
- Cons: Memory limits (Edge Functions have ~150MB), slow for large files

**Option C: Dedicated worker server**
- A small VM (e.g., Fly.io, Railway) running FFmpeg natively
- Edge Function dispatches job → worker processes → uploads result to Storage
- Pros: Full FFmpeg power, handles large files
- Cons: Infrastructure management

**Recommended approach:**
```
User uploads file → Supabase Storage (temp bucket)
                  → Edge Function creates conversion_job
                  → External API or worker picks up job
                  → Result uploaded to Storage
                  → User notified (poll or realtime)
                  → User downloads result
                  → Cleanup after 1 hour
```

#### Audio Converter — FFmpeg

Same architecture as video. Audio files are smaller, so FFmpeg WASM in an Edge Function is more viable here.

**Supported conversions**: MP3 ↔ WAV ↔ AAC ↔ OGG ↔ FLAC

#### PDF to Word — Document Processing

**Option A: External API (recommended)**
- Services: CloudConvert, ILovePDF API, Adobe PDF Services API
- Most reliable for maintaining formatting

**Option B: Open-source parsing**
- `pdf-parse` for text extraction + `docx` npm package for DOCX generation
- Loses complex formatting (tables, images, columns)

#### Word to PDF — Document Processing

**Option A: External API** (same services as above)

**Option B: LibreOffice headless** (on a worker server)
- `libreoffice --headless --convert-to pdf input.docx`
- Best fidelity but requires a server

### Edge Function: `convert-file`

```
POST /convert-file
Body (multipart): { file, from_format, to_format, tool_id }
Auth: Bearer token (optional — anonymous users have daily limits)

Flow:
1. Validate formats & file size
2. Check rate limits (free: 5/day, premium: unlimited)
3. Upload input to Storage (`temp-uploads` bucket)
4. Create conversion_job record
5. Dispatch to conversion engine
6. Return job ID for polling

Response: { job_id: "uuid", status: "processing" }
```

### Edge Function: `check-job`

```
GET /check-job?id=<job_id>
Auth: Bearer token (optional)

Response: {
  status: "completed",
  download_url: "https://...signed-url...",
  expires_at: "2025-01-01T01:00:00Z"
}
```

---

## 7. AI Image Generation

### Edge Function: `generate-image`

```
POST /generate-image
Body: { prompt, style, aspect_ratio }
Auth: Bearer token (required — premium only)

Flow:
1. Verify user is premium subscriber
2. Check AI credit balance (≥1)
3. Call OpenAI DALL-E 3 or Stability AI API
4. Deduct 1 credit
5. Upload result to Storage
6. Return signed download URL

Response: {
  image_url: "https://...signed-url...",
  credits_remaining: 5
}
```

### Credit Management

| Event | Credits |
|-------|---------|
| New premium subscription | +6 monthly |
| Monthly billing cycle reset | Reset to 6 monthly |
| Purchase 10-credit pack | +10 lifetime |
| AI image generation | -1 |

### Credit Deduction (atomic, in Edge Function)

```sql
-- Atomic credit deduction to prevent race conditions
UPDATE public.ai_credits
SET balance = balance - 1, updated_at = NOW()
WHERE user_id = $1 AND balance > 0
RETURNING balance;
```

---

## 8. Usage Tracking & Rate Limiting

### Free User Limits

| Resource | Daily Limit | Notes |
|----------|-------------|-------|
| Image conversions (client-side) | 15/day | Tracked via localStorage + server |
| Video conversions (server-side) | 0 (premium only) | Can unlock 1 by watching ad |
| Audio conversions (server-side) | 5/day | |
| Document conversions | 5/day | |
| AI image generation | 0 | Premium only |
| Max file size | 25 MB | |

### Premium User Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| All conversions | Unlimited | |
| AI image generation | Credit-based | 6/mo included + purchasable |
| Max file size | 100 MB | |
| Priority processing | ✅ | Server jobs processed first |

### Rate Limiting Logic (Edge Function middleware)

```typescript
async function checkRateLimit(userId: string | null, sessionId: string, toolId: string) {
  // 1. Check if premium → unlimited
  if (userId) {
    const sub = await getActiveSubscription(userId);
    if (sub) return { allowed: true, remaining: Infinity };
  }

  // 2. Count today's usage
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
    .gte('created_at', today)
    .eq('tool_id', toolId);

  const limit = TOOL_LIMITS[toolId] || 5;
  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
    limit,
  };
}
```

---

## 9. File Storage & Cleanup

### Storage Buckets

```sql
-- Temporary uploads (auto-cleanup after 1 hour)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('temp-uploads', 'temp-uploads', false, 104857600); -- 100MB

-- Conversion results (auto-cleanup after 1 hour)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('conversion-results', 'conversion-results', false, 104857600);

-- User avatars (permanent)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 5242880); -- 5MB
```

### RLS for Storage

```sql
-- temp-uploads: authenticated users can upload
CREATE POLICY "Auth users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'temp-uploads' AND auth.uid() IS NOT NULL);

-- temp-uploads: users can read own files
CREATE POLICY "Users can read own uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'temp-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- conversion-results: users can read own results
CREATE POLICY "Users can read own results"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'conversion-results' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars: public read, owner write
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### File Path Convention

```
temp-uploads/{user_id}/{job_id}/input.{ext}
conversion-results/{user_id}/{job_id}/output.{ext}
avatars/{user_id}/avatar.{ext}
```

### Cleanup Edge Function (scheduled CRON)

```
-- Runs every hour via Supabase CRON or pg_cron
DELETE FROM storage.objects
WHERE bucket_id IN ('temp-uploads', 'conversion-results')
  AND created_at < NOW() - INTERVAL '1 hour';

DELETE FROM public.conversion_jobs
WHERE status IN ('completed', 'failed')
  AND created_at < NOW() - INTERVAL '24 hours';
```

---

## 10. Ad System

### Current Implementation
- `AdSlot` component renders placeholder ad slots
- Premium users see no ads

### Integration Options

| Provider | Revenue Model | Integration |
|----------|---------------|-------------|
| Google AdSense | CPM/CPC | Script tag + ad units |
| Carbon Ads | Flat-rate | Script tag (developer-focused) |
| Rewarded video ads | Watch-to-unlock | AdMob / custom |

### Rewarded Ad Flow (unlock 1 premium conversion)

```
1. User clicks "Watch ad for free conversion"
2. Frontend shows 15-second ad (video or interstitial)
3. After completion, frontend calls Edge Function:
   POST /claim-ad-reward { tool_id, ad_session_token }
4. Edge Function verifies ad completion
5. Grants 1 temporary usage credit
6. User proceeds with conversion
```

---

## 11. Analytics & Monitoring

### Tracked Events

| Event | Data |
|-------|------|
| `conversion_started` | tool_id, from_format, to_format, file_size |
| `conversion_completed` | job_id, processing_time_ms |
| `conversion_failed` | job_id, error_type |
| `signup` | method (email/google), locale |
| `subscription_created` | plan, amount |
| `subscription_canceled` | plan, reason |
| `credit_purchased` | pack_size, amount |
| `ai_image_generated` | style, aspect_ratio |
| `page_view` | path, locale, referrer |

### Admin Dashboard (future)

A protected `/admin` route (check `has_role(uid, 'admin')`) showing:
- Total users, active subscribers, MRR
- Conversion volume by tool
- Popular format pairs
- Revenue & churn metrics
- System health (failed jobs, storage usage)

---

## 12. Email & Notifications

### Transactional Emails (via Resend or SendGrid)

| Trigger | Email |
|---------|-------|
| Signup | Welcome email + getting started guide |
| Subscription created | Payment confirmation + features unlocked |
| Subscription canceled | Cancellation confirmation + win-back offer |
| Payment failed | Action required — update payment method |
| Monthly credit reset | Your 6 AI credits have been refreshed |
| Approaching daily limit | You've used 4/5 conversions today — upgrade? |
| Refund processed | Refund confirmation |

### Edge Function: `send-email`

```typescript
// Uses Resend API
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

await resend.emails.send({
  from: 'Tamirly <noreply@tamirli.co.il>',
  to: userEmail,
  subject: 'Welcome to Tamirly!',
  html: renderTemplate('welcome', { name, locale }),
});
```

---

## 13. Security

### Authentication & Authorization

- [ ] All Edge Functions validate JWT tokens
- [ ] Admin routes use `has_role()` security definer function
- [ ] Roles stored in separate `user_roles` table (NOT on profiles)
- [ ] RLS enabled on ALL tables
- [ ] No raw SQL execution — use parameterized queries only

### File Upload Security

- [ ] Validate MIME type on upload (both client and server)
- [ ] Validate file extension matches expected format
- [ ] Enforce file size limits (25MB free, 100MB premium)
- [ ] Scan for malicious content (optional: ClamAV on worker)
- [ ] Generated signed URLs expire after 1 hour
- [ ] Files auto-deleted after 1 hour

### Stripe Security

- [ ] Verify webhook signatures with `STRIPE_WEBHOOK_SECRET`
- [ ] Never trust client-side price — always use Stripe Price IDs
- [ ] Idempotency keys for payment operations
- [ ] Log all payment events for audit trail

### Rate Limiting

- [ ] Per-IP rate limiting on Edge Functions (headers check)
- [ ] Per-user daily usage limits enforced server-side
- [ ] CAPTCHA for anonymous heavy usage (optional)

### Content Security

- [ ] AI prompts filtered for disallowed content (OpenAI moderation)
- [ ] Uploaded files not executed, only processed
- [ ] CORS configured correctly on Edge Functions

---

## 14. API Reference

### Edge Functions Summary

| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `create-checkout` | POST | Required | Create Stripe checkout session |
| `stripe-webhook` | POST | Webhook sig | Handle Stripe events |
| `manage-subscription` | POST | Required | Cancel/resume/portal |
| `convert-file` | POST | Optional | Start server-side conversion |
| `check-job` | GET | Optional | Poll conversion job status |
| `generate-image` | POST | Required | Generate AI image (premium) |
| `claim-ad-reward` | POST | Optional | Claim ad-watch reward |
| `send-email` | POST | Internal | Send transactional email |
| `cleanup-files` | POST | CRON | Delete expired files |
| `reset-monthly-credits` | POST | CRON | Reset premium AI credits |

### Client-Side Hooks (to build)

```typescript
// Authentication
useAuth()           // { user, signIn, signUp, signOut, isLoading }
useProfile()        // { profile, updateProfile }

// Subscription & Billing
useSubscription()   // { isPremium, plan, expiresAt, subscribe, cancel }
useCredits()        // { balance, useCredit, purchaseCredits }

// Usage & Limits
useUsageLimit(toolId)  // { remaining, limit, isAllowed, logUsage }
useDailyUsage()        // { totalToday, limitReached }

// Conversion (server-side tools)
useConversionJob()     // { startJob, pollStatus, downloadResult }
```

---

## 15. Deployment & DevOps

### Environment Checklist

| Step | Action |
|------|--------|
| 1 | Enable Lovable Cloud |
| 2 | Run all migration SQL (tables, RLS, functions, triggers) |
| 3 | Enable Stripe integration |
| 4 | Create Stripe products & prices |
| 5 | Set up Stripe webhook pointing to Edge Function URL |
| 6 | Add secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY` |
| 7 | Configure Google OAuth in Supabase dashboard |
| 8 | Create storage buckets with RLS |
| 9 | Deploy Edge Functions |
| 10 | Set up CRON jobs (cleanup, credit reset) |
| 11 | Test full flow: signup → subscribe → convert → generate AI image |
| 12 | Configure custom domain |
| 13 | Set up monitoring & alerts |

### Implementation Priority (recommended order)

| Phase | Features | Effort |
|-------|----------|--------|
| **Phase 1** | Auth (email + Google), profiles, basic usage tracking | 1-2 days |
| **Phase 2** | Stripe subscriptions (monthly + yearly), premium gating | 1-2 days |
| **Phase 3** | Server-side video/audio conversion (external API) | 2-3 days |
| **Phase 4** | AI image generation with credits | 1 day |
| **Phase 5** | Credit packs purchase flow | 1 day |
| **Phase 6** | Rewarded ads (watch ad → unlock 1 conversion) | 1 day |
| **Phase 7** | Transactional emails | 1 day |
| **Phase 8** | Admin dashboard | 2 days |
| **Phase 9** | PDF↔Word server-side conversion | 1-2 days |
| **Phase 10** | Monitoring, alerts, optimization | Ongoing |

---

## Quick Start Commands

When ready to implement, the conversation flow would be:

1. **"Enable Lovable Cloud"** → provisions database, auth, storage, edge functions
2. **"Enable Stripe"** → connects Stripe for payments
3. **"Implement Phase 1: Auth + Profiles"** → builds signup/login, profiles table, Google OAuth
4. **"Implement Phase 2: Subscriptions"** → Stripe checkout, webhook handler, premium gating
5. Continue phase by phase...

---

*This guide is a living document. Update as features are built and requirements evolve.*
