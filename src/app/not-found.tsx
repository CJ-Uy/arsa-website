"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
	return (
		<div className="bg-background flex min-h-screen items-center justify-center px-4">
			<div className="mx-auto max-w-2xl text-center">
				{/* 404 Number */}
				<div className="mb-8">
					<h1 className="text-primary/20 text-9xl font-bold select-none">404</h1>
				</div>

				{/* Main Message */}
				<div className="mb-8">
					<h2 className="text-foreground mb-4 text-3xl font-bold">Oops! Page Not Found</h2>
					<p className="text-muted-foreground text-lg">
						The page you&apos;re looking for seems to have wandered off somewhere in ARSA.
						Don&apos;t worry, we&apos;ll help you find your way back home!
					</p>
				</div>

				{/* Action Buttons */}
				<div className="mb-8 flex justify-center">
					<Button size="lg" asChild>
						<Link href="/" className="flex items-center">
							<Home className="mr-2 h-5 w-5" />
							Go Home
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
