import { Card, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { ArrowRight, Layers, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router";
import { CONVERT_TOOL, TOOLS, type Tool } from "../tools";

function ToolCard({ tool }: { tool: Tool }) {
	const card = (
		<Card
			className={`h-full transition-all ${
				tool.available
					? "group-hover:-translate-y-1 group-hover:shadow-xl"
					: "opacity-60"
			}`}
		>
			<Card.Header className="flex flex-row items-start gap-4">
				<div
					className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br ${tool.gradient} text-white shadow-lg`}
				>
					<tool.icon size={22} />
				</div>
				<div className="flex flex-1 flex-col gap-1">
					<Card.Title className="flex items-center gap-2">
						<FormattedMessage id={`tool.${tool.id}.name`} />
						{!tool.available && (
							<Chip size="sm" variant="soft">
								<FormattedMessage id="nav.soon" />
							</Chip>
						)}
					</Card.Title>
					{tool.available && (
						<Card.Description>
							<FormattedMessage id={`tool.${tool.id}.description`} />
						</Card.Description>
					)}
				</div>
				{tool.available && (
					<ArrowRight
						size={18}
						className="text-muted transition-transform group-hover:translate-x-1"
					/>
				)}
			</Card.Header>
		</Card>
	);
	return tool.available ? (
		<Link to={tool.path} className="group">
			{card}
		</Link>
	) : (
		card
	);
}

const FEATURES = [
	{ id: "private", icon: ShieldCheck },
	{ id: "bulk", icon: Layers },
	{ id: "fast", icon: Zap },
];

export function HomePage() {
	return (
		<div className="flex flex-col gap-14">
			<section className="relative overflow-hidden rounded-[2rem] border border-separator bg-surface px-6 py-16 sm:px-12 sm:py-20">
				<div className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-violet-500/25 blur-3xl" />
				<div className="pointer-events-none absolute -right-24 -bottom-40 size-96 rounded-full bg-sky-500/25 blur-3xl" />
				<div className="pointer-events-none absolute top-10 right-1/3 size-56 rounded-full bg-fuchsia-500/20 blur-3xl" />

				<div className="relative flex max-w-2xl flex-col items-start gap-6">
					<Chip variant="soft" color="accent">
						<Sparkles size={14} />
						<FormattedMessage id="home.badge" />
					</Chip>
					<h1 className="font-extrabold text-4xl tracking-tight sm:text-6xl">
						<span className="bg-linear-to-r from-violet-500 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent">
							<FormattedMessage id="home.title" />
						</span>
					</h1>
					<p className="text-lg text-muted">
						<FormattedMessage id="home.subtitle" />
					</p>
					<Link
						to={CONVERT_TOOL.path}
						className={buttonVariants({ variant: "primary", size: "lg" })}
					>
						<FormattedMessage id="home.cta" />
						<ArrowRight size={18} />
					</Link>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-3">
				{FEATURES.map((feature) => (
					<div key={feature.id} className="flex flex-col gap-2 px-1">
						<feature.icon size={22} className="text-accent" />
						<p className="font-semibold">
							<FormattedMessage id={`home.feature.${feature.id}.title`} />
						</p>
						<p className="text-muted text-sm">
							<FormattedMessage id={`home.feature.${feature.id}.body`} />
						</p>
					</div>
				))}
			</section>

			<section className="flex flex-col gap-4">
				<h2 className="font-bold text-xl">
					<FormattedMessage id="home.tools" />
				</h2>
				<div className="grid gap-4 md:grid-cols-2">
					{TOOLS.map((tool) => (
						<ToolCard key={tool.id} tool={tool} />
					))}
				</div>
			</section>
		</div>
	);
}
