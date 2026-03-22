import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export type MajorEventProps = {
	onScrollEnd?: () => void;
};

export type MajorEventConfig = {
	slug: string;
	label: string;
	component: ComponentType<MajorEventProps>;
};

export const majorEvents: MajorEventConfig[] = [
	{
		slug: "sso-2026",
		label: "Seniors' Send-Off 2026",
		component: dynamic(() =>
			import("./sso-2026").then((m) => m.SSO2026Landing),
		),
	},
];

export function getMajorEvent(slug: string): MajorEventConfig | undefined {
	return majorEvents.find((e) => e.slug === slug);
}
