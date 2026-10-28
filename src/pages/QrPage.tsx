import { Button, Input, Label, TextField } from "@heroui/react";
import { Download, type LucideIcon, QrCode, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { Dropzone } from "../components/Dropzone";
import { KeepAlive } from "../components/KeepAlive";
import { ModeTabs } from "../components/ModeTabs";
import { ColorInput, FormatPicker } from "../components/Options";
import { Thumbnail } from "../components/Thumbnail";
import { ToolPage } from "../components/ToolPage";
import { downloadBlob } from "../lib/files";
import { IMAGE_KIND } from "../lib/image";
import {
	type QrOptions,
	qrPng,
	qrSvg,
	scanQr,
	type WifiSecurity,
	wifiPayload,
} from "../lib/qr";
import { QR_TOOL } from "../tools";

type Mode = "generate" | "scan";

const MODES = [
	{ id: "generate", icon: QrCode, labelId: "qr.mode.generate" },
	{ id: "scan", icon: ScanLine, labelId: "qr.mode.scan" },
] satisfies { id: Mode; icon: LucideIcon; labelId: string }[];

type Content = "text" | "wifi";

type Scan = {
	id: string;
	file: File;
	status: "scanning" | "found" | "empty" | "error";
	text?: string;
};

function Generator({
	options,
	content,
}: {
	options: QrOptions;
	content: Content;
}) {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [text, setText] = useState("https://example.com");
	const [ssid, setSsid] = useState("");
	const [password, setPassword] = useState("");
	const [security, setSecurity] = useState<WifiSecurity>("WPA");
	const [svg, setSvg] = useState("");

	const payload =
		content === "wifi"
			? ssid
				? wifiPayload(ssid, password, security)
				: ""
			: text;

	useEffect(() => {
		if (!payload) {
			setSvg("");
			return;
		}
		let cancelled = false;
		qrSvg(payload, options).then((result) => {
			if (!cancelled) setSvg(result);
		});
		return () => {
			cancelled = true;
		};
	}, [payload, options]);

	return (
		<div className="grid gap-4 lg:grid-cols-[1fr_auto]">
			<section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
				<p className="eyebrow text-muted">
					<FormattedMessage id="qr.content" />
				</p>
				{content === "text" ? (
					<textarea
						value={text}
						onChange={(event) => setText(event.target.value)}
						placeholder={t("qr.placeholder")}
						aria-label={t("qr.content")}
						className="min-h-40 w-full resize-y rounded border border-border bg-field p-3 font-mono text-sm outline-none focus:border-electric"
					/>
				) : (
					<div className="flex flex-col gap-4">
						<TextField value={ssid} onChange={setSsid}>
							<Label>
								<FormattedMessage id="qr.wifi.ssid" />
							</Label>
							<Input />
						</TextField>
						<FormatPicker
							labelId="qr.wifi.security"
							value={security}
							onChange={setSecurity}
							options={[
								{ id: "WPA", label: "WPA/WPA2/WPA3" },
								{ id: "WEP", label: "WEP" },
								{ id: "nopass", label: t("qr.wifi.open") },
							]}
						/>
						{security !== "nopass" && (
							<TextField value={password} onChange={setPassword}>
								<Label>
									<FormattedMessage id="qr.wifi.password" />
								</Label>
								<Input />
							</TextField>
						)}
					</div>
				)}
				<p className="font-mono text-muted text-xs">
					<FormattedMessage
						id="qr.length"
						values={{ count: new TextEncoder().encode(payload).length }}
					/>
				</p>
			</section>

			<section className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-5">
				<div className="grid size-64 place-items-center overflow-hidden rounded bg-default">
					{svg ? (
						<img
							src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
							alt={t("qr.previewAlt")}
							className="size-full"
						/>
					) : (
						<QrCode size={48} className="text-muted/40" />
					)}
				</div>
				<div className="flex gap-2">
					<Button
						variant="primary"
						className="font-semibold"
						isDisabled={!svg}
						onPress={async () =>
							downloadBlob(await qrPng(payload, options), "shapeshift-qr.png")
						}
					>
						<Download size={16} />
						PNG
					</Button>
					<Button
						variant="outline"
						className="font-semibold"
						isDisabled={!svg}
						onPress={() =>
							downloadBlob(
								new Blob([svg], { type: "image/svg+xml" }),
								"shapeshift-qr.svg",
							)
						}
					>
						<Download size={16} />
						SVG
					</Button>
				</div>
			</section>
		</div>
	);
}

function Scanner() {
	const [scans, setScans] = useState<Scan[]>([]);
	const queue = useRef(Promise.resolve());

	const update = (id: string, patch: Partial<Scan>) =>
		setScans((current) =>
			current.map((scan) => (scan.id === id ? { ...scan, ...patch } : scan)),
		);

	const add = (files: File[]) => {
		const added: Scan[] = files.map((file) => ({
			id: crypto.randomUUID(),
			file,
			status: "scanning",
		}));
		setScans((current) => [...added, ...current]);
		for (const scan of added) {
			queue.current = queue.current.then(async () => {
				try {
					const text = await scanQr(scan.file);
					update(
						scan.id,
						text ? { status: "found", text } : { status: "empty" },
					);
				} catch (error) {
					update(scan.id, { status: "error", text: String(error) });
				}
			});
		}
	};

	return (
		<>
			<Dropzone kind={IMAGE_KIND} onFiles={add} />
			{scans.length > 0 && (
				<ul className="flex flex-col divide-y divide-separator overflow-hidden rounded-xl border border-border bg-surface">
					{scans.map((scan) => (
						<li key={scan.id} className="flex items-start gap-4 px-5 py-4">
							<Thumbnail file={scan.file} />
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<p className="truncate text-muted text-xs">{scan.file.name}</p>
								{scan.status === "scanning" && (
									<p className="animate-pulse text-muted text-sm">
										<FormattedMessage id="qr.scanning" />
									</p>
								)}
								{scan.status === "empty" && (
									<p className="text-sm text-warning">
										<FormattedMessage id="qr.notFound" />
									</p>
								)}
								{scan.status === "error" && (
									<p className="text-danger text-sm">{scan.text}</p>
								)}
								{scan.status === "found" && scan.text && (
									<p className="break-all font-mono text-sm">
										{/^https?:\/\//.test(scan.text) ? (
											<a
												href={scan.text}
												target="_blank"
												rel="noreferrer noopener"
												className="text-accent-soft-foreground underline underline-offset-2"
											>
												{scan.text}
											</a>
										) : (
											scan.text
										)}
									</p>
								)}
							</div>
							{scan.status === "found" && scan.text && (
								<CopyButton text={scan.text} />
							)}
						</li>
					))}
				</ul>
			)}
		</>
	);
}

