import { Button, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
	ArrowDown,
	ArrowDownAZ,
	ArrowUp,
	Download,
	FileCheck,
	RotateCcw,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { formatBytes } from "../lib/files";
import { isHeic, isImage } from "../lib/image";
import { Dropzone, type FileKind } from "./Dropzone";

type Entry = { id: string; file: File };

type Output = { url: string; name: string; size: number };

function move<T>(list: T[], from: number, to: number): T[] {
	const next = [...list];
	const [item] = next.splice(from, 1);
	if (item !== undefined) next.splice(to, 0, item);
	return next;
}

function Thumbnail({ file }: { file: File }) {
	const [url, setUrl] = useState<string>();
	const previewable = isImage(file) && !isHeic(file);

	useEffect(() => {
		if (!previewable) return;
		const objectUrl = URL.createObjectURL(file);
		setUrl(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [file, previewable]);

	return (
		<div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded bg-default">
			{url ? (
				<img src={url} alt="" className="size-full object-cover" />
			) : (
				<span className="font-mono text-[0.625rem] text-muted uppercase">
					{file.name.split(".").pop()}
				</span>
			)}
		</div>
	);
}

export function CombineTool({
	kind,
	actionLabel,
	outputName,
	combine,
}: {
	kind: FileKind;
	actionLabel: string;
	outputName: string;
	combine: (files: File[]) => Promise<Blob>;
}) {
	const intl = useIntl();
	const [entries, setEntries] = useState<Entry[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const [output, setOutput] = useState<Output>();

	const reset = () => {
		if (output) URL.revokeObjectURL(output.url);
		setOutput(undefined);
		setError(undefined);
	};

	const add = (files: File[]) => {
		reset();
		setEntries((current) => [
			...current,
			...files.map((file) => ({ id: crypto.randomUUID(), file })),
		]);
	};

	const update = (next: Entry[]) => {
		reset();
		setEntries(next);
	};

	const run = async () => {
		reset();
		setBusy(true);
		try {
			const blob = await combine(entries.map((entry) => entry.file));
			setOutput({
				url: URL.createObjectURL(blob),
				name: outputName,
				size: blob.size,
			});
		} catch (caught) {
			setError(String(caught));
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<Dropzone kind={kind} onFiles={add} />

			{entries.length > 0 && (
				<section className="overflow-hidden rounded-xl border border-border bg-surface">
					<div className="flex flex-wrap items-center justify-between gap-4 border-separator border-b p-5">
						<div className="flex flex-col gap-1">
							<p className="eyebrow text-muted">
								<FormattedMessage id="combine.order" />
							</p>
							<p className="font-mono text-sm">
								<FormattedMessage
									id="combine.count"
									values={{ count: entries.length }}
								/>
							</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant="ghost"
								size="sm"
								onPress={() =>
									update(
										[...entries].sort((a, b) =>
											a.file.name.localeCompare(b.file.name, undefined, {
												numeric: true,
											}),
										),
									)
								}
							>
								<ArrowDownAZ size={16} />
								<FormattedMessage id="combine.sort" />
							</Button>
							<Button variant="ghost" size="sm" onPress={() => update([])}>
								<RotateCcw size={16} />
								<FormattedMessage id="combine.clear" />
							</Button>
						</div>
					</div>

					<ol className="flex max-h-[28rem] flex-col divide-y divide-separator overflow-y-auto">
						{entries.map((entry, index) => (
							<li
								key={entry.id}
								className="flex items-center gap-4 px-5 py-2.5 hover:bg-surface-secondary"
							>
								<span className="w-6 shrink-0 text-right font-mono text-muted text-xs">
									{index + 1}
								</span>
								<Thumbnail file={entry.file} />
								<div className="flex min-w-0 flex-1 flex-col">
									<p className="truncate font-medium text-sm">
										{entry.file.name}
									</p>
									<span className="font-mono text-muted text-xs">
										{formatBytes(entry.file.size)}
									</span>
								</div>
								<div className="flex gap-1">
									<Button
										isIconOnly
										variant="ghost"
										size="sm"
										isDisabled={index === 0}
										aria-label={intl.formatMessage({ id: "combine.up" })}
										onPress={() => update(move(entries, index, index - 1))}
									>
										<ArrowUp size={14} />
									</Button>
									<Button
										isIconOnly
										variant="ghost"
										size="sm"
										isDisabled={index === entries.length - 1}
										aria-label={intl.formatMessage({ id: "combine.down" })}
										onPress={() => update(move(entries, index, index + 1))}
									>
										<ArrowDown size={14} />
									</Button>
									<Button
										isIconOnly
										variant="ghost"
										size="sm"
										aria-label={intl.formatMessage({ id: "combine.remove" })}
										onPress={() =>
											update(entries.filter((item) => item.id !== entry.id))
										}
									>
										<X size={14} />
									</Button>
								</div>
							</li>
						))}
					</ol>

					<div className="flex flex-wrap items-center justify-between gap-4 border-separator border-t bg-surface-secondary p-5">
						{output ? (
							<div className="flex min-w-0 items-center gap-3">
								<FileCheck size={20} className="shrink-0 text-success" />
								<div className="flex min-w-0 flex-col">
									<p className="truncate font-medium text-sm">{output.name}</p>
									<span className="font-mono text-muted text-xs">
										{formatBytes(output.size)}
									</span>
								</div>
							</div>
						) : error ? (
							<p className="min-w-0 flex-1 truncate text-danger text-sm">
								{error}
							</p>
						) : (
							<span />
						)}
						{output ? (
							<a
								href={output.url}
								download={output.name}
								className={buttonVariants({
									variant: "primary",
									className: "font-semibold",
								})}
							>
								<Download size={16} />
								<FormattedMessage id="queue.download" />
							</a>
						) : (
							<Button
								variant="primary"
								className="font-semibold"
								isDisabled={busy}
								onPress={run}
							>
								{busy && <Spinner size="sm" color="current" />}
								{actionLabel}
							</Button>
						)}
					</div>
				</section>
			)}
		</>
	);
}
