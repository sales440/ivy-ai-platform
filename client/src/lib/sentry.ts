/**
 * Sentry Frontend Integration
 * 
 * Initializes Sentry for error tracking on the client side.
 */

import * as Sentry from '@sentry/react';
import { SENTRY_CONFIG, isSentryEnabled } from '../../../sentry.config';

/**
 * Initialize Sentry for frontend
 */
export function initSentry() {
  if (!isSentryEnabled()) {
    console.log('[Sentry] Disabled (no DSN configured)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_CONFIG.dsn,
    environment: SENTRY_CONFIG.environment,
    release: SENTRY_CONFIG.release,
    tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
    debug: SENTRY_CONFIG.debug,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Session Replay sample rate
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Ignore errors from Sentry config
    ignoreErrors: SENTRY_CONFIG.ignoreErrors,
    denyUrls: SENTRY_CONFIG.denyUrls,
  });

  console.log(`[Sentry] Initialized for frontend (env: ${SENTRY_CONFIG.environment})`);
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

/**
 * Create Sentry Error Boundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
