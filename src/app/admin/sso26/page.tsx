import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSSO26Config, getSuperlativesResults, getDdayResults, getSSO26Stats, getRawNominations, getRawDdayVotes } from "./actions";
import { SSO26Management } from "./sso26-management";

export const dynamic = "force-dynamic";

export default async function AdminSSO26Page() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isSSO26Admin: true, isSuperAdmin: true },
	});

	if (!user?.isSSO26Admin && !user?.isSuperAdmin) redirect("/");

	const [config, superlativesResults, ddayResults, stats, nominations, ddayVotes] = await Promise.all([
		getSSO26Config(),
		getSuperlativesResults(),
		getDdayResults(),
		getSSO26Stats(),
		getRawNominations(),
		getRawDdayVotes(),
	]);

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold">SSO 2026</h2>
				<p className="text-muted-foreground mt-1">
					Manage superlatives nominations and D-Day voting
				</p>
			</div>
			<SSO26Management
				initialConfig={config}
				initialSuperlativesResults={superlativesResults}
				initialDdayResults={ddayResults}
				initialStats={stats}
				initialNominations={nominations}
				initialDdayVotes={ddayVotes}
			/>
		</div>
	);
}
