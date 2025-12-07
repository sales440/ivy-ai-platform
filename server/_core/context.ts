import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // TEMPORARY: Bypass OAuth for testing when VITE_BYPASS_AUTH is enabled
  const BYPASS_AUTH = process.env.VITE_BYPASS_AUTH === 'true';
  
  if (BYPASS_AUTH) {
    // Return mock admin user when bypass is active
    user = {
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
    
    console.log('[Auth Bypass] Using mock admin user - OAuth disabled');
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