export function QrPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [mode, setMode] = useState<Mode>("generate");
	const [content, setContent] = useState<Content>("text");
	const [foreground, setForeground] = useState("#001e2b");
	const [background, setBackground] = useState("#ffffff");
	const [errorCorrection, setErrorCorrection] =
		useState<QrOptions["errorCorrection"]>("M");
	const [size, setSize] = useState("1024");

	const toolbar = (
		<ModeTabs
			label={t("tool.qr.name")}
			value={mode}
			onChange={setMode}
			modes={MODES}
		/>
	);

	const renderMode = (mode: Mode) => {
		if (mode === "scan") {
			return (
				<ToolPage tool={QR_TOOL} toolbar={toolbar}>
					<Scanner />
				</ToolPage>
			);
		}

		return (
			<ToolPage
				tool={QR_TOOL}
				toolbar={toolbar}
				options={
					<>
						<FormatPicker
							labelId="qr.type"
							value={content}
							onChange={setContent}
							options={[
								{ id: "text", label: t("qr.type.text") },
								{ id: "wifi", label: "Wi-Fi" },
							]}
						/>
						<FormatPicker
							labelId="qr.errorCorrection"
							value={errorCorrection}
							onChange={setErrorCorrection}
							options={[
								{ id: "L", label: "L" },
								{ id: "M", label: "M" },
								{ id: "Q", label: "Q" },
								{ id: "H", label: "H" },
							]}
						/>
						<FormatPicker
							labelId="qr.size"
							value={size}
							onChange={setSize}
							options={[
								{ id: "512", label: "512" },
								{ id: "1024", label: "1024" },
								{ id: "2048", label: "2048" },
							]}
						/>
						<ColorInput
							labelId="qr.foreground"
							value={foreground}
							onChange={setForeground}
						/>
						<ColorInput
							labelId="qr.background"
							value={background}
							onChange={setBackground}
						/>
					</>
				}
			>
				<Generator
					content={content}
					options={{
						foreground,
						background,
						errorCorrection,
						size: Number(size),
					}}
				/>
			</ToolPage>
		);
	};

	return <KeepAlive active={mode} render={renderMode} />;
}
