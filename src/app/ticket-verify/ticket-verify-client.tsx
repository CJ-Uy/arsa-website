"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { signIn } from "@/lib/auth-client";
import { scanTicket } from "./actions";
import {
	Camera,
	KeyboardIcon,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	Loader2,
	RotateCcw,
	Shield,
	ScanLine,
} from "lucide-react";

type TicketInfo = {
	shortCode: string;
	email: string;
	eventName: string;
	scannedAt: string | null;
	scannedBy: { name: string | null; email: string } | null;
};

type ScanResult = {
	status: "success" | "already_scanned" | "not_found" | "forbidden" | "error";
	message: string;
	ticket?: TicketInfo;
} | null;

type Props = {
	isLoggedIn: boolean;
	hasAccess: boolean;
	currentUser: { name: string | null; email: string } | null;
	assignedEvents: { id: string; name: string; isActive: boolean }[];
	isAdmin?: boolean;
};

export function TicketVerifyClient({
	isLoggedIn,
	hasAccess,
	currentUser,
	assignedEvents,
	isAdmin,
}: Props) {
	const [mode, setMode] = useState<"camera" | "manual">("manual");
	const [manualCode, setManualCode] = useState("");
	const [suggestions, setSuggestions] = useState<
		{ shortCode: string; email: string; scanned: boolean; ticketEvent: { name: string } }[]
	>([]);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);
	const [scanning, setScanning] = useState(false);
	const [result, setResult] = useState<ScanResult>(null);
	const [signingIn, setSigningIn] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);

	const videoRef = useRef<HTMLVideoElement>(null);
	const scannerRef = useRef<{ stop: () => void } | null>(null);
	const lastScannedRef = useRef<string>("");

	// ── Not Logged In ────────────────────────────────────────
	if (!isLoggedIn) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
							<Shield className="text-muted-foreground h-8 w-8" />
						</div>
						<CardTitle>Ticket Verification</CardTitle>
						<CardDescription>Sign in to verify tickets</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							className="w-full"
							disabled={signingIn}
							onClick={async () => {
								setSigningIn(true);
								try {
									await signIn.social({ provider: "google", callbackURL: "/ticket-verify" });
								} catch {
									setSigningIn(false);
								}
							}}
						>
							{signingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							Sign In with Google
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// ── No Access ────────────────────────────────────────────
	if (!hasAccess) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
							<AlertTriangle className="h-8 w-8 text-yellow-600" />
						</div>
						<CardTitle>Not Authorized</CardTitle>
						<CardDescription>
							You are not assigned as a ticket verifier for any events. Contact an admin to get
							access.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<p className="text-muted-foreground text-sm">Signed in as {currentUser?.email}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// ── Handle Scan ──────────────────────────────────────────
	const handleScan = async (code: string) => {
		if (!code.trim() || scanning) return;
		// Debounce repeated scans of same code
		if (code.toUpperCase() === lastScannedRef.current && result) return;

		setScanning(true);
		setResult(null);
		setSuggestions([]);
		lastScannedRef.current = code.toUpperCase();

		try {
			const res = await scanTicket(code);
			if (res.success) {
				setResult({
					status: "success",
					message: res.message,
					ticket: res.ticket as TicketInfo,
				});
			} else {
				const statusMap: Record<string, ScanResult["status"]> = {
					ALREADY_SCANNED: "already_scanned",
					NOT_FOUND: "not_found",
					FORBIDDEN: "forbidden",
				};
				setResult({
					status: statusMap[res.code || ""] || "error",
					message: res.message,
					ticket: res.ticket as TicketInfo | undefined,
				});
			}
		} catch {
			setResult({ status: "error", message: "An unexpected error occurred" });
		} finally {
			setScanning(false);
		}
	};

	// ── Camera Scanner ───────────────────────────────────────
	const startCamera = async () => {
		setCameraError(null);
		try {
			const { Scanner } = await import("@yudiel/react-qr-scanner");
			// The Scanner component handles everything — we just need to set mode
			setMode("camera");
		} catch {
			setCameraError("Failed to initialize camera scanner");
		}
	};

	const stopCamera = () => {
		if (scannerRef.current) {
			scannerRef.current.stop();
			scannerRef.current = null;
		}
		setMode("manual");
	};

	// ── Autocomplete ─────────────────────────────────────────
	const handleManualInput = async (value: string) => {
		setManualCode(value);
		if (value.length >= 3) {
			setLoadingSuggestions(true);
			try {
				const res = await fetch(`/api/tickets/suggest?q=${encodeURIComponent(value)}`);
				const data = await res.json();
				setSuggestions(data.suggestions || []);
			} catch {
				setSuggestions([]);
			} finally {
				setLoadingSuggestions(false);
			}
		} else {
			setSuggestions([]);
		}
	};

	const handleReset = () => {
		setResult(null);
		setManualCode("");
		setSuggestions([]);
		lastScannedRef.current = "";
	};

	// ── QR Scan Handler ──────────────────────────────────────
	const handleQrResult = (text: string) => {
		// Extract shortCode from URL like https://domain.com/ticket-verify?t=ABCD1234
		try {
			const url = new URL(text);
			const shortCode = url.searchParams.get("t");
			if (shortCode) {
				handleScan(shortCode);
				return;
			}
		} catch {
			// Not a URL — try using the text directly as a short code
		}
		// Fallback: use the raw text as the code
		handleScan(text);
	};

	return (
		<>
			<div className="flex min-h-screen flex-col items-center bg-gray-50 p-4 pt-8">
				{/* Header */}
				<div className="mb-6 w-full max-w-md text-center">
					<h1 className="text-2xl font-bold">Ticket Verification</h1>
					<p className="text-muted-foreground text-sm">
						{isAdmin
							? "Admin access — all events"
							: `${assignedEvents.length} event${assignedEvents.length !== 1 ? "s" : ""} assigned`}
					</p>
				</div>

				{/* Mode Toggle */}
				<div className="mb-4 flex w-full max-w-md gap-2">
					<Button
						variant={mode === "camera" ? "default" : "outline"}
						className="flex-1"
						onClick={() => (mode === "camera" ? stopCamera() : startCamera())}
					>
						<Camera className="mr-2 h-4 w-4" />
						Camera
					</Button>
					<Button
						variant={mode === "manual" ? "default" : "outline"}
						className="flex-1"
						onClick={() => {
							stopCamera();
							setMode("manual");
						}}
					>
						<KeyboardIcon className="mr-2 h-4 w-4" />
						Manual
					</Button>
				</div>

				{/* Scanner Area */}
				<Card className="mb-4 w-full max-w-md">
					<CardContent className="p-4">
						{mode === "camera" ? (
							<CameraScanner onResult={handleQrResult} />
						) : (
							<div className="space-y-2">
								<div className="relative">
									<Input
										placeholder="Enter ticket code (e.g., A3F8K2M1)"
										value={manualCode}
										onChange={(e) => handleManualInput(e.target.value.toUpperCase())}
										onKeyDown={(e) => {
											if (e.key === "Enter") handleScan(manualCode);
										}}
										className="font-mono text-lg tracking-wider uppercase"
										autoFocus
									/>
									{loadingSuggestions && (
										<Loader2 className="text-muted-foreground absolute top-3 right-3 h-4 w-4 animate-spin" />
									)}
								</div>

								{/* Suggestions */}
								{suggestions.length > 0 && (
									<div className="max-h-40 overflow-auto rounded-md border">
										{suggestions.map((s) => (
											<div
												key={s.shortCode}
												className="hover:bg-muted/50 flex cursor-pointer items-center justify-between px-3 py-2 text-sm"
												onClick={() => {
													setManualCode(s.shortCode);
													setSuggestions([]);
													handleScan(s.shortCode);
												}}
											>
												<div className="flex items-center gap-2">
													<code className="font-mono font-medium">{s.shortCode}</code>
													<span className="text-muted-foreground text-xs">{s.email}</span>
												</div>
												{s.scanned ? (
													<Badge variant="secondary" className="text-xs">
														Scanned
													</Badge>
												) : (
													<Badge variant="outline" className="text-xs">
														Unused
													</Badge>
												)}
											</div>
										))}
									</div>
								)}

								<Button
									className="w-full"
									onClick={() => handleScan(manualCode)}
									disabled={!manualCode.trim() || scanning}
								>
									{scanning ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<ScanLine className="mr-2 h-4 w-4" />
									)}
									Verify Ticket
								</Button>
							</div>
						)}

						{cameraError && <p className="mt-2 text-center text-sm text-red-500">{cameraError}</p>}
					</CardContent>
				</Card>
			</div>

			{/* Fullscreen Loading Overlay */}
			{scanning && !result && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-500">
					<div className="text-center text-white">
						<Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin" />
						<p className="text-2xl font-bold">Verifying...</p>
					</div>
				</div>
			)}

			{/* Fullscreen Result Overlay */}
			{result && (
				<div
					className={`fixed inset-0 z-50 flex flex-col ${
						result.status === "success"
							? "bg-green-500"
							: result.status === "already_scanned"
								? "bg-yellow-500"
								: "bg-red-500"
					}`}
				>
					<div className="flex flex-1 flex-col items-center justify-center p-6 text-white">
						{result.status === "success" ? (
							<CheckCircle2 className="mb-6 h-32 w-32" />
						) : result.status === "already_scanned" ? (
							<AlertTriangle className="mb-6 h-32 w-32" />
						) : (
							<XCircle className="mb-6 h-32 w-32" />
						)}

						<h1 className="mb-2 text-center text-4xl font-bold">
							{result.status === "success"
								? "Valid Ticket"
								: result.status === "already_scanned"
									? "Already Scanned"
									: result.status === "not_found"
										? "Not Found"
										: result.status === "forbidden"
											? "Not Authorized"
											: "Error"}
						</h1>
						<p className="mb-8 text-center text-lg opacity-90">{result.message}</p>

						{result.ticket && (
							<div className="w-full max-w-sm space-y-2 rounded-xl bg-white/20 p-5 backdrop-blur-sm">
								<div className="flex justify-between">
									<span className="opacity-80">Code</span>
									<code className="font-mono font-bold">{result.ticket.shortCode}</code>
								</div>
								<div className="flex justify-between">
									<span className="opacity-80">Email</span>
									<span className="text-right font-medium">{result.ticket.email}</span>
								</div>
								<div className="flex justify-between">
									<span className="opacity-80">Event</span>
									<span className="font-medium">{result.ticket.eventName}</span>
								</div>
								{result.status === "already_scanned" && result.ticket.scannedAt && (
									<>
										<div className="my-1 border-t border-white/30" />
										<div className="flex justify-between">
											<span className="opacity-80">Scanned at</span>
											<span className="font-medium">
												{new Date(result.ticket.scannedAt).toLocaleString()}
											</span>
										</div>
										{result.ticket.scannedBy && (
											<div className="flex justify-between">
												<span className="opacity-80">Scanned by</span>
												<span className="font-medium">
													{result.ticket.scannedBy.name || result.ticket.scannedBy.email}
												</span>
											</div>
										)}
									</>
								)}
							</div>
						)}
					</div>

					<div className="p-6 pb-10">
						<Button
							className="h-14 w-full text-lg font-bold"
							variant="secondary"
							onClick={handleReset}
						>
							<RotateCcw className="mr-3 h-5 w-5" />
							Scan Another Ticket
						</Button>
					</div>
				</div>
			)}
		</>
	);
}

