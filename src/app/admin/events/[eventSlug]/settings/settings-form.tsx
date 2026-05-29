"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { updateEventSettings, type EventSettingsForm } from "../actions";
import { toast } from "sonner";

export function SettingsForm({ event }: { event: any }) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [form, setForm] = useState<EventSettingsForm>({
		name: event.name,
		slug: event.slug,
		description: event.description,
		status: event.status,
		startDate: event.startDate ? new Date(event.startDate).getTime() : null,
		endDate: event.endDate ? new Date(event.endDate).getTime() : null,
		priority: event.priority,
		tabLabel: event.tabLabel,
		ogImage: event.ogImage,
		metaTitle: event.metaTitle,
		metaDescription: event.metaDescription,
	});

	return (
		<div className="max-w-3xl space-y-6">
			<h1 className="text-2xl font-bold text-[#0e3663]">Settings</h1>

			<Card>
				<CardHeader><CardTitle>Basic info</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>Name</Label>
						<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
					</div>
					<div>
						<Label>Slug</Label>
						<Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
						<p className="text-xs text-muted-foreground mt-1">URL: /{form.slug}. Renaming preserves the old URL via auto-redirect.</p>
					</div>
					<div>
						<Label>Description</Label>
						<Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
					</div>
					<div>
						<Label>Status</Label>
						<Select value={form.status} onValueChange={(v: "draft" | "active" | "archived") => setForm({ ...form, status: v })}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="draft">Draft</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="archived">Archived</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Dates &amp; priority</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>Start date</Label>
						<DatePicker
							value={form.startDate ? new Date(form.startDate) : undefined}
							onChange={(d) => setForm({ ...form, startDate: d?.getTime() ?? null })}
						/>
					</div>
					<div>
						<Label>End date</Label>
						<DatePicker
							value={form.endDate ? new Date(form.endDate) : undefined}
							onChange={(d) => setForm({ ...form, endDate: d?.getTime() ?? null })}
						/>
					</div>
					<div>
						<Label>Priority (higher = preferred default tab)</Label>
						<Input
							type="number"
							value={form.priority}
							onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 0 })}
						/>
					</div>
					<div>
						<Label>Tab label (overrides name in shop tabs)</Label>
						<Input
							value={form.tabLabel ?? ""}
							onChange={(e) => setForm({ ...form, tabLabel: e.target.value || null })}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>SEO / Open Graph</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>OG Image URL</Label>
						<Input value={form.ogImage ?? ""} onChange={(e) => setForm({ ...form, ogImage: e.target.value || null })} />
					</div>
					<div>
						<Label>Meta title</Label>
						<Input value={form.metaTitle ?? ""} onChange={(e) => setForm({ ...form, metaTitle: e.target.value || null })} />
					</div>
					<div>
						<Label>Meta description</Label>
						<Textarea value={form.metaDescription ?? ""} onChange={(e) => setForm({ ...form, metaDescription: e.target.value || null })} />
					</div>
				</CardContent>
			</Card>

			<Button
				disabled={pending}
				onClick={() => start(async () => {
					try {
						await updateEventSettings(event.id, form);
						toast.success("Saved");
						if (form.slug !== event.slug) {
							router.push(`/admin/events/${form.slug}/settings`);
						} else {
							router.refresh();
						}
					} catch (e: any) {
						toast.error(e.message ?? "Failed");
					}
				})}
			>
				Save changes
			</Button>
		</div>
	);
}
