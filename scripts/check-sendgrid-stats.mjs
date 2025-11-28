#!/usr/bin/env node

/**
 * Check SendGrid Statistics for FAGOR Campaign
 * 
 * Fetches email metrics (opens, clicks, bounces, etc.) from SendGrid API
 * for the FAGOR CNC Training 2026 campaign.
 */

import 'dotenv/config';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found in environment variables');
  process.exit(1);
}

/**
 * Fetch SendGrid stats for a specific date range
 */
async function getStats(startDate, endDate) {
  const url = `${SENDGRID_API_URL}/stats?start_date=${startDate}&end_date=${endDate}&aggregated_by=day`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`SendGrid API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch category stats (filtered by campaign)
 */
async function getCategoryStats(startDate, endDate, categories) {
  const categoryParam = categories.join(',');
  const url = `${SENDGRID_API_URL}/categories/stats?start_date=${startDate}&end_date=${endDate}&categories=${categoryParam}&aggregated_by=day`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`SendGrid API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate metrics from stats
 */
function calculateMetrics(stats) {
  let totals = {
    requests: 0,
    delivered: 0,
    opens: 0,
    unique_opens: 0,
    clicks: 0,
    unique_clicks: 0,
    bounces: 0,
    spam_reports: 0,
    unsubscribes: 0
  };

  stats.forEach(day => {
    day.stats.forEach(stat => {
      totals.requests += stat.metrics.requests || 0;
      totals.delivered += stat.metrics.delivered || 0;
      totals.opens += stat.metrics.opens || 0;
      totals.unique_opens += stat.metrics.unique_opens || 0;
      totals.clicks += stat.metrics.clicks || 0;
      totals.unique_clicks += stat.metrics.unique_clicks || 0;
      totals.bounces += stat.metrics.bounces || 0;
      totals.spam_reports += stat.metrics.spam_reports || 0;
      totals.unsubscribes += stat.metrics.unsubscribes || 0;
    });
  });

  // Calculate rates
  const deliveryRate = totals.requests > 0 ? (totals.delivered / totals.requests * 100).toFixed(2) : 0;
  const openRate = totals.delivered > 0 ? (totals.unique_opens / totals.delivered * 100).toFixed(2) : 0;
  const clickRate = totals.delivered > 0 ? (totals.unique_clicks / totals.delivered * 100).toFixed(2) : 0;
  const bounceRate = totals.requests > 0 ? (totals.bounces / totals.requests * 100).toFixed(2) : 0;

  return {
    ...totals,
    deliveryRate,
    openRate,
    clickRate,
    bounceRate
  };
}

/**
 * Format date for SendGrid API (YYYY-MM-DD)
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Main function
 */
async function main() {
  console.log('📊 Fetching SendGrid Statistics for FAGOR Campaign...\n');

  // Calculate date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  console.log(`📅 Date Range: ${startDateStr} to ${endDateStr}\n`);

  try {
    // Fetch overall stats
    console.log('Fetching overall stats...');
    const overallStats = await getStats(startDateStr, endDateStr);
    const overallMetrics = calculateMetrics(overallStats);

    console.log('\n📈 Overall Email Statistics (Last 7 Days):');
    console.log('─────────────────────────────────────────');
    console.log(`Total Sent:        ${overallMetrics.requests}`);
    console.log(`Delivered:         ${overallMetrics.delivered} (${overallMetrics.deliveryRate}%)`);
    console.log(`Unique Opens:      ${overallMetrics.unique_opens} (${overallMetrics.openRate}%)`);
    console.log(`Total Opens:       ${overallMetrics.opens}`);
    console.log(`Unique Clicks:     ${overallMetrics.unique_clicks} (${overallMetrics.clickRate}%)`);
    console.log(`Total Clicks:      ${overallMetrics.clicks}`);
    console.log(`Bounces:           ${overallMetrics.bounces} (${overallMetrics.bounceRate}%)`);
    console.log(`Spam Reports:      ${overallMetrics.spam_reports}`);
    console.log(`Unsubscribes:      ${overallMetrics.unsubscribes}`);

    // Try to fetch FAGOR-specific stats
    console.log('\n\nFetching FAGOR campaign stats...');
    try {
      const fagorStats = await getCategoryStats(startDateStr, endDateStr, ['FAGOR_CNC_Training_2026']);
      
      if (fagorStats && fagorStats.length > 0) {
        const fagorMetrics = calculateMetrics(fagorStats);
        
        console.log('\n🎯 FAGOR CNC Training 2026 Campaign:');
        console.log('─────────────────────────────────────────');
        console.log(`Total Sent:        ${fagorMetrics.requests}`);
        console.log(`Delivered:         ${fagorMetrics.delivered} (${fagorMetrics.deliveryRate}%)`);
        console.log(`Unique Opens:      ${fagorMetrics.unique_opens} (${fagorMetrics.openRate}%)`);
        console.log(`Total Opens:       ${fagorMetrics.opens}`);
        console.log(`Unique Clicks:     ${fagorMetrics.unique_clicks} (${fagorMetrics.clickRate}%)`);
        console.log(`Total Clicks:      ${fagorMetrics.clicks}`);
        console.log(`Bounces:           ${fagorMetrics.bounces} (${fagorMetrics.bounceRate}%)`);
        console.log(`Spam Reports:      ${fagorMetrics.spam_reports}`);
        console.log(`Unsubscribes:      ${fagorMetrics.unsubscribes}`);
      } else {
        console.log('ℹ️  No FAGOR-specific stats found (category may not be tracked)');
      }
    } catch (error) {
      console.log('ℹ️  Could not fetch category stats:', error.message);
    }

    console.log('\n\n✅ Stats fetched successfully!');
    console.log('\n💡 Tip: View detailed analytics in SendGrid Dashboard:');
    console.log('   https://app.sendgrid.com/statistics\n');

  } catch (error) {
    console.error('\n❌ Error fetching stats:', error.message);
    process.exit(1);
  }
}

main();
