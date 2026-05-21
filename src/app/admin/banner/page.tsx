import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { banner } from "@/db/schema";
import { BannerManagement } from "./banner-management";

export default async function BannerPage() {
	const banners = await db.query.banner.findMany({
		orderBy: [desc(banner.updatedAt)],
	});

	return <BannerManagement initialBanners={banners} />;
}
