/**
 * Delivery Scheduling Utilities for Event-Based Orders
 *
 * Handles cutoff times, delivery date calculation, and shop closure logic
 */

export type ShopEvent = {
	dailyCutoffTime?: string | null; // "14:00" format (24-hour time)
	deliveryLeadDays: number; // How many days ahead for delivery
	isShopClosed: boolean;
	closureMessage?: string | null;
	allowScheduledDelivery: boolean;
};

export type DeliverySchedule = {
	canOrder: boolean; // Whether orders can be placed
	reason?: string; // Reason if cannot order
	earliestDeliveryDate: Date; // Earliest possible delivery date
	suggestedDeliveryDate: Date; // Recommended delivery date based on cutoff
	isPastCutoff: boolean; // Whether current time is past cutoff
	cutoffTime?: string; // The cutoff time for reference
	availableTimeSlots: string[]; // Available delivery time slots
};

/**
 * Calculate delivery schedule for an event
 */
export function calculateDeliverySchedule(
	event: ShopEvent,
	currentTime: Date = new Date(),
): DeliverySchedule {
	// Check if shop is closed
	if (event.isShopClosed) {
		return {
			canOrder: false,
			reason: event.closureMessage || "This event shop is currently closed.",
			earliestDeliveryDate: new Date(),
			suggestedDeliveryDate: new Date(),
			isPastCutoff: false,
			availableTimeSlots: [],
		};
	}

	const now = new Date(currentTime);
	const isPastCutoff = checkIfPastCutoff(now, event.dailyCutoffTime);

	// Calculate delivery dates
	const baseDays = event.deliveryLeadDays;
	const additionalDays = isPastCutoff ? 1 : 0;
	const totalDays = baseDays + additionalDays;

	const earliestDeliveryDate = addDays(now, baseDays);
	const suggestedDeliveryDate = addDays(now, totalDays);

	return {
		canOrder: true,
		earliestDeliveryDate,
		suggestedDeliveryDate,
		isPastCutoff,
		cutoffTime: event.dailyCutoffTime || undefined,
		availableTimeSlots: getAvailableTimeSlots(),
	};
}

/**
 * Check if current time is past the daily cutoff time
 */
function checkIfPastCutoff(currentTime: Date, cutoffTime?: string | null): boolean {
	if (!cutoffTime) return false;

	const [cutoffHour, cutoffMinute] = cutoffTime.split(":").map(Number);

	const cutoffDate = new Date(currentTime);
	cutoffDate.setHours(cutoffHour, cutoffMinute, 0, 0);

	return currentTime >= cutoffDate;
}

/**
 * Add days to a date (skipping weekends if needed)
 */
function addDays(date: Date, days: number, skipWeekends: boolean = false): Date {
	const result = new Date(date);
	let daysAdded = 0;

	while (daysAdded < days) {
		result.setDate(result.getDate() + 1);

		if (skipWeekends) {
			const dayOfWeek = result.getDay();
			// Skip weekends (0 = Sunday, 6 = Saturday)
			if (dayOfWeek !== 0 && dayOfWeek !== 6) {
				daysAdded++;
			}
		} else {
			daysAdded++;
		}
	}

	return result;
}

/**
 * Get available delivery time slots
 */
function getAvailableTimeSlots(): string[] {
	return [
		"Morning (9 AM - 12 PM)",
		"Afternoon (12 PM - 3 PM)",
		"Late Afternoon (3 PM - 6 PM)",
		"Evening (6 PM - 9 PM)",
	];
}

/**
 * Format delivery date for display
 */
export function formatDeliveryDate(date: Date): string {
	const options: Intl.DateTimeFormatOptions = {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	};

	return date.toLocaleDateString("en-US", options);
}

/**
 * Get delivery message for customer
 */
export function getDeliveryMessage(schedule: DeliverySchedule): string {
	if (!schedule.canOrder) {
		return schedule.reason || "Orders are currently unavailable.";
	}

	const deliveryDateStr = formatDeliveryDate(schedule.suggestedDeliveryDate);

	if (schedule.isPastCutoff && schedule.cutoffTime) {
		const [hour, minute] = schedule.cutoffTime.split(":");
		const cutoffHour = parseInt(hour);
		const period = cutoffHour >= 12 ? "PM" : "AM";
		const displayHour = cutoffHour > 12 ? cutoffHour - 12 : cutoffHour;

		return `Orders placed after ${displayHour}:${minute} ${period} will be delivered on ${deliveryDateStr}.`;
	}

	return `Expected delivery: ${deliveryDateStr}`;
}

/**
 * Validate if a selected delivery date is valid for the event
 */
export function isValidDeliveryDate(
	selectedDate: Date,
	event: ShopEvent,
	currentTime: Date = new Date(),
): { valid: boolean; error?: string } {
	const schedule = calculateDeliverySchedule(event, currentTime);

	if (!schedule.canOrder) {
		return { valid: false, error: schedule.reason };
	}

	// Check if date is in the past
	const today = new Date(currentTime);
	today.setHours(0, 0, 0, 0);
	const selectedDateOnly = new Date(selectedDate);
	selectedDateOnly.setHours(0, 0, 0, 0);

	if (selectedDateOnly < today) {
		return { valid: false, error: "Delivery date cannot be in the past." };
	}

	// Check if date is before earliest delivery date
	const earliestDateOnly = new Date(schedule.earliestDeliveryDate);
	earliestDateOnly.setHours(0, 0, 0, 0);

	if (selectedDateOnly < earliestDateOnly) {
		const earliestStr = formatDeliveryDate(schedule.earliestDeliveryDate);
		return {
			valid: false,
			error: `Earliest delivery date is ${earliestStr}.`,
		};
	}

	return { valid: true };
}

/**
 * Generate date options for delivery date picker
 */
export function getDeliveryDateOptions(
	event: ShopEvent,
	daysAhead: number = 7,
	currentTime: Date = new Date(),
): Date[] {
	const schedule = calculateDeliverySchedule(event, currentTime);

	if (!schedule.canOrder) {
		return [];
	}

	const options: Date[] = [];
	const startDate = schedule.earliestDeliveryDate;

	for (let i = 0; i < daysAhead; i++) {
		const date = addDays(startDate, i);
		// Optionally skip weekends
		const dayOfWeek = date.getDay();
		if (dayOfWeek !== 0 && dayOfWeek !== 6) {
			// Skip Sundays and Saturdays
			options.push(date);
		}
	}

	return options;
}
