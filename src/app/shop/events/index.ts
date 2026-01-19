// Event Component Registry
// Add new event components here by their slug

import { lazy, type ComponentType } from "react";
import type { EventComponentProps } from "./types";

// Lazy load event components to keep bundle size small
const eventComponents: Record<string, ComponentType<EventComponentProps>> = {
	// Example: "flower-fest-2026": lazy(() => import("./2026/flower-fest-2026")),
};

export function getEventComponent(slug: string): ComponentType<EventComponentProps> | null {
	return eventComponents[slug] || null;
}

// Re-export types
export * from "./types";
