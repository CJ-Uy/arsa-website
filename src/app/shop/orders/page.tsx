import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrders } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	const { orders } = await getOrders();

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
		<div className="container mx-auto px-4 py-10">
			<div className="mb-8">
				<h1 className="mb-2 text-4xl font-bold">My Orders</h1>
				<p className="text-muted-foreground">View and track your order history</p>
			</div>

			{orders.length === 0 ? (
				<div className="py-12 text-center">
					<ShoppingBag className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
					<h2 className="mb-2 text-2xl font-semibold">No orders yet</h2>
					<p className="text-muted-foreground mb-6">Start shopping to place your first order</p>
					<Link href="/shop">
						<Button>Start Shopping</Button>
					</Link>
				</div>
			) : (
				<div className="space-y-4">
					{orders.map((order) => (
						<Card key={order.id}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
									{getStatusBadge(order.status)}
								</div>
								<p className="text-muted-foreground text-sm">
									{new Date(order.createdAt).toLocaleDateString("en-US", {
										timeZone: "Asia/Manila",
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="space-y-2">
										{order.orderItems.map((item) => (
											<div key={item.id} className="flex justify-between gap-2 text-sm">
												<span className="text-muted-foreground">
													{item.product.name}
													{item.size && (
														<span className="text-foreground ml-1 font-medium">({item.size})</span>
													)}{" "}
													× {item.quantity}
												</span>
												<span className="whitespace-nowrap">
													₱{(item.price * item.quantity).toFixed(2)}
												</span>
											</div>
										))}
									</div>

									<div className="flex items-center justify-between border-t pt-4">
										<span className="font-semibold">Total</span>
										<span className="text-lg font-bold">₱{order.totalAmount.toFixed(2)}</span>
									</div>

									<Link href={`/shop/orders/${order.id}`}>
										<Button variant="outline" className="w-full">
											View Details
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