// ── Camera Scanner Component ─────────────────────────────────
function CameraScanner({ onResult }: { onResult: (text: string) => void }) {
	const [Scanner, setScanner] = useState<React.ComponentType<{
		onScan: (result: { rawValue: string }[]) => void;
		onError?: (error: unknown) => void;
		constraints?: MediaTrackConstraints;
		styles?: { container?: React.CSSProperties; video?: React.CSSProperties };
	}> | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const processedRef = useRef(false);

	useEffect(() => {
		let mounted = true;
		import("@yudiel/react-qr-scanner")
			.then((mod) => {
				if (mounted) {
					setScanner(() => mod.Scanner);
					setLoading(false);
				}
			})
			.catch(() => {
				if (mounted) {
					setError("Failed to load scanner");
					setLoading(false);
				}
			});
		return () => {
			mounted = false;
		};
	}, []);

	const handleScan = useCallback(
		(results: { rawValue: string }[]) => {
			if (results.length > 0 && !processedRef.current) {
				processedRef.current = true;
				onResult(results[0].rawValue);
				// Allow scanning again after 3 seconds
				setTimeout(() => {
					processedRef.current = false;
				}, 3000);
			}
		},
		[onResult],
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="mr-2 h-6 w-6 animate-spin" />
				<span>Starting camera...</span>
			</div>
		);
	}

	if (error || !Scanner) {
		return (
			<div className="py-8 text-center">
				<Camera className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
				<p className="text-sm text-red-500">{error || "Camera not available"}</p>
				<p className="text-muted-foreground mt-1 text-xs">Try using manual input instead</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg">
			<Scanner
				onScan={handleScan}
				onError={() => setError("Camera error. Please try manual input.")}
				constraints={{ facingMode: "environment" }}
				styles={{
					container: { width: "100%", borderRadius: "0.5rem" },
					video: { borderRadius: "0.5rem" },
				}}
			/>
			<p className="text-muted-foreground mt-2 text-center text-xs">
				Point your camera at a ticket QR code
			</p>
		</div>
	);
}
