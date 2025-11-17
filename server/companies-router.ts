import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { 
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  return next({ ctx });
});

export const companiesRouter = router({
  // List all companies (admin only)
  list: adminProcedure.query(async () => {
    const companies = await getAllCompanies();
    return companies || [];
  }),

  // Get single company by ID (admin only)
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const company = await getCompanyById(input.id);
      if (!company) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Company not found'
        });
      }
      return company;
    }),

  // Create new company (admin only)
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1, "Company name is required"),
      slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
      industry: z.string().optional(),
      plan: z.enum(['starter', 'professional', 'enterprise']).default('starter'),
      logo: z.string().optional(),
      website: z.string().url().optional().or(z.literal('')),
      contactEmail: z.string().email().optional().or(z.literal('')),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      try {
        return await createCompany(input);
      } catch (error: any) {
        if (error.message?.includes('Duplicate entry')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A company with this slug already exists'
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create company'
        });
      }
    }),

  // Update existing company (admin only)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
      industry: z.string().optional(),
      plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
      logo: z.string().optional(),
      website: z.string().url().optional().or(z.literal('')),
      contactEmail: z.string().email().optional().or(z.literal('')),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      try {
        const updated = await updateCompany(id, data);
        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Company not found'
          });
        }
        return updated;
      } catch (error: any) {
        if (error.message?.includes('Duplicate entry')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A company with this slug already exists'
          });
        }
        throw error;
      }
    }),

  // Delete company (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        return await deleteCompany(input.id);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete company'
        });
      }
    }),
});
