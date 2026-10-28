import { Button, Input, Label, TextField } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
	ArrowLeftRight,
	Download,
	FileCode2,
	FileDown,
	type LucideIcon,
	Type,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { Dropzone } from "../components/Dropzone";
import { EDITOR_CLASS, EditorPanel } from "../components/EditorPanel";
import { KeepAlive } from "../components/KeepAlive";
import { ModeTabs } from "../components/ModeTabs";
import { FormatPicker } from "../components/Options";
import { Thumbnail } from "../components/Thumbnail";
import { ToolPage } from "../components/ToolPage";
import {
	decodeText,
	encodeText,
	extensionFor,
	fileToBase64,
	parseBase64Input,
} from "../lib/base64";
import { downloadBlob, formatBytes } from "../lib/files";
import { BASE64_TOOL } from "../tools";

type Mode = "text" | "encode-file" | "decode-file";

const MODES = [
	{ id: "text", icon: Type, labelId: "base64.mode.text" },
	{ id: "encode-file", icon: FileCode2, labelId: "base64.mode.encode-file" },
	{ id: "decode-file", icon: FileDown, labelId: "base64.mode.decode-file" },
] satisfies { id: Mode; icon: LucideIcon; labelId: string }[];

function TextMode({
	direction,
	urlSafe,
}: {
	direction: "encode" | "decode";
	urlSafe: boolean;
}) {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (input === "") return { output: "" };
		try {
			return {
				output:
					direction === "encode"
						? encodeText(input, urlSafe)
						: decodeText(input),
			};
		} catch {
			return { output: "", error: `base64.error.${direction}` };
		}
	}, [input, direction, urlSafe]);

	return (
		<div className="grid gap-4 2xl:grid-cols-2">
			<EditorPanel
				label={t(direction === "encode" ? "base64.plainText" : "base64.base64")}
				actions={null}
			>
				<textarea
					value={input}
					onChange={(event) => setInput(event.target.value)}
					spellCheck={false}
					aria-label={t("data.inputLabel")}
					placeholder={t(`base64.placeholder.${direction}`)}
					className={`${EDITOR_CLASS} min-h-[26rem]`}
				/>
			</EditorPanel>
			<EditorPanel
				label={t(direction === "encode" ? "base64.base64" : "base64.plainText")}
				actions={<CopyButton text={result.output} />}
			>
				{result.error ? (
					<div className="m-4 rounded border border-danger/40 bg-danger-soft p-4 text-danger-soft-foreground text-sm">
						{t(result.error)}
					</div>
				) : (
					<textarea
						value={result.output}
						readOnly
						spellCheck={false}
						aria-label={t("data.outputLabel")}
						placeholder={t("data.outputPlaceholder")}
						className={`${EDITOR_CLASS} min-h-[26rem]`}
					/>
				)}
			</EditorPanel>
		</div>
	);
}

type Encoded = { id: string; file: File; text?: string; error?: string };

const ANY_FILE = {
	accept: [],
	matches: () => true,
	formats: "",
};

