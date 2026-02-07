"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DailyStockOverrides } from "./daily-stock-overrides";
import { Package2 } from "lucide-react";

type DailyStockConfig = {
	hasDailyStockLimit: boolean;
	defaultMaxOrdersPerDay?: number;
	dailyStockOverrides?: Record<string, number | null>;
	dailyStockNote?: string;
};

type DailyStockDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	productName: string;
	config: DailyStockConfig;
	onSave: (config: DailyStockConfig) => void;
};

export function DailyStockDialog({
	open,
	onOpenChange,
	productName,
	config,
	onSave,
}: DailyStockDialogProps) {
	const [localConfig, setLocalConfig] = useState<DailyStockConfig>(config);

	const handleSave = () => {
		onSave(localConfig);
		onOpenChange(false);
	};

	const handleCancel = () => {
		setLocalConfig(config); // Reset to original
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Package2 className="h-5 w-5" />
						Daily Stock Limits: {productName}
					</DialogTitle>
					<DialogDescription>
						Configure daily order limits and per-date overrides for this product in this event.
						Orders for both pickup and delivery count toward the daily limit.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Enable Toggle */}
					<div className="flex items-center justify-between rounded-lg border p-4">
						<div className="space-y-0.5">
							<Label htmlFor="enable-daily-stock" className="text-base font-medium">
								Enable Daily Stock Limits
							</Label>
							<p className="text-muted-foreground text-sm">
								Limit the number of orders per day for this product
							</p>
						</div>
						<Switch
							id="enable-daily-stock"
							checked={localConfig.hasDailyStockLimit}
							onCheckedChange={(checked) =>
								setLocalConfig({ ...localConfig, hasDailyStockLimit: checked })
							}
						/>
					</div>

					{localConfig.hasDailyStockLimit && (
						<>
							{/* Default Max Orders */}
							<div className="space-y-2">
								<Label htmlFor="default-max">Default Max Orders Per Day *</Label>
								<Input
									id="default-max"
									type="number"
									min="0"
									placeholder="e.g., 50"
									value={localConfig.defaultMaxOrdersPerDay || ""}
									onChange={(e) =>
										setLocalConfig({
											...localConfig,
											defaultMaxOrdersPerDay: e.target.value ? parseInt(e.target.value) : undefined,
										})
									}
								/>
								<p className="text-muted-foreground text-xs">
									This limit applies to all dates unless overridden below
								</p>
							</div>

							{/* Daily Stock Note */}
							<div className="space-y-2">
								<Label htmlFor="daily-stock-note">Stock Limit Note (Optional)</Label>
								<Textarea
									id="daily-stock-note"
									placeholder="e.g., Stock limited per day - select your delivery date carefully"
									value={localConfig.dailyStockNote || ""}
									onChange={(e) =>
										setLocalConfig({
											...localConfig,
											dailyStockNote: e.target.value || undefined,
										})
									}
									rows={2}
								/>
								<p className="text-muted-foreground text-xs">
									This note will be displayed to customers during checkout
								</p>
							</div>

							{/* Date Overrides */}
							<div className="space-y-2">
								<Label>Date-Specific Overrides (Optional)</Label>
								<DailyStockOverrides
									overrides={localConfig.dailyStockOverrides || {}}
									onChange={(overrides) =>
										setLocalConfig({ ...localConfig, dailyStockOverrides: overrides })
									}
								/>
							</div>
						</>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={localConfig.hasDailyStockLimit && !localConfig.defaultMaxOrdersPerDay}
					>
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
