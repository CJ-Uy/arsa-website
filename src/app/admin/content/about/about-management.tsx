"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveSiteContent } from "@/app/admin/landing/actions";
import { toast } from "sonner";
import { RichTextEditor } from "@/app/admin/pages/rich-text-editor";

type AboutManagementProps = {
	initialContent: unknown;
};

export function AboutManagement({ initialContent }: AboutManagementProps) {
	const [content, setContent] = useState<unknown>(initialContent ?? { type: "doc", content: [] });
	const [saving, setSaving] = useState(false);

	const handleContentChange = useCallback((json: unknown) => {
		setContent(json);
	}, []);

	const handleSave = async () => {
		setSaving(true);
		try {
			const result = await saveSiteContent("page-about", content);
			if (result.success) {
				toast.success("About page content saved");
			} else {
				toast.error(result.message || "Failed to save content");
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">About Page Content</h2>
					<p className="text-muted-foreground text-sm">
						Edit the content displayed on the About page
					</p>
				</div>
				<Button onClick={handleSave} disabled={saving}>
					{saving ? "Saving..." : "Save Changes"}
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					<Label className="mb-3 block">Content</Label>
					<RichTextEditor content={content} onChange={handleContentChange} />
				</CardContent>
			</Card>
		</div>
	);
}
