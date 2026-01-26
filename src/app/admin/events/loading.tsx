import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function AdminEventsLoading() {
	return (
		<div>
			<div className="mb-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="mt-2 h-5 w-96" />
			</div>

			{/* Action bar */}
			<div className="mb-6 flex justify-end">
				<Skeleton className="h-10 w-36" />
			</div>

			{/* Events grid skeleton */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i} className="overflow-hidden">
						{/* Hero image area */}
						<Skeleton className="h-40 w-full rounded-t-lg rounded-b-none" />
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<Skeleton className="h-6 w-2/3" />
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>
							<Skeleton className="mt-1 h-4 w-full" />
						</CardHeader>
						<CardContent className="space-y-3 pb-2">
							<div className="flex gap-2">
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-5 w-20" />
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div>
									<Skeleton className="h-3 w-12" />
									<Skeleton className="mt-1 h-4 w-20" />
								</div>
								<div>
									<Skeleton className="h-3 w-12" />
									<Skeleton className="mt-1 h-4 w-20" />
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-24" />
							</div>
						</CardContent>
						<CardFooter className="flex gap-2 pt-2">
							<Skeleton className="h-9 flex-1" />
							<Skeleton className="h-9 w-9" />
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
