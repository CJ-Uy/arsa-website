"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, Database, Files, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type TableInfo = { name: string; audit: boolean; sensitive: boolean };

export function BackupClient({ tables }: { tables: TableInfo[] }) {
	const [includeAuditTables, setIncludeAuditTables] = useState(true);
	const [includeFiles, setIncludeFiles] = useState(false);
	const [running, setRunning] = useState(false);

	const auditCount = tables.filter((t) => t.audit).length;
	const sensitiveCount = tables.filter((t) => t.sensitive).length;
	const coreCount = tables.length - auditCount;

	async function handleExport() {
		if (running) return;
		setRunning(true);
		const startedAt = Date.now();
		const toastId = toast.loading("Generating backup… this may take a while.");

		try {
			const res = await fetch("/api/admin/backup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ includeAuditTables, includeFiles }),
			});

			if (!res.ok) {
				const text = await res.text().catch(() => "");
				throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
			}

			const filename =
				res.headers.get("X-Backup-Filename") ||
				`arsa-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);

			const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
			const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
			toast.success(`Backup ready (${sizeMB} MB in ${seconds}s)`, { id: toastId });
		} catch (err: any) {
			console.error(err);
			toast.error(`Backup failed: ${err?.message ?? "unknown error"}`, { id: toastId });
		} finally {
			setRunning(false);
		}
	}

	return (
		<div className="space-y-6">
			<Alert>
				<Database className="h-4 w-4" />
				<AlertTitle>Universal export format</AlertTitle>
				<AlertDescription>
					Output is a single ZIP containing <code>manifest.json</code> + one{" "}
					<code>data/&lt;Table&gt;.ndjson</code> file per model. Dates are ISO 8601, JSON columns
					stay nested, Postgres arrays serialize as JSON arrays. Re-importable into any
					DB/ORM with a small loader script.
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader>
					<CardTitle>Export options</CardTitle>
					<CardDescription>Choose what to include in the backup.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-start justify-between gap-4 rounded-md border p-4">
						<div>
							<div className="font-medium flex items-center gap-2">
								<Files className="h-4 w-4" />
								Audit / log tables
							</div>
							<p className="text-muted-foreground mt-1 text-sm">
								RedirectClick, ShopClick, ShopPurchase, EmailLog, SSO26DdayVote. Can be
								large. Off → only core tables exported.
							</p>
						</div>
						<Switch
							checked={includeAuditTables}
							onCheckedChange={setIncludeAuditTables}
							disabled={running}
						/>
					</div>

					<div className="flex items-start justify-between gap-4 rounded-md border p-4">
						<div>
							<div className="font-medium flex items-center gap-2">
								<Database className="h-4 w-4" />
								Include MinIO files
							</div>
							<p className="text-muted-foreground mt-1 text-sm">
								Pulls all objects from products/receipts/events/content buckets into{" "}
								<code>files/</code>. Output can be many GB — use only when migrating storage.
							</p>
						</div>
						<Switch
							checked={includeFiles}
							onCheckedChange={setIncludeFiles}
							disabled={running}
						/>
					</div>

					<div className="rounded-md border bg-amber-50 p-4 text-sm dark:bg-amber-950/30">
						<div className="flex items-start gap-2">
							<Shield className="mt-0.5 h-4 w-4 shrink-0" />
							<div>
								<div className="font-medium">Sensitive data included</div>
								<p className="text-muted-foreground mt-1">
									Backup contains Session/Account/Verification rows (auth tokens,
									OAuth refresh tokens, hashed secrets). Treat the ZIP like a credential
									dump — store encrypted, never share publicly.
								</p>
							</div>
						</div>
					</div>

					<Button
						onClick={handleExport}
						disabled={running}
						size="lg"
						className="w-full sm:w-auto"
					>
						{running ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Generating backup…
							</>
						) : (
							<>
								<Download className="mr-2 h-4 w-4" />
								Generate &amp; download backup
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Tables in this backup</CardTitle>
					<CardDescription>
						{coreCount} core · {auditCount} audit · {sensitiveCount} sensitive. Listed in
						import order (parents → children).
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{tables.map((t, i) => {
							const skipped = t.audit && !includeAuditTables;
							return (
								<div
									key={t.name}
									className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${
										skipped ? "opacity-50" : ""
									}`}
								>
									<span className="font-mono">
										<span className="text-muted-foreground mr-2">
											{String(i + 1).padStart(2, "0")}
										</span>
										{t.name}
									</span>
									<div className="flex gap-1">
										{t.audit && (
											<Badge variant="secondary" className="text-xs">
												audit
											</Badge>
										)}
										{t.sensitive && (
											<Badge variant="destructive" className="text-xs">
												sensitive
											</Badge>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<Alert variant="default">
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Cloudflare D1 migration tips</AlertTitle>
				<AlertDescription>
					<ul className="ml-4 mt-2 list-disc space-y-1 text-sm">
						<li>D1 is SQLite — no native Decimal/JSON/array types. Store as TEXT/REAL.</li>
						<li>
							Postgres <code>String[]</code> → SQLite TEXT (keep JSON-stringified).
						</li>
						<li>
							Json columns (eventData, themeConfig, packageSelections, …) → store as TEXT
							in D1.
						</li>
						<li>
							Float columns map to D1 REAL with no loss for the values used here.
						</li>
						<li>
							Better Auth has a Drizzle/D1 adapter — re-import users; sessions can be
							skipped (let users re-login) if migration is delayed.
						</li>
						<li>
							MinIO → R2: same S3 API, copy buckets via <code>rclone</code> or use the
							"Include MinIO files" toggle and <code>wrangler r2 object put</code>.
						</li>
					</ul>
				</AlertDescription>
			</Alert>
		</div>
	);
}
