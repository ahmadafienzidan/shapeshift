import { Button, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
	Archive,
	Download,
	Eraser,
	ExternalLink,
	MapPin,
	ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Dropzone } from "../components/Dropzone";
import { Thumbnail } from "../components/Thumbnail";
import { ToolPage } from "../components/ToolPage";
import { createZip, downloadBlob, formatBytes } from "../lib/files";
import { IMAGE_KIND } from "../lib/image";
import {
	canStrip,
	type MetadataSummary,
	readMetadata,
	stripMetadata,
} from "../lib/metadata";
import type { BatchResult } from "../lib/useBatch";
import { METADATA_TOOL } from "../tools";

const GROUP_LABELS: Record<string, string> = {
	exif: "EXIF",
	gps: "GPS",
	xmp: "XMP",
	iptc: "IPTC",
	pngText: "PNG text",
	makerNotes: "Maker notes",
	photoshop: "Photoshop",
	composite: "Composite",
	mpf: "MPF",
};

type Item = {
	id: string;
	file: File;
	meta?: MetadataSummary;
	error?: string;
	cleaned?: BatchResult;
};

function Summary({ meta }: { meta: MetadataSummary }) {
	const facts = [
		["metadata.camera", meta.camera],
		["metadata.lens", meta.lens],
		["metadata.taken", meta.taken],
		["metadata.exposure", meta.exposure],
		["metadata.software", meta.software],
	].filter((fact): fact is [string, string] => Boolean(fact[1]));

	return (
		<div className="flex flex-col gap-3">
			{meta.gps && (
				<div className="flex flex-wrap items-center gap-3 rounded border border-warning/40 bg-warning-soft px-3 py-2 text-sm text-warning-soft-foreground">
					<MapPin size={16} className="shrink-0" />
					<span className="font-semibold">
						<FormattedMessage id="metadata.location" />
					</span>
					<span className="font-mono">
						{meta.gps.latitude.toFixed(5)}, {meta.gps.longitude.toFixed(5)}
					</span>
					<a
						href={`https://www.google.com/maps?q=${meta.gps.latitude},${meta.gps.longitude}`}
						target="_blank"
						rel="noreferrer noopener"
						className="flex items-center gap-1 underline underline-offset-2"
					>
						<FormattedMessage id="metadata.openMap" />
						<ExternalLink size={12} />
					</a>
				</div>
			)}
			{facts.length > 0 && (
				<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
					{facts.map(([id, value]) => (
						<div key={id} className="contents">
							<dt className="text-muted">
								<FormattedMessage id={id} />
							</dt>
							<dd className="min-w-0 truncate font-mono">{value}</dd>
						</div>
					))}
				</dl>
			)}
			{meta.count > 0 && (
				<details className="group rounded border border-border">
					<summary className="cursor-pointer px-3 py-2 text-muted text-sm hover:text-foreground">
						<FormattedMessage
							id="metadata.allFields"
							values={{ count: meta.count }}
						/>
					</summary>
					<div className="flex flex-col gap-4 border-separator border-t p-3">
						{meta.groups.map((group) => (
							<div key={group.name} className="flex flex-col gap-1">
								<p className="eyebrow text-[0.6875rem] text-accent-soft-foreground">
									{GROUP_LABELS[group.name] ?? group.name}
								</p>
								<dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-0.5 font-mono text-xs">
									{group.fields.map(([key, value]) => (
										<div key={key} className="contents">
											<dt className="text-muted">{key}</dt>
											<dd className="min-w-0 break-all">{value}</dd>
										</div>
									))}
								</dl>
							</div>
						))}
					</div>
				</details>
			)}
		</div>
	);
}

