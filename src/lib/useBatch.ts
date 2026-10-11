import { useCallback, useRef, useState } from "react";

export type BatchResult = { blob: Blob; name: string; url: string };

export type BatchItem = {
	id: string;
	file: File;
	status: "queued" | "processing" | "done" | "error";
	result?: BatchResult;
	error?: string;
};

export type Processor = (file: File) => Promise<{ blob: Blob; name: string }>;

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
			const added = files.map((file) => ({
				id: crypto.randomUUID(),
				file,
				status: "queued" as const,
			}));
			setItems((current) => [...current, ...added]);

			for (const item of added) {
				queue.current = queue.current.then(async () => {
					update(item.id, { status: "processing" });
					try {
						const { blob, name } = await process(item.file);
						const url = URL.createObjectURL(blob);
						update(item.id, { status: "done", result: { blob, name, url } });
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
				if (item.result) URL.revokeObjectURL(item.result.url);
			}
			return current.filter(
				(item) => item.status === "processing" || item.status === "queued",
			);
		});
	}, []);

	return { items, add, clear };
}
