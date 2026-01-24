"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, AlertCircle, CheckCircle } from "lucide-react";
import {
	calculateDeliverySchedule,
	formatDeliveryDate,
	getDeliveryMessage,
	isValidDeliveryDate,
	getDeliveryDateOptions,
	type ShopEvent,
} from "@/lib/deliveryScheduling";

type DeliveryScheduleSelectorProps = {
	event: ShopEvent;
	onDeliveryChange?: (deliveryDate: Date | null, timeSlot: string | null) => void;
	required?: boolean;
};

export function DeliveryScheduleSelector({
	event,
	onDeliveryChange,
	required = false,
}: DeliveryScheduleSelectorProps) {
	const [schedule, setSchedule] = useState(() => calculateDeliverySchedule(event));
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

	// Recalculate schedule every minute (in case cutoff time passes)
	useEffect(() => {
		const interval = setInterval(() => {
			setSchedule(calculateDeliverySchedule(event));
		}, 60000); // Every minute

		return () => clearInterval(interval);
	}, [event]);

	// Auto-select suggested delivery date if not allowing custom selection
	useEffect(() => {
		if (!event.allowScheduledDelivery && schedule.canOrder) {
			setSelectedDate(schedule.suggestedDeliveryDate);
			onDeliveryChange?.(schedule.suggestedDeliveryDate, selectedTimeSlot);
		}
	}, [event.allowScheduledDelivery, schedule, selectedTimeSlot, onDeliveryChange]);

	// Notify parent of changes
	useEffect(() => {
		if (event.allowScheduledDelivery) {
			onDeliveryChange?.(selectedDate, selectedTimeSlot);
		}
	}, [selectedDate, selectedTimeSlot, event.allowScheduledDelivery, onDeliveryChange]);

	// Shop is closed
	if (!schedule.canOrder) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>{schedule.reason}</AlertDescription>
			</Alert>
		);
	}

	// Automatic delivery scheduling (no customer choice)
	if (!event.allowScheduledDelivery) {
		return (
			<Alert>
				<CheckCircle className="h-4 w-4" />
				<AlertDescription>
					<div className="space-y-1">
						<p className="font-medium">{getDeliveryMessage(schedule)}</p>
						{schedule.isPastCutoff && schedule.cutoffTime && (
							<p className="text-muted-foreground text-sm">
								Orders placed before {schedule.cutoffTime} will be delivered sooner.
							</p>
						)}
					</div>
				</AlertDescription>
			</Alert>
		);
	}

	// Customer can select delivery date and time
	const availableDates = getDeliveryDateOptions(event, 7);

	return (
		<Card className="border-primary/50 bg-primary/5">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CalendarIcon className="h-5 w-5" />
					Delivery Schedule
				</CardTitle>
				<CardDescription>{getDeliveryMessage(schedule)}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Delivery Date Selection */}
				<div className="space-y-2">
					<Label htmlFor="delivery-date">
						Delivery Date {required && <span className="text-destructive">*</span>}
					</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline" className="w-full justify-start text-left font-normal">
								<CalendarIcon className="mr-2 h-4 w-4" />
								{selectedDate ? formatDeliveryDate(selectedDate) : "Select delivery date"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={selectedDate || undefined}
								onSelect={(date) => {
									if (date) {
										const validation = isValidDeliveryDate(date, event);
										if (validation.valid) {
											setSelectedDate(date);
										}
									}
								}}
								disabled={(date) => {
									const validation = isValidDeliveryDate(date, event);
									return !validation.valid;
								}}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
					{schedule.isPastCutoff && schedule.cutoffTime && (
						<p className="text-muted-foreground flex items-start gap-1 text-sm">
							<AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
							<span>
								Cutoff time ({schedule.cutoffTime}) has passed. Earliest delivery is{" "}
								{formatDeliveryDate(schedule.suggestedDeliveryDate)}.
							</span>
						</p>
					)}
				</div>

				{/* Time Slot Selection */}
				<div className="space-y-2">
					<Label htmlFor="time-slot">
						Delivery Time {required && <span className="text-destructive">*</span>}
					</Label>
					<Select value={selectedTimeSlot || ""} onValueChange={setSelectedTimeSlot}>
						<SelectTrigger>
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								<SelectValue placeholder="Select delivery time" />
							</div>
						</SelectTrigger>
						<SelectContent>
							{schedule.availableTimeSlots.map((slot) => (
								<SelectItem key={slot} value={slot}>
									{slot}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Summary */}
				{selectedDate && selectedTimeSlot && (
					<Alert>
						<CheckCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>Delivery scheduled for:</strong>
							<br />
							{formatDeliveryDate(selectedDate)} - {selectedTimeSlot}
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
