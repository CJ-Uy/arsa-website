"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

type UnauthorizedProps = {
	isLoggedIn: boolean;
};

export function Unauthorized({ isLoggedIn }: UnauthorizedProps) {
	const [signingIn, setSigningIn] = useState(false);

	const handleSignIn = async () => {
		setSigningIn(true);
		try {
			await signIn.social({
				provider: "google",
				callbackURL: "/redirects",
			});
		} catch (error) {
			setSigningIn(false);
		}
	};
	return (
		<div className="container mx-auto flex min-h-[80vh] items-center justify-center py-10">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
						<Shield className="text-muted-foreground h-8 w-8" />
					</div>
					<CardTitle className="text-2xl">Access Restricted</CardTitle>
					<CardDescription>
						{isLoggedIn
							? "You don't have permission to access the redirects dashboard."
							: "Please sign in with your student email to continue."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{!isLoggedIn ? (
						<>
							<p className="text-muted-foreground text-center text-sm">
								Sign in with your <span className="text-foreground font-semibold">email</span> and
								contact an administrator to request redirects admin access.
							</p>
							<Button onClick={handleSignIn} className="w-full" disabled={signingIn}>
								{signingIn ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Signing In...
									</>
								) : (
									"Sign In with Google"
								)}
							</Button>
						</>
					) : (
						<>
							<p className="text-muted-foreground text-center text-sm">
								Contact an administrator to request redirects admin access for your account.
							</p>
							<Link href="/shop" className="block">
								<Button variant="outline" className="w-full">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Shop
								</Button>
							</Link>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
