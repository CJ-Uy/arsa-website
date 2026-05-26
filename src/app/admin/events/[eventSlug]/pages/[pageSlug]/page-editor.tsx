"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/app/admin/pages/rich-text-editor";
import { updatePage } from "../../actions";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type EventPageRow = {
	id: string;
	eventId: string;
	pageSlug: string;
	title: string;
	body: unknown;
	codePath: string | null;
	published: boolean;
	sortOrder: number;
};

type PageEditorProps = {
	page: EventPageRow;
	eventSlug: string;
};

export function PageEditor({ page, eventSlug }: PageEditorProps) {
	const [pending, start] = useTransition();

	const [title, setTitle] = useState(page.title);
	const [body, setBody] = useState<unknown>(page.body ?? null);
	const [codePath, setCodePath] = useState<string | null>(page.codePath ?? null);
	const [published, setPublished] = useState(page.published);
	const [sortOrder, setSortOrder] = useState(page.sortOrder);

	const handleSave = () => {
		start(async () => {
			try {
				await updatePage(page.id, body, title, codePath, published, sortOrder);
				toast.success("Saved");
			} catch {
				toast.error("Failed to save");
			}
		});
	};

	return (
		<div className="max-w-4xl space-y-6">
			<header className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" asChild>
						<Link href={`/admin/events/${eventSlug}/pages`}>
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold text-[#0e3663]">{page.pageSlug}</h1>
						<p className="text-muted-foreground text-sm font-mono">{page.pageSlug}</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Label htmlFor="pub">Published</Label>
					<Switch id="pub" checked={published} onCheckedChange={setPublished} />
				</div>
			</header>

			{/* Title + Sort order */}
			<Card>
				<CardHeader>
					<CardTitle>Page details</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="page-title">Title</Label>
						<Input
							id="page-title"
							value={title}
							placeholder="Page title"
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="sort-order">Sort order</Label>
						<Input
							id="sort-order"
							type="number"
							value={sortOrder}
							onChange={(e) => setSortOrder(Number(e.target.value))}
						/>
						<p className="text-muted-foreground text-xs">Lower numbers appear first</p>
					</div>
				</CardContent>
			</Card>

			{/* Code path override */}
			<Card>
				<CardHeader>
					<CardTitle>Code path (optional override)</CardTitle>
				</CardHeader>
				<CardContent>
					<Input
						value={codePath ?? ""}
						placeholder="events/_custom/<slug>/page-name"
						onChange={(e) => setCodePath(e.target.value || null)}
					/>
					<p className="text-muted-foreground mt-1 text-xs">
						Leave blank to use the CMS body below.
					</p>
				</CardContent>
			</Card>

			{/* CMS body */}
			<Card>
				<CardHeader>
					<CardTitle>CMS body</CardTitle>
				</CardHeader>
				<CardContent>
					<RichTextEditor content={body} onChange={setBody} />
				</CardContent>
			</Card>

			<Button disabled={pending} onClick={handleSave}>
				{pending ? "Saving…" : "Save"}
			</Button>
		</div>
	);
}
