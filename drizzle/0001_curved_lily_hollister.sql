CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`startDate` integer,
	`endDate` integer,
	`heroImages` text DEFAULT '[]' NOT NULL,
	`theme` text,
	`priority` integer DEFAULT 0 NOT NULL,
	`tabLabel` text,
	`ogImage` text,
	`metaTitle` text,
	`metaDescription` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_slug_unique` ON `event` (`slug`);--> statement-breakpoint
CREATE INDEX `event_status_idx` ON `event` (`status`);--> statement-breakpoint
CREATE INDEX `event_dates_idx` ON `event` (`startDate`,`endDate`);--> statement-breakpoint
CREATE TABLE `event_landing` (
	`eventId` text PRIMARY KEY NOT NULL,
	`body` text,
	`codePath` text,
	`published` integer DEFAULT false NOT NULL,
	`lastToggledBy` text,
	`lastToggledAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lastToggledBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `event_page` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`pageSlug` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`codePath` text,
	`published` integer DEFAULT false NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`lastToggledBy` text,
	`lastToggledAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lastToggledBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_page_event_slug_key` ON `event_page` (`eventId`,`pageSlug`);--> statement-breakpoint
CREATE INDEX `event_page_event_idx` ON `event_page` (`eventId`);--> statement-breakpoint
CREATE TABLE `event_role_grant` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`grantedBy` text,
	`grantedAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`grantedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_role_grant_uniq` ON `event_role_grant` (`eventId`,`userId`,`role`);--> statement-breakpoint
CREATE INDEX `event_role_grant_user_idx` ON `event_role_grant` (`userId`);--> statement-breakpoint
CREATE INDEX `event_role_grant_event_idx` ON `event_role_grant` (`eventId`);--> statement-breakpoint
CREATE TABLE `event_shop` (
	`eventId` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`checkoutFields` text,
	`checkoutConfig` text,
	`hasCustomCheckout` integer DEFAULT false NOT NULL,
	`exclusivePricing` integer DEFAULT false NOT NULL,
	`codePath` text,
	`dailyCutoffTime` text,
	`deliveryLeadDays` integer DEFAULT 1 NOT NULL,
	`isShopClosed` integer DEFAULT false NOT NULL,
	`closureMessage` text,
	`allowScheduledDelivery` integer DEFAULT false NOT NULL,
	`minDeliveryDate` integer,
	`maxDeliveryDate` integer,
	`blockedDeliverySlots` text,
	`lastToggledBy` text,
	`lastToggledAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lastToggledBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `event_tickets` (
	`eventId` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`defaultActive` integer DEFAULT true NOT NULL,
	`sheetSyncEnabled` integer DEFAULT false NOT NULL,
	`sheetId` text,
	`lastToggledBy` text,
	`lastToggledAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lastToggledBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
