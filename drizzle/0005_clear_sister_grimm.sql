CREATE TABLE `portfolioAllocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` int NOT NULL,
	`assetId` int NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`quantity` int NOT NULL,
	`averagePrice` decimal(10,2) NOT NULL,
	`currentPrice` decimal(10,2) NOT NULL,
	`totalValue` decimal(15,2) NOT NULL,
	`profitLoss` decimal(15,2) NOT NULL,
	`profitLossPercent` decimal(5,2) NOT NULL,
	`percentageOfPortfolio` decimal(5,2) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioAllocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(15,2) NOT NULL,
	`totalReturn` decimal(10,2) NOT NULL,
	`totalTrades` int DEFAULT 0,
	`winningTrades` int DEFAULT 0,
	`winRate` decimal(5,2) DEFAULT '0.00',
	`maxDrawdown` decimal(5,2) DEFAULT '0.00',
	`sharpeRatio` decimal(5,2) DEFAULT '0.00',
	`profitFactor` decimal(5,2) DEFAULT '0.00',
	`openPositionsCount` int DEFAULT 0,
	`totalOpenValue` decimal(15,2) DEFAULT '0.00',
	`snapshotDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `portfolioAllocations` ADD CONSTRAINT `portfolioAllocations_portfolioId_portfolios_id_fk` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioAllocations` ADD CONSTRAINT `portfolioAllocations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioAllocations` ADD CONSTRAINT `portfolioAllocations_assetId_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSnapshots` ADD CONSTRAINT `portfolioSnapshots_portfolioId_portfolios_id_fk` FOREIGN KEY (`portfolioId`) REFERENCES `portfolios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `portfolioSnapshots` ADD CONSTRAINT `portfolioSnapshots_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;