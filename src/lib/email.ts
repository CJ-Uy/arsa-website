"use server";

import nodemailer from "nodemailer";
import { prisma } from "./prisma";

export type EmailSettings = {
	enabled: boolean;
	fromAddress: string;
	fromName: string;
	replyTo?: string;
};

type OrderItem = {
	name: string;
	size: string | null;
	quantity: number;
	price: number;
	purchaseCode: string | null;
};

type RepeaterRowData = Record<string, string>;

type EventData = {
	eventName?: string;
	fields?: Record<string, string | boolean | RepeaterRowData[]>;
	paymentMethod?: string; // The selected payment option title
};

type OrderEmailData = {
	orderId: string;
	customerName: string;
	customerEmail: string;
	items: OrderItem[];
	totalAmount: number;
	eventName?: string;
	orderDate: Date;
	eventData?: EventData; // Checkout field responses including claiming method, delivery details, payment
};

// Get email settings from database
export async function getEmailSettings(): Promise<EmailSettings | null> {
	try {
		const settings = await prisma.shopSettings.findUnique({
			where: { key: "emailSettings" },
		});

		if (!settings?.value) {
			return null;
		}

		return settings.value as EmailSettings;
	} catch (error) {
		console.error("Failed to get email settings:", error);
		return null;
	}
}

