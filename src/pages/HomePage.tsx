import { buttonVariants } from "@heroui/styles";
import { ArrowRight, ChevronRight } from "lucide-react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router";
import { Eyebrow } from "../components/Eyebrow";
import { COMPRESS_TOOL, CONVERT_TOOL, TOOLS, type Tool } from "../tools";

const FORMATS = ["HEIC", "HEIF", "WEBP", "AVIF", "PNG", "JPG", "GIF", "BMP"];

const FEATURES = ["private", "bulk", "fast"];

const TILES = [
	"bg-surface-secondary",
	"bg-electric",
	"bg-default",
	"bg-iris rounded-full",
	"bg-default",
	"bg-iris",
	"bg-electric rounded-full",
	"bg-surface-secondary",
	"bg-electric",
	"bg-surface-secondary",
	"bg-iris",
	"bg-default",
	"bg-default rounded-full",
	"bg-electric",
	"bg-surface-secondary",
	"bg-iris rounded-full",
];

function TileArt() {
	return (
		<div className="relative h-80 overflow-hidden rounded-xl border border-border bg-surface lg:h-full lg:min-h-[26rem]">
			<div className="absolute inset-0 grid-backdrop" />
			<div className="absolute top-1/2 left-1/2 grid w-[130%] grid-cols-4 gap-3 [transform:translate(-50%,-50%)_perspective(1000px)_rotateX(38deg)_rotateZ(-16deg)]">
				{TILES.map((tile, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: static decorative tiles
						key={index}
						className={`aspect-square transition-transform duration-500 hover:-translate-y-2 ${tile}`}
					/>
				))}
			</div>
			<span className="eyebrow absolute top-5 left-5 rounded border border-border bg-surface/90 px-2.5 py-1.5 text-foreground backdrop-blur">
				HEIC → JPG
			</span>
			<span className="eyebrow absolute right-5 bottom-5 rounded border border-border bg-surface/90 px-2.5 py-1.5 text-foreground backdrop-blur">
				4.2 MB → 640 KB
			</span>
		</div>
	);
}

function ToolSpotlight({ tool }: { tool: Tool }) {
	return (
		<Link
			to={tool.path}
			className="group flex flex-1 flex-col gap-3 rounded-xl border border-border bg-surface p-6 transition-colors hover:border-electric/60"
		>
			<Eyebrow dot>
				<FormattedMessage id="home.available" />
			</Eyebrow>
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

export function HomePage() {
	return (
		<div className="flex flex-col gap-24">
			<section className="flex flex-col items-center gap-7 pt-6 text-center lg:pt-12">
				<Eyebrow dot>
					<FormattedMessage id="home.badge" />
				</Eyebrow>
				<h1 className="headline max-w-4xl text-5xl sm:text-7xl lg:text-8xl">
					<FormattedMessage id="home.title1" />
					<br />
					<span className="text-accent-soft-foreground">
						<FormattedMessage id="home.title2" />
					</span>
				</h1>
				<p className="max-w-xl text-lg text-muted">
					<FormattedMessage id="home.subtitle" />
				</p>
				<div className="flex flex-wrap items-center justify-center gap-6">
					<Link
						to={CONVERT_TOOL.path}
						className={buttonVariants({
							variant: "primary",
							size: "lg",
							className: "px-8 font-semibold",
						})}
					>
						<FormattedMessage id="home.cta" />
					</Link>
					<Link
						to={COMPRESS_TOOL.path}
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

			<section className="grid gap-4 lg:grid-cols-5">
				<div className="lg:col-span-3">
					<TileArt />
				</div>
				<div className="flex flex-col gap-4 lg:col-span-2">
					<ToolSpotlight tool={CONVERT_TOOL} />
					<ToolSpotlight tool={COMPRESS_TOOL} />
				</div>
			</section>

			<section className="flex flex-col items-center gap-6">
				<p className="eyebrow text-muted">
					<FormattedMessage id="home.formats" />
				</p>
				<div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
					{FORMATS.map((format) => (
						<span
							key={format}
							className="headline text-4xl text-muted/70 transition-colors hover:text-foreground"
						>
							{format}
						</span>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-10 border-separator border-t pt-16">
				<div className="flex flex-col gap-4">
					<Eyebrow>
						<FormattedMessage id="home.whyEyebrow" />
					</Eyebrow>
					<h2 className="headline max-w-2xl text-4xl sm:text-5xl">
						<FormattedMessage id="home.whyTitle" />
					</h2>
				</div>
				<div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
					{FEATURES.map((feature, index) => (
						<div key={feature} className="flex flex-col gap-3 bg-surface p-6">
							<span className="font-mono text-accent-soft-foreground text-sm">
								0{index + 1}
							</span>
							<p className="headline text-2xl">
								<FormattedMessage id={`home.feature.${feature}.title`} />
							</p>
							<p className="text-muted text-sm">
								<FormattedMessage id={`home.feature.${feature}.body`} />
							</p>
						</div>
					))}
				</div>
			</section>

			<section className="flex flex-col gap-6 pb-8">
				<Eyebrow>
					<FormattedMessage id="nav.soon" />
				</Eyebrow>
				<div className="grid gap-4 sm:grid-cols-2">
					{TOOLS.filter((tool) => !tool.available).map((tool) => (
						<div
							key={tool.id}
							className="flex items-center gap-4 rounded-xl border border-border border-dashed p-5"
						>
							<div
								className={`grid size-10 shrink-0 place-items-center rounded ${tool.tile}`}
							>
								<tool.icon size={18} />
							</div>
							<div className="flex flex-col">
								<p className="headline text-xl">
									<FormattedMessage id={`tool.${tool.id}.name`} />
								</p>
								<p className="text-muted text-sm">
									<FormattedMessage id={`tool.${tool.id}.description`} />
								</p>
							</div>
							<ArrowRight size={16} className="ml-auto text-muted/50" />
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
