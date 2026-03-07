"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Bold,
	Italic,
	Underline as UnderlineIcon,
	Strikethrough,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	Quote,
	Code,
	Link as LinkIcon,
	Image as ImageIcon,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Undo,
	Redo,
	Minus,
} from "lucide-react";

type RichTextEditorProps = {
	content: unknown;
	onChange: (json: unknown) => void;
};

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
	const [linkUrl, setLinkUrl] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
	const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
	const initialized = useRef(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: { class: "text-blue-600 underline hover:text-blue-800" },
			}),
			Image.configure({
				HTMLAttributes: { class: "max-w-full rounded-lg" },
			}),
			Placeholder.configure({
				placeholder: "Start writing your content...",
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Underline,
		],
		content: content as object,
		onUpdate: ({ editor }) => {
			onChange(editor.getJSON());
		},
		editorProps: {
			attributes: {
				class: "prose prose-sm sm:prose dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
			},
		},
	});

	// Update editor content when content prop changes (e.g., switching between pages)
	useEffect(() => {
		if (editor && !initialized.current) {
			initialized.current = true;
			return;
		}
		if (editor && content) {
			const currentContent = JSON.stringify(editor.getJSON());
			const newContent = JSON.stringify(content);
			if (currentContent !== newContent) {
				editor.commands.setContent(content as object);
			}
		}
	}, [editor, content]);

	if (!editor) return null;

	const addLink = () => {
		if (linkUrl) {
			editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
			setLinkUrl("");
			setLinkPopoverOpen(false);
		}
	};

	const addImage = () => {
		if (imageUrl) {
			editor.chain().focus().setImage({ src: imageUrl }).run();
			setImageUrl("");
			setImagePopoverOpen(false);
		}
	};

	const ToolbarButton = ({
		onClick,
		isActive,
		children,
		title,
	}: {
		onClick: () => void;
		isActive?: boolean;
		children: React.ReactNode;
		title: string;
	}) => (
		<Button
			type="button"
			variant={isActive ? "default" : "ghost"}
			size="icon"
			className="h-8 w-8"
			onClick={onClick}
			title={title}
		>
			{children}
		</Button>
	);

	return (
		<div className="rounded-md border">
			{/* Toolbar */}
			<div className="flex flex-wrap gap-0.5 border-b p-1">
				{/* Undo/Redo */}
				<ToolbarButton
					onClick={() => editor.chain().focus().undo().run()}
					title="Undo"
				>
					<Undo className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().redo().run()}
					title="Redo"
				>
					<Redo className="h-4 w-4" />
				</ToolbarButton>

				<div className="bg-border mx-1 w-px" />

				{/* Text formatting */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					isActive={editor.isActive("bold")}
					title="Bold"
				>
					<Bold className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					isActive={editor.isActive("italic")}
					title="Italic"
				>
					<Italic className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					isActive={editor.isActive("underline")}
					title="Underline"
				>
					<UnderlineIcon className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleStrike().run()}
					isActive={editor.isActive("strike")}
					title="Strikethrough"
				>
					<Strikethrough className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleCode().run()}
					isActive={editor.isActive("code")}
					title="Inline Code"
				>
					<Code className="h-4 w-4" />
				</ToolbarButton>

				<div className="bg-border mx-1 w-px" />

				{/* Headings */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					isActive={editor.isActive("heading", { level: 1 })}
					title="Heading 1"
				>
					<Heading1 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					isActive={editor.isActive("heading", { level: 2 })}
					title="Heading 2"
				>
					<Heading2 className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					isActive={editor.isActive("heading", { level: 3 })}
					title="Heading 3"
				>
					<Heading3 className="h-4 w-4" />
				</ToolbarButton>

				<div className="bg-border mx-1 w-px" />

				{/* Lists */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					isActive={editor.isActive("bulletList")}
					title="Bullet List"
				>
					<List className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					isActive={editor.isActive("orderedList")}
					title="Ordered List"
				>
					<ListOrdered className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					isActive={editor.isActive("blockquote")}
					title="Blockquote"
				>
					<Quote className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
					title="Horizontal Rule"
				>
					<Minus className="h-4 w-4" />
				</ToolbarButton>

				<div className="bg-border mx-1 w-px" />

				{/* Alignment */}
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign("left").run()}
					isActive={editor.isActive({ textAlign: "left" })}
					title="Align Left"
				>
					<AlignLeft className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign("center").run()}
					isActive={editor.isActive({ textAlign: "center" })}
					title="Align Center"
				>
					<AlignCenter className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign("right").run()}
					isActive={editor.isActive({ textAlign: "right" })}
					title="Align Right"
				>
					<AlignRight className="h-4 w-4" />
				</ToolbarButton>

				<div className="bg-border mx-1 w-px" />

				{/* Link */}
				<Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant={editor.isActive("link") ? "default" : "ghost"}
							size="icon"
							className="h-8 w-8"
							title="Add Link"
						>
							<LinkIcon className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<div className="space-y-2">
							<p className="text-sm font-medium">Insert Link</p>
							<Input
								placeholder="https://example.com"
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && addLink()}
							/>
							<div className="flex gap-2">
								<Button size="sm" onClick={addLink}>
									Add Link
								</Button>
								{editor.isActive("link") && (
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											editor.chain().focus().unsetLink().run();
											setLinkPopoverOpen(false);
										}}
									>
										Remove Link
									</Button>
								)}
							</div>
						</div>
					</PopoverContent>
				</Popover>

				{/* Image */}
				<Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							title="Add Image"
						>
							<ImageIcon className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<div className="space-y-2">
							<p className="text-sm font-medium">Insert Image</p>
							<Input
								placeholder="https://example.com/image.jpg"
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && addImage()}
							/>
							<Button size="sm" onClick={addImage}>
								Add Image
							</Button>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{/* Editor Content */}
			<EditorContent editor={editor} />
		</div>
	);
}
