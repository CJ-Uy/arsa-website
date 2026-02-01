"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Send, CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { saveEmailSettings, sendTestEmail, type EmailSettings } from "@/lib/email";

type EmailSettingsClientProps = {
	initialSettings: EmailSettings | null;
	userEmail: string;
};

export function EmailSettingsClient({ initialSettings, userEmail }: EmailSettingsClientProps) {
	const [settings, setSettings] = useState<EmailSettings>(
		initialSettings || {
			enabled: false,
			fromAddress: "",
			fromName: "ARSA Shop",
			replyTo: "",
		},
	);
	const [saving, setSaving] = useState(false);
	const [testing, setTesting] = useState(false);
	const [testEmail, setTestEmail] = useState(userEmail);

	const handleSave = async () => {
		if (settings.enabled && !settings.fromAddress) {
			toast.error("Please enter a From email address");
			return;
		}

		setSaving(true);
		try {
			const result = await saveEmailSettings(settings);
			if (result.success) {
				toast.success("Email settings saved successfully");
			} else {
				toast.error(result.message || "Failed to save settings");
			}
		} catch (error) {
			toast.error("Failed to save settings");
		} finally {
			setSaving(false);
		}
	};

	const handleTestEmail = async () => {
		if (!testEmail) {
			toast.error("Please enter a test email address");
			return;
		}

		if (!settings.fromAddress) {
			toast.error("Please configure and save your email settings first");
			return;
		}

		setTesting(true);
		try {
			const result = await sendTestEmail(testEmail);
			if (result.success) {
				toast.success("Test email sent! Check your inbox.");
			} else {
				toast.error(result.message || "Failed to send test email");
			}
		} catch (error) {
			toast.error("Failed to send test email");
		} finally {
			setTesting(false);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Mail className="h-5 w-5" />
						Email Notifications
					</CardTitle>
					<CardDescription>
						Configure email confirmations sent to customers after they place an order
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Enable/Disable Toggle */}
					<div className="flex items-center justify-between rounded-lg border p-4">
						<div className="space-y-0.5">
							<Label htmlFor="email-enabled" className="text-base font-medium">
								Enable Order Confirmation Emails
							</Label>
							<p className="text-muted-foreground text-sm">
								Send automatic email confirmations when customers place orders
							</p>
						</div>
						<Switch
							id="email-enabled"
							checked={settings.enabled}
							onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
						/>
					</div>

					{settings.enabled && (
						<>
							{/* SMTP Configuration Notice */}
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription>
									<strong>SMTP Configuration Required:</strong> Make sure you have set up the
									following environment variables on your server:
									<ul className="mt-2 list-inside list-disc space-y-1 text-sm">
										<li>
											<code className="bg-muted rounded px-1">SMTP_HOST</code> - smtp.gmail.com
										</li>
										<li>
											<code className="bg-muted rounded px-1">SMTP_PORT</code> - 587
										</li>
										<li>
											<code className="bg-muted rounded px-1">SMTP_USER</code> - Your Gmail address
										</li>
										<li>
											<code className="bg-muted rounded px-1">SMTP_PASSWORD</code> - Your Google App
											Password
										</li>
									</ul>
								</AlertDescription>
							</Alert>

							{/* From Address */}
							<div className="space-y-2">
								<Label htmlFor="from-address">From Email Address *</Label>
								<Input
									id="from-address"
									type="email"
									placeholder="shop@example.com"
									value={settings.fromAddress}
									onChange={(e) => setSettings({ ...settings, fromAddress: e.target.value })}
								/>
								<p className="text-muted-foreground text-xs">
									This should match your SMTP_USER email address
								</p>
							</div>

							{/* From Name */}
							<div className="space-y-2">
								<Label htmlFor="from-name">From Display Name</Label>
								<Input
									id="from-name"
									type="text"
									placeholder="ARSA Shop"
									value={settings.fromName}
									onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
								/>
								<p className="text-muted-foreground text-xs">
									The name shown in the "From" field (e.g., "ARSA Shop")
								</p>
							</div>

							{/* Reply-To */}
							<div className="space-y-2">
								<Label htmlFor="reply-to">Reply-To Address (Optional)</Label>
								<Input
									id="reply-to"
									type="email"
									placeholder="support@example.com"
									value={settings.replyTo || ""}
									onChange={(e) => setSettings({ ...settings, replyTo: e.target.value })}
								/>
								<p className="text-muted-foreground text-xs">
									Where replies should be sent (defaults to From address if not set)
								</p>
							</div>
						</>
					)}

					{/* Save Button */}
					<Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
						{saving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<CheckCircle className="mr-2 h-4 w-4" />
								Save Settings
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{/* Test Email Section */}
			{settings.enabled && settings.fromAddress && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Send className="h-5 w-5" />
							Test Email Configuration
						</CardTitle>
						<CardDescription>
							Send a test email to verify your configuration is working
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-3">
							<Input
								type="email"
								placeholder="test@example.com"
								value={testEmail}
								onChange={(e) => setTestEmail(e.target.value)}
								className="flex-1"
							/>
							<Button onClick={handleTestEmail} disabled={testing} variant="outline">
								{testing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sending...
									</>
								) : (
									<>
										<Send className="mr-2 h-4 w-4" />
										Send Test
									</>
								)}
							</Button>
						</div>
						<p className="text-muted-foreground text-xs">
							If the test fails, check your SMTP credentials and ensure your Google App Password is
							correctly configured.
						</p>
					</CardContent>
				</Card>
			)}

			{/* Setup Instructions */}
			<Card>
				<CardHeader>
					<CardTitle>Google SMTP Setup Instructions</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3 text-sm">
						<div className="flex gap-3">
							<span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
								1
							</span>
							<div>
								<p className="font-medium">Enable 2-Step Verification</p>
								<p className="text-muted-foreground">
									Go to your Google Account → Security → 2-Step Verification and enable it
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
								2
							</span>
							<div>
								<p className="font-medium">Create an App Password</p>
								<p className="text-muted-foreground">
									Go to Google Account → Security → App passwords → Create a new app password for
									"Mail"
								</p>
							</div>
						</div>
						<div className="flex gap-3">
							<span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
								3
							</span>
							<div>
								<p className="font-medium">Add Environment Variables</p>
								<p className="text-muted-foreground">
									Add the following to your server's environment:
								</p>
								<pre className="bg-muted mt-2 overflow-x-auto rounded p-3 text-xs">
									{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password`}
								</pre>
							</div>
						</div>
						<div className="flex gap-3">
							<span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
								4
							</span>
							<div>
								<p className="font-medium">Configure Settings Above</p>
								<p className="text-muted-foreground">
									Enter your email address above and save the settings, then send a test email
								</p>
							</div>
						</div>
					</div>

					<Alert className="mt-4">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>Important:</strong> Use a Google App Password, not your regular Google
							password. App Passwords are 16 characters with no spaces.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</div>
	);
}