// Save email settings to database
export async function saveEmailSettings(
	settings: EmailSettings,
	userId?: string,
): Promise<{ success: boolean; message?: string }> {
	try {
		await prisma.shopSettings.upsert({
			where: { key: "emailSettings" },
			update: {
				value: settings as any,
				updatedBy: userId,
			},
			create: {
				key: "emailSettings",
				value: settings as any,
				updatedBy: userId,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to save email settings:", error);
		return { success: false, message: "Failed to save email settings" };
	}
}

// Create nodemailer transporter
function createTransporter() {
	const host = process.env.SMTP_HOST || "smtp.gmail.com";
	const port = parseInt(process.env.SMTP_PORT || "587");
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASSWORD;

	if (!user || !pass) {
		console.error("SMTP credentials not configured");
		return null;
	}

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465, // true for 465, false for other ports
		auth: {
			user,
			pass,
		},
	});
}

// Generate order confirmation email HTML with burgundy FlowerFest theme
function generateOrderConfirmationHtml(data: OrderEmailData): string {
	// FlowerFest Color Palette - matching the actual theme
	const colors = {
		darkRed: "#7A1520", // Brighter burgundy for main backgrounds (flower fest palette)
		burgundy: "#AA1A1A", // Burgundy red (flower fest accent)
		red: "#AA1A1A", // Accent red
		lightRed: "#c42020",
		cream: "#F2ECE0",
		pastelOrange: "#D9C3A9",
		pastelRed: "#D3B3AD",
		gold: "#D6A134",
	};

	const itemsHtml = data.items
		.map(
			(item) => `
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid ${colors.pastelRed};">
          <div style="font-weight: 600; color: ${colors.burgundy};">${item.name}</div>
          ${item.size ? `<div style="font-size: 13px; color: #6b5c52; margin-top: 2px;">Size: ${item.size}</div>` : ""}
          ${
						item.purchaseCode
							? `<div style="margin-top: 6px;">
              <span style="font-size: 11px; color: #6b5c52;">Purchase Code${item.purchaseCode.includes(",") ? "s" : ""}: </span>
              ${item.purchaseCode
								.split(",")
								.map(
									(code) =>
										`<code style="background: ${colors.darkRed}; color: ${colors.cream}; padding: 3px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; font-weight: 600; display: inline-block; margin: 2px 2px 2px 0;">${code.trim()}</code>`,
								)
								.join("")}
            </div>`
							: ""
					}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid ${colors.pastelRed}; text-align: center; color: ${colors.burgundy};">${item.quantity}</td>
        <td style="padding: 14px 12px; border-bottom: 1px solid ${colors.pastelRed}; text-align: right; color: ${colors.burgundy}; font-weight: 500;">&#8369;${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `,
		)
		.join("");

	const formattedDate = data.orderDate.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "Asia/Manila",
	});

	// Extract claiming method and delivery/pickup details from eventData
	const fields = data.eventData?.fields || {};
	const claimingMethod = fields["Claiming Method"] as string | undefined;
	const paymentMethod = data.eventData?.paymentMethod;

	// Build claiming/delivery details section
	let claimingDetailsHtml = "";

	if (claimingMethod || paymentMethod) {
		let detailsContent = "";

		// Add claiming method
		if (claimingMethod) {
			detailsContent += `
        <tr>
          <td style="padding: 8px 0; color: #6b5c52; font-size: 14px; vertical-align: top;">Claiming Method:</td>
          <td style="padding: 8px 0; text-align: right; color: ${colors.burgundy}; font-size: 14px; font-weight: 600;">${claimingMethod}</td>
        </tr>`;

			// If Pick Up, show pickup date in a table and add a note
			if (
				claimingMethod.toLowerCase().includes("pick up") ||
				claimingMethod.toLowerCase().includes("pickup")
			) {
				const pickupDate = fields["Date of Pick Up"] as string | undefined;
				if (pickupDate) {
					detailsContent += `
        <tr>
          <td colspan="2" style="padding: 12px 0 4px 0;">
            <div style="font-size: 13px; color: #6b5c52; margin-bottom: 8px;">Pick Up Details:</div>
            <table style="width: 100%; border-collapse: collapse; background: ${colors.cream}; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: ${colors.pastelRed};">
                  <th style="padding: 8px 10px; text-align: left; font-size: 12px; color: ${colors.burgundy};">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px 10px; font-size: 13px; color: ${colors.burgundy};">${pickupDate}</td>
                </tr>
              </tbody>
            </table>
						<p style="font-size: 12px; color: #6b5c52; margin-top: 8px;">You can claim your order at Gonz Slot 2 on the specified pickup date.</p>
          </td>
        </tr>`;
				}
			}

			// If Delivery, show delivery details table
			if (claimingMethod.toLowerCase().includes("delivery")) {
				const deliveryDetails = fields["Delivery Details"] as RepeaterRowData[] | undefined;
				if (deliveryDetails && Array.isArray(deliveryDetails) && deliveryDetails.length > 0) {
					detailsContent += `
        <tr>
          <td colspan="2" style="padding: 12px 0 4px 0;">
            <div style="font-size: 13px; color: #6b5c52; margin-bottom: 8px;">Delivery Details:</div>
            <table style="width: 100%; border-collapse: collapse; background: ${colors.cream}; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: ${colors.pastelRed};">
                  <th style="padding: 8px 10px; text-align: left; font-size: 12px; color: ${colors.burgundy};">Date</th>
                  <th style="padding: 8px 10px; text-align: left; font-size: 12px; color: ${colors.burgundy};">Time</th>
                  <th style="padding: 8px 10px; text-align: left; font-size: 12px; color: ${colors.burgundy};">Location</th>
                </tr>
              </thead>
              <tbody>
                ${deliveryDetails
									.map(
										(row) => `
                <tr>
                  <td style="padding: 8px 10px; font-size: 13px; color: ${colors.burgundy}; border-bottom: 1px solid ${colors.pastelRed};">${Object.values(row)[0] || "N/A"}</td>
                  <td style="padding: 8px 10px; font-size: 13px; color: ${colors.burgundy}; border-bottom: 1px solid ${colors.pastelRed};">${Object.values(row)[1] || "N/A"}</td>
                  <td style="padding: 8px 10px; font-size: 13px; color: ${colors.burgundy}; border-bottom: 1px solid ${colors.pastelRed};">${Object.values(row)[2] || "N/A"}</td>
                </tr>`,
									)
									.join("")}
              </tbody>
            </table>
          </td>
        </tr>`;
				}
			}
		}

		// Add payment method
		if (paymentMethod) {
			detailsContent += `
        <tr>
          <td style="padding: 8px 0; color: #6b5c52; font-size: 14px; vertical-align: top;">Payment Method:</td>
          <td style="padding: 8px 0; text-align: right; color: ${colors.burgundy}; font-size: 14px; font-weight: 600;">${paymentMethod}</td>
        </tr>`;
		}

		if (detailsContent) {
			claimingDetailsHtml = `
    <!-- Claiming & Payment Details -->
    <div style="background: white; border: 1px solid ${colors.pastelRed}; border-radius: 12px; padding: 20px; margin-bottom: 28px; box-shadow: 0 2px 8px rgba(64, 12, 18, 0.08);">
      <h2 style="margin: 0 0 16px 0; font-size: 16px; color: ${colors.burgundy}; border-bottom: 2px solid ${colors.red}; padding-bottom: 8px;">Claiming & Payment</h2>
      <table style="width: 100%;">
        ${detailsContent}
      </table>
    </div>`;
		}
	}

	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${colors.burgundy}; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">

  <!-- Header Banner -->
  <div style="background: linear-gradient(135deg, ${colors.darkRed} 0%, ${colors.burgundy} 50%, ${colors.darkRed} 100%); padding: 32px 20px; text-align: center;">
    <h1 style="color: ${colors.cream}; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">Order Confirmed!</h1>
    ${data.eventName ? `<p style="color: ${colors.pastelOrange}; margin: 8px 0 0 0; font-size: 16px;">${data.eventName}</p>` : ""}
  </div>

  <!-- Main Content -->
  <div style="background: ${colors.cream}; padding: 32px 24px;">

    <!-- Thank You Message -->
    <div style="background: linear-gradient(135deg, rgba(170, 26, 26, 0.08) 0%, rgba(64, 12, 18, 0.05) 100%); border: 1px solid ${colors.pastelRed}; border-radius: 12px; padding: 20px; margin-bottom: 28px; text-align: center;">
      <!-- Checkmark using table for email compatibility -->
      <table style="margin: 0 auto 12px auto;">
        <tr>
          <td style="width: 48px; height: 48px; background: ${colors.red}; border-radius: 50%; text-align: center; vertical-align: middle;">
            <span style="color: ${colors.cream}; font-size: 24px; line-height: 48px;">✓</span>
          </td>
        </tr>
      </table>
      <p style="margin: 0; color: ${colors.burgundy}; font-weight: 600; font-size: 18px;">Thank you for your order, ${data.customerName}!</p>
      <p style="margin: 8px 0 0 0; color: #5a3a3a; font-size: 14px;">We've received your order and will process it shortly.</p>
    </div>

    <!-- Order Details Card -->
    <div style="background: white; border: 1px solid ${colors.pastelRed}; border-radius: 12px; padding: 20px; margin-bottom: 28px; box-shadow: 0 2px 8px rgba(64, 12, 18, 0.08);">
      <h2 style="margin: 0 0 16px 0; font-size: 16px; color: ${colors.burgundy}; border-bottom: 2px solid ${colors.red}; padding-bottom: 8px;">Order Details</h2>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 6px 0; color: #6b5c52; font-size: 14px;">Order ID:</td>
          <td style="padding: 6px 0; text-align: right;">
            <code style="background: ${colors.darkRed}; color: ${colors.cream}; padding: 4px 10px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; font-weight: 600;">${data.orderId}</code>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b5c52; font-size: 14px;">Order Date:</td>
          <td style="padding: 6px 0; text-align: right; color: ${colors.burgundy}; font-size: 14px;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    ${claimingDetailsHtml}

    <!-- Items Table -->
    <div style="background: white; border: 1px solid ${colors.pastelRed}; border-radius: 12px; overflow: hidden; margin-bottom: 28px; box-shadow: 0 2px 8px rgba(64, 12, 18, 0.08);">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: linear-gradient(135deg, ${colors.darkRed} 0%, ${colors.burgundy} 100%);">
            <th style="padding: 14px 12px; text-align: left; font-weight: 600; color: ${colors.cream}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
            <th style="padding: 14px 12px; text-align: center; font-weight: 600; color: ${colors.cream}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
            <th style="padding: 14px 12px; text-align: right; font-weight: 600; color: ${colors.cream}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background: rgba(170, 26, 26, 0.05);">
            <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 16px; color: ${colors.burgundy};">Total:</td>
            <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 18px; color: ${colors.red};">&#8369;${data.totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Important Notice -->
    <div style="background: linear-gradient(135deg, rgba(214, 161, 52, 0.15) 0%, rgba(214, 161, 52, 0.08) 100%); border: 1px solid ${colors.gold}; border-left: 4px solid ${colors.gold}; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
      <p style="margin: 0; color: ${colors.burgundy}; font-size: 13px; line-height: 1.6;">
        <strong style="color: #8B6914;">📌 Important:</strong> Items with separate delivery details should be ordered individually and separately in their own transactions.
      </p>
    </div>

    <!-- Help Section -->
    <div style="background: white; border: 1px solid ${colors.pastelRed}; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(64, 12, 18, 0.08);">
      <h3 style="margin: 0 0 12px 0; font-size: 15px; color: ${colors.burgundy};">Need Help?</h3>
      <p style="margin: 0; color: #5a3a3a; font-size: 14px; line-height: 1.8;">
        Contact the <a href="https://www.facebook.com/ARSAFlowerFest" style="color: ${colors.red}; font-weight: 600; text-decoration: none;">FlowerFest Help Desk</a><br>
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background: linear-gradient(135deg, ${colors.darkRed} 0%, ${colors.burgundy} 100%); padding: 20px; text-align: center;">
    <p style="margin: 0; color: ${colors.pastelOrange}; font-size: 12px;">This is an automated email.</p>
    <p style="margin: 8px 0 0 0; color: ${colors.pastelRed}; font-size: 11px;">© ARSA - Ateneo Resident Students Association</p>
  </div>

