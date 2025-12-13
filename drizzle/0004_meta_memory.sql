CREATE TABLE IF NOT EXISTS `metaAgentMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metaAgentMemory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `trainingLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentType` enum('prospect','closer','solve','logic','talent','insight') NOT NULL,
	`trainingModule` varchar(255) NOT NULL,
	`insights` json,
	`recommendations` json,
	`status` enum('started','completed','failed') NOT NULL DEFAULT 'started',
	`result` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainingLogs_id` PRIMARY KEY(`id`)
);
