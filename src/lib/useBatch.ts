import { useCallback, useRef, useState } from "react";

export type BatchOutput = { blob: Blob; name: string };

export type BatchResult = BatchOutput & { url: string };

export type BatchItem = {
	id: string;
	file: File;
	status: "queued" | "processing" | "done" | "error";
	results: BatchResult[];
	error?: string;
};

export type Processor = (file: File) => Promise<BatchOutput[]>;

export function useBatch() {
	const [items, setItems] = useState<BatchItem[]>([]);
	const queue = useRef(Promise.resolve());

	const update = useCallback((id: string, patch: Partial<BatchItem>) => {
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
		);
	}, []);

	const add = useCallback(
		(files: File[], process: Processor) => {
			const added: BatchItem[] = files.map((file) => ({
				id: crypto.randomUUID(),
				file,
				status: "queued",
				results: [],
			}));
			setItems((current) => [...current, ...added]);

			for (const item of added) {
				queue.current = queue.current.then(async () => {
					update(item.id, { status: "processing" });
					try {
						const outputs = await process(item.file);
						const results = outputs.map((output) => ({
							...output,
							url: URL.createObjectURL(output.blob),
						}));
						update(item.id, { status: "done", results });
					} catch (error) {
						update(item.id, { status: "error", error: String(error) });
					}
				});
			}
		},
		[update],
	);

	const clear = useCallback(() => {
		setItems((current) => {
			for (const item of current) {
				for (const result of item.results) URL.revokeObjectURL(result.url);
			}
			return current.filter(
				(item) => item.status === "processing" || item.status === "queued",
			);
		});
	}, []);

	return { items, add, clear };
}
