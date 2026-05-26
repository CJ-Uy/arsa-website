"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mergeTicketEventIntoEvent, renameEventSlug, type AuditRow } from "./actions";
import { toast } from "sonner";

type Props = {
	initial: {
		events: AuditRow[];
		unmatchedTicketEvents: { id: string; name: string }[];
	};
};

export function MigrationAuditClient({ initial }: Props) {
	const [pending, start] = useTransition();
	const [mergeInputs, setMergeInputs] = useState<Record<string, string>>({});
	const [slugInputs, setSlugInputs] = useState<Record<string, string>>({});

	return (
		<div className="space-y-6 p-6">
			<h1 className="text-3xl font-bold uppercase tracking-tight text-[#0e3663]">Migration Audit</h1>
			<p className="text-sm text-muted-foreground">
				Verify the event umbrella backfill. Rename slugs, merge unmatched TicketEvents.
			</p>

			<Card>
				<CardHeader>
					<CardTitle>Events ({initial.events.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left border-b">
								<th className="pb-2 pr-4">Slug</th>
								<th className="pb-2 pr-4">Name</th>
								<th className="pb-2 pr-4">Status</th>
								<th className="pb-2 pr-4">Modules</th>
								<th className="pb-2">Rename slug</th>
							</tr>
						</thead>
						<tbody>
							{initial.events.map((e) => (
								<tr key={e.eventId} className="border-t">
									<td className="py-2 pr-4 font-mono text-xs">{e.slug}</td>
									<td className="py-2 pr-4">{e.name}</td>
									<td className="py-2 pr-4">
										<Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
									</td>
									<td className="py-2 pr-4 space-x-1">
										{e.hasShopRow && <Badge variant="outline">shop</Badge>}
										{e.hasTicketsRow && <Badge variant="outline">tickets</Badge>}
									</td>
									<td className="py-2">
										<div className="flex gap-2">
											<Input
												className="h-7 text-xs w-48"
												value={slugInputs[e.eventId] ?? ""}
												placeholder={e.slug}
												onChange={(ev) =>
													setSlugInputs((s) => ({ ...s, [e.eventId]: ev.target.value }))
												}
											/>
											<Button
												size="sm"
												variant="outline"
												disabled={pending || !slugInputs[e.eventId]}
												onClick={() =>
													start(async () => {
														await renameEventSlug(e.eventId, slugInputs[e.eventId]);
														toast.success("Slug renamed");
													})
												}
											>
												Save
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Unmatched TicketEvents ({initial.unmatchedTicketEvents.length})</CardTitle>
				</CardHeader>
				<CardContent>
					{initial.unmatchedTicketEvents.length === 0 ? (
						<p className="text-sm text-muted-foreground">All TicketEvents have been backfilled. ✓</p>
					) : (
						<div className="space-y-2">
							{initial.unmatchedTicketEvents.map((te) => (
								<div key={te.id} className="border rounded p-3 flex items-center gap-3">
									<div className="flex-1">
										<p className="font-medium text-sm">{te.name}</p>
										<p className="text-xs font-mono text-muted-foreground">{te.id}</p>
									</div>
									<Input
										className="h-7 text-xs w-72"
										placeholder="target event.id to merge into"
										value={mergeInputs[te.id] ?? ""}
										onChange={(ev) => setMergeInputs((s) => ({ ...s, [te.id]: ev.target.value }))}
									/>
									<Button
										size="sm"
										disabled={pending || !mergeInputs[te.id]}
										onClick={() =>
											start(async () => {
												await mergeTicketEventIntoEvent(te.id, mergeInputs[te.id]);
												toast.success("Merged");
											})
										}
									>
										Merge
									</Button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
