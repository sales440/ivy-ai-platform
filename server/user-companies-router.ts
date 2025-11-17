import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";

export const userCompaniesRouter = router({
  // Get all companies assigned to current user
  myCompanies: protectedProcedure.query(async ({ ctx }) => {
    const assignments = await db.getUserCompanies(ctx.user.id);
    const companiesData = await db.getAllCompanies();
    
    // Filter companies to only those assigned to user (or all if admin)
    if (ctx.user.role === 'admin') {
      return { companies: companiesData };
    }
    
    const assignedCompanyIds = assignments.map(a => a.companyId);
    const filteredCompanies = companiesData.filter((c: any) => assignedCompanyIds.includes(c.id));
    
    return { companies: filteredCompanies };
  }),

  // Get all users assigned to a company (admin only)
  companyUsers: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }
      
      const assignments = await db.getCompanyUsers(input.companyId);
      return { assignments };
    }),

  // Assign user to company (admin only)
  assign: protectedProcedure
    .input(z.object({
      userId: z.number(),
      companyId: z.number(),
      role: z.enum(["viewer", "member", "admin"]).default("member")
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }
      
      const assignment = await db.assignUserToCompany(input);
      
      // Get user and company details for notification
      const user = await db.getUserByOpenId(ctx.user.openId);
      const company = await db.getCompanyById(input.companyId);
      
      if (user && company) {
        await notifyOwner({
          title: `User Assigned to Company`,
          content: `${user.name || user.email} has been assigned to ${company.name} with role: ${input.role}`
        });
      }
      
      return { success: true, assignment };
    }),

  // Remove user from company (admin only)
  remove: protectedProcedure
    .input(z.object({
      userId: z.number(),
      companyId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }
      
      await db.removeUserFromCompany(input.userId, input.companyId);
      
      // Get user and company details for notification
      const user = await db.getUserByOpenId(ctx.user.openId);
      const company = await db.getCompanyById(input.companyId);
      
      if (user && company) {
        await notifyOwner({
          title: `User Removed from Company`,
          content: `${user.name || user.email} has been removed from ${company.name}`
        });
      }
      
      return { success: true };
    }),

  // Get all assignments (admin only)
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error("Unauthorized: Admin access required");
    }
    
    const allCompanies = await db.getAllCompanies();
    const allAssignments = [];
    
    for (const company of allCompanies) {
      const companyAssignments = await db.getCompanyUsers(company.id);
      allAssignments.push(...companyAssignments);
    }
    
    return { assignments: allAssignments };
  }),

  // Get all users in the system (admin only)
  allUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error("Unauthorized: Admin access required");
    }
    
    const users = await db.getAllUsers();
    return { users };
  }),

  // Update user role in company (admin only)
  updateRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      companyId: z.number(),
      role: z.enum(["viewer", "member", "admin"])
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }
      
      await db.updateUserCompanyRole(input.userId, input.companyId, input.role);
      
      // Get user and company details for notification
      const user = await db.getUserByOpenId(ctx.user.openId);
      const company = await db.getCompanyById(input.companyId);
      
      if (user && company) {
        await notifyOwner({
          title: `User Role Updated`,
          content: `${user.name || user.email}'s role in ${company.name} has been changed to: ${input.role}`
        });
      }
      
      return { success: true };
    }),
});
