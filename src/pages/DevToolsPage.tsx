import { Button, Chip, ToggleButton } from "@heroui/react";
import {
	Clock,
	Fingerprint,
	KeyRound,
	Link2,
	type LucideIcon,
	RefreshCw,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyButton } from "../components/CopyButton";
import { EDITOR_CLASS, EditorPanel } from "../components/EditorPanel";
import { JsonCode } from "../components/JsonView";
import { KeepAlive } from "../components/KeepAlive";
import { ModeTabs } from "../components/ModeTabs";
import { FormatPicker } from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import {
	decodeJwt,
	JWT_TIME_CLAIMS,
	parseTimestamp,
	parseUrl,
	relativeTime,
	uuidV7,
} from "../lib/devtools";
import { DEVTOOLS_TOOL } from "../tools";

type Mode = "url" | "jwt" | "uuid" | "timestamp";

const MODES = [
	{ id: "url", icon: Link2, labelId: "devtools.mode.url" },
	{ id: "jwt", icon: KeyRound, labelId: "devtools.mode.jwt" },
	{ id: "uuid", icon: Fingerprint, labelId: "devtools.mode.uuid" },
	{ id: "timestamp", icon: Clock, labelId: "devtools.mode.timestamp" },
] satisfies { id: Mode; icon: LucideIcon; labelId: string }[];

function ValueTable({ rows }: { rows: [ReactNode, string][] }) {
	return (
		<ul className="flex flex-col divide-y divide-separator overflow-hidden rounded-xl border border-border bg-surface">
			{rows.map(([label, value], index) => (
				<li
					// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
					key={index}
					className="flex items-center gap-4 px-5 py-2.5"
				>
					<span className="eyebrow w-32 shrink-0 text-[0.6875rem] text-muted">
						{label}
					</span>
					<code className="min-w-0 flex-1 break-all font-mono text-sm">
						{value || "—"}
					</code>
					{value && <CopyButton text={value} />}
				</li>
			))}
		</ul>
	);
}

function UrlMode({
	direction,
	scope,
}: {
	direction: "encode" | "decode";
	scope: "component" | "full";
}) {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (input === "") return { output: "" };
		try {
			const transform =
				direction === "encode"
					? scope === "component"
						? encodeURIComponent
						: encodeURI
					: scope === "component"
						? decodeURIComponent
						: decodeURI;
			return { output: transform(input) };
		} catch {
			return { output: "", error: "devtools.url.error" };
		}
	}, [input, direction, scope]);

	const url = parseUrl(direction === "decode" ? result.output || input : input);

	return (
		<>
			<div className="grid gap-4 2xl:grid-cols-2">
				<EditorPanel label={t("data.inputLabel")} actions={null}>
					<textarea
						value={input}
						onChange={(event) => setInput(event.target.value)}
						spellCheck={false}
						aria-label={t("data.inputLabel")}
						placeholder="https://example.com/search?q=kopi susu&city=Bandung"
						className={`${EDITOR_CLASS} min-h-40`}
					/>
				</EditorPanel>
				<EditorPanel
					label={t("data.outputLabel")}
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
							className={`${EDITOR_CLASS} min-h-40`}
						/>
					)}
				</EditorPanel>
			</div>
			{url && (
				<section className="flex flex-col gap-3">
					<p className="eyebrow text-muted">
						<FormattedMessage id="devtools.url.parts" />
					</p>
					<ValueTable
						rows={[
							["Protocol", url.protocol],
							["Host", url.host],
							["Path", decodeURI(url.pathname)],
							["Hash", url.hash],
							...[...url.searchParams].map(
								([key, value]): [ReactNode, string] => [`?${key}`, value],
							),
						]}
					/>
				</section>
			)}
		</>
	);
}

