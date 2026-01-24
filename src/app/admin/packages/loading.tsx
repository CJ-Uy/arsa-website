import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function AdminPackagesLoading() {
	return (
		<div>
			<div className="mb-6">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="mt-2 h-5 w-80" />
			</div>

			{/* Action bar */}
			<div className="mb-6 flex justify-end">
				<Skeleton className="h-10 w-36" />
			</div>

			{/* Packages grid skeleton */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="mb-4 aspect-square w-full rounded-lg" />
							<Skeleton className="h-6 w-3/4" />
							<Skeleton className="mt-2 h-4 w-full" />
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex justify-between">
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-5 w-16" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</CardContent>
						<CardFooter className="flex gap-2">
							<Skeleton className="h-9 flex-1" />
							<Skeleton className="h-9 w-9" />
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
