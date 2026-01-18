"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getRedirectAnalytics, type RedirectAnalytics, type TimeRange } from "./actions";
import { ExternalLink, TrendingUp, Calendar, BarChart3 } from "lucide-react";

type Redirect = {
	id: string;
	newURL: string;
	redirectCode: string;
	clicks: number;
	createdAt: Date;
};

type AnalyticsModalProps = {
	redirect: Redirect | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const timeRangeOptions: { value: TimeRange; label: string }[] = [
	{ value: "24h", label: "Last 24 Hours" },
	{ value: "7d", label: "Last 7 Days" },
	{ value: "30d", label: "Last 30 Days" },
];

export function AnalyticsModal({ redirect, open, onOpenChange }: AnalyticsModalProps) {
	const [analytics, setAnalytics] = useState<RedirectAnalytics | null>(null);
	const [loading, setLoading] = useState(false);
	const [timeRange, setTimeRange] = useState<TimeRange>("7d");

	const loadAnalytics = async (redirectId: string, range: TimeRange) => {
		setLoading(true);
		const result = await getRedirectAnalytics(redirectId, range);
		if (result.success) {
			setAnalytics(result.data);
		} else {
			toast.error(result.message);
		}
		setLoading(false);
	};

	// Load analytics when modal opens or time range changes
	useEffect(() => {
		if (open && redirect) {
			loadAnalytics(redirect.id, timeRange);
		} else if (!open) {
			setAnalytics(null);
			setTimeRange("7d");
		}
	}, [open, redirect, timeRange]);

	const handleOpenChange = (newOpen: boolean) => {
		onOpenChange(newOpen);
	};

	const formatDate = (dateStr: string) => {
		// Handle hourly format (YYYY-MM-DDTHH)
		if (dateStr.includes("T")) {
			const date = new Date(dateStr + ":00:00Z");
			return date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
		}
		// Handle daily format (YYYY-MM-DD)
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	};

	const formatTooltipLabel = (dateStr: string) => {
		if (dateStr.includes("T")) {
			const date = new Date(dateStr + ":00:00Z");
			return date.toLocaleString("en-US", {
				month: "short",
				day: "numeric",
				hour: "numeric",
				hour12: true,
			});
		}
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	const getTimeRangeLabel = () => {
		switch (timeRange) {
			case "24h":
				return "24 hours";
			case "7d":
				return "7 days";
			case "30d":
				return "30 days";
		}
	};

	const getAvgLabel = () => {
		return timeRange === "24h" ? "Avg/Hour" : "Avg/Day";
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-2xl overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Analytics for /{redirect?.redirectCode}
					</DialogTitle>
				</DialogHeader>

				<div className="max-h-[70vh] overflow-y-auto pr-2">
					{loading ? (
						<div className="space-y-4">
							<div className="grid grid-cols-3 gap-3">
								<Skeleton className="h-20" />
								<Skeleton className="h-20" />
								<Skeleton className="h-20" />
							</div>
							<Skeleton className="h-[200px]" />
						</div>
					) : analytics ? (
						<div className="space-y-4">
							{/* Redirect Info */}
							<div className="rounded-lg border p-3">
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0 flex-1 space-y-1">
										<p className="text-muted-foreground text-xs">Destination URL</p>
										<a
											href={analytics.redirect.newURL}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-1 text-sm hover:underline"
										>
											<span className="truncate">{analytics.redirect.newURL}</span>
											<ExternalLink className="h-3 w-3 flex-shrink-0" />
										</a>
									</div>
									<div className="flex-shrink-0 text-right">
										<p className="text-muted-foreground text-xs">Created</p>
										<p className="text-sm">
											{new Date(analytics.redirect.createdAt).toLocaleDateString()}
										</p>
									</div>
								</div>
							</div>

							{/* Time Range Selector */}
							<div className="flex gap-2">
								{timeRangeOptions.map((option) => (
									<Button
										key={option.value}
										variant={timeRange === option.value ? "default" : "outline"}
										size="sm"
										onClick={() => setTimeRange(option.value)}
									>
										{option.label}
									</Button>
								))}
							</div>

							{/* Stats Cards */}
							<div className="grid grid-cols-3 gap-3">
								<div className="rounded-lg border p-3">
									<div className="flex items-center gap-1.5">
										<TrendingUp className="text-muted-foreground h-3.5 w-3.5" />
										<p className="text-muted-foreground text-xs">Total ({getTimeRangeLabel()})</p>
									</div>
									<p className="mt-1.5 text-xl font-bold">{analytics.totalClicks}</p>
								</div>
								<div className="rounded-lg border p-3">
									<div className="flex items-center gap-1.5">
										<BarChart3 className="text-muted-foreground h-3.5 w-3.5" />
										<p className="text-muted-foreground text-xs">{getAvgLabel()}</p>
									</div>
									<p className="mt-1.5 text-xl font-bold">{analytics.avgClicks.toFixed(1)}</p>
								</div>
								<div className="rounded-lg border p-3">
									<div className="flex items-center gap-1.5">
										<Calendar className="text-muted-foreground h-3.5 w-3.5" />
										<p className="text-muted-foreground text-xs">Peak</p>
									</div>
									<p className="mt-1.5 text-xl font-bold">{analytics.peakPeriod?.clicks ?? 0}</p>
									{analytics.peakPeriod && analytics.peakPeriod.clicks > 0 && (
										<p className="text-muted-foreground text-xs">
											{formatTooltipLabel(analytics.peakPeriod.date)}
										</p>
									)}
								</div>
							</div>

							{/* Chart */}
							<div className="rounded-lg border p-3">
								<h3 className="mb-3 text-sm font-medium">Clicks over {getTimeRangeLabel()}</h3>
								<div className="h-[200px] w-full">
									<ResponsiveContainer width="100%" height="100%">
										<LineChart
											data={analytics.clickData}
											margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
										>
											<CartesianGrid strokeDasharray="3 3" vertical={false} />
											<XAxis
												dataKey="date"
												tickFormatter={formatDate}
												tick={{ fontSize: 10 }}
												tickLine={false}
												axisLine={false}
												tickMargin={8}
												interval="preserveStartEnd"
											/>
											<YAxis
												tick={{ fontSize: 10 }}
												tickLine={false}
												axisLine={false}
												allowDecimals={false}
												width={35}
											/>
											<Tooltip
												labelFormatter={(value: string) => formatTooltipLabel(value)}
												formatter={(value: number) => [value, "Clicks"]}
											/>
											<Line
												type="monotone"
												dataKey="clicks"
												stroke="var(--secondary)"
												strokeWidth={2}
												dot={{ r: 3, fill: "var(--primary)" }}
												activeDot={{ r: 5 }}
												connectNulls
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
							</div>
						</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
