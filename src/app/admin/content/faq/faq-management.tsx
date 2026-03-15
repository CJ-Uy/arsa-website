"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TiptapImage from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { saveSiteContent, type FAQItem } from "@/app/admin/landing/actions";
import { toast } from "sonner";
import {
	Bold,
	Italic,
	Underline as UnderlineIcon,
	Strikethrough,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	Quote,
	Link as LinkIcon,
	Minus,
	Plus,
	Trash2,
	GripVertical,
	Save,
	Table as TableIcon,
	ImageIcon,
	Loader2 as SpinnerIcon,
	Indent,
	Outdent,
} from "lucide-react";

// --- Resizable Image Extension ---

const ResizableImage = TiptapImage.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			width: {
				default: null,
				parseHTML: (element) => element.getAttribute("width") || element.style.width || null,
				renderHTML: (attributes) => {
					if (!attributes.width) return {};
					return { width: attributes.width, style: `width: ${attributes.width}` };
				},
			},
		};
	},
});

// --- Custom Table Cell extensions that allow block content (lists, headings, etc.) ---

const CustomTableCell = TableCell.extend({
	content: "block+",
});

const CustomTableHeader = TableHeader.extend({
	content: "block+",
});

// --- Inline TipTap HTML Editor ---

async function uploadContentImage(file: File): Promise<string | null> {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("type", "content");
	try {
		const res = await fetch("/api/upload", { method: "POST", body: formData });
		const data = await res.json();
		if (!res.ok) throw new Error(data.error);
		return data.url;
	} catch (err) {
		toast.error("Failed to upload image");
		return null;
	}
}

function FAQRichTextEditor({
	content,
	onChange,
}: {
	content: string;
	onChange: (html: string) => void;
}) {
	const [linkUrl, setLinkUrl] = useState("");
	const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
	const [uploadingImage, setUploadingImage] = useState(false);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: { levels: [2, 3] },
			}),
			LinkExtension.configure({
				openOnClick: false,
				HTMLAttributes: { class: "text-blue-600 underline hover:text-blue-800" },
			}),
			Underline,
			ResizableImage.configure({
				HTMLAttributes: { class: "rounded-md max-w-full h-auto" },
			}),
			Table.configure({
				resizable: true,
				HTMLAttributes: { class: "border-collapse border border-gray-300" },
			}),
			TableRow,
			CustomTableCell.configure({
				HTMLAttributes: { class: "border border-gray-300 p-2" },
			}),
			CustomTableHeader.configure({
				HTMLAttributes: { class: "border border-gray-300 p-2 bg-gray-100 font-bold" },
			}),
		],
		content: content || "",
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class: "prose prose-sm dark:prose-invert max-w-none min-h-[150px] p-3 focus:outline-none",
			},
			handleKeyDown: (_view, event) => {
				// Tab / Shift+Tab for list indentation (override table Tab navigation when in a list)
				if (event.key === "Tab" && editor) {
					const isInList = editor.isActive("bulletList") || editor.isActive("orderedList");
					if (isInList) {
						event.preventDefault();
						if (event.shiftKey) {
							editor.chain().liftListItem("listItem").run();
						} else {
							editor.chain().sinkListItem("listItem").run();
						}
						return true;
					}
				}
				return false;
			},
		},
	});

	if (!editor) return null;

	const addLink = () => {
		if (linkUrl) {
			editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
			setLinkUrl("");
			setLinkPopoverOpen(false);
		}
	};

	const handleImageUpload = async (file: File) => {
		setUploadingImage(true);
		const url = await uploadContentImage(file);
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
		setUploadingImage(false);
	};

	return (
		<div className="rounded-md border">
			<EditorToolbar
				editor={editor}
				linkUrl={linkUrl}
				setLinkUrl={setLinkUrl}
				linkPopoverOpen={linkPopoverOpen}
				setLinkPopoverOpen={setLinkPopoverOpen}
				addLink={addLink}
				onUploadImage={handleImageUpload}
				uploadingImage={uploadingImage}
			/>
			<div className="[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-gray-600 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-md [&_.ProseMirror_li]:my-0.5 [&_.ProseMirror_li>p]:inline [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:p-2 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:bg-gray-100 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:font-bold [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul_ul]:list-[circle] [&_.ProseMirror_ul_ul_ul]:list-[square]">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}

