ALTER TABLE `paperTrades` ADD `stopLoss` decimal(10,2);--> statement-breakpoint
ALTER TABLE `paperTrades` ADD `takeProfit` decimal(10,2);--> statement-breakpoint
ALTER TABLE `paperTrades` ADD `lastPriceCheck` timestamp;--> statement-breakpoint
ALTER TABLE `paperTrades` ADD `lastUnrealizedPnL` decimal(15,2);