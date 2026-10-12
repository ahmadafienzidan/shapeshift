import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { type TokenType, tokenize } from "../lib/json";

const TOKEN_CLASS: Record<TokenType, string> = {
	key: "text-(--syntax-key)",
	string: "text-(--syntax-string)",
	number: "text-(--syntax-number)",
	literal: "text-(--syntax-literal) font-semibold",
	punctuation: "text-muted",
	space: "",
};

const MAX_LINES = 4000;

export function JsonCode({
	json,
	wrap = true,
}: {
	json: string;
	wrap?: boolean;
}) {
	const lines = json.split("\n");
	const shown = lines.slice(0, MAX_LINES);
	const gutter = String(shown.length).length;

	return (
		<div className="overflow-auto font-mono text-[0.8125rem] leading-6">
			<table className="w-full border-collapse">
				<tbody>
					{shown.map((line, index) => {
						const content = line.trimStart();
						const leading = line.slice(0, line.length - content.length);
						// Tabs render 2 columns wide (see tab-size below).
						const indent = leading.replaceAll("\t", "  ").length;
						return (
							// biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity beyond their position
							<tr key={index} className="hover:bg-surface-secondary">
								<td
									className="sticky left-0 select-none border-separator border-r bg-surface px-3 text-right align-top text-muted/60"
									style={{ width: `${gutter + 2}ch` }}
								>
									{index + 1}
								</td>
								<td
									className={
										wrap
											? "whitespace-pre-wrap pr-4 [overflow-wrap:anywhere] [tab-size:2]"
											: "whitespace-pre pr-4 [tab-size:2]"
									}
									// A hanging indent: wrapped continuation lines line up two
									// columns past the line's own indentation, not at the margin.
									style={{
										paddingLeft: `calc(1rem + ${indent + 2}ch)`,
										textIndent: "-2ch",
									}}
								>
									{tokenize(content).map((token, tokenIndex) => (
										<span
											// biome-ignore lint/suspicious/noArrayIndexKey: tokens are rendered in order and never reordered
											key={tokenIndex}
											className={TOKEN_CLASS[token.type]}
										>
											{token.text}
										</span>
									))}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{lines.length > MAX_LINES && (
				<p className="border-separator border-t px-4 py-3 text-muted text-xs">
					<FormattedMessage
						id="json.truncated"
						values={{ shown: MAX_LINES, total: lines.length }}
					/>
				</p>
			)}
		</div>
	);
}

function Primitive({ value }: { value: unknown }) {
	if (typeof value === "string") {
		return (
			<span className="break-all text-(--syntax-string)">
				{JSON.stringify(value)}
			</span>
		);
	}
	if (typeof value === "number") {
		return <span className="text-(--syntax-number)">{value}</span>;
	}
	return (
		<span className="font-semibold text-(--syntax-literal)">
			{String(value)}
		</span>
	);
}

function childPath(path: string, key: string, isArray: boolean): string {
	if (isArray) return `${path}[${key}]`;
	return /^[A-Za-z_$][\w$]*$/.test(key)
		? `${path}.${key}`
		: `${path}[${JSON.stringify(key)}]`;
}

function TreeNode({
	name,
	value,
	path,
	depth,
	openDepth,
}: {
	name?: string;
	value: unknown;
	path: string;
	depth: number;
	openDepth: number;
}) {
	const isContainer = value !== null && typeof value === "object";
	const [open, setOpen] = useState(depth < openDepth);
	const label = name !== undefined && (
		<span className="text-(--syntax-key)" title={path}>
			{name}
			<span className="text-muted">: </span>
		</span>
	);

	if (!isContainer) {
		return (
			<div className="flex min-w-0 gap-1 py-0.5 pl-5">
				{label}
				<Primitive value={value} />
			</div>
		);
	}

	const isArray = Array.isArray(value);
	const entries = Object.entries(value as Record<string, unknown>);
	const [openBracket, closeBracket] = isArray ? ["[", "]"] : ["{", "}"];

	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center gap-1 rounded py-0.5 text-left hover:bg-surface-secondary"
			>
				<ChevronRight
					size={14}
					className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`}
				/>
				{label}
				<span className="text-muted">
					{openBracket}
					{!open && (
						<>
							<span className="mx-1 rounded bg-default px-1.5 text-[0.6875rem]">
								<FormattedMessage
									id={isArray ? "json.items" : "json.keys"}
									values={{ count: entries.length }}
								/>
							</span>
							{closeBracket}
						</>
					)}
				</span>
			</button>
			{open && (
				<>
					<div className="ml-[7px] border-separator border-l pl-2">
						{entries.map(([key, child]) => (
							<TreeNode
								key={key}
								name={key}
								value={child}
								path={childPath(path, key, isArray)}
								depth={depth + 1}
								openDepth={openDepth}
							/>
						))}
					</div>
					<span className="pl-5 text-muted">{closeBracket}</span>
				</>
			)}
		</div>
	);
}

export function JsonTree({
	value,
	openDepth,
}: {
	value: unknown;
	openDepth: number;
}) {
	return (
		<div className="overflow-auto p-4 font-mono text-[0.8125rem] leading-6">
			<TreeNode value={value} path="$" depth={0} openDepth={openDepth} />
		</div>
	);
}
