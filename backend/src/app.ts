import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import conversionsRoutes from './routes/conversions.routes';
import toolsRoutes from './routes/tools.routes';
import adminRoutes from './routes/admin.routes';
import usageRoutes from './routes/usage.routes';
import billingRoutes, { paypalWebhookHandler } from './routes/billing.routes';
import { stripeWebhookHandler } from './routes/billing-stripe.routes';

dotenv.config();

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
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversions', conversionsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/billing', billingRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Production: serve Vite build from repo-root dist/ (SPA + /api/* on one host)
if (isProduction) {
  const frontendDist = path.resolve(__dirname, '..', '..', 'dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist, { index: false }));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      if (req.path.startsWith('/api/') || req.path === '/health') {
        next();
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
