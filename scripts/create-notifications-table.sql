-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'success', 'warning', 'error') DEFAULT 'info' NOT NULL,
  `category` ENUM('workflow', 'agent', 'lead', 'ticket', 'system') NOT NULL,
  `relatedId` VARCHAR(64),
  `isRead` BOOLEAN DEFAULT FALSE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
