/**
 * Sentry Configuration
 * 
 * Centralized configuration for Sentry error tracking.
 * Used by both frontend and backend.
 */

export const SENTRY_CONFIG = {
  // Set this to your Sentry DSN (Data Source Name)
  // Get it from: https://sentry.io/settings/[your-org]/projects/[your-project]/keys/
  dsn: process.env.SENTRY_DSN || '',
  
  // Environment (production, staging, development)
  environment: process.env.NODE_ENV || 'development',
  
  // Release version (use git commit hash or version number)
  release: process.env.RAILWAY_GIT_COMMIT_SHA || 'development',
  
  // Sample rate for performance monitoring (0.0 to 1.0)
  // 1.0 = 100% of transactions, 0.1 = 10% of transactions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Network errors
    'Network request failed',
    'NetworkError',
    // Random plugins/extensions
    'atomicFindClose',
    // Facebook borked
    'fb_xd_fragment',
  ],
  
  // Ignore specific URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    // Firefox extensions
    /^moz-extension:\/\//i,
  ],
};

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return Boolean(SENTRY_CONFIG.dsn);
}
