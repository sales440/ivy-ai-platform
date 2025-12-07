import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // TEMPORARY: Bypass OAuth for testing - check this FIRST before any API calls
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';
  
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

  // Only make API call if bypass is NOT enabled
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !BYPASS_AUTH, // Disable query when bypass is active
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    if (BYPASS_AUTH) {
      // In bypass mode, just clear local storage and reload
      localStorage.removeItem("manus-runtime-user-info");
      window.location.href = '/';
      return;
    }
    
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [BYPASS_AUTH, logoutMutation, utils]);

  const state = useMemo(() => {
    const user = BYPASS_AUTH ? mockUser : meQuery.data;
    
    // Store user info in localStorage for other components
    if (user) {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(user)
      );
    }
    
    return {
      user: user ?? null,
      loading: BYPASS_AUTH ? false : (meQuery.isLoading || logoutMutation.isPending),
      error: BYPASS_AUTH ? null : (meQuery.error ?? logoutMutation.error ?? null),
      isAuthenticated: BYPASS_AUTH ? true : Boolean(meQuery.data),
    };
  }, [
    BYPASS_AUTH,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    // Don't redirect if bypass is enabled - user is always authenticated
    if (BYPASS_AUTH) return;
    
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    BYPASS_AUTH,
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => BYPASS_AUTH ? Promise.resolve({ data: mockUser }) : meQuery.refetch(),
    logout,
  };
}
