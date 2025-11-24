import { getDb } from '../server/db';

async function migrate() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  console.log('Creating FAGOR tables...');
  
  // Create fagorContacts table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS fagorContacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(320) NOT NULL UNIQUE,
      company VARCHAR(255),
      role VARCHAR(255),
      phone VARCHAR(50),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ fagorContacts table created');

  // Create fagorCampaignEnrollments table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS fagorCampaignEnrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contactId INT NOT NULL,
      campaignId VARCHAR(100) NOT NULL,
      status ENUM('enrolled', 'active', 'completed', 'paused') DEFAULT 'enrolled',
      currentStep INT DEFAULT 1,
      lastEmailSentAt TIMESTAMP NULL,
      enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completedAt TIMESTAMP NULL,
      FOREIGN KEY (contactId) REFERENCES fagorContacts(id) ON DELETE CASCADE,
      UNIQUE KEY unique_enrollment (contactId, campaignId)
    )
  `);
  console.log('✓ fagorCampaignEnrollments table created');

  // Create fagorEmailEvents table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS fagorEmailEvents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      enrollmentId INT NOT NULL,
      eventType ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed') NOT NULL,
      emailStep INT NOT NULL,
      messageId VARCHAR(255),
      eventData JSON,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enrollmentId) REFERENCES fagorCampaignEnrollments(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ fagorEmailEvents table created');

  console.log('\n✅ All FAGOR tables created successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
