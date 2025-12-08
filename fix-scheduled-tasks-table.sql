-- Fix for scheduledTasks table
-- This ensures the table exists with correct schema

CREATE TABLE IF NOT EXISTS `scheduledTasks` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `taskType` varchar(100) NOT NULL,
  `taskData` json NOT NULL,
  `status` enum('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending' NOT NULL,
  `scheduledFor` timestamp NOT NULL,
  `executedAt` timestamp NULL,
  `createdBy` int NOT NULL,
  `retryCount` int DEFAULT 0 NOT NULL,
  `maxRetries` int DEFAULT 3 NOT NULL,
  `error` text NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS `idx_scheduledTasks_companyId` ON `scheduledTasks`(`companyId`);
CREATE INDEX IF NOT EXISTS `idx_scheduledTasks_status` ON `scheduledTasks`(`status`);
CREATE INDEX IF NOT EXISTS `idx_scheduledTasks_scheduledFor` ON `scheduledTasks`(`scheduledFor`);
