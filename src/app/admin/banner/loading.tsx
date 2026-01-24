import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminBannerLoading() {
	return (
		<div>
			{/* Header and create button */}
			<div className="mb-6 flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-48" />
					<Skeleton className="mt-2 h-5 w-64" />
				</div>
				<Skeleton className="h-10 w-36" />
			</div>

			{/* Banners list skeleton */}
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Skeleton className="h-6 w-6 rounded-full" />
									<Skeleton className="h-5 w-16 rounded-full" />
								</div>
								<div className="flex items-center gap-2">
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-8" />
									<Skeleton className="h-8 w-8" />
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<Skeleton className="h-5 w-full" />
							<Skeleton className="h-5 w-4/5" />
							<div className="flex items-center gap-2 pt-2">
								<Skeleton className="h-4 w-4" />
								<Skeleton className="h-4 w-40" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
