import { Button } from "@heroui/react";
import {
	ChevronLeft,
	ChevronRight,
	CopyPlus,
	Download,
	Plus,
	Undo2,
	X,
} from "lucide-react";
import {
	type KeyboardEvent,
	type PointerEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { downloadBlob } from "../lib/files";
import { openPdf, type Placement, signPdf } from "../lib/pdf";
import { PDF_KIND } from "../lib/pdfKind";
import type { Signature } from "../lib/signature";
import { Dropzone } from "./Dropzone";
import { SignatureMaker } from "./SignatureMaker";

type Doc = Awaited<ReturnType<typeof openPdf>>;

type Box = Placement & { id: string };

type Drag = {
	id: string;
	mode: "move" | "resize";
	startX: number;
	startY: number;
	box: Box;
};

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

export function PdfSigner() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [file, setFile] = useState<File>();
	const [doc, setDoc] = useState<Doc>();
	const [index, setIndex] = useState(0);
	const [page, setPage] = useState<{ url: string; aspect: number }>();
	const [signature, setSignature] = useState<Signature>();
	const [boxes, setBoxes] = useState<Box[]>([]);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const surface = useRef<HTMLDivElement>(null);
	const drag = useRef<Drag>(undefined);

	useEffect(() => () => void doc?.destroy(), [doc]);

	useEffect(() => {
		if (!doc) return;
		let url: string | undefined;
		let cancelled = false;
		doc.render(index, 1100).then((rendered) => {
			url = rendered.url;
			if (cancelled) URL.revokeObjectURL(rendered.url);
			else setPage(rendered);
		});
		return () => {
			cancelled = true;
			if (url) URL.revokeObjectURL(url);
		};
	}, [doc, index]);

	const load = async ([next]: File[]) => {
		if (!next) return;
		setError(undefined);
		try {
			setDoc(await openPdf(next));
			setFile(next);
			setIndex(0);
			setBoxes([]);
		} catch (caught) {
			setError(String(caught));
		}
	};

	const newBox = (pageIndex: number, aspect: number): Box | undefined => {
		if (!signature) return undefined;
		const width = 0.28;
		// Fractions of the page, so height depends on both aspect ratios.
		const height = (width * aspect) / signature.aspect;
		return {
			id: crypto.randomUUID(),
			page: pageIndex,
			x: 0.62,
			y: clamp(0.8 - height, 0, 1 - height),
			width,
			height,
		};
	};

	const addHere = () => {
		if (!page) return;
		const box = newBox(index, page.aspect);
		if (box) setBoxes((current) => [...current, box]);
	};

	const addEverywhere = () => {
		if (!page || !doc) return;
		const added = Array.from({ length: doc.pageCount }, (_, pageIndex) =>
			newBox(pageIndex, page.aspect),
		).filter((box): box is Box => box !== undefined);
		setBoxes((current) => [...current, ...added]);
	};

	const update = (id: string, patch: Partial<Box>) =>
		setBoxes((current) =>
			current.map((box) => (box.id === id ? { ...box, ...patch } : box)),
		);

	const startDrag = (
		event: PointerEvent,
		box: Box,
		mode: "move" | "resize",
	) => {
		event.stopPropagation();
		(event.target as Element).setPointerCapture(event.pointerId);
		drag.current = {
			id: box.id,
			mode,
			startX: event.clientX,
			startY: event.clientY,
			box,
		};
	};

	const moveDrag = (event: PointerEvent) => {
		const active = drag.current;
		const rect = surface.current?.getBoundingClientRect();
		if (!active || !rect) return;
		const dx = (event.clientX - active.startX) / rect.width;
		const dy = (event.clientY - active.startY) / rect.height;
		const { box } = active;
		if (active.mode === "move") {
			update(box.id, {
				x: clamp(box.x + dx, 0, 1 - box.width),
				y: clamp(box.y + dy, 0, 1 - box.height),
			});
		} else {
			const ratio = box.height / box.width;
			const width = clamp(box.width + dx, 0.05, 1 - box.x);
			const height = width * ratio;
			if (box.y + height <= 1) update(box.id, { width, height });
		}
	};

	const nudge = (event: KeyboardEvent, box: Box) => {
		const step = event.shiftKey ? 0.05 : 0.01;
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step],
		};
		const move = moves[event.key];
		if (move) {
			event.preventDefault();
			update(box.id, {
				x: clamp(box.x + move[0], 0, 1 - box.width),
				y: clamp(box.y + move[1], 0, 1 - box.height),
			});
		} else if (event.key === "Delete" || event.key === "Backspace") {
			setBoxes((current) => current.filter((item) => item.id !== box.id));
		}
	};

	const save = async () => {
		if (!file || !signature) return;
		setBusy(true);
		setError(undefined);
		try {
			const blob = await signPdf(file, signature.blob, boxes);
			downloadBlob(blob, file.name.replace(/\.pdf$/i, "-signed.pdf"));
		} catch (caught) {
			setError(String(caught));
		} finally {
			setBusy(false);
		}
	};

	if (!file || !doc) {
		return (
			<>
				<Dropzone kind={PDF_KIND} onFiles={load} />
				{error && <p className="text-center text-danger text-sm">{error}</p>}
			</>
		);
	}

	const onPage = boxes.filter((box) => box.page === index);

	return (
		<div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
			<section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
				<div className="flex flex-wrap items-center justify-between gap-3 border-separator border-b p-3">
					<div className="flex items-center gap-1">
						<Button
							isIconOnly
							variant="ghost"
							size="sm"
							aria-label={t("sign.previous")}
							isDisabled={index === 0}
							onPress={() => setIndex(index - 1)}
						>
							<ChevronLeft size={16} />
						</Button>
						<span className="font-mono text-sm tabular-nums">
							{index + 1} / {doc.pageCount}
						</span>
						<Button
							isIconOnly
							variant="ghost"
							size="sm"
							aria-label={t("sign.next")}
							isDisabled={index === doc.pageCount - 1}
							onPress={() => setIndex(index + 1)}
						>
							<ChevronRight size={16} />
						</Button>
					</div>
					<div className="flex flex-wrap gap-1.5">
						<Button
							variant="outline"
							size="sm"
							isDisabled={!signature}
							onPress={addHere}
						>
							<Plus size={14} />
							<FormattedMessage id="sign.place" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							isDisabled={!signature || doc.pageCount < 2}
							onPress={addEverywhere}
						>
							<CopyPlus size={14} />
							<FormattedMessage id="sign.placeAll" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onPress={() => {
								setFile(undefined);
								setDoc(undefined);
								setPage(undefined);
							}}
						>
							<Undo2 size={14} />
							<FormattedMessage id="organize.another" />
						</Button>
					</div>
				</div>

				<div className="grid place-items-center bg-default/40 p-4">
					{page ? (
						<div
							ref={surface}
							className="relative w-full max-w-3xl select-none shadow-xl"
							style={{ aspectRatio: page.aspect }}
							onPointerMove={moveDrag}
							onPointerUp={() => {
								drag.current = undefined;
							}}
						>
							<img
								src={page.url}
								alt={intl.formatMessage(
									{ id: "organize.page" },
									{ n: index + 1 },
								)}
								draggable={false}
								className="absolute inset-0 size-full"
							/>
							{signature &&
								onPage.map((box) => (
									// biome-ignore lint/a11y/useSemanticElements: a draggable, focusable box has no native element
									<div
										key={box.id}
										role="button"
										tabIndex={0}
										aria-label={t("sign.placed")}
										onPointerDown={(event) => startDrag(event, box, "move")}
										onKeyDown={(event) => nudge(event, box)}
										className="group absolute cursor-move touch-none rounded-sm outline-2 outline-electric/70 outline-dashed hover:outline-electric focus-visible:outline-solid"
										style={{
											left: `${box.x * 100}%`,
											top: `${box.y * 100}%`,
											width: `${box.width * 100}%`,
											height: `${box.height * 100}%`,
										}}
									>
										<img
											src={signature.url}
											alt=""
											draggable={false}
											className="size-full"
										/>
										<button
											type="button"
											aria-label={t("organize.delete")}
											onPointerDown={(event) => event.stopPropagation()}
											onClick={() =>
												setBoxes((current) =>
													current.filter((item) => item.id !== box.id),
												)
											}
											className="absolute -top-3 -right-3 grid size-6 place-items-center rounded-full bg-danger text-white opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
										>
											<X size={12} />
										</button>
										<span
											aria-hidden="true"
											onPointerDown={(event) => startDrag(event, box, "resize")}
											className="absolute -right-1.5 -bottom-1.5 size-3.5 cursor-nwse-resize rounded-sm border-2 border-white bg-electric"
										/>
									</div>
								))}
						</div>
					) : (
						<div className="aspect-[3/4] w-full max-w-3xl animate-pulse rounded bg-default" />
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-separator border-t bg-surface-secondary p-4">
					<p className="text-muted text-xs">
						{signature ? (
							<FormattedMessage
								id="sign.summary"
								values={{ count: boxes.length }}
							/>
						) : (
							<FormattedMessage id="sign.createFirst" />
						)}
					</p>
					{error && <p className="text-danger text-sm">{error}</p>}
					<Button
						variant="primary"
						className="font-semibold"
						isDisabled={boxes.length === 0 || busy}
						onPress={save}
					>
						<Download size={16} />
						<FormattedMessage id="sign.save" />
					</Button>
				</div>
			</section>

			<div className="flex flex-col gap-4">
				<SignatureMaker
					onCreate={(next) => {
						if (signature) URL.revokeObjectURL(signature.url);
						setSignature(next);
						setBoxes([]);
					}}
				/>
				{signature && (
					<section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
						<p className="eyebrow text-muted">
							<FormattedMessage id="sign.current" />
						</p>
						<div className="grid h-24 place-items-center rounded-lg bg-white p-3">
							<img
								src={signature.url}
								alt={t("sign.current")}
								className="max-h-full max-w-full"
							/>
						</div>
						<p className="text-muted text-xs">
							<FormattedMessage id="sign.moveHint" />
						</p>
					</section>
				)}
			</div>
		</div>
	);
}
