/**
 * Flower Fest 2026 - Order Types
 *
 * This file defines the exact structure for Flower Fest orders.
 * NOT generic - specifically designed for this event's requirements.
 */

// ================================
// FULFILLMENT OPTIONS
// ================================

export type FulfillmentType = "pickup" | "delivery";

// Pickup: Customer picks up at designated location
export type PickupInfo = {
	type: "pickup";
	// No additional fields needed - we show instructions
};

// Delivery: Customer provides 3 possible delivery options for runner
export type DeliveryOption = {
	location: string; // e.g., "Room 301, Main Building" or "Lobby"
	timeSlot: string; // e.g., "9:00 AM - 11:00 AM"
	notes?: string; // Optional notes for this specific option
};

export type DeliveryInfo = {
	type: "delivery";
	options: [DeliveryOption, DeliveryOption, DeliveryOption]; // Exactly 3 options required
	preferredOption: 1 | 2 | 3; // Which option is preferred (1, 2, or 3)
};

export type FulfillmentInfo = PickupInfo | DeliveryInfo;

// ================================
// CUSTOMER INFORMATION
// ================================

export type SenderInfo = {
	name: string;
	contactNumber: string; // Philippine mobile format: 09XX XXX XXXX
	email: string; // From auth, but stored for reference
};

export type RecipientInfo = {
	name: string;
	// Contact number optional for recipient (sender might not know)
	contactNumber?: string;
};

// ================================
// MESSAGE CARD
// ================================

export const MESSAGE_MAX_LENGTH = 200; // Adjust as needed

export type MessageCard = {
	message: string; // Max MESSAGE_MAX_LENGTH characters
	isAnonymous: boolean; // Hide sender name on card
	includeSenderName: boolean; // Show sender name (if not anonymous)
};

// ================================
// PAYMENT
// ================================

export type PaymentInfo = {
	receiptUrl: string;
	gcashReferenceNumber: string; // 13 digits
	amount: number; // For verification
};

// ================================
// COMPLETE ORDER DATA
// ================================

export type FlowerFestOrderData = {
	// Who's ordering
	sender: SenderInfo;

	// Who's receiving
	recipient: RecipientInfo;

	// How they get it
	fulfillment: FulfillmentInfo;

	// Card message
	messageCard: MessageCard;

	// Payment
	payment: PaymentInfo;

	// Any additional notes
	specialInstructions?: string;
};

// ================================
// VALIDATION
// ================================

export function validatePhoneNumber(phone: string): boolean {
	// Philippine mobile: 09XX XXX XXXX (11 digits starting with 09)
	const cleaned = phone.replace(/\D/g, "");
	return cleaned.length === 11 && cleaned.startsWith("09");
}

export function validateGCashReference(ref: string): boolean {
	const cleaned = ref.replace(/\D/g, "");
	return cleaned.length === 13;
}

export function validateMessage(message: string): boolean {
	return message.length <= MESSAGE_MAX_LENGTH;
}

export function validateDeliveryOptions(options: DeliveryOption[]): {
	valid: boolean;
	error?: string;
} {
	if (options.length !== 3) {
		return { valid: false, error: "Please provide exactly 3 delivery options" };
	}

	for (let i = 0; i < 3; i++) {
		if (!options[i].location.trim()) {
			return { valid: false, error: `Please enter a location for Option ${i + 1}` };
		}
		if (!options[i].timeSlot.trim()) {
			return { valid: false, error: `Please select a time slot for Option ${i + 1}` };
		}
	}

	return { valid: true };
}

export function validateFlowerFestOrder(data: Partial<FlowerFestOrderData>): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Sender validation
	if (!data.sender?.name?.trim()) {
		errors.push("Please enter your name");
	}
	if (!data.sender?.contactNumber || !validatePhoneNumber(data.sender.contactNumber)) {
		errors.push("Please enter a valid Philippine mobile number (09XX XXX XXXX)");
	}

	// Recipient validation
	if (!data.recipient?.name?.trim()) {
		errors.push("Please enter recipient name");
	}

	// Fulfillment validation
	if (!data.fulfillment) {
		errors.push("Please select pickup or delivery");
	} else if (data.fulfillment.type === "delivery") {
		const deliveryValidation = validateDeliveryOptions(data.fulfillment.options);
		if (!deliveryValidation.valid) {
			errors.push(deliveryValidation.error!);
		}
	}

	// Message validation
	if (data.messageCard?.message && !validateMessage(data.messageCard.message)) {
		errors.push(`Message must be ${MESSAGE_MAX_LENGTH} characters or less`);
	}

	// Payment validation
	if (!data.payment?.receiptUrl) {
		errors.push("Please upload your GCash receipt");
	}
	if (
		!data.payment?.gcashReferenceNumber ||
		!validateGCashReference(data.payment.gcashReferenceNumber)
	) {
		errors.push("Please enter a valid 13-digit GCash reference number");
	}

	return { valid: errors.length === 0, errors };
}

// ================================
// TIME SLOTS
// ================================

export const DELIVERY_TIME_SLOTS = [
	"8:00 AM - 10:00 AM",
	"10:00 AM - 12:00 PM",
	"12:00 PM - 2:00 PM",
	"2:00 PM - 4:00 PM",
	"4:00 PM - 6:00 PM",
	"6:00 PM - 8:00 PM",
] as const;

// ================================
// PICKUP INFO (Static)
// ================================

export const PICKUP_LOCATION = "ARSA Office, Ground Floor, Main Building";
export const PICKUP_DATE = "February 14, 2026"; // Adjust as needed
export const PICKUP_HOURS = "9:00 AM - 6:00 PM";

// ================================
// CUTOFF CONFIGURATION
// ================================

export const CUTOFF_TIME = "16:00"; // 4 PM
export const DELIVERY_LEAD_DAYS = 1; // Orders must be placed 1 day before
