"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { getOrdersNeedingVerification } from "./invoiceActions";

interface OrderNeedingVerification {
	id: string;
	totalAmount: number;
	status: string;
	receiptImageUrl: string | null;
	gcashReferenceNumber: string | null;
	createdAt: Date;
	user: {
		name: string | null;
		email: string;
		studentId: string | null;
	};
	orderItems: Array<{
		quantity: number;
		product: {
			name: string;
		};
	}>;
}

export function ManualVerificationDashboard() {
	const [orders, setOrders] = useState<OrderNeedingVerification[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	async function loadOrders() {
		setIsLoading(true);
		try {
			const result = await getOrdersNeedingVerification();
			if (result.success) {
				setOrders(result.orders as OrderNeedingVerification[]);
				toast.success(`Found ${result.count} orders needing verification`);
			} else {
				toast.error(result.message || "Failed to load orders");
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to load orders");
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		loadOrders();
	}, []);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-yellow-600" />
							Orders Needing Manual Verification
						</CardTitle>
						<CardDescription>
							Orders with receipts but no reference number extracted, or unverified reference
							numbers
						</CardDescription>
					</div>
					<Button onClick={loadOrders} disabled={isLoading} variant="outline" size="sm">
						<RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
						Refresh
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{orders.length === 0 ? (
					<div className="text-muted-foreground py-8 text-center">
						No orders need manual verification at this time
					</div>
				) : (
					<div className="space-y-3">
						{orders.map((order) => (
							<div
								key={order.id}
								className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 space-y-1">
										<div className="flex items-center gap-2">
											<span className="font-mono text-sm font-semibold">
												{order.id.slice(0, 8)}
											</span>
											<Badge variant="outline">{order.status}</Badge>
											{!order.gcashReferenceNumber && (
												<Badge variant="destructive">No Ref Number</Badge>
											)}
										</div>
										<div className="text-sm">
											<strong>{order.user.name || "No name"}</strong> ({order.user.email})
										</div>
										{order.user.studentId && (
											<div className="text-muted-foreground text-sm">
												Student ID: {order.user.studentId}
											</div>
										)}
										<div className="text-muted-foreground text-sm">
											{order.orderItems.length} item(s) - ₱{order.totalAmount.toFixed(2)}
										</div>
										<div className="text-muted-foreground text-xs">
											{new Date(order.createdAt).toLocaleString()}
										</div>
									</div>
									<div className="flex flex-col gap-2">
										{order.receiptImageUrl && (
											<Button variant="outline" size="sm" asChild>
												<a href={order.receiptImageUrl} target="_blank" rel="noopener noreferrer">
													<ExternalLink className="mr-2 h-3 w-3" />
													View Receipt
												</a>
											</Button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
