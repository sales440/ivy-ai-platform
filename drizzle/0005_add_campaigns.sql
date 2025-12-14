CREATE TABLE IF NOT EXISTS `campaigns` (
	`id` varchar(64) PRIMARY KEY NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('draft','scheduled','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`budget` decimal(10,2) DEFAULT '0.00',
	`targetAudience` json,
	`configuration` json,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
