import { Button, Card, Chip, ProgressBar } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Archive, Download, ImageOff, Trash2 } from "lucide-react";
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
		<span className="text-muted text-xs">
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

function QueueRow({ item }: { item: BatchItem }) {
	return (
		<li className="flex items-center gap-3 rounded-2xl border border-separator bg-surface p-3">
			<div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-default">
				{item.result ? (
					<img
						src={item.result.url}
						alt=""
						className="size-full object-cover"
					/>
				) : item.status === "error" ? (
					<ImageOff size={20} className="text-danger" />
				) : (
					<div className="size-full animate-pulse bg-default-hover" />
				)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="truncate font-medium text-sm">
					{item.result?.name ?? item.file.name}
				</p>
				{item.result ? (
					<SizeChange before={item.file.size} after={item.result.blob.size} />
				) : item.error ? (
					<p className="truncate text-danger text-xs">{item.error}</p>
				) : (
					<span className="text-muted text-xs">
						{formatBytes(item.file.size)}
					</span>
				)}
			</div>
			<Chip
				size="sm"
				variant="soft"
				color={STATUS_COLOR[item.status]}
				className="hidden sm:inline-flex"
			>
				<FormattedMessage id={`queue.status.${item.status}`} />
			</Chip>
			{item.result && (
				<a
					href={item.result.url}
					download={item.result.name}
					className={buttonVariants({
						variant: "tertiary",
						size: "sm",
						isIconOnly: true,
					})}
				>
					<Download size={16} />
				</a>
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
	const finished = items.filter((item) => item.result);
	const settled = items.filter(
		(item) => item.status === "done" || item.status === "error",
	);
	const before = finished.reduce((sum, item) => sum + item.file.size, 0);
	const after = finished.reduce(
		(sum, item) => sum + (item.result?.blob.size ?? 0),
		0,
	);

	if (items.length === 0) return null;

	const downloadZip = async () => {
		const zip = await createZip(
			finished.flatMap((item) => (item.result ? [item.result] : [])),
		);
		downloadBlob(zip, zipName);
	};

	return (
		<Card>
			<Card.Header className="flex flex-row flex-wrap items-center justify-between gap-3">
				<div>
					<Card.Title>
						<FormattedMessage id="queue.title" />
					</Card.Title>
					<Card.Description>
						<FormattedMessage
							id="queue.summary"
							values={{ done: settled.length, total: items.length }}
						/>
						{after < before && (
							<>
								{" · "}
								<span className="text-success">
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
					</Card.Description>
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
						onPress={downloadZip}
						isDisabled={finished.length === 0}
					>
						<Archive size={16} />
						<FormattedMessage id="queue.downloadZip" />
					</Button>
				</div>
			</Card.Header>
			<Card.Content className="flex flex-col gap-3">
				<ProgressBar
					aria-label={intl.formatMessage({ id: "queue.title" })}
					value={settled.length}
					maxValue={items.length}
					size="sm"
				>
					<ProgressBar.Track>
						<ProgressBar.Fill />
					</ProgressBar.Track>
				</ProgressBar>
				<ul className="flex max-h-[32rem] flex-col gap-2 overflow-y-auto">
					{items.map((item) => (
						<QueueRow key={item.id} item={item} />
					))}
				</ul>
			</Card.Content>
		</Card>
	);
}
