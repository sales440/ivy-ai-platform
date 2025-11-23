-- Migration: Multi-Channel Campaigns System
-- Creates 3 tables: multiChannelCampaigns, campaignSteps, campaignExecutions
-- Date: 2025-01-19

-- Table 1: multiChannelCampaigns
-- Stores campaign definitions
CREATE TABLE IF NOT EXISTS `multiChannelCampaigns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `targetAudience` varchar(100),
  `status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: campaignSteps
-- Stores individual steps within each campaign
CREATE TABLE IF NOT EXISTS `campaignSteps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaignId` int NOT NULL,
  `stepOrder` int NOT NULL,
  `stepType` enum('email','linkedin') NOT NULL,
  `emailSequenceId` int,
  `linkedInPostType` varchar(100),
  `delayDays` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaign` (`campaignId`),
  KEY `idx_order` (`stepOrder`),
  CONSTRAINT `fk_campaign_steps_campaign` FOREIGN KEY (`campaignId`) REFERENCES `multiChannelCampaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: campaignExecutions
-- Tracks campaign execution per lead
CREATE TABLE IF NOT EXISTS `campaignExecutions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `campaignId` int NOT NULL,
  `leadId` int NOT NULL,
  `status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
  `currentStep` int NOT NULL DEFAULT 0,
  `startedAt` timestamp NULL,
  `completedAt` timestamp NULL,
  `lastExecutedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaign` (`campaignId`),
  KEY `idx_lead` (`leadId`),
  KEY `idx_status` (`status`),
  UNIQUE KEY `unique_campaign_lead` (`campaignId`, `leadId`),
  CONSTRAINT `fk_campaign_executions_campaign` FOREIGN KEY (`campaignId`) REFERENCES `multiChannelCampaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_campaign_executions_lead` FOREIGN KEY (`leadId`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for performance
CREATE INDEX `idx_execution_status_step` ON `campaignExecutions` (`status`, `currentStep`);
CREATE INDEX `idx_execution_dates` ON `campaignExecutions` (`startedAt`, `completedAt`);

-- Verify tables were created
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM 
  information_schema.TABLES
WHERE 
  TABLE_SCHEMA = 'railway'
  AND TABLE_NAME IN ('multiChannelCampaigns', 'campaignSteps', 'campaignExecutions')
ORDER BY 
  TABLE_NAME;
