import { buttonVariants } from "@heroui/styles";
import { ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router";
import { Eyebrow } from "../components/Eyebrow";
import { Reveal } from "../components/Reveal";
import { useLocalePath } from "../i18n/locale";
import { useCycle } from "../lib/motion";
import {
	COMPRESS_TOOL,
	CONVERT_TOOL,
	TOOL_GROUPS,
	TOOLS,
	type Tool,
} from "../tools";

const FORMATS = [
	"HEIC",
	"WEBP",
	"AVIF",
	"PNG",
	"JPG",
	"SVG",
	"ICO",
	"PDF",
	"JSON",
	"CSV",
	"YAML",
	"QR",
];

const CONVERSIONS = [
	["HEIC → JPG", "4.2 MB → 640 KB"],
	["PDF → PNG", "12 pages · 300 DPI"],
	["JSON → CSV", "2,400 rows"],
	["SVG → ICO", "16 · 32 · 48 px"],
	["JPG − GPS", "location removed"],
];

const COLORS = ["bg-electric", "bg-iris", "bg-default", "bg-surface-secondary"];

// Every tile slowly flips between square and circle on its own rhythm, so the
// grid never repeats the same picture — the app's name, made literal.
const TILES = Array.from({ length: 16 }, (_, index) => {
	const color = COLORS[(index * 7 + Math.floor(index / 4)) % COLORS.length];
	const startsRound = index % 3 === 0;
	return {
		color,
		style: {
			"--from-radius": startsRound ? "50%" : "6%",
			"--to-radius": startsRound ? "6%" : "50%",
			"--duration": `${5 + (index % 5)}s`,
			"--delay": `${-index * 0.7}s`,
		} as CSSProperties,
	};
});

function ToolCard({ tool, delay }: { tool: Tool; delay: number }) {
	const localize = useLocalePath();
	return (
		<Reveal delay={delay}>
			<Link
				to={localize(tool.path)}
				className="group flex h-full items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-electric/60 hover:shadow-[0_12px_40px_-12px] hover:shadow-electric/30"
			>
				<div
					className={`grid size-10 shrink-0 place-items-center rounded transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${tool.tile}`}
				>
					<tool.icon size={18} />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<p className="headline flex items-center gap-1 text-xl">
						<FormattedMessage id={`tool.${tool.id}.name`} />
						<ChevronRight
							size={16}
							className="text-muted transition-transform group-hover:translate-x-1"
						/>
					</p>
					<p className="text-muted text-sm">
						<FormattedMessage id={`tool.${tool.id}.description`} />
					</p>
				</div>
			</Link>
		</Reveal>
	);
}

function TileArt() {
	const index = useCycle(CONVERSIONS.length, 2600);
	const [from, to] = CONVERSIONS[index] ?? [];

	return (
		<div className="relative h-80 overflow-hidden rounded-xl border border-border bg-surface lg:h-full lg:min-h-[26rem]">
			<div className="absolute inset-0 grid-backdrop" />
			<div className="absolute inset-0 animate-drift">
				<div className="absolute top-1/2 left-1/2 grid w-[130%] grid-cols-4 gap-3 [transform:translate(-50%,-50%)_perspective(1000px)_rotateX(38deg)_rotateZ(-16deg)]">
					{TILES.map((tile, tileIndex) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: static decorative tiles
							key={tileIndex}
							style={tile.style}
							className={`aspect-square animate-morph ${tile.color}`}
						/>
					))}
				</div>
			</div>
			<span
				key={`from-${index}`}
				className="eyebrow absolute top-5 left-5 animate-word rounded border border-border bg-surface/90 px-2.5 py-1.5 text-foreground backdrop-blur"
			>
				{from}
			</span>
			<span
				key={`to-${index}`}
				className="eyebrow absolute right-5 bottom-5 animate-word rounded border border-border bg-surface/90 px-2.5 py-1.5 text-foreground backdrop-blur [animation-delay:120ms]"
			>
				{to}
			</span>
		</div>
	);
}

function ToolSpotlight({ tool }: { tool: Tool }) {
	const localize = useLocalePath();
	return (
		<Link
			to={localize(tool.path)}
			className="group flex flex-1 flex-col gap-3 rounded-xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-electric/60"
		>
			<div className="flex items-center justify-between gap-3">
				<Eyebrow dot>
					<FormattedMessage id="home.available" />
				</Eyebrow>
				<div
					className={`grid size-9 place-items-center rounded transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${tool.tile}`}
				>
					<tool.icon size={16} />
				</div>
			</div>
			<h3 className="headline text-3xl">
				<FormattedMessage id={`tool.${tool.id}.name`} />
			</h3>
			<p className="text-muted">
				<FormattedMessage id={`tool.${tool.id}.description`} />
			</p>
			<span className="mt-auto flex items-center gap-1 pt-2 font-semibold text-sm">
				<FormattedMessage id="home.openTool" />
				<ChevronRight
					size={16}
					className="transition-transform group-hover:translate-x-1"
				/>
			</span>
		</Link>
	);
}

