import archiver from "archiver";
import crypto from "crypto";
import { PassThrough, Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { minioClient, BUCKETS } from "@/lib/minio";

/**
 * Table export descriptor.
 * Order matters — child tables (with FKs) come after parents so import can
 * follow the same order without FK violations.
 */
type TableDescriptor = {
	name: string; // Prisma model name (PascalCase)
	delegate: string; // prisma client delegate (camelCase)
	cursorField: string; // unique field for cursor pagination
	audit?: boolean; // toggleable (large/log tables)
	sensitive?: boolean; // contains tokens/credentials
};

const TABLES: TableDescriptor[] = [
	// Auth
	{ name: "User", delegate: "user", cursorField: "id" },
	{ name: "Verification", delegate: "verification", cursorField: "id", sensitive: true },
	{ name: "Session", delegate: "session", cursorField: "id", sensitive: true },
	{ name: "Account", delegate: "account", cursorField: "id", sensitive: true },

	// Redirects
	{ name: "RedirectTag", delegate: "redirectTag", cursorField: "id" },
	{ name: "Redirects", delegate: "redirects", cursorField: "id" },
	{ name: "RedirectClick", delegate: "redirectClick", cursorField: "id", audit: true },
	{ name: "RedirectTagAssignment", delegate: "redirectTagAssignment", cursorField: "id" },

	// Shop
	{ name: "Product", delegate: "product", cursorField: "id" },
	{ name: "Package", delegate: "package", cursorField: "id" },
	{ name: "PackageItem", delegate: "packageItem", cursorField: "id" },
	{ name: "PackagePool", delegate: "packagePool", cursorField: "id" },
	{ name: "PackagePoolOption", delegate: "packagePoolOption", cursorField: "id" },

	// Events
	{ name: "ShopEvent", delegate: "shopEvent", cursorField: "id" },
	{ name: "EventAdmin", delegate: "eventAdmin", cursorField: "id" },
	{ name: "EventCategory", delegate: "eventCategory", cursorField: "id" },
	{ name: "EventProduct", delegate: "eventProduct", cursorField: "id" },

	// Cart / Orders
	{ name: "CartItem", delegate: "cartItem", cursorField: "id" },
	{ name: "Order", delegate: "order", cursorField: "id" },
	{ name: "OrderItem", delegate: "orderItem", cursorField: "id" },

	// Misc
	{ name: "Banner", delegate: "banner", cursorField: "id" },
	{ name: "ShopClick", delegate: "shopClick", cursorField: "id", audit: true },
	{ name: "ShopPurchase", delegate: "shopPurchase", cursorField: "id", audit: true },
	{ name: "ShopSettings", delegate: "shopSettings", cursorField: "id" },
	{ name: "EmailLog", delegate: "emailLog", cursorField: "id", audit: true },

	// Tickets
	{ name: "TicketEvent", delegate: "ticketEvent", cursorField: "id" },
	{ name: "Ticket", delegate: "ticket", cursorField: "id" },
	{ name: "TicketVerifier", delegate: "ticketVerifier", cursorField: "id" },

	// CMS
	{ name: "ContentPage", delegate: "contentPage", cursorField: "id" },
	{ name: "SiteContent", delegate: "siteContent", cursorField: "id" },

	// SSO 2026
	{ name: "SSO26Nomination", delegate: "sSO26Nomination", cursorField: "id" },
	{ name: "SSO26DdayVote", delegate: "sSO26DdayVote", cursorField: "id", audit: true },
];

const BUCKET_LIST = [BUCKETS.PRODUCTS, BUCKETS.RECEIPTS, BUCKETS.EVENTS, BUCKETS.CONTENT];

const PAGE_SIZE = 500;

export type BackupOptions = {
	includeAuditTables: boolean;
	includeFiles: boolean;
};

type TableManifestEntry = {
	name: string;
	file: string;
	count: number;
	sha256: string;
	skipped?: boolean;
	skipReason?: string;
};

type FilesManifest = {
	included: boolean;
	count: number;
	totalBytes: number;
	buckets: { name: string; count: number; bytes: number }[];
};

type Manifest = {
	version: number;
	exportedAt: string;
	source: { db: string; orm: string; prismaVersion: string };
	options: BackupOptions;
	notes: string[];
	tables: TableManifestEntry[];
	files: FilesManifest;
};

async function exportTableToArchive(
	archive: archiver.Archiver,
	desc: TableDescriptor,
): Promise<TableManifestEntry> {
	const filename = `data/${desc.name}.ndjson`;
	const passThrough = new PassThrough();
	const hash = crypto.createHash("sha256");
	let count = 0;

	archive.append(passThrough, { name: filename });

	const delegate = (prisma as any)[desc.delegate];
	if (!delegate?.findMany) {
		passThrough.end();
		return {
			name: desc.name,
			file: filename,
			count: 0,
			sha256: hash.digest("hex"),
			skipped: true,
			skipReason: `Prisma delegate "${desc.delegate}" not found`,
		};
	}

	let cursor: string | null = null;
	while (true) {
		const rows: any[] = await delegate.findMany({
			take: PAGE_SIZE,
			...(cursor ? { skip: 1, cursor: { [desc.cursorField]: cursor } } : {}),
			orderBy: { [desc.cursorField]: "asc" },
		});
		if (rows.length === 0) break;

		for (const row of rows) {
			const line = JSON.stringify(row) + "\n";
			hash.update(line);
			passThrough.write(line);
			count++;
		}

		if (rows.length < PAGE_SIZE) break;
		cursor = rows[rows.length - 1][desc.cursorField];
	}

	passThrough.end();
	return { name: desc.name, file: filename, count, sha256: hash.digest("hex") };
}

async function appendBucketObjects(
	archive: archiver.Archiver,
	bucketName: string,
): Promise<{ count: number; bytes: number }> {
	let count = 0;
	let bytes = 0;

	const exists = await minioClient.bucketExists(bucketName).catch(() => false);
	if (!exists) return { count, bytes };

	const objectNames: { name: string; size: number }[] = await new Promise(
		(resolve, reject) => {
			const acc: { name: string; size: number }[] = [];
			const stream = minioClient.listObjectsV2(bucketName, "", true);
			stream.on("data", (obj) => {
				if (obj.name) acc.push({ name: obj.name, size: obj.size ?? 0 });
			});
			stream.on("end", () => resolve(acc));
			stream.on("error", reject);
		},
	);

	for (const obj of objectNames) {
		try {
			const dataStream = await minioClient.getObject(bucketName, obj.name);
			archive.append(dataStream as Readable, {
				name: `files/${bucketName}/${obj.name}`,
			});
			count++;
			bytes += obj.size;
		} catch (err) {
			console.error(`Failed to fetch ${bucketName}/${obj.name}:`, err);
		}
	}

	return { count, bytes };
}

/**
 * Build a streaming zip backup. Returns a Web ReadableStream suitable for a
 * Next.js Response body. Population runs async — do not await it.
 */
export function createBackupStream(options: BackupOptions): {
	stream: ReadableStream<Uint8Array>;
	filename: string;
} {
	const archive = archiver("zip", { zlib: { level: 6 } });
	const filename = `arsa-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;

	archive.on("warning", (err) => {
		if (err.code !== "ENOENT") console.error("Archive warning:", err);
	});
	archive.on("error", (err) => {
		console.error("Archive error:", err);
	});

	(async () => {
		const tableEntries: TableManifestEntry[] = [];
		const filesManifest: FilesManifest = {
			included: options.includeFiles,
			count: 0,
			totalBytes: 0,
			buckets: [],
		};

		try {
			for (const desc of TABLES) {
				if (desc.audit && !options.includeAuditTables) {
					tableEntries.push({
						name: desc.name,
						file: `data/${desc.name}.ndjson`,
						count: 0,
						sha256: "",
						skipped: true,
						skipReason: "Audit table excluded by user option",
					});
					continue;
				}
				try {
					const entry = await exportTableToArchive(archive, desc);
					tableEntries.push(entry);
				} catch (err: any) {
					console.error(`Failed exporting ${desc.name}:`, err);
					tableEntries.push({
						name: desc.name,
						file: `data/${desc.name}.ndjson`,
						count: 0,
						sha256: "",
						skipped: true,
						skipReason: `Export error: ${err?.message ?? "unknown"}`,
					});
				}
			}

			if (options.includeFiles) {
				for (const bucketName of BUCKET_LIST) {
					try {
						const { count, bytes } = await appendBucketObjects(archive, bucketName);
						filesManifest.buckets.push({ name: bucketName, count, bytes });
						filesManifest.count += count;
						filesManifest.totalBytes += bytes;
					} catch (err) {
						console.error(`Failed bucket ${bucketName}:`, err);
						filesManifest.buckets.push({ name: bucketName, count: 0, bytes: 0 });
					}
				}
			}

			const manifest: Manifest = {
				version: 1,
				exportedAt: new Date().toISOString(),
				source: { db: "postgresql", orm: "prisma", prismaVersion: "6.15.0" },
				options,
				notes: [
					"Format: ZIP containing manifest.json + data/<Table>.ndjson per model.",
					"NDJSON: one JSON object per line. Line endings: '\\n'.",
					"All Date fields are ISO 8601 strings (default JSON.stringify behavior).",
					"Postgres String[] arrays are serialized as JSON arrays. Convert to TEXT (JSON-stringified) for SQLite/D1.",
					"Json columns retain nested JSON value. Convert to TEXT for SQLite/D1.",
					"Float columns are JS numbers. SQLite REAL is compatible.",
					"sha256 in manifest is over the raw NDJSON bytes (incl. trailing newlines).",
					"Tables array order = recommended import order (parents before children).",
					"Sessions/Accounts/Verification are included; rotate secrets if migrating providers.",
				],
				tables: tableEntries,
				files: filesManifest,
			};

			archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
			await archive.finalize();
		} catch (err) {
			console.error("Backup failure:", err);
			archive.destroy(err as Error);
		}
	})();

	const webStream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;
	return { stream: webStream, filename };
}

export function listBackupTables() {
	return TABLES.map((t) => ({
		name: t.name,
		audit: !!t.audit,
		sensitive: !!t.sensitive,
	}));
}
