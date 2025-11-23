import { ENV } from "../_core/env";

/**
 * SendGrid Stats API Integration
 * Retrieves email analytics and metrics from SendGrid
 */

interface SendGridStatsParams {
  startDate: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  aggregatedBy?: "day" | "week" | "month";
}

interface EmailStats {
  date: string;
  stats: Array<{
    metrics: {
      blocks: number;
      bounce_drops: number;
      bounces: number;
      clicks: number;
      deferred: number;
      delivered: number;
      invalid_emails: number;
      opens: number;
      processed: number;
      requests: number;
      spam_report_drops: number;
      spam_reports: number;
      unique_clicks: number;
      unique_opens: number;
      unsubscribe_drops: number;
      unsubscribes: number;
    };
  }>;
}

interface AggregatedStats {
  totalSent: number;
  totalDelivered: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  totalSpamReports: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  deliveryRate: number;
}

/**
 * Get email statistics from SendGrid
 */
export async function getSendGridStats(
  params: SendGridStatsParams
): Promise<EmailStats[]> {
  if (!ENV.sendgridApiKey) {
    console.warn("[SendGrid Stats] API key not configured");
    return [];
  }

  const { startDate, endDate, aggregatedBy = "day" } = params;
  const endDateParam = endDate || new Date().toISOString().split("T")[0];

  const url = `https://api.sendgrid.com/v3/stats?start_date=${startDate}&end_date=${endDateParam}&aggregated_by=${aggregatedBy}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ENV.sendgridApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `SendGrid Stats API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    return data as EmailStats[];
  } catch (error: any) {
    console.error("[SendGrid Stats] Failed to fetch stats:", error.message);
    throw error;
  }
}

/**
 * Get aggregated email statistics
 */
export async function getAggregatedStats(
  params: SendGridStatsParams
): Promise<AggregatedStats> {
  const stats = await getSendGridStats(params);

  const aggregated: AggregatedStats = {
    totalSent: 0,
    totalDelivered: 0,
    totalOpens: 0,
    totalClicks: 0,
    totalBounces: 0,
    totalSpamReports: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    deliveryRate: 0,
  };

  // Aggregate metrics across all dates
  stats.forEach((dayStat) => {
    dayStat.stats.forEach((stat) => {
      const m = stat.metrics;
      aggregated.totalSent += m.requests;
      aggregated.totalDelivered += m.delivered;
      aggregated.totalOpens += m.unique_opens;
      aggregated.totalClicks += m.unique_clicks;
      aggregated.totalBounces += m.bounces;
      aggregated.totalSpamReports += m.spam_reports;
    });
  });

  // Calculate rates
  if (aggregated.totalSent > 0) {
    aggregated.deliveryRate =
      (aggregated.totalDelivered / aggregated.totalSent) * 100;
    aggregated.bounceRate =
      (aggregated.totalBounces / aggregated.totalSent) * 100;
  }

  if (aggregated.totalDelivered > 0) {
    aggregated.openRate =
      (aggregated.totalOpens / aggregated.totalDelivered) * 100;
    aggregated.clickRate =
      (aggregated.totalClicks / aggregated.totalDelivered) * 100;
  }

  return aggregated;
}

/**
 * Get email stats for the last N days
 */
export async function getRecentStats(days: number = 30): Promise<AggregatedStats> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const params: SendGridStatsParams = {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    aggregatedBy: "day",
  };

  return getAggregatedStats(params);
}

/**
 * Get daily email stats for charting
 */
export async function getDailyStats(
  days: number = 30
): Promise<
  Array<{
    date: string;
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
  }>
> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const params: SendGridStatsParams = {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    aggregatedBy: "day",
  };

  const stats = await getSendGridStats(params);

  return stats.map((dayStat) => {
    const metrics = dayStat.stats[0]?.metrics || {
      requests: 0,
      delivered: 0,
      unique_opens: 0,
      unique_clicks: 0,
      bounces: 0,
    };

    return {
      date: dayStat.date,
      sent: metrics.requests,
      delivered: metrics.delivered,
      opens: metrics.unique_opens,
      clicks: metrics.unique_clicks,
      bounces: metrics.bounces,
    };
  });
}
