/**
 * Proactive Email Alert System for FAGOR Agent Performance
 * 
 * Sends email notifications to the owner when:
 * - An agent reaches a milestone
 * - Agent performance drops below critical thresholds
 * - Significant changes in metrics are detected
 */

import { ENV } from "./_core/env";

interface MilestoneAlert {
  agentName: string;
  campaignName: string;
  milestoneType: string;
  value: number;
  threshold: number;
  message: string;
}

interface PerformanceDropAlert {
  agentName: string;
  campaignName: string;
  metric: string;
  currentValue: number;
  previousValue: number;
  dropPercentage: number;
  severity: 'warning' | 'critical';
}

/**
 * Send milestone achievement email to owner
 */
export async function sendMilestoneEmail(alert: MilestoneAlert): Promise<boolean> {
  try {
    const emailContent = generateMilestoneEmailHTML(alert);
    
    const response = await fetch(`${ENV.builtInForgeApiUrl}/v1/notification/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.builtInForgeApiKey}`,
      },
      body: JSON.stringify({
        to: ENV.ownerName,
        subject: `🎯 ${alert.agentName} Milestone Achieved: ${alert.milestoneType}`,
        html: emailContent,
      }),
    });

    if (!response.ok) {
      console.error('[EmailAlerts] Failed to send milestone email:', await response.text());
      return false;
    }

    console.log(`[EmailAlerts] ✅ Milestone email sent for ${alert.agentName}`);
    return true;
  } catch (error) {
    console.error('[EmailAlerts] Error sending milestone email:', error);
    return false;
  }
}

/**
 * Send performance drop warning email to owner
 */
export async function sendPerformanceDropEmail(alert: PerformanceDropAlert): Promise<boolean> {
  try {
    const emailContent = generatePerformanceDropEmailHTML(alert);
    
    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
    const response = await fetch(`${ENV.builtInForgeApiUrl}/v1/notification/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.builtInForgeApiKey}`,
      },
      body: JSON.stringify({
        to: ENV.ownerName,
        subject: `${emoji} Performance Alert: ${alert.agentName} - ${alert.metric}`,
        html: emailContent,
      }),
    });

    if (!response.ok) {
      console.error('[EmailAlerts] Failed to send performance drop email:', await response.text());
      return false;
    }

    console.log(`[EmailAlerts] ✅ Performance drop email sent for ${alert.agentName}`);
    return true;
  } catch (error) {
    console.error('[EmailAlerts] Error sending performance drop email:', error);
    return false;
  }
}

/**
 * Generate HTML email content for milestone achievements
 */
