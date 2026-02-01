"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
	text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<button
			onClick={handleCopy}
			className="text-muted-foreground hover:text-foreground transition-colors"
			title="Copy to clipboard"
		>
			{copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
		</button>
	);
}
