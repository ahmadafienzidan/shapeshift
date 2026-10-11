import { Button } from "@heroui/react";
import {
	ArrowLeftRight,
	Check,
	Copy,
	Download,
	Eraser,
	Sparkles,
	Upload,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { DropZone, FileTrigger } from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import { FormatPicker } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import {
	convertData,
	DATA_EXTENSIONS,
	DATA_MIME,
	type DataFormat,
	detectFormat,
	SAMPLE,
} from "../lib/data";
import { collectDropItems, downloadBlob } from "../lib/files";
import { DATA_TOOL } from "../tools";

const FORMATS: { id: DataFormat; label: string }[] = [
	{ id: "json", label: "JSON" },
	{ id: "csv", label: "CSV" },
	{ id: "yaml", label: "YAML" },
];

const DELIMITERS = { comma: ",", semicolon: ";", tab: "\t" };

type Delimiter = keyof typeof DELIMITERS;

function Panel({
	label,
	actions,
	children,
}: {
	label: ReactNode;
	actions: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-separator border-b px-4 py-2">
				<p className="eyebrow text-muted">{label}</p>
				<div className="flex gap-1">{actions}</div>
			</div>
			{children}
		</div>
	);
}

const EDITOR =
	"min-h-[26rem] w-full flex-1 resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-muted/60";

export function DataPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });

	const [input, setInput] = useState("");
	const [from, setFrom] = useState<DataFormat>("json");
	const [to, setTo] = useState<DataFormat>("csv");
	const [indent, setIndent] = useState("2");
	const [delimiter, setDelimiter] = useState<Delimiter>("comma");
	const [copied, setCopied] = useState(false);

	const result = useMemo(() => {
		try {
			return {
				output: convertData(input, from, to, {
					indent: Number(indent),
					delimiter: DELIMITERS[delimiter],
				}),
			};
		} catch (error) {
			return { output: "", error: String(error) };
		}
	}, [input, from, to, indent, delimiter]);

	const load = async (file: File) => {
		const format = detectFormat(file.name);
		if (format) {
			setFrom(format);
			if (format === to) setTo(format === "json" ? "csv" : "json");
		}
		if (/\.tsv$/i.test(file.name)) setDelimiter("tab");
		setInput(await file.text());
	};

	const swap = () => {
		if (!result.error) setInput(result.output);
		setFrom(to);
		setTo(from);
	};

	const copy = async () => {
		await navigator.clipboard.writeText(result.output);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const usesCsv = from === "csv" || to === "csv";

	return (
		<ToolPage
			tool={DATA_TOOL}
			options={
				<>
					<FormatPicker
						labelId="data.from"
						value={from}
						onChange={setFrom}
						options={FORMATS}
					/>
					<FormatPicker
						labelId="data.to"
						value={to}
						onChange={setTo}
						options={FORMATS}
					/>
					<Button variant="outline" className="font-semibold" onPress={swap}>
						<ArrowLeftRight size={16} />
						<FormattedMessage id="data.swap" />
					</Button>
					{to !== "csv" && (
						<FormatPicker
							labelId="data.indent"
							value={indent}
							onChange={setIndent}
							options={[
								{ id: "2", label: t("data.indent.2") },
								{ id: "4", label: t("data.indent.4") },
							]}
						/>
					)}
					{usesCsv && (
						<FormatPicker
							labelId="data.delimiter"
							value={delimiter}
							onChange={setDelimiter}
							options={[
								{ id: "comma", label: t("data.delimiter.comma") },
								{ id: "semicolon", label: t("data.delimiter.semicolon") },
								{ id: "tab", label: t("data.delimiter.tab") },
							]}
						/>
					)}
				</>
			}
		>
			<div className="grid gap-4 2xl:grid-cols-2">
				<DropZone
					onDrop={async (event) => {
						const [file] = await collectDropItems(event.items);
						if (file) await load(file);
					}}
					className={({ isDropTarget }) =>
						`flex rounded-xl ${isDropTarget ? "outline-2 outline-electric outline-offset-2" : ""}`
					}
				>
					<Panel
						label={
							<FormattedMessage
								id="data.input"
								values={{ format: from.toUpperCase() }}
							/>
						}
						actions={
							<>
								<FileTrigger
									acceptedFileTypes={[
										".json",
										".csv",
										".tsv",
										".yaml",
										".yml",
										".txt",
									]}
									onSelect={(list) => {
										const file = list?.[0];
										if (file) load(file);
									}}
								>
									<Button variant="ghost" size="sm">
										<Upload size={14} />
										<FormattedMessage id="data.upload" />
									</Button>
								</FileTrigger>
								<Button
									variant="ghost"
									size="sm"
									onPress={() => {
										setFrom("json");
										if (to === "json") setTo("csv");
										setInput(SAMPLE);
									}}
								>
									<Sparkles size={14} />
									<FormattedMessage id="data.sample" />
								</Button>
								<Button
									isIconOnly
									variant="ghost"
									size="sm"
									aria-label={t("data.clear")}
									isDisabled={input === ""}
									onPress={() => setInput("")}
								>
									<Eraser size={14} />
								</Button>
							</>
						}
					>
						<textarea
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder={t("data.placeholder")}
							spellCheck={false}
							aria-label={t("data.inputLabel")}
							className={EDITOR}
						/>
					</Panel>
				</DropZone>

				<Panel
					label={
						<FormattedMessage
							id="data.output"
							values={{ format: to.toUpperCase() }}
						/>
					}
					actions={
						<>
							<Button
								variant="ghost"
								size="sm"
								isDisabled={!result.output}
								onPress={copy}
							>
								{copied ? <Check size={14} /> : <Copy size={14} />}
								<FormattedMessage id={copied ? "data.copied" : "data.copy"} />
							</Button>
							<Button
								variant="primary"
								size="sm"
								className="font-semibold"
								isDisabled={!result.output}
								onPress={() =>
									downloadBlob(
										new Blob([result.output], { type: DATA_MIME[to] }),
										`shapeshift.${DATA_EXTENSIONS[to]}`,
									)
								}
							>
								<Download size={14} />
								<FormattedMessage id="queue.download" />
							</Button>
						</>
					}
				>
					{result.error ? (
						<div className="m-4 rounded border border-danger/40 bg-danger-soft p-4 font-mono text-danger-soft-foreground text-sm">
							{result.error}
						</div>
					) : (
						<textarea
							value={result.output}
							readOnly
							spellCheck={false}
							aria-label={t("data.outputLabel")}
							placeholder={t("data.outputPlaceholder")}
							className={EDITOR}
						/>
					)}
				</Panel>
			</div>
		</ToolPage>
	);
}
