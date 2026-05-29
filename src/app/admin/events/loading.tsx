import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminEventsLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-40" />
				</div>
				<Skeleton className="h-9 w-28" />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<div className="flex items-start justify-between gap-2">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-5 w-14 rounded-full" />
							</div>
							<Skeleton className="h-3 w-1/2 mt-1" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-3 w-2/3" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
