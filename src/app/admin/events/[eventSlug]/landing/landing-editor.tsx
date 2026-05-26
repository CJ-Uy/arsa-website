"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/app/admin/pages/rich-text-editor";
import { saveLanding } from "../actions";
import { toast } from "sonner";

type EventWithLanding = {
	id: string;
	slug: string;
	name: string;
	landing: {
		body: unknown;
		codePath: string | null;
		published: boolean;
	} | null;
};

export function LandingEditor({ event }: { event: EventWithLanding }) {
	const [pending, start] = useTransition();
	const [body, setBody] = useState<unknown>(event.landing?.body ?? null);
	const [codePath, setCodePath] = useState<string | null>(
		event.landing?.codePath ?? null,
	);
	const [published, setPublished] = useState<boolean>(
		event.landing?.published ?? false,
	);

	return (
		<div className="max-w-4xl space-y-6">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[#0e3663]">Landing page</h1>
				<div className="flex items-center gap-2">
					<Label htmlFor="pub">Published</Label>
					<Switch id="pub" checked={published} onCheckedChange={setPublished} />
				</div>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>Code path (optional override)</CardTitle>
				</CardHeader>
				<CardContent>
					<Input
						value={codePath ?? ""}
						placeholder="events/_custom/<slug>/landing"
						onChange={(e) => setCodePath(e.target.value || null)}
					/>
					<p className="text-muted-foreground mt-1 text-xs">
						Leave blank to use the CMS body below.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>CMS body</CardTitle>
				</CardHeader>
				<CardContent>
					<RichTextEditor content={body} onChange={setBody} />
				</CardContent>
			</Card>

			<Button
				disabled={pending}
				onClick={() =>
					start(async () => {
						try {
							await saveLanding(event.id, body, codePath, published);
							toast.success("Saved");
						} catch {
							toast.error("Failed to save");
						}
					})
				}
			>
				{pending ? "Saving…" : "Save"}
			</Button>
		</div>
	);
}
