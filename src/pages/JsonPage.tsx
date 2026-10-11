import { Button } from "@heroui/react";
import {
	Braces,
	ChevronsDownUp,
	ChevronsUpDown,
	Code2,
	Download,
	Eraser,
	ListTree,
	Sparkles,
	Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DropZone, FileTrigger } from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { EDITOR_CLASS, EditorPanel } from "../components/EditorPanel";
import { JsonCode, JsonTree } from "../components/JsonView";
import { FormatPicker } from "../components/Options";
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

export function JsonPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [input, setInput] = useState("");
	const [indent, setIndent] = useState<Indent>("2");
	const [sort, setSort] = useState<"original" | "sorted">("original");
	const [view, setView] = useState<"code" | "tree">("code");
	const [treeVersion, setTreeVersion] = useState({ id: 0, openDepth: 2 });

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
			options={
				<>
					<FormatPicker
						labelId="json.indent"
						value={indent}
						onChange={setIndent}
						options={[
							{ id: "2", label: "2" },
							{ id: "4", label: "4" },
							{ id: "tab", label: "Tab" },
							{ id: "minify", label: t("json.minify") },
						]}
					/>
					<FormatPicker
						labelId="json.keyOrder"
						value={sort}
						onChange={setSort}
						options={[
							{ id: "original", label: t("json.keyOrder.original") },
							{ id: "sorted", label: "A–Z" },
						]}
					/>
					{stats && (
						<dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border text-center">
							{(
								[
									["json.stat.size", formatBytes(new Blob([output]).size)],
									["json.stat.keys", intl.formatNumber(stats.keys)],
									["json.stat.objects", intl.formatNumber(stats.objects)],
									["json.stat.depth", intl.formatNumber(stats.depth)],
								] as const
							).map(([id, stat]) => (
								<div key={id} className="flex flex-col gap-0.5 bg-surface p-2">
									<dd className="font-mono font-semibold text-sm">{stat}</dd>
									<dt className="eyebrow text-[0.625rem] text-muted">
										<FormattedMessage id={id} />
									</dt>
								</div>
							))}
						</dl>
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
							className={EDITOR_CLASS}
						/>
					</EditorPanel>
				</DropZone>

				<EditorPanel
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
							{view === "tree" && (
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
						</>
					}
				>
					<div className="min-h-[26rem] flex-1">
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
								<JsonCode json={output} />
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
			</div>
		</ToolPage>
	);
}
