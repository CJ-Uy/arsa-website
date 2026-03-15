"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Philippine Holidays (static, update yearly or make CMS-managed) ---
const PH_HOLIDAYS: Record<string, string> = {
	// 2026 Regular Holidays
	"2026-01-01": "New Year's Day",
	"2026-04-02": "Maundy Thursday",
	"2026-04-03": "Good Friday",
	"2026-04-04": "Black Saturday",
	"2026-04-09": "Araw ng Kagitingan",
	"2026-05-01": "Labor Day",
	"2026-06-12": "Independence Day",
	"2026-08-31": "National Heroes Day",
	"2026-11-30": "Bonifacio Day",
	"2026-12-25": "Christmas Day",
	"2026-12-30": "Rizal Day",
	// 2026 Special Non-Working
	"2026-01-29": "Chinese New Year",
	"2026-02-25": "EDSA Revolution Anniversary",
	"2026-08-21": "Ninoy Aquino Day",
	"2026-11-01": "All Saints' Day",
	"2026-11-02": "All Souls' Day",
	"2026-12-24": "Christmas Eve",
	"2026-12-31": "New Year's Eve",
	// 2025 (in case they browse back)
	"2025-01-01": "New Year's Day",
	"2025-04-17": "Maundy Thursday",
	"2025-04-18": "Good Friday",
	"2025-04-19": "Black Saturday",
	"2025-04-09": "Araw ng Kagitingan",
	"2025-05-01": "Labor Day",
	"2025-06-12": "Independence Day",
	"2025-08-25": "National Heroes Day",
	"2025-11-30": "Bonifacio Day",
	"2025-12-25": "Christmas Day",
	"2025-12-30": "Rizal Day",
	"2025-01-29": "Chinese New Year",
	"2025-02-25": "EDSA Revolution Anniversary",
	"2025-08-21": "Ninoy Aquino Day",
	"2025-11-01": "All Saints' Day",
	"2025-11-02": "All Souls' Day",
	"2025-12-24": "Christmas Eve",
	"2025-12-31": "New Year's Eve",
};

type CalendarEvent = {
	id: string;
	title: string;
	date: string; // YYYY-MM-DD
	endDate?: string; // YYYY-MM-DD
	category: string;
};

type EventCalendarProps = {
	events: CalendarEvent[];
};

// Category colors for event banners
const categoryColors: Record<string, string> = {
	Social: "bg-blue-500 text-white",
	Academic: "bg-green-500 text-white",
	Entertainment: "bg-purple-500 text-white",
	Community: "bg-orange-500 text-white",
	Food: "bg-red-500 text-white",
	Meeting: "bg-indigo-500 text-white",
};

function getColor(category: string) {
	return categoryColors[category] ?? "bg-primary text-primary-foreground";
}

function toKey(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number) {
	const r = new Date(d);
	r.setDate(r.getDate() + n);
	return r;
}

function isSameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/** Build the 6×7 grid of dates for the month view */
function getCalendarGrid(year: number, month: number): Date[] {
	const first = new Date(year, month, 1);
	const startDay = first.getDay(); // 0=Sun
	const start = addDays(first, -startDay);
	const cells: Date[] = [];
	for (let i = 0; i < 42; i++) {
		cells.push(addDays(start, i));
	}
	return cells;
}

type PositionedEvent = {
	event: CalendarEvent;
	startDate: Date;
	endDate: Date;
};

export function EventCalendar({ events }: EventCalendarProps) {
	const [currentDate, setCurrentDate] = useState(() => new Date());
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();

	const grid = useMemo(() => getCalendarGrid(year, month), [year, month]);
	const today = new Date();

	// Process events into positioned multi-day banners
	const positionedEvents = useMemo(() => {
		return events.map((ev): PositionedEvent => {
			const start = new Date(ev.date + "T00:00:00");
			const end = ev.endDate ? new Date(ev.endDate + "T00:00:00") : start;
			return { event: ev, startDate: start, endDate: end };
		});
	}, [events]);

	const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
	const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
	const goToday = () => setCurrentDate(new Date());

	const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

	// For each row (week), figure out which events span into that row
	const weeks = useMemo(() => {
		const result: Date[][] = [];
		for (let i = 0; i < grid.length; i += 7) {
			result.push(grid.slice(i, i + 7));
		}
		return result;
	}, [grid]);

	return (
		<div className="w-full">
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-xl font-semibold">{monthLabel}</h3>
				<div className="flex items-center gap-1">
					<Button variant="outline" size="sm" onClick={goToday}>
						Today
					</Button>
					<Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Day headers */}
			<div className="text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-medium">
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
					<div key={d} className="py-2">
						{d}
					</div>
				))}
			</div>

			{/* Calendar grid */}
			<div className="border-l">
				{weeks.map((week, weekIdx) => (
					<WeekRow
						key={weekIdx}
						week={week}
						month={month}
						today={today}
						events={positionedEvents}
					/>
				))}
			</div>
		</div>
	);
}