</body>
</html>
  `;
}

// Generate plain text version
function generateOrderConfirmationText(data: OrderEmailData): string {
	const itemsList = data.items
		.map((item) => {
			let line = `• ${item.name}`;
			if (item.size) line += ` (Size: ${item.size})`;
			line += ` x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}`;
			if (item.purchaseCode) {
				const codes = item.purchaseCode.split(",").map((c) => c.trim());
				line += `\n  Purchase Code${codes.length > 1 ? "s" : ""}: ${codes.join("\n  ")}`;
			}
			return line;
		})
		.join("\n");

	const formattedDate = data.orderDate.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "Asia/Manila",
	});

	// Extract claiming method and delivery/pickup details from eventData
	const fields = data.eventData?.fields || {};
	const claimingMethod = fields["Claiming Method"] as string | undefined;
	const paymentMethod = data.eventData?.paymentMethod;

	// Build claiming/delivery details section
	let claimingDetailsText = "";
	if (claimingMethod || paymentMethod) {
		claimingDetailsText = `
───────────────────────────────────────
CLAIMING & PAYMENT
───────────────────────────────────────`;

		if (claimingMethod) {
			claimingDetailsText += `
Claiming Method: ${claimingMethod}`;

			// If Pick Up, show pickup date and add a note
			if (
				claimingMethod.toLowerCase().includes("pick up") ||
				claimingMethod.toLowerCase().includes("pickup")
			) {
				const pickupDate = fields["Date of Pick Up"] as string | undefined;
				if (pickupDate) {
					claimingDetailsText += `

