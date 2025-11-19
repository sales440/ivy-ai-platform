-- Create calls table for Telnyx integration
CREATE TABLE IF NOT EXISTS `calls` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `leadId` INT(11) NOT NULL,
  `companyId` INT(11) NOT NULL,
  `userId` INT(11) NOT NULL,
  `telnyxCallId` VARCHAR(255),
  `phoneNumber` VARCHAR(50) NOT NULL,
  `status` ENUM('initiated', 'ringing', 'answered', 'completed', 'failed', 'no-answer') NOT NULL DEFAULT 'initiated',
  `duration` INT(11),
  `transcript` TEXT,
  `recordingUrl` VARCHAR(500),
  `sentiment` ENUM('positive', 'neutral', 'negative'),
  `outcome` ENUM('interested', 'callback', 'not-interested', 'voicemail', 'no-answer', 'wrong-number'),
  `notes` TEXT,
  `metadata` JSON,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_leadId` (`leadId`),
  INDEX `idx_companyId` (`companyId`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
