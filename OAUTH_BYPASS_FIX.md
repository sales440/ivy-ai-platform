# OAuth Bypass Fix - Production Access

## Problem Identified

The initial OAuth bypass implementation was not working because:

1. **Redirect happened before bypass check**: The app was redirecting to Manus OAuth portal before checking if `VITE_BYPASS_AUTH` was enabled
2. **Query still executed**: The `trpc.auth.me.useQuery()` was still making API calls even when bypass was active
3. **Redirect logic not disabled**: The `useEffect` that redirects unauthenticated users was still running

## Solution Implemented

### Changes to `client/src/_core/hooks/useAuth.ts`

1. **Check bypass FIRST** - before any API calls or redirects:
```typescript
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';
```

2. **Disable API query when bypass is active**:
```typescript
const meQuery = trpc.auth.me.useQuery(undefined, {
  retry: false,
  refetchOnWindowFocus: false,
  enabled: !BYPASS_AUTH, // Disable query when bypass is active
});
```

3. **Return mock user immediately when bypass is enabled**:
```typescript
const mockUser = {
  id: 999,
  openId: 'mock-admin-user',
  name: 'Admin User (Bypass)',
  email: 'admin@ivybai.com',
  role: 'admin' as const,
  loginMethod: 'bypass',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const state = useMemo(() => {
  const user = BYPASS_AUTH ? mockUser : meQuery.data;
  // ...
  return {
    user: user ?? null,
    loading: BYPASS_AUTH ? false : (meQuery.isLoading || logoutMutation.isPending),
    error: BYPASS_AUTH ? null : (meQuery.error ?? logoutMutation.error ?? null),
    isAuthenticated: BYPASS_AUTH ? true : Boolean(meQuery.data),
  };
}, [BYPASS_AUTH, meQuery.data, ...]);
```

4. **Prevent redirect when bypass is enabled**:
```typescript
useEffect(() => {
  // Don't redirect if bypass is enabled - user is always authenticated
  if (BYPASS_AUTH) return;
  
  if (!redirectOnUnauthenticated) return;
  // ... rest of redirect logic
}, [BYPASS_AUTH, ...]);
```

5. **Handle logout in bypass mode**:
```typescript
const logout = useCallback(async () => {
  if (BYPASS_AUTH) {
    // In bypass mode, just clear local storage and reload
    localStorage.removeItem("manus-runtime-user-info");
    window.location.href = '/';
    return;
  }
  // ... normal logout logic
}, [BYPASS_AUTH, ...]);
```

## How It Works Now

### With `VITE_BYPASS_AUTH=true` (Railway Production)

1. User visits app URL
2. `useAuth` hook checks `VITE_BYPASS_AUTH` environment variable
3. If `true`, immediately returns mock admin user
4. No API call to `/api/trpc/auth.me` is made
5. No redirect to Manus OAuth portal occurs
6. User sees dashboard immediately with full admin access

### With `VITE_BYPASS_AUTH=false` or not set (Normal Production)

1. User visits app URL
2. `useAuth` hook makes API call to check authentication
3. If not authenticated, redirects to Manus OAuth portal
4. After successful OAuth login, returns to app with real user data
5. Normal authentication flow continues

## Railway Configuration

The bypass is already configured in Railway:

```
VITE_BYPASS_AUTH=true
```

This variable is visible in the Railway dashboard under **Variables** tab.

## Testing the Fix

1. **Railway deployment**: Push to GitHub triggers automatic deployment (5-7 minutes)
2. **Access URL**: https://ivy-ai-platform-production.up.railway.app/
3. **Expected behavior**: 
   - No redirect to Manus OAuth
   - Direct access to dashboard
   - User shown as "Admin User (Bypass)"
   - Full admin permissions

## Removing the Bypass (Future)

When OAuth is properly configured:

1. Go to Railway dashboard → Variables
2. Change `VITE_BYPASS_AUTH` from `true` to `false`
3. Redeploy (automatic)
4. Add proper OAuth redirect URI in Manus Dashboard:
   ```
   https://ivy-ai-platform-production.up.railway.app/api/oauth/callback
   ```

## Security Note

⚠️ **IMPORTANT**: This bypass should only be used temporarily for testing. In production with real users, always use proper OAuth authentication by:

1. Setting `VITE_BYPASS_AUTH=false`
2. Configuring correct redirect URI in Manus OAuth settings
3. Testing OAuth login flow thoroughly

The mock user has full admin access, so anyone can access the app when bypass is enabled.
