import { getSSO26Config } from "@/app/admin/sso26/actions";
import { SSO26DdayClient } from "./dday-client";

export const dynamic = "force-dynamic";

export default async function SSO26DdayPage() {
	const config = await getSSO26Config();

	if (!config.ddayOpen) {
		return (
			<div
				className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
				style={{
					background:
						"linear-gradient(180deg, #2d3a44 0%, #4e6a70 40%, #7a8e88 70%, #ECDEBC 100%)",
				}}
			>
				<h2 className="mb-3 font-[family-name:var(--font-gentlemens-script)] text-5xl text-white">
					D-Day Voting
				</h2>
				<p className="font-[family-name:var(--font-farm-to-market)] text-xl text-white/80">
					D-Day voting hasn&apos;t opened yet. Check back soon!
				</p>
			</div>
		);
	}

	return <SSO26DdayClient questions={config.ddayQuestions} />;
}
