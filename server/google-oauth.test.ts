import { describe, it, expect } from 'vitest';
import { getOAuth2Client, getAuthUrl } from '../server/google-drive';

describe('Google OAuth Configuration', () => {
  it('should have GOOGLE_CLIENT_ID environment variable set', () => {
    expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_ID).not.toBe('');
    expect(process.env.GOOGLE_CLIENT_ID).toContain('.apps.googleusercontent.com');
  });

  it('should have GOOGLE_CLIENT_SECRET environment variable set', () => {
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_SECRET).not.toBe('');
    expect(process.env.GOOGLE_CLIENT_SECRET).toContain('GOCSPX-');
  });

  it('should create OAuth2 client successfully', () => {
    const oauth2Client = getOAuth2Client();
    expect(oauth2Client).toBeDefined();
    expect(oauth2Client._clientId).toBe(process.env.GOOGLE_CLIENT_ID);
    expect(oauth2Client._clientSecret).toBe(process.env.GOOGLE_CLIENT_SECRET);
  });

  it('should generate valid authorization URL', () => {
    const authUrl = getAuthUrl();
    expect(authUrl).toBeDefined();
    expect(authUrl).toContain('https://accounts.google.com/o/oauth2');
    expect(authUrl).toContain('client_id=');
    expect(authUrl).toContain('redirect_uri=');
    expect(authUrl).toContain('scope=');
    // Check for URL-encoded scope
    expect(authUrl).toContain('https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive');
  });

  it('should have correct redirect URI format', () => {
    const authUrl = getAuthUrl();
    const redirectUri = process.env.NODE_ENV === 'production'
      ? 'https://upbeat-creativity-production-27ac.up.railway.app/api/google/callback'
      : 'http://localhost:3000/api/google/callback';
    
    expect(authUrl).toContain(encodeURIComponent(redirectUri));
  });
});
