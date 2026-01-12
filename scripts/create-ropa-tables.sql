-- ROPA Tables Creation Script
-- Creates all tables required for ROPA (Meta-Agent) system

CREATE TABLE IF NOT EXISTS `ropa_tasks` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `task_id` varchar(64) NOT NULL UNIQUE,
  `type` varchar(64) NOT NULL,
  `status` enum('pending', 'running', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `priority` enum('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `tool_used` varchar(128),
  `input` json,
  `output` json,
  `error` text,
  `started_at` timestamp NULL,
  `completed_at` timestamp NULL,
  `duration` int,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ropa_logs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `task_id` varchar(64),
  `level` enum('debug', 'info', 'warn', 'error') NOT NULL DEFAULT 'info',
  `message` text NOT NULL,
  `metadata` json,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ropa_metrics` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `metric_type` varchar(64) NOT NULL,
  `value` decimal(10, 2) NOT NULL,
  `unit` varchar(32),
  `metadata` json,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ropa_config` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `key` varchar(128) NOT NULL UNIQUE,
  `value` json NOT NULL,
  `description` text,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ropa_chat_history` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `role` enum('user', 'assistant', 'system') NOT NULL,
  `message` text NOT NULL,
  `metadata` json,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ropa_learning` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `category` varchar(64) NOT NULL,
  `pattern` text NOT NULL,
  `frequency` int NOT NULL DEFAULT 1,
  `success_rate` decimal(5, 2),
  `metadata` json,
  `last_seen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `ropa_alerts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `severity` enum('info', 'warning', 'error', 'critical') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `resolved` boolean NOT NULL DEFAULT false,
  `resolved_at` timestamp NULL,
  `metadata` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