function EncodeFileMode({ asDataUri }: { asDataUri: boolean }) {
	const intl = useIntl();
	const [items, setItems] = useState<Encoded[]>([]);
	const queue = useRef(Promise.resolve());

	const add = (files: File[]) => {
		const added = files.map((file) => ({ id: crypto.randomUUID(), file }));
		setItems((current) => [...added, ...current]);
		for (const item of added) {
			queue.current = queue.current.then(async () => {
				try {
					const text = await fileToBase64(item.file, asDataUri);
					setItems((current) =>
						current.map((entry) =>
							entry.id === item.id ? { ...entry, text } : entry,
						),
					);
				} catch (error) {
					setItems((current) =>
						current.map((entry) =>
							entry.id === item.id ? { ...entry, error: String(error) } : entry,
						),
					);
				}
			});
		}
	};

	return (
		<>
			<Dropzone
				kind={{
					...ANY_FILE,
					formats: intl.formatMessage({ id: "base64.anyFile" }),
				}}
				onFiles={add}
			/>
			{items.length > 0 && (
				<ul className="flex flex-col divide-y divide-separator overflow-hidden rounded-xl border border-border bg-surface">
					{items.map((item) => (
						<li key={item.id} className="flex items-center gap-4 px-5 py-3">
							<Thumbnail file={item.file} />
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<p className="truncate font-medium text-sm">{item.file.name}</p>
								{item.error ? (
									<p className="truncate text-danger text-xs">{item.error}</p>
								) : item.text ? (
									<>
										<span className="font-mono text-muted text-xs">
											{formatBytes(item.file.size)} →{" "}
											<FormattedMessage
												id="base64.characters"
												values={{ count: item.text.length }}
											/>
										</span>
										<code className="truncate font-mono text-[0.6875rem] text-muted/70">
											{item.text.slice(0, 120)}
										</code>
									</>
								) : (
									<span className="animate-pulse text-muted text-xs">…</span>
								)}
							</div>
							{item.text && (
								<div className="flex gap-1">
									<CopyButton text={item.text} />
									<Button
										isIconOnly
										variant="outline"
										size="sm"
										aria-label={intl.formatMessage({ id: "queue.download" })}
										onPress={() =>
											downloadBlob(
												new Blob([item.text ?? ""], { type: "text/plain" }),
												`${item.file.name}.base64.txt`,
											)
										}
									>
										<Download size={14} />
									</Button>
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</>
	);
}

function DecodeFileMode() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [input, setInput] = useState("");
	const [name, setName] = useState("decoded");

	const decoded = useMemo(() => {
		if (input.trim() === "") return undefined;
		try {
			const { mime, bytes } = parseBase64Input(input);
			const type = mime ?? "application/octet-stream";
			return {
				type,
				blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type }),
				extension: mime ? extensionFor(mime) : "bin",
			};
		} catch {
			return { error: "base64.error.file" };
		}
	}, [input]);

	const [url, setUrl] = useState<string>();
	useEffect(() => {
		if (!decoded?.blob) {
			setUrl(undefined);
			return;
		}
		const objectUrl = URL.createObjectURL(decoded.blob);
		setUrl(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [decoded]);

	const filename = decoded?.extension ? `${name}.${decoded.extension}` : name;

	return (
		<div className="grid gap-4 2xl:grid-cols-2">
			<EditorPanel label={t("base64.base64")} actions={null}>
				<textarea
					value={input}
					onChange={(event) => setInput(event.target.value)}
					spellCheck={false}
					aria-label={t("data.inputLabel")}
					placeholder={t("base64.placeholder.file")}
					className={`${EDITOR_CLASS} min-h-[26rem]`}
				/>
			</EditorPanel>
			<EditorPanel label={t("base64.result")} actions={null}>
				<div className="flex flex-1 flex-col gap-5 p-5">
					{decoded?.error && (
						<div className="rounded border border-danger/40 bg-danger-soft p-4 text-danger-soft-foreground text-sm">
							{t(decoded.error)}
						</div>
					)}
					{decoded?.blob && url && (
						<>
							{decoded.type.startsWith("image/") && (
								<img
									src={url}
									alt=""
									className="max-h-64 self-start rounded border border-border object-contain"
								/>
							)}
							<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-sm">
								<dt className="text-muted">
									<FormattedMessage id="base64.type" />
								</dt>
								<dd>{decoded.type}</dd>
								<dt className="text-muted">
									<FormattedMessage id="base64.size" />
								</dt>
								<dd>{formatBytes(decoded.blob.size)}</dd>
							</dl>
							<TextField value={name} onChange={setName}>
								<Label>
									<FormattedMessage id="base64.filename" />
								</Label>
								<Input />
							</TextField>
							<a
								href={url}
								download={filename}
								className={buttonVariants({
									variant: "primary",
									className: "self-start font-semibold",
								})}
							>
								<Download size={16} />
								{filename}
							</a>
						</>
					)}
					{!decoded && (
						<p className="text-muted text-sm">
							<FormattedMessage id="base64.decodeHint" />
						</p>
					)}
				</div>
			</EditorPanel>
		</div>
	);
}

export function Base64Page() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [mode, setMode] = useState<Mode>("text");
	const [direction, setDirection] = useState<"encode" | "decode">("encode");
	const [variant, setVariant] = useState<"standard" | "url">("standard");
	const [output, setOutput] = useState<"data-uri" | "raw">("data-uri");

	const toolbar = (
		<ModeTabs
			label={t("tool.base64.name")}
			value={mode}
			onChange={setMode}
			modes={MODES}
		/>
	);

	const renderMode = (mode: Mode) => {
		if (mode === "text") {
			return (
				<ToolPage
					tool={BASE64_TOOL}
					toolbar={toolbar}
					options={
						<>
							<FormatPicker
								labelId="base64.direction"
								value={direction}
								onChange={setDirection}
								options={[
									{ id: "encode", label: t("base64.encode") },
									{ id: "decode", label: t("base64.decode") },
								]}
							/>
							{direction === "encode" && (
								<FormatPicker
									labelId="base64.variant"
									value={variant}
									onChange={setVariant}
									options={[
										{ id: "standard", label: t("base64.variant.standard") },
										{ id: "url", label: t("base64.variant.url") },
									]}
								/>
							)}
							<p className="flex items-center gap-2 text-muted text-xs">
								<ArrowLeftRight size={14} />
								<FormattedMessage id="base64.utf8" />
							</p>
						</>
					}
				>
					<TextMode direction={direction} urlSafe={variant === "url"} />
				</ToolPage>
			);
		}

		if (mode === "encode-file") {
			return (
				<ToolPage
					tool={BASE64_TOOL}
					toolbar={toolbar}
					optionsHint="options.appliesToNew"
					options={
						<FormatPicker
							labelId="base64.output"
							value={output}
							onChange={setOutput}
							options={[
								{ id: "data-uri", label: "Data URI" },
								{ id: "raw", label: t("base64.output.raw") },
							]}
						/>
					}
				>
					<EncodeFileMode asDataUri={output === "data-uri"} />
				</ToolPage>
			);
		}

		return (
			<ToolPage tool={BASE64_TOOL} toolbar={toolbar}>
				<DecodeFileMode />
			</ToolPage>
		);
	};

	return <KeepAlive active={mode} render={renderMode} />;
}
