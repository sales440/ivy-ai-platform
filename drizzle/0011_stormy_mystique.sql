ALTER TABLE `sales_campaigns` ADD `client_id` varchar(32);--> statement-breakpoint
ALTER TABLE `sales_campaigns` ADD `company_name` varchar(255);--> statement-breakpoint
ALTER TABLE `sales_campaigns` ADD `description` text;--> statement-breakpoint
ALTER TABLE `sales_campaigns` ADD `target_leads` int DEFAULT 100;