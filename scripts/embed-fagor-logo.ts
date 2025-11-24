import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function embedFAGORLogo() {
  console.log('🖼️  Embedding FAGOR logo in email templates...\n');

  try {
    // Read the logo and convert to base64
    const logoPath = path.join(__dirname, '../client/public/fagor-logo.jpg');
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoDataUri = `data:image/jpeg;base64,${logoBase64}`;

    console.log(`✅ Logo loaded: ${(logoBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`✅ Base64 encoded: ${logoBase64.length} characters\n`);

    // Update Email 1
    const email1Path = path.join(__dirname, '../campaigns/fagor-training-email-1-the-problem.html');
    let email1Html = fs.readFileSync(email1Path, 'utf-8');
    email1Html = email1Html.replace(
      'src="/fagor-logo.jpg"',
      `src="${logoDataUri}"`
    );
    fs.writeFileSync(email1Path, email1Html);
    console.log('✅ Email 1 updated with embedded logo');

    // Update Email 2
    const email2Path = path.join(__dirname, '../campaigns/fagor-training-email-2-the-solution.html');
    let email2Html = fs.readFileSync(email2Path, 'utf-8');
    email2Html = email2Html.replace(
      'src="/fagor-logo.jpg"',
      `src="${logoDataUri}"`
    );
    fs.writeFileSync(email2Path, email2Html);
    console.log('✅ Email 2 updated with embedded logo');

    // Update Email 3
    const email3Path = path.join(__dirname, '../campaigns/fagor-training-email-3-urgency-cta.html');
    let email3Html = fs.readFileSync(email3Path, 'utf-8');
    email3Html = email3Html.replace(
      'src="/fagor-logo.jpg"',
      `src="${logoDataUri}"`
    );
    fs.writeFileSync(email3Path, email3Html);
    console.log('✅ Email 3 updated with embedded logo');

    console.log('\n🎉 All 3 email templates now have embedded FAGOR logo!');
    console.log('📧 Logo will display correctly in all email clients without external dependencies.');

  } catch (error) {
    console.error('❌ Error embedding logo:', error);
    throw error;
  }
}

embedFAGORLogo()
  .then(() => {
    console.log('\n✅ Logo embedding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to embed logo:', error);
    process.exit(1);
  });