Pick Up Details:
  Date: ${pickupDate}
  (You can claim your order at Gonz Slot 2 on the specified pickup date.)`;
				}
			}

			// If Delivery, show delivery details
			if (claimingMethod.toLowerCase().includes("delivery")) {
				const deliveryDetails = fields["Delivery Details"] as RepeaterRowData[] | undefined;
				if (deliveryDetails && Array.isArray(deliveryDetails) && deliveryDetails.length > 0) {
					claimingDetailsText += `

Delivery Details:`;
					deliveryDetails.forEach((row, index) => {
						const values = Object.values(row);
						claimingDetailsText += `
  ${index + 1}. Date: ${values[0] || "N/A"} | Time: ${values[1] || "N/A"} | Location: ${values[2] || "N/A"}`;
					});
				}
			}
		}

		if (paymentMethod) {
			claimingDetailsText += `
Payment Method: ${paymentMethod}`;
		}
	}

	return `
═══════════════════════════════════════
       ORDER CONFIRMED!
${data.eventName ? `       ${data.eventName}\n` : ""}═══════════════════════════════════════

Thank you for your order, ${data.customerName}!
We've received your order and will process it shortly.

───────────────────────────────────────
ORDER DETAILS
───────────────────────────────────────
Order ID: ${data.orderId}
Order Date: ${formattedDate}
${claimingDetailsText}

