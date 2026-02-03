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

type OrderEmailData = {
	orderId: string;
	customerName: string;
	customerEmail: string;
	items: OrderItem[];
	totalAmount: number;
	eventName?: string;
	orderDate: Date;
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

// Generate order confirmation email HTML
function generateOrderConfirmationHtml(data: OrderEmailData): string {
	const itemsHtml = data.items
		.map(
			(item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500;">${item.name}</div>
          ${item.size ? `<div style="font-size: 14px; color: #6b7280;">Size: ${item.size}</div>` : ""}
          ${
						item.purchaseCode
							? `<div style="font-size: 12px; margin-top: 4px;">
              <span style="color: #6b7280;">Code: </span>
              <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${item.purchaseCode}</code>
            </div>`
							: ""
					}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">&#8369;${(item.price * item.quantity).toFixed(2)}</td>
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
	});

	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Order Confirmation</h1>
    ${data.eventName ? `<p style="color: #6b7280; margin: 8px 0 0 0;">${data.eventName}</p>` : ""}
  </div>

  <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
    <div style="color: #16a34a; font-size: 20px; margin-bottom: 4px;">&#10003;</div>
    <p style="margin: 0; color: #166534; font-weight: 500;">Thank you for your order, ${data.customerName}!</p>
    <p style="margin: 4px 0 0 0; color: #166534; font-size: 14px;">We've received your order and will process it shortly.</p>
  </div>

  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #374151;">Order Details</h2>
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="color: #6b7280;">Order ID:</span>
      <span style="font-family: monospace; font-size: 14px;">${data.orderId}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #6b7280;">Order Date:</span>
      <span>${formattedDate}</span>
    </div>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead>
      <tr style="background: #f3f4f6;">
        <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Item</th>
        <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Qty</th>
        <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: 600; font-size: 18px;">Total:</td>
        <td style="padding: 16px 12px; text-align: right; font-weight: 600; font-size: 18px;">&#8369;${data.totalAmount.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1e40af;">What happens next?</h3>
    <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
      <li>Our team will verify your payment</li>
      <li>You'll receive updates if there are any issues</li>
      <li>Your order will be processed and prepared</li>
    </ul>
  </div>

  <div style="text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
    <p style="margin: 0;">If you have any questions, please contact us.</p>
    <p style="margin: 8px 0 0 0; font-size: 12px;">This is an automated email. Please do not reply directly.</p>
  </div>

</body>
</html>
  `;
}

// Generate plain text version
function generateOrderConfirmationText(data: OrderEmailData): string {
	const itemsList = data.items
		.map((item) => {
			let line = `- ${item.name}`;
			if (item.size) line += ` (Size: ${item.size})`;
			line += ` x${item.quantity} - ₱${(item.price * item.quantity).toFixed(2)}`;
			if (item.purchaseCode) line += `\n  Code: ${item.purchaseCode}`;
			return line;
		})
		.join("\n");

	const formattedDate = data.orderDate.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	return `
ORDER CONFIRMATION
${data.eventName ? `\n${data.eventName}\n` : ""}
Thank you for your order, ${data.customerName}!
We've received your order and will process it shortly.

ORDER DETAILS
-------------
Order ID: ${data.orderId}
Order Date: ${formattedDate}

ITEMS
-----
${itemsList}

TOTAL: ₱${data.totalAmount.toFixed(2)}

WHAT HAPPENS NEXT?
- Our team will verify your payment
- You'll receive updates if there are any issues
- Your order will be processed and prepared

If you have any questions, please contact us.
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
