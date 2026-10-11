import { Button } from "@heroui/react";
import { FolderOpen, ImagePlus, Upload } from "lucide-react";
import { useState } from "react";
import { DropZone, FileTrigger } from "react-aria-components";
import { FormattedMessage } from "react-intl";
import { collectDropItems } from "../lib/files";
import { ACCEPTED_IMAGES, isImage } from "../lib/image";

export function Dropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
	const [skipped, setSkipped] = useState(0);

	const accept = (files: File[]) => {
		const images = files.filter(isImage);
		setSkipped(files.length - images.length);
		if (images.length > 0) onFiles(images);
	};

	return (
		<div className="flex flex-col gap-2">
			<DropZone
				onDrop={async (event) => accept(await collectDropItems(event.items))}
				className={({ isDropTarget }) =>
					`group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all ${
						isDropTarget
							? "scale-[1.01] border-accent bg-accent-soft"
							: "border-separator bg-surface hover:border-accent/60"
					}`
				}
			>
				<div className="pointer-events-none absolute inset-0 bg-radial from-accent/10 to-transparent to-70% opacity-0 transition-opacity group-hover:opacity-100 group-data-[drop-target]:opacity-100" />
				<div className="grid size-16 place-items-center rounded-2xl bg-linear-to-br from-violet-500 to-sky-500 text-white shadow-lg shadow-violet-500/30">
					<Upload size={28} />
				</div>
				<div>
					<p className="font-semibold text-lg">
						<FormattedMessage id="drop.title" />
					</p>
					<p className="text-muted text-sm">
						<FormattedMessage id="drop.subtitle" />
					</p>
				</div>
				<div className="flex flex-wrap justify-center gap-2">
					<FileTrigger
						allowsMultiple
						acceptedFileTypes={ACCEPTED_IMAGES}
						onSelect={(list) => accept(Array.from(list ?? []))}
					>
						<Button variant="primary">
							<ImagePlus size={18} />
							<FormattedMessage id="drop.files" />
						</Button>
					</FileTrigger>
					<FileTrigger
						acceptDirectory
						onSelect={(list) => accept(Array.from(list ?? []))}
					>
						<Button variant="secondary">
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
