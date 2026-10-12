import { Button } from "@heroui/react";
import {
	Bold,
	Code,
	Download,
	Eraser,
	FileCode2,
	Heading1,
	Heading2,
	Image,
	Italic,
	Link2,
	List,
	ListChecks,
	ListOrdered,
	type LucideIcon,
	Minus,
	Printer,
	Quote,
	Sparkles,
	SquareCode,
	Strikethrough,
	Table,
	Upload,
} from "lucide-react";
import {
	type KeyboardEvent,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { DropZone, FileTrigger } from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { EDITOR_CLASS, EditorPanel } from "../components/EditorPanel";
import { Segment } from "../components/Segment";
import { ToolPage } from "../components/ToolPage";
import { collectDropItems, downloadBlob } from "../lib/files";
import {
	blockEdit,
	continueListEdit,
	documentTitle,
	type Edit,
	linkEdit,
	markdownStats,
	prefixEdit,
	renderMarkdown,
	standaloneHtml,
	wrapEdit,
} from "../lib/markdown";
import { MARKDOWN_TOOL } from "../tools";

const DRAFT_KEY = "markdown-draft";

const SAMPLE = `# Project notes

Write **Markdown** on the left and watch it render on the right. Everything stays in your browser, and your draft is saved as you type.

## What works

- **Bold**, *italic*, ~~strikethrough~~, and \`inline code\`
- [Links](https://github.com/ahmadafienzidan/shapeshift) that open in a new tab
- Tables, task lists, quotes, and highlighted code

### Tasks

- [x] Draft the outline
- [ ] Add screenshots
- [ ] Share the HTML export

> Tip: press **Ctrl + B** for bold, **Ctrl + I** for italic, and **Ctrl + K** for a link. Lists continue when you press Enter.

| Format | Shortcut | Output |
| ------ | -------- | ------ |
| Bold   | Ctrl + B | **text** |
| Italic | Ctrl + I | *text* |
| Link   | Ctrl + K | [text](https://) |

\`\`\`ts
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

---

Export to **.md**, a standalone **HTML** page, or print to **PDF** from the toolbar.
`;

type View = "edit" | "split" | "preview";

type Action = {
	id: string;
	icon: LucideIcon;
	edit: (value: string, start: number, end: number) => Edit;
	shortcut?: string;
};

export function MarkdownPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [source, setSource] = useState(
		() => localStorage.getItem(DRAFT_KEY) ?? SAMPLE,
	);
	const [fileName, setFileName] = useState("document.md");
	const [view, setView] = useState<View>("split");
	const editor = useRef<HTMLTextAreaElement>(null);
	const preview = useRef<HTMLDivElement>(null);

	useEffect(() => {
		localStorage.setItem(DRAFT_KEY, source);
	}, [source]);

	const deferred = useDeferredValue(source);
	const html = useMemo(() => renderMarkdown(deferred), [deferred]);
	const stats = useMemo(() => markdownStats(deferred), [deferred]);
	const baseName = fileName.replace(/\.(md|markdown|txt)$/i, "");
	const title = documentTitle(deferred, baseName);

	const actions: Action[] = [
		{
			id: "bold",
			icon: Bold,
			shortcut: "b",
			edit: (value, start, end) =>
				wrapEdit(value, start, end, "**", "**", t("markdown.placeholder.bold")),
		},
		{
			id: "italic",
			icon: Italic,
			shortcut: "i",
			edit: (value, start, end) =>
				wrapEdit(value, start, end, "*", "*", t("markdown.placeholder.italic")),
		},
		{
			id: "strike",
			icon: Strikethrough,
			edit: (value, start, end) =>
				wrapEdit(value, start, end, "~~", "~~", t("markdown.placeholder.text")),
		},
		{
			id: "h1",
			icon: Heading1,
			edit: (value, start, end) => prefixEdit(value, start, end, () => "# "),
		},
		{
			id: "h2",
			icon: Heading2,
			edit: (value, start, end) => prefixEdit(value, start, end, () => "## "),
		},
		{
			id: "link",
			icon: Link2,
			shortcut: "k",
			edit: (value, start, end) =>
				linkEdit(value, start, end, false, t("markdown.placeholder.link")),
		},
		{
			id: "image",
			icon: Image,
			edit: (value, start, end) =>
				linkEdit(value, start, end, true, t("markdown.placeholder.image")),
		},
		{
			id: "quote",
			icon: Quote,
			edit: (value, start, end) => prefixEdit(value, start, end, () => "> "),
		},
		{
			id: "code",
			icon: Code,
			edit: (value, start, end) =>
				wrapEdit(value, start, end, "`", "`", t("markdown.placeholder.code")),
		},
		{
			id: "codeBlock",
			icon: SquareCode,
			edit: (value, start, end) =>
				blockEdit(
					value,
					start,
					end,
					(selected) => `\`\`\`\n${selected}\n\`\`\``,
				),
		},
		{
			id: "bullets",
			icon: List,
			edit: (value, start, end) => prefixEdit(value, start, end, () => "- "),
		},
		{
			id: "numbers",
			icon: ListOrdered,
			edit: (value, start, end) =>
				prefixEdit(value, start, end, (index) => `${index + 1}. `),
		},
		{
			id: "tasks",
			icon: ListChecks,
			edit: (value, start, end) =>
				prefixEdit(value, start, end, () => "- [ ] "),
		},
		{
			id: "table",
			icon: Table,
			edit: (value, start, end) =>
				blockEdit(
					value,
					start,
					end,
					() =>
						"| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Cell     | Cell     | Cell     |",
				),
		},
		{
			id: "rule",
			icon: Minus,
			edit: (value, start, end) => blockEdit(value, start, end, () => "---"),
		},
	];

	// insertText goes through the browser's editing pipeline, so Ctrl+Z still
	// undoes toolbar and shortcut edits.
	const apply = (edit: (value: string, start: number, end: number) => Edit) => {
		const textarea = editor.current;
		if (!textarea) return;
		const change = edit(
			textarea.value,
			textarea.selectionStart,
			textarea.selectionEnd,
		);
		textarea.focus();
		textarea.setSelectionRange(change.from, change.to);
		document.execCommand("insertText", false, change.text);
		textarea.setSelectionRange(change.selectStart, change.selectEnd);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.ctrlKey || event.metaKey) {
			const action = actions.find(
				(item) => item.shortcut === event.key.toLowerCase(),
			);
			if (action) {
				event.preventDefault();
				apply(action.edit);
			}
			return;
		}
		const textarea = event.currentTarget;
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			textarea.selectionStart === textarea.selectionEnd
		) {
			const change = continueListEdit(textarea.value, textarea.selectionStart);
			if (change) {
				event.preventDefault();
				apply(() => change);
			}
		}
	};

	const syncScroll = () => {
		const from = editor.current;
		const to = preview.current;
		if (!from || !to || view !== "split") return;
		const ratio = from.scrollTop / (from.scrollHeight - from.clientHeight || 1);
		to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
	};

	const load = async (file: File) => {
		setSource(await file.text());
		setFileName(file.name);
	};

	const exportHtml = () => standaloneHtml(title, html);

	const print = () => {
		const frame = document.createElement("iframe");
		frame.style.cssText = "position:fixed;width:0;height:0;border:0";
		frame.srcdoc = exportHtml();
		frame.addEventListener("load", () => {
			const target = frame.contentWindow;
			if (!target) return;
			target.addEventListener("afterprint", () => frame.remove());
			target.print();
		});
		document.body.append(frame);
	};

	const height = "h-[min(75vh,52rem)] min-h-[28rem]";

	return (
		<ToolPage
			tool={MARKDOWN_TOOL}
			toolbar={
				<div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-surface px-4 py-3">
					<Segment
						label={<FormattedMessage id="markdown.view" />}
						value={view}
						onChange={setView}
						options={[
							{ id: "edit", label: t("markdown.view.edit") },
							{ id: "split", label: t("markdown.view.split") },
							{ id: "preview", label: t("markdown.view.preview") },
						]}
					/>
					<div className="flex flex-wrap gap-1 lg:ml-auto">
						<Button
							variant="ghost"
							size="sm"
							onPress={() =>
								downloadBlob(
									new Blob([source], { type: "text/markdown" }),
									`${baseName}.md`,
								)
							}
						>
							<Download size={14} />
							.md
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onPress={() =>
								downloadBlob(
									new Blob([exportHtml()], { type: "text/html" }),
									`${baseName}.html`,
								)
							}
						>
							<FileCode2 size={14} />
							.html
						</Button>
						<Button variant="ghost" size="sm" onPress={print}>
							<Printer size={14} />
							<FormattedMessage id="markdown.print" />
						</Button>
					</div>
				</div>
			}
		>
			<div className={`grid gap-4 ${view === "split" ? "lg:grid-cols-2" : ""}`}>
				{view !== "preview" && (
					<DropZone
						onDrop={async (event) => {
							const [file] = await collectDropItems(event.items);
							if (file) await load(file);
						}}
						className={({ isDropTarget }) =>
							`flex min-w-0 flex-col rounded-xl ${isDropTarget ? "outline-2 outline-electric outline-offset-2" : ""}`
						}
					>
						<EditorPanel
							className={height}
							label={<span className="truncate">{fileName}</span>}
							actions={
								<>
									<FileTrigger
										acceptedFileTypes={[
											".md",
											".markdown",
											"text/markdown",
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
											setSource(SAMPLE);
											setFileName("document.md");
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
										isDisabled={source === ""}
										onPress={() => setSource("")}
									>
										<Eraser size={14} />
									</Button>
								</>
							}
						>
							<div
								role="toolbar"
								aria-label={t("markdown.format")}
								className="flex gap-0.5 overflow-x-auto border-separator border-b px-2 py-1.5 [scrollbar-width:none]"
							>
								{actions.map((action) => (
									<Button
										key={action.id}
										isIconOnly
										variant="ghost"
										size="sm"
										aria-label={t(`markdown.action.${action.id}`)}
										onPress={() => apply(action.edit)}
										className="shrink-0"
									>
										<action.icon size={15} />
									</Button>
								))}
							</div>
							<textarea
								ref={editor}
								value={source}
								onChange={(event) => setSource(event.target.value)}
								onKeyDown={onKeyDown}
								onScroll={syncScroll}
								placeholder={t("markdown.placeholder")}
								spellCheck={false}
								aria-label={t("markdown.editor")}
								className={`${EDITOR_CLASS} min-h-0 resize-none`}
							/>
							<div className="flex flex-wrap gap-x-4 border-separator border-t px-4 py-2 font-mono text-[0.6875rem] text-muted">
								<span>
									<FormattedMessage
										id="markdown.stat.words"
										values={{ count: stats.words }}
									/>
								</span>
								<span>
									<FormattedMessage
										id="markdown.stat.characters"
										values={{ count: stats.characters }}
									/>
								</span>
								<span>
									<FormattedMessage
										id="markdown.stat.minutes"
										values={{ count: stats.minutes }}
									/>
								</span>
							</div>
						</EditorPanel>
					</DropZone>
				)}
				{view !== "edit" && (
					<EditorPanel
						className={height}
						label={<FormattedMessage id="markdown.preview" />}
						actions={<CopyButton text={html} />}
					>
						<div
							ref={preview}
							className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8"
						>
							{source.trim() === "" ? (
								<p className="text-muted text-sm">
									<FormattedMessage id="markdown.empty" />
								</p>
							) : (
								<article
									className="markdown-body"
									// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify in renderMarkdown
									dangerouslySetInnerHTML={{ __html: html }}
								/>
							)}
						</div>
					</EditorPanel>
				)}
			</div>
		</ToolPage>
	);
}
