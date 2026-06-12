CREATE TABLE `circuitBreakerStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceName` varchar(100) NOT NULL,
	`state` enum('closed','open','half_open') NOT NULL DEFAULT 'closed',
	`failureCount` int DEFAULT 0,
	`lastFailureAt` timestamp,
	`lastSuccessAt` timestamp,
	`openedAt` timestamp,
	`recoveryAttempts` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `circuitBreakerStatus_id` PRIMARY KEY(`id`),
	CONSTRAINT `circuitBreakerStatus_serviceName_unique` UNIQUE(`serviceName`)
);
--> statement-breakpoint
CREATE TABLE `executionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strategyId` int NOT NULL,
	`userId` int NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('success','failed','partial') NOT NULL,
	`tradesOpened` int DEFAULT 0,
	`tradesClosedByTP` int DEFAULT 0,
	`tradesClosedBySL` int DEFAULT 0,
	`errors` json,
	`duration` int,
	`retryCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `executionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executionQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strategyId` int NOT NULL,
	`userId` int NOT NULL,
	`priority` int DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`retryCount` int DEFAULT 0,
	`maxRetries` int DEFAULT 3,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `executionQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`maxExposurePercent` decimal(5,2) DEFAULT '100',
	`maxSimultaneousTrades` int DEFAULT 10,
	`maxLossPercent` decimal(5,2) DEFAULT '10',
	`maxLossPerTrade` decimal(12,2),
	`dailyMaxLoss` decimal(12,2),
	`enableAutoStop` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riskControls_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_risk_controls_user` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `tradeExecutionLocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strategyId` int NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(20) NOT NULL,
	`lockType` enum('open','close','monitor') NOT NULL,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`lockId` varchar(64) NOT NULL,
	CONSTRAINT `tradeExecutionLocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tradeExecutionLocks_lockId_unique` UNIQUE(`lockId`),
	CONSTRAINT `idx_trade_lock_unique` UNIQUE(`strategyId`,`userId`,`asset`,`lockType`)
);
--> statement-breakpoint
ALTER TABLE `executionLogs` ADD CONSTRAINT `executionLogs_strategyId_strategies_id_fk` FOREIGN KEY (`strategyId`) REFERENCES `strategies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `executionLogs` ADD CONSTRAINT `executionLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `executionQueue` ADD CONSTRAINT `executionQueue_strategyId_strategies_id_fk` FOREIGN KEY (`strategyId`) REFERENCES `strategies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `executionQueue` ADD CONSTRAINT `executionQueue_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `riskControls` ADD CONSTRAINT `riskControls_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeExecutionLocks` ADD CONSTRAINT `tradeExecutionLocks_strategyId_strategies_id_fk` FOREIGN KEY (`strategyId`) REFERENCES `strategies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeExecutionLocks` ADD CONSTRAINT `tradeExecutionLocks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_circuit_breaker_service` ON `circuitBreakerStatus` (`serviceName`);--> statement-breakpoint
CREATE INDEX `idx_execution_user_strategy` ON `executionLogs` (`userId`,`strategyId`);--> statement-breakpoint
CREATE INDEX `idx_execution_executed_at` ON `executionLogs` (`executedAt`);--> statement-breakpoint
CREATE INDEX `idx_queue_user_status` ON `executionQueue` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_queue_priority` ON `executionQueue` (`priority`);--> statement-breakpoint
CREATE INDEX `idx_queue_created_at` ON `executionQueue` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_trade_lock_expires` ON `tradeExecutionLocks` (`expiresAt`);