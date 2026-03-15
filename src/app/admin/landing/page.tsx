import { getAllHomepageContent } from "./actions";
import { HomepageContentManagement } from "./homepage-content-management";

export default async function HomepageContentPage() {
	const content = await getAllHomepageContent();

	return <HomepageContentManagement initialContent={JSON.parse(JSON.stringify(content))} />;
}
