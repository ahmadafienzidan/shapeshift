import { Card } from "@heroui/react";
import type { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import type { BatchItem } from "../lib/useBatch";
import type { Tool } from "../tools";
import { Dropzone } from "./Dropzone";
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
		<div className="flex flex-col gap-6">
			<header className="flex items-center gap-4">
				<div
					className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br ${tool.gradient} text-white shadow-lg`}
				>
					<tool.icon size={24} />
				</div>
				<div>
					<h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
						<FormattedMessage id={`tool.${tool.id}.name`} />
					</h1>
					<p className="text-muted">
						<FormattedMessage id={`tool.${tool.id}.description`} />
					</p>
				</div>
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
				<Card className="order-1 h-fit xl:sticky xl:top-6 xl:order-2">
					<Card.Header>
						<Card.Title>
							<FormattedMessage id="options.title" />
						</Card.Title>
						<Card.Description>
							<FormattedMessage id="options.appliesToNew" />
						</Card.Description>
					</Card.Header>
					<Card.Content className="flex flex-col gap-6">{options}</Card.Content>
				</Card>
			</div>
		</div>
	);
}
