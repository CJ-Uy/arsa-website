"use client";

import imageCompression from "browser-image-compression";

export type CompressOptions = {
	maxWidthOrHeight?: number;
	maxSizeMB?: number;
	quality?: number;
};

/**
 * Compress an image in the browser to WebP. Replaces server-side Sharp.
 *
 * - Skips compression for non-image / receipt-style uploads (preserves OCR fidelity).
 * - Resizes longest edge to 1200px by default, WebP at quality 0.85.
 */
export async function compressForUpload(
	file: File,
	options: CompressOptions = {},
): Promise<File> {
	if (!file.type.startsWith("image/")) return file;

	const { maxWidthOrHeight = 1200, maxSizeMB = 2 } = options;

	const compressed = await imageCompression(file, {
		maxSizeMB,
		maxWidthOrHeight,
		useWebWorker: true,
		fileType: "image/webp",
		initialQuality: options.quality ?? 0.85,
	});

	const base = file.name.replace(/\.[^.]+$/, "");
	return new File([compressed], `${base}.webp`, { type: "image/webp" });
}
