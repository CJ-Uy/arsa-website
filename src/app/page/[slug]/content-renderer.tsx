"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";

type ContentRendererProps = {
	content: unknown;
};

export function ContentRenderer({ content }: ContentRendererProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			Link.configure({
				openOnClick: true,
				HTMLAttributes: { class: "text-blue-600 underline hover:text-blue-800", target: "_blank" },
			}),
			Image.configure({
				HTMLAttributes: { class: "max-w-full rounded-lg" },
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Underline,
		],
		content: content as object,
		editable: false,
		editorProps: {
			attributes: {
				class: "prose prose-lg dark:prose-invert max-w-none",
			},
		},
	});

	if (!editor) return null;

	return <EditorContent editor={editor} />;
}
