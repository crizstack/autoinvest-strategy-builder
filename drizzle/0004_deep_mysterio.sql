CREATE TABLE `securityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` enum('login_success','login_failed','login_2fa','suspicious_activity','password_changed','2fa_enabled','2fa_disabled','session_revoked') NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'low',
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`details` json,
	`acknowledged` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorAuth` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`secret` varchar(255) NOT NULL,
	`backupCodes` json,
	`enabled` boolean DEFAULT false,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twoFactorAuth_id` PRIMARY KEY(`id`),
	CONSTRAINT `twoFactorAuth_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `userSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` varchar(500),
	`lastActivityAt` timestamp DEFAULT (now()),
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
ALTER TABLE `securityEvents` ADD CONSTRAINT `securityEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `twoFactorAuth` ADD CONSTRAINT `twoFactorAuth_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userSessions` ADD CONSTRAINT `userSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;