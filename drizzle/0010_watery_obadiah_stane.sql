ALTER TABLE `notifications` ADD `priority` enum('low','normal','high','critical') DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE `notifications` ADD `eventType` varchar(50);--> statement-breakpoint
ALTER TABLE `notifications` ADD `soundEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `notifications` ADD `soundUrl` varchar(255);--> statement-breakpoint
ALTER TABLE `notifications` ADD `pushNotificationSent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `notifications` ADD `pushNotificationToken` varchar(500);--> statement-breakpoint
ALTER TABLE `notifications` ADD `emailNotificationSent` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `notifications` ADD `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `notifications` ADD `dismissedAt` timestamp;--> statement-breakpoint
ALTER TABLE `notifications` ADD `snoozedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `notifications` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
CREATE INDEX `idx_notification_priority` ON `notifications` (`userId`,`priority`);--> statement-breakpoint
CREATE INDEX `idx_notification_event_type` ON `notifications` (`userId`,`eventType`);--> statement-breakpoint
CREATE INDEX `idx_notification_expires` ON `notifications` (`expiresAt`);