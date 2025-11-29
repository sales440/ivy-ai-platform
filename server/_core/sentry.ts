/**
 * Sentry Backend Integration
 * 
 * Initializes Sentry for error tracking on the server side.
 */

import * as Sentry from '@sentry/node';
import { Express } from 'express';
import { SENTRY_CONFIG, isSentryEnabled } from '../../sentry.config';

/**
 * Initialize Sentry for backend
 */
export function initSentry(app: Express) {
  if (!isSentryEnabled()) {
    console.log('[Sentry] Disabled (no DSN configured)');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_CONFIG.dsn,
      environment: SENTRY_CONFIG.environment,
      release: SENTRY_CONFIG.release,
      tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
      debug: SENTRY_CONFIG.debug,
    });
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
    return;
  }

  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  console.log(`[Sentry] Initialized for backend (env: ${SENTRY_CONFIG.environment})`);
}

/**
 * Add Sentry error handler (must be after all routes)
 */
export function addSentryErrorHandler(app: Express) {
  if (!isSentryEnabled()) {
    return;
  }

  // Error handler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!isSentryEnabled()) {
    console.error('[Sentry] Would capture:', error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  if (!isSentryEnabled()) {
    console.log(`[Sentry] Would capture message (${level}):`, message);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: number; email?: string; name?: string } | null) {
  if (!isSentryEnabled()) {
    return;
  }

  if (user) {
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
