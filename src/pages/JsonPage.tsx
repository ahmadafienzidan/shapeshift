import { Button, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import {
	Braces,
	ChevronsDownUp,
	ChevronsUpDown,
	Code2,
	Download,
	Eraser,
	ListTree,
	Maximize2,
	Minimize2,
	Sparkles,
	Upload,
	WrapText,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { DropZone, FileTrigger } from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { EDITOR_CLASS, EditorPanel } from "../components/EditorPanel";
import { JsonCode, JsonTree } from "../components/JsonView";
import { ToolPage } from "../components/ToolPage";
import { collectDropItems, downloadBlob, formatBytes } from "../lib/files";
import { jsonStats, parseJson, sortKeys } from "../lib/json";
import { JSON_TOOL } from "../tools";

const SAMPLE = `{"store":"Toko Shapeshift","open":true,"rating":4.8,"address":{"street":"Jl. Merdeka 17","city":"Bandung","geo":{"lat":-6.9175,"lng":107.6191}},"tags":["coffee","wifi","24h"],"products":[{"id":1,"name":"Kopi Susu","price":18000,"stock":null},{"id":2,"name":"Croissant","price":22000,"stock":12}]}`;

type Indent = "2" | "4" | "tab" | "minify";

const INDENTS: Record<Indent, string | number | undefined> = {
	"2": 2,
	"4": 4,
	tab: "\t",
	minify: undefined,
};

function Segment<T extends string>({
	label,
	value,
	onChange,
	options,
}: {
	label: ReactNode;
	value: T;
	onChange: (value: T) => void;
	options: { id: T; label: string }[];
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="eyebrow text-[0.6875rem] text-muted">{label}</span>
			<ToggleButtonGroup
				size="sm"
				selectionMode="single"
				disallowEmptySelection
				selectedKeys={new Set([value])}
				onSelectionChange={(keys) => onChange([...keys][0] as T)}
			>
				{options.map((option) => (
					<ToggleButton key={option.id} id={option.id}>
						{option.label}
					</ToggleButton>
				))}
			</ToggleButtonGroup>
		</div>
	);
}

export function JsonPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [input, setInput] = useState("");
	const [indent, setIndent] = useState<Indent>("2");
	const [sort, setSort] = useState<"original" | "sorted">("original");
	const [view, setView] = useState<"code" | "tree">("code");
	const [wrap, setWrap] = useState(true);
	const [expanded, setExpanded] = useState(false);
	const [treeVersion, setTreeVersion] = useState({ id: 0, openDepth: 2 });

	useEffect(() => {
		if (!expanded) return;
		const close = (event: KeyboardEvent) => {
			if (event.key === "Escape") setExpanded(false);
		};
		document.addEventListener("keydown", close);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", close);
			document.body.style.overflow = "";
		};
	}, [expanded]);

	const parsed = useMemo(
		() => (input.trim() === "" ? undefined : parseJson(input)),
		[input],
	);

	const value = useMemo(() => {
		if (!parsed?.ok) return undefined;
		return sort === "sorted" ? sortKeys(parsed.value) : parsed.value;
	}, [parsed, sort]);

	const output = useMemo(
		() =>
			value === undefined ? "" : JSON.stringify(value, null, INDENTS[indent]),
		[value, indent],
	);

	const stats = useMemo(
		() => (value === undefined ? undefined : jsonStats(value)),
		[value],
	);

	const load = async (file: File) => setInput(await file.text());

	const errorLine =
		parsed && !parsed.ok ? input.split("\n")[parsed.error.line - 1] : undefined;

	return (
		<ToolPage
			tool={JSON_TOOL}
			toolbar={
				<div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-surface px-4 py-3">
					<Segment
						label={<FormattedMessage id="json.indent" />}
						value={indent}
						onChange={setIndent}
						options={[
							{ id: "2", label: "2" },
							{ id: "4", label: "4" },
							{ id: "tab", label: "Tab" },
							{ id: "minify", label: t("json.minify") },
						]}
					/>
					<Segment
						label={<FormattedMessage id="json.keyOrder" />}
						value={sort}
						onChange={setSort}
						options={[
							{ id: "original", label: t("json.keyOrder.original") },
							{ id: "sorted", label: "A–Z" },
						]}
					/>
					{stats && (
						<dl className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs lg:ml-auto">
							{(
								[
									["json.stat.size", formatBytes(new Blob([output]).size)],
									["json.stat.keys", intl.formatNumber(stats.keys)],
									["json.stat.objects", intl.formatNumber(stats.objects)],
									["json.stat.depth", intl.formatNumber(stats.depth)],
								] as const
							).map(([id, stat]) => (
								<div key={id} className="flex items-baseline gap-1.5">
									<dt className="text-muted">
										<FormattedMessage id={id} />
									</dt>
									<dd className="font-semibold">{stat}</dd>
								</div>
							))}
						</dl>
					)}
				</div>
			}
		>
			<DropZone
				onDrop={async (event) => {
					const [file] = await collectDropItems(event.items);
					if (file) await load(file);
				}}
				className={({ isDropTarget }) =>
					`flex rounded-xl ${isDropTarget ? "outline-2 outline-electric outline-offset-2" : ""}`
				}
			>
				<EditorPanel
					label={
						<span className="flex items-center gap-2">
							<Braces size={14} />
							<FormattedMessage id="json.input" />
							{parsed && (
								<span
									className={`size-2 rounded-full ${parsed.ok ? "bg-success" : "bg-danger"}`}
									title={t(parsed.ok ? "json.valid" : "json.invalid")}
								/>
							)}
						</span>
					}
					actions={
						<>
							<FileTrigger
								acceptedFileTypes={[".json", "application/json", ".txt"]}
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
								onPress={() => setInput(SAMPLE)}
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
						placeholder={t("json.placeholder")}
						spellCheck={false}
						aria-label={t("json.input")}
						className={`${EDITOR_CLASS} min-h-40`}
					/>
				</EditorPanel>
			</DropZone>

			{/* Expanding swaps classes on this wrapper instead of re-rendering the
			    panel elsewhere, so the tree keeps its open and closed nodes. */}
			<section
				aria-label={t("json.output")}
				className={
					expanded
						? "fixed inset-0 z-50 flex flex-col bg-background/95 p-3 backdrop-blur sm:p-6"
						: "flex flex-col"
				}
			>
				<EditorPanel
					className={expanded ? "min-h-0 flex-1" : ""}
					label={
						<span className="flex items-center gap-1">
							<Button
								size="sm"
								variant={view === "code" ? "tertiary" : "ghost"}
								onPress={() => setView("code")}
							>
								<Code2 size={14} />
								<FormattedMessage id="json.view.code" />
							</Button>
							<Button
								size="sm"
								variant={view === "tree" ? "tertiary" : "ghost"}
								onPress={() => setView("tree")}
							>
								<ListTree size={14} />
								<FormattedMessage id="json.view.tree" />
							</Button>
						</span>
					}
					actions={
						<>
							{view === "code" ? (
								<Button
									isIconOnly
									size="sm"
									variant={wrap ? "tertiary" : "ghost"}
									aria-label={t("json.wrap")}
									aria-pressed={wrap}
									onPress={() => setWrap(!wrap)}
								>
									<WrapText size={14} />
								</Button>
							) : (
								<>
									<Button
										isIconOnly
										variant="ghost"
										size="sm"
										aria-label={t("json.expandAll")}
										isDisabled={!output}
										onPress={() =>
											setTreeVersion(({ id }) => ({
												id: id + 1,
												openDepth: 99,
											}))
										}
									>
										<ChevronsUpDown size={14} />
									</Button>
									<Button
										isIconOnly
										variant="ghost"
										size="sm"
										aria-label={t("json.collapseAll")}
										isDisabled={!output}
										onPress={() =>
											setTreeVersion(({ id }) => ({ id: id + 1, openDepth: 1 }))
										}
									>
										<ChevronsDownUp size={14} />
									</Button>
								</>
							)}
							<CopyButton text={output} />
							<Button
								variant="primary"
								size="sm"
								className="font-semibold"
								isDisabled={!output}
								onPress={() =>
									downloadBlob(
										new Blob([output], { type: "application/json" }),
										"shapeshift.json",
									)
								}
							>
								<Download size={14} />
								<FormattedMessage id="queue.download" />
							</Button>
							<Button
								isIconOnly
								variant="ghost"
								size="sm"
								aria-label={t(
									expanded ? "json.collapseView" : "json.expandView",
								)}
								onPress={() => setExpanded(!expanded)}
							>
								{expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
							</Button>
						</>
					}
				>
					<div
						className={
							expanded ? "min-h-0 flex-1 overflow-auto" : "min-h-[30rem] flex-1"
						}
					>
						{parsed && !parsed.ok && (
							<div className="m-4 flex flex-col gap-3 rounded border border-danger/40 bg-danger-soft p-4 text-danger-soft-foreground">
								<p className="font-semibold text-sm">
									<FormattedMessage
										id="json.errorAt"
										values={{
											line: parsed.error.line,
											column: parsed.error.column,
										}}
									/>
								</p>
								<p className="text-sm">
									{parsed.error.trailingComma ? (
										<FormattedMessage id="json.error.trailingComma" />
									) : parsed.error.token === undefined ? (
										<FormattedMessage id="json.error.end" />
									) : (
										<FormattedMessage
											id="json.error.unexpected"
											values={{
												token: (
													<code className="rounded bg-surface px-1 font-mono">
														{JSON.stringify(parsed.error.token)}
													</code>
												),
											}}
										/>
									)}
								</p>
								{errorLine !== undefined && (
									<pre className="overflow-x-auto rounded bg-surface p-3 font-mono text-foreground text-xs">
										<span className="select-none text-muted">
											{parsed.error.line} │{" "}
										</span>
										{errorLine}
										{"\n"}
										<span className="select-none text-danger">
											{" ".repeat(String(parsed.error.line).length + 3)}
											{" ".repeat(Math.max(0, parsed.error.column - 1))}^
										</span>
									</pre>
								)}
							</div>
						)}
						{output &&
							(view === "code" ? (
								<JsonCode json={output} wrap={wrap} />
							) : (
								<JsonTree
									key={treeVersion.id}
									value={value}
									openDepth={treeVersion.openDepth}
								/>
							))}
						{!parsed && (
							<p className="p-4 text-muted text-sm">
								<FormattedMessage id="json.empty" />
							</p>
						)}
					</div>
				</EditorPanel>
			</section>
		</ToolPage>
	);
}
