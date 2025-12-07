-- Safe Migration Script
-- Only adds new tables and columns without deleting existing data

-- 1. Create scheduledTasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS `scheduledTasks` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `taskType` enum('send-email', 'update-lead-score', 'send-notification') NOT NULL,
  `taskData` json NOT NULL,
  `status` enum('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `scheduledFor` timestamp NOT NULL,
  `executedAt` timestamp NULL,
  `error` text NULL,
  `retryCount` int NOT NULL DEFAULT 0,
  `maxRetries` int NOT NULL DEFAULT 3,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Add scoreHistory column to leads table if it doesn't exist
-- Check if column exists first
SET @dbname = DATABASE();
SET @tablename = 'leads';
SET @columnname = 'scoreHistory';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' json NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Create emailCampaigns table if it doesn't exist (for Email Templates)
CREATE TABLE IF NOT EXISTS `emailCampaigns` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `body` text NOT NULL,
  `type` enum('callback', 'interested', 'notInterested', 'voicemail') NOT NULL,
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Success message
SELECT 'Safe migration completed successfully!' AS status;