function JwtMode() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [input, setInput] = useState("");

	const decoded = useMemo(() => {
		if (input.trim() === "") return undefined;
		try {
			return { parts: decodeJwt(input) };
		} catch (error) {
			const message = (error as Error).message;
			return {
				error: message.startsWith("jwt.") ? message : "jwt.error.decode",
			};
		}
	}, [input]);

	const payload = decoded?.parts?.payload;
	const now = Date.now() / 1000;
	const exp = typeof payload?.exp === "number" ? payload.exp : undefined;
	const nbf = typeof payload?.nbf === "number" ? payload.nbf : undefined;
	const status =
		exp !== undefined && exp < now
			? "expired"
			: nbf !== undefined && nbf > now
				? "notYet"
				: exp !== undefined
					? "valid"
					: undefined;

	return (
		<>
			<EditorPanel
				label={t("jwt.token")}
				actions={
					status && (
						<Chip
							size="sm"
							variant="soft"
							color={status === "valid" ? "success" : "danger"}
						>
							<FormattedMessage id={`jwt.status.${status}`} />
						</Chip>
					)
				}
			>
				<textarea
					value={input}
					onChange={(event) => setInput(event.target.value)}
					spellCheck={false}
					aria-label={t("jwt.token")}
					placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
					className={`${EDITOR_CLASS} min-h-32`}
				/>
			</EditorPanel>

			{decoded?.error && (
				<p className="rounded-xl border border-danger/40 bg-danger-soft p-4 text-danger-soft-foreground text-sm">
					{t(decoded.error)}
				</p>
			)}

			{decoded?.parts && (
				<>
					<div className="grid gap-4 xl:grid-cols-2">
						<EditorPanel
							label="Header"
							actions={
								<CopyButton
									text={JSON.stringify(decoded.parts.header, null, 2)}
								/>
							}
						>
							<JsonCode json={JSON.stringify(decoded.parts.header, null, 2)} />
						</EditorPanel>
						<EditorPanel
							label="Payload"
							actions={
								<CopyButton
									text={JSON.stringify(decoded.parts.payload, null, 2)}
								/>
							}
						>
							<JsonCode json={JSON.stringify(decoded.parts.payload, null, 2)} />
						</EditorPanel>
					</div>
					{JWT_TIME_CLAIMS.some(
						(claim) => typeof payload?.[claim] === "number",
					) && (
						<ValueTable
							rows={JWT_TIME_CLAIMS.flatMap((claim): [ReactNode, string][] => {
								const value = payload?.[claim];
								if (typeof value !== "number") return [];
								const date = new Date(value * 1000);
								return [
									[
										claim,
										`${date.toLocaleString(intl.locale)} (${relativeTime(date, intl.locale)})`,
									],
								];
							})}
						/>
					)}
					<p className="text-muted text-xs">
						<FormattedMessage id="jwt.signatureNote" />
					</p>
				</>
			)}
		</>
	);
}

function UuidMode({
	version,
	count,
	uppercase,
}: {
	version: "v4" | "v7";
	count: number;
	uppercase: boolean;
}) {
	const generate = () =>
		Array.from({ length: count }, () =>
			version === "v4" ? crypto.randomUUID() : uuidV7(),
		);
	const [ids, setIds] = useState(generate);

	const shown = ids.map((id) => (uppercase ? id.toUpperCase() : id));

	return (
		<section className="overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex flex-wrap items-center justify-between gap-3 border-separator border-b p-4">
				<p className="eyebrow text-muted">
					UUID {version} · {count}
				</p>
				<div className="flex gap-2">
					<CopyButton text={shown.join("\n")} variant="outline" />
					<Button
						variant="primary"
						size="sm"
						className="font-semibold"
						onPress={() => setIds(generate())}
					>
						<RefreshCw size={14} />
						<FormattedMessage id="uuid.generate" />
					</Button>
				</div>
			</div>
			<ul className="flex max-h-[32rem] flex-col divide-y divide-separator overflow-y-auto">
				{shown.map((id) => (
					<li
						key={id}
						className="flex items-center justify-between gap-3 px-4 py-2"
					>
						<code className="font-mono text-sm">{id}</code>
						<CopyButton text={id} />
					</li>
				))}
			</ul>
		</section>
	);
}

