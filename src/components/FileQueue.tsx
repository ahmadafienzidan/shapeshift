import { Button, Chip, ProgressBar } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Archive, Download, FileCheck, FileX, Trash2 } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";
import { createZip, downloadBlob, formatBytes } from "../lib/files";
import type { BatchItem } from "../lib/useBatch";

const STATUS_COLOR = {
	queued: "default",
	processing: "accent",
	done: "success",
	error: "danger",
} as const;

function SizeChange({ before, after }: { before: number; after: number }) {
	const intl = useIntl();
	const delta = (after - before) / before;
	return (
		<span className="font-mono text-muted text-xs">
			{formatBytes(before)} → {formatBytes(after)}{" "}
			<span className={delta <= 0 ? "text-success" : "text-warning"}>
				({delta > 0 ? "+" : ""}
				{intl.formatNumber(delta, {
					style: "percent",
					maximumFractionDigits: 0,
				})}
				)
			</span>
		</span>
	);
}

function totalSize(item: BatchItem): number {
	return item.results.reduce((sum, result) => sum + result.blob.size, 0);
}

function stripExtension(name: string): string {
	return name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
}

function QueueRow({ item }: { item: BatchItem }) {
	const intl = useIntl();
	// Tools throw message ids (e.g. "pdf.error.password") for errors the user
	// can act on; anything else is shown as the browser reported it.
	const translateError = (error: string) => {
		const id = error.replace(/^Error: /, "");
		return id in intl.messages ? intl.formatMessage({ id }) : error;
	};
	const [first] = item.results;
	const preview = first?.blob.type.startsWith("image/") ? first : undefined;
	const downloadLabel = intl.formatMessage({ id: "queue.download" });

	const downloadAll = async () => {
		downloadBlob(
			await createZip(item.results),
			`${stripExtension(item.file.name)}.zip`,
		);
	};

	return (
		<li className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-secondary">
			<div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded bg-default">
				{preview ? (
					<img src={preview.url} alt="" className="size-full object-cover" />
				) : item.status === "error" ? (
					<FileX size={20} className="text-danger" />
				) : item.status === "done" ? (
					<FileCheck size={20} className="text-muted" />
				) : (
					<div className="size-full animate-pulse bg-default-hover" />
				)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="truncate font-medium text-sm">
					{item.results.length === 1 && first ? first.name : item.file.name}
				</p>
				{item.status === "done" ? (
					<span className="flex flex-wrap gap-x-2">
						<SizeChange before={item.file.size} after={totalSize(item)} />
						{item.results.length > 1 && (
							<span className="font-mono text-accent-soft-foreground text-xs">
								<FormattedMessage
									id="queue.outputs"
									values={{ count: item.results.length }}
								/>
							</span>
						)}
					</span>
				) : item.error ? (
					<p className="truncate text-danger text-xs">
						{translateError(item.error)}
					</p>
				) : (
					<span className="font-mono text-muted text-xs">
						{formatBytes(item.file.size)}
					</span>
				)}
			</div>
			<Chip
				size="sm"
				variant="soft"
				color={STATUS_COLOR[item.status]}
				className="eyebrow hidden text-[0.625rem] sm:inline-flex"
			>
				<FormattedMessage id={`queue.status.${item.status}`} />
			</Chip>
			{item.results.length === 1 && first && (
				<a
					href={first.url}
					download={first.name}
					aria-label={downloadLabel}
					className={buttonVariants({
						variant: "outline",
						size: "sm",
						isIconOnly: true,
					})}
				>
					<Download size={16} />
				</a>
			)}
			{item.results.length > 1 && (
				<Button
					isIconOnly
					variant="outline"
					size="sm"
					aria-label={downloadLabel}
					onPress={downloadAll}
				>
					<Download size={16} />
				</Button>
			)}
		</li>
	);
}

export function FileQueue({
	items,
	onClear,
	zipName,
}: {
	items: BatchItem[];
	onClear: () => void;
	zipName: string;
}) {
	const intl = useIntl();
	const finished = items.filter((item) => item.status === "done");
	const settled = items.filter(
		(item) => item.status === "done" || item.status === "error",
	);
	const before = finished.reduce((sum, item) => sum + item.file.size, 0);
	const after = finished.reduce((sum, item) => sum + totalSize(item), 0);

	if (items.length === 0) return null;

	const downloadZip = async () => {
		const zip = await createZip(finished.flatMap((item) => item.results));
		downloadBlob(zip, zipName);
	};

	return (
		<section className="overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex flex-wrap items-center justify-between gap-4 border-separator border-b p-5">
				<div className="flex flex-col gap-1">
					<p className="eyebrow text-muted">
						<FormattedMessage id="queue.title" />
					</p>
					<p className="font-mono text-sm">
						<FormattedMessage
							id="queue.summary"
							values={{ done: settled.length, total: items.length }}
						/>
						{after < before && (
							<>
								<span className="text-muted">{" / "}</span>
								<span className="text-accent-soft-foreground">
									<FormattedMessage
										id="queue.saved"
										values={{
											size: formatBytes(before - after),
											percent: intl.formatNumber((before - after) / before, {
												style: "percent",
												maximumFractionDigits: 0,
											}),
										}}
									/>
								</span>
							</>
						)}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						onPress={onClear}
						isDisabled={settled.length === 0}
					>
						<Trash2 size={16} />
						<FormattedMessage id="queue.clear" />
					</Button>
					<Button
						variant="primary"
						size="sm"
						className="font-semibold"
						onPress={downloadZip}
						isDisabled={finished.length === 0}
					>
						<Archive size={16} />
						<FormattedMessage id="queue.downloadZip" />
					</Button>
				</div>
			</div>
			<ProgressBar
				aria-label={intl.formatMessage({ id: "queue.title" })}
				value={settled.length}
				maxValue={items.length}
				size="sm"
			>
				<ProgressBar.Track className="rounded-none">
					<ProgressBar.Fill className="rounded-none" />
				</ProgressBar.Track>
			</ProgressBar>
			<ul className="flex max-h-[32rem] flex-col divide-y divide-separator overflow-y-auto">
				{items.map((item) => (
					<QueueRow key={item.id} item={item} />
				))}
			</ul>
		</section>
	);
}
