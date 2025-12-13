ALTER TABLE `agentCommunications` ADD COLUMN `fromAgent` varchar(100) NOT NULL DEFAULT 'system';
ALTER TABLE `agentCommunications` ADD COLUMN `fromAgentId` varchar(100);
ALTER TABLE `agentCommunications` ADD COLUMN `toAgent` varchar(100) NOT NULL DEFAULT 'system';
ALTER TABLE `agentCommunications` ADD COLUMN `toAgentId` varchar(100);
ALTER TABLE `agentCommunications` ADD COLUMN `message` text;
ALTER TABLE `agentCommunications` ADD COLUMN `workflowExecutionId` varchar(64);
