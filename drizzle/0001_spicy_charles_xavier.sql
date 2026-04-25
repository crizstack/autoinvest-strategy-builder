CREATE TABLE `assetPrices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`time` timestamp NOT NULL,
	`assetId` int NOT NULL,
	`open` decimal(10,4) NOT NULL,
	`high` decimal(10,4) NOT NULL,
	`low` decimal(10,4) NOT NULL,
	`close` decimal(10,4) NOT NULL,
	`volume` bigint NOT NULL,
	CONSTRAINT `assetPrices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`name` varchar(255) NOT NULL,
	`sector` varchar(100),
	`lastUpdated` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_symbol_unique` UNIQUE(`symbol`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`resourceType` varchar(50),
	`resourceId` int,
	`details` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backtests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strategyId` int NOT NULL,
	`userId` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`totalTrades` int,
	`winningTrades` int,
	`losingTrades` int,
	`winRate` decimal(5,2),
	`totalReturn` decimal(10,2),
	`maxDrawdown` decimal(5,2),
	`sharpeRatio` decimal(5,2),
	`profitFactor` decimal(5,2),
	`initialCapital` decimal(15,2) DEFAULT '10000.00',
	`finalCapital` decimal(15,2),
	`trades` json,
	`status` enum('pending','completed','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `backtests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paperTrades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`strategyId` int NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(10) NOT NULL,
	`type` enum('buy','sell') NOT NULL,
	`quantity` int NOT NULL,
	`entryPrice` decimal(10,2) NOT NULL,
	`entryTime` timestamp NOT NULL,
	`exitPrice` decimal(10,2),
	`exitTime` timestamp,
	`status` enum('open','closed','canceled') DEFAULT 'open',
	`profitLoss` decimal(15,2),
	`profitLossPercent` decimal(5,2),
	`entryReason` varchar(255),
	`exitReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paperTrades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`priceMonthly` decimal(10,2),
	`priceAnnual` decimal(10,2),
	`maxStrategies` int,
	`backtestDaysLimit` int DEFAULT -1,
	`paperTradingEnabled` boolean DEFAULT true,
	`realtimeDataEnabled` boolean DEFAULT false,
	`liveExecutionEnabled` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`initialBalance` decimal(15,2) DEFAULT '10000.00',
	`currentBalance` decimal(15,2),
	`totalReturn` decimal(10,2),
	`totalTrades` int DEFAULT 0,
	`winningTrades` int DEFAULT 0,
	`winRate` decimal(5,2),
	`openPositions` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`),
	CONSTRAINT `portfolios_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`asset` varchar(10) NOT NULL,
	`status` enum('draft','active','paused','archived') DEFAULT 'draft',
	`blocks` json,
	`connections` json,
	`maxDrawdown` decimal(5,2),
	`maxLossPerTrade` decimal(5,2),
	`riskPerTrade` decimal(5,2),
	`paperTradingActive` boolean DEFAULT false,
	`liveExecutionActive` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'BRL',
	`type` enum('subscription','refund','credit') NOT NULL,
	`status` enum('pending','completed','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `planId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','canceled','past_due','trial') DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE `users` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `assetPrices` ADD CONSTRAINT `assetPrices_assetId_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backtests` ADD CONSTRAINT `backtests_strategyId_strategies_id_fk` FOREIGN KEY (`strategyId`) REFERENCES `strategies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `backtests` ADD CONSTRAINT `backtests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paperTrades` ADD CONSTRAINT `paperTrades_strategyId_strategies_id_fk` FOREIGN KEY (`strategyId`) REFERENCES `strategies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paperTrades` ADD CONSTRAINT `paperTrades_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolios` ADD CONSTRAINT `portfolios_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategies` ADD CONSTRAINT `strategies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;