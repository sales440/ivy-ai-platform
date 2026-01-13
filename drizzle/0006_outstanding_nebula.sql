CREATE TABLE `ab_test_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`test_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`impressions` int DEFAULT 0,
	`opens` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`bounces` int DEFAULT 0,
	`unsubscribes` int DEFAULT 0,
	`revenue` int DEFAULT 0,
	`conversion_rate` int DEFAULT 0,
	`open_rate` int DEFAULT 0,
	`click_rate` int DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_test_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_test_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`test_id` int NOT NULL,
	`variant_name` varchar(100) NOT NULL,
	`is_control` int DEFAULT 0,
	`content` text NOT NULL,
	`traffic_percentage` int DEFAULT 50,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ab_test_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ab_tests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int,
	`test_name` varchar(255) NOT NULL,
	`test_type` enum('email_subject','email_content','call_script','sms_content','landing_page') NOT NULL,
	`hypothesis` text,
	`status` enum('draft','running','completed','paused') NOT NULL DEFAULT 'draft',
	`start_date` timestamp,
	`end_date` timestamp,
	`winner_variant_id` int,
	`confidence_level` int DEFAULT 95,
	`significance_reached` int DEFAULT 0,
	`created_by` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_tests_id` PRIMARY KEY(`id`)
);