───────────────────────────────────────
YOUR ITEMS
───────────────────────────────────────
${itemsList}

───────────────────────────────────────
TOTAL: ₱${data.totalAmount.toFixed(2)}
───────────────────────────────────────

📌 IMPORTANT:
Items with separate delivery details should be ordered
individually and separately in their own transactions.

───────────────────────────────────────
NEED HELP?
───────────────────────────────────────
Contact the FlowerFest Help Desk:
https://www.facebook.com/ARSAFlowerFest

═══════════════════════════════════════
This is an automated email.
© ARSA - Ateneo Resident Students Association
  `.trim();
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
	data: OrderEmailData,
): Promise<{ success: boolean; message?: string }> {
	try {
		// Get email settings
		const settings = await getEmailSettings();

		if (!settings?.enabled) {
			console.log("Email notifications are disabled");
			return { success: true, message: "Email notifications disabled" };
		}

		// Create transporter
		const transporter = createTransporter();
		if (!transporter) {
			console.error("Failed to create email transporter - SMTP not configured");
			return { success: false, message: "SMTP not configured" };
		}

		// Generate email content
		const html = generateOrderConfirmationHtml(data);
		const text = generateOrderConfirmationText(data);

		// Send email
		const mailOptions = {
			from: `"${settings.fromName}" <${settings.fromAddress}>`,
			to: data.customerEmail,
			replyTo: settings.replyTo || settings.fromAddress,
			subject: `Order Confirmation - ${data.orderId.slice(0, 8)}${data.eventName ? ` (${data.eventName})` : ""}`,
			text,
			html,
		};

		await transporter.sendMail(mailOptions);

		console.log(`Order confirmation email sent to ${data.customerEmail}`);
		return { success: true };
	} catch (error) {
		console.error("Failed to send order confirmation email:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to send email",
		};
	}
}

// Test email configuration
export async function sendTestEmail(
	toEmail: string,
): Promise<{ success: boolean; message?: string }> {
	try {
		const settings = await getEmailSettings();

		if (!settings) {
			return { success: false, message: "Email settings not configured" };
		}

		const transporter = createTransporter();
		if (!transporter) {
			return { success: false, message: "SMTP credentials not configured in environment" };
		}

		await transporter.sendMail({
			from: `"${settings.fromName}" <${settings.fromAddress}>`,
			to: toEmail,
			replyTo: settings.replyTo || settings.fromAddress,
			subject: "Test Email - ARSA Shop",
			text: "This is a test email from ARSA Shop. If you received this, your email configuration is working correctly!",
			html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">Email Configuration Test</h2>
          <p>This is a test email from ARSA Shop.</p>
          <p style="color: #16a34a; font-weight: bold;">If you received this, your email configuration is working correctly!</p>
        </div>
      `,
		});

		return { success: true, message: "Test email sent successfully" };
	} catch (error) {
		console.error("Failed to send test email:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to send test email",
		};
	}
}

// Send a custom email
export async function sendCustomEmail(
	to: string,
	subject: string,
	body: string,
): Promise<{ success: boolean; message?: string }> {
	try {
		const settings = await getEmailSettings();

		if (!settings) {
			return { success: false, message: "Email settings not configured" };
		}

		const transporter = createTransporter();
		if (!transporter) {
			return { success: false, message: "SMTP credentials not configured in environment" };
		}

		// Convert plain text body to simple HTML (preserve line breaks)
		const htmlBody = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
				${body
					.split("\n")
					.map((line) => (line.trim() ? `<p style="margin: 0 0 16px 0;">${line}</p>` : "<br>"))
					.join("")}
				<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
				<p style="color: #6b7280; font-size: 14px; margin: 0;">Sent from ${settings.fromName}</p>
			</div>
		`;

		await transporter.sendMail({
			from: `"${settings.fromName}" <${settings.fromAddress}>`,
			to,
			replyTo: settings.replyTo || settings.fromAddress,
			subject,
			text: body,
			html: htmlBody,
		});

		return { success: true, message: "Email sent successfully" };
	} catch (error) {
		console.error("Failed to send custom email:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to send email",
		};
	}
}
