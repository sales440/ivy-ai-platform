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

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
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
  }, [logoutMutation, utils]);

  // TEMPORARY: Bypass OAuth for testing
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';
  
  const mockUser = BYPASS_AUTH ? {
    id: 999,
    openId: 'mock-user',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin' as const,
    loginMethod: 'mock',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } : null;

  const state = useMemo(() => {
    const user = BYPASS_AUTH ? mockUser : meQuery.data;
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(user)
    );
    return {
      user: user ?? null,
      loading: BYPASS_AUTH ? false : (meQuery.isLoading || logoutMutation.isPending),
      error: BYPASS_AUTH ? null : (meQuery.error ?? logoutMutation.error ?? null),
      isAuthenticated: BYPASS_AUTH ? true : Boolean(meQuery.data),
    };
  }, [
    BYPASS_AUTH,
    mockUser,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
