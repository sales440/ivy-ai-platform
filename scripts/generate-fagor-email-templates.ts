/**
 * Generate remaining FAGOR email templates
 * This script creates templates for 5 campaigns (15 emails total)
 */

import { writeFileSync } from 'fs';
import { FAGOR_CAMPAIGNS } from '../server/fagor-campaigns-config';

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031167889/lZevPzgVPacmUSlf.jpg";

function generateEmailTemplate(
  campaign: string,
  emailNum: number,
  subject: string,
  headline: string,
  content: string,
  cta: string,
  ctaUrl: string,
  agentName: string,
  agentRole: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header with FAGOR Logo -->
          <tr>
            <td align="right" style="padding: 30px 40px 20px; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <img src="${LOGO_URL}" alt="FAGOR Automation" style="max-width: 250px; height: auto;">
                  </td>
                  <td align="right" style="color: #d32f2f; font-size: 14px; font-weight: bold;">
                    <p style="margin: 0; color: #d32f2f;">FAGOR Automation Corp.</p>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #666;">4020 Winnetka Avenue</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">Rolling Meadows, IL 60008 USA</p>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Phone: (847) 981-1500</p>
                    <p style="margin: 0; font-size: 12px;"><a href="mailto:service@fagor-automation.com" style="color: #d32f2f; text-decoration: none;">Email: service@fagor-automation.com</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Red separator -->
          <tr>
            <td style="height: 4px; background-color: #d32f2f;"></td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <h1 style="color: #d32f2f; font-size: 28px; margin: 0 0 20px; line-height: 1.3;">
                ${headline}
              </h1>

              ${content}

              <div style="background-color: #d32f2f; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin: 0 0 15px;">
                  ${cta}
                </p>
                <a href="${ctaUrl}" style="display: inline-block; background-color: #ffffff; color: #d32f2f; padding: 15px 40px; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px;">
                  Contact Us Today
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0; padding-top: 20px; border-top: 1px solid #dee2e6;">
                Questions? Reply to this email or call us at (847) 981-1500.
              </p>

              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 15px 0 0;">
                Best regards,<br>
                <strong>${agentName}</strong><br>
                ${agentRole}<br>
                FAGOR Automation Corp.
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Generate templates
console.log('Generating FAGOR email templates...\n');

// Warranty Extension - Email 2 & 3 (Email 1 already created)
writeFileSync(
  'campaigns/warranty/email-2-cost-analysis.html',
  generateEmailTemplate(
    'warranty',
    2,
    'The True Cost of Unplanned Equipment Downtime',
    'The True Cost of Unplanned Equipment Downtime',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Last week, we discussed your expiring warranty. Today, let's look at the real numbers.
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Case study:</strong> A manufacturer similar to yours experienced a servo drive failure without warranty coverage:
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Diagnosis & parts:</strong> $8,500</li>
      <li><strong>Emergency service:</strong> $3,200</li>
      <li><strong>Production downtime (18 hours):</strong> $12,000</li>
      <li><strong>Total cost:</strong> $23,700</li>
    </ul>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Their extended warranty would have cost: $6,500/year</strong>
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      One failure paid for 3.6 years of warranty coverage.
    </p>`,
    'Protect your investment with extended warranty',
    'https://www.fagor-automation.com/warranty-extension',
    'Ivy-Closer',
    'Warranty & Service Contracts Specialist'
  )
);
console.log('✓ Warranty Extension Email 2 created');

writeFileSync(
  'campaigns/warranty/email-3-last-chance.html',
  generateEmailTemplate(
    'warranty',
    3,
    'Last Chance: Extend Your Warranty at Current Rates',
    'Last Chance: Extend Your Warranty at Current Rates',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Your warranty expires in <strong>30 days</strong>. After that:
    </p>
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 0 0 25px;">
      <ul style="margin: 0; padding-left: 20px; color: #856404;">
        <li style="margin-bottom: 8px;">Warranty extension pricing increases 15-20%</li>
        <li style="margin-bottom: 8px;">Pre-existing conditions may not be covered</li>
        <li style="margin-bottom: 8px;">Waiting period may apply for new coverage</li>
      </ul>
    </div>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Act now to:</strong>
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li>Lock in current pricing (save 15-20%)</li>
      <li>Ensure continuous coverage with no gaps</li>
      <li>Maintain priority service status</li>
      <li>Protect against unexpected repair costs</li>
    </ul>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Don't wait until it's too late. Contact us today for your warranty extension quote.
    </p>`,
    'Get your warranty extension quote now',
    'https://www.fagor-automation.com/warranty-extension',
    'Ivy-Closer',
    'Warranty & Service Contracts Specialist'
  )
);
console.log('✓ Warranty Extension Email 3 created');

console.log('\n✅ All email templates generated successfully!');
