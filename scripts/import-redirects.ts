import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function importRedirects() {
	try {
		// Get the JSON file path from command line argument
		const jsonFilePath = process.argv[2];

		if (!jsonFilePath) {
			console.error("Usage: npx tsx scripts/import-redirects.ts <path-to-json-file>");
			console.error(
				"Example: npx tsx scripts/import-redirects.ts exports/redirects-2024-01-01.json",
			);
			process.exit(1);
		}

		// Resolve the path
		const fullPath = path.isAbsolute(jsonFilePath)
			? jsonFilePath
			: path.join(process.cwd(), jsonFilePath);

		if (!fs.existsSync(fullPath)) {
			console.error(`File not found: ${fullPath}`);
			process.exit(1);
		}

		console.log(`Reading redirects from ${fullPath}...`);
		const fileContent = fs.readFileSync(fullPath, "utf-8");
		const redirects = JSON.parse(fileContent);

		if (!Array.isArray(redirects)) {
			console.error("Invalid JSON format: expected an array of redirects");
			process.exit(1);
		}

		console.log(`Found ${redirects.length} redirects to import`);
		console.log("\nChecking for existing redirects...");

		// Check for conflicts
		const existingCodes = new Set(
			(await prisma.redirects.findMany({ select: { redirectCode: true } })).map(
				(r) => r.redirectCode,
			),
		);

		const conflicts = redirects.filter((r) => existingCodes.has(r.redirectCode));
		if (conflicts.length > 0) {
			console.warn(`\n⚠️  Warning: ${conflicts.length} redirect codes already exist:`);
			conflicts.slice(0, 5).forEach((r) => console.warn(`  - ${r.redirectCode}`));
			if (conflicts.length > 5) {
				console.warn(`  ... and ${conflicts.length - 5} more`);
			}
			console.log("\nOptions:");
			console.log("1. Skip existing redirects (recommended)");
			console.log("2. Update existing redirects (overwrites URL and clicks)");
			console.log("3. Cancel import");
			console.log("\nTo skip existing: Add --skip-existing flag");
			console.log("To update existing: Add --update-existing flag");
			console.log("Example: npx tsx scripts/import-redirects.ts exports/file.json --skip-existing");
			process.exit(1);
		}

		const skipExisting = process.argv.includes("--skip-existing");
		const updateExisting = process.argv.includes("--update-existing");

		let imported = 0;
		let skipped = 0;
		let updated = 0;

		console.log("\nStarting import...");

		for (const redirect of redirects) {
			try {
				if (existingCodes.has(redirect.redirectCode)) {
					if (skipExisting) {
						skipped++;
						continue;
					} else if (updateExisting) {
						await prisma.redirects.update({
							where: { id: redirect.id },
							data: {
								newURL: redirect.newURL,
								redirectCode: redirect.redirectCode,
								clicks: redirect.clicks,
							},
						});
						updated++;
						continue;
					}
				}

				await prisma.redirects.create({
					data: {
						id: redirect.id,
						newURL: redirect.newURL,
						redirectCode: redirect.redirectCode,
						clicks: redirect.clicks,
					},
				});
				imported++;

				if ((imported + updated) % 10 === 0) {
					console.log(`  Processed ${imported + updated + skipped} redirects...`);
				}
			} catch (error: any) {
				console.error(`Error importing redirect "${redirect.redirectCode}":`, error.message);
			}
		}

		console.log("\n✓ Import completed!");
		console.log(`- Imported: ${imported} new redirects`);
		if (updated > 0) console.log(`- Updated: ${updated} existing redirects`);
		if (skipped > 0) console.log(`- Skipped: ${skipped} existing redirects`);
	} catch (error) {
		console.error("Error importing redirects:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

importRedirects();
