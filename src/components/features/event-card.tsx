import { Calendar, MapPin, Users, Clock, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
	event: {
		id: number;
		title: string;
		date: string;
		time: string;
		location: string;
		description: string;
		attendees: number;
		maxCapacity: number;
		category: string;
		featured?: boolean;
		googleFormUrl?: string;
	};
	variant?: "default" | "featured";
}

export function EventCard({ event, variant = "default" }: EventCardProps) {
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			weekday: "short",
		});
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "Social":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "Academic":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "Entertainment":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "Community":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			case "Food":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "Meeting":
				return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
		}
	};

	if (variant === "featured") {
		return (
			<div className="bg-card/95 border-border rounded-lg border p-6 shadow-xl backdrop-blur-sm">
				<div className="mb-4 flex items-center justify-between">
					<Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
					<Badge variant="secondary">
						<Star className="mr-1 h-3 w-3" />
						Featured
					</Badge>
				</div>
				<h3 className="text-card-foreground mb-2 text-xl font-bold">{event.title}</h3>
				<p className="text-muted-foreground mb-4">{event.description}</p>
				<div className="mb-4 space-y-2">
					<div className="text-muted-foreground flex items-center text-sm">
						<Calendar className="mr-2 h-4 w-4" />
						{formatDate(event.date)} at {event.time}
					</div>
					<div className="text-muted-foreground flex items-center text-sm">
						<MapPin className="mr-2 h-4 w-4" />
						{event.location}
					</div>
					<div className="text-muted-foreground flex items-center text-sm">
						<Users className="mr-2 h-4 w-4" />
						{event.attendees}/{event.maxCapacity} attending
					</div>
				</div>
				<Button className="w-full" asChild>
					<a
						href={event.googleFormUrl || "#"}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center"
					>
						<span>Join Event</span>
						<ArrowRight className="ml-2 h-4 w-4" />
					</a>
				</Button>
			</div>
		);
	}

	return (
		<div className="bg-card border-border rounded-lg border transition-shadow hover:shadow-lg">
			<div className="p-6">
				<div className="mb-2 flex items-center justify-between">
					<Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
					<div className="text-muted-foreground text-sm">{formatDate(event.date)}</div>
				</div>
				<h3 className="text-card-foreground mb-2 text-lg font-semibold">{event.title}</h3>
				<p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{event.description}</p>
				<div className="mb-4 space-y-2">
					<div className="text-muted-foreground flex items-center text-sm">
						<Clock className="mr-2 h-4 w-4" />
						{event.time}
					</div>
					<div className="text-muted-foreground flex items-center text-sm">
						<MapPin className="mr-2 h-4 w-4" />
						{event.location}
					</div>
					<div className="text-muted-foreground flex items-center text-sm">
						<Users className="mr-2 h-4 w-4" />
						{event.attendees}/{event.maxCapacity} attending
					</div>
				</div>
				<Button size="sm" className="w-full" asChild>
					<a
						href={event.googleFormUrl || "#"}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center"
					>
						Join Event
						<ArrowRight className="ml-2 h-4 w-4" />
					</a>
				</Button>
			</div>
		</div>
	);
}
