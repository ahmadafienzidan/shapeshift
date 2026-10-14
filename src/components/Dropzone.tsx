import { Button } from "@heroui/react";
import { FilePlus, FolderOpen, Upload } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { DropZone, FileTrigger } from "react-aria-components";
import { FormattedMessage } from "react-intl";
import { collectDropItems } from "../lib/files";
import { takeIncoming } from "../lib/incoming";

export type FileKind = {
	accept: string[];
	matches: (file: File) => boolean;
	formats: string;
};

export function Dropzone({
	kind,
	onFiles,
}: {
	kind: FileKind;
	onFiles: (files: File[]) => void;
}) {
	const [skipped, setSkipped] = useState(0);

	const accept = (files: File[]) => {
		const matching = files.filter(kind.matches);
		setSkipped(files.length - matching.length);
		if (matching.length > 0) onFiles(matching);
	};

	const takeOpened = useEffectEvent(() => {
		const files = takeIncoming(kind.matches);
		if (files.length > 0) onFiles(files);
	});
	useEffect(() => takeOpened(), []);

	return (
		<div className="flex flex-col gap-2">
			<DropZone
				onDrop={async (event) => accept(await collectDropItems(event.items))}
				className={({ isDropTarget }) =>
					`group relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-xl border border-dashed px-6 py-16 text-center transition-colors ${
						isDropTarget
							? "border-electric bg-accent-soft"
							: "border-border-tertiary bg-surface hover:border-electric/70"
					}`
				}
			>
				<div className="pointer-events-none absolute inset-0 grid-backdrop [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
				<div className="relative grid size-14 place-items-center rounded bg-electric text-ink">
					<Upload size={24} />
				</div>
				<div className="relative flex flex-col gap-1">
					<p className="headline text-3xl">
						<FormattedMessage id="drop.title" />
					</p>
					<p className="eyebrow text-muted">{kind.formats}</p>
				</div>
				<div className="relative flex flex-wrap justify-center gap-3">
					<FileTrigger
						allowsMultiple
						acceptedFileTypes={kind.accept}
						onSelect={(list) => accept(Array.from(list ?? []))}
					>
						<Button variant="primary" className="font-semibold">
							<FilePlus size={18} />
							<FormattedMessage id="drop.files" />
						</Button>
					</FileTrigger>
					<FileTrigger
						acceptDirectory
						onSelect={(list) => accept(Array.from(list ?? []))}
					>
						<Button variant="outline" className="font-semibold">
							<FolderOpen size={18} />
							<FormattedMessage id="drop.folder" />
						</Button>
					</FileTrigger>
				</div>
			</DropZone>
			{skipped > 0 && (
				<p className="text-center text-sm text-warning">
					<FormattedMessage id="drop.skipped" values={{ count: skipped }} />
				</p>
			)}
		</div>
	);
}
