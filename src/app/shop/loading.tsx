import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function ShopLoading() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<Skeleton className="h-10 w-64" />
				<Skeleton className="mt-2 h-4 w-96" />
			</div>

			{/* Category tabs skeleton */}
			<div className="mb-6 flex gap-4">
				<Skeleton className="h-10 w-full max-w-md" />
				<Skeleton className="ml-auto h-10 w-24" />
			</div>

			{/* Product grid skeleton */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Card key={i} className="flex flex-col">
						<CardHeader>
							{/* Product image skeleton */}
							<Skeleton className="mb-4 aspect-square w-full rounded-lg" />
							<div className="flex items-start justify-between">
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-6 w-16" />
							</div>
							<Skeleton className="mt-2 h-4 w-full" />
							<Skeleton className="mt-1 h-4 w-3/4" />
						</CardHeader>
						<CardContent className="flex-1 space-y-3">
							<div className="flex items-center justify-between">
								<Skeleton className="h-8 w-24" />
								<Skeleton className="h-4 w-20" />
							</div>
						</CardContent>
						<CardFooter>
							<Skeleton className="h-10 w-full" />
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
