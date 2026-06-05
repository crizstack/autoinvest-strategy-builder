CREATE INDEX `idx_backtest_user_created` ON `backtests` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_notification_user_read` ON `notifications` (`userId`,`read`);--> statement-breakpoint
CREATE INDEX `idx_paper_user_status` ON `paperTrades` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_portfolio_snapshot_date` ON `portfolioSnapshots` (`portfolioId`,`snapshotDate`);--> statement-breakpoint
CREATE INDEX `idx_strategy_user_status` ON `strategies` (`userId`,`status`);