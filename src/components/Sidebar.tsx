import { Button, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { House, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NavLink } from "react-router";
import { type Locale, useLocale } from "../i18n/LocaleProvider";
import { useTheme } from "../lib/useTheme";
import { TOOLS } from "../tools";
import { Logo } from "./Logo";

function NavItem({
	to,
	icon,
	children,
}: {
	to: string;
	icon: ReactNode;
	children: ReactNode;
}) {
	return (
		<NavLink
			to={to}
			end
			className={({ isActive }) =>
				`relative flex shrink-0 items-center gap-3 rounded px-3 py-2 font-medium text-sm transition-colors ${
					isActive
						? "bg-default text-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-electric"
						: "text-muted hover:bg-default/60 hover:text-foreground"
				}`
			}
		>
			{icon}
			<span className="truncate">{children}</span>
		</NavLink>
	);
}

function SectionLabel({ children }: { children: ReactNode }) {
	return (
		<p className="eyebrow mt-6 mb-2 hidden px-3 text-[0.6875rem] text-muted lg:block">
			{children}
		</p>
	);
}

export function Sidebar() {
	const intl = useIntl();
	const { locale, setLocale } = useLocale();
	const { theme, toggle } = useTheme();

	return (
		<aside className="z-10 flex flex-col gap-4 border-separator border-b bg-(--sidebar) p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
			<div className="flex items-center justify-between gap-3 px-1">
				<NavLink to="/" className="flex items-center gap-2.5">
					<Logo />
					<span className="headline text-2xl">Shapeshift</span>
				</NavLink>
				<Button
					isIconOnly
					variant="ghost"
					size="sm"
					aria-label={intl.formatMessage({ id: "nav.theme" })}
					onPress={toggle}
				>
					{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
				</Button>
			</div>

			<nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
				<SectionLabel>
					<FormattedMessage id="nav.overview" />
				</SectionLabel>
				<NavItem to="/" icon={<House size={16} />}>
					<FormattedMessage id="nav.home" />
				</NavItem>
				<SectionLabel>
					<FormattedMessage id="nav.tools" />
				</SectionLabel>
				{TOOLS.filter((tool) => tool.available).map((tool) => (
					<NavItem key={tool.id} to={tool.path} icon={<tool.icon size={16} />}>
						<FormattedMessage id={`tool.${tool.id}.name`} />
					</NavItem>
				))}
				<SectionLabel>
					<FormattedMessage id="nav.soon" />
				</SectionLabel>
				{TOOLS.filter((tool) => !tool.available).map((tool) => (
					<div
						key={tool.id}
						className="hidden items-center gap-3 px-3 py-2 text-muted/60 text-sm lg:flex"
					>
						<tool.icon size={16} />
						<span className="truncate">
							<FormattedMessage id={`tool.${tool.id}.name`} />
						</span>
					</div>
				))}
			</nav>

			<div className="mt-auto flex items-center justify-between gap-3 border-separator px-1 lg:border-t lg:pt-4">
				<span className="eyebrow text-[0.6875rem] text-muted">
					<FormattedMessage id="nav.language" />
				</span>
				<LanguageSwitch locale={locale} onChange={setLocale} />
			</div>
		</aside>
	);
}

function LanguageSwitch({
	locale,
	onChange,
}: {
	locale: Locale;
	onChange: (locale: Locale) => void;
}) {
	const intl = useIntl();
	return (
		<ToggleButtonGroup
			size="sm"
			selectionMode="single"
			disallowEmptySelection
			selectedKeys={new Set([locale])}
			onSelectionChange={(keys) => onChange([...keys][0] as Locale)}
			aria-label={intl.formatMessage({ id: "nav.language" })}
		>
			<ToggleButton id="en" className="font-mono text-xs">
				EN
			</ToggleButton>
			<ToggleButton id="id" className="font-mono text-xs">
				ID
			</ToggleButton>
		</ToggleButtonGroup>
	);
}