export function MetadataPage() {
	const [items, setItems] = useState<Item[]>([]);
	const queue = useRef(Promise.resolve());

	const update = (id: string, patch: Partial<Item>) =>
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
		);

	const add = (files: File[]) => {
		const added = files.map((file) => ({ id: crypto.randomUUID(), file }));
		setItems((current) => [...added, ...current]);
		for (const item of added) {
			queue.current = queue.current.then(async () => {
				try {
					update(item.id, { meta: await readMetadata(item.file) });
				} catch (error) {
					update(item.id, { error: String(error) });
				}
			});
		}
	};

	const clean = async (item: Item): Promise<BatchResult> => {
		if (item.cleaned) return item.cleaned;
		const blob = await stripMetadata(item.file);
		const cleaned = {
			blob,
			name: item.file.name,
			url: URL.createObjectURL(blob),
		};
		const meta = await readMetadata(new File([blob], item.file.name));
		update(item.id, { cleaned, meta });
		return cleaned;
	};

	const strippable = items.filter(
		(item) => item.meta && item.meta.count > 0 && canStrip(item.file),
	);

	const cleanAll = async () => {
		const results = [];
		for (const item of strippable) results.push(await clean(item));
		downloadBlob(await createZip(results), "shapeshift-clean.zip");
	};

	return (
		<ToolPage tool={METADATA_TOOL}>
			<Dropzone kind={IMAGE_KIND} onFiles={add} />

			{items.length > 0 && (
				<section className="overflow-hidden rounded-xl border border-border bg-surface">
					<div className="flex flex-wrap items-center justify-between gap-4 border-separator border-b p-5">
						<div className="flex flex-col gap-1">
							<p className="eyebrow text-muted">
								<FormattedMessage id="queue.title" />
							</p>
							<p className="font-mono text-sm">
								<FormattedMessage
									id="metadata.withLocation"
									values={{
										count: items.filter((item) => item.meta?.gps).length,
										total: items.length,
									}}
								/>
							</p>
						</div>
						<Button
							variant="primary"
							className="font-semibold"
							isDisabled={strippable.length === 0}
							onPress={cleanAll}
						>
							<Archive size={16} />
							<FormattedMessage id="metadata.cleanAll" />
						</Button>
					</div>

					<ul className="flex flex-col divide-y divide-separator">
						{items.map((item) => (
							<li key={item.id} className="flex gap-4 p-5">
								<Thumbnail file={item.file} />
								<div className="flex min-w-0 flex-1 flex-col gap-3">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div className="flex min-w-0 flex-col">
											<p className="truncate font-medium text-sm">
												{item.file.name}
											</p>
											<span className="font-mono text-muted text-xs">
												{formatBytes(item.file.size)}
												{item.cleaned &&
													` → ${formatBytes(item.cleaned.blob.size)}`}
											</span>
										</div>
										{item.meta &&
											(item.meta.count > 0 || item.cleaned) &&
											(item.cleaned ? (
												<a
													href={item.cleaned.url}
													download={item.cleaned.name}
													className={buttonVariants({
														variant: "outline",
														size: "sm",
														className: "font-semibold",
													})}
												>
													<Download size={14} />
													<FormattedMessage id="queue.download" />
												</a>
											) : canStrip(item.file) ? (
												<Button
													variant="outline"
													size="sm"
													className="font-semibold"
													onPress={() => clean(item)}
												>
													<Eraser size={14} />
													<FormattedMessage id="metadata.clean" />
												</Button>
											) : (
												<Chip size="sm" variant="soft">
													<FormattedMessage id="metadata.viewOnly" />
												</Chip>
											))}
									</div>

									{item.error && (
										<p className="text-danger text-sm">{item.error}</p>
									)}
									{!item.meta && !item.error && (
										<p className="animate-pulse text-muted text-sm">
											<FormattedMessage id="metadata.reading" />
										</p>
									)}
									{item.meta && item.meta.count === 0 && !item.cleaned && (
										<p className="flex items-center gap-2 text-sm text-success">
											<ShieldCheck size={16} />
											<FormattedMessage id="metadata.none" />
										</p>
									)}
									{item.meta && <Summary meta={item.meta} />}
									{item.cleaned && (
										<p className="flex items-center gap-2 text-sm text-success">
											<ShieldCheck size={16} />
											<FormattedMessage id="metadata.cleaned" />
										</p>
									)}
									{item.meta && item.meta.count > 0 && !canStrip(item.file) && (
										<p className="text-muted text-xs">
											<FormattedMessage id="metadata.viewOnlyHint" />
										</p>
									)}
								</div>
							</li>
						))}
					</ul>
				</section>
			)}
		</ToolPage>
	);
}
