-- FAGOR Campaign Tables Migration
-- Run this script manually in Railway MySQL console

CREATE TABLE IF NOT EXISTS `fagorContacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(320) NOT NULL UNIQUE,
  `company` VARCHAR(255),
  `role` VARCHAR(255),
  `phone` VARCHAR(50),
  `source` VARCHAR(100) NOT NULL DEFAULT 'csv_import',
  `status` ENUM('active', 'inactive', 'bounced', 'unsubscribed') NOT NULL DEFAULT 'active',
  `tags` JSON,
  `customFields` JSON,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `fagorCampaignEnrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contactId` INT NOT NULL,
  `campaignName` VARCHAR(255) NOT NULL,
  `currentStep` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'paused', 'completed', 'unsubscribed') NOT NULL DEFAULT 'active',
  `email1SentAt` TIMESTAMP NULL,
  `email1OpenedAt` TIMESTAMP NULL,
  `email1ClickedAt` TIMESTAMP NULL,
  `email2SentAt` TIMESTAMP NULL,
  `email2OpenedAt` TIMESTAMP NULL,
  `email2ClickedAt` TIMESTAMP NULL,
  `email3SentAt` TIMESTAMP NULL,
  `email3OpenedAt` TIMESTAMP NULL,
  `email3ClickedAt` TIMESTAMP NULL,
  `respondedAt` TIMESTAMP NULL,
  `enrolledAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`contactId`) REFERENCES `fagorContacts`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `fagorEmailEvents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollmentId` INT NOT NULL,
  `contactId` INT NOT NULL,
  `emailNumber` INT NOT NULL,
  `eventType` ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed') NOT NULL,
  `messageId` VARCHAR(255),
  `userAgent` TEXT,
  `ipAddress` VARCHAR(45),
  `clickedUrl` TEXT,
  `metadata` JSON,
  `eventAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`enrollmentId`) REFERENCES `fagorCampaignEnrollments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contactId`) REFERENCES `fagorContacts`(`id`) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX `idx_fagorContacts_email` ON `fagorContacts`(`email`);
CREATE INDEX `idx_fagorContacts_status` ON `fagorContacts`(`status`);
CREATE INDEX `idx_fagorCampaignEnrollments_contactId` ON `fagorCampaignEnrollments`(`contactId`);
CREATE INDEX `idx_fagorCampaignEnrollments_status` ON `fagorCampaignEnrollments`(`status`);
CREATE INDEX `idx_fagorEmailEvents_enrollmentId` ON `fagorEmailEvents`(`enrollmentId`);
CREATE INDEX `idx_fagorEmailEvents_contactId` ON `fagorEmailEvents`(`contactId`);
CREATE INDEX `idx_fagorEmailEvents_eventType` ON `fagorEmailEvents`(`eventType`);
