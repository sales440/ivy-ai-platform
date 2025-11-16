CREATE TABLE `agentCommunications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communicationId` varchar(64) NOT NULL,
	`fromAgentId` int NOT NULL,
	`toAgentId` int,
	`messageType` varchar(100) NOT NULL,
	`message` json NOT NULL,
	`workflowExecutionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentCommunications_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentCommunications_communicationId_unique` UNIQUE(`communicationId`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` varchar(64) NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('prospect','closer','solve','logic','talent','insight') NOT NULL,
	`department` enum('sales','marketing','customer_service','operations','hr','strategy') NOT NULL,
	`status` enum('idle','active','training','error') NOT NULL DEFAULT 'idle',
	`capabilities` json NOT NULL,
	`kpis` json NOT NULL,
	`configuration` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_agentId_unique` UNIQUE(`agentId`)
);
--> statement-breakpoint
CREATE TABLE `commandHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`command` text NOT NULL,
	`parsedCommand` json,
	`result` json,
	`status` enum('success','error') NOT NULL,
	`error` text,
	`executionTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commandHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` varchar(64) NOT NULL,
	`title` varchar(300) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`tags` json,
	`viewCount` int DEFAULT 0,
	`helpfulCount` int DEFAULT 0,
	`isPublished` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeBase_id` PRIMARY KEY(`id`),
	CONSTRAINT `knowledgeBase_articleId_unique` UNIQUE(`articleId`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` varchar(64) NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(320),
	`company` varchar(200),
	`title` varchar(200),
	`industry` varchar(100),
	`location` varchar(200),
	`companySize` varchar(50),
	`qualificationScore` int DEFAULT 0,
	`qualificationLevel` enum('A','B','C','D'),
	`status` enum('new','contacted','qualified','nurture','converted','lost') NOT NULL DEFAULT 'new',
	`source` varchar(100),
	`metadata` json,
	`assignedTo` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `leads_leadId_unique` UNIQUE(`leadId`)
);
--> statement-breakpoint
CREATE TABLE `systemMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` varchar(100) NOT NULL,
	`agentId` int,
	`department` varchar(50),
	`metricName` varchar(100) NOT NULL,
	`metricValue` int NOT NULL,
	`metadata` json,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` varchar(64) NOT NULL,
	`agentId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`input` json NOT NULL,
	`output` json,
	`error` text,
	`executionTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasks_taskId_unique` UNIQUE(`taskId`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` varchar(64) NOT NULL,
	`customerId` int,
	`customerEmail` varchar(320),
	`subject` varchar(300) NOT NULL,
	`issue` text NOT NULL,
	`category` enum('login','billing','technical','feature','account','general'),
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','escalated','closed') NOT NULL DEFAULT 'open',
	`assignedTo` int,
	`resolution` text,
	`resolutionTime` int,
	`customerSatisfaction` int,
	`escalationReason` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_ticketId_unique` UNIQUE(`ticketId`)
);
--> statement-breakpoint
CREATE TABLE `workflowExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` varchar(64) NOT NULL,
	`workflowId` int NOT NULL,
	`status` enum('running','completed','failed','interrupted') NOT NULL DEFAULT 'running',
	`initialData` json NOT NULL,
	`results` json,
	`currentStep` int DEFAULT 0,
	`totalSteps` int NOT NULL,
	`error` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `workflowExecutions_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflowExecutions_executionId_unique` UNIQUE(`executionId`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` varchar(64) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`steps` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflows_workflowId_unique` UNIQUE(`workflowId`)
);
