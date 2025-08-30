import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import prisma from "@/generated/prisma";

// This tells Next.js to not cache this page, as it's dynamic
export const revalidate = 0;

// The props for this page will include the dynamic segment `code`
type Props = {
	params: {
		redirect_code: string;
	};
};

export default async function CodeRedirectPage({ params }: Props) {
	// 1. Get the code from the URL params
	// We decode it in case it contains special characters
	const code = decodeURIComponent(params.redirect_code);

	return <h1>{code}</h1>;

	//   // 4. If no link is found, trigger the 404 page
	//   notFound();
}
