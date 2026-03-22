"use client";

import { getMajorEvent } from "@/components/major-events";

export function MajorEventSection({ slug }: { slug: string }) {
	const event = getMajorEvent(slug);
	if (!event) return null;

	const Component = event.component;
	return <Component />;
}
