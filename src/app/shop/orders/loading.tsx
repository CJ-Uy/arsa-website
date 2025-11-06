import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrdersLoading() {
	return (
		<div className="container mx-auto px-4 py-8">
			<Skeleton className="mb-8 h-10 w-48" />

			<div className="space-y-6">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="space-y-2">
									<Skeleton className="h-6 w-32" />
									<Skeleton className="h-4 w-48" />
								</div>
								<Skeleton className="h-6 w-20" />
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Order items */}
							{Array.from({ length: 2 }).map((_, j) => (
								<div key={j} className="flex gap-4 py-2">
									<Skeleton className="h-16 w-16 rounded" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-5 w-40" />
										<Skeleton className="h-4 w-24" />
									</div>
									<Skeleton className="h-5 w-16" />
								</div>
							))}
							<div className="border-t pt-4">
								<div className="flex justify-between">
									<Skeleton className="h-6 w-24" />
									<Skeleton className="h-6 w-20" />
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