function TimestampMode() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [input, setInput] = useState(() =>
		String(Math.floor(Date.now() / 1000)),
	);
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);

	const date = parseTimestamp(input);

	return (
		<>
			<div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4">
				<span className="eyebrow text-muted">
					<FormattedMessage id="timestamp.now" />
				</span>
				<code className="font-mono text-2xl tabular-nums">
					{Math.floor(now / 1000)}
				</code>
				<Button
					variant="outline"
					size="sm"
					className="ml-auto font-semibold"
					onPress={() => setInput(String(Math.floor(Date.now() / 1000)))}
				>
					<FormattedMessage id="timestamp.useNow" />
				</Button>
			</div>
			<EditorPanel label={t("timestamp.input")} actions={null}>
				<input
					value={input}
					onChange={(event) => setInput(event.target.value)}
					spellCheck={false}
					aria-label={t("timestamp.input")}
					placeholder="1760000000, 1760000000000, 2026-10-11T12:00:00Z"
					className="w-full bg-transparent p-4 font-mono text-lg outline-none"
				/>
			</EditorPanel>
			{input.trim() !== "" && !date && (
				<p className="rounded-xl border border-danger/40 bg-danger-soft p-4 text-danger-soft-foreground text-sm">
					<FormattedMessage id="timestamp.invalid" />
				</p>
			)}
			{date && (
				<ValueTable
					rows={[
						[t("timestamp.seconds"), String(Math.floor(date.getTime() / 1000))],
						[t("timestamp.milliseconds"), String(date.getTime())],
						["ISO 8601 (UTC)", date.toISOString()],
						[
							t("timestamp.local"),
							date.toLocaleString(intl.locale, {
								dateStyle: "full",
								timeStyle: "long",
							}),
						],
						[t("timestamp.relative"), relativeTime(date, intl.locale, now)],
					]}
				/>
			)}
		</>
	);
}

export function DevToolsPage() {
	const intl = useIntl();
	const t = (id: string) => intl.formatMessage({ id });
	const [mode, setMode] = useState<Mode>("url");
	const [direction, setDirection] = useState<"encode" | "decode">("encode");
	const [scope, setScope] = useState<"component" | "full">("component");
	const [version, setVersion] = useState<"v4" | "v7">("v4");
	const [count, setCount] = useState("5");
	const [uppercase, setUppercase] = useState(false);

	const toolbar = (
		<ModeTabs
			label={t("tool.devtools.name")}
			value={mode}
			onChange={setMode}
			modes={MODES}
		/>
	);

	const renderMode = (mode: Mode) => {
		if (mode === "url") {
			return (
				<ToolPage
					tool={DEVTOOLS_TOOL}
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
							<FormatPicker
								labelId="devtools.url.scope"
								value={scope}
								onChange={setScope}
								options={[
									{ id: "component", label: t("devtools.url.component") },
									{ id: "full", label: t("devtools.url.full") },
								]}
							/>
							<p className="text-muted text-xs">
								<FormattedMessage id={`devtools.url.hint.${scope}`} />
							</p>
						</>
					}
				>
					<UrlMode direction={direction} scope={scope} />
				</ToolPage>
			);
		}

		if (mode === "uuid") {
			return (
				<ToolPage
					tool={DEVTOOLS_TOOL}
					toolbar={toolbar}
					options={
						<>
							<FormatPicker
								labelId="uuid.version"
								value={version}
								onChange={setVersion}
								options={[
									{ id: "v4", label: t("uuid.v4") },
									{ id: "v7", label: t("uuid.v7") },
								]}
							/>
							<FormatPicker
								labelId="uuid.count"
								value={count}
								onChange={setCount}
								options={["1", "5", "10", "50"].map((id) => ({
									id,
									label: id,
								}))}
							/>
							<ToggleButton isSelected={uppercase} onChange={setUppercase}>
								<FormattedMessage id="uuid.uppercase" />
							</ToggleButton>
							<p className="text-muted text-xs">
								<FormattedMessage id={`uuid.hint.${version}`} />
							</p>
						</>
					}
				>
					<UuidMode
						key={`${version}-${count}`}
						version={version}
						count={Number(count)}
						uppercase={uppercase}
					/>
				</ToolPage>
			);
		}

		return (
			<ToolPage tool={DEVTOOLS_TOOL} toolbar={toolbar}>
				{mode === "jwt" ? <JwtMode /> : <TimestampMode />}
			</ToolPage>
		);
	};

	return <KeepAlive active={mode} render={renderMode} />;
}
