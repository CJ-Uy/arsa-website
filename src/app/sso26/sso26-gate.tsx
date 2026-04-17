"use client";

import Image from "next/image";
import { signIn, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const SSO_LOGO = "/images/major event landing/2026/sso/Long_Logo_White-removebg-preview.webp";

interface SSO26GateProps {
	wrongDomain?: boolean;
	email?: string;
	callbackURL: string;
}

export function SSO26Gate({ wrongDomain, email, callbackURL }: SSO26GateProps) {
	const handleSignIn = () => {
		signIn.social({ provider: "google", callbackURL });
	};

	const handleSignOut = async () => {
		await signOut();
		window.location.reload();
	};

	return (
		<div
			className="flex min-h-screen flex-col items-center justify-center px-4"
			style={{
				background:
					"linear-gradient(180deg, #2d3a44 0%, #4e6a70 40%, #7a8e88 70%, #C2A785 100%)",
			}}
		>
			{/* Scrapbook paper texture */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.06]"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
				}}
			/>

			<div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
				<div className="mb-8 w-64 sm:w-80">
					<Image
						src={SSO_LOGO}
						alt="SSO 2026"
						width={500}
						height={160}
						className="h-full w-full object-contain drop-shadow-2xl"
						priority
					/>
				</div>

				{wrongDomain ? (
					<div className="w-full rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
						<div className="mb-2 text-4xl">⚠️</div>
						<h2 className="mb-2 font-[family-name:var(--font-farm-to-market)] text-2xl font-bold text-white">
							Wrong Account
						</h2>
						<p className="mb-1 font-[family-name:var(--font-farm-to-market)] text-white/80">
							You&apos;re signed in as:
						</p>
						<p className="mb-4 rounded-lg bg-white/10 px-4 py-2 font-mono text-sm text-white">
							{email}
						</p>
						<p className="mb-6 font-[family-name:var(--font-farm-to-market)] text-white/80">
							This form is only for{" "}
							<span className="font-semibold text-[#C89D58]">@student.ateneo.edu</span> and{" "}
							<span className="font-semibold text-[#C89D58]">@ateneo.edu</span> accounts.
							Please sign out and log in with your Ateneo email.
						</p>
						<Button
							onClick={handleSignOut}
							className="w-full bg-white/20 font-[family-name:var(--font-farm-to-market)] text-base text-white hover:bg-white/30"
						>
							<LogOut className="mr-2 h-4 w-4" />
							Sign Out
						</Button>
					</div>
				) : (
					<div className="w-full rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
						<h2 className="mb-2 font-[family-name:var(--font-gentlemens-script)] text-4xl text-white">
							Sign in to continue
						</h2>
						<p className="mb-6 font-[family-name:var(--font-farm-to-market)] text-white/70">
							Use your{" "}
							<span className="font-semibold text-[#C89D58]">@student.ateneo.edu</span> or{" "}
							<span className="font-semibold text-[#C89D58]">@ateneo.edu</span> account.
						</p>
						<Button
							onClick={handleSignIn}
							size="lg"
							className="w-full bg-white font-[family-name:var(--font-farm-to-market)] text-base tracking-wide text-[#374752] hover:bg-white/90"
						>
							<svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									fill="#EA4335"
								/>
							</svg>
							Continue with Google
						</Button>
					</div>
				)}

				{/* Washi tape decorative strip */}
				<div className="absolute -top-3 left-8 h-5 w-24 rotate-[-2deg] bg-[#C89D58]/40" />
				<div className="absolute -top-2 right-12 h-5 w-16 rotate-[3deg] bg-[#859893]/40" />
			</div>
		</div>
	);
}
