"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { grantRole, revokeRole, searchUsersForGrant } from "../actions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { EventRole } from "@/lib/eventPermissions";

const ROLES: EventRole[] = ["overseer", "shop_admin", "tickets_admin", "content_admin"];

type Grant = {
	id: string;
	userId: string;
	role: string;
	user: { id: string; name: string | null; email: string; image: string | null } | null;
};

type SearchUser = { id: string; name: string | null; email: string; image: string | null };

export function AdminsClient({
	eventId,
	grants: initialGrants,
}: {
	eventId: string;
	grants: Grant[];
}) {
	const [pending, start] = useTransition();
	const [grants, setGrants] = useState(initialGrants);
	const [q, setQ] = useState("");
	const [results, setResults] = useState<SearchUser[]>([]);
	const [selectedRole, setSelectedRole] = useState<EventRole>("shop_admin");

	const handleSearch = (v: string) => {
		setQ(v);
		if (v.length < 2) {
			setResults([]);
			return;
		}
		start(async () => {
			const r = await searchUsersForGrant(v);
			setResults(r);
		});
	};

	return (
		<div className="max-w-3xl space-y-6">
			<h1 className="text-2xl font-bold text-[#0e3663]">Admins</h1>

			<Card>
				<CardHeader>
					<CardTitle>Add admin</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Input
						placeholder="Search by name or email"
						value={q}
						onChange={(e) => handleSearch(e.target.value)}
					/>
					<Select
						value={selectedRole}
						onValueChange={(v) => setSelectedRole(v as EventRole)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ROLES.map((r) => (
								<SelectItem key={r} value={r}>
									{r}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{results.map((u) => (
						<div
							key={u.id}
							className="flex items-center justify-between rounded border p-2"
						>
							<div className="flex items-center gap-2">
								<Avatar className="h-7 w-7">
									<AvatarImage src={u.image ?? undefined} />
									<AvatarFallback>{u.name?.[0] ?? u.email[0]}</AvatarFallback>
								</Avatar>
								<span className="text-sm">
									{u.name}{" "}
									<span className="text-muted-foreground text-xs">{u.email}</span>
								</span>
							</div>
							<Button
								size="sm"
								disabled={pending}
								onClick={() =>
									start(async () => {
										await grantRole(eventId, u.id, selectedRole);
										toast.success(`Granted ${selectedRole}`);
										setQ("");
										setResults([]);
									})
								}
							>
								Grant {selectedRole}
							</Button>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Current grants ({grants.length})</CardTitle>
				</CardHeader>
				<CardContent>
					{grants.length === 0 && (
						<p className="text-muted-foreground text-sm">
							No explicit grants. Global admin flags still apply.
						</p>
					)}
					{grants.map((g) => (
						<div
							key={g.id}
							className="flex items-center justify-between border-t py-2"
						>
							<div className="flex items-center gap-2">
								<Avatar className="h-7 w-7">
									<AvatarImage src={g.user?.image ?? undefined} />
									<AvatarFallback>
										{g.user?.name?.[0] ?? g.user?.email?.[0] ?? "?"}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="text-sm">{g.user?.name ?? g.userId}</p>
									<p className="text-muted-foreground text-xs">{g.user?.email}</p>
								</div>
								<Badge variant="outline">{g.role}</Badge>
							</div>
							<Button
								size="icon"
								variant="ghost"
								disabled={pending}
								onClick={() =>
									start(async () => {
										await revokeRole(eventId, g.id);
										toast.success("Revoked");
										setGrants((prev) => prev.filter((x) => x.id !== g.id));
									})
								}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
