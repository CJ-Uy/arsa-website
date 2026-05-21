import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
	text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const now = () =>
	integer("createdAt", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date());

const updated = () =>
	integer("updatedAt", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date());

// ============================================
// Redirects
// ============================================
export const redirects = sqliteTable(
	"Redirects",
	{
		id: id(),
		newURL: text("newURL").notNull(),
		redirectCode: text("redirectCode").notNull().unique(),
		clicks: integer("clicks").notNull().default(0),
		createdAt: now(),
	},
);

export const redirectClick = sqliteTable(
	"RedirectClick",
	{
		id: id(),
		redirectId: text("redirectId")
			.notNull()
			.references(() => redirects.id, { onDelete: "cascade" }),
		clickedAt: integer("clickedAt", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
		userAgent: text("userAgent"),
		referer: text("referer"),
	},
	(t) => ({
		redirectIdx: index("RedirectClick_redirectId_idx").on(t.redirectId),
		clickedAtIdx: index("RedirectClick_clickedAt_idx").on(t.clickedAt),
	}),
);

export const redirectTag = sqliteTable("RedirectTag", {
	id: id(),
	name: text("name").notNull().unique(),
	color: text("color").notNull().default("#6b7280"),
});

export const redirectTagAssignment = sqliteTable(
	"RedirectTagAssignment",
	{
		id: id(),
		redirectId: text("redirectId")
			.notNull()
			.references(() => redirects.id, { onDelete: "cascade" }),
		tagId: text("tagId")
			.notNull()
			.references(() => redirectTag.id, { onDelete: "cascade" }),
	},
	(t) => ({
		uniq: uniqueIndex("RedirectTagAssignment_redirectId_tagId_key").on(t.redirectId, t.tagId),
		redirectIdx: index("RedirectTagAssignment_redirectId_idx").on(t.redirectId),
		tagIdx: index("RedirectTagAssignment_tagId_idx").on(t.tagId),
	}),
);

// ============================================
// Better Auth
// ============================================
export const user = sqliteTable("user", {
	id: id(),
	email: text("email").notNull().unique(),
	emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
	name: text("name"),
	firstName: text("firstName"),
	lastName: text("lastName"),
	studentId: text("studentId"),
	image: text("image"),
	isShopAdmin: integer("isShopAdmin", { mode: "boolean" }).notNull().default(false),
	isEventsAdmin: integer("isEventsAdmin", { mode: "boolean" }).notNull().default(false),
	isRedirectsAdmin: integer("isRedirectsAdmin", { mode: "boolean" }).notNull().default(false),
	isTicketsAdmin: integer("isTicketsAdmin", { mode: "boolean" }).notNull().default(false),
	isSSO26Admin: integer("isSSO26Admin", { mode: "boolean" }).notNull().default(false),
	isBackupAdmin: integer("isBackupAdmin", { mode: "boolean" }).notNull().default(false),
	isSuperAdmin: integer("isSuperAdmin", { mode: "boolean" }).notNull().default(false),
	createdAt: now(),
	updatedAt: updated(),
});

export const session = sqliteTable(
	"session",
	{
		id: id(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		ipAddress: text("ipAddress"),
		userAgent: text("userAgent"),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		userIdx: index("session_userId_idx").on(t.userId),
	}),
);

export const account = sqliteTable(
	"account",
	{
		id: id(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accountId: text("accountId").notNull(),
		providerId: text("providerId").notNull(),
		accessToken: text("accessToken"),
		refreshToken: text("refreshToken"),
		idToken: text("idToken"),
		expiresAt: integer("expiresAt", { mode: "timestamp_ms" }),
		accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
		refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
		scope: text("scope"),
		password: text("password"),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		uniq: uniqueIndex("account_providerId_accountId_key").on(t.providerId, t.accountId),
		userIdx: index("account_userId_idx").on(t.userId),
	}),
);

export const verification = sqliteTable(
	"verification",
	{
		id: id(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		uniq: uniqueIndex("verification_identifier_value_key").on(t.identifier, t.value),
	}),
);

// ============================================
// Shop
// ============================================
export const product = sqliteTable("Product", {
	id: id(),
	name: text("name").notNull(),
	description: text("description").notNull(),
	price: real("price").notNull(),
	category: text("category").notNull(),
	image: text("image"),
	imageUrls: text("imageUrls", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
	imageCropPositions: text("imageCropPositions", { mode: "json" }).$type<Record<string, { x: number; y: number }>>(),
	stock: integer("stock"),
	isAvailable: integer("isAvailable", { mode: "boolean" }).notNull().default(true),
	isPreOrder: integer("isPreOrder", { mode: "boolean" }).notNull().default(false),
	isEventExclusive: integer("isEventExclusive", { mode: "boolean" }).notNull().default(false),
	availableSizes: text("availableSizes", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
	sizePricing: text("sizePricing", { mode: "json" }).$type<Record<string, number>>(),
	specialNote: text("specialNote"),
	dailyStockNote: text("dailyStockNote"),
	createdAt: now(),
	updatedAt: updated(),
});

export const packageTable = sqliteTable("Package", {
	id: id(),
	name: text("name").notNull(),
	description: text("description").notNull(),
	price: real("price").notNull(),
	image: text("image"),
	imageUrls: text("imageUrls", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
	imageCropPositions: text("imageCropPositions", { mode: "json" }).$type<Record<string, { x: number; y: number }>>(),
	isAvailable: integer("isAvailable", { mode: "boolean" }).notNull().default(true),
	isEventExclusive: integer("isEventExclusive", { mode: "boolean" }).notNull().default(false),
	specialNote: text("specialNote"),
	createdAt: now(),
	updatedAt: updated(),
});

export const packageItem = sqliteTable(
	"PackageItem",
	{
		id: id(),
		packageId: text("packageId")
			.notNull()
			.references(() => packageTable.id, { onDelete: "cascade" }),
		productId: text("productId")
			.notNull()
			.references(() => product.id),
		quantity: integer("quantity").notNull().default(1),
	},
	(t) => ({ pkgIdx: index("PackageItem_packageId_idx").on(t.packageId) }),
);

export const packagePool = sqliteTable(
	"PackagePool",
	{
		id: id(),
		packageId: text("packageId")
			.notNull()
			.references(() => packageTable.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		selectCount: integer("selectCount").notNull(),
	},
	(t) => ({ pkgIdx: index("PackagePool_packageId_idx").on(t.packageId) }),
);

export const packagePoolOption = sqliteTable(
	"PackagePoolOption",
	{
		id: id(),
		poolId: text("poolId")
			.notNull()
			.references(() => packagePool.id, { onDelete: "cascade" }),
		productId: text("productId")
			.notNull()
			.references(() => product.id),
	},
	(t) => ({ poolIdx: index("PackagePoolOption_poolId_idx").on(t.poolId) }),
);

export const cartItem = sqliteTable(
	"CartItem",
	{
		id: id(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		productId: text("productId").references(() => product.id, { onDelete: "cascade" }),
		packageId: text("packageId").references(() => packageTable.id, { onDelete: "cascade" }),
		quantity: integer("quantity").notNull().default(1),
		size: text("size"),
		packageSelections: text("packageSelections", { mode: "json" }),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		userIdx: index("CartItem_userId_idx").on(t.userId),
		userProdSize: index("CartItem_user_prod_size_idx").on(t.userId, t.productId, t.size),
		userPkg: index("CartItem_user_pkg_idx").on(t.userId, t.packageId),
	}),
);

export const shopEvent = sqliteTable(
	"ShopEvent",
	{
		id: id(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description").notNull(),
		heroImage: text("heroImage"),
		heroImageUrls: text("heroImageUrls", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
		isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
		isPriority: integer("isPriority", { mode: "boolean" }).notNull().default(false),
		tabOrder: integer("tabOrder").notNull().default(0),
		tabLabel: text("tabLabel"),
		startDate: integer("startDate", { mode: "timestamp_ms" }).notNull(),
		endDate: integer("endDate", { mode: "timestamp_ms" }).notNull(),
		dailyCutoffTime: text("dailyCutoffTime"),
		deliveryLeadDays: integer("deliveryLeadDays").notNull().default(1),
		isShopClosed: integer("isShopClosed", { mode: "boolean" }).notNull().default(false),
		closureMessage: text("closureMessage"),
		allowScheduledDelivery: integer("allowScheduledDelivery", { mode: "boolean" }).notNull().default(false),
		minDeliveryDate: integer("minDeliveryDate", { mode: "timestamp_ms" }),
		maxDeliveryDate: integer("maxDeliveryDate", { mode: "timestamp_ms" }),
		blockedDeliverySlots: text("blockedDeliverySlots", { mode: "json" }),
		componentPath: text("componentPath"),
		hasCustomCheckout: integer("hasCustomCheckout", { mode: "boolean" }).notNull().default(false),
		themeConfig: text("themeConfig", { mode: "json" }),
		checkoutConfig: text("checkoutConfig", { mode: "json" }),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		activeIdx: index("ShopEvent_isActive_idx").on(t.isActive),
		dateIdx: index("ShopEvent_dates_idx").on(t.startDate, t.endDate),
	}),
);

export const order = sqliteTable(
	"Order",
	{
		id: id(),
		userId: text("userId")
			.notNull()
			.references(() => user.id),
		totalAmount: real("totalAmount").notNull(),
		status: text("status").notNull().default("pending"),
		receiptImageUrl: text("receiptImageUrl"),
		gcashReferenceNumber: text("gcashReferenceNumber"),
		notes: text("notes"),
		eventId: text("eventId").references(() => shopEvent.id),
		eventData: text("eventData", { mode: "json" }),
		deliveryDate: integer("deliveryDate", { mode: "timestamp_ms" }),
		deliveryTimeSlot: text("deliveryTimeSlot"),
		deliveryNotes: text("deliveryNotes"),
		confirmationEmailSent: integer("confirmationEmailSent", { mode: "boolean" }).notNull().default(false),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		userIdx: index("Order_userId_idx").on(t.userId),
		statusIdx: index("Order_status_idx").on(t.status),
		gcashIdx: index("Order_gcash_idx").on(t.gcashReferenceNumber),
		eventIdx: index("Order_eventId_idx").on(t.eventId),
	}),
);

export const orderItem = sqliteTable(
	"OrderItem",
	{
		id: id(),
		orderId: text("orderId")
			.notNull()
			.references(() => order.id, { onDelete: "cascade" }),
		productId: text("productId").references(() => product.id),
		packageId: text("packageId").references(() => packageTable.id),
		quantity: integer("quantity").notNull(),
		price: real("price").notNull(),
		size: text("size"),
		packageSelections: text("packageSelections", { mode: "json" }),
		purchaseCode: text("purchaseCode"),
	},
	(t) => ({ orderIdx: index("OrderItem_orderId_idx").on(t.orderId) }),
);

export const banner = sqliteTable("Banner", {
	id: id(),
	isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
	message: text("message").notNull(),
	deadline: integer("deadline", { mode: "timestamp_ms" }),
	createdAt: now(),
	updatedAt: updated(),
});

export const eventAdmin = sqliteTable(
	"EventAdmin",
	{
		id: id(),
		eventId: text("eventId")
			.notNull()
			.references(() => shopEvent.id, { onDelete: "cascade" }),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: now(),
	},
	(t) => ({
		uniq: uniqueIndex("EventAdmin_eventId_userId_key").on(t.eventId, t.userId),
		userIdx: index("EventAdmin_userId_idx").on(t.userId),
	}),
);

export const eventCategory = sqliteTable(
	"EventCategory",
	{
		id: id(),
		eventId: text("eventId")
			.notNull()
			.references(() => shopEvent.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		displayOrder: integer("displayOrder").notNull().default(0),
		color: text("color"),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		uniq: uniqueIndex("EventCategory_eventId_name_key").on(t.eventId, t.name),
		eventIdx: index("EventCategory_eventId_idx").on(t.eventId),
		orderIdx: index("EventCategory_event_order_idx").on(t.eventId, t.displayOrder),
	}),
);

export const eventProduct = sqliteTable(
	"EventProduct",
	{
		id: id(),
		eventId: text("eventId")
			.notNull()
			.references(() => shopEvent.id, { onDelete: "cascade" }),
		productId: text("productId").references(() => product.id),
		packageId: text("packageId").references(() => packageTable.id),
		sortOrder: integer("sortOrder").notNull().default(0),
		eventPrice: real("eventPrice"),
		productCode: text("productCode"),
		categoryId: text("categoryId").references(() => eventCategory.id, { onDelete: "set null" }),
		hasDailyStockLimit: integer("hasDailyStockLimit", { mode: "boolean" }).notNull().default(false),
		defaultMaxOrdersPerDay: integer("defaultMaxOrdersPerDay"),
		dailyStockOverrides: text("dailyStockOverrides", { mode: "json" }),
		dailyStockNote: text("dailyStockNote"),
	},
	(t) => ({
		eventIdx: index("EventProduct_eventId_idx").on(t.eventId),
		orderIdx: index("EventProduct_event_order_idx").on(t.eventId, t.sortOrder),
		catIdx: index("EventProduct_categoryId_idx").on(t.categoryId),
	}),
);

export const shopClick = sqliteTable(
	"ShopClick",
	{
		id: id(),
		path: text("path").notNull(),
		eventId: text("eventId"),
		userAgent: text("userAgent"),
		referer: text("referer"),
		clickedAt: integer("clickedAt", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => ({
		clickIdx: index("ShopClick_clickedAt_idx").on(t.clickedAt),
		pathIdx: index("ShopClick_path_idx").on(t.path),
		eventIdx: index("ShopClick_eventId_idx").on(t.eventId),
	}),
);

export const shopPurchase = sqliteTable(
	"ShopPurchase",
	{
		id: id(),
		orderId: text("orderId").notNull(),
		eventId: text("eventId"),
		totalAmount: real("totalAmount").notNull(),
		itemCount: integer("itemCount").notNull(),
		purchasedAt: integer("purchasedAt", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => ({
		purchIdx: index("ShopPurchase_purchasedAt_idx").on(t.purchasedAt),
		eventIdx: index("ShopPurchase_eventId_idx").on(t.eventId),
		eventTimeIdx: index("ShopPurchase_event_time_idx").on(t.eventId, t.purchasedAt),
	}),
);

export const shopSettings = sqliteTable(
	"ShopSettings",
	{
		id: id(),
		key: text("key").notNull().unique(),
		value: text("value", { mode: "json" }).notNull(),
		updatedBy: text("updatedBy"),
		updatedAt: updated(),
		createdAt: now(),
	},
	(t) => ({ keyIdx: index("ShopSettings_key_idx").on(t.key) }),
);

export const emailLog = sqliteTable(
	"EmailLog",
	{
		id: id(),
		provider: text("provider").notNull(),
		recipient: text("recipient").notNull(),
		subject: text("subject").notNull(),
		emailType: text("emailType").notNull(),
		orderId: text("orderId"),
		userId: text("userId"),
		status: text("status").notNull(),
		errorMessage: text("errorMessage"),
		providerId: text("providerId"),
		sentAt: integer("sentAt", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => ({
		recipientIdx: index("EmailLog_recipient_idx").on(t.recipient),
		orderIdx: index("EmailLog_orderId_idx").on(t.orderId),
		sentIdx: index("EmailLog_sentAt_idx").on(t.sentAt),
		statusIdx: index("EmailLog_status_idx").on(t.status),
		typeIdx: index("EmailLog_emailType_idx").on(t.emailType),
	}),
);

// ============================================
// Tickets
// ============================================
export const ticketEvent = sqliteTable(
	"TicketEvent",
	{
		id: id(),
		name: text("name").notNull(),
		description: text("description"),
		isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
		date: integer("date", { mode: "timestamp_ms" }),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({ activeIdx: index("TicketEvent_isActive_idx").on(t.isActive) }),
);

export const ticket = sqliteTable(
	"Ticket",
	{
		id: id(),
		shortCode: text("shortCode").notNull().unique(),
		email: text("email").notNull(),
		ticketEventId: text("ticketEventId")
			.notNull()
			.references(() => ticketEvent.id, { onDelete: "cascade" }),
		scanned: integer("scanned", { mode: "boolean" }).notNull().default(false),
		scannedAt: integer("scannedAt", { mode: "timestamp_ms" }),
		scannedById: text("scannedById").references(() => user.id, { onDelete: "set null" }),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		eventIdx: index("Ticket_event_idx").on(t.ticketEventId),
		emailIdx: index("Ticket_email_idx").on(t.email),
		codeIdx: index("Ticket_code_idx").on(t.shortCode),
		scannerIdx: index("Ticket_scanner_idx").on(t.scannedById),
	}),
);

export const ticketVerifier = sqliteTable(
	"TicketVerifier",
	{
		id: id(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		ticketEventId: text("ticketEventId")
			.notNull()
			.references(() => ticketEvent.id, { onDelete: "cascade" }),
		createdAt: now(),
	},
	(t) => ({
		uniq: uniqueIndex("TicketVerifier_user_event_key").on(t.userId, t.ticketEventId),
		userIdx: index("TicketVerifier_userId_idx").on(t.userId),
		eventIdx: index("TicketVerifier_event_idx").on(t.ticketEventId),
	}),
);

// ============================================
// CMS
// ============================================
export const contentPage = sqliteTable(
	"ContentPage",
	{
		id: id(),
		slug: text("slug").notNull().unique(),
		title: text("title").notNull(),
		description: text("description"),
		content: text("content", { mode: "json" }).notNull(),
		isPublished: integer("isPublished", { mode: "boolean" }).notNull().default(false),
		publishedAt: integer("publishedAt", { mode: "timestamp_ms" }),
		updatedBy: text("updatedBy"),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		slugIdx: index("ContentPage_slug_idx").on(t.slug),
		pubIdx: index("ContentPage_published_idx").on(t.isPublished),
	}),
);

export const siteContent = sqliteTable(
	"SiteContent",
	{
		id: id(),
		key: text("key").notNull().unique(),
		data: text("data", { mode: "json" }).notNull(),
		updatedBy: text("updatedBy"),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({ keyIdx: index("SiteContent_key_idx").on(t.key) }),
);

// ============================================
// SSO 2026
// ============================================
export const sso26Nomination = sqliteTable(
	"SSO26Nomination",
	{
		id: id(),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		question: text("question").notNull(),
		nominee: text("nominee").notNull(),
		otherText: text("otherText"),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		uniq: uniqueIndex("SSO26Nomination_user_question_key").on(t.userId, t.question),
		qIdx: index("SSO26Nomination_question_idx").on(t.question),
		userIdx: index("SSO26Nomination_userId_idx").on(t.userId),
	}),
);

export const sso26DdayVote = sqliteTable(
	"SSO26DdayVote",
	{
		id: id(),
		userId: text("userId").references(() => user.id, { onDelete: "set null" }),
		question: text("question").notNull(),
		nominee: text("nominee").notNull(),
		createdAt: now(),
	},
	(t) => ({
		userIdx: index("SSO26DdayVote_userId_idx").on(t.userId),
		qIdx: index("SSO26DdayVote_question_idx").on(t.question),
		nomIdx: index("SSO26DdayVote_nominee_idx").on(t.nominee),
	}),
);

// ============================================
// Relations
// ============================================
import { relations } from "drizzle-orm";

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	orders: many(order),
	cartItems: many(cartItem),
	eventAdmins: many(eventAdmin),
	scannedTickets: many(ticket),
	ticketVerifiers: many(ticketVerifier),
	sso26Nominations: many(sso26Nomination),
	sso26DdayVotes: many(sso26DdayVote),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const productRelations = relations(product, ({ many }) => ({
	orderItems: many(orderItem),
	cartItems: many(cartItem),
	packageItems: many(packageItem),
	packagePoolOptions: many(packagePoolOption),
	eventProducts: many(eventProduct),
}));

export const packageRelations = relations(packageTable, ({ many }) => ({
	items: many(packageItem),
	pools: many(packagePool),
	cartItems: many(cartItem),
	orderItems: many(orderItem),
	eventProducts: many(eventProduct),
}));

export const packageItemRelations = relations(packageItem, ({ one }) => ({
	package: one(packageTable, { fields: [packageItem.packageId], references: [packageTable.id] }),
	product: one(product, { fields: [packageItem.productId], references: [product.id] }),
}));

export const packagePoolRelations = relations(packagePool, ({ one, many }) => ({
	package: one(packageTable, { fields: [packagePool.packageId], references: [packageTable.id] }),
	options: many(packagePoolOption),
}));

export const packagePoolOptionRelations = relations(packagePoolOption, ({ one }) => ({
	pool: one(packagePool, { fields: [packagePoolOption.poolId], references: [packagePool.id] }),
	product: one(product, { fields: [packagePoolOption.productId], references: [product.id] }),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
	user: one(user, { fields: [cartItem.userId], references: [user.id] }),
	product: one(product, { fields: [cartItem.productId], references: [product.id] }),
	package: one(packageTable, { fields: [cartItem.packageId], references: [packageTable.id] }),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
	user: one(user, { fields: [order.userId], references: [user.id] }),
	event: one(shopEvent, { fields: [order.eventId], references: [shopEvent.id] }),
	orderItems: many(orderItem),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
	order: one(order, { fields: [orderItem.orderId], references: [order.id] }),
	product: one(product, { fields: [orderItem.productId], references: [product.id] }),
	package: one(packageTable, { fields: [orderItem.packageId], references: [packageTable.id] }),
}));

export const shopEventRelations = relations(shopEvent, ({ many }) => ({
	products: many(eventProduct),
	categories: many(eventCategory),
	orders: many(order),
	admins: many(eventAdmin),
}));

export const eventAdminRelations = relations(eventAdmin, ({ one }) => ({
	event: one(shopEvent, { fields: [eventAdmin.eventId], references: [shopEvent.id] }),
	user: one(user, { fields: [eventAdmin.userId], references: [user.id] }),
}));

export const eventCategoryRelations = relations(eventCategory, ({ one, many }) => ({
	event: one(shopEvent, { fields: [eventCategory.eventId], references: [shopEvent.id] }),
	products: many(eventProduct),
}));

export const eventProductRelations = relations(eventProduct, ({ one }) => ({
	event: one(shopEvent, { fields: [eventProduct.eventId], references: [shopEvent.id] }),
	product: one(product, { fields: [eventProduct.productId], references: [product.id] }),
	package: one(packageTable, { fields: [eventProduct.packageId], references: [packageTable.id] }),
	category: one(eventCategory, { fields: [eventProduct.categoryId], references: [eventCategory.id] }),
}));

export const ticketEventRelations = relations(ticketEvent, ({ many }) => ({
	tickets: many(ticket),
	verifiers: many(ticketVerifier),
}));

export const ticketRelations = relations(ticket, ({ one }) => ({
	ticketEvent: one(ticketEvent, { fields: [ticket.ticketEventId], references: [ticketEvent.id] }),
	scannedBy: one(user, { fields: [ticket.scannedById], references: [user.id] }),
}));

export const ticketVerifierRelations = relations(ticketVerifier, ({ one }) => ({
	user: one(user, { fields: [ticketVerifier.userId], references: [user.id] }),
	ticketEvent: one(ticketEvent, { fields: [ticketVerifier.ticketEventId], references: [ticketEvent.id] }),
}));

export const redirectsRelations = relations(redirects, ({ many }) => ({
	clickLogs: many(redirectClick),
	redirectTags: many(redirectTagAssignment),
}));

export const redirectClickRelations = relations(redirectClick, ({ one }) => ({
	redirect: one(redirects, { fields: [redirectClick.redirectId], references: [redirects.id] }),
}));

export const redirectTagRelations = relations(redirectTag, ({ many }) => ({
	assignments: many(redirectTagAssignment),
}));

export const redirectTagAssignmentRelations = relations(redirectTagAssignment, ({ one }) => ({
	redirect: one(redirects, { fields: [redirectTagAssignment.redirectId], references: [redirects.id] }),
	tag: one(redirectTag, { fields: [redirectTagAssignment.tagId], references: [redirectTag.id] }),
}));

export const sso26NominationRelations = relations(sso26Nomination, ({ one }) => ({
	user: one(user, { fields: [sso26Nomination.userId], references: [user.id] }),
}));

export const sso26DdayVoteRelations = relations(sso26DdayVote, ({ one }) => ({
	user: one(user, { fields: [sso26DdayVote.userId], references: [user.id] }),
}));
