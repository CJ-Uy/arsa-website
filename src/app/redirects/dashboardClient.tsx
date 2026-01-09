"use client";

import { useState } from "react";
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
	DialogClose,
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

import { RefreshCw } from "lucide-react";

// Type from Prisma for our redirects (idk how to import Prisma Types)
type Redirects = {
	id: string;
	newURL: string;
	redirectCode: string;
	clicks: number;
};

export function DashboardClient({ initialRedirects }: { initialRedirects: Redirects[] }) {
	const router = useRouter();
	const [redirects, setRedirects] = useState<Redirects[]>(initialRedirects);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleCreate = async (formData: FormData) => {
		const newURL = formData.get("newURL") as string;
		const redirectCode = formData.get("redirectCode") as string;

		// Optimistically add to UI
		const tempId = `temp-${Date.now()}`;
		const optimisticRedirect: Redirects = {
			id: tempId,
			newURL,
			redirectCode,
			clicks: 0,
		};

		setRedirects((prev) =>
			[...prev, optimisticRedirect].sort((a, b) => a.redirectCode.localeCompare(b.redirectCode)),
		);
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

			{/* Table */}
			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[150px]">Short Code</TableHead>
							<TableHead>Destination URL</TableHead>
							<TableHead className="hidden w-[100px] md:table-cell">Clicks</TableHead>
							<TableHead className="w-[150px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{redirects.map((redirect) => (
							<TableRow key={redirect.id}>
								<TableCell className="font-medium">/{redirect.redirectCode}</TableCell>
								<TableCell className="max-w-xs truncate">
									<a
										href={redirect.newURL}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:underline"
									>
										{redirect.newURL}
									</a>
								</TableCell>
								<TableCell className="hidden md:table-cell">{redirect.clicks.toString()}</TableCell>
								<TableCell className="space-x-2 text-right">
									<Dialog>
										<DialogTrigger asChild>
											<Button variant="outline" size="sm">
												Edit
											</Button>
										</DialogTrigger>
										<DialogContent>
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
											<Button variant="destructive" size="sm">
												Delete
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
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
						))}
					</TableBody>
				</Table>
			</div>
		</>
	);
}
