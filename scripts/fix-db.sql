
CREATE TABLE IF NOT EXISTS `scheduledTasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `companyId` int NOT NULL,
  `taskType` enum('send-email','update-lead-score','send-notification','custom') NOT NULL,
  `taskData` json NOT NULL,
  `status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `scheduledFor` timestamp NOT NULL,
  `executedAt` timestamp NULL DEFAULT NULL,
  `error` text,
  `retryCount` int NOT NULL DEFAULT '0',
  `maxRetries` int NOT NULL DEFAULT '3',
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
