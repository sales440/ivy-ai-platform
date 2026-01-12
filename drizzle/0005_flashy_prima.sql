CREATE TABLE `campaign_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int,
	`company_id` int,
	`company_name` varchar(255) NOT NULL,
	`company_logo` varchar(500),
	`company_address` text,
	`company_phone` varchar(50),
	`company_email` varchar(320),
	`company_website` varchar(255),
	`content_type` enum('email','call_script','sms') NOT NULL,
	`subject` varchar(500),
	`body` text NOT NULL,
	`html_content` text,
	`target_recipients` text,
	`status` enum('pending','approved','rejected','sent') NOT NULL DEFAULT 'pending',
	`rejection_reason` text,
	`approved_by` varchar(64),
	`approved_at` timestamp,
	`sent_at` timestamp,
	`sent_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaign_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int,
	`company_name` varchar(255) NOT NULL,
	`list_name` varchar(255) NOT NULL,
	`source_file_id` int,
	`source_file_name` varchar(255),
	`total_records` int DEFAULT 0,
	`processed_records` int DEFAULT 0,
	`status` enum('pending','processing','completed','error') NOT NULL DEFAULT 'pending',
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`list_id` int NOT NULL,
	`company_id` int,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`company` varchar(255),
	`position` varchar(255),
	`industry` varchar(100),
	`location` varchar(255),
	`custom_fields` text,
	`status` enum('active','contacted','responded','converted','unsubscribed') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_id` int,
	`company_name` varchar(255) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_type` enum('logo','email_example','branding','document','client_list','other') NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_size` int NOT NULL,
	`s3_key` varchar(500) NOT NULL,
	`s3_url` varchar(500) NOT NULL,
	`description` text,
	`uploaded_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_files_id` PRIMARY KEY(`id`)
);
