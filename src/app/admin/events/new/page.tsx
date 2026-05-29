"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createEvent } from "../actions";

function toSlug(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 60);
}

export default function NewEventPage() {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [slugTouched, setSlugTouched] = useState(false);
	const [description, setDescription] = useState("");

	function handleNameChange(v: string) {
		setName(v);
		if (!slugTouched) setSlug(toSlug(v));
	}

	function handleSlugChange(v: string) {
		setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
		setSlugTouched(true);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !slug.trim()) return;
		start(async () => {
			try {
				const result = await createEvent({
					name: name.trim(),
					slug: slug.trim(),
					description: description.trim() || null,
				});
				toast.success("Event created");
				router.push(`/admin/events/${result.slug}/settings`);
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Failed to create event");
			}
		});
	}

	return (
		<div className="max-w-lg space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/admin/events">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<h1 className="text-2xl font-bold text-[#0e3663]">New Event</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Event details</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								placeholder="Flower Fest 2026"
								value={name}
								onChange={(e) => handleNameChange(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="slug">Slug</Label>
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">/</span>
								<Input
									id="slug"
									placeholder="flower-fest-2026"
									value={slug}
									onChange={(e) => handleSlugChange(e.target.value)}
									className="font-mono"
									required
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Lowercase letters, numbers, and hyphens only. This becomes the URL.
							</p>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
							<Textarea
								id="description"
								placeholder="A brief description of this event…"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
							/>
						</div>

						<Button type="submit" disabled={pending || !name.trim() || !slug.trim()} className="w-full">
							{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Create event
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