function EditorToolbar({
	editor,
	linkUrl,
	setLinkUrl,
	linkPopoverOpen,
	setLinkPopoverOpen,
	addLink,
	onUploadImage,
	uploadingImage,
}: {
	editor: Editor;
	linkUrl: string;
	setLinkUrl: (v: string) => void;
	linkPopoverOpen: boolean;
	setLinkPopoverOpen: (v: boolean) => void;
	addLink: () => void;
	onUploadImage: (file: File) => void;
	uploadingImage: boolean;
}) {
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
		<div className="flex flex-wrap gap-0.5 border-b p-1">
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

			<div className="bg-border mx-1 w-px" />

			{/* Headings */}
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
				onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
				title="Indent (nest list item)"
			>
				<Indent className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().liftListItem("listItem").run()}
				title="Outdent (lift list item)"
			>
				<Outdent className="h-4 w-4" />
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

			<div className="bg-border mx-1 w-px" />

			{/* Table */}
			<ToolbarButton
				onClick={() =>
					editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
				}
				isActive={editor.isActive("table")}
				title="Insert Table"
			>
				<TableIcon className="h-4 w-4" />
			</ToolbarButton>
			{editor.isActive("table") && (
				<>
					<ToolbarButton
						onClick={() => editor.chain().focus().addColumnAfter().run()}
						title="Add Column"
					>
						<span className="text-xs font-bold">+Col</span>
					</ToolbarButton>
					<ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">
						<span className="text-xs font-bold">+Row</span>
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().deleteColumn().run()}
						title="Delete Column"
					>
						<span className="text-xs font-bold">-Col</span>
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().deleteRow().run()}
						title="Delete Row"
					>
						<span className="text-xs font-bold">-Row</span>
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().deleteTable().run()}
						title="Delete Table"
					>
						<span className="text-destructive text-xs font-bold">Del</span>
					</ToolbarButton>
				</>
			)}

			<div className="bg-border mx-1 w-px" />

			{/* Image upload */}
			<label title="Insert Image">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					disabled={uploadingImage}
					asChild
				>
					<span>
						{uploadingImage ? (
							<SpinnerIcon className="h-4 w-4 animate-spin" />
						) : (
							<ImageIcon className="h-4 w-4" />
						)}
					</span>
				</Button>
				<input
					type="file"
					accept="image/*"
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) onUploadImage(file);
						e.target.value = "";
					}}
				/>
			</label>

			{/* Image resize controls (shown when image is selected) */}
			{editor.isActive("image") && (
				<>
					<div className="bg-border mx-1 w-px" />
					{(["25%", "50%", "75%", "100%"] as const).map((size) => (
						<Button
							key={size}
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 px-2 text-xs"
							onClick={() =>
								editor.chain().focus().updateAttributes("image", { width: size }).run()
							}
							title={`Resize image to ${size}`}
						>
							{size}
						</Button>
					))}
				</>
			)}
		</div>
	);
}

// --- FAQ Management ---

type Props = {
	initialFaq: FAQItem[];
};

export function FAQContentManagement({ initialFaq }: Props) {
	const [faq, setFaq] = useState<FAQItem[]>(initialFaq);
	const [saving, setSaving] = useState(false);

	const addItem = useCallback(() => {
		setFaq((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				question: "",
				answer: "",
			},
		]);
	}, []);

	const removeItem = useCallback((id: string) => {
		setFaq((prev) => prev.filter((item) => item.id !== id));
	}, []);

	const updateQuestion = useCallback((id: string, question: string) => {
		setFaq((prev) => prev.map((item) => (item.id === id ? { ...item, question } : item)));
	}, []);

	const updateAnswer = useCallback((id: string, answer: string) => {
		setFaq((prev) => prev.map((item) => (item.id === id ? { ...item, answer } : item)));
	}, []);

	const handleSave = async () => {
		setSaving(true);
		try {
			const result = await saveSiteContent("homepage-faq", faq);
			if (result.success) {
				toast.success("FAQ saved successfully");
			} else {
				toast.error(result.message || "Failed to save FAQ");
			}
		} catch {
			toast.error("Failed to save FAQ");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">FAQ Management</h1>
					<p className="text-muted-foreground text-sm">
						Manage frequently asked questions displayed on the homepage.
					</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={addItem} variant="outline">
						<Plus className="mr-2 h-4 w-4" />
						Add Question
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						<Save className="mr-2 h-4 w-4" />
						{saving ? "Saving..." : "Save"}
					</Button>
				</div>
			</div>

			{faq.length === 0 && (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">
							No FAQ items yet. Click "Add Question" to get started.
						</p>
					</CardContent>
				</Card>
			)}

			<div className="space-y-4">
				{faq.map((item, index) => (
					<FAQCard
						key={item.id}
						item={item}
						index={index}
						onUpdateQuestion={updateQuestion}
						onUpdateAnswer={updateAnswer}
						onRemove={removeItem}
					/>
				))}
			</div>

			{faq.length > 0 && (
				<div className="flex justify-end gap-2">
					<Button onClick={addItem} variant="outline">
						<Plus className="mr-2 h-4 w-4" />
						Add Question
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						<Save className="mr-2 h-4 w-4" />
						{saving ? "Saving..." : "Save"}
					</Button>
				</div>
			)}
		</div>
	);
}

function FAQCard({
	item,
	index,
	onUpdateQuestion,
	onUpdateAnswer,
	onRemove,
}: {
	item: FAQItem;
	index: number;
	onUpdateQuestion: (id: string, question: string) => void;
	onUpdateAnswer: (id: string, answer: string) => void;
	onRemove: (id: string) => void;
}) {
	return (
		<Card>
			<CardContent className="space-y-4 pt-6">
				<div className="flex items-start gap-3">
					<div className="text-muted-foreground mt-2 cursor-grab">
						<GripVertical className="h-5 w-5" />
					</div>
					<div className="flex-1 space-y-4">
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-sm font-medium">Q{index + 1}.</span>
							<Input
								value={item.question}
								onChange={(e) => onUpdateQuestion(item.id, e.target.value)}
								placeholder="Enter the question..."
								className="flex-1"
							/>
						</div>
						<div>
							<label className="text-muted-foreground mb-1 block text-sm font-medium">Answer</label>
							<FAQRichTextEditor
								content={item.answer}
								onChange={(html) => onUpdateAnswer(item.id, html)}
							/>
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="text-destructive hover:text-destructive mt-1"
						onClick={() => onRemove(item.id)}
						title="Delete question"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
