import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function AdminProductsLoading() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<Skeleton className="h-10 w-56" />
				<Skeleton className="h-10 w-40" />
			</div>

			{/* Products grid skeleton */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="mb-4 aspect-square w-full rounded-lg" />
							<Skeleton className="h-6 w-3/4" />
							<Skeleton className="mt-2 h-4 w-full" />
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex justify-between">
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-5 w-16" />
							</div>
							<Skeleton className="h-4 w-32" />
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