function RotatingWord() {
	const intl = useIntl();
	const words = intl.formatMessage({ id: "home.things" }).split("|");
	const index = useCycle(words.length, 2200);
	return (
		<span
			key={`${intl.locale}-${index}`}
			className="inline-block animate-word rounded-sm bg-electric px-[0.12em] text-ink"
		>
			{words[index]}
		</span>
	);
}

function rise(delay: number) {
	return { "--delay": `${delay}ms` } as CSSProperties;
}

export function HomePage() {
	const localize = useLocalePath();
	return (
		<div className="flex flex-col gap-24">
			<section className="flex flex-col items-center gap-7 pt-6 text-center lg:pt-12">
				<div className="animate-rise" style={rise(0)}>
					<Eyebrow dot>
						<FormattedMessage id="home.badge" />
					</Eyebrow>
				</div>
				<h1 className="headline max-w-4xl text-balance text-5xl sm:text-7xl lg:text-8xl">
					<span className="block animate-rise" style={rise(100)}>
						<FormattedMessage id="home.title1" />
						<span className="block whitespace-nowrap">
							<FormattedMessage
								id="home.titleWord"
								values={{ thing: <RotatingWord /> }}
							/>
						</span>
					</span>
					<span
						className="block animate-rise text-accent-soft-foreground"
						style={rise(220)}
					>
						<FormattedMessage id="home.title2" />
					</span>
				</h1>
				<p
					className="max-w-xl animate-rise text-lg text-muted"
					style={rise(340)}
				>
					<FormattedMessage id="home.subtitle" />
				</p>
				<div
					className="flex animate-rise flex-wrap items-center justify-center gap-6"
					style={rise(460)}
				>
					<Link
						to={localize(CONVERT_TOOL.path)}
						className={buttonVariants({
							variant: "primary",
							size: "lg",
							className: "animate-pulse-ring px-8 font-semibold",
						})}
					>
						<FormattedMessage id="home.cta" />
					</Link>
					<Link
						to={localize(COMPRESS_TOOL.path)}
						className="group flex items-center gap-1 font-semibold"
					>
						<FormattedMessage id="home.ctaSecondary" />
						<ChevronRight
							size={18}
							className="transition-transform group-hover:translate-x-1"
						/>
					</Link>
				</div>
			</section>

			<section
				className="grid animate-rise gap-4 lg:grid-cols-5"
				style={rise(600)}
			>
				<div className="lg:col-span-3">
					<TileArt />
				</div>
				<div className="flex flex-col gap-4 lg:col-span-2">
					<ToolSpotlight tool={CONVERT_TOOL} />
					<ToolSpotlight tool={COMPRESS_TOOL} />
				</div>
			</section>

			<section className="flex flex-col gap-8">
				<Reveal className="flex flex-col gap-4">
					<Eyebrow>
						<FormattedMessage id="home.allTools" />
					</Eyebrow>
					<h2 className="headline text-4xl sm:text-5xl">
						<FormattedMessage
							id="home.allToolsTitle"
							values={{ count: TOOLS.length }}
						/>
					</h2>
				</Reveal>
				{TOOL_GROUPS.map((group) => (
					<div key={group} className="flex flex-col gap-3">
						<Reveal>
							<p className="eyebrow text-[0.6875rem] text-muted">
								<FormattedMessage id={`nav.group.${group}`} />
							</p>
						</Reveal>
						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
							{TOOLS.filter((tool) => tool.group === group).map(
								(tool, index) => (
									<ToolCard key={tool.id} tool={tool} delay={index * 90} />
								),
							)}
						</div>
					</div>
				))}
			</section>

			<Reveal className="flex flex-col items-center gap-6">
				<p className="eyebrow text-muted">
					<FormattedMessage id="home.formats" />
				</p>
				<div className="group w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
					<div className="flex w-max animate-marquee gap-12 group-hover:[animation-play-state:paused]">
						{[...FORMATS, ...FORMATS].map((format, index) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: the list is duplicated for a seamless loop
								key={index}
								aria-hidden={index >= FORMATS.length}
								className="headline text-4xl text-muted/70 transition-colors hover:text-foreground"
							>
								{format}
							</span>
						))}
					</div>
				</div>
			</Reveal>

			<section className="flex flex-col gap-10 border-separator border-t pt-16 pb-8">
				<Reveal className="flex flex-col gap-4">
					<Eyebrow>
						<FormattedMessage id="home.whyEyebrow" />
					</Eyebrow>
					<h2 className="headline max-w-2xl text-4xl sm:text-5xl">
						<FormattedMessage id="home.whyTitle" />
					</h2>
				</Reveal>
				<div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
					{["private", "bulk", "fast"].map((feature, index) => (
						<Reveal
							key={feature}
							delay={index * 120}
							className="flex flex-col gap-3 bg-surface p-6"
						>
							<span className="font-mono text-accent-soft-foreground text-sm">
								0{index + 1}
							</span>
							<p className="headline text-2xl">
								<FormattedMessage id={`home.feature.${feature}.title`} />
							</p>
							<p className="text-muted text-sm">
								<FormattedMessage id={`home.feature.${feature}.body`} />
							</p>
						</Reveal>
					))}
				</div>
			</section>
		</div>
	);
}
