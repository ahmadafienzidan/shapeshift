import { Button } from "@heroui/react";
import { ChevronRight, Eraser } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Link, useSearchParams } from "react-router";
import { Dropzone, type FileKind } from "../components/Dropzone";
import { Thumbnail } from "../components/Thumbnail";
import { ToolPage } from "../components/ToolPage";
import { IMAGE_KIND, isImage } from "../lib/image";
import { handOff, takeSharedFiles } from "../lib/incoming";
import { PDF_KIND } from "../lib/pdfKind";
import { TARGET_GROUPS, type Target } from "../targets";
import { OPEN_TOOL } from "../tools";

// File Handling API (installed app on desktop Chromium), not in lib.dom yet.
declare global {
	interface Window {
		launchQueue?: {
			setConsumer(
				consumer: (params: { files: FileSystemFileHandle[] }) => void,
			): void;
		};
	}
}

const stagger = (index: number) =>
	({ "--delay": `${Math.min(index, 10) * 30}ms` }) as CSSProperties;

const OPENABLE: FileKind = {
	accept: [...IMAGE_KIND.accept, ...PDF_KIND.accept],
	matches: (file) => isImage(file) || PDF_KIND.matches(file),
	formats: `${IMAGE_KIND.formats}, PDF`,
};

function Targets({
	titleId,
	targets,
	onPick,
}: {
	titleId: string;
	targets: Target[];
	onPick: () => void;
}) {
	return (
		<section className="flex flex-col gap-3">
			<p className="eyebrow text-muted">
				<FormattedMessage id={titleId} />
			</p>
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{targets.map((target, index) => (
					<Link
						key={target.id}
						to={target.path}
						onClick={onPick}
						style={stagger(index)}
						className="group flex animate-pop items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-[border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-electric/60"
					>
						<div
							className={`grid size-9 shrink-0 place-items-center rounded transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110 ${target.tile}`}
						>
							<target.icon size={16} />
						</div>
						<div className="flex min-w-0 flex-1 flex-col">
							<p className="truncate font-medium text-sm">
								<FormattedMessage id={target.nameId} />
							</p>
							{target.contextId && (
								<p className="truncate text-muted text-xs">
									<FormattedMessage id={target.contextId} />
								</p>
							)}
						</div>
						<ChevronRight
							size={16}
							className="shrink-0 text-muted transition-transform group-hover:translate-x-1"
						/>
					</Link>
				))}
			</div>
		</section>
	);
}

export function OpenPage() {
	const [params] = useSearchParams();
	const shared = params.has("shared");
	const [files, setFiles] = useState<File[]>([]);

	useEffect(() => {
		if (shared) void takeSharedFiles().then(setFiles);
		window.launchQueue?.setConsumer(async ({ files: handles }) =>
			setFiles(await Promise.all(handles.map((handle) => handle.getFile()))),
		);
	}, [shared]);

	const pick = () => handOff(files);

	return (
		<ToolPage tool={OPEN_TOOL}>
			{files.length === 0 ? (
				<Dropzone kind={OPENABLE} onFiles={setFiles} />
			) : (
				<>
					<section className="overflow-hidden rounded-xl border border-border bg-surface">
						<div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-separator border-b px-4 py-2">
							<p className="eyebrow text-muted">
								<FormattedMessage
									id="open.files"
									values={{ count: files.length }}
								/>
							</p>
							<Button variant="ghost" size="sm" onPress={() => setFiles([])}>
								<Eraser size={14} />
								<FormattedMessage id="combine.clear" />
							</Button>
						</div>
						<ul className="flex flex-wrap gap-2 p-4">
							{files.map((file, index) => (
								<li
									// biome-ignore lint/suspicious/noArrayIndexKey: files are only replaced as a whole
									key={index}
									style={stagger(index)}
									className="flex min-w-0 max-w-full animate-pop items-center gap-2 rounded border border-border py-1 pr-3 pl-1"
								>
									<Thumbnail file={file} />
									<span className="truncate text-sm">{file.name}</span>
								</li>
							))}
						</ul>
					</section>
					{TARGET_GROUPS.filter((group) => files.some(group.matches)).map(
						(group) => (
							<Targets
								key={group.titleId}
								titleId={group.titleId}
								targets={group.targets}
								onPick={pick}
							/>
						),
					)}
				</>
			)}
		</ToolPage>
	);
}
