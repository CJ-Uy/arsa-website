import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminOrdersLoading() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>

			{/* Tabs skeleton */}
			<Skeleton className="mb-6 h-10 w-full max-w-md" />

			{/* Orders table skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center gap-4 border-b pb-4 last:border-0">
								<Skeleton className="h-12 w-12 rounded" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-48" />
									<Skeleton className="h-4 w-32" />
								</div>
								<Skeleton className="h-6 w-20" />
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-8 w-8 rounded" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
