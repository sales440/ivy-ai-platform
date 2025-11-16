import { protectedProcedure, router } from "./_core/trpc";
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
  // Export leads to CSV
  leads: protectedProcedure.query(async () => {
    const leads = await db.getAllLeadsForExport();
    
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

  // Export tickets to CSV
  tickets: protectedProcedure.query(async () => {
    const tickets = await db.getAllTicketsForExport();
    
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
