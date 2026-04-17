"use client";

import { useState, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, BarChart2, Settings, Users, Vote, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import {
	saveSSO26Config,
	getSuperlativesResults,
	getDdayResults,
	getSSO26Stats,
	getRawNominations,
	getRawDdayVotes,
	deleteNomination,
	deleteDdayVote,
	clearAllNominations,
	clearAllDdayVotes,
	type SSO26Config,
	type QuestionResult,
	type RawNomination,
	type RawDdayVote,
} from "./actions";
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

const CHART_COLORS = [
	"#845942",
	"#C89D58",
	"#DD7142",
	"#859893",
	"#4e6a70",
	"#374752",
	"#a0785c",
	"#d4a855",
	"#e88450",
	"#6b8a87",
];

type Stats = {
	nominationCount: number;
	ddayVoteCount: number;
	uniqueNominators: number;
	uniqueDdayVoters: number;
} | null;

interface Props {
	initialConfig: SSO26Config;
	initialSuperlativesResults: QuestionResult[];
	initialDdayResults: QuestionResult[];
	initialStats: Stats;
	initialNominations: RawNomination[];
	initialDdayVotes: RawDdayVote[];
}

function NominationsTable({
	nominations,
	onDelete,
	onClearAll,
}: {
	nominations: RawNomination[];
	onDelete: (id: string) => void;
	onClearAll: () => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const [deletingId, startDeleting] = useTransition();

	if (nominations.length === 0) return null;

	const handleDelete = (id: string) => {
		startDeleting(async () => {
			const result = await deleteNomination(id);
			if (result.success) {
				toast.success("Nomination deleted");
				onDelete(id);
			} else {
				toast.error(result.message ?? "Failed to delete");
			}
		});
	};

	return (
		<div className="mt-2">
			<button
				onClick={() => setExpanded((v) => !v)}
				className="flex w-full items-center justify-between rounded-lg border border-[#C89D58]/20 bg-amber-50/50 px-4 py-2.5 text-sm font-medium text-[#374752] hover:bg-amber-50"
			>
				<span>All Nominations ({nominations.length})</span>
				{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
			</button>
			{expanded && (
				<div className="mt-2 overflow-hidden rounded-lg border border-[#C89D58]/20">
					<div className="flex items-center justify-between border-b border-[#C89D58]/20 bg-amber-50/30 px-4 py-2">
						<span className="text-xs text-stone-500">{nominations.length} nominations</span>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-600">
									<Trash2 className="mr-1 h-3.5 w-3.5" />
									Clear All
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle className="flex items-center gap-2">
										<AlertTriangle className="h-5 w-5 text-red-500" />
										Clear all nominations?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This will permanently delete all {nominations.length} nominations. This cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={onClearAll}
										className="bg-red-500 hover:bg-red-600"
									>
										Delete All
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
					<div className="max-h-96 overflow-y-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-white">
								<tr className="border-b border-[#C89D58]/20 text-xs text-stone-400">
									<th className="px-4 py-2 text-left font-medium">Question</th>
									<th className="px-4 py-2 text-left font-medium">Nominee</th>
									<th className="px-4 py-2 text-left font-medium">Voter</th>
									<th className="px-4 py-2" />
								</tr>
							</thead>
							<tbody>
								{nominations.map((n) => (
									<tr key={n.id} className="border-b border-stone-100 hover:bg-stone-50">
										<td className="px-4 py-2 text-xs text-stone-500">{n.question}</td>
										<td className="px-4 py-2 font-medium text-[#374752]">
											{n.nominee === "OTHER" ? (
												<span className="italic text-[#845942]">
													{n.otherText || "Other (no text)"}
												</span>
											) : (
												n.nominee
											)}
										</td>
										<td className="px-4 py-2 text-xs text-stone-400">{n.userEmail}</td>
										<td className="px-4 py-2">
											<Button
												variant="ghost"
												size="sm"
												disabled={deletingId}
												onClick={() => handleDelete(n.id)}
												className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

function DdayVotesTable({
	votes,
	onDelete,
	onClearAll,
}: {
	votes: RawDdayVote[];
	onDelete: (id: string) => void;
	onClearAll: () => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const [deletingId, startDeleting] = useTransition();

	if (votes.length === 0) return null;

	const handleDelete = (id: string) => {
		startDeleting(async () => {
			const result = await deleteDdayVote(id);
			if (result.success) {
				toast.success("Vote deleted");
				onDelete(id);
			} else {
				toast.error(result.message ?? "Failed to delete");
			}
		});
	};

	return (
		<div className="mt-2">
			<button
				onClick={() => setExpanded((v) => !v)}
				className="flex w-full items-center justify-between rounded-lg border border-[#C89D58]/20 bg-amber-50/50 px-4 py-2.5 text-sm font-medium text-[#374752] hover:bg-amber-50"
			>
				<span>All D-Day Votes ({votes.length})</span>
				{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
			</button>
			{expanded && (
				<div className="mt-2 overflow-hidden rounded-lg border border-[#C89D58]/20">
					<div className="flex items-center justify-between border-b border-[#C89D58]/20 bg-amber-50/30 px-4 py-2">
						<span className="text-xs text-stone-500">{votes.length} total votes</span>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-600">
									<Trash2 className="mr-1 h-3.5 w-3.5" />
									Clear All
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle className="flex items-center gap-2">
										<AlertTriangle className="h-5 w-5 text-red-500" />
										Clear all D-Day votes?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This will permanently delete all {votes.length} D-Day votes. This cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={onClearAll}
										className="bg-red-500 hover:bg-red-600"
									>
										Delete All
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
					<div className="max-h-96 overflow-y-auto">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-white">
								<tr className="border-b border-[#C89D58]/20 text-xs text-stone-400">
									<th className="px-4 py-2 text-left font-medium">Question</th>
									<th className="px-4 py-2 text-left font-medium">Nominee</th>
									<th className="px-4 py-2 text-left font-medium">Voter</th>
									<th className="px-4 py-2 text-left font-medium">Time</th>
									<th className="px-4 py-2" />
								</tr>
							</thead>
							<tbody>
								{votes.map((v) => (
									<tr key={v.id} className="border-b border-stone-100 hover:bg-stone-50">
										<td className="px-4 py-2 text-xs text-stone-500">{v.question}</td>
										<td className="px-4 py-2 font-medium text-[#374752]">{v.nominee}</td>
										<td className="px-4 py-2 text-xs text-stone-400">{v.userEmail}</td>
										<td className="px-4 py-2 text-xs text-stone-400">
											{new Date(v.createdAt).toLocaleString()}
										</td>
										<td className="px-4 py-2">
											<Button
												variant="ghost"
												size="sm"
												disabled={deletingId}
												onClick={() => handleDelete(v.id)}
												className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: { name: string } }[] }) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-lg border border-[#C89D58]/30 bg-white px-4 py-2 shadow-lg">
			<p className="font-semibold text-[#374752]">{payload[0].payload.name}</p>
			<p className="text-[#845942]">
				{payload[0].value} vote{payload[0].value !== 1 ? "s" : ""}
			</p>
		</div>
	);
}

function QuestionResultCard({ q, index }: { q: QuestionResult; index: number }) {
	const total = q.data.reduce((s, d) => s + d.count, 0);
	const top = q.data[0];

	return (
		<div className="overflow-hidden rounded-xl border border-[#C89D58]/20 bg-gradient-to-br from-[#ECDEBC]/30 to-white shadow-sm">
			{/* Header */}
			<div
				className="px-5 py-3"
				style={{ background: `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]}18, transparent)` }}
			>
				<div className="flex items-start justify-between gap-3">
					<h4 className="font-semibold text-[#374752]">{q.question}</h4>
					<span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-stone-500 shadow-sm">
						{total} vote{total !== 1 ? "s" : ""}
					</span>
				</div>
				{top && (
					<p className="mt-0.5 text-sm text-[#845942]">
						🏆 {top.name}
						{total > 0 && (
							<span className="ml-1 text-stone-400">
								({Math.round((top.count / total) * 100)}%)
							</span>
						)}
					</p>
				)}
			</div>

			{/* Chart */}
			<div className="px-2 pb-4 pt-2">
				{q.data.length === 0 ? (
					<p className="py-6 text-center text-sm text-stone-400">No votes yet.</p>
				) : (
					<ResponsiveContainer width="100%" height={Math.max(80, q.data.length * 38)}>
						<BarChart
							data={q.data}
							layout="vertical"
							margin={{ top: 0, right: 48, left: 4, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e2ce" />
							<XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
							<YAxis
								type="category"
								dataKey="name"
								width={156}
								tick={{ fontSize: 12, fill: "#374752" }}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip content={<CustomTooltip />} cursor={{ fill: "#ECDEBC", opacity: 0.5 }} />
							<Bar dataKey="count" radius={[0, 6, 6, 0]} label={{ position: "right", fontSize: 12, fill: "#845942" }}>
								{q.data.map((_, i) => (
									<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				)}
			</div>

			{/* Other responses */}
			{q.otherResponses.length > 0 && (
				<div className="border-t border-[#C89D58]/20 px-5 py-3">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#845942]">
						"Other" write-ins ({q.otherResponses.length})
					</p>
					<ul className="space-y-1">
						{q.otherResponses.map((r, i) => (
							<li key={i} className="rounded-md bg-amber-50 px-3 py-1.5 text-sm text-[#374752]">
								{r.text}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

function ResultsChart({ results, emptyMessage }: { results: QuestionResult[]; emptyMessage: string }) {
	if (results.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-[#C89D58]/30 py-16 text-center">
				<p className="text-muted-foreground text-sm">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{results.map((q, i) => (
				<QuestionResultCard key={q.question} q={q} index={i} />
			))}
		</div>
	);
}

export function SSO26Management({ initialConfig, initialSuperlativesResults, initialDdayResults, initialStats, initialNominations, initialDdayVotes }: Props) {
	// Config state
	const [superlativesOpen, setSuperlativesOpen] = useState(initialConfig.superlativesOpen);
	const [ddayOpen, setDdayOpen] = useState(initialConfig.ddayOpen);
	const [superlativesSeniorsText, setSuperlativesSeniorsText] = useState(
		initialConfig.superlativesSeniors.join("\n"),
	);
	const [superlativesQuestionsText, setSuperlativesQuestionsText] = useState(
		initialConfig.superlativesQuestions.join("\n"),
	);
	const [ddaySeniorsText, setDdaySeniorsText] = useState(initialConfig.ddaySeniors.join("\n"));
	const [ddayQuestionsText, setDdayQuestionsText] = useState(initialConfig.ddayQuestions.join("\n"));

	// Results state
	const [superlativesResults, setSuperlativesResults] = useState(initialSuperlativesResults);
	const [ddayResults, setDdayResults] = useState(initialDdayResults);
	const [stats, setStats] = useState(initialStats);
	const [nominations, setNominations] = useState(initialNominations);
	const [ddayVotes, setDdayVotes] = useState(initialDdayVotes);

	const [isSavingSuperlatives, startSavingSuperlatives] = useTransition();
	const [isSavingDday, startSavingDday] = useTransition();
	const [isRefreshing, startRefreshing] = useTransition();
	const [isClearingNominations, startClearingNominations] = useTransition();
	const [isClearingDday, startClearingDday] = useTransition();

	const parseLines = (text: string) =>
		text
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean);

	const handleSaveSuperlatives = useCallback(() => {
		startSavingSuperlatives(async () => {
			const result = await saveSSO26Config({
				superlativesOpen,
				ddayOpen,
				superlativesSeniors: parseLines(superlativesSeniorsText),
				superlativesQuestions: parseLines(superlativesQuestionsText),
				ddaySeniors: parseLines(ddaySeniorsText),
				ddayQuestions: parseLines(ddayQuestionsText),
			});
			if (result.success) {
				toast.success("Superlatives config saved");
			} else {
				toast.error(result.message);
			}
		});
	}, [superlativesOpen, ddayOpen, superlativesSeniorsText, superlativesQuestionsText, ddaySeniorsText, ddayQuestionsText]);

	const handleSaveDday = useCallback(() => {
		startSavingDday(async () => {
			const result = await saveSSO26Config({
				superlativesOpen,
				ddayOpen,
				superlativesSeniors: parseLines(superlativesSeniorsText),
				superlativesQuestions: parseLines(superlativesQuestionsText),
				ddaySeniors: parseLines(ddaySeniorsText),
				ddayQuestions: parseLines(ddayQuestionsText),
			});
			if (result.success) {
				toast.success("D-Day config saved");
			} else {
				toast.error(result.message);
			}
		});
	}, [superlativesOpen, ddayOpen, superlativesSeniorsText, superlativesQuestionsText, ddaySeniorsText, ddayQuestionsText]);

	const handleRefresh = useCallback(() => {
		startRefreshing(async () => {
			const [sResults, dResults, newStats, rawNoms, rawVotes] = await Promise.all([
				getSuperlativesResults(),
				getDdayResults(),
				getSSO26Stats(),
				getRawNominations(),
				getRawDdayVotes(),
			]);
			setSuperlativesResults(sResults);
			setDdayResults(dResults);
			setStats(newStats);
			setNominations(rawNoms);
			setDdayVotes(rawVotes);
			toast.success("Results refreshed");
		});
	}, []);

	const handleClearAllNominations = useCallback(() => {
		startClearingNominations(async () => {
			const result = await clearAllNominations();
			if (result.success) {
				setNominations([]);
				setSuperlativesResults([]);
				setStats((s) => s ? { ...s, nominationCount: 0, uniqueNominators: 0 } : s);
				toast.success("All nominations cleared");
			} else {
				toast.error(result.message);
			}
		});
	}, []);

	const handleClearAllDday = useCallback(() => {
		startClearingDday(async () => {
			const result = await clearAllDdayVotes();
			if (result.success) {
				setDdayVotes([]);
				setDdayResults([]);
				setStats((s) => s ? { ...s, ddayVoteCount: 0, uniqueDdayVoters: 0 } : s);
				toast.success("All D-Day votes cleared");
			} else {
				toast.error(result.message);
			}
		});
	}, []);

	return (
		<div className="space-y-6">
			{/* Stats overview */}
			{stats && (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<Card>
						<CardContent className="pt-4">
							<div className="flex items-center gap-2">
								<Users className="text-muted-foreground h-4 w-4" />
								<span className="text-muted-foreground text-sm">Nominators</span>
							</div>
							<p className="mt-1 text-2xl font-bold">{stats.uniqueNominators}</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-4">
							<div className="flex items-center gap-2">
								<Vote className="text-muted-foreground h-4 w-4" />
								<span className="text-muted-foreground text-sm">Nominations</span>
							</div>
							<p className="mt-1 text-2xl font-bold">{stats.nominationCount}</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-4">
							<div className="flex items-center gap-2">
								<Users className="text-muted-foreground h-4 w-4" />
								<span className="text-muted-foreground text-sm">D-Day Voters</span>
							</div>
							<p className="mt-1 text-2xl font-bold">{stats.uniqueDdayVoters}</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-4">
							<div className="flex items-center gap-2">
								<BarChart2 className="text-muted-foreground h-4 w-4" />
								<span className="text-muted-foreground text-sm">D-Day Votes</span>
							</div>
							<p className="mt-1 text-2xl font-bold">{stats.ddayVoteCount}</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Tabs defaultValue="superlatives">
				<TabsList>
					<TabsTrigger value="superlatives">Superlatives</TabsTrigger>
					<TabsTrigger value="dday">D-Day</TabsTrigger>
				</TabsList>

				{/* ── SUPERLATIVES TAB ── */}
				<TabsContent value="superlatives" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								Superlatives Settings
							</CardTitle>
							<CardDescription>
								Configure the nominations form for seniors&apos; superlatives.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<p className="font-medium">Form Status</p>
									<p className="text-muted-foreground text-sm">
										{superlativesOpen
											? "Form is accepting nominations"
											: "Form is closed"}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant={superlativesOpen ? "default" : "secondary"}>
										{superlativesOpen ? "Open" : "Closed"}
									</Badge>
									<Switch
										checked={superlativesOpen}
										onCheckedChange={setSuperlativesOpen}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="s-seniors">
									Senior Names{" "}
									<span className="text-muted-foreground font-normal">
										(one per line — {parseLines(superlativesSeniorsText).length} entries)
									</span>
								</Label>
								<Textarea
									id="s-seniors"
									value={superlativesSeniorsText}
									onChange={(e) => setSuperlativesSeniorsText(e.target.value)}
									placeholder={"Juan dela Cruz\nMaria Santos\n..."}
									rows={10}
									className="font-mono text-sm"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="s-questions">
									Superlative Categories{" "}
									<span className="text-muted-foreground font-normal">
										(one per line — {parseLines(superlativesQuestionsText).length} categories)
									</span>
								</Label>
								<Textarea
									id="s-questions"
									value={superlativesQuestionsText}
									onChange={(e) => setSuperlativesQuestionsText(e.target.value)}
									placeholder={"Most likely to become president\nMost likely to go viral\n..."}
									rows={8}
									className="font-mono text-sm"
								/>
							</div>

							<Button
								onClick={handleSaveSuperlatives}
								disabled={isSavingSuperlatives}
								className="bg-[#845942] hover:bg-[#6e4a37]"
							>
								{isSavingSuperlatives ? "Saving..." : "Save Superlatives Config"}
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<BarChart2 className="h-4 w-4" />
										Nomination Results
									</CardTitle>
									<CardDescription>Live vote counts per category.</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={handleRefresh}
									disabled={isRefreshing}
								>
									<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
									Refresh
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<ResultsChart
								results={superlativesResults}
								emptyMessage="No nominations yet. Configure categories above and share the form."
							/>
							<NominationsTable
								nominations={nominations}
								onDelete={(id) => setNominations((prev) => prev.filter((n) => n.id !== id))}
								onClearAll={handleClearAllNominations}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				{/* ── DDAY TAB ── */}
				<TabsContent value="dday" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								D-Day Settings
							</CardTitle>
							<CardDescription>
								Configure the D-Day voting form. Voters can submit unlimited times.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<p className="font-medium">Form Status</p>
									<p className="text-muted-foreground text-sm">
										{ddayOpen ? "D-Day voting is open" : "D-Day voting is closed"}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant={ddayOpen ? "default" : "secondary"}>
										{ddayOpen ? "Open" : "Closed"}
									</Badge>
									<Switch checked={ddayOpen} onCheckedChange={setDdayOpen} />
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="d-seniors">
									Senior Names{" "}
									<span className="text-muted-foreground font-normal">
										(one per line — {parseLines(ddaySeniorsText).length} entries)
									</span>
								</Label>
								<Textarea
									id="d-seniors"
									value={ddaySeniorsText}
									onChange={(e) => setDdaySeniorsText(e.target.value)}
									placeholder={"Juan dela Cruz\nMaria Santos\n..."}
									rows={10}
									className="font-mono text-sm"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="d-questions">
									D-Day Categories{" "}
									<span className="text-muted-foreground font-normal">
										(one per line — {parseLines(ddayQuestionsText).length} categories)
									</span>
								</Label>
								<Textarea
									id="d-questions"
									value={ddayQuestionsText}
									onChange={(e) => setDdayQuestionsText(e.target.value)}
									placeholder={"Best dressed\nMost likely to be famous\n..."}
									rows={8}
									className="font-mono text-sm"
								/>
							</div>

							<Button
								onClick={handleSaveDday}
								disabled={isSavingDday}
								className="bg-[#845942] hover:bg-[#6e4a37]"
							>
								{isSavingDday ? "Saving..." : "Save D-Day Config"}
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="flex items-center gap-2">
										<BarChart2 className="h-4 w-4" />
										D-Day Results
									</CardTitle>
									<CardDescription>Total vote counts per category.</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={handleRefresh}
									disabled={isRefreshing}
								>
									<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
									Refresh
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<ResultsChart
								results={ddayResults}
								emptyMessage="No D-Day votes yet. Configure categories above and share the form."
							/>
							<DdayVotesTable
								votes={ddayVotes}
								onDelete={(id) => setDdayVotes((prev) => prev.filter((v) => v.id !== id))}
								onClearAll={handleClearAllDday}
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
