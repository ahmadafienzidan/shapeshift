import { Button, Input, Label, TextField, ToggleButton } from "@heroui/react";
import "@fontsource/dancing-script/700.css";
import { Eraser, ImagePlus, PenLine, Type, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FileTrigger } from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import SignaturePad from "signature_pad";
import { ACCEPTED_IMAGES } from "../lib/image";
import {
	type Signature,
	signatureFromCanvas,
	signatureFromImage,
	signatureFromText,
} from "../lib/signature";
import { ModeTabs } from "./ModeTabs";

type Mode = "draw" | "type" | "upload";

const MODES = [
	{ id: "draw", icon: PenLine, labelId: "sign.mode.draw" },
	{ id: "type", icon: Type, labelId: "sign.mode.type" },
	{ id: "upload", icon: Upload, labelId: "sign.mode.upload" },
] satisfies { id: Mode; icon: typeof PenLine; labelId: string }[];

type Drawing = { pad: SignaturePad; canvas: HTMLCanvasElement };

const INKS = [
	{ id: "black", color: "#111827" },
	{ id: "blue", color: "#1e40af" },
];

function DrawPad({
	color,
	onReady,
}: {
	color: string;
	onReady: (drawing: Drawing | undefined) => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const padRef = useRef<SignaturePad>(undefined);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		// Draw at device resolution so strokes stay sharp on high-DPI screens.
		const ratio = Math.max(window.devicePixelRatio, 1);
		canvas.width = canvas.offsetWidth * ratio;
		canvas.height = canvas.offsetHeight * ratio;
		canvas.getContext("2d")?.scale(ratio, ratio);
		const pad = new SignaturePad(canvas, { minWidth: 0.8, maxWidth: 2.8 });
		padRef.current = pad;
		onReady({ pad, canvas });
		return () => {
			pad.off();
			onReady(undefined);
		};
	}, [onReady]);

	useEffect(() => {
		if (padRef.current) padRef.current.penColor = color;
	}, [color]);

	return (
		<canvas
			ref={canvasRef}
			className="h-48 w-full touch-none rounded-lg border border-border border-dashed bg-white"
		/>
	);
}

export function SignatureMaker({
	onCreate,
}: {
	onCreate: (signature: Signature) => void;
}) {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [mode, setMode] = useState<Mode>("draw");
	const [ink, setInk] = useState("#111827");
	const [drawing, setDrawing] = useState<Drawing>();
	const [name, setName] = useState("");
	const [image, setImage] = useState<File>();
	const [removeWhite, setRemoveWhite] = useState(true);
	const [error, setError] = useState<string>();

	const create = async () => {
		setError(undefined);
		try {
			if (mode === "draw") {
				if (!drawing || drawing.pad.isEmpty()) {
					throw new Error("sign.error.empty");
				}
				onCreate(await signatureFromCanvas(drawing.canvas));
			} else if (mode === "type") {
				if (!name.trim()) throw new Error("sign.error.empty");
				onCreate(await signatureFromText(name.trim(), ink));
			} else {
				if (!image) throw new Error("sign.error.empty");
				onCreate(await signatureFromImage(image, removeWhite));
			}
		} catch (caught) {
			const message = (caught as Error).message;
			setError(message.startsWith("sign.") ? t(message) : message);
		}
	};

	return (
		<section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
			<p className="eyebrow text-muted">
				<FormattedMessage id="sign.create" />
			</p>
			<ModeTabs
				label={t("sign.create")}
				value={mode}
				onChange={setMode}
				modes={MODES}
			/>

			{mode !== "upload" && (
				<div className="flex items-center gap-2">
					<span className="text-muted text-sm">
						<FormattedMessage id="sign.ink" />
					</span>
					{INKS.map((option) => (
						<button
							key={option.id}
							type="button"
							aria-label={t(`sign.ink.${option.id}`)}
							aria-pressed={ink === option.color}
							onClick={() => setInk(option.color)}
							className={`size-7 rounded-full border-2 ${ink === option.color ? "border-electric" : "border-transparent"}`}
							style={{ background: option.color }}
						/>
					))}
				</div>
			)}

			{mode === "draw" && (
				<div className="flex flex-col gap-2">
					<DrawPad color={ink} onReady={setDrawing} />
					<div className="flex items-center justify-between">
						<p className="text-muted text-xs">
							<FormattedMessage id="sign.drawHint" />
						</p>
						<Button
							variant="ghost"
							size="sm"
							onPress={() => drawing?.pad.clear()}
						>
							<Eraser size={14} />
							<FormattedMessage id="data.clear" />
						</Button>
					</div>
				</div>
			)}

			{mode === "type" && (
				<div className="flex flex-col gap-3">
					<TextField value={name} onChange={setName}>
						<Label>
							<FormattedMessage id="sign.name" />
						</Label>
						<Input placeholder="Ayu Lestari" />
					</TextField>
					<div
						className="grid h-28 place-items-center overflow-hidden rounded-lg border border-border border-dashed bg-white px-4 text-5xl"
						style={{
							fontFamily: '"Dancing Script"',
							fontWeight: 700,
							color: ink,
						}}
					>
						{name || "Ayu Lestari"}
					</div>
				</div>
			)}

			{mode === "upload" && (
				<div className="flex flex-col gap-3">
					<FileTrigger
						acceptedFileTypes={ACCEPTED_IMAGES}
						onSelect={(list) => setImage(list?.[0] ?? undefined)}
					>
						<Button variant="outline" className="font-semibold">
							<ImagePlus size={16} />
							{image ? image.name : <FormattedMessage id="sign.chooseImage" />}
						</Button>
					</FileTrigger>
					<ToggleButton isSelected={removeWhite} onChange={setRemoveWhite}>
						<FormattedMessage id="sign.removeWhite" />
					</ToggleButton>
					<p className="text-muted text-xs">
						<FormattedMessage id="sign.uploadHint" />
					</p>
				</div>
			)}

			{error && <p className="text-danger text-sm">{error}</p>}
			<Button variant="primary" className="font-semibold" onPress={create}>
				<FormattedMessage id="sign.use" />
			</Button>
		</section>
	);
}
