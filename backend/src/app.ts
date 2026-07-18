import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { trySeoPrerender } from './lib/seo-prerender';
import authRoutes from './routes/auth.routes';
import conversionsRoutes from './routes/conversions.routes';
import toolsRoutes from './routes/tools.routes';
import adsRoutes from './routes/ads.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import usageRoutes from './routes/usage.routes';
import statsRoutes from './routes/stats.routes';
import appRoutes from './routes/app.routes';
import billingRoutes, { paypalWebhookHandler } from './routes/billing.routes';
import { stripeWebhookHandler } from './routes/billing-stripe.routes';
import hebrewOcrRoutes from './routes/hebrew-ocr.routes';
import { pingAdSettingsTable } from './lib/ad-settings';
import { pingAiSettingsTable } from './lib/ai-settings';
import { getStartupMigrateStatus } from './lib/startup-migrate';
import { isDatabaseUrlSet, parseDatabaseUrlSafe, pingDatabase } from './lib/db-health';
import { getPayPalBillingReadiness } from './lib/paypal';
import { getGooglePlayBillingReadiness } from './lib/google-play';

// cwd `.env` (Plesk app root) + `backend/.env` (migrations / Play sync target)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app: Express = express();

// Payment webhooks require raw body — must run before express.json()
app.post(
  '/api/billing/paypal/webhook',
  express.raw({ type: 'application/json' }),
  paypalWebhookHandler
);

if (process.env.ENABLE_STRIPE === 'true') {
  app.post(
    '/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhookHandler
  );
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);
const isProduction = process.env.NODE_ENV === 'production';
app.use(
  cors({
    // Same-origin monolith: browser requests from tamir.li need no cross-origin config.
    origin:
      corsOrigins && corsOrigins.length > 0
        ? corsOrigins
        : isProduction
          ? false
          : true,
    credentials: true,
  })
);
// same-origin-allow-popups: required for Google Identity Services popup postMessage
// blob: in img-src — client tools preview via URL.createObjectURL (compressor/resizer)
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      },
    },
  })
);
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversions', conversionsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/app', appRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/tools/hebrew-ocr', hebrewOcrRoutes);

// Health check endpoint (probed by scripts/autonomous-site-check.ts and frontend)
// Always 200 when the process is up; db.ok reflects MySQL/Prisma reachability.
app.get('/health', async (_req: Request, res: Response) => {
  const envSet = isDatabaseUrlSet();
  const dbTarget = parseDatabaseUrlSafe();
  const db = await pingDatabase();
  const adSettingsTable =
    db.ok ? await pingAdSettingsTable() : { ok: false as const, error: 'DB_UNREACHABLE' };
  const aiSettingsTable =
    db.ok ? await pingAiSettingsTable() : { ok: false as const, error: 'DB_UNREACHABLE' };
  const dbMeta = { envSet, ...dbTarget };
  const migrations = getStartupMigrateStatus();
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: db.ok ? { ok: true, ...dbMeta } : { ok: false, error: db.error, ...dbMeta },
    migrations,
    adSettingsTable: adSettingsTable.ok
      ? { ok: true }
      : { ok: false, error: adSettingsTable.error },
    aiSettingsTable: aiSettingsTable.ok
      ? { ok: true }
      : { ok: false, error: aiSettingsTable.error },
    billing: getPayPalBillingReadiness(),
    googlePlay: getGooglePlayBillingReadiness(),
  });
});

// Production: serve Vite build from repo-root dist/ (SPA + /api/* on one host)
if (isProduction) {
  const frontendDist = path.resolve(__dirname, '..', '..', 'dist');
  const seoStaticFiles = ['sitemap.xml', 'robots.txt', 'ads.txt', 'llms.txt'] as const;
  const hasFileExtension = (urlPath: string) => /\.[a-zA-Z0-9]+$/.test(urlPath);

  if (fs.existsSync(frontendDist)) {
    const seoContentTypes: Record<(typeof seoStaticFiles)[number], string> = {
      'sitemap.xml': 'application/xml; charset=utf-8',
      'robots.txt': 'text/plain; charset=utf-8',
      'ads.txt': 'text/plain; charset=utf-8',
      'llms.txt': 'text/plain; charset=utf-8',
    };
    for (const file of seoStaticFiles) {
      app.get(`/${file}`, (_req: Request, res: Response, next: NextFunction) => {
        const filePath = path.join(frontendDist, file);
        if (!fs.existsSync(filePath)) {
          res.status(404).type('text/plain').send('Not Found');
          return;
        }
        try {
          const body = fs.readFileSync(filePath);
          res.type(seoContentTypes[file]).send(body);
        } catch (err) {
          console.error(`Failed to read ${file} from ${filePath}:`, err);
          next(err);
        }
      });
    }

    app.use(express.static(frontendDist, { index: false }));
    const siteOrigin = (process.env.VITE_SITE_ORIGIN || 'https://tamir.li').replace(/\/$/, '');
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      if (req.path.startsWith('/api/') || req.path === '/health') {
        next();
        return;
      }
      if (hasFileExtension(req.path)) {
        next();
        return;
      }
      const botHtml = trySeoPrerender(frontendDist, req.path, req.get('user-agent'), siteOrigin);
      if (botHtml) {
        res.status(200).type('text/html').send(botHtml);
        return;
      }
      next();
    });
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      if (req.path.startsWith('/api/') || req.path === '/health') {
        next();
        return;
      }
      // Missing static assets (e.g. sitemap.xml) must not fall back to index.html.
      if (hasFileExtension(req.path)) {
        res.status(404).type('text/plain').send('Not Found');
        return;
      }
      res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  } else {
    console.warn(`Frontend dist not found at ${frontendDist}; API-only mode.`);
  }
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

export default app;
