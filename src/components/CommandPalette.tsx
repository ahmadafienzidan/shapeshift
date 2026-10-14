import { ListBox, Modal, SearchField } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { Autocomplete } from "react-aria-components";
import { createIntl, FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router";
import { useLocale } from "../i18n/locale";
import { MESSAGES } from "../i18n/messages";
import { search } from "../lib/search";
import { PDF_MODES, PDF_TOOL, pdfModePath, TOOLS } from "../tools";

type Entry = {
	id: string;
	path: string;
	icon: LucideIcon;
	tile: string;
	name: string;
	names: string[];
	context: string;
	keywords: string;
};

function useEntries(): Entry[] {
	const intl = useIntl();
	const { locale } = useLocale();
	const otherIntl = useMemo(() => {
		const other = locale === "en" ? "id" : "en";
		return createIntl({ locale: other, messages: MESSAGES[other] });
	}, [locale]);
	const here = (id: string) => intl.formatMessage({ id });
	// Both languages are searched, so either name finds a tool.
	const names = (id: string) => [here(id), otherIntl.formatMessage({ id })];
	const both = (id: string) => `${here(id)} ${otherIntl.formatMessage({ id })}`;
	return [
		...TOOLS.map((tool) => ({
			id: tool.id,
			path: tool.path,
			icon: tool.icon,
			tile: tool.tile,
			name: here(`tool.${tool.id}.name`),
			names: names(`tool.${tool.id}.name`),
			context: here(`nav.group.${tool.group}`),
			keywords: `${tool.id} ${both(`tool.${tool.id}.description`)}`,
		})),
		...PDF_MODES.map((mode) => ({
			id: `pdf-${mode.id}`,
			path: pdfModePath(mode.id),
			icon: mode.icon,
			tile: PDF_TOOL.tile,
			name: here(mode.labelId),
			names: names(mode.labelId),
			context: here("tool.pdf.name"),
			keywords: `pdf ${both("tool.pdf.name")}`,
		})),
	];
}

// Only the first rows are staggered, so typing never waits on the list.
const stagger = (index: number) => `${Math.min(index, 8) * 18}ms`;

function Search({ onClose }: { onClose: () => void }) {
	const intl = useIntl();
	const navigate = useNavigate();
	const entries = useEntries();
	const [query, setQuery] = useState("");
	const results = search(entries, query);

	return (
		<Autocomplete inputValue={query} onInputChange={setQuery}>
			<div className="border-separator border-b p-3">
				<SearchField
					autoFocus
					fullWidth
					aria-label={intl.formatMessage({ id: "search.label" })}
				>
					<SearchField.Group>
						<SearchField.SearchIcon />
						<SearchField.Input
							placeholder={intl.formatMessage({ id: "search.placeholder" })}
						/>
						<SearchField.ClearButton />
					</SearchField.Group>
				</SearchField>
			</div>
			<ListBox
				aria-label={intl.formatMessage({ id: "search.label" })}
				items={results}
				onAction={(key) => {
					const entry = entries.find((candidate) => candidate.id === key);
					if (!entry) return;
					navigate(entry.path);
					onClose();
				}}
				renderEmptyState={() => (
					<p className="px-3 py-8 text-center text-muted text-sm">
						<FormattedMessage id="search.empty" values={{ query }} />
					</p>
				)}
				className="max-h-[min(60dvh,28rem)] overflow-y-auto p-2"
			>
				{(entry) => (
					<ListBox.Item
						id={entry.id}
						textValue={entry.name}
						className="group flex animate-pop items-center gap-3"
						style={
							{ "--delay": stagger(results.indexOf(entry)) } as CSSProperties
						}
					>
						<div
							className={`grid size-8 shrink-0 place-items-center rounded transition-transform duration-200 group-data-[focused=true]:scale-110 ${entry.tile}`}
						>
							<entry.icon size={16} />
						</div>
						<span className="min-w-0 flex-1 truncate font-medium text-sm">
							{entry.name}
						</span>
						<span className="shrink-0 text-muted text-xs">{entry.context}</span>
					</ListBox.Item>
				)}
			</ListBox>
		</Autocomplete>
	);
}

export function CommandPalette({
	isOpen,
	onOpenChange,
}: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}) {
	const intl = useIntl();
	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
			<Modal.Container placement="top" size="md">
				<Modal.Dialog
					aria-label={intl.formatMessage({ id: "search.label" })}
					className="overflow-hidden p-0"
				>
					<Search onClose={() => onOpenChange(false)} />
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
