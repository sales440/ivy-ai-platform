/**
 * Report Export Utilities
 * Generate PDF and Excel reports from dashboard data
 */

/**
 * Export data to CSV (Excel-compatible)
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export leads to CSV
 */
export function exportLeadsToCSV(leads: any[]) {
  const formattedLeads = leads.map(lead => ({
    'ID': lead.id,
    'Name': lead.name,
    'Email': lead.email,
    'Company': lead.company,
    'Industry': lead.industry,
    'Status': lead.status,
    'Priority': lead.priority,
    'Score': lead.score || 0,
    'Created At': new Date(lead.createdAt).toLocaleDateString(),
  }));

  exportToCSV(formattedLeads, `leads-export-${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export tickets to CSV
 */
export function exportTicketsToCSV(tickets: any[]) {
  const formattedTickets = tickets.map(ticket => ({
    'ID': ticket.id,
    'Title': ticket.title,
    'Status': ticket.status,
    'Priority': ticket.priority,
    'Assigned To': ticket.assignedTo || 'Unassigned',
    'Created At': new Date(ticket.createdAt).toLocaleDateString(),
    'Resolved At': ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : '-',
  }));

  exportToCSV(formattedTickets, `tickets-export-${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export ROI data to CSV
 */
export function exportROIToCSV(roiData: any[]) {
  const formattedROI = roiData.map(sector => ({
    'Sector': sector.sector,
    'Leads Activos': sector.leadCount,
    'Tasa de Conversión (%)': sector.conversionRate,
    'Conversiones Esperadas': sector.expectedConversions,
    'Ticket Promedio (MXN)': sector.avgTicket,
    'Revenue Proyectado (MXN)': sector.projectedRevenue,
    'Días Promedio de Cierre': sector.avgCloseDays,
  }));

  exportToCSV(formattedROI, `roi-report-${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export campaign metrics to CSV
 */
export function exportCampaignMetricsToCSV(metrics: any[]) {
  const formattedMetrics = metrics.map(metric => ({
    'Sector': metric.industry || 'Unknown',
    'Emails Enviados': metric.totalSent,
    'Aperturas': metric.totalOpens,
    'Clicks': metric.totalClicks,
    'Respuestas': metric.totalResponses,
    'Tasa de Apertura (%)': ((metric.totalOpens / metric.totalSent) * 100).toFixed(1),
    'Tasa de Click (%)': ((metric.totalClicks / metric.totalSent) * 100).toFixed(1),
    'Tasa de Respuesta (%)': ((metric.totalResponses / metric.totalSent) * 100).toFixed(1),
  }));

  exportToCSV(formattedMetrics, `campaign-metrics-${new Date().toISOString().split('T')[0]}`);
}

/**
 * Generate simple PDF report (using browser print)
 */
export function generatePDFReport(title: string, content: string) {
  // Create a new window with the report content
  const printWindow = window.open('', '', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to generate PDF reports');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
          }
          .meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          Generated on: ${new Date().toLocaleString('es-MX')}
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Ivy.AI Platform - EPM Construcciones</p>
          <p>Confidential Report - For Internal Use Only</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Generate ROI PDF Report
 */
export function generateROIPDFReport(roiData: any[]) {
  const tableRows = roiData.map(sector => `
    <tr>
      <td>${sector.sector}</td>
      <td>${sector.leadCount}</td>
      <td>${sector.conversionRate}%</td>
      <td>${sector.expectedConversions}</td>
      <td>$${sector.projectedRevenue.toLocaleString('es-MX')}</td>
      <td>${sector.avgCloseDays} días</td>
    </tr>
  `).join('');

  const content = `
    <h2>ROI Analysis by Sector</h2>
    <table>
      <thead>
        <tr>
          <th>Sector</th>
          <th>Active Leads</th>
          <th>Conversion Rate</th>
          <th>Expected Conversions</th>
          <th>Projected Revenue</th>
          <th>Avg. Close Days</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <h3>Summary</h3>
    <p>
      <strong>Total Projected Revenue:</strong> $${roiData.reduce((sum, s) => sum + s.projectedRevenue, 0).toLocaleString('es-MX')} MXN<br>
      <strong>Total Expected Conversions:</strong> ${roiData.reduce((sum, s) => sum + s.expectedConversions, 0)}<br>
      <strong>Data Source:</strong> EPM Historical Performance (2023-2024)
    </p>
  `;

  generatePDFReport('ROI Dashboard Report', content);
}
