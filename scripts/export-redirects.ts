import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function exportRedirects() {
	try {
		console.log("Fetching all redirects from database...");
		const redirects = await prisma.redirects.findMany({
			orderBy: {
				redirectCode: "asc",
			},
		});

		console.log(`Found ${redirects.length} redirects`);

		// Create exports directory if it doesn't exist
		const exportDir = path.join(process.cwd(), "exports");
		if (!fs.existsSync(exportDir)) {
			fs.mkdirSync(exportDir, { recursive: true });
		}

		// Generate filename with timestamp
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = path.join(exportDir, `redirects-${timestamp}.json`);

		// Write to file with pretty formatting
		fs.writeFileSync(filename, JSON.stringify(redirects, null, 2), "utf-8");

		console.log(`✓ Successfully exported ${redirects.length} redirects to ${filename}`);
		console.log("\nSummary:");
		console.log(`- Total redirects: ${redirects.length}`);
		console.log(`- Total clicks: ${redirects.reduce((sum, r) => sum + r.clicks, 0)}`);
	} catch (error) {
		console.error("Error exporting redirects:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

exportRedirects();
