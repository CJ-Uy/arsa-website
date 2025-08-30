"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Server Actions
import { createRedirect, deleteRedirect, updateRedirect, verifyCredentials } from "./actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
	id: string,
	newURL: string,
	redirectCode: string,
	clicks: Number,
}

export function DashboardClient({ initialRedirects }: { initialRedirects: Redirects[] }) {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const router = useRouter();

	const handleLogin = async (formData: FormData) => {
		const result = await verifyCredentials(formData);

		if (result.success) {
			toast.success("Login successful!");
			setIsLoggedIn(true);
		} else {
			toast.error("Login Failed", { description: result.message });
		}
	};

	const handleAction = (promise: Promise<any>) => {
		toast.promise(promise, {
			loading: "Processing...",
			success: (data) => {
				return data.message;
			},
			error: (err) => err.message || "An unexpected error occurred.",
			finally: () => {
				router.refresh();
			},
		});
	};

	// --- LOGIN VIEW ---
	if (!isLoggedIn) {
		return (
			<div className="flex items-center justify-center">
				<Card className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
					<CardHeader>
						<CardTitle className="text-2xl">Admin Credentials Needed</CardTitle>
						<CardDescription>Enter credentials to manage redirects</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={handleLogin} className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="username">Username</Label>
								<Input id="username" name="username" required />
							</div>
							<div className="grid gap-2">
								<Label htmlFor="password">Password</Label>
								<Input id="password" name="password" type="password" required />
							</div>
							<Button type="submit" className="w-full">
								Login
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		);
	}

	// --- DASHBOARD VIEW (Forms and buttons now use the new handleAction wrapper) ---
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
					<Dialog>
						<DialogTrigger asChild>
							<Button>Add New Redirect</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Redirect</DialogTitle>
							</DialogHeader>
							<form
								action={(formData) => handleAction(createRedirect(formData))}
								className="space-y-4"
							>
								<div>
									<Label className="mb-2" htmlFor="redirectCode">
										Short Code (ateneoarsa.org/[code])
									</Label>
									<Input id="redirectCode" name="redirectCode" placeholder="e.g., DOGS-Form" />
								</div>
								<div>
									<Label className="mb-2" htmlFor="newURL">
										Destination URL
									</Label>
									<Input id="newURL" name="newURL" placeholder="https://..." />
								</div>
								<DialogClose asChild>
									<Button type="submit">Create</Button>
								</DialogClose>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
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
						{initialRedirects.map((redirect) => (
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
												action={(formData) => handleAction(updateRedirect(formData))}
												className="space-y-4"
											>
												<input type="hidden" name="id" value={redirect.id} />
												<div>
													<Label htmlFor="redirectCode">Short Code</Label>
													<Input
														id="redirectCode"
														name="redirectCode"
														defaultValue={redirect.redirectCode}
													/>
												</div>
												<div>
													<Label htmlFor="newURL">Destination URL</Label>
													<Input id="newURL" name="newURL" defaultValue={redirect.newURL} />
												</div>
												<DialogClose asChild>
													<Button type="submit">Save Changes</Button>
												</DialogClose>
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
												<AlertDialogAction
													onClick={() => handleAction(deleteRedirect(redirect.id))}
												>
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
