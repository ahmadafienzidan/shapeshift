import { Button, Spinner } from "@heroui/react";
import { Download, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { createZip, downloadBlob } from "../lib/files";
import { decodeImage } from "../lib/image";
import type { BatchOutput } from "../lib/useBatch";
import { Dropzone, type FileKind } from "./Dropzone";

type Entry = { id: string; file: File; bitmap: ImageBitmap };

const PREVIEW_SIZE = 480;

async function previewBitmap(file: File): Promise<ImageBitmap> {
	const full = await decodeImage(file);
	const scale = Math.min(
		1,
		(PREVIEW_SIZE * 2) / Math.max(full.width, full.height),
	);
	const bitmap = await createImageBitmap(full, {
		resizeWidth: Math.round(full.width * scale),
		resizeHeight: Math.round(full.height * scale),
		resizeQuality: "high",
	});
	full.close();
	return bitmap;
}

function Preview({
	entry,
	frame,
	draw,
	onRemove,
}: {
	entry: Entry;
	frame: { width: number; height: number };
	draw: (context: CanvasRenderingContext2D, bitmap: ImageBitmap) => void;
	onRemove: () => void;
}) {
	const intl = useIntl();
	const canvas = useRef<HTMLCanvasElement>(null);

	// Redraws on every render: the parent only re-renders when its options
	// change, and a preview-sized canvas is cheap to paint.
	useEffect(() => {
		const element = canvas.current;
		const context = element?.getContext("2d");
		if (!element || !context) return;
		const scale = PREVIEW_SIZE / Math.max(frame.width, frame.height);
		element.width = Math.max(1, Math.round(frame.width * scale));
		element.height = Math.max(1, Math.round(frame.height * scale));
		draw(context, entry.bitmap);
	});

	return (
		<li className="group flex min-w-0 flex-col gap-2">
			<div className="relative grid aspect-square place-items-center rounded border border-border bg-surface-secondary p-2">
				<canvas
					ref={canvas}
					className="max-h-full max-w-full shadow-md"
					style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
				/>
				<Button
					isIconOnly
					size="sm"
					variant="tertiary"
					aria-label={intl.formatMessage({ id: "combine.remove" })}
					onPress={onRemove}
					className="absolute top-1.5 right-1.5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
				>
					<X size={14} />
				</Button>
			</div>
			<p className="truncate font-mono text-muted text-xs">{entry.file.name}</p>
		</li>
	);
}

// Upload, see every result live while tweaking options, then process the
// full-size files only when asked.
export function PreviewBatch({
	kind,
	ready,
	summary,
	actionId,
	zipName,
	frame,
	draw,
	process,
}: {
	kind: FileKind;
	ready: boolean;
	summary?: string;
	actionId: string;
	zipName: string;
	frame: (bitmap: ImageBitmap) => { width: number; height: number };
	draw: (context: CanvasRenderingContext2D, bitmap: ImageBitmap) => void;
	process: (file: File) => Promise<BatchOutput>;
}) {
	const intl = useIntl();
	const [entries, setEntries] = useState<Entry[]>([]);
	const [busy, setBusy] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string>();

	const add = async (files: File[]) => {
		setError(undefined);
		try {
			const added = await Promise.all(
				files.map(async (file) => ({
					id: crypto.randomUUID(),
					file,
					bitmap: await previewBitmap(file),
				})),
			);
			setEntries((current) => [...current, ...added]);
		} catch (caught) {
			setError(String(caught));
		}
	};

	const remove = (removed: Entry[]) => {
		for (const entry of removed) entry.bitmap.close();
		setEntries((current) =>
			current.filter((entry) => !removed.includes(entry)),
		);
	};

	const run = async () => {
		setBusy(true);
		setError(undefined);
		setProgress(0);
		try {
			const outputs: BatchOutput[] = [];
			for (const entry of entries) {
				outputs.push(await process(entry.file));
				setProgress(outputs.length);
			}
			const [only] = outputs;
			if (outputs.length === 1 && only) downloadBlob(only.blob, only.name);
			else downloadBlob(await createZip(outputs), zipName);
		} catch (caught) {
			const message = String(caught).replace(/^Error: /, "");
			setError(
				message in intl.messages
					? intl.formatMessage({ id: message })
					: message,
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<Dropzone kind={kind} onFiles={add} />
			{entries.length > 0 && (
				<section className="overflow-hidden rounded-xl border border-border bg-surface">
					<div className="flex flex-wrap items-center justify-between gap-3 border-separator border-b p-5">
						<div className="flex flex-col gap-1">
							<p className="eyebrow text-muted">
								<FormattedMessage id="preview.title" />
							</p>
							<p className="font-mono text-sm">
								{summary && `${summary} · `}
								<FormattedMessage
									id="combine.count"
									values={{ count: entries.length }}
								/>
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onPress={() => remove(entries)}
							isDisabled={busy}
						>
							<RotateCcw size={16} />
							<FormattedMessage id="combine.clear" />
						</Button>
					</div>
					{ready && (
						<ul className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 xl:grid-cols-4">
							{entries.map((entry) => (
								<Preview
									key={entry.id}
									entry={entry}
									frame={frame(entry.bitmap)}
									draw={draw}
									onRemove={() => remove([entry])}
								/>
							))}
						</ul>
					)}
					<div className="flex flex-wrap items-center justify-between gap-4 border-separator border-t bg-surface-secondary p-5">
						{error ? (
							<p className="min-w-0 flex-1 truncate text-danger text-sm">
								{error}
							</p>
						) : (
							<p className="text-muted text-sm">
								<FormattedMessage id="preview.hint" />
							</p>
						)}
						<Button
							variant="primary"
							className="font-semibold"
							isDisabled={busy || !ready}
							onPress={run}
						>
							{busy ? (
								<Spinner size="sm" color="current" />
							) : (
								<Download size={16} />
							)}
							{busy ? (
								<FormattedMessage
									id="preview.progress"
									values={{ done: progress, total: entries.length }}
								/>
							) : (
								<FormattedMessage
									id={actionId}
									values={{ count: entries.length }}
								/>
							)}
						</Button>
					</div>
				</section>
			)}
		</>
	);
}
