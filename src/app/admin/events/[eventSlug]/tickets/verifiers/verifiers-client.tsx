"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Trash2, UserPlus } from "lucide-react";
import { addEventTicketVerifier, removeEventTicketVerifier, searchUsersForTickets } from "../../actions";

type Verifier = {
	id?: string;
	ticketEventId: string;
	userId: string;
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	};
};

type SearchUser = {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
};

type VerifiersClientProps = {
	eventId: string;
	verifiers: Verifier[];
};

function getInitials(name: string | null, email: string): string {
	if (name) {
		const parts = name.trim().split(" ");
		if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		return parts[0].slice(0, 2).toUpperCase();
	}
	return email.slice(0, 2).toUpperCase();
}

export function VerifiersClient({ eventId, verifiers: initialVerifiers }: VerifiersClientProps) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchUser[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isAdding, startAddTransition] = useTransition();
	const [removingId, setRemovingId] = useState<string | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const existingUserIds = new Set(initialVerifiers.map((v) => v.userId));

	function handleQueryChange(value: string) {
		setQuery(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (value.trim().length < 2) {
			setResults([]);
			return;
		}
		debounceRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const res = await searchUsersForTickets(value.trim());
				if (res.success) {
					setResults(res.users.filter((u) => !existingUserIds.has(u.id)));
				}
			} catch {
				// silently fail search
			} finally {
				setIsSearching(false);
			}
		}, 300);
	}

	function handleAdd(u: SearchUser) {
		startAddTransition(async () => {
			try {
				const result = await addEventTicketVerifier(eventId, u.id);
				if (result.success) {
					toast.success(`${u.name ?? u.email} added as verifier`);
					setResults((prev) => prev.filter((r) => r.id !== u.id));
					setQuery("");
					router.refresh();
				} else {
					toast.error(result.message ?? "Failed to add verifier");
				}
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Failed to add verifier");
			}
		});
	}

	async function handleRemove(userId: string) {
		setRemovingId(userId);
		try {
			const result = await removeEventTicketVerifier(eventId, userId);
			if (result.success) {
				toast.success("Verifier removed");
				router.refresh();
			} else {
				toast.error(result.message ?? "Failed to remove verifier");
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to remove verifier");
		} finally {
			setRemovingId(null);
		}
	}

	return (
		<div className="space-y-6">
			{/* Search & add */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm uppercase tracking-wider">Add Verifier</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							value={query}
							onChange={(e) => handleQueryChange(e.target.value)}
							placeholder="Search by name or email…"
							className="pl-9"
						/>
						{isSearching && (
							<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
						)}
					</div>

					{results.length > 0 && (
						<ul className="divide-y divide-border rounded-md border">
							{results.map((u) => (
								<li key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
									<div className="flex items-center gap-3 min-w-0">
										<Avatar className="h-8 w-8 shrink-0">
											<AvatarImage src={u.image ?? undefined} />
											<AvatarFallback className="text-xs">
												{getInitials(u.name, u.email)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0">
											<p className="text-sm font-medium truncate">{u.name ?? "—"}</p>
											<p className="text-xs text-muted-foreground truncate">{u.email}</p>
										</div>
									</div>
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleAdd(u)}
										disabled={isAdding}
									>
										<UserPlus className="mr-1.5 h-3.5 w-3.5" />
										Add
									</Button>
								</li>
							))}
						</ul>
					)}

					{query.length >= 2 && !isSearching && results.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-2">
							No users found, or all matching users are already verifiers.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Current verifiers */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm uppercase tracking-wider">
							Current Verifiers{" "}
							<span className="text-muted-foreground font-normal normal-case tracking-normal">
								({initialVerifiers.length})
							</span>
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{initialVerifiers.length === 0 ? (
						<p className="text-sm text-muted-foreground px-6 py-8 text-center">
							No verifiers assigned yet. Use the search above to add verifiers.
						</p>
					) : (
						<ul className="divide-y divide-border">
							{initialVerifiers.map((v) => (
								<li
									key={v.userId}
									className="flex items-center justify-between gap-3 px-6 py-3"
								>
									<div className="flex items-center gap-3 min-w-0">
										<Avatar className="h-9 w-9 shrink-0">
											<AvatarImage src={v.user.image ?? undefined} />
											<AvatarFallback className="text-xs">
												{getInitials(v.user.name, v.user.email)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<p className="text-sm font-medium">{v.user.name ?? "—"}</p>
												<Badge variant="secondary" className="text-xs">verifier</Badge>
											</div>
											<p className="text-xs text-muted-foreground truncate">{v.user.email}</p>
										</div>
									</div>
									<Button
										size="sm"
										variant="ghost"
										className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
										onClick={() => handleRemove(v.userId)}
										disabled={removingId === v.userId}
									>
										{removingId === v.userId ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4" />
										)}
									</Button>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
