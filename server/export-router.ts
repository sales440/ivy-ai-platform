import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Helper function to convert array of objects to CSV
function arrayToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) return headers.join(',') + '\n';
  
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert dates to ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      // Escape quotes and wrap in quotes if contains comma or newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export const exportRouter = router({
  // Export leads to CSV with optional filters
  leads: protectedProcedure
    .input(z.object({
      status: z.enum(["new", "contacted", "qualified", "nurture", "converted", "lost"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let leads = await db.getAllLeadsForExport();
      
      // Apply filters
      if (input) {
        if (input.status) {
          leads = leads.filter(lead => lead.status === input.status);
        }
        if (input.startDate) {
          const startDate = new Date(input.startDate);
          leads = leads.filter(lead => lead.createdAt && new Date(lead.createdAt) >= startDate);
        }
        if (input.endDate) {
          const endDate = new Date(input.endDate);
          leads = leads.filter(lead => lead.createdAt && new Date(lead.createdAt) <= endDate);
        }
      }
    
    const headers = [
      'id',
      'leadId',
      'name',
      'email',
      'company',
      'phone',
      'source',
      'status',
      'score',
      'notes',
      'assignedTo',
      'createdAt',
      'updatedAt',
    ];
    
    const csv = arrayToCSV(leads, headers);
    
    return {
      filename: `leads_export_${new Date().toISOString().split('T')[0]}.csv`,
      content: csv,
      count: leads.length,
    };
  }),

  // Export tickets to CSV with optional filters
  tickets: protectedProcedure
    .input(z.object({
      status: z.enum(["open", "in_progress", "resolved", "escalated", "closed"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      let tickets = await db.getAllTicketsForExport();
      
      // Apply filters
      if (input) {
        if (input.status) {
          tickets = tickets.filter(ticket => ticket.status === input.status);
        }
        if (input.priority) {
          tickets = tickets.filter(ticket => ticket.priority === input.priority);
        }
        if (input.startDate) {
          const startDate = new Date(input.startDate);
          tickets = tickets.filter(ticket => ticket.createdAt && new Date(ticket.createdAt) >= startDate);
        }
        if (input.endDate) {
          const endDate = new Date(input.endDate);
          tickets = tickets.filter(ticket => ticket.createdAt && new Date(ticket.createdAt) <= endDate);
        }
      }
    
    const headers = [
      'id',
      'ticketId',
      'title',
      'description',
      'status',
      'priority',
      'category',
      'customerId',
      'customerEmail',
      'assignedAgent',
      'resolution',
      'createdAt',
      'resolvedAt',
      'updatedAt',
    ];
    
    const csv = arrayToCSV(tickets, headers);
    
    return {
      filename: `tickets_export_${new Date().toISOString().split('T')[0]}.csv`,
      content: csv,
      count: tickets.length,
    };
  }),
});
