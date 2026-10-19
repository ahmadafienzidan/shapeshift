import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
	Download,
	FileOutput,
	RotateCcw,
	RotateCw,
	Trash2,
	Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	GridList,
	GridListItem,
	type Selection,
	useDragAndDrop,
	useListData,
} from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import { formatBytes } from "../lib/files";
import { organizePdf, renderThumbnails } from "../lib/pdf";
import { PDF_KIND } from "../lib/pdfKind";
import { Dropzone } from "./Dropzone";

type Page = { id: string; index: number; rotation: number; thumb?: string };

type Output = { url: string; name: string; size: number };

export function PdfOrganizer() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [file, setFile] = useState<File>();
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState<Selection>(new Set());
	const [output, setOutput] = useState<Output>();
	const [error, setError] = useState<string>();
	const thumbs = useRef<string[]>([]);
	const pages = useListData<Page>({ initialItems: [] });

	useEffect(
		() => () => {
			for (const url of thumbs.current) URL.revokeObjectURL(url);
		},
		[],
	);

	const reset = () => {
		if (output) URL.revokeObjectURL(output.url);
		setOutput(undefined);
		setError(undefined);
	};

	const load = async ([next]: File[]) => {
		if (!next) return;
		reset();
		for (const url of thumbs.current) URL.revokeObjectURL(url);
		thumbs.current = [];
		pages.remove(...pages.items.map((page) => page.id));
		setSelected(new Set());
		setFile(next);
		setLoading(true);
		try {
			await renderThumbnails(next, 160, (index, url, count) => {
				thumbs.current.push(url);
				if (index === 0) {
					pages.append(
						...Array.from({ length: count }, (_, page) => ({
							id: `${next.name}-${page}`,
							index: page,
							rotation: 0,
						})),
					);
				}
				// Merge into the latest state: the page may already have been
				// rotated or moved before its thumbnail finished rendering.
				pages.update(`${next.name}-${index}`, (page) => ({
					...page,
					thumb: url,
				}));
			});
		} catch (caught) {
			setError(String(caught));
		} finally {
			setLoading(false);
		}
	};

	const { dragAndDropHooks } = useDragAndDrop({
		getItems: (keys) => [...keys].map((key) => ({ "text/plain": String(key) })),
		onReorder: (event) => {
			reset();
			if (event.target.dropPosition === "before") {
				pages.moveBefore(event.target.key, event.keys);
			} else if (event.target.dropPosition === "after") {
				pages.moveAfter(event.target.key, event.keys);
			}
		},
	});

	const selectedIds =
		selected === "all"
			? pages.items.map((page) => page.id)
			: pages.items
					.filter((page) => selected.has(page.id))
					.map((page) => page.id);

	const rotate = (ids: string[], delta: number) => {
		reset();
		for (const id of ids) {
			pages.update(id, (page) => ({
				...page,
				rotation: page.rotation + delta,
			}));
		}
	};

	const remove = (ids: string[]) => {
		reset();
		pages.remove(...ids);
		setSelected(new Set());
	};

	const save = async (onlySelected: boolean) => {
		if (!file) return;
		reset();
		const chosen = onlySelected
			? pages.items.filter((page) => selectedIds.includes(page.id))
			: pages.items;
		try {
			const blob = await organizePdf(file, chosen);
			const base = file.name.replace(/\.pdf$/i, "");
			setOutput({
				url: URL.createObjectURL(blob),
				name: `${base}-${onlySelected ? "extract" : "organized"}.pdf`,
				size: blob.size,
			});
		} catch (caught) {
			setError(String(caught));
		}
	};

	if (!file) return <Dropzone kind={PDF_KIND} onFiles={load} />;

	return (
		<section className="overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex flex-wrap items-center justify-between gap-3 border-separator border-b p-4">
				<div className="flex min-w-0 flex-col">
					<p className="truncate font-medium text-sm">{file.name}</p>
					<p className="font-mono text-muted text-xs">
						<FormattedMessage
							id="organize.summary"
							values={{
								pages: pages.items.length,
								selected: selectedIds.length,
							}}
						/>
					</p>
				</div>
				<div className="flex flex-wrap gap-1.5">
					<Button
						variant="ghost"
						size="sm"
						isDisabled={selectedIds.length === 0}
						onPress={() => rotate(selectedIds, -90)}
					>
						<RotateCcw size={14} />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						isDisabled={selectedIds.length === 0}
						onPress={() => rotate(selectedIds, 90)}
					>
						<RotateCw size={14} />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						isDisabled={selectedIds.length === 0}
						onPress={() => remove(selectedIds)}
					>
						<Trash2 size={14} />
						<FormattedMessage id="organize.delete" />
					</Button>
					<Button variant="ghost" size="sm" onPress={() => setFile(undefined)}>
						<Undo2 size={14} />
						<FormattedMessage id="organize.another" />
					</Button>
				</div>
			</div>

			<p className="border-separator border-b bg-surface-secondary px-4 py-2 text-muted text-xs">
				<FormattedMessage id="organize.hint" />
			</p>

			<GridList
				aria-label={t("organize.pages")}
				items={pages.items}
				layout="grid"
				selectionMode="multiple"
				selectedKeys={selected}
				onSelectionChange={setSelected}
				dragAndDropHooks={dragAndDropHooks}
				className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3 p-4"
				renderEmptyState={() => (
					<p className="col-span-full py-10 text-center text-muted text-sm">
						<FormattedMessage
							id={loading ? "organize.loading" : "organize.empty"}
						/>
					</p>
				)}
			>
				{(page) => (
					<GridListItem
						id={page.id}
						textValue={intl.formatMessage(
							{ id: "organize.page" },
							{ n: page.index + 1 },
						)}
						className={({
							isSelected,
							isDragging,
							isDropTarget,
							isFocusVisible,
						}) =>
							`group relative flex cursor-grab flex-col items-center gap-2 rounded-lg border p-2 outline-none transition-all ${
								isSelected
									? "border-electric bg-accent-soft"
									: "border-border hover:border-border-tertiary"
							} ${isDragging ? "opacity-40" : ""} ${isDropTarget ? "ring-2 ring-electric" : ""} ${isFocusVisible ? "ring-2 ring-electric/60" : ""}`
						}
					>
						<div className="grid aspect-[3/4] w-full place-items-center overflow-hidden">
							{page.thumb ? (
								<img
									src={page.thumb}
									alt=""
									draggable={false}
									className="max-h-full max-w-full shadow-md transition-transform duration-300"
									style={{ transform: `rotate(${page.rotation}deg)` }}
								/>
							) : (
								<div className="size-full animate-pulse rounded bg-default" />
							)}
						</div>
						<div className="flex w-full items-center justify-between gap-1">
							<span className="font-mono text-muted text-xs">
								{page.index + 1}
							</span>
							<div className="flex opacity-0 transition-opacity group-hover:opacity-100 group-data-[focus-visible]:opacity-100">
								<Button
									isIconOnly
									variant="ghost"
									size="sm"
									aria-label={t("organize.rotate")}
									onPress={() => rotate([page.id], 90)}
								>
									<RotateCw size={12} />
								</Button>
								<Button
									isIconOnly
									variant="ghost"
									size="sm"
									aria-label={t("organize.delete")}
									onPress={() => remove([page.id])}
								>
									<Trash2 size={12} />
								</Button>
							</div>
						</div>
					</GridListItem>
				)}
			</GridList>

			<div className="flex flex-wrap items-center justify-between gap-3 border-separator border-t bg-surface-secondary p-4">
				{output ? (
					<span className="min-w-0 truncate font-mono text-sm">
						{output.name} · {formatBytes(output.size)}
					</span>
				) : error ? (
					<span className="min-w-0 truncate text-danger text-sm">{error}</span>
				) : (
					<span />
				)}
				<div className="flex flex-wrap gap-2">
					{output ? (
						<a
							href={output.url}
							download={output.name}
							className={buttonVariants({
								variant: "primary",
								className: "font-semibold",
							})}
						>
							<Download size={16} />
							<FormattedMessage id="queue.download" />
						</a>
					) : (
						<>
							<Button
								variant="outline"
								className="font-semibold"
								isDisabled={selectedIds.length === 0 || loading}
								onPress={() => save(true)}
							>
								<FileOutput size={16} />
								<FormattedMessage
									id="organize.extract"
									values={{ count: selectedIds.length }}
								/>
							</Button>
							<Button
								variant="primary"
								className="font-semibold"
								isDisabled={pages.items.length === 0 || loading}
								onPress={() => save(false)}
							>
								<Download size={16} />
								<FormattedMessage id="organize.save" />
							</Button>
						</>
					)}
				</div>
			</div>
		</section>
	);
}
