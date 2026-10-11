import { Button, ToggleButton } from "@heroui/react";
import type { ChangeObject } from "diff";
import { ArrowLeftRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { EDITOR_CLASS, EditorPanel } from "../components/EditorPanel";
import { FormatPicker } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import { type DiffRow, diffInline, diffRows, type Side } from "../lib/textDiff";
import { DIFF_TOOL } from "../tools";

const SAMPLE_BEFORE = `Shapeshift converts files in your browser.
Images, PDFs, and data files are supported.
Nothing is uploaded to a server.
Version 1.0`;

const SAMPLE_AFTER = `Shapeshift converts files right in your browser.
Images, PDFs, QR codes, and data files are supported.
Nothing is uploaded to a server.
It also works offline.
Version 2.0`;

type Granularity = "lines" | "words" | "chars";

function Words({
	changes,
	side,
}: {
	changes: ChangeObject<string>[];
	side: "old" | "new";
}) {
	return (
		<>
			{changes.map((change, index) => {
				if (side === "old" && change.added) return null;
				if (side === "new" && change.removed) return null;
				const changed = change.added || change.removed;
				return (
					<span
						// biome-ignore lint/suspicious/noArrayIndexKey: changes are positional
						key={index}
						className={
							changed
								? side === "old"
									? "rounded-sm bg-danger/35"
									: "rounded-sm bg-success/35"
								: undefined
						}
					>
						{change.value}
					</span>
				);
			})}
		</>
	);
}

function Cell({
	side,
	kind,
	words,
	which,
}: {
	side?: Side;
	kind: DiffRow["type"];
	words?: ChangeObject<string>[];
	which: "old" | "new";
}) {
	const tone =
		kind === "same"
			? ""
			: !side
				? "bg-default/40"
				: which === "old"
					? "bg-danger-soft"
					: "bg-success-soft";
	return (
		<>
			<td
				className={`w-10 select-none px-2 text-right align-top text-muted/60 ${tone}`}
			>
				{side?.number}
			</td>
			<td
				className={`w-4 select-none align-top ${which === "old" ? "text-danger" : "text-success"} ${tone}`}
			>
				{kind === "changed" && side ? (which === "old" ? "−" : "+") : ""}
			</td>
			<td className={`whitespace-pre-wrap break-all pr-3 align-top ${tone}`}>
				{side &&
					(words ? <Words changes={words} side={which} /> : side.text || " ")}
			</td>
		</>
	);
}

export function DiffPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [before, setBefore] = useState("");
	const [after, setAfter] = useState("");
	const [granularity, setGranularity] = useState<Granularity>("lines");
	const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
	const [ignoreCase, setIgnoreCase] = useState(false);

	const lineDiff = useMemo(
		() => diffRows(before, after, { ignoreWhitespace, ignoreCase }),
		[before, after, ignoreWhitespace, ignoreCase],
	);
	const inline = useMemo(
		() =>
			granularity === "lines"
				? []
				: diffInline(before, after, granularity, {
						ignoreWhitespace,
						ignoreCase,
					}),
		[before, after, granularity, ignoreWhitespace, ignoreCase],
	);

	const identical =
		before !== "" &&
		after !== "" &&
		lineDiff.added === 0 &&
		lineDiff.removed === 0;
	const hasInput = before !== "" || after !== "";

	return (
		<ToolPage
			tool={DIFF_TOOL}
			options={
				<>
					<FormatPicker
						labelId="diff.granularity"
						value={granularity}
						onChange={setGranularity}
						options={[
							{ id: "lines", label: t("diff.lines") },
							{ id: "words", label: t("diff.words") },
							{ id: "chars", label: t("diff.chars") },
						]}
					/>
					<div className="flex flex-col gap-2">
						<ToggleButton
							isSelected={ignoreWhitespace}
							onChange={setIgnoreWhitespace}
							isDisabled={granularity !== "lines"}
						>
							<FormattedMessage id="diff.ignoreWhitespace" />
						</ToggleButton>
						<ToggleButton isSelected={ignoreCase} onChange={setIgnoreCase}>
							<FormattedMessage id="diff.ignoreCase" />
						</ToggleButton>
					</div>
					{hasInput && granularity === "lines" && (
						<div className="flex gap-3 font-mono text-sm">
							<span className="text-success">+{lineDiff.added}</span>
							<span className="text-danger">−{lineDiff.removed}</span>
							<span className="text-muted">
								<FormattedMessage id="diff.lineCount" />
							</span>
						</div>
					)}
				</>
			}
		>
			<div className="grid gap-4 xl:grid-cols-2">
				<EditorPanel
					label={<FormattedMessage id="diff.original" />}
					actions={
						<Button
							variant="ghost"
							size="sm"
							onPress={() => {
								setBefore(SAMPLE_BEFORE);
								setAfter(SAMPLE_AFTER);
							}}
						>
							<Sparkles size={14} />
							<FormattedMessage id="data.sample" />
						</Button>
					}
				>
					<textarea
						value={before}
						onChange={(event) => setBefore(event.target.value)}
						spellCheck={false}
						aria-label={t("diff.original")}
						placeholder={t("diff.placeholder")}
						className={`${EDITOR_CLASS} min-h-60`}
					/>
				</EditorPanel>
				<EditorPanel
					label={<FormattedMessage id="diff.changed" />}
					actions={
						<Button
							variant="ghost"
							size="sm"
							onPress={() => {
								setBefore(after);
								setAfter(before);
							}}
						>
							<ArrowLeftRight size={14} />
							<FormattedMessage id="diff.swap" />
						</Button>
					}
				>
					<textarea
						value={after}
						onChange={(event) => setAfter(event.target.value)}
						spellCheck={false}
						aria-label={t("diff.changed")}
						placeholder={t("diff.placeholder")}
						className={`${EDITOR_CLASS} min-h-60`}
					/>
				</EditorPanel>
			</div>

			{identical && (
				<p className="rounded-xl border border-success/40 bg-success-soft p-4 text-center text-sm text-success-soft-foreground">
					<FormattedMessage id="diff.identical" />
				</p>
			)}

			{hasInput && !identical && granularity === "lines" && (
				<section className="overflow-x-auto rounded-xl border border-border bg-surface">
					<table className="w-full border-collapse font-mono text-[0.8125rem] leading-6">
						<tbody>
							{lineDiff.rows.map((row, index) => (
								<tr
									// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
									key={index}
									className="border-separator border-b last:border-b-0"
								>
									<Cell
										side={row.left}
										kind={row.type}
										words={row.type === "changed" ? row.words : undefined}
										which="old"
									/>
									<Cell
										side={row.right}
										kind={row.type}
										words={row.type === "changed" ? row.words : undefined}
										which="new"
									/>
								</tr>
							))}
						</tbody>
					</table>
				</section>
			)}

			{hasInput && !identical && granularity !== "lines" && (
				<section className="whitespace-pre-wrap break-all rounded-xl border border-border bg-surface p-5 font-mono text-sm leading-7">
					{inline.map((change, index) => (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: changes are positional
							key={index}
							className={
								change.added
									? "rounded-sm bg-success/30 text-success-soft-foreground"
									: change.removed
										? "rounded-sm bg-danger/30 text-danger-soft-foreground line-through"
										: undefined
							}
						>
							{change.value}
						</span>
					))}
				</section>
			)}
		</ToolPage>
	);
}
