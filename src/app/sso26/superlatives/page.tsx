import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSSO26Config } from "@/app/admin/sso26/actions";
import { getUserNominations } from "../actions";
import { SSO26Gate } from "../sso26-gate";
import { SSO26SuperlativesClient } from "./superlatives-client";

export const dynamic = "force-dynamic";

const ALLOWED_DOMAINS = ["@student.ateneo.edu", "@ateneo.edu"];

export default async function SSO26SuperlativesPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session?.user) {
		return <SSO26Gate callbackURL="/sso26/superlatives" />;
	}

	const email = session.user.email ?? "";
	const isAllowed = ALLOWED_DOMAINS.some((d) => email.endsWith(d));

	if (!isAllowed) {
		return <SSO26Gate wrongDomain email={email} callbackURL="/sso26/superlatives" />;
	}

	const config = await getSSO26Config();

	if (!config.superlativesOpen) {
		return (
			<div
				className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
				style={{
					background:
						"linear-gradient(180deg, #2d3a44 0%, #4e6a70 40%, #7a8e88 70%, #ECDEBC 100%)",
				}}
			>
				<h2 className="mb-3 font-[family-name:var(--font-gentlemens-script)] text-5xl text-white">
					Superlatives
				</h2>
				<p className="font-[family-name:var(--font-farm-to-market)] text-xl text-white/80">
					Nominations are currently closed. Check back soon!
				</p>
			</div>
		);
	}

	const initialNominations = await getUserNominations();

	return (
		<SSO26SuperlativesClient
			questions={config.superlativesQuestions}
			seniors={config.superlativesSeniors}
			initialNominations={initialNominations}
		/>
	);
}
