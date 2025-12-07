import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixFAGORLogoURL() {
  console.log('🔧 Fixing FAGOR logo in email templates...\n');
  console.log('   Replacing base64 with CDN URL for better email client compatibility\n');

  const logoURL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031167889/lZevPzgVPacmUSlf.jpg';

  try {
    // Update Email 1
    const email1Path = path.join(__dirname, '../campaigns/fagor-training-email-1-the-problem.html');
    let email1Html = fs.readFileSync(email1Path, 'utf-8');
    
    // Replace any existing src (base64 or relative path) with CDN URL
    email1Html = email1Html.replace(
      /src="[^"]*fagor-logo[^"]*"/gi,
      `src="${logoURL}"`
    );
    
    fs.writeFileSync(email1Path, email1Html);
    console.log('✅ Email 1 updated with CDN logo URL');

    // Update Email 2
    const email2Path = path.join(__dirname, '../campaigns/fagor-training-email-2-the-solution.html');
    let email2Html = fs.readFileSync(email2Path, 'utf-8');
    
    email2Html = email2Html.replace(
      /src="[^"]*fagor-logo[^"]*"/gi,
      `src="${logoURL}"`
    );
    
    fs.writeFileSync(email2Path, email2Html);
    console.log('✅ Email 2 updated with CDN logo URL');

    // Update Email 3
    const email3Path = path.join(__dirname, '../campaigns/fagor-training-email-3-urgency-cta.html');
    let email3Html = fs.readFileSync(email3Path, 'utf-8');
    
    email3Html = email3Html.replace(
      /src="[^"]*fagor-logo[^"]*"/gi,
      `src="${logoURL}"`
    );
    
    fs.writeFileSync(email3Path, email3Html);
    console.log('✅ Email 3 updated with CDN logo URL');

    console.log('\n🎉 All 3 email templates now use CDN-hosted logo!');
    console.log(`📍 Logo URL: ${logoURL}`);
    console.log('✅ Logo will display correctly in Gmail, Outlook, and all email clients');

  } catch (error) {
    console.error('❌ Error fixing logo URL:', error);
    throw error;
  }
}

fixFAGORLogoURL()
  .then(() => {
    console.log('\n✅ Logo URL fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to fix logo URL:', error);
    process.exit(1);
  });
