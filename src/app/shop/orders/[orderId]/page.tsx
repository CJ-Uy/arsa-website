import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	const { orderId } = await params;

	const order = await prisma.order.findUnique({
		where: {
			id: orderId,
			userId: session.user.id,
		},
		include: {
			orderItems: {
				include: {
					product: true,
				},
			},
		},
	});

	if (!order) {
		redirect("/shop");
	}

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

	return (
		<div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
			<div className="mb-8">
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-2xl font-bold sm:text-4xl">Order Confirmation</h1>
					{getStatusBadge(order.status)}
				</div>
				<p className="text-muted-foreground">Thank you for your order! We'll process it shortly.</p>
			</div>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Order Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<p className="text-muted-foreground text-sm">Order ID</p>
								<p className="font-mono text-sm break-all">{order.id}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-sm">Order Date</p>
								<p className="text-sm">
									{new Date(order.createdAt).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						</div>

						{order.notes && (
							<div>
								<p className="text-muted-foreground mb-1 text-sm">Special Instructions</p>
								<p className="text-sm">{order.notes}</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Order Items</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{order.orderItems.map((item) => (
								<div
									key={item.id}
									className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
								>
									<div>
										<p className="font-medium">{item.product.name}</p>
										<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
											{item.size && (
												<span className="flex items-center gap-1">
													Size: <span className="text-foreground font-medium">{item.size}</span>
												</span>
											)}
											<span>Quantity: {item.quantity}</span>
										</div>
									</div>
									<p className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</p>
								</div>
							))}

							<div className="flex items-center justify-between border-t pt-4 text-lg font-bold">
								<span>Total</span>
								<span>₱{order.totalAmount.toFixed(2)}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{order.receiptImageUrl && (
					<Card>
						<CardHeader>
							<CardTitle>Payment Receipt</CardTitle>
						</CardHeader>
						<CardContent>
							<img
								src={`/api/receipts/${order.receiptImageUrl.split("/").pop()}`}
								alt="Payment receipt"
								className="max-w-full rounded-lg border"
							/>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardContent className="pt-6">
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
								<div>
									<p className="font-semibold">What happens next?</p>
									<p className="text-muted-foreground text-sm">
										Our team will verify your payment and process your order.
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<Package className="text-primary mt-0.5 h-5 w-5" />
								<div>
									<p className="font-semibold">Order Processing</p>
									<p className="text-muted-foreground text-sm">
										You&apos;ll receive updates via email in case of any issues with your order.
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="flex flex-col gap-4 sm:flex-row">
					<Link href="/shop" className="flex-1">
						<Button variant="outline" className="w-full">
							Continue Shopping
						</Button>
					</Link>
					<Link href="/shop/orders" className="flex-1">
						<Button className="w-full">View All Orders</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
