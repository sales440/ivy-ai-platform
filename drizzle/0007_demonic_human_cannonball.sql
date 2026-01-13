CREATE TABLE `google_drive_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expiry_date` timestamp,
	`scope` text,
	`token_type` varchar(50),
	`folder_ids` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_drive_tokens_id` PRIMARY KEY(`id`)
);
