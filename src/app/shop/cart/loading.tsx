import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CartLoading() {
	return (
		<div className="container mx-auto px-4 py-8">
			<Skeleton className="mb-8 h-10 w-48" />

			<div className="grid gap-8 lg:grid-cols-3">
				{/* Cart items skeleton */}
				<div className="space-y-4 lg:col-span-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="p-6">
								<div className="flex gap-4">
									<Skeleton className="h-24 w-24 rounded-lg" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-6 w-48" />
										<Skeleton className="h-4 w-32" />
										<div className="flex items-center gap-2">
											<Skeleton className="h-8 w-8" />
											<Skeleton className="h-6 w-8" />
											<Skeleton className="h-8 w-8" />
										</div>
									</div>
									<Skeleton className="h-6 w-20" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Order summary skeleton */}
				<div>
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<div className="flex justify-between">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-4 w-16" />
								</div>
								<div className="flex justify-between">
									<Skeleton className="h-5 w-24" />
									<Skeleton className="h-5 w-20" />
								</div>
							</div>
							<Skeleton className="h-10 w-full" />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
