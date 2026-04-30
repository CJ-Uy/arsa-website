"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { searchUsersForAdmin, updateUserRoles } from "./actions";
import { toast } from "sonner";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	Loader2,
	Plus,
	Save,
	Search,
	Shield,
	X,
} from "lucide-react";

type UserWithRoles = {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	isShopAdmin: boolean;
	isEventsAdmin: boolean;
	isRedirectsAdmin: boolean;
	isTicketsAdmin: boolean;
	isSSO26Admin: boolean;
	isBackupAdmin: boolean;
	isSuperAdmin: boolean;
};

type RoleEdits = {
	isShopAdmin: boolean;
	isEventsAdmin: boolean;
	isRedirectsAdmin: boolean;
	isTicketsAdmin: boolean;
	isSSO26Admin: boolean;
	isBackupAdmin: boolean;
};

type SortKey = "name" | "email" | "roles";
type SortDir = "asc" | "desc";

function countRoles(user: UserWithRoles) {
	return (
		(user.isShopAdmin ? 1 : 0) +
		(user.isEventsAdmin ? 1 : 0) +
		(user.isRedirectsAdmin ? 1 : 0) +
		(user.isTicketsAdmin ? 1 : 0) +
		(user.isSSO26Admin ? 1 : 0) +
		(user.isBackupAdmin ? 1 : 0) +
		(user.isSuperAdmin ? 1 : 0)
	);
}

function RoleBadge({ active, label }: { active: boolean; label: string }) {
	if (!active) return null;
	return (
		<Badge variant="secondary" className="text-xs">
			{label}
		</Badge>
	);
}

