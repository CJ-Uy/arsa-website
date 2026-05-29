"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveShopConfig } from "../actions";
import { Loader2 } from "lucide-react";

type ShopRow = {
	enabled: boolean;
	isShopClosed: boolean;
	closureMessage: string | null;
	codePath: string | null;
	hasCustomCheckout: boolean;
	allowScheduledDelivery: boolean;
	deliveryLeadDays: number;
	dailyCutoffTime: string | null;
};

type ShopConfigProps = {
	eventId: string;
	eventSlug: string;
	shopRow: ShopRow;
};

export function ShopConfig({ eventId, shopRow }: ShopConfigProps) {
	const [isShopClosed, setIsShopClosed] = useState(shopRow.isShopClosed);
	const [closureMessage, setClosureMessage] = useState(shopRow.closureMessage ?? "");
	const [codePath, setCodePath] = useState(shopRow.codePath ?? "");
	const [hasCustomCheckout, setHasCustomCheckout] = useState(shopRow.hasCustomCheckout);
	const [allowScheduledDelivery, setAllowScheduledDelivery] = useState(shopRow.allowScheduledDelivery);
	const [deliveryLeadDays, setDeliveryLeadDays] = useState(shopRow.deliveryLeadDays);
	const [dailyCutoffTime, setDailyCutoffTime] = useState(shopRow.dailyCutoffTime ?? "");
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		setSaving(true);
		try {
			await saveShopConfig(eventId, {
				isShopClosed,
				closureMessage: closureMessage.trim() || null,
				codePath: codePath.trim() || null,
				allowScheduledDelivery,
				deliveryLeadDays,
				dailyCutoffTime: dailyCutoffTime.trim() || null,
				hasCustomCheckout,
			});
			toast.success("Shop config saved");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to save config");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			{/* Status indicator */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Module Status</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						{shopRow.enabled ? (
							<Badge className="bg-[#f7bc37] text-[#0e3663]">LIVE</Badge>
						) : (
							<Badge variant="secondary">PAUSED</Badge>
						)}
						<span className="text-sm text-muted-foreground">
							{shopRow.enabled
								? "Shop is live. Toggle off from the event overview."
								: "Shop is paused. Toggle on from the event overview."}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Closure */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Closure</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="shopClosed">Close shop to customers</Label>
							<p className="text-xs text-muted-foreground">
								Customers will see the closure message instead of browsing products.
							</p>
						</div>
						<Switch
							id="shopClosed"
							checked={isShopClosed}
							onCheckedChange={setIsShopClosed}
						/>
					</div>
					{isShopClosed && (
						<div className="space-y-1.5">
							<Label htmlFor="closureMessage">Closure message</Label>
							<Textarea
								id="closureMessage"
								value={closureMessage}
								onChange={(e) => setClosureMessage(e.target.value)}
								placeholder="The shop is currently closed. Check back soon!"
								rows={3}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Custom component */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Custom Component</CardTitle>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<Label htmlFor="codePath">Code path</Label>
					<Input
						id="codePath"
						value={codePath}
						onChange={(e) => setCodePath(e.target.value)}
						placeholder="e.g. 2026/flower-fest-2026"
					/>
					<p className="text-xs text-muted-foreground">
						Relative path under <code>src/app/shop/events/</code> for custom UI overrides.
					</p>
				</CardContent>
			</Card>

			{/* Checkout */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Checkout</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="customCheckout">Custom checkout fields</Label>
							<p className="text-xs text-muted-foreground">
								Enable event-specific fields at checkout.
							</p>
						</div>
						<Switch
							id="customCheckout"
							checked={hasCustomCheckout}
							onCheckedChange={setHasCustomCheckout}
						/>
					</div>
					<p className="text-xs text-muted-foreground italic">
						Full checkout field editor coming soon.
					</p>
				</CardContent>
			</Card>

			{/* Delivery */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Delivery Scheduling</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="scheduledDelivery">Allow scheduled delivery</Label>
							<p className="text-xs text-muted-foreground">
								Customers choose a delivery date during checkout.
							</p>
						</div>
						<Switch
							id="scheduledDelivery"
							checked={allowScheduledDelivery}
							onCheckedChange={setAllowScheduledDelivery}
						/>
					</div>
					{allowScheduledDelivery && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="leadDays">Delivery lead days</Label>
								<Input
									id="leadDays"
									type="number"
									min={0}
									value={deliveryLeadDays}
									onChange={(e) => setDeliveryLeadDays(Number(e.target.value))}
								/>
								<p className="text-xs text-muted-foreground">
									Minimum days from today a customer can select.
								</p>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="cutoffTime">Daily cutoff time</Label>
								<Input
									id="cutoffTime"
									type="time"
									value={dailyCutoffTime}
									onChange={(e) => setDailyCutoffTime(e.target.value)}
								/>
								<p className="text-xs text-muted-foreground">
									Orders placed after this time cannot select next-day delivery.
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={saving}>
					{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Save changes
				</Button>
			</div>
		</div>
	);
}