function WeekRow({
	week,
	month,
	today,
	events,
}: {
	week: Date[];
	month: number;
	today: Date;
	events: PositionedEvent[];
}) {
	const weekStart = week[0];
	const weekEnd = week[6];

	// Find events that overlap this week
	const weekEvents = useMemo(() => {
		return events
			.filter((pe) => pe.startDate <= weekEnd && pe.endDate >= weekStart)
			.sort(
				(a, b) =>
					a.startDate.getTime() - b.startDate.getTime() ||
					a.event.title.localeCompare(b.event.title),
			);
	}, [events, weekStart, weekEnd]);

	// Assign rows (lanes) to events to avoid overlaps
	const lanes = useMemo(() => {
		const assigned: { pe: PositionedEvent; lane: number; colStart: number; colSpan: number }[] = [];
		const laneEnds: number[] = []; // track the last column index each lane occupies

		for (const pe of weekEvents) {
			// Clamp to this week
			const clampedStart = pe.startDate < weekStart ? weekStart : pe.startDate;
			const clampedEnd = pe.endDate > weekEnd ? weekEnd : pe.endDate;
			const colStart = clampedStart.getDay();
			const colEnd = clampedEnd.getDay();
			const colSpan = colEnd - colStart + 1;

			// Find first available lane
			let lane = 0;
			while (lane < laneEnds.length && laneEnds[lane] >= colStart) {
				lane++;
			}
			if (lane >= laneEnds.length) laneEnds.push(-1);
			laneEnds[lane] = colEnd;

			assigned.push({ pe, lane, colStart, colSpan });
		}

		return { assigned, laneCount: laneEnds.length };
	}, [weekEvents, weekStart, weekEnd]);

	return (
		<div className="grid grid-cols-7">
			{week.map((day, dayIdx) => {
				const key = toKey(day);
				const isToday = isSameDay(day, today);
				const isCurrentMonth = day.getMonth() === month;
				const holiday = PH_HOLIDAYS[key];

				return (
					<div
						key={dayIdx}
						className={cn(
							"relative min-h-[4.5rem] border-r border-b p-1 text-xs md:min-h-[5rem]",
							!isCurrentMonth && "bg-muted/30 text-muted-foreground",
						)}
					>
						{/* Date number */}
						<div className="flex items-start justify-between">
							<span
								className={cn(
									"inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
									isToday && "bg-primary text-primary-foreground",
									!isToday && holiday && "font-semibold text-red-500",
								)}
							>
								{day.getDate()}
							</span>
						</div>

						{/* Holiday label */}
						{holiday && (
							<div
								className="mt-0.5 truncate text-[10px] leading-tight font-medium text-red-500"
								title={holiday}
							>
								{holiday}
							</div>
						)}

						{/* Event banners for this day */}
						<div className="mt-0.5 space-y-0.5">
							{lanes.assigned
								.filter((a) => {
									// Show banner start on this day (or first day of week if continues from prior week)
									return a.colStart === dayIdx;
								})
								.map((a) => {
									const spanPx = a.colSpan > 1;
									return (
										<div
											key={a.pe.event.id}
											className={cn(
												"truncate rounded-sm px-1 py-0.5 text-[10px] leading-tight font-medium",
												getColor(a.pe.event.category),
												spanPx && "absolute z-10",
											)}
											style={
												spanPx
													? {
															left: 0,
															right: `calc(-${(a.colSpan - 1) * 100}% - ${a.colSpan - 1}px)`,
															marginTop: `${a.lane * 18}px`,
														}
													: undefined
											}
											title={`${a.pe.event.title} (${a.pe.startDate.toLocaleDateString()} – ${a.pe.endDate.toLocaleDateString()})`}
										>
											{a.pe.event.title}
										</div>
									);
								})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
