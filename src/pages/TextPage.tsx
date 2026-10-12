import { Button } from "@heroui/react";
import { Eraser, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { EditorPanel } from "../components/EditorPanel";
import { ToolPage } from "../components/ToolPage";
import {
	type CaseId,
	convertCase,
	type LineAction,
	textStats,
	topWords,
	transformLines,
} from "../lib/text";
import { TEXT_TOOL } from "../tools";

const CASES: { id: CaseId; label: string }[] = [
	{ id: "upper", label: "UPPERCASE" },
	{ id: "lower", label: "lowercase" },
	{ id: "title", label: "Title Case" },
	{ id: "sentence", label: "Sentence case" },
	{ id: "camel", label: "camelCase" },
	{ id: "pascal", label: "PascalCase" },
	{ id: "snake", label: "snake_case" },
	{ id: "kebab", label: "kebab-case" },
	{ id: "constant", label: "CONSTANT_CASE" },
];

const LINE_ACTIONS: LineAction[] = [
	"sort",
	"sortDesc",
	"reverse",
	"unique",
	"removeEmpty",
	"cleanSpaces",
];

function minutes(value: number, locale: string): string {
	if (value === 0) return "0";
	if (value < 1) return `< 1`;
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
		value,
	);
}

export function TextPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [text, setText] = useState("");
	const [history, setHistory] = useState<string[]>([]);

	const stats = useMemo(
		() => textStats(text, intl.locale),
		[text, intl.locale],
	);
	const frequent = useMemo(
		() => topWords(text, intl.locale, 8),
		[text, intl.locale],
	);

	const apply = (next: string) => {
		if (next === text) return;
		setHistory((current) => [...current.slice(-49), text]);
		setText(next);
	};

	const undo = () => {
		const previous = history.at(-1);
		if (previous === undefined) return;
		setHistory((current) => current.slice(0, -1));
		setText(previous);
	};

	const cards: [string, string][] = [
		["text.stat.words", intl.formatNumber(stats.words)],
		["text.stat.characters", intl.formatNumber(stats.characters)],
		["text.stat.noSpaces", intl.formatNumber(stats.charactersNoSpaces)],
		["text.stat.sentences", intl.formatNumber(stats.sentences)],
		["text.stat.paragraphs", intl.formatNumber(stats.paragraphs)],
		["text.stat.lines", intl.formatNumber(stats.lines)],
		["text.stat.reading", `${minutes(stats.readingMinutes, intl.locale)} min`],
		[
			"text.stat.speaking",
			`${minutes(stats.speakingMinutes, intl.locale)} min`,
		],
	];

	return (
		<ToolPage tool={TEXT_TOOL}>
			<dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
				{cards.map(([id, value]) => (
					<div key={id} className="flex flex-col gap-1 bg-surface p-4">
						<dd className="headline text-3xl tabular-nums">{value}</dd>
						<dt className="eyebrow text-[0.625rem] text-muted">
							<FormattedMessage id={id} />
						</dt>
					</div>
				))}
			</dl>

			<div className="grid gap-4 xl:grid-cols-[1fr_18rem]">
				<EditorPanel
					label={<FormattedMessage id="text.input" />}
					actions={
						<>
							<Button
								variant="ghost"
								size="sm"
								isDisabled={history.length === 0}
								onPress={undo}
							>
								<Undo2 size={14} />
								<FormattedMessage id="text.undo" />
							</Button>
							<CopyButton text={text} />
							<Button
								isIconOnly
								variant="ghost"
								size="sm"
								aria-label={t("data.clear")}
								isDisabled={text === ""}
								onPress={() => apply("")}
							>
								<Eraser size={14} />
							</Button>
						</>
					}
				>
					<textarea
						value={text}
						onChange={(event) => setText(event.target.value)}
						placeholder={t("text.placeholder")}
						aria-label={t("text.input")}
						className="min-h-[26rem] w-full flex-1 resize-y bg-transparent p-4 text-base leading-relaxed outline-none placeholder:text-muted/60"
					/>
				</EditorPanel>

				<aside className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5">
					<div className="flex flex-col gap-2">
						<p className="eyebrow text-muted">
							<FormattedMessage id="text.case" />
						</p>
						<div className="grid grid-cols-2 gap-1.5">
							{CASES.map((option) => (
								<Button
									key={option.id}
									size="sm"
									variant="tertiary"
									isDisabled={text === ""}
									className="justify-start font-mono text-xs"
									onPress={() =>
										apply(convertCase(text, option.id, intl.locale))
									}
								>
									{option.label}
								</Button>
							))}
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<p className="eyebrow text-muted">
							<FormattedMessage id="text.lines" />
						</p>
						<div className="grid grid-cols-2 gap-1.5">
							{LINE_ACTIONS.map((action) => (
								<Button
									key={action}
									size="sm"
									variant="tertiary"
									isDisabled={text === ""}
									className="justify-start text-xs"
									onPress={() =>
										apply(transformLines(text, action, intl.locale))
									}
								>
									<FormattedMessage id={`text.line.${action}`} />
								</Button>
							))}
						</div>
					</div>
					{frequent.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="eyebrow text-muted">
								<FormattedMessage id="text.frequent" />
							</p>
							<ol className="flex flex-col gap-1">
								{frequent.map(([word, count]) => (
									<li
										key={word}
										className="flex items-center gap-2 font-mono text-xs"
									>
										<span className="min-w-0 flex-1 truncate">{word}</span>
										<span
											className="h-1.5 rounded-full bg-electric"
											style={{
												width: `${(count / (frequent[0]?.[1] ?? 1)) * 4}rem`,
											}}
										/>
										<span className="w-6 text-right text-muted">{count}</span>
									</li>
								))}
							</ol>
						</div>
					)}
				</aside>
			</div>
		</ToolPage>
	);
}
