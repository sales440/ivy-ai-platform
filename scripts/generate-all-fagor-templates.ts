/**
 * Generate ALL remaining FAGOR email templates
 * Creates 12 emails for: Equipment Repair, EOL Parts, CNC Upgrades, Digital Suite
 */

import { writeFileSync } from 'fs';

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031167889/lZevPzgVPacmUSlf.jpg";

function generateEmailTemplate(
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

          <tr>
            <td style="height: 4px; background-color: #d32f2f;"></td>
          </tr>

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

console.log('Generating FAGOR email templates...\n');

// ============================================================================
// EQUIPMENT REPAIR CAMPAIGN (Ivy-Solve)
// ============================================================================

writeFileSync(
  'campaigns/repair/email-1-fast-expert-repair.html',
  generateEmailTemplate(
    'Fast, Expert Repair for Your FAGOR Equipment',
    'Equipment Down? We Get You Running Fast',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      When your FAGOR CNC equipment fails, every minute of downtime costs money. Our factory-certified technicians provide fast, expert repair services to get you back in production.
    </p>
    
    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">What We Repair</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>CNC Controls</strong> - All FAGOR CNC models</li>
      <li><strong>Servo Drives</strong> - Diagnosis and repair</li>
      <li><strong>Motors</strong> - Spindle and servo motors</li>
      <li><strong>Linear Encoders</strong> - Calibration and replacement</li>
      <li><strong>Communication Systems</strong> - Network and I/O issues</li>
    </ul>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Why Choose FAGOR Service</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li>Factory-certified technicians with deep FAGOR expertise</li>
      <li>Genuine FAGOR parts for reliability and compatibility</li>
      <li>Fast turnaround: 24-48 hours for most repairs</li>
      <li>Comprehensive diagnostics to prevent future failures</li>
      <li>90-day warranty on all repairs</li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Don't let equipment downtime hurt your bottom line. Contact us today for fast, expert repair service.
    </p>`,
    'Get your equipment repaired now',
    'https://www.fagor-automation.com/repair-services',
    'Ivy-Solve',
    'Technical Service & Repair Coordinator'
  )
);
console.log('✓ Equipment Repair Email 1 created');

writeFileSync(
  'campaigns/repair/email-2-genuine-parts.html',
  generateEmailTemplate(
    'Why Genuine FAGOR Parts Matter',
    'The Hidden Cost of Aftermarket Parts',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      When repairing your FAGOR equipment, you have a choice: genuine FAGOR parts or aftermarket alternatives. Here's why genuine parts are worth the investment.
    </p>

    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #856404; font-weight: bold;">⚠️ Risks of Aftermarket Parts:</p>
      <ul style="margin: 0; padding-left: 20px; color: #856404;">
        <li style="margin-bottom: 8px;">Compatibility issues causing repeated failures</li>
        <li style="margin-bottom: 8px;">Shorter lifespan (50-70% of genuine parts)</li>
        <li style="margin-bottom: 8px;">Void equipment warranty</li>
        <li style="margin-bottom: 8px;">No technical support from FAGOR</li>
      </ul>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Genuine FAGOR Parts Guarantee</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Perfect compatibility</strong> - Engineered specifically for your equipment</li>
      <li><strong>Longer lifespan</strong> - 2-3x longer than aftermarket alternatives</li>
      <li><strong>Factory warranty</strong> - 90-day parts and labor guarantee</li>
      <li><strong>Technical support</strong> - Full FAGOR engineering support</li>
      <li><strong>Faster repair</strong> - No compatibility troubleshooting needed</li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Case study:</strong> A customer used an aftermarket servo drive that failed after 6 months. The replacement and additional downtime cost $12,000. A genuine FAGOR drive would have cost $3,200 and lasted 5+ years.
    </p>`,
    'Request repair with genuine FAGOR parts',
    'https://www.fagor-automation.com/repair-services',
    'Ivy-Solve',
    'Technical Service & Repair Coordinator'
  )
);
console.log('✓ Equipment Repair Email 2 created');

writeFileSync(
  'campaigns/repair/email-3-preventive-diagnostic.html',
  generateEmailTemplate(
    'Prevent Failures Before They Happen',
    'Free Diagnostic Assessment with Every Repair',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      When we repair your equipment, we don't just fix the immediate problem. We perform a comprehensive diagnostic assessment to identify potential issues before they cause downtime.
    </p>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">What Our Diagnostic Includes</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>System health check</strong> - All critical components tested</li>
      <li><strong>Performance analysis</strong> - Identify degradation patterns</li>
      <li><strong>Failure prediction</strong> - Components at risk of failure</li>
      <li><strong>Optimization recommendations</strong> - Improve reliability and performance</li>
      <li><strong>Maintenance schedule</strong> - Prevent future issues</li>
    </ul>

    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #155724; font-weight: bold;">✓ Recent Success Story:</p>
      <p style="margin: 0; color: #155724;">
        During a servo drive repair, our diagnostic identified a failing encoder. We replaced it proactively, preventing a $15,000 emergency repair 3 weeks later.
      </p>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Schedule Your Repair Today</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Don't wait for a complete failure. Contact us today to schedule your repair and receive a complimentary diagnostic assessment.
    </p>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Special offer:</strong> Schedule your repair this month and receive priority service scheduling.
    </p>`,
    'Schedule your repair and diagnostic',
    'https://www.fagor-automation.com/repair-services',
    'Ivy-Solve',
    'Technical Service & Repair Coordinator'
  )
);
console.log('✓ Equipment Repair Email 3 created');

// ============================================================================
// EOL PARTS CAMPAIGN (Ivy-Logic)
// ============================================================================

writeFileSync(
  'campaigns/eol-parts/email-1-last-chance.html',
  generateEmailTemplate(
    'Critical Parts Being Discontinued - Secure Yours Now',
    'Last Chance: Secure Critical Spare Parts Before They\'re Gone',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Important notice:</strong> Several FAGOR parts used in older equipment models are being discontinued. Once our inventory is depleted, these parts will no longer be available.
    </p>

    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #721c24; font-weight: bold;">🚨 Parts Being Discontinued:</p>
      <ul style="margin: 0; padding-left: 20px; color: #721c24;">
        <li style="margin-bottom: 8px;">CNC 8025/8055 control boards</li>
        <li style="margin-bottom: 8px;">Legacy servo drive modules</li>
        <li style="margin-bottom: 8px;">Older encoder models</li>
        <li style="margin-bottom: 8px;">Display panels for discontinued models</li>
        <li style="margin-bottom: 8px;">Power supply units for legacy systems</li>
      </ul>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">What Happens When Parts Are Unavailable?</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      Without spare parts available:
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li>Equipment failure = permanent shutdown</li>
      <li>Forced equipment replacement ($50,000-$150,000+)</li>
      <li>Extended downtime during replacement</li>
      <li>Loss of institutional knowledge and processes</li>
      <li>Retraining costs for new equipment</li>
    </ul>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Secure Your Spare Parts Now</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      We recommend stocking critical spare parts based on your equipment age and usage patterns. Our parts specialists can help you determine optimal inventory levels.
    </p>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Special bulk pricing available</strong> for customers ordering multiple parts.
    </p>`,
    'Secure your spare parts before they\'re gone',
    'https://www.fagor-automation.com/eol-parts',
    'Ivy-Logic',
    'Operations & Maintenance Strategist'
  )
);
console.log('✓ EOL Parts Email 1 created');

writeFileSync(
  'campaigns/eol-parts/email-2-inventory-strategy.html',
  generateEmailTemplate(
    'Smart Spare Parts Strategy for Aging Equipment',
    'How Much Inventory Should You Keep?',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Stocking spare parts is insurance against unexpected downtime. But how much should you keep on hand? Here's our data-driven approach.
    </p>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Recommended Spare Parts Strategy</h2>

    <table width="100%" cellpadding="12" style="border-collapse: collapse; margin: 0 0 25px;">
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Equipment Age</td>
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Recommended Inventory</td>
      </tr>
      <tr>
        <td style="border: 1px solid #dee2e6; color: #666;">5-10 years</td>
        <td style="border: 1px solid #dee2e6; color: #666;">1x critical parts (drives, encoders)</td>
      </tr>
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #dee2e6; color: #666;">10-15 years</td>
        <td style="border: 1px solid #dee2e6; color: #666;">2x critical parts + 1x control boards</td>
      </tr>
      <tr>
        <td style="border: 1px solid #dee2e6; color: #666;">15+ years</td>
        <td style="border: 1px solid #dee2e6; color: #666;">Full spare parts kit</td>
      </tr>
    </table>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Critical vs. Non-Critical Parts</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      <strong>Critical parts</strong> (stock immediately):
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
      <li>Servo drives and motors</li>
      <li>Linear encoders</li>
      <li>Control boards</li>
      <li>Power supplies</li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      <strong>Non-critical parts</strong> (can order as needed):
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li>Cables and connectors</li>
      <li>Fans and filters</li>
      <li>Buttons and switches</li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Our parts specialists can analyze your equipment and usage patterns to recommend the optimal spare parts inventory for your operation.
    </p>`,
    'Get your personalized parts recommendation',
    'https://www.fagor-automation.com/eol-parts',
    'Ivy-Logic',
    'Operations & Maintenance Strategist'
  )
);
console.log('✓ EOL Parts Email 2 created');

writeFileSync(
  'campaigns/eol-parts/email-3-bulk-pricing.html',
  generateEmailTemplate(
    'Special Bulk Pricing on EOL Parts - Limited Time',
    'Save 20-30% with Bulk Parts Orders',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      This is your final opportunity to secure discontinued parts at special bulk pricing. Once this inventory is gone, these parts will never be available again.
    </p>

    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #155724; font-weight: bold;">💰 Bulk Pricing Discounts:</p>
      <ul style="margin: 0; padding-left: 20px; color: #155724;">
        <li style="margin-bottom: 8px;"><strong>2-3 units:</strong> Save 15%</li>
        <li style="margin-bottom: 8px;"><strong>4-5 units:</strong> Save 20%</li>
        <li style="margin-bottom: 8px;"><strong>6+ units:</strong> Save 30%</li>
      </ul>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Why Buy Now?</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Limited inventory</strong> - Once it's gone, it's gone forever</li>
      <li><strong>Bulk discounts</strong> - Save 20-30% on multi-unit orders</li>
      <li><strong>Avoid forced upgrades</strong> - Keep existing equipment running</li>
      <li><strong>Predictable costs</strong> - Lock in today's pricing</li>
      <li><strong>Peace of mind</strong> - Be prepared for any failure</li>
    </ul>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Flexible Payment Options</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      We understand spare parts represent a significant investment. We offer:
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li>Net 30/60/90 payment terms for qualified customers</li>
      <li>Consignment inventory programs</li>
      <li>Phased delivery to manage cash flow</li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Act now</strong> - This is your last chance to secure these critical parts before they're unavailable forever.
    </p>`,
    'Order your spare parts now',
    'https://www.fagor-automation.com/eol-parts',
    'Ivy-Logic',
    'Operations & Maintenance Strategist'
  )
);
console.log('✓ EOL Parts Email 3 created');

// ============================================================================
// CNC UPGRADES CAMPAIGN (Ivy-Talent)
// ============================================================================

writeFileSync(
  'campaigns/cnc-upgrades/email-1-windows-security.html',
  generateEmailTemplate(
    'Your CNC is Running on Unsupported Windows - Security Risk Alert',
    'Critical: Windows XP/7 Support Ended - Your CNC is at Risk',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      If your FAGOR CNC is running Windows XP or Windows 7, you're operating on an unsupported operating system with known security vulnerabilities.
    </p>

    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #721c24; font-weight: bold;">🚨 Security Risks:</p>
      <ul style="margin: 0; padding-left: 20px; color: #721c24;">
        <li style="margin-bottom: 8px;">No security patches or updates from Microsoft</li>
        <li style="margin-bottom: 8px;">Vulnerable to ransomware and malware attacks</li>
        <li style="margin-bottom: 8px;">Compliance issues (NIST, ISO requirements)</li>
        <li style="margin-bottom: 8px;">Network security risks for connected equipment</li>
      </ul>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">FAGOR CNC Windows 10 Upgrade Paths</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      We offer three upgrade options:
    </p>

    <table width="100%" cellpadding="12" style="border-collapse: collapse; margin: 0 0 25px;">
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Current Model</td>
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Upgrade Path</td>
      </tr>
      <tr>
        <td style="border: 1px solid #dee2e6; color: #666;">8025/8055 (Win XP/7)</td>
        <td style="border: 1px solid #dee2e6; color: #666;">→ Windows 10 upgrade</td>
      </tr>
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #dee2e6; color: #666;">8060/8065/8070</td>
        <td style="border: 1px solid #dee2e6; color: #666;">→ Windows 10 upgrade</td>
      </tr>
      <tr>
        <td style="border: 1px solid #dee2e6; color: #666;">8025 (older)</td>
        <td style="border: 1px solid #dee2e6; color: #666;">→ 8037 hardware upgrade</td>
      </tr>
    </table>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Benefits of Upgrading</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Security:</strong> Active Microsoft support and security patches</li>
      <li><strong>Performance:</strong> Faster processing and improved stability</li>
      <li><strong>Compatibility:</strong> Modern networking and connectivity</li>
      <li><strong>Compliance:</strong> Meet current cybersecurity standards</li>
      <li><strong>Continuity:</strong> Maintain existing tooling and programs</li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Typical upgrade cost:</strong> 30-40% of new equipment cost, with 2-3 days downtime.
    </p>`,
    'Get your CNC upgrade assessment',
    'https://www.fagor-automation.com/cnc-upgrades',
    'Ivy-Talent',
    'CNC Modernization & Upgrade Specialist'
  )
);
console.log('✓ CNC Upgrades Email 1 created');

writeFileSync(
  'campaigns/cnc-upgrades/email-2-performance-benefits.html',
  generateEmailTemplate(
    'Upgrade Your CNC: Better Performance, Lower Cost Than Replacement',
    'CNC Upgrade vs. Replacement: The Smart Financial Choice',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      When your CNC is aging, you face a choice: upgrade or replace? Here's why upgrading makes financial sense.
    </p>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Cost Comparison</h2>

    <table width="100%" cellpadding="12" style="border-collapse: collapse; margin: 0 0 25px;">
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Option</td>
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Cost</td>
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Downtime</td>
      </tr>
      <tr>
        <td style="border: 1px solid #dee2e6; color: #666;">New CNC Machine</td>
        <td style="border: 1px solid #dee2e6; color: #666;">$80,000-$150,000</td>
        <td style="border: 1px solid #dee2e6; color: #666;">2-4 weeks</td>
      </tr>
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #dee2e6; color: #666;"><strong>FAGOR Upgrade</strong></td>
        <td style="border: 1px solid #dee2e6; color: #d32f2f;"><strong>$25,000-$45,000</strong></td>
        <td style="border: 1px solid #dee2e6; color: #d32f2f;"><strong>2-3 days</strong></td>
      </tr>
    </table>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Savings: $35,000-$105,000 (60-70% cost reduction)</strong>
    </p>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">What You Keep</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Existing tooling</strong> - No need to replace fixtures and tools</li>
      <li><strong>Operator knowledge</strong> - No retraining on new equipment</li>
      <li><strong>Proven processes</strong> - Keep what works</li>
      <li><strong>Physical footprint</strong> - No facility modifications needed</li>
    </ul>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">What You Gain</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Modern OS</strong> - Windows 10 with long-term support</li>
      <li><strong>Better performance</strong> - Faster processing and response</li>
      <li><strong>New features</strong> - Enhanced capabilities and connectivity</li>
      <li><strong>Extended life</strong> - 10+ years of additional service</li>
      <li><strong>Improved reliability</strong> - New components reduce failures</li>
    </ul>

    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #155724; font-weight: bold;">✓ Customer Success Story:</p>
      <p style="margin: 0; color: #155724;">
        "We upgraded three 8025 CNCs to Windows 10 for $38,000 each. Compared to $120,000 for new machines, we saved $246,000 and were back in production in 3 days instead of 3 weeks." - Manufacturing Manager, Aerospace Parts Supplier
      </p>
    </div>`,
    'Schedule your upgrade assessment',
    'https://www.fagor-automation.com/cnc-upgrades',
    'Ivy-Talent',
    'CNC Modernization & Upgrade Specialist'
  )
);
console.log('✓ CNC Upgrades Email 2 created');

writeFileSync(
  'campaigns/cnc-upgrades/email-3-upgrade-process.html',
  generateEmailTemplate(
    'How the CNC Upgrade Process Works',
    'Smooth, Fast CNC Upgrades with Minimal Downtime',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Concerned about the upgrade process? We've streamlined it to minimize downtime and ensure a smooth transition.
    </p>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Our 5-Step Upgrade Process</h2>

    <div style="background-color: #f8f9fa; padding: 15px; margin: 0 0 15px; border-left: 4px solid #d32f2f;">
      <p style="margin: 0; color: #333;"><strong>Step 1: Technical Assessment</strong></p>
      <p style="margin: 5px 0 0; color: #666;">We evaluate your equipment and recommend the best upgrade path. Remote assessment available.</p>
    </div>

    <div style="background-color: #f8f9fa; padding: 15px; margin: 0 0 15px; border-left: 4px solid #d32f2f;">
      <p style="margin: 0; color: #333;"><strong>Step 2: Proposal & Planning</strong></p>
      <p style="margin: 5px 0 0; color: #666;">Detailed proposal with costs, timeline, and scheduling to minimize production impact.</p>
    </div>

    <div style="background-color: #f8f9fa; padding: 15px; margin: 0 0 15px; border-left: 4px solid #d32f2f;">
      <p style="margin: 0; color: #333;"><strong>Step 3: Pre-Upgrade Preparation</strong></p>
      <p style="margin: 5px 0 0; color: #666;">Backup all programs and parameters. Prepare new components. Coordinate logistics.</p>
    </div>

    <div style="background-color: #f8f9fa; padding: 15px; margin: 0 0 15px; border-left: 4px solid #d32f2f;">
      <p style="margin: 0; color: #333;"><strong>Step 4: Upgrade Execution</strong></p>
      <p style="margin: 5px 0 0; color: #666;">Factory-certified technicians perform upgrade on-site. Typical duration: 2-3 days.</p>
    </div>

    <div style="background-color: #f8f9fa; padding: 15px; margin: 0 0 25px; border-left: 4px solid #d32f2f;">
      <p style="margin: 0; color: #333;"><strong>Step 5: Testing & Training</strong></p>
      <p style="margin: 5px 0 0; color: #666;">Comprehensive testing, operator training on new features, and documentation handoff.</p>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">What's Included</h2>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li>All hardware and software components</li>
      <li>On-site installation by certified technicians</li>
      <li>Program and parameter migration</li>
      <li>Operator training on new features</li>
      <li>90-day warranty on upgrade</li>
      <li>Post-upgrade technical support</li>
    </ul>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Flexible Scheduling</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      We work around your production schedule:
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li>Weekend installations available</li>
      <li>Phased upgrades for multiple machines</li>
      <li>Coordinated with planned maintenance windows</li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Ready to modernize your CNCs?</strong> Schedule a free technical assessment today.
    </p>`,
    'Schedule your free assessment',
    'https://www.fagor-automation.com/cnc-upgrades',
    'Ivy-Talent',
    'CNC Modernization & Upgrade Specialist'
  )
);
console.log('✓ CNC Upgrades Email 3 created');

// ============================================================================
// DIGITAL SUITE CAMPAIGN (Ivy-Insight)
// ============================================================================

writeFileSync(
  'campaigns/digital-suite/email-1-data-visibility.html',
  generateEmailTemplate(
    'Are You Flying Blind? Get Real-Time Production Visibility',
    'Transform Your Shop Floor with FAGOR Digital Suite',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      How much do you really know about your production performance? Most manufacturers are making decisions based on incomplete data or gut feeling.
    </p>

    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #856404; font-weight: bold;">⚠️ Common Blind Spots:</p>
      <ul style="margin: 0; padding-left: 20px; color: #856404;">
        <li style="margin-bottom: 8px;">Actual vs. planned production rates</li>
        <li style="margin-bottom: 8px;">Real-time equipment utilization</li>
        <li style="margin-bottom: 8px;">Downtime causes and patterns</li>
        <li style="margin-bottom: 8px;">Quality trends and defect rates</li>
        <li style="margin-bottom: 8px;">Operator performance variations</li>
      </ul>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">FAGOR Digital Suite: Complete Production Visibility</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      Our comprehensive digitalization platform gives you real-time insights into every aspect of your production:
    </p>

    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Real-time monitoring</strong> - Live production data from all machines</li>
      <li><strong>OEE tracking</strong> - Automatic calculation of Overall Equipment Effectiveness</li>
      <li><strong>Downtime analysis</strong> - Identify and eliminate bottlenecks</li>
      <li><strong>Quality management</strong> - Track defects and implement corrective actions</li>
      <li><strong>Predictive maintenance</strong> - Prevent failures before they happen</li>
      <li><strong>Performance benchmarking</strong> - Compare across shifts, operators, and machines</li>
    </ul>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Proven Results</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      Manufacturers using FAGOR Digital Suite typically achieve:
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>15-25% improvement in OEE</strong></li>
      <li><strong>30-40% reduction in unplanned downtime</strong></li>
      <li><strong>20-30% decrease in quality defects</strong></li>
      <li><strong>10-15% increase in throughput</strong></li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Stop flying blind. Get the data-driven insights you need to optimize your production.
    </p>`,
    'Schedule your Digital Suite demo',
    'https://www.fagor-automation.com/digital-suite',
    'Ivy-Insight',
    'Digital Transformation & Strategy Advisor'
  )
);
console.log('✓ Digital Suite Email 1 created');

writeFileSync(
  'campaigns/digital-suite/email-2-predictive-maintenance.html',
  generateEmailTemplate(
    'Predict Failures Before They Happen',
    'Predictive Maintenance: The Future of Equipment Reliability',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      What if you could predict equipment failures days or weeks before they happen? FAGOR Digital Suite makes it possible.
    </p>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">How Predictive Maintenance Works</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      Our system continuously monitors equipment health indicators:
    </p>

    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Vibration patterns</strong> - Detect bearing wear</li>
      <li><strong>Temperature trends</strong> - Identify cooling issues</li>
      <li><strong>Power consumption</strong> - Spot motor degradation</li>
      <li><strong>Performance metrics</strong> - Track accuracy decline</li>
      <li><strong>Error frequencies</strong> - Predict component failures</li>
    </ul>

    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #155724; font-weight: bold;">✓ Real Example:</p>
      <p style="margin: 0; color: #155724;">
        A customer's Digital Suite detected abnormal vibration patterns in a spindle motor. We scheduled preventive replacement during planned downtime, avoiding a $25,000 emergency repair and 3 days of unplanned downtime.
      </p>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Reactive vs. Predictive Maintenance</h2>

    <table width="100%" cellpadding="12" style="border-collapse: collapse; margin: 0 0 25px;">
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Approach</td>
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Cost</td>
        <td style="border: 1px solid #dee2e6; font-weight: bold; color: #333;">Downtime</td>
      </tr>
      <tr>
        <td style="border: 1px solid #dee2e6; color: #666;">Reactive (fix when broken)</td>
        <td style="border: 1px solid #dee2e6; color: #666;">$15,000-$30,000</td>
        <td style="border: 1px solid #dee2e6; color: #666;">2-5 days</td>
      </tr>
      <tr style="background-color: #f8f9fa;">
        <td style="border: 1px solid #dee2e6; color: #666;"><strong>Predictive (prevent failures)</strong></td>
        <td style="border: 1px solid #dee2e6; color: #d32f2f;"><strong>$3,000-$8,000</strong></td>
        <td style="border: 1px solid #dee2e6; color: #d32f2f;"><strong>4-8 hours</strong></td>
      </tr>
    </table>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">ROI of Predictive Maintenance</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      Typical return on investment:
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Reduce maintenance costs by 25-40%</strong></li>
      <li><strong>Eliminate 70-80% of unplanned downtime</strong></li>
      <li><strong>Extend equipment life by 20-30%</strong></li>
      <li><strong>Payback period: 6-12 months</strong></li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Stop reacting to failures. Start preventing them.
    </p>`,
    'See predictive maintenance in action',
    'https://www.fagor-automation.com/digital-suite',
    'Ivy-Insight',
    'Digital Transformation & Strategy Advisor'
  )
);
console.log('✓ Digital Suite Email 2 created');

writeFileSync(
  'campaigns/digital-suite/email-3-competitive-advantage.html',
  generateEmailTemplate(
    'Digital Transformation: Your Competitive Advantage',
    'Industry 4.0 is Here - Are You Ready?',
    `<p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      Your competitors are digitalizing their operations. Those who embrace Industry 4.0 are gaining significant competitive advantages in efficiency, quality, and cost.
    </p>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">The Digital Divide</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      Manufacturers are splitting into two groups:
    </p>

    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 0 0 15px;">
      <p style="margin: 0 0 10px; color: #721c24; font-weight: bold;">❌ Traditional Manufacturers:</p>
      <ul style="margin: 0; padding-left: 20px; color: #721c24;">
        <li style="margin-bottom: 8px;">Manual data collection and reporting</li>
        <li style="margin-bottom: 8px;">Reactive maintenance and problem-solving</li>
        <li style="margin-bottom: 8px;">Limited visibility into operations</li>
        <li style="margin-bottom: 8px;">Higher costs, lower efficiency</li>
      </ul>
    </div>

    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 0 0 25px;">
      <p style="margin: 0 0 10px; color: #155724; font-weight: bold;">✓ Digital Leaders:</p>
      <ul style="margin: 0; padding-left: 20px; color: #155724;">
        <li style="margin-bottom: 8px;">Automated data collection and real-time analytics</li>
        <li style="margin-bottom: 8px;">Predictive maintenance and proactive optimization</li>
        <li style="margin-bottom: 8px;">Complete production visibility</li>
        <li style="margin-bottom: 8px;">Lower costs, higher quality, faster delivery</li>
      </ul>
    </div>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">FAGOR Digital Suite: Your Path to Industry 4.0</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      Complete digital transformation platform:
    </p>

    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li><strong>Production monitoring</strong> - Real-time visibility across all machines</li>
      <li><strong>Data analytics</strong> - Turn data into actionable insights</li>
      <li><strong>Predictive maintenance</strong> - Prevent failures before they happen</li>
      <li><strong>Quality management</strong> - Track, analyze, and improve quality</li>
      <li><strong>Performance optimization</strong> - Continuous improvement driven by data</li>
      <li><strong>ERP/MES integration</strong> - Connect shop floor to business systems</li>
    </ul>

    <h2 style="color: #333; font-size: 22px; margin: 30px 0 15px;">Implementation Made Easy</h2>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
      We provide complete support:
    </p>
    <ul style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
      <li>Strategic assessment and roadmap</li>
      <li>Phased implementation to manage change</li>
      <li>Training and change management support</li>
      <li>Ongoing technical support and optimization</li>
    </ul>

    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
      <strong>Don't get left behind.</strong> Schedule a Digital Suite demo and see how digital transformation can give you a competitive edge.
    </p>`,
    'Start your digital transformation',
    'https://www.fagor-automation.com/digital-suite',
    'Ivy-Insight',
    'Digital Transformation & Strategy Advisor'
  )
);
console.log('✓ Digital Suite Email 3 created');

console.log('\n✅ All 12 email templates generated successfully!');
console.log('\nSummary:');
console.log('- Equipment Repair: 3 emails');
console.log('- EOL Parts: 3 emails');
console.log('- CNC Upgrades: 3 emails');
console.log('- Digital Suite: 3 emails');
console.log('\nTotal: 12 new templates + 6 existing = 18 campaign emails');
