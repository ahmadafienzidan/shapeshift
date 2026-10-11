import type { Processor } from "../lib/useBatch";
import { useBatch } from "../lib/useBatch";
import { Dropzone, type FileKind } from "./Dropzone";
import { FileQueue } from "./FileQueue";

export function BatchTool({
	kind,
	process,
	zipName,
}: {
	kind: FileKind;
	process: Processor;
	zipName: string;
}) {
	const { items, add, clear } = useBatch();

	return (
		<>
			<Dropzone kind={kind} onFiles={(files) => add(files, process)} />
			<FileQueue items={items} onClear={clear} zipName={zipName} />
		</>
	);
}
