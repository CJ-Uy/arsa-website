"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateOrderStatus, deleteOrder, exportOrdersData } from "./actions";
import { ClientBatchOcr } from "./ClientBatchOcr";
import { InvoiceUpload } from "./InvoiceUpload";
import { ManualVerificationDashboard } from "./ManualVerificationDashboard";
import { toast } from "sonner";
import { CheckCircle, Clock, Package, Eye, Trash2, Download, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Order = {
	id: string;
	userId: string;
	totalAmount: number;
	status: string;
	receiptImageUrl: string | null;
	gcashReferenceNumber: string | null;
	notes: string | null;
	createdAt: Date;
	user: {
		id: string;
		name: string | null;
		email: string;
	};
	orderItems: Array<{
		id: string;
		quantity: number;
		price: number;
		size: string | null;
		product: {
			id: string;
			name: string;
			description: string;
		};
	}>;
};

type OrdersManagementProps = {
	initialOrders: Order[];
};

export function OrdersManagement({ initialOrders }: OrdersManagementProps) {
	const [orders, setOrders] = useState<Order[]>(initialOrders);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [showDialog, setShowDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// Detect duplicate GCash reference numbers
	const duplicateRefNumbers = new Set<string>();
	const refNumberCounts = new Map<string, number>();
	orders.forEach((order) => {
		if (order.gcashReferenceNumber) {
			const count = refNumberCounts.get(order.gcashReferenceNumber) || 0;
			refNumberCounts.set(order.gcashReferenceNumber, count + 1);
			if (count > 0) {
				duplicateRefNumbers.add(order.gcashReferenceNumber);
			}
		}
	});

	const filteredOrders =
		statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

	const handleStatusChange = async (orderId: string, newStatus: string) => {
		const result = await updateOrderStatus(orderId, newStatus);
		if (result.success) {
			setOrders(
				orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
			);
			toast.success("Order status updated");
		} else {
			toast.error(result.message || "Failed to update order");
		}
	};

	const handleDeleteOrder = async () => {
		if (!orderToDelete) return;

		const result = await deleteOrder(orderToDelete);
		if (result.success) {
			setOrders(orders.filter((order) => order.id !== orderToDelete));
			toast.success("Order deleted");
			setShowDeleteDialog(false);
			setOrderToDelete(null);
		} else {
			toast.error(result.message || "Failed to delete order");
		}
	};

	const handleExportToExcel = async () => {
		try {
			toast.loading("Preparing export...");

			const result = await exportOrdersData();

			if (!result.success || !result.data) {
				toast.error(result.message || "Failed to export data");
				return;
			}

			// Create worksheet from data
			const ws = XLSX.utils.json_to_sheet(result.data);

			// Set column widths for better readability
			const colWidths = [
				{ wch: 10 }, // Order ID
				{ wch: 20 }, // Order Date
				{ wch: 20 }, // Customer Name
				{ wch: 25 }, // Customer Email
				{ wch: 15 }, // Student ID
				{ wch: 30 }, // Product Name
				{ wch: 40 }, // Product Description
				{ wch: 10 }, // Size
				{ wch: 10 }, // Quantity
				{ wch: 12 }, // Unit Price
				{ wch: 12 }, // Item Total
				{ wch: 12 }, // Order Total
				{ wch: 12 }, // Order Status
				{ wch: 15 }, // GCash Ref No
				{ wch: 30 }, // Notes
				{ wch: 30 }, // Receipt URL
			];
			ws["!cols"] = colWidths;

			// Create workbook
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Orders");

			// Generate filename with current date
			const date = new Date().toISOString().split("T")[0];
			const filename = `ARSA_Orders_${date}.xlsx`;

			// Download file
			XLSX.writeFile(wb, filename);

			toast.dismiss();
			toast.success(`Exported ${result.data.length} order items to ${filename}`);
		} catch (error) {
			console.error("Export error:", error);
			toast.dismiss();
			toast.error("Failed to export data");
		}
	};

	const getStatusBadge = (status: string) => {
		const variants: Record<
			string,
			{ variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
		> = {
			pending: { variant: "secondary", icon: Clock },
			paid: { variant: "default", icon: CheckCircle },
			confirmed: { variant: "default", icon: CheckCircle },
			completed: { variant: "default", icon: Package },
			cancelled: { variant: "destructive", icon: Clock },
		};
		const config = variants[status] || variants.pending;
		const Icon = config.icon;
		return (
			<Badge variant={config.variant}>
				<Icon className="mr-1 h-3 w-3" />
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</Badge>
		);
	};

	const getOrderStats = () => {
		return {
			total: orders.length,
			pending: orders.filter((o) => o.status === "pending").length,
			paid: orders.filter((o) => o.status === "paid").length,
			confirmed: orders.filter((o) => o.status === "confirmed").length,
			completed: orders.filter((o) => o.status === "completed").length,
		};
	};

	const stats = getOrderStats();

	return (
		<Tabs defaultValue="orders" className="space-y-6">
			<TabsList>
				<TabsTrigger value="orders">Orders</TabsTrigger>
				<TabsTrigger value="verify">Verify</TabsTrigger>
			</TabsList>

			<TabsContent value="orders" className="space-y-6">
				{/* Action Buttons */}
				<div className="flex justify-end gap-2">
					<Button onClick={handleExportToExcel} variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export to Excel
					</Button>
				</div>

				{/* Stats Cards */}
				<div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-muted-foreground text-sm font-medium">
								Total Orders
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.total}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-muted-foreground text-sm font-medium">Pending</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.pending}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-muted-foreground text-sm font-medium">Paid</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.paid}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-muted-foreground text-sm font-medium">Confirmed</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.confirmed}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-muted-foreground text-sm font-medium">Completed</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.completed}</div>
						</CardContent>
					</Card>
				</div>

				{/* Filter Tabs */}
				<Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
					<TabsList>
						<TabsTrigger value="all">All Orders</TabsTrigger>
						<TabsTrigger value="pending">Pending</TabsTrigger>
						<TabsTrigger value="paid">Paid</TabsTrigger>
						<TabsTrigger value="confirmed">Confirmed</TabsTrigger>
						<TabsTrigger value="completed">Completed</TabsTrigger>
						<TabsTrigger value="cancelled">Cancelled</TabsTrigger>
					</TabsList>
				</Tabs>

				{/* Orders List */}
				<div className="space-y-4">
					{filteredOrders.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
								<p className="text-muted-foreground">No orders found</p>
							</CardContent>
						</Card>
					) : (
						filteredOrders.map((order) => (
							<Card key={order.id}>
								<CardContent className="p-6">
									<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
										<div className="flex-1 space-y-2">
											<div className="flex items-center gap-3">
												<span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
												{getStatusBadge(order.status)}
												{order.gcashReferenceNumber &&
													duplicateRefNumbers.has(order.gcashReferenceNumber) && (
														<Badge variant="destructive" className="flex items-center gap-1">
															<AlertTriangle className="h-3 w-3" />
															Duplicate Payment
														</Badge>
													)}
											</div>
											<div className="text-muted-foreground text-sm">
												<p>Customer: {order.user.name || order.user.email}</p>
												<p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
												{order.gcashReferenceNumber && (
													<p className="flex items-center gap-2">
														<span>GCash Ref:</span>
														<span className="text-foreground font-mono font-semibold">
															{order.gcashReferenceNumber}
														</span>
													</p>
												)}
												<p className="text-foreground font-semibold">
													Total: ₱{order.totalAmount.toFixed(2)}
												</p>
											</div>
										</div>

										<div className="flex gap-2">
											<Select
												value={order.status}
												onValueChange={(value) => handleStatusChange(order.id, value)}
											>
												<SelectTrigger className="w-[150px]">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="pending">Pending</SelectItem>
													<SelectItem value="paid">Paid</SelectItem>
													<SelectItem value="confirmed">Confirmed</SelectItem>
													<SelectItem value="completed">Completed</SelectItem>
													<SelectItem value="cancelled">Cancelled</SelectItem>
												</SelectContent>
											</Select>
											<Button
												variant="outline"
												size="icon"
												onClick={() => {
													setSelectedOrder(order);
													setShowDialog(true);
												}}
											>
												<Eye className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="icon"
												onClick={() => {
													setOrderToDelete(order.id);
													setShowDeleteDialog(true);
												}}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>

				{/* Order Details Dialog */}
				<Dialog open={showDialog} onOpenChange={setShowDialog}>
					<DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Order Details</DialogTitle>
							<DialogDescription>Order #{selectedOrder?.id.slice(0, 8)}</DialogDescription>
						</DialogHeader>
						{selectedOrder && (
							<div className="space-y-6">
								<div>
									<h3 className="mb-2 font-semibold">Customer Information</h3>
									<p className="text-sm">Name: {selectedOrder.user.name || "N/A"}</p>
									<p className="text-sm">Email: {selectedOrder.user.email}</p>
									{selectedOrder.gcashReferenceNumber && (
										<div className="mt-2">
											<p className="text-sm">
												GCash Reference Number:{" "}
												<span className="font-mono font-semibold">
													{selectedOrder.gcashReferenceNumber}
												</span>
											</p>
											{duplicateRefNumbers.has(selectedOrder.gcashReferenceNumber) && (
												<Alert variant="destructive" className="mt-2">
													<AlertTriangle className="h-4 w-4" />
													<AlertDescription>
														This GCash reference number is used in multiple orders. Please verify
														the payment.
													</AlertDescription>
												</Alert>
											)}
										</div>
									)}
								</div>

								<Card>
									<CardHeader>
										<CardTitle>Order Items</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{selectedOrder.orderItems.map((item) => (
												<div
													key={item.id}
													className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
												>
													<div>
														<p className="font-medium">{item.product.name}</p>
														<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
															{item.size && (
																<span className="flex items-center gap-1">
																	Size:{" "}
																	<span className="text-foreground font-medium">{item.size}</span>
																</span>
															)}
															<span>Quantity: {item.quantity}</span>
														</div>
													</div>
													<p className="font-semibold">
														₱{(item.price * item.quantity).toFixed(2)}
													</p>
												</div>
											))}

											<div className="flex items-center justify-between pt-4 text-lg font-bold">
												<span>Total</span>
												<span>₱{selectedOrder.totalAmount.toFixed(2)}</span>
											</div>
										</div>
									</CardContent>
								</Card>

								{selectedOrder.notes && (
									<div>
										<h3 className="mb-2 font-semibold">Notes</h3>
										<p className="text-sm">{selectedOrder.notes}</p>
									</div>
								)}

								{selectedOrder.receiptImageUrl && (
									<div>
										<h3 className="mb-2 font-semibold">Payment Receipt</h3>
										<img
											src={`/api/receipts/${selectedOrder.receiptImageUrl.split("/").pop()}`}
											alt="Receipt"
											className="max-w-full rounded-lg border"
										/>
									</div>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Delete Confirmation Dialog */}
				<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the order.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleDeleteOrder}>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</TabsContent>

			<TabsContent value="verify" className="space-y-6">
				{/* OCR Batch Processing */}
				<ClientBatchOcr />

				{/* Invoice Upload */}
				<InvoiceUpload />

				{/* Manual Verification Dashboard */}
				<ManualVerificationDashboard />
			</TabsContent>
		</Tabs>
	);
}
