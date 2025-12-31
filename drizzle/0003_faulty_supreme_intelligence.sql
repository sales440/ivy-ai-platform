CREATE TABLE `ropa_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`severity` enum('info','warning','error','critical') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolved_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ropa_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ropa_chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`message` text NOT NULL,
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ropa_chat_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ropa_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` json NOT NULL,
	`description` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ropa_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `ropa_config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `ropa_learning` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(64) NOT NULL,
	`pattern` text NOT NULL,
	`frequency` int NOT NULL DEFAULT 1,
	`success_rate` decimal(5,2),
	`metadata` json,
	`last_seen` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ropa_learning_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ropa_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`task_id` varchar(64),
	`level` enum('debug','info','warn','error') NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ropa_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ropa_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metric_type` varchar(64) NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`unit` varchar(32),
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ropa_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ropa_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`task_id` varchar(64) NOT NULL,
	`type` varchar(64) NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`tool_used` varchar(128),
	`input` json,
	`output` json,
	`error` text,
	`started_at` timestamp,
	`completed_at` timestamp,
	`duration` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ropa_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `ropa_tasks_task_id_unique` UNIQUE(`task_id`)
);
