"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Mail,
	Search,
	Plus,
	Loader2,
	CheckCircle,
	XCircle,
	RefreshCw,
	Trash2,
	Info,
} from "lucide-react";
import { toast } from "sonner";
import { fetchEmailLogs, addManualEmailLog, removeEmailLog } from "./actions";
import type { EmailProvider } from "@/lib/email";

type EmailLog = {
	id: string;
	provider: string;
	recipient: string;
	subject: string;
	emailType: string;
	orderId: string | null;
	userId: string | null;
	status: string;
	errorMessage: string | null;
	providerId: string | null;
	sentAt: Date;
};

type EmailLogStats = {
	totalSent: number;
	totalFailed: number;
	totalEmails: number;
	recentLogs: Array<{
		recipient: string;
		subject: string;
		status: string;
		sentAt: Date;
		emailType: string;
	}>;
};

type EmailLogsClientProps = {
	initialStats: EmailLogStats;
};

export function EmailLogsClient({ initialStats }: EmailLogsClientProps) {
	const [logs, setLogs] = useState<EmailLog[]>([]);
	const [stats, setStats] = useState(initialStats);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(0);
	const [limit] = useState(50);

	// Filters
	const [recipientFilter, setRecipientFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "failed">("all");
	const [emailTypeFilter, setEmailTypeFilter] = useState<"all" | "order_confirmation" | "test" | "custom">("all");

	// Manual log modal
	const [showManualLogModal, setShowManualLogModal] = useState(false);
	const [manualLogForm, setManualLogForm] = useState({
		provider: "smtp" as EmailProvider,
		recipient: "",
		subject: "",
		emailType: "order_confirmation",
		orderId: "",
	});
	const [submitting, setSubmitting] = useState(false);

	// Load logs
	const loadLogs = async (resetPage = false) => {
		setLoading(true);
		try {
			const currentPage = resetPage ? 0 : page;
			const result = await fetchEmailLogs({
				limit,
				offset: currentPage * limit,
				recipient: recipientFilter || undefined,
				status: statusFilter === "all" ? undefined : statusFilter,
				emailType: emailTypeFilter === "all" ? undefined : emailTypeFilter,
			});

			setLogs(result.logs);
			setTotal(result.total);
			if (resetPage) setPage(0);
		} catch (error) {
			toast.error("Failed to load email logs");
		} finally {
			setLoading(false);
		}
	};

	// Initial load
	useEffect(() => {
		loadLogs();
	}, [page]);

	// Handle filter changes
	const handleFilterChange = () => {
		loadLogs(true);
	};

	// Handle manual log submission
	const handleManualLogSubmit = async () => {
		if (!manualLogForm.recipient || !manualLogForm.subject) {
			toast.error("Please fill in all required fields");
			return;
		}

		setSubmitting(true);
		try {
			const result = await addManualEmailLog(
				manualLogForm.provider,
				manualLogForm.recipient,
				manualLogForm.subject,
				manualLogForm.emailType,
				manualLogForm.orderId || undefined,
			);

			if (result.success) {
				toast.success("Email log added successfully");
				setShowManualLogModal(false);
				setManualLogForm({
					provider: "smtp",
					recipient: "",
					subject: "",
					emailType: "order_confirmation",
					orderId: "",
				});
				loadLogs(true);
			} else {
				toast.error(result.message || "Failed to add email log");
			}
		} catch (error) {
			toast.error("Failed to add email log");
		} finally {
			setSubmitting(false);
		}
	};

	// Handle delete
	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this email log?")) return;

		try {
			const result = await removeEmailLog(id);
			if (result.success) {
				toast.success("Email log deleted");
				loadLogs();
			} else {
				toast.error(result.message || "Failed to delete email log");
			}
		} catch (error) {
			toast.error("Failed to delete email log");
		}
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZone: "Asia/Manila",
		});
	};

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
						<CheckCircle className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalSent}</div>
						<p className="text-muted-foreground text-xs">Successfully delivered</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Failed Emails</CardTitle>
						<XCircle className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalFailed}</div>
						<p className="text-muted-foreground text-xs">Delivery failures</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Emails</CardTitle>
						<Mail className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalEmails}</div>
						<p className="text-muted-foreground text-xs">All email records</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters & Actions */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span className="flex items-center gap-2">
							<Search className="h-5 w-5" />
							Email Logs
						</span>
						<Button onClick={() => setShowManualLogModal(true)} size="sm">
							<Plus className="mr-2 h-4 w-4" />
							Add Manual Log
						</Button>
					</CardTitle>
					<CardDescription>
						Search and filter email logs. Manual logs are useful for recording historical emails.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Filters */}
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="recipient-filter">Recipient</Label>
							<Input
								id="recipient-filter"
								placeholder="Search by email..."
								value={recipientFilter}
								onChange={(e) => setRecipientFilter(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="status-filter">Status</Label>
							<Select
								value={statusFilter}
								onValueChange={(value: "all" | "sent" | "failed") => setStatusFilter(value)}
							>
								<SelectTrigger id="status-filter">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="sent">Sent</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="type-filter">Email Type</Label>
							<Select
								value={emailTypeFilter}
								onValueChange={(value: "all" | "order_confirmation" | "test" | "custom") =>
									setEmailTypeFilter(value)
								}
							>
								<SelectTrigger id="type-filter">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									<SelectItem value="order_confirmation">Order Confirmation</SelectItem>
									<SelectItem value="test">Test Email</SelectItem>
									<SelectItem value="custom">Custom Email</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex gap-2">
						<Button onClick={handleFilterChange} disabled={loading}>
							<Search className="mr-2 h-4 w-4" />
							Apply Filters
						</Button>
						<Button
							onClick={() => {
								setRecipientFilter("");
								setStatusFilter("all");
								setEmailTypeFilter("all");
								setTimeout(() => loadLogs(true), 0);
							}}
							variant="outline"
							disabled={loading}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Reset
						</Button>
					</div>

					{/* Table */}
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Recipient</TableHead>
									<TableHead>Subject</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Provider</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Sent At</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={7} className="h-24 text-center">
											<Loader2 className="mx-auto h-6 w-6 animate-spin" />
										</TableCell>
									</TableRow>
								) : logs.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="h-24 text-center">
											No email logs found
										</TableCell>
									</TableRow>
								) : (
									logs.map((log) => (
										<TableRow key={log.id}>
											<TableCell className="font-medium">
												{log.recipient}
												{log.orderId && (
													<div className="text-muted-foreground text-xs">
														Order: {log.orderId.slice(0, 8)}
													</div>
												)}
											</TableCell>
											<TableCell className="max-w-xs truncate">{log.subject}</TableCell>
											<TableCell>
												<Badge variant="outline">{log.emailType.replace("_", " ")}</Badge>
											</TableCell>
											<TableCell className="uppercase">{log.provider}</TableCell>
											<TableCell>
												{log.status === "sent" ? (
													<Badge variant="default" className="bg-green-600">
														<CheckCircle className="mr-1 h-3 w-3" />
														Sent
													</Badge>
												) : (
													<Badge variant="destructive">
														<XCircle className="mr-1 h-3 w-3" />
														Failed
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-xs">{formatDate(log.sentAt)}</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleDelete(log.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between">
						<div className="text-muted-foreground text-sm">
							Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} logs
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(0, p - 1))}
								disabled={page === 0 || loading}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => p + 1)}
								disabled={(page + 1) * limit >= total || loading}
							>
								Next
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Manual Log Modal */}
			<Dialog open={showManualLogModal} onOpenChange={setShowManualLogModal}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Plus className="h-5 w-5" />
							Add Manual Email Log
						</DialogTitle>
						<DialogDescription>
							Manually record an email that was sent. Useful for historical records.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<Alert>
							<Info className="h-4 w-4" />
							<AlertDescription>
								This adds a record of an email without actually sending it. Use this to track emails
								sent outside of this system or for historical data.
							</AlertDescription>
						</Alert>

						<div className="space-y-2">
							<Label htmlFor="manual-provider">Provider *</Label>
							<Select
								value={manualLogForm.provider}
								onValueChange={(value: EmailProvider) =>
									setManualLogForm({ ...manualLogForm, provider: value })
								}
							>
								<SelectTrigger id="manual-provider">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="smtp">SMTP</SelectItem>
									<SelectItem value="resend">Resend</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="manual-recipient">Recipient Email *</Label>
							<Input
								id="manual-recipient"
								type="email"
								placeholder="customer@example.com"
								value={manualLogForm.recipient}
								onChange={(e) =>
									setManualLogForm({ ...manualLogForm, recipient: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="manual-subject">Subject *</Label>
							<Input
								id="manual-subject"
								placeholder="Order Confirmation - 12345678"
								value={manualLogForm.subject}
								onChange={(e) => setManualLogForm({ ...manualLogForm, subject: e.target.value })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="manual-type">Email Type</Label>
							<Select
								value={manualLogForm.emailType}
								onValueChange={(value) => setManualLogForm({ ...manualLogForm, emailType: value })}
							>
								<SelectTrigger id="manual-type">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="order_confirmation">Order Confirmation</SelectItem>
									<SelectItem value="test">Test Email</SelectItem>
									<SelectItem value="custom">Custom Email</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="manual-order">Order ID (Optional)</Label>
							<Input
								id="manual-order"
								placeholder="Enter order ID if applicable"
								value={manualLogForm.orderId}
								onChange={(e) => setManualLogForm({ ...manualLogForm, orderId: e.target.value })}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowManualLogModal(false)} disabled={submitting}>
							Cancel
						</Button>
						<Button onClick={handleManualLogSubmit} disabled={submitting}>
							{submitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding...
								</>
							) : (
								<>
									<Plus className="mr-2 h-4 w-4" />
									Add Log
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
