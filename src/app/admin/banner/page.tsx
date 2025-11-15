import { prisma } from "@/lib/prisma";
import { BannerManagement } from "./banner-management";

export default async function BannerPage() {
	const banners = await prisma.banner.findMany({
		orderBy: { updatedAt: "desc" },
	});

	return <BannerManagement initialBanners={banners} />;
}
