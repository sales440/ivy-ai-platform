import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Permission-based middleware factory
 * Creates a middleware that checks if the user has permission to perform an action on a resource
 */
import { hasPermission, type Resource, type Action } from './permissions';
import { getUserCompanyRole } from '../db';

export function requirePermission(resource: Resource, action: Action) {
  return t.middleware(async (opts) => {
    const { ctx, next, rawInput } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    // Global admins bypass permission checks
    if (ctx.user.role === 'admin') {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }

    // Get company ID from input
    const input = rawInput as any;
    const companyId = input?.companyId;

    if (!companyId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Company ID is required for permission check",
      });
    }

    // Get user's role in this company
    const userCompanyRole = await getUserCompanyRole(ctx.user.id, companyId);

    if (!userCompanyRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this company",
      });
    }

    // Check if role has permission
    if (!hasPermission(userCompanyRole, resource, action)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Your role (${userCompanyRole}) does not have permission to ${action} ${resource}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        companyRole: userCompanyRole,
      },
    });
  });
}
