"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, Trash2, Save, GripVertical, Upload, X, Loader2, Sparkles } from "lucide-react";
import {
	saveSiteContent,
	type HeroContent,
	type EventItem,
	type FAQItem,
	type QuickAction,
	type StatItem,
	type SocialLink,
} from "./actions";
import { majorEvents } from "@/components/major-events";

type HomepageContent = {
	hero: HeroContent;
	events: EventItem[];
	faq: FAQItem[];
	quickActions: QuickAction[];
	stats: StatItem[];
	socials: SocialLink[];
	activeMajorEvent: string;
};

export function HomepageContentManagement({ initialContentJson }: { initialContentJson: string }) {
	const initialContent: HomepageContent = JSON.parse(initialContentJson);
	const [hero, setHero] = useState<HeroContent>(initialContent.hero);
	const [events, setEvents] = useState<EventItem[]>(initialContent.events);
	const [faq, setFaq] = useState<FAQItem[]>(initialContent.faq);
	const [quickActions, setQuickActions] = useState<QuickAction[]>(initialContent.quickActions);
	const [stats, setStats] = useState<StatItem[]>(initialContent.stats);
	const [socials, setSocials] = useState<SocialLink[]>(initialContent.socials);
	const [activeMajorEvent, setActiveMajorEvent] = useState<string>(
		initialContent.activeMajorEvent ?? "",
	);
	const [saving, setSaving] = useState<string | null>(null);
	const [uploadingEventImage, setUploadingEventImage] = useState<string | null>(null);
	const [uploadingHeroImage, setUploadingHeroImage] = useState(false);

	const uploadImage = async (file: File): Promise<string | null> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", "content");
		try {
			const res = await fetch("/api/upload", { method: "POST", body: formData });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			return data.url as string;
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "Upload failed");
			return null;
		}
	};

	const save = async (key: string, data: unknown) => {
		setSaving(key);
		const result = await saveSiteContent(`homepage-${key}`, data);
		if (result.success) {
			toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} saved`);
		} else {
			toast.error(result.message || "Failed to save");
		}
		setSaving(null);
	};

	const genId = () => Math.random().toString(36).slice(2, 9);

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Homepage Content</h2>
				<p className="text-muted-foreground text-sm">
					Manage the content sections displayed on the landing page
				</p>
			</div>

			<Tabs defaultValue="majorEvent">
				<TabsList className="mb-6 flex flex-wrap">
					<TabsTrigger value="majorEvent">
						<Sparkles className="mr-1 h-3.5 w-3.5" />
						Major Event
					</TabsTrigger>
					<TabsTrigger value="hero">Hero</TabsTrigger>
					<TabsTrigger value="events">Events</TabsTrigger>
					<TabsTrigger value="faq">FAQ</TabsTrigger>
					<TabsTrigger value="quickActions">Quick Actions</TabsTrigger>
					<TabsTrigger value="stats">Stats</TabsTrigger>
					<TabsTrigger value="socials">Socials</TabsTrigger>
				</TabsList>

				{/* ===== MAJOR EVENT ===== */}
				<TabsContent value="majorEvent">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								Active Major Event
								<Button
									onClick={async () => {
										setSaving("majorEvent");
										const result = await saveSiteContent("homepage-active-major-event", {
											slug: activeMajorEvent,
										});
										if (result.success) {
											toast.success("Major event setting saved");
										} else {
											toast.error(result.message || "Failed to save");
										}
										setSaving(null);
									}}
									disabled={saving === "majorEvent"}
								>
									<Save className="mr-2 h-4 w-4" />
									{saving === "majorEvent" ? "Saving..." : "Save"}
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-muted-foreground text-sm">
								Select a major event to display as a full landing page above the homepage. When
								active, visitors will see the event landing first and the header will reveal as they
								scroll down to the main site.
							</p>
							<div className="space-y-2">
								<Label>Active Event</Label>
								<Select value={activeMajorEvent} onValueChange={(val) => setActiveMajorEvent(val)}>
									<SelectTrigger className="w-full max-w-md">
										<SelectValue placeholder="None (disabled)" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None (disabled)</SelectItem>
										{majorEvents.map((event) => (
											<SelectItem key={event.slug} value={event.slug}>
												{event.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{activeMajorEvent && activeMajorEvent !== "none" && (
								<div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
									<strong>{majorEvents.find((e) => e.slug === activeMajorEvent)?.label}</strong> is
									currently active. Visitors will see the event landing page above the homepage.
								</div>
							)}
							{(!activeMajorEvent || activeMajorEvent === "none") && (
								<div className="text-muted-foreground rounded-md border p-3 text-sm">
									No major event is active. The homepage will display normally without an event
									landing section.
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ===== HERO ===== */}
				<TabsContent value="hero">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								Hero Section
								<Button onClick={() => save("hero", hero)} disabled={saving === "hero"}>
									<Save className="mr-2 h-4 w-4" />
									{saving === "hero" ? "Saving..." : "Save"}
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Title</Label>
								<Input
									value={hero.title}
									onChange={(e) => setHero({ ...hero, title: e.target.value })}
								/>
							</div>
							<div className="space-y-2">
								<Label>Subtitle</Label>
								<Textarea
									value={hero.subtitle}
									onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<Label>Background Image</Label>
								{hero.backgroundImage && (
									<div className="relative mb-2 aspect-video w-full max-w-md overflow-hidden rounded-md border">
										<Image
											src={hero.backgroundImage}
											alt="Hero background"
											fill
											className="object-cover"
											sizes="400px"
										/>
										<button
											className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
											onClick={() => setHero({ ...hero, backgroundImage: "" })}
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								)}
								<div className="flex items-center gap-2">
									<Input
										value={hero.backgroundImage}
										onChange={(e) => setHero({ ...hero, backgroundImage: e.target.value })}
										placeholder="https://... or upload"
									/>
									<Button
										variant="outline"
										size="sm"
										disabled={uploadingHeroImage}
										onClick={() => {
											const input = document.createElement("input");
											input.type = "file";
											input.accept = "image/*";
											input.onchange = async () => {
												const file = input.files?.[0];
												if (!file) return;
												setUploadingHeroImage(true);
												const url = await uploadImage(file);
												if (url) setHero({ ...hero, backgroundImage: url });
												setUploadingHeroImage(false);
											};
											input.click();
										}}
									>
										{uploadingHeroImage ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Upload className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label>CTA Buttons</Label>
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											setHero({
												...hero,
												ctaButtons: [
													...hero.ctaButtons,
													{ label: "", href: "", variant: "primary" },
												],
											})
										}
									>
										<Plus className="mr-1 h-3 w-3" /> Add Button
									</Button>
								</div>
								{hero.ctaButtons.map((btn, i) => (
									<div key={i} className="flex items-end gap-2">
										<div className="flex-1 space-y-1">
											<Label className="text-xs">Label</Label>
											<Input
												value={btn.label}
												onChange={(e) => {
													const updated = [...hero.ctaButtons];
													updated[i] = { ...updated[i], label: e.target.value };
													setHero({ ...hero, ctaButtons: updated });
												}}
											/>
										</div>
										<div className="flex-1 space-y-1">
											<Label className="text-xs">Link</Label>
											<Input
												value={btn.href}
												onChange={(e) => {
													const updated = [...hero.ctaButtons];
													updated[i] = { ...updated[i], href: e.target.value };
													setHero({ ...hero, ctaButtons: updated });
												}}
											/>
										</div>
										<Select
											value={btn.variant}
											onValueChange={(val) => {
												const updated = [...hero.ctaButtons];
												updated[i] = {
													...updated[i],
													variant: val as "primary" | "secondary",
												};
												setHero({ ...hero, ctaButtons: updated });
											}}
										>
											<SelectTrigger className="w-32">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="primary">Primary</SelectItem>
												<SelectItem value="secondary">Secondary</SelectItem>
											</SelectContent>
										</Select>
										<Button
											size="icon"
											variant="ghost"
											onClick={() =>
												setHero({
													...hero,
													ctaButtons: hero.ctaButtons.filter((_, j) => j !== i),
												})
											}
										>
											<Trash2 className="h-4 w-4 text-red-500" />
										</Button>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* ===== EVENTS ===== */}
				<TabsContent value="events">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Events ({events.length})</span>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setEvents([
												...events,
												{
													id: genId(),
													title: "",
													date: new Date().toISOString().split("T")[0],
													time: "7:00 PM",
													location: "",
													description: "",
													category: "Social",
													featured: false,
													googleFormUrl: "",
													images: [],
												},
											])
										}
									>
										<Plus className="mr-1 h-4 w-4" /> Add Event
									</Button>
									<Button onClick={() => save("events", events)} disabled={saving === "events"}>
										<Save className="mr-2 h-4 w-4" />
										{saving === "events" ? "Saving..." : "Save"}
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{events.length === 0 && (
								<p className="text-muted-foreground py-8 text-center">
									No events added yet. Click &quot;Add Event&quot; to get started.
								</p>
							)}
							{events.map((ev, i) => (
								<Card key={ev.id} className="border-dashed">
									<CardContent className="space-y-3 pt-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<GripVertical className="text-muted-foreground h-4 w-4" />
												<span className="text-sm font-medium">Event {i + 1}</span>
											</div>
											<div className="flex items-center gap-3">
												<div className="flex items-center gap-2">
													<Switch
														checked={ev.featured}
														onCheckedChange={(checked) => {
															const updated = [...events];
															updated[i] = { ...updated[i], featured: checked };
															setEvents(updated);
														}}
													/>
													<Label className="text-xs">Featured</Label>
												</div>
												<Button
													size="icon"
													variant="ghost"
													onClick={() => setEvents(events.filter((_, j) => j !== i))}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											</div>
										</div>
										<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
											<div className="space-y-1">
												<Label className="text-xs">Title</Label>
												<Input
													value={ev.title}
													onChange={(e) => {
														const updated = [...events];
														updated[i] = { ...updated[i], title: e.target.value };
														setEvents(updated);
													}}
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Category</Label>
												<Select
													value={ev.category}
													onValueChange={(val) => {
														const updated = [...events];
														updated[i] = { ...updated[i], category: val };
														setEvents(updated);
													}}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{[
															"Social",
															"Academic",
															"Entertainment",
															"Community",
															"Food",
															"Meeting",
														].map((cat) => (
															<SelectItem key={cat} value={cat}>
																{cat}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Start Date</Label>
												<Input
													type="date"
													value={ev.date}
													onChange={(e) => {
														const updated = [...events];
														updated[i] = { ...updated[i], date: e.target.value };
														setEvents(updated);
													}}
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">End Date (optional, for multi-day)</Label>
												<Input
													type="date"
													value={ev.endDate ?? ""}
													onChange={(e) => {
														const updated = [...events];
														updated[i] = { ...updated[i], endDate: e.target.value || undefined };
														setEvents(updated);
													}}
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Time</Label>
												<Input
													value={ev.time}
													onChange={(e) => {
														const updated = [...events];
														updated[i] = { ...updated[i], time: e.target.value };
														setEvents(updated);
													}}
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Location</Label>
												<Input
													value={ev.location}
													onChange={(e) => {
														const updated = [...events];
														updated[i] = { ...updated[i], location: e.target.value };
														setEvents(updated);
													}}
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Google Form / Link URL</Label>
												<Input
													value={ev.googleFormUrl}
													onChange={(e) => {
														const updated = [...events];
														updated[i] = { ...updated[i], googleFormUrl: e.target.value };
														setEvents(updated);
													}}
													placeholder="https://..."
												/>
											</div>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Description</Label>
											<Textarea
												value={ev.description}
												onChange={(e) => {
													const updated = [...events];
													updated[i] = { ...updated[i], description: e.target.value };
													setEvents(updated);
												}}
												rows={2}
											/>
										</div>
										{/* Event Images */}
										<div className="space-y-2">
											<Label className="text-xs">Photos</Label>
											<div className="flex flex-wrap gap-2">
												{(ev.images ?? []).map((img, imgIdx) => (
													<div
														key={imgIdx}
														className="relative h-20 w-20 overflow-hidden rounded-md border"
													>
														<Image
															src={img}
															alt={`Event ${i + 1} photo ${imgIdx + 1}`}
															fill
															className="object-cover"
															sizes="80px"
														/>
														<button
															className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
															onClick={() => {
																const updated = [...events];
																updated[i] = {
																	...updated[i],
																	images: (updated[i].images ?? []).filter((_, j) => j !== imgIdx),
																};
																setEvents(updated);
															}}
														>
															<X className="h-3 w-3" />
														</button>
													</div>
												))}
												<button
													className="text-muted-foreground hover:border-primary hover:text-primary flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed"
													disabled={uploadingEventImage === ev.id}
													onClick={() => {
														const input = document.createElement("input");
														input.type = "file";
														input.accept = "image/*";
														input.multiple = true;
														input.onchange = async () => {
															const files = input.files;
															if (!files || files.length === 0) return;
															setUploadingEventImage(ev.id);
															const newImages = [...(ev.images ?? [])];
															for (const file of Array.from(files)) {
																const url = await uploadImage(file);
																if (url) newImages.push(url);
															}
															const updated = [...events];
															updated[i] = { ...updated[i], images: newImages };
															setEvents(updated);
															setUploadingEventImage(null);
														};
														input.click();
													}}
												>
													{uploadingEventImage === ev.id ? (
														<Loader2 className="h-5 w-5 animate-spin" />
													) : (
														<Plus className="h-5 w-5" />
													)}
												</button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ===== FAQ ===== */}
				<TabsContent value="faq">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>FAQ ({faq.length})</span>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() => setFaq([...faq, { id: genId(), question: "", answer: "" }])}
									>
										<Plus className="mr-1 h-4 w-4" /> Add Question
									</Button>
									<Button onClick={() => save("faq", faq)} disabled={saving === "faq"}>
										<Save className="mr-2 h-4 w-4" />
										{saving === "faq" ? "Saving..." : "Save"}
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{faq.length === 0 && (
								<p className="text-muted-foreground py-8 text-center">
									No FAQ items yet. Click &quot;Add Question&quot; to get started.
								</p>
							)}
							{faq.map((item, i) => (
								<Card key={item.id} className="border-dashed">
									<CardContent className="space-y-3 pt-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<GripVertical className="text-muted-foreground h-4 w-4" />
												<span className="text-sm font-medium">Q{i + 1}</span>
											</div>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => setFaq(faq.filter((_, j) => j !== i))}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Question</Label>
											<Input
												value={item.question}
												onChange={(e) => {
													const updated = [...faq];
													updated[i] = { ...updated[i], question: e.target.value };
													setFaq(updated);
												}}
												placeholder="What is...?"
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Answer</Label>
											<Textarea
												value={item.answer}
												onChange={(e) => {
													const updated = [...faq];
													updated[i] = { ...updated[i], answer: e.target.value };
													setFaq(updated);
												}}
												rows={3}
												placeholder="The answer to the question..."
											/>
										</div>
									</CardContent>
								</Card>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ===== QUICK ACTIONS ===== */}
				<TabsContent value="quickActions">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Quick Actions ({quickActions.length})</span>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setQuickActions([
												...quickActions,
												{
													id: genId(),
													title: "",
													description: "",
													href: "/",
													buttonLabel: "Go",
													iconKey: "calendar",
												},
											])
										}
									>
										<Plus className="mr-1 h-4 w-4" /> Add Action
									</Button>
									<Button
										onClick={() => save("quick-actions", quickActions)}
										disabled={saving === "quick-actions"}
									>
										<Save className="mr-2 h-4 w-4" />
										{saving === "quick-actions" ? "Saving..." : "Save"}
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{quickActions.map((action, i) => (
								<Card key={action.id} className="border-dashed">
									<CardContent className="space-y-3 pt-4">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">Action {i + 1}</span>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => setQuickActions(quickActions.filter((_, j) => j !== i))}
											>
												<Trash2 className="h-4 w-4 text-red-500" />
											</Button>
										</div>
										<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
											<div className="space-y-1">
												<Label className="text-xs">Title</Label>
												<Input
													value={action.title}
													onChange={(e) => {
														const updated = [...quickActions];
														updated[i] = { ...updated[i], title: e.target.value };
														setQuickActions(updated);
													}}
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Icon</Label>
												<Select
													value={action.iconKey}
													onValueChange={(val) => {
														const updated = [...quickActions];
														updated[i] = { ...updated[i], iconKey: val };
														setQuickActions(updated);
													}}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{[
															"calendar",
															"book",
															"file",
															"phone",
															"users",
															"award",
															"star",
															"shopping",
														].map((icon) => (
															<SelectItem key={icon} value={icon}>
																{icon}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Link</Label>
												<Input
													value={action.href}
													onChange={(e) => {
														const updated = [...quickActions];
														updated[i] = { ...updated[i], href: e.target.value };
														setQuickActions(updated);
													}}
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Button Label</Label>
												<Input
													value={action.buttonLabel}
													onChange={(e) => {
														const updated = [...quickActions];
														updated[i] = { ...updated[i], buttonLabel: e.target.value };
														setQuickActions(updated);
													}}
												/>
											</div>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Description</Label>
											<Input
												value={action.description}
												onChange={(e) => {
													const updated = [...quickActions];
													updated[i] = { ...updated[i], description: e.target.value };
													setQuickActions(updated);
												}}
											/>
										</div>
									</CardContent>
								</Card>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ===== STATS ===== */}
				<TabsContent value="stats">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Community Stats ({stats.length})</span>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setStats([...stats, { id: genId(), label: "", value: "", iconKey: "users" }])
										}
									>
										<Plus className="mr-1 h-4 w-4" /> Add Stat
									</Button>
									<Button onClick={() => save("stats", stats)} disabled={saving === "stats"}>
										<Save className="mr-2 h-4 w-4" />
										{saving === "stats" ? "Saving..." : "Save"}
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{stats.map((stat, i) => (
								<div key={stat.id} className="flex items-end gap-3">
									<div className="flex-1 space-y-1">
										<Label className="text-xs">Label</Label>
										<Input
											value={stat.label}
											onChange={(e) => {
												const updated = [...stats];
												updated[i] = { ...updated[i], label: e.target.value };
												setStats(updated);
											}}
										/>
									</div>
									<div className="w-32 space-y-1">
										<Label className="text-xs">Value</Label>
										<Input
											value={stat.value}
											onChange={(e) => {
												const updated = [...stats];
												updated[i] = { ...updated[i], value: e.target.value };
												setStats(updated);
											}}
										/>
									</div>
									<Select
										value={stat.iconKey}
										onValueChange={(val) => {
											const updated = [...stats];
											updated[i] = { ...updated[i], iconKey: val };
											setStats(updated);
										}}
									>
										<SelectTrigger className="w-32">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{["users", "calendar", "award", "star"].map((icon) => (
												<SelectItem key={icon} value={icon}>
													{icon}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										size="icon"
										variant="ghost"
										onClick={() => setStats(stats.filter((_, j) => j !== i))}
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ===== SOCIALS ===== */}
				<TabsContent value="socials">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span>Social Links ({socials.length})</span>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setSocials([
												...socials,
												{
													id: genId(),
													platform: "",
													handle: "",
													url: "",
													logoUrl: "",
												},
											])
										}
									>
										<Plus className="mr-1 h-4 w-4" /> Add Social
									</Button>
									<Button onClick={() => save("socials", socials)} disabled={saving === "socials"}>
										<Save className="mr-2 h-4 w-4" />
										{saving === "socials" ? "Saving..." : "Save"}
									</Button>
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{socials.map((social, i) => (
								<div key={social.id} className="flex items-end gap-3">
									<div className="flex-1 space-y-1">
										<Label className="text-xs">Platform</Label>
										<Input
											value={social.platform}
											onChange={(e) => {
												const updated = [...socials];
												updated[i] = { ...updated[i], platform: e.target.value };
												setSocials(updated);
											}}
											placeholder="Instagram"
										/>
									</div>
									<div className="flex-1 space-y-1">
										<Label className="text-xs">Handle</Label>
										<Input
											value={social.handle}
											onChange={(e) => {
												const updated = [...socials];
												updated[i] = { ...updated[i], handle: e.target.value };
												setSocials(updated);
											}}
											placeholder="@handle"
										/>
									</div>
									<div className="flex-1 space-y-1">
										<Label className="text-xs">URL</Label>
										<Input
											value={social.url}
											onChange={(e) => {
												const updated = [...socials];
												updated[i] = { ...updated[i], url: e.target.value };
												setSocials(updated);
											}}
											placeholder="https://..."
										/>
									</div>
									<div className="w-40 space-y-1">
										<Label className="text-xs">Logo URL</Label>
										<Input
											value={social.logoUrl}
											onChange={(e) => {
												const updated = [...socials];
												updated[i] = { ...updated[i], logoUrl: e.target.value };
												setSocials(updated);
											}}
											placeholder="Logo URL"
										/>
									</div>
									<Button
										size="icon"
										variant="ghost"
										onClick={() => setSocials(socials.filter((_, j) => j !== i))}
									>
										<Trash2 className="h-4 w-4 text-red-500" />
									</Button>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