export function SuperAdminManagement({ initialAdmins }: { initialAdmins: UserWithRoles[] }) {
	const [admins, setAdmins] = useState<UserWithRoles[]>(initialAdmins);
	const [filter, setFilter] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("name");
	const [sortDir, setSortDir] = useState<SortDir>("asc");

	// Edit dialog
	const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
	const [roleEdits, setRoleEdits] = useState<RoleEdits>({
		isShopAdmin: false,
		isEventsAdmin: false,
		isRedirectsAdmin: false,
		isTicketsAdmin: false,
		isSSO26Admin: false,
		isBackupAdmin: false,
	});
	const [saving, setSaving] = useState(false);

	// Add admin dialog
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [addQuery, setAddQuery] = useState("");
	const [addResults, setAddResults] = useState<UserWithRoles[]>([]);
	const [addSearching, setAddSearching] = useState(false);

	// ── Sorting ─────────────────────────────────────────────────
	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	const SortIcon = ({ column }: { column: SortKey }) => {
		if (sortKey !== column) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
		return sortDir === "asc" ? (
			<ArrowUp className="ml-1 inline h-3.5 w-3.5" />
		) : (
			<ArrowDown className="ml-1 inline h-3.5 w-3.5" />
		);
	};

	const filteredAdmins = useMemo(() => {
		const q = filter.toLowerCase();
		let list = admins;
		if (q) {
			list = list.filter(
				(u) => (u.name || "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
			);
		}
		list = [...list].sort((a, b) => {
			let cmp = 0;
			if (sortKey === "name") {
				cmp = (a.name || "").localeCompare(b.name || "");
			} else if (sortKey === "email") {
				cmp = a.email.localeCompare(b.email);
			} else {
				cmp = countRoles(a) - countRoles(b);
			}
			return sortDir === "asc" ? cmp : -cmp;
		});
		return list;
	}, [admins, filter, sortKey, sortDir]);

	// ── Edit ────────────────────────────────────────────────────
	const openEdit = (user: UserWithRoles) => {
		if (user.isSuperAdmin) {
			toast.error("Cannot modify super admin roles");
			return;
		}
		setEditingUser(user);
		setRoleEdits({
			isShopAdmin: user.isShopAdmin,
			isEventsAdmin: user.isEventsAdmin,
			isRedirectsAdmin: user.isRedirectsAdmin,
			isTicketsAdmin: user.isTicketsAdmin,
			isSSO26Admin: user.isSSO26Admin,
			isBackupAdmin: user.isBackupAdmin,
		});
	};

	const handleSave = async () => {
		if (!editingUser) return;
		setSaving(true);
		try {
			const result = await updateUserRoles(editingUser.id, roleEdits);
			if (result.success) {
				toast.success(result.message);
				const updated = { ...editingUser, ...roleEdits };
				const hasAnyRole =
					updated.isShopAdmin ||
					updated.isEventsAdmin ||
					updated.isRedirectsAdmin ||
					updated.isTicketsAdmin ||
					updated.isSSO26Admin ||
					updated.isBackupAdmin ||
					updated.isSuperAdmin;

				if (hasAnyRole) {
					setAdmins((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
				} else {
					// No roles left — remove from admin list
					setAdmins((prev) => prev.filter((u) => u.id !== editingUser.id));
				}
				setEditingUser(null);
			} else {
				toast.error(result.message);
			}
		} finally {
			setSaving(false);
		}
	};

	// ── Add Admin ───────────────────────────────────────────────
	const handleAddSearch = async () => {
		if (addQuery.length < 2) {
			toast.error("Enter at least 2 characters");
			return;
		}
		setAddSearching(true);
		try {
			const result = await searchUsersForAdmin(addQuery);
			if (result.success) {
				// Exclude users already in the admin list
				const adminIds = new Set(admins.map((a) => a.id));
				const nonAdmins = (result.users as UserWithRoles[]).filter((u) => !adminIds.has(u.id));
				setAddResults(nonAdmins);
				if (result.users.length === 0) toast.info("No users found");
				else if (nonAdmins.length === 0) toast.info("All matching users are already admins");
			} else {
				toast.error(result.message);
			}
		} finally {
			setAddSearching(false);
		}
	};

	const handleAddUser = (user: UserWithRoles) => {
		// Open edit dialog pre-filled with no roles, so super admin can toggle what they want
		setShowAddDialog(false);
		setAddQuery("");
		setAddResults([]);
		setEditingUser(user);
		setRoleEdits({
			isShopAdmin: user.isShopAdmin,
			isEventsAdmin: user.isEventsAdmin,
			isRedirectsAdmin: user.isRedirectsAdmin,
			isTicketsAdmin: user.isTicketsAdmin,
			isSSO26Admin: user.isSSO26Admin,
			isBackupAdmin: user.isBackupAdmin,
		});
	};

	const handleSaveNewAdmin = async () => {
		if (!editingUser) return;
		setSaving(true);
		try {
			const result = await updateUserRoles(editingUser.id, roleEdits);
			if (result.success) {
				toast.success(result.message);
				const updated = { ...editingUser, ...roleEdits };
				const hasAnyRole =
					updated.isShopAdmin ||
					updated.isEventsAdmin ||
					updated.isRedirectsAdmin ||
					updated.isTicketsAdmin ||
					updated.isSSO26Admin ||
					updated.isBackupAdmin;

				if (hasAnyRole) {
					// Add to admin list if not already there
					setAdmins((prev) => {
						const exists = prev.find((u) => u.id === updated.id);
						if (exists) {
							return prev.map((u) => (u.id === updated.id ? updated : u));
						}
						return [...prev, updated];
					});
				}
				setEditingUser(null);
			} else {
				toast.error(result.message);
			}
		} finally {
			setSaving(false);
		}
	};

	const isNewUser = editingUser ? !admins.some((a) => a.id === editingUser.id) : false;

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						User Role Management
					</CardTitle>
					<Button size="sm" onClick={() => setShowAddDialog(true)}>
						<Plus className="mr-1.5 h-4 w-4" />
						Add Admin
					</Button>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Filter */}
					<div className="relative max-w-sm">
						<Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
						<Input
							placeholder="Filter admins..."
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Table */}
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead
										className="cursor-pointer select-none"
										onClick={() => toggleSort("name")}
									>
										Name <SortIcon column="name" />
									</TableHead>
									<TableHead
										className="cursor-pointer select-none"
										onClick={() => toggleSort("email")}
									>
										Email <SortIcon column="email" />
									</TableHead>
									<TableHead
										className="cursor-pointer select-none"
										onClick={() => toggleSort("roles")}
									>
										Roles <SortIcon column="roles" />
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredAdmins.length === 0 ? (
									<TableRow>
										<TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
											{filter ? "No admins match your filter" : "No admins found"}
										</TableCell>
									</TableRow>
								) : (
									filteredAdmins.map((user) => (
										<TableRow
											key={user.id}
											className="cursor-pointer"
											onClick={() => openEdit(user)}
										>
											<TableCell className="font-medium">{user.name || "—"}</TableCell>
											<TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{user.isSuperAdmin && (
														<Badge variant="default" className="bg-purple-600 text-xs">
															Super
														</Badge>
													)}
													<RoleBadge active={user.isShopAdmin} label="Shop" />
													<RoleBadge active={user.isEventsAdmin} label="Events" />
													<RoleBadge active={user.isRedirectsAdmin} label="Redirects" />
													<RoleBadge active={user.isTicketsAdmin} label="Tickets" />
													<RoleBadge active={user.isSSO26Admin} label="SSO26" />
													<RoleBadge active={user.isBackupAdmin} label="Backup" />
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					<p className="text-muted-foreground text-xs">
						{filteredAdmins.length} admin{filteredAdmins.length !== 1 ? "s" : ""}
						{filter ? ` matching "${filter}"` : ""}
					</p>
				</CardContent>
			</Card>

			{/* Edit Roles Dialog */}
			<Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Admin Roles</DialogTitle>
						<DialogDescription>
							{editingUser?.name || editingUser?.email}
							{editingUser?.name ? ` (${editingUser.email})` : ""}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<div className="flex items-center justify-between rounded-md border p-3">
								<Label htmlFor="role-shop" className="cursor-pointer">
									Shop Admin
								</Label>
								<Switch
									id="role-shop"
									checked={roleEdits.isShopAdmin}
									onCheckedChange={(v) => setRoleEdits((r) => ({ ...r, isShopAdmin: v }))}
								/>
							</div>
							<div className="flex items-center justify-between rounded-md border p-3">
								<Label htmlFor="role-events" className="cursor-pointer">
									Events Admin
								</Label>
								<Switch
									id="role-events"
									checked={roleEdits.isEventsAdmin}
									onCheckedChange={(v) => setRoleEdits((r) => ({ ...r, isEventsAdmin: v }))}
								/>
							</div>
							<div className="flex items-center justify-between rounded-md border p-3">
								<Label htmlFor="role-redirects" className="cursor-pointer">
									Redirects Admin
								</Label>
								<Switch
									id="role-redirects"
									checked={roleEdits.isRedirectsAdmin}
									onCheckedChange={(v) => setRoleEdits((r) => ({ ...r, isRedirectsAdmin: v }))}
								/>
							</div>
							<div className="flex items-center justify-between rounded-md border p-3">
								<Label htmlFor="role-tickets" className="cursor-pointer">
									Tickets Admin
								</Label>
								<Switch
									id="role-tickets"
									checked={roleEdits.isTicketsAdmin}
									onCheckedChange={(v) => setRoleEdits((r) => ({ ...r, isTicketsAdmin: v }))}
								/>
							</div>
							<div className="flex items-center justify-between rounded-md border p-3">
								<Label htmlFor="role-sso26" className="cursor-pointer">
									SSO 2026 Admin
								</Label>
								<Switch
									id="role-sso26"
									checked={roleEdits.isSSO26Admin}
									onCheckedChange={(v) => setRoleEdits((r) => ({ ...r, isSSO26Admin: v }))}
								/>
							</div>
							<div className="flex items-center justify-between rounded-md border p-3">
								<Label htmlFor="role-backup" className="cursor-pointer">
									Backup Admin
								</Label>
								<Switch
									id="role-backup"
									checked={roleEdits.isBackupAdmin}
									onCheckedChange={(v) => setRoleEdits((r) => ({ ...r, isBackupAdmin: v }))}
								/>
							</div>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setEditingUser(null)}>
								Cancel
							</Button>
							<Button onClick={isNewUser ? handleSaveNewAdmin : handleSave} disabled={saving}>
								{saving ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Save className="mr-2 h-4 w-4" />
								)}
								Save
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Add Admin Dialog */}
			<Dialog
				open={showAddDialog}
				onOpenChange={(open) => {
					if (!open) {
						setShowAddDialog(false);
						setAddQuery("");
						setAddResults([]);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Admin</DialogTitle>
						<DialogDescription>
							Search for a user by name or email to grant admin roles.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="Search by name or email..."
								value={addQuery}
								onChange={(e) => setAddQuery(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleAddSearch()}
							/>
							<Button onClick={handleAddSearch} disabled={addSearching} size="sm">
								{addSearching ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Search className="h-4 w-4" />
								)}
							</Button>
						</div>
						{addResults.length > 0 && (
							<div className="max-h-60 space-y-1 overflow-auto">
								{addResults.map((user) => (
									<div
										key={user.id}
										className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 transition-colors"
										onClick={() => handleAddUser(user)}
									>
										<div className="min-w-0 flex-1">
											<div className="text-sm font-medium">{user.name || "—"}</div>
											<div className="text-muted-foreground truncate text-xs">{user.email}</div>
										</div>
										<Plus className="text-muted-foreground h-4 w-4 shrink-0" />
									</div>
								))}
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
