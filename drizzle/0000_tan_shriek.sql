CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`expiresAt` integer,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_providerId_accountId_key` ON `account` (`providerId`,`accountId`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE TABLE `Banner` (
	`id` text PRIMARY KEY NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`message` text NOT NULL,
	`deadline` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `CartItem` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`productId` text,
	`packageId` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`size` text,
	`packageSelections` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `CartItem_userId_idx` ON `CartItem` (`userId`);--> statement-breakpoint
CREATE INDEX `CartItem_user_prod_size_idx` ON `CartItem` (`userId`,`productId`,`size`);--> statement-breakpoint
CREATE INDEX `CartItem_user_pkg_idx` ON `CartItem` (`userId`,`packageId`);--> statement-breakpoint
CREATE TABLE `ContentPage` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`isPublished` integer DEFAULT false NOT NULL,
	`publishedAt` integer,
	`updatedBy` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ContentPage_slug_unique` ON `ContentPage` (`slug`);--> statement-breakpoint
CREATE INDEX `ContentPage_slug_idx` ON `ContentPage` (`slug`);--> statement-breakpoint
CREATE INDEX `ContentPage_published_idx` ON `ContentPage` (`isPublished`);--> statement-breakpoint
CREATE TABLE `EmailLog` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`emailType` text NOT NULL,
	`orderId` text,
	`userId` text,
	`status` text NOT NULL,
	`errorMessage` text,
	`providerId` text,
	`sentAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `EmailLog_recipient_idx` ON `EmailLog` (`recipient`);--> statement-breakpoint
CREATE INDEX `EmailLog_orderId_idx` ON `EmailLog` (`orderId`);--> statement-breakpoint
CREATE INDEX `EmailLog_sentAt_idx` ON `EmailLog` (`sentAt`);--> statement-breakpoint
CREATE INDEX `EmailLog_status_idx` ON `EmailLog` (`status`);--> statement-breakpoint
CREATE INDEX `EmailLog_emailType_idx` ON `EmailLog` (`emailType`);--> statement-breakpoint
CREATE TABLE `EventAdmin` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `ShopEvent`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `EventAdmin_eventId_userId_key` ON `EventAdmin` (`eventId`,`userId`);--> statement-breakpoint
CREATE INDEX `EventAdmin_userId_idx` ON `EventAdmin` (`userId`);--> statement-breakpoint
CREATE TABLE `EventCategory` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`name` text NOT NULL,
	`displayOrder` integer DEFAULT 0 NOT NULL,
	`color` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`eventId`) REFERENCES `ShopEvent`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `EventCategory_eventId_name_key` ON `EventCategory` (`eventId`,`name`);--> statement-breakpoint
CREATE INDEX `EventCategory_eventId_idx` ON `EventCategory` (`eventId`);--> statement-breakpoint
CREATE INDEX `EventCategory_event_order_idx` ON `EventCategory` (`eventId`,`displayOrder`);--> statement-breakpoint
CREATE TABLE `EventProduct` (
	`id` text PRIMARY KEY NOT NULL,
	`eventId` text NOT NULL,
	`productId` text,
	`packageId` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`eventPrice` real,
	`productCode` text,
	`categoryId` text,
	`hasDailyStockLimit` integer DEFAULT false NOT NULL,
	`defaultMaxOrdersPerDay` integer,
	`dailyStockOverrides` text,
	`dailyStockNote` text,
	FOREIGN KEY (`eventId`) REFERENCES `ShopEvent`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryId`) REFERENCES `EventCategory`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `EventProduct_eventId_idx` ON `EventProduct` (`eventId`);--> statement-breakpoint
CREATE INDEX `EventProduct_event_order_idx` ON `EventProduct` (`eventId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `EventProduct_categoryId_idx` ON `EventProduct` (`categoryId`);--> statement-breakpoint
CREATE TABLE `Order` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`totalAmount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`receiptImageUrl` text,
	`gcashReferenceNumber` text,
	`notes` text,
	`eventId` text,
	`eventData` text,
	`deliveryDate` integer,
	`deliveryTimeSlot` text,
	`deliveryNotes` text,
	`confirmationEmailSent` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`eventId`) REFERENCES `ShopEvent`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `Order_userId_idx` ON `Order` (`userId`);--> statement-breakpoint
CREATE INDEX `Order_status_idx` ON `Order` (`status`);--> statement-breakpoint
CREATE INDEX `Order_gcash_idx` ON `Order` (`gcashReferenceNumber`);--> statement-breakpoint
CREATE INDEX `Order_eventId_idx` ON `Order` (`eventId`);--> statement-breakpoint
CREATE TABLE `OrderItem` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`productId` text,
	`packageId` text,
	`quantity` integer NOT NULL,
	`price` real NOT NULL,
	`size` text,
	`packageSelections` text,
	`purchaseCode` text,
	FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `OrderItem_orderId_idx` ON `OrderItem` (`orderId`);--> statement-breakpoint
