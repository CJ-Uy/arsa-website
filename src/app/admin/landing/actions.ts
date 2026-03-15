"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type HeroContent = {
	title: string;
	subtitle: string;
	backgroundImage: string;
	ctaButtons: { label: string; href: string; variant: "primary" | "secondary" }[];
};

export type EventItem = {
	id: string;
	title: string;
	date: string;
	endDate?: string;
	time: string;
	location: string;
	description: string;
	category: string;
	featured: boolean;
	googleFormUrl: string;
	images: string[];
	imageCropPositions?: Record<string, { x: number; y: number }>;
};

export type FAQItem = {
	id: string;
	question: string;
	answer: string;
};

export type QuickAction = {
	id: string;
	title: string;
	description: string;
	href: string;
	buttonLabel: string;
	iconKey: string;
};

export type StatItem = {
	id: string;
	label: string;
	value: string;
	iconKey: string;
};

export type SocialLink = {
	id: string;
	platform: string;
	handle: string;
	url: string;
	logoUrl: string;
};

// Default data for each section
const defaultHero: HeroContent = {
	title: "In ARSA, It's good to be home.",
	subtitle:
		"Welcome to your dorm community where every day brings new opportunities to connect, learn, and grow together.",
	backgroundImage: "",
	ctaButtons: [{ label: "Learn More", href: "/about", variant: "primary" }],
};

const defaultEvents: EventItem[] = [];
const defaultFAQ: FAQItem[] = [];
const defaultQuickActions: QuickAction[] = [
	{
		id: "1",
		title: "Book Venue",
		description: "Reserve spaces for your events and activities",
		href: "/resources",
		buttonLabel: "Book Now",
		iconKey: "calendar",
	},
	{
		id: "2",
		title: "Report Issue",
		description: "Let us know about maintenance or other concerns",
		href: "/contact",
		buttonLabel: "Report",
		iconKey: "book",
	},
	{
		id: "3",
		title: "Read Bridges",
		description: "Check out our latest publication",
		href: "/publications",
		buttonLabel: "Read Now",
		iconKey: "file",
	},
	{
		id: "4",
		title: "Get Help",
		description: "Contact us for immediate assistance",
		href: "/contact",
		buttonLabel: "Contact",
		iconKey: "phone",
	},
];

const defaultStats: StatItem[] = [
	{ id: "1", label: "Active Residents", value: "120", iconKey: "users" },
	{ id: "2", label: "Events This Week", value: "8", iconKey: "calendar" },
	{ id: "3", label: "Events This Month", value: "15", iconKey: "award" },
	{ id: "4", label: "Satisfaction Rate", value: "94%", iconKey: "star" },
];

const defaultSocials: SocialLink[] = [
	{
		id: "1",
		platform: "Instagram",
		handle: "@arsaateneo",
		url: "https://instagram.com/arsaateneo",
		logoUrl: "",
	},
	{
		id: "2",
		platform: "TikTok",
		handle: "@arsaateneo",
		url: "https://tiktok.com/@arsaateneo",
		logoUrl: "",
	},
	{
		id: "3",
		platform: "Facebook",
		handle: "@arsaateneo",
		url: "https://facebook.com/arsaateneo",
		logoUrl: "",
	},
];

export async function getSiteContent(key: string) {
	try {
		const content = await prisma.siteContent.findUnique({ where: { key } });
		return content?.data ?? null;
	} catch {
		return null;
	}
}

export async function getAllHomepageContent() {
	try {
		const contents = await prisma.siteContent.findMany({
			where: {
				key: {
					startsWith: "homepage-",
				},
			},
		});

		const map: Record<string, unknown> = {};
		for (const c of contents) {
			map[c.key] = c.data;
		}

		return {
			hero: (map["homepage-hero"] as HeroContent) ?? defaultHero,
			events: (map["homepage-events"] as EventItem[]) ?? defaultEvents,
			faq: (map["homepage-faq"] as FAQItem[]) ?? defaultFAQ,
			quickActions: (map["homepage-quick-actions"] as QuickAction[]) ?? defaultQuickActions,
			stats: (map["homepage-stats"] as StatItem[]) ?? defaultStats,
			socials: (map["homepage-socials"] as SocialLink[]) ?? defaultSocials,
		};
	} catch {
		return {
			hero: defaultHero,
			events: defaultEvents,
			faq: defaultFAQ,
			quickActions: defaultQuickActions,
			stats: defaultStats,
			socials: defaultSocials,
		};
	}
}

export async function saveSiteContent(key: string, data: unknown) {
	try {
		await prisma.siteContent.upsert({
			where: { key },
			create: { key, data: data as object },
			update: { data: data as object },
		});

		revalidatePath("/");
		revalidatePath("/faq");
		revalidatePath("/about");
		revalidatePath("/contact");
		revalidatePath("/publications");
		revalidatePath("/admin/landing");
		revalidatePath("/admin/content");

		return { success: true };
	} catch (error) {
		console.error(`Error saving site content "${key}":`, error);
		return { success: false, message: "Failed to save content" };
	}
}