function generateMilestoneEmailHTML(alert: MilestoneAlert): string {
  const milestoneIcons: Record<string, string> = {
    conversions: '🎯',
    conversion_rate: '📈',
    roi: '💰',
    emails_sent: '📧',
    open_rate: '✉️',
  };

  const icon = milestoneIcons[alert.milestoneType] || '🎉';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Achieved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                ${icon} Milestone Achieved!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #374151; line-height: 1.6;">
                Great news! <strong>${alert.agentName}</strong> has reached an important milestone in the <strong>${alert.campaignName}</strong> campaign.
              </p>
              
              <!-- Milestone Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 30px 0;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <div style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                      ${alert.milestoneType.replace(/_/g, ' ')}
                    </div>
                    <div style="font-size: 48px; font-weight: bold; color: #667eea; margin-bottom: 10px;">
                      ${alert.value}${alert.milestoneType.includes('rate') || alert.milestoneType === 'roi' ? '%' : ''}
                    </div>
                    <div style="font-size: 14px; color: #9ca3af;">
                      Threshold: ${alert.threshold}${alert.milestoneType.includes('rate') || alert.milestoneType === 'roi' ? '%' : ''}
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
                ${alert.message}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                This is an automated notification from Ivy.AI Platform
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #d1d5db;">
                You're receiving this because you're the owner of this FAGOR campaign
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email content for performance drops
 */
function generatePerformanceDropEmailHTML(alert: PerformanceDropAlert): string {
  const severityColors = {
    warning: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    critical: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  };

  const colors = severityColors[alert.severity];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${colors.bg}; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; border-left: 4px solid ${colors.border};">
              <h1 style="margin: 0; color: ${colors.text}; font-size: 28px; font-weight: bold;">
                ${alert.severity === 'critical' ? '🚨' : '⚠️'} Performance Alert
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #374151; line-height: 1.6;">
                <strong>${alert.agentName}</strong> in the <strong>${alert.campaignName}</strong> campaign has experienced a significant drop in <strong>${alert.metric}</strong>.
              </p>
              
              <!-- Performance Comparison -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid ${colors.border}; border-radius: 8px; margin: 30px 0;">
                <tr>
                  <td style="padding: 20px; width: 50%; border-right: 1px solid #e5e7eb;">
                    <div style="text-align: center;">
                      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                        Previous Value
                      </div>
                      <div style="font-size: 32px; font-weight: bold; color: #10b981;">
                        ${alert.previousValue.toFixed(1)}%
                      </div>
                    </div>
                  </td>
                  <td style="padding: 20px; width: 50%;">
                    <div style="text-align: center;">
                      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                        Current Value
                      </div>
                      <div style="font-size: 32px; font-weight: bold; color: ${colors.text};">
                        ${alert.currentValue.toFixed(1)}%
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 20px; background-color: ${colors.bg}; text-align: center; border-radius: 0 0 6px 6px;">
                    <div style="font-size: 18px; font-weight: bold; color: ${colors.text};">
                      ↓ ${Math.abs(alert.dropPercentage).toFixed(1)}% Drop
                    </div>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin-top: 30px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 600;">
                  💡 Recommended Actions:
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #1e3a8a; line-height: 1.8;">
                  <li>Review recent email content and subject lines</li>
                  <li>Check audience targeting and segmentation</li>
                  <li>Analyze send timing and frequency</li>
                  <li>Compare with high-performing agents</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                This is an automated alert from Ivy.AI Platform
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #d1d5db;">
                Immediate attention recommended for ${alert.severity} alerts
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Check for performance drops and send alerts
 */
export async function checkPerformanceDrops(
  currentMetrics: any[],
  previousMetrics: any[]
): Promise<void> {
  const CRITICAL_DROP_THRESHOLD = 30; // 30% drop is critical
  const WARNING_DROP_THRESHOLD = 15; // 15% drop is warning

  for (const current of currentMetrics) {
    const previous = previousMetrics.find(p => p.agentId === current.agentId);
    
    if (!previous) continue;

    // Check conversion rate drop
    if (previous.conversionRate > 0) {
      const dropPercentage = ((current.conversionRate - previous.conversionRate) / previous.conversionRate) * 100;
      
      if (dropPercentage < -CRITICAL_DROP_THRESHOLD) {
        await sendPerformanceDropEmail({
          agentName: current.agentName,
          campaignName: current.campaignName,
          metric: 'Conversion Rate',
          currentValue: current.conversionRate,
          previousValue: previous.conversionRate,
          dropPercentage,
          severity: 'critical',
        });
      } else if (dropPercentage < -WARNING_DROP_THRESHOLD) {
        await sendPerformanceDropEmail({
          agentName: current.agentName,
          campaignName: current.campaignName,
          metric: 'Conversion Rate',
          currentValue: current.conversionRate,
          previousValue: previous.conversionRate,
          dropPercentage,
          severity: 'warning',
        });
      }
    }

    // Check ROI drop
    if (previous.roi > 0) {
      const dropPercentage = ((current.roi - previous.roi) / previous.roi) * 100;
      
      if (dropPercentage < -CRITICAL_DROP_THRESHOLD) {
        await sendPerformanceDropEmail({
          agentName: current.agentName,
          campaignName: current.campaignName,
          metric: 'ROI',
          currentValue: current.roi,
          previousValue: previous.roi,
          dropPercentage,
          severity: 'critical',
        });
      }
    }

    // Check open rate drop
    if (previous.openRate > 0) {
      const dropPercentage = ((current.openRate - previous.openRate) / previous.openRate) * 100;
      
      if (dropPercentage < -CRITICAL_DROP_THRESHOLD) {
        await sendPerformanceDropEmail({
          agentName: current.agentName,
          campaignName: current.campaignName,
          metric: 'Open Rate',
          currentValue: current.openRate,
          previousValue: previous.openRate,
          dropPercentage,
          severity: 'critical',
        });
      }
    }
  }
}
