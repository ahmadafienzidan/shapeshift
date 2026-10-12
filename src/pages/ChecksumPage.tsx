import {
	Input,
	Label,
	ProgressBar,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
import { CircleCheck, CircleX } from "lucide-react";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { Dropzone } from "../components/Dropzone";
import { Thumbnail } from "../components/Thumbnail";
import { ToolPage } from "../components/ToolPage";
import {
	ALGORITHMS,
	type Algorithm,
	hashFile,
	normalizeHash,
} from "../lib/checksum";
import { formatBytes } from "../lib/files";
import { CHECKSUM_TOOL } from "../tools";

type Item = {
	id: string;
	file: File;
	progress: number;
	hashes?: Partial<Record<Algorithm, string>>;
	error?: string;
};

const ANY_FILE = { accept: [], matches: () => true };

export function ChecksumPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [algorithms, setAlgorithms] = useState<Algorithm[]>(["sha256"]);
	const [expected, setExpected] = useState("");
	const [items, setItems] = useState<Item[]>([]);
	const queue = useRef(Promise.resolve());

	const update = (id: string, patch: Partial<Item>) =>
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
		);

	const add = (files: File[]) => {
		const selected = ALGORITHMS.map(({ id }) => id).filter((id) =>
			algorithms.includes(id),
		);
		const added = files.map((file) => ({
			id: crypto.randomUUID(),
			file,
			progress: 0,
		}));
		setItems((current) => [...added, ...current]);
		for (const item of added) {
			queue.current = queue.current.then(async () => {
				try {
					const hashes = await hashFile(item.file, selected, (progress) =>
						update(item.id, { progress }),
					);
					update(item.id, { hashes, progress: 1 });
				} catch (error) {
					update(item.id, { error: String(error) });
				}
			});
		}
	};

	const target = normalizeHash(expected);

	return (
		<ToolPage
			tool={CHECKSUM_TOOL}
			optionsHint="options.appliesToNew"
			options={
				<>
					<div className="flex flex-col gap-2">
						<Label>
							<FormattedMessage id="checksum.algorithms" />
						</Label>
						<ToggleButtonGroup
							fullWidth
							selectionMode="multiple"
							disallowEmptySelection
							selectedKeys={new Set(algorithms)}
							onSelectionChange={(keys) =>
								setAlgorithms([...keys] as Algorithm[])
							}
							aria-label={t("checksum.algorithms")}
						>
							{ALGORITHMS.map((algorithm) => (
								<ToggleButton
									key={algorithm.id}
									id={algorithm.id}
									className="min-w-0 px-1 text-xs"
								>
									{algorithm.label}
								</ToggleButton>
							))}
						</ToggleButtonGroup>
					</div>
					<TextField value={expected} onChange={setExpected}>
						<Label>
							<FormattedMessage id="checksum.expected" />
						</Label>
						<Input
							className="font-mono"
							placeholder={t("checksum.expectedPlaceholder")}
						/>
					</TextField>
				</>
			}
		>
			<Dropzone
				kind={{ ...ANY_FILE, formats: t("base64.anyFile") }}
				onFiles={add}
			/>

			{items.length > 0 && (
				<ul className="flex flex-col divide-y divide-separator overflow-hidden rounded-xl border border-border bg-surface">
					{items.map((item) => {
						const entries = Object.entries(item.hashes ?? {}) as [
							Algorithm,
							string,
						][];
						const matched = entries.some(([, hash]) => hash === target);
						return (
							<li key={item.id} className="flex gap-4 p-5">
								<Thumbnail file={item.file} />
								<div className="flex min-w-0 flex-1 flex-col gap-3">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="flex min-w-0 flex-col">
											<p className="truncate font-medium text-sm">
												{item.file.name}
											</p>
											<span className="font-mono text-muted text-xs">
												{formatBytes(item.file.size)}
											</span>
										</div>
										{target && item.hashes && (
											<span
												className={`flex items-center gap-1.5 font-semibold text-sm ${matched ? "text-success" : "text-danger"}`}
											>
												{matched ? (
													<CircleCheck size={16} />
												) : (
													<CircleX size={16} />
												)}
												<FormattedMessage
													id={matched ? "checksum.match" : "checksum.noMatch"}
												/>
											</span>
										)}
									</div>

									{item.error && (
										<p className="text-danger text-sm">{item.error}</p>
									)}
									{!item.hashes && !item.error && (
										<ProgressBar
											aria-label={item.file.name}
											value={Math.round(item.progress * 100)}
											size="sm"
										>
											<ProgressBar.Track>
												<ProgressBar.Fill />
											</ProgressBar.Track>
										</ProgressBar>
									)}

									{entries.map(([algorithm, hash]) => (
										<div
											key={algorithm}
											className={`flex items-center gap-3 rounded border px-3 py-2 ${hash === target ? "border-success/50 bg-success-soft" : "border-border"}`}
										>
											<span className="eyebrow w-16 shrink-0 text-[0.6875rem] text-muted">
												{ALGORITHMS.find(({ id }) => id === algorithm)?.label}
											</span>
											<code className="min-w-0 flex-1 break-all font-mono text-xs">
												{hash}
											</code>
											<CopyButton text={hash} />
										</div>
									))}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</ToolPage>
	);
}
