import type { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import type { BatchItem } from "../lib/useBatch";
import type { Tool } from "../tools";
import { Dropzone } from "./Dropzone";
import { Eyebrow } from "./Eyebrow";
import { FileQueue } from "./FileQueue";

export function ToolPage({
	tool,
	options,
	items,
	onFiles,
	onClear,
}: {
	tool: Tool;
	options: ReactNode;
	items: BatchItem[];
	onFiles: (files: File[]) => void;
	onClear: () => void;
}) {
	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-col gap-3 border-separator border-b pb-8">
				<Eyebrow dot>
					<FormattedMessage id="tool.eyebrow" />
				</Eyebrow>
				<div className="flex items-center gap-4">
					<div
						className={`grid size-12 shrink-0 place-items-center rounded ${tool.tile}`}
					>
						<tool.icon size={22} />
					</div>
					<h1 className="headline text-4xl sm:text-6xl">
						<FormattedMessage id={`tool.${tool.id}.name`} />
					</h1>
				</div>
				<p className="max-w-2xl text-muted">
					<FormattedMessage id={`tool.${tool.id}.description`} />
				</p>
			</header>

			<div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
				<div className="order-2 flex min-w-0 flex-col gap-6 xl:order-1">
					<Dropzone onFiles={onFiles} />
					<FileQueue
						items={items}
						onClear={onClear}
						zipName={`shapeshift-${tool.id}.zip`}
					/>
				</div>
				<aside className="order-1 flex h-fit flex-col rounded-xl border border-border bg-surface xl:sticky xl:top-6 xl:order-2">
					<div className="flex flex-col gap-1 border-separator border-b p-5">
						<p className="eyebrow text-muted">
							<FormattedMessage id="options.title" />
						</p>
						<p className="text-muted text-xs">
							<FormattedMessage id="options.appliesToNew" />
						</p>
					</div>
					<div className="flex flex-col gap-6 p-5">{options}</div>
				</aside>
			</div>
		</div>
	);
}
