CREATE TABLE `client_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` varchar(32) NOT NULL,
	`file_type` enum('logo','template','report','backup','document','campaign_asset','client_list','other') NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`google_drive_file_id` varchar(100),
	`google_drive_url` varchar(500),
	`mime_type` varchar(100),
	`file_size` int,
	`description` text,
	`uploaded_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ivy_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` varchar(32) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`industry` varchar(100),
	`contact_name` varchar(255),
	`contact_email` varchar(320),
	`contact_phone` varchar(50),
	`address` text,
	`website` varchar(255),
	`logo_url` varchar(500),
	`google_drive_folder_id` varchar(100),
	`google_drive_structure` text,
	`status` enum('active','inactive','prospect','churned') NOT NULL DEFAULT 'prospect',
	`plan` enum('free','starter','professional','enterprise') NOT NULL DEFAULT 'free',
	`notes` text,
	`created_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ivy_clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `ivy_clients_client_id_unique` UNIQUE(`client_id`)
);
