"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
	Mail,
	Loader2,
	Send,
	CheckCircle,
	XCircle,
	AlertTriangle,
	RefreshCw,
	Info,
} from "lucide-react";
import { toast } from "sonner";
import { getOrdersWithoutEmails, sendBulkConfirmationEmails } from "./bulk-send-actions";

type OrderWithoutEmail = {
	id: string;
	customerEmail: string;
	customerName: string;
	totalAmount: number;
	status: string;
	createdAt: Date;
	eventName?: string;
	itemCount: number;
};

type SendResult = {
	orderId: string;
	customerEmail: string;
	success: boolean;
	error?: string;
};

export function BulkSendClient() {
	const [orders, setOrders] = useState<OrderWithoutEmail[]>([]);
	const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [progress, setProgress] = useState(0);
	const [results, setResults] = useState<SendResult[]>([]);
	const [showResults, setShowResults] = useState(false);

	// Load orders without emails
	const loadOrders = async () => {
		setLoading(true);
		try {
			const { orders: fetchedOrders } = await getOrdersWithoutEmails({ limit: 200 });
			setOrders(fetchedOrders);
			setSelectedOrders(new Set()); // Clear selection
			setShowResults(false); // Hide previous results
		} catch (error) {
			toast.error("Failed to load orders");
		} finally {
			setLoading(false);
		}
	};

	// Initial load
	useEffect(() => {
		loadOrders();
	}, []);

	// Toggle individual order selection
	const toggleOrder = (orderId: string) => {
		const newSelected = new Set(selectedOrders);
		if (newSelected.has(orderId)) {
			newSelected.delete(orderId);
		} else {
			newSelected.add(orderId);
		}
		setSelectedOrders(newSelected);
	};

	// Toggle all orders
	const toggleAll = () => {
		if (selectedOrders.size === orders.length) {
			setSelectedOrders(new Set());
		} else {
			setSelectedOrders(new Set(orders.map((o) => o.id)));
		}
	};

	// Send emails to selected orders
	const handleSendEmails = async () => {
		if (selectedOrders.size === 0) {
			toast.error("Please select at least one order");
			return;
		}

		if (!confirm(`Send confirmation emails to ${selectedOrders.size} customers?`)) {
			return;
		}

		setSending(true);
		setProgress(0);
		setShowResults(false);

		try {
			const orderIds = Array.from(selectedOrders);
			const result = await sendBulkConfirmationEmails(orderIds);

			if (!result.success) {
				toast.error(result.message || "Failed to send emails");
				return;
			}

			setResults(result.results || []);
			setShowResults(true);
			setProgress(100);

			const { successful, failed } = result.summary || { successful: 0, failed: 0 };

			if (failed === 0) {
				toast.success(`Successfully sent ${successful} confirmation emails!`);
			} else {
				toast.warning(`Sent ${successful} emails, ${failed} failed. Check results below.`);
			}

			// Reload orders to update the list
			await loadOrders();
		} catch (error) {
			toast.error("Failed to send emails");
		} finally {
			setSending(false);
		}
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			timeZone: "Asia/Manila",
		});
	};

	const formatCurrency = (amount: number) => {
		return `₱${amount.toFixed(2)}`;
	};

	return (
		<div className="space-y-6">
			{/* Info Alert */}
			<Alert>
				<Info className="h-4 w-4" />
				<AlertDescription>
					<strong>Bulk Email Sender:</strong> This tool finds all orders that haven't received
					confirmation emails and lets you send them in bulk. Perfect for retroactively sending emails
					or recovering from email outages.
				</AlertDescription>
			</Alert>

			{/* Orders Table */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Mail className="h-5 w-5" />
								Orders Without Confirmation Emails
							</CardTitle>
							<CardDescription className="mt-2">
								{orders.length === 0
									? "All orders have received confirmation emails!"
									: `${orders.length} order${orders.length !== 1 ? "s" : ""} without confirmation emails`}
							</CardDescription>
						</div>
						<div className="flex gap-2">
							<Button onClick={loadOrders} variant="outline" disabled={loading || sending}>
								<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
								Refresh
							</Button>
							{orders.length > 0 && (
								<Button
									onClick={handleSendEmails}
									disabled={selectedOrders.size === 0 || sending}
								>
									{sending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Sending {Math.round(progress)}%
										</>
									) : (
										<>
											<Send className="mr-2 h-4 w-4" />
											Send {selectedOrders.size > 0 ? selectedOrders.size : ""} Email
											{selectedOrders.size !== 1 ? "s" : ""}
										</>
									)}
								</Button>
							)}
						</div>
					</div>
				</CardHeader>

				{orders.length > 0 && (
					<CardContent className="space-y-4">
						{sending && (
							<div className="space-y-2">
								<Progress value={progress} className="h-2" />
								<p className="text-muted-foreground text-center text-sm">
									Sending emails... Please don't close this page.
								</p>
							</div>
						)}

						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">
											<Checkbox
												checked={selectedOrders.size === orders.length && orders.length > 0}
												onCheckedChange={toggleAll}
												disabled={sending}
											/>
										</TableHead>
										<TableHead>Order ID</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Items</TableHead>
										<TableHead>Event</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading ? (
										<TableRow>
											<TableCell colSpan={9} className="h-24 text-center">
												<Loader2 className="mx-auto h-6 w-6 animate-spin" />
											</TableCell>
										</TableRow>
									) : (
										orders.map((order) => (
											<TableRow key={order.id}>
												<TableCell>
													<Checkbox
														checked={selectedOrders.has(order.id)}
														onCheckedChange={() => toggleOrder(order.id)}
														disabled={sending}
													/>
												</TableCell>
												<TableCell className="font-mono text-xs">
													{order.id.slice(0, 8)}
												</TableCell>
												<TableCell className="font-medium">{order.customerName}</TableCell>
												<TableCell className="text-xs">{order.customerEmail}</TableCell>
												<TableCell>{formatCurrency(order.totalAmount)}</TableCell>
												<TableCell>
													<Badge variant="secondary">{order.itemCount} items</Badge>
												</TableCell>
												<TableCell>
													{order.eventName ? (
														<Badge variant="outline">{order.eventName}</Badge>
													) : (
														<span className="text-muted-foreground text-xs">—</span>
													)}
												</TableCell>
												<TableCell className="text-xs">{formatDate(order.createdAt)}</TableCell>
												<TableCell>
													<Badge
														variant={
															order.status === "completed"
																? "default"
																: order.status === "confirmed"
																	? "default"
																	: "secondary"
														}
													>
														{order.status}
													</Badge>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>

						{selectedOrders.size > 0 && !sending && (
							<div className="bg-muted rounded-lg p-4">
								<p className="text-sm">
									<strong>{selectedOrders.size}</strong> order{selectedOrders.size !== 1 ? "s" : ""}{" "}
									selected. Click "Send Emails" to send confirmation emails to these customers.
								</p>
							</div>
						)}
					</CardContent>
				)}
			</Card>

			{/* Results */}
			{showResults && results.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-green-600" />
							Sending Results
						</CardTitle>
						<CardDescription>
							{results.filter((r) => r.success).length} successful,{" "}
							{results.filter((r) => !r.success).length} failed
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{results.map((result) => (
								<div
									key={result.orderId}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="flex items-center gap-3">
										{result.success ? (
											<CheckCircle className="h-5 w-5 text-green-600" />
										) : (
											<XCircle className="h-5 w-5 text-red-600" />
										)}
										<div>
											<p className="text-sm font-medium">{result.customerEmail}</p>
											<p className="text-muted-foreground text-xs">
												Order: {result.orderId.slice(0, 8)}
											</p>
										</div>
									</div>
									<div className="text-right">
										{result.success ? (
											<Badge variant="default" className="bg-green-600">
												Sent
											</Badge>
										) : (
											<div>
												<Badge variant="destructive">Failed</Badge>
												{result.error && (
													<p className="text-muted-foreground mt-1 text-xs">{result.error}</p>
												)}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Empty State */}
			{!loading && orders.length === 0 && (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<CheckCircle className="mb-4 h-12 w-12 text-green-600" />
						<h3 className="mb-2 text-lg font-semibold">All Caught Up!</h3>
						<p className="text-muted-foreground text-center text-sm">
							All orders have received confirmation emails.
							<br />
							New orders will automatically receive emails when they're created.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