CREATE TABLE `PackageItem` (
	`id` text PRIMARY KEY NOT NULL,
	`packageId` text NOT NULL,
	`productId` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `PackageItem_packageId_idx` ON `PackageItem` (`packageId`);--> statement-breakpoint
CREATE TABLE `PackagePool` (
	`id` text PRIMARY KEY NOT NULL,
	`packageId` text NOT NULL,
	`name` text NOT NULL,
	`selectCount` integer NOT NULL,
	FOREIGN KEY (`packageId`) REFERENCES `Package`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `PackagePool_packageId_idx` ON `PackagePool` (`packageId`);--> statement-breakpoint
CREATE TABLE `PackagePoolOption` (
	`id` text PRIMARY KEY NOT NULL,
	`poolId` text NOT NULL,
	`productId` text NOT NULL,
	FOREIGN KEY (`poolId`) REFERENCES `PackagePool`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `PackagePoolOption_poolId_idx` ON `PackagePoolOption` (`poolId`);--> statement-breakpoint
CREATE TABLE `Package` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`image` text,
	`imageUrls` text DEFAULT '[]' NOT NULL,
	`imageCropPositions` text,
	`isAvailable` integer DEFAULT true NOT NULL,
	`isEventExclusive` integer DEFAULT false NOT NULL,
	`specialNote` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Product` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`category` text NOT NULL,
	`image` text,
	`imageUrls` text DEFAULT '[]' NOT NULL,
	`imageCropPositions` text,
	`stock` integer,
	`isAvailable` integer DEFAULT true NOT NULL,
	`isPreOrder` integer DEFAULT false NOT NULL,
	`isEventExclusive` integer DEFAULT false NOT NULL,
	`availableSizes` text DEFAULT '[]' NOT NULL,
	`sizePricing` text,
	`specialNote` text,
	`dailyStockNote` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `RedirectClick` (
	`id` text PRIMARY KEY NOT NULL,
	`redirectId` text NOT NULL,
	`clickedAt` integer NOT NULL,
	`userAgent` text,
	`referer` text,
	FOREIGN KEY (`redirectId`) REFERENCES `Redirects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `RedirectClick_redirectId_idx` ON `RedirectClick` (`redirectId`);--> statement-breakpoint
CREATE INDEX `RedirectClick_clickedAt_idx` ON `RedirectClick` (`clickedAt`);--> statement-breakpoint
CREATE TABLE `RedirectTag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `RedirectTag_name_unique` ON `RedirectTag` (`name`);--> statement-breakpoint
CREATE TABLE `RedirectTagAssignment` (
	`id` text PRIMARY KEY NOT NULL,
	`redirectId` text NOT NULL,
	`tagId` text NOT NULL,
	FOREIGN KEY (`redirectId`) REFERENCES `Redirects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tagId`) REFERENCES `RedirectTag`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `RedirectTagAssignment_redirectId_tagId_key` ON `RedirectTagAssignment` (`redirectId`,`tagId`);--> statement-breakpoint
CREATE INDEX `RedirectTagAssignment_redirectId_idx` ON `RedirectTagAssignment` (`redirectId`);--> statement-breakpoint
CREATE INDEX `RedirectTagAssignment_tagId_idx` ON `RedirectTagAssignment` (`tagId`);--> statement-breakpoint
CREATE TABLE `Redirects` (
	`id` text PRIMARY KEY NOT NULL,
	`newURL` text NOT NULL,
	`redirectCode` text NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Redirects_redirectCode_unique` ON `Redirects` (`redirectCode`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE TABLE `ShopClick` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`eventId` text,
	`userAgent` text,
	`referer` text,
	`clickedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ShopClick_clickedAt_idx` ON `ShopClick` (`clickedAt`);--> statement-breakpoint
CREATE INDEX `ShopClick_path_idx` ON `ShopClick` (`path`);--> statement-breakpoint
CREATE INDEX `ShopClick_eventId_idx` ON `ShopClick` (`eventId`);--> statement-breakpoint
CREATE TABLE `ShopEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`heroImage` text,
	`heroImageUrls` text DEFAULT '[]' NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`isPriority` integer DEFAULT false NOT NULL,
	`tabOrder` integer DEFAULT 0 NOT NULL,
	`tabLabel` text,
	`startDate` integer NOT NULL,
	`endDate` integer NOT NULL,
	`dailyCutoffTime` text,
	`deliveryLeadDays` integer DEFAULT 1 NOT NULL,
	`isShopClosed` integer DEFAULT false NOT NULL,
	`closureMessage` text,
	`allowScheduledDelivery` integer DEFAULT false NOT NULL,
	`minDeliveryDate` integer,
	`maxDeliveryDate` integer,
	`blockedDeliverySlots` text,
	`componentPath` text,
	`hasCustomCheckout` integer DEFAULT false NOT NULL,
	`themeConfig` text,
	`checkoutConfig` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ShopEvent_slug_unique` ON `ShopEvent` (`slug`);--> statement-breakpoint
CREATE INDEX `ShopEvent_isActive_idx` ON `ShopEvent` (`isActive`);--> statement-breakpoint
CREATE INDEX `ShopEvent_dates_idx` ON `ShopEvent` (`startDate`,`endDate`);--> statement-breakpoint
CREATE TABLE `ShopPurchase` (
	`id` text PRIMARY KEY NOT NULL,
	`orderId` text NOT NULL,
	`eventId` text,
	`totalAmount` real NOT NULL,
	`itemCount` integer NOT NULL,
	`purchasedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ShopPurchase_purchasedAt_idx` ON `ShopPurchase` (`purchasedAt`);--> statement-breakpoint
CREATE INDEX `ShopPurchase_eventId_idx` ON `ShopPurchase` (`eventId`);--> statement-breakpoint
CREATE INDEX `ShopPurchase_event_time_idx` ON `ShopPurchase` (`eventId`,`purchasedAt`);--> statement-breakpoint
CREATE TABLE `ShopSettings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updatedBy` text,
	`updatedAt` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ShopSettings_key_unique` ON `ShopSettings` (`key`);--> statement-breakpoint
CREATE INDEX `ShopSettings_key_idx` ON `ShopSettings` (`key`);--> statement-breakpoint
CREATE TABLE `SiteContent` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`data` text NOT NULL,
	`updatedBy` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `SiteContent_key_unique` ON `SiteContent` (`key`);--> statement-breakpoint
CREATE INDEX `SiteContent_key_idx` ON `SiteContent` (`key`);--> statement-breakpoint
CREATE TABLE `SSO26DdayVote` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`question` text NOT NULL,
	`nominee` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `SSO26DdayVote_userId_idx` ON `SSO26DdayVote` (`userId`);--> statement-breakpoint
CREATE INDEX `SSO26DdayVote_question_idx` ON `SSO26DdayVote` (`question`);--> statement-breakpoint
CREATE INDEX `SSO26DdayVote_nominee_idx` ON `SSO26DdayVote` (`nominee`);--> statement-breakpoint
CREATE TABLE `SSO26Nomination` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`question` text NOT NULL,
	`nominee` text NOT NULL,
	`otherText` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `SSO26Nomination_user_question_key` ON `SSO26Nomination` (`userId`,`question`);--> statement-breakpoint
CREATE INDEX `SSO26Nomination_question_idx` ON `SSO26Nomination` (`question`);--> statement-breakpoint
CREATE INDEX `SSO26Nomination_userId_idx` ON `SSO26Nomination` (`userId`);--> statement-breakpoint
CREATE TABLE `Ticket` (
	`id` text PRIMARY KEY NOT NULL,
	`shortCode` text NOT NULL,
	`email` text NOT NULL,
	`ticketEventId` text NOT NULL,
	`scanned` integer DEFAULT false NOT NULL,
	`scannedAt` integer,
	`scannedById` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`ticketEventId`) REFERENCES `TicketEvent`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scannedById`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Ticket_shortCode_unique` ON `Ticket` (`shortCode`);--> statement-breakpoint
CREATE INDEX `Ticket_event_idx` ON `Ticket` (`ticketEventId`);--> statement-breakpoint
CREATE INDEX `Ticket_email_idx` ON `Ticket` (`email`);--> statement-breakpoint
CREATE INDEX `Ticket_code_idx` ON `Ticket` (`shortCode`);--> statement-breakpoint
CREATE INDEX `Ticket_scanner_idx` ON `Ticket` (`scannedById`);--> statement-breakpoint
CREATE TABLE `TicketEvent` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`isActive` integer DEFAULT true NOT NULL,
	`date` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `TicketEvent_isActive_idx` ON `TicketEvent` (`isActive`);--> statement-breakpoint
CREATE TABLE `TicketVerifier` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`ticketEventId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ticketEventId`) REFERENCES `TicketEvent`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `TicketVerifier_user_event_key` ON `TicketVerifier` (`userId`,`ticketEventId`);--> statement-breakpoint
CREATE INDEX `TicketVerifier_userId_idx` ON `TicketVerifier` (`userId`);--> statement-breakpoint
CREATE INDEX `TicketVerifier_event_idx` ON `TicketVerifier` (`ticketEventId`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`name` text,
	`firstName` text,
	`lastName` text,
	`studentId` text,
	`image` text,
	`isShopAdmin` integer DEFAULT false NOT NULL,
	`isEventsAdmin` integer DEFAULT false NOT NULL,
	`isRedirectsAdmin` integer DEFAULT false NOT NULL,
	`isTicketsAdmin` integer DEFAULT false NOT NULL,
	`isSSO26Admin` integer DEFAULT false NOT NULL,
	`isBackupAdmin` integer DEFAULT false NOT NULL,
	`isSuperAdmin` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_identifier_value_key` ON `verification` (`identifier`,`value`);