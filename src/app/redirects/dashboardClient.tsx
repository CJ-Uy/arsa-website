"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Server Actions
import { createRedirect, deleteRedirect, updateRedirect } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { RefreshCw, Search, ArrowUp, ArrowDown } from "lucide-react";
import { AnalyticsModal } from "./analyticsModal";

// Type from Prisma for our redirects
type Redirect = {
	id: string;
	newURL: string;
	redirectCode: string;
	clicks: number;
	createdAt: Date;
};

type SortField = "redirectCode" | "clicks" | "createdAt";
type SortDirection = "asc" | "desc";

export function DashboardClient({ initialRedirects }: { initialRedirects: Redirect[] }) {
	const router = useRouter();
	const [redirects, setRedirects] = useState<Redirect[]>(initialRedirects);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Search and sort state
	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState<SortField>("redirectCode");
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	// Analytics modal state
	const [selectedRedirect, setSelectedRedirect] = useState<Redirect | null>(null);
	const [analyticsOpen, setAnalyticsOpen] = useState(false);

	// Filtered and sorted redirects
	const filteredRedirects = useMemo(() => {
		let result = [...redirects];

		// Filter by search query
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(r) =>
					r.redirectCode.toLowerCase().includes(query) || r.newURL.toLowerCase().includes(query),
			);
		}

		// Sort
		result.sort((a, b) => {
			let comparison = 0;
			switch (sortField) {
				case "redirectCode":
					comparison = a.redirectCode.localeCompare(b.redirectCode);
					break;
				case "clicks":
					comparison = a.clicks - b.clicks;
					break;
				case "createdAt":
					comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
			}
			return sortDirection === "asc" ? comparison : -comparison;
		});

		return result;
	}, [redirects, searchQuery, sortField, sortDirection]);

	const toggleSortDirection = () => {
		setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	const handleRowClick = (redirect: Redirect) => {
		setSelectedRedirect(redirect);
		setAnalyticsOpen(true);
	};

	const handleCreate = async (formData: FormData) => {
		const newURL = formData.get("newURL") as string;
		const redirectCode = formData.get("redirectCode") as string;

		// Optimistically add to UI
		const tempId = `temp-${Date.now()}`;
		const optimisticRedirect: Redirect = {
			id: tempId,
			newURL,
			redirectCode,
			clicks: 0,
			createdAt: new Date(),
		};

		setRedirects((prev) => [...prev, optimisticRedirect]);
		setIsDialogOpen(false);

		// Perform the actual creation
		const result = await createRedirect(formData);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			// Revert on error
			setRedirects((prev) => prev.filter((r) => r.id !== tempId));
			toast.error(result.message);
		}
	};

	const handleUpdate = async (formData: FormData) => {
		const id = formData.get("id") as string;
		const newURL = formData.get("newURL") as string;
		const redirectCode = formData.get("redirectCode") as string;

		// Store old values
		const oldRedirect = redirects.find((r) => r.id === id);

		// Optimistically update UI
		setRedirects((prev) => prev.map((r) => (r.id === id ? { ...r, newURL, redirectCode } : r)));

		// Perform the actual update
		const result = await updateRedirect(formData);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			// Revert on error
			if (oldRedirect) {
				setRedirects((prev) => prev.map((r) => (r.id === id ? oldRedirect : r)));
			}
			toast.error(result.message);
		}
	};

	const handleDelete = async (id: string) => {
		// Store old values
		const oldRedirect = redirects.find((r) => r.id === id);

		// Optimistically remove from UI
		setRedirects((prev) => prev.filter((r) => r.id !== id));

		// Perform the actual deletion
		const result = await deleteRedirect(id);

		if (result.success) {
			toast.success(result.message);
			router.refresh();
		} else {
			// Revert on error
			if (oldRedirect) {
				setRedirects((prev) => [...prev, oldRedirect]);
			}
			toast.error(result.message);
		}
	};

	return (
		<>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-3xl font-bold">Redirects Dashboard</h1>
				<div className="flex gap-x-2">
					<Button
						variant="outline"
						onClick={() => {
							router.refresh();
							toast.success("Table data refreshed!");
						}}
					>
						<RefreshCw />
					</Button>
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button>Add New Redirect</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Redirect</DialogTitle>
							</DialogHeader>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									handleCreate(new FormData(e.currentTarget));
								}}
								className="space-y-4"
							>
								<div>
									<Label className="mb-2" htmlFor="redirectCode">
										Short Code (ateneoarsa.org/[code])
									</Label>
									<Input
										id="redirectCode"
										name="redirectCode"
										placeholder="e.g., DOGS-Form"
										required
									/>
								</div>
								<div>
									<Label className="mb-2" htmlFor="newURL">
										Destination URL
									</Label>
									<Input id="newURL" name="newURL" placeholder="https://..." required />
								</div>
								<Button type="submit">Create</Button>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Search and Sort Controls */}
			<div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input
						placeholder="Search by code or URL..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2">
					<Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="redirectCode">Short Code</SelectItem>
							<SelectItem value="clicks">Clicks</SelectItem>
							<SelectItem value="createdAt">Created Date</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline" size="icon" onClick={toggleSortDirection}>
						{sortDirection === "asc" ? (
							<ArrowUp className="h-4 w-4" />
						) : (
							<ArrowDown className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Results count */}
			<p className="text-muted-foreground mb-2 text-sm">
				{filteredRedirects.length} of {redirects.length} redirects
				{searchQuery && ` matching "${searchQuery}"`}
			</p>

			{/* Table */}
			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[150px]">Short Code</TableHead>
							<TableHead>Destination URL</TableHead>
							<TableHead className="hidden w-[100px] md:table-cell">Clicks</TableHead>
							<TableHead className="hidden w-[120px] lg:table-cell">Created</TableHead>
							<TableHead className="w-[150px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRedirects.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
									{searchQuery ? "No redirects match your search." : "No redirects yet."}
								</TableCell>
							</TableRow>
						) : (
							filteredRedirects.map((redirect) => (
								<TableRow
									key={redirect.id}
									className="hover:bg-muted/50 cursor-pointer transition-colors"
									onClick={() => handleRowClick(redirect)}
								>
									<TableCell className="font-medium">/{redirect.redirectCode}</TableCell>
									<TableCell className="max-w-xs truncate">
										<a
											href={redirect.newURL}
											target="_blank"
											rel="noopener noreferrer"
											className="hover:underline"
											onClick={(e) => e.stopPropagation()}
										>
											{redirect.newURL}
										</a>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{redirect.clicks.toLocaleString()}
									</TableCell>
									<TableCell className="hidden lg:table-cell">
										{new Date(redirect.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell className="space-x-2 text-right">
										<Dialog>
											<DialogTrigger asChild>
												<Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
													Edit
												</Button>
											</DialogTrigger>
											<DialogContent onClick={(e) => e.stopPropagation()}>
												<DialogHeader>
													<DialogTitle>Edit Redirect</DialogTitle>
												</DialogHeader>
												<form
													onSubmit={(e) => {
														e.preventDefault();
														handleUpdate(new FormData(e.currentTarget));
													}}
													className="space-y-4"
												>
													<input type="hidden" name="id" value={redirect.id} />
													<div>
														<Label htmlFor="redirectCode">Short Code</Label>
														<Input
															id="redirectCode"
															name="redirectCode"
															defaultValue={redirect.redirectCode}
															required
														/>
													</div>
													<div>
														<Label htmlFor="newURL">Destination URL</Label>
														<Input
															id="newURL"
															name="newURL"
															defaultValue={redirect.newURL}
															required
														/>
													</div>
													<Button type="submit">Save Changes</Button>
												</form>
											</DialogContent>
										</Dialog>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant="destructive"
													size="sm"
													onClick={(e) => e.stopPropagation()}
												>
													Delete
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent onClick={(e) => e.stopPropagation()}>
												<AlertDialogHeader>
													<AlertDialogTitle>Are you sure?</AlertDialogTitle>
												</AlertDialogHeader>
												<AlertDialogDescription>
													This will permanently delete the redirect.
												</AlertDialogDescription>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={() => handleDelete(redirect.id)}>
														Continue
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Analytics Modal */}
			<AnalyticsModal
				redirect={selectedRedirect}
				open={analyticsOpen}
				onOpenChange={setAnalyticsOpen}
			/>
		</>
	);
}
