import { Button, ProgressBar } from "@heroui/react";
import { Download, Eraser } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { Dropzone } from "../components/Dropzone";
import { EDITOR_CLASS } from "../components/EditorPanel";
import { FormatPicker } from "../components/Options";
import { Thumbnail } from "../components/Thumbnail";
import { ToolPage } from "../components/ToolPage";
import { downloadBlob } from "../lib/files";
import { IMAGE_KIND, isImage } from "../lib/image";
import { type OcrLanguage, recognizeText } from "../lib/ocr";
import { OCR_TOOL } from "../tools";

type Item = {
	id: string;
	file: File;
	status: "reading" | "done" | "error";
	progress: number;
	text: string;
	confidence?: number;
	error?: string;
};

const baseName = (name: string) =>
	name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;

const textFile = (text: string) =>
	new Blob([text], { type: "text/plain;charset=utf-8" });

function Result({
	item,
	onEdit,
}: {
	item: Item;
	onEdit: (text: string) => void;
}) {
	const intl = useIntl();
	return (
		<li className="flex flex-col">
			<div className="flex min-h-14 flex-wrap items-center gap-3 px-4 py-2">
				<Thumbnail file={item.file} />
				<div className="flex min-w-0 flex-1 flex-col">
					<p className="truncate font-medium text-sm">{item.file.name}</p>
					{item.status === "reading" && (
						<p className="text-muted text-xs">
							{item.progress > 0 ? (
								<FormattedMessage
									id="ocr.reading"
									values={{
										percent: intl.formatNumber(item.progress, {
											style: "percent",
										}),
									}}
								/>
							) : (
								<FormattedMessage id="ocr.loading" />
							)}
						</p>
					)}
					{item.status === "done" && item.confidence !== undefined && (
						<p className="text-muted text-xs">
							<FormattedMessage
								id="ocr.confidence"
								values={{ value: Math.round(item.confidence) }}
							/>
						</p>
					)}
				</div>
				{item.status === "done" && item.text && (
					<div className="flex gap-1">
						<CopyButton text={item.text} />
						<Button
							variant="ghost"
							size="sm"
							onPress={() =>
								downloadBlob(
									textFile(item.text),
									`${baseName(item.file.name)}.txt`,
								)
							}
						>
							<Download size={14} />
							TXT
						</Button>
					</div>
				)}
			</div>
			{item.status === "reading" && (
				<ProgressBar
					aria-label={item.file.name}
					value={item.progress * 100}
					isIndeterminate={item.progress === 0}
					size="sm"
				>
					<ProgressBar.Track className="rounded-none">
						<ProgressBar.Fill className="rounded-none" />
					</ProgressBar.Track>
				</ProgressBar>
			)}
			{item.status === "error" && (
				<p className="px-4 pb-3 text-danger text-sm">{item.error}</p>
			)}
			{item.status === "done" &&
				(item.text ? (
					<textarea
						aria-label={item.file.name}
						value={item.text}
						onChange={(event) => onEdit(event.target.value)}
						spellCheck={false}
						rows={Math.min(16, Math.max(4, item.text.split("\n").length + 1))}
						className={`${EDITOR_CLASS} border-separator border-t`}
					/>
				) : (
					<p className="px-4 pb-3 text-sm text-warning">
						<FormattedMessage id="ocr.empty" />
					</p>
				))}
		</li>
	);
}

export function OcrPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [language, setLanguage] = useState<OcrLanguage>("eng+ind");
	const [items, setItems] = useState<Item[]>([]);
	const queue = useRef(Promise.resolve());
	// Bumped by language changes and Clear, so queued jobs that are no longer
	// wanted are skipped instead of tying up the engine.
	const generation = useRef(0);

	const update = (id: string, patch: Partial<Item>) =>
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
		);

	const enqueue = (id: string, file: File, lang: OcrLanguage) => {
		const started = generation.current;
		queue.current = queue.current.then(async () => {
			if (started !== generation.current) return;
			try {
				const result = await recognizeText(file, lang, (progress) =>
					update(id, { progress }),
				);
				update(id, { status: "done", ...result });
			} catch (error) {
				update(id, { status: "error", error: String(error) });
			}
		});
	};

	const add = (files: File[]) => {
		const added: Item[] = files.map((file) => ({
			id: crypto.randomUUID(),
			file,
			status: "reading",
			progress: 0,
			text: "",
		}));
		setItems((current) => [...added, ...current]);
		for (const item of added) enqueue(item.id, item.file, language);
	};

	const changeLanguage = (next: OcrLanguage) => {
		setLanguage(next);
		generation.current++;
		setItems((current) =>
			current.map((item) => ({ ...item, status: "reading", progress: 0 })),
		);
		for (const item of items) enqueue(item.id, item.file, next);
	};

	const clear = () => {
		generation.current++;
		setItems([]);
	};

	const onPaste = useEffectEvent((event: ClipboardEvent) => {
		const files = [...(event.clipboardData?.files ?? [])].filter(isImage);
		if (files.length > 0) add(files);
	});
	useEffect(() => {
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	}, []);

	const finished = items.filter((item) => item.status === "done" && item.text);

	return (
		<ToolPage
			tool={OCR_TOOL}
			options={
				<>
					<FormatPicker
						labelId="ocr.language"
						value={language}
						onChange={changeLanguage}
						options={[
							{ id: "eng+ind", label: t("ocr.language.both") },
							{ id: "eng", label: t("ocr.language.eng") },
							{ id: "ind", label: t("ocr.language.ind") },
						]}
					/>
					<p className="text-muted text-xs">
						<FormattedMessage id="ocr.language.hint" />
					</p>
				</>
			}
		>
			<div className="flex flex-col gap-2">
				<Dropzone kind={IMAGE_KIND} onFiles={add} />
				<p className="text-center text-muted text-xs">
					<FormattedMessage id="ocr.paste" />
				</p>
			</div>
			{items.length > 0 && (
				<section className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
					<div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-separator border-b px-4 py-2">
						<p className="eyebrow text-muted">
							<FormattedMessage id="ocr.results" />
						</p>
						<div className="flex gap-1">
							{finished.length > 1 && (
								<Button
									variant="ghost"
									size="sm"
									onPress={() =>
										downloadBlob(
											textFile(
												finished
													.map((item) => `${item.file.name}\n\n${item.text}`)
													.join("\n\n\n"),
											),
											"shapeshift-text.txt",
										)
									}
								>
									<Download size={14} />
									<FormattedMessage id="ocr.downloadAll" />
								</Button>
							)}
							<Button variant="ghost" size="sm" onPress={clear}>
								<Eraser size={14} />
								<FormattedMessage id="combine.clear" />
							</Button>
						</div>
					</div>
					<ul className="flex flex-col divide-y divide-separator">
						{items.map((item) => (
							<Result
								key={item.id}
								item={item}
								onEdit={(text) => update(item.id, { text })}
							/>
						))}
					</ul>
				</section>
			)}
		</ToolPage>
	);
}
