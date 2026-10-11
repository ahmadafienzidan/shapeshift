import {
	Button,
	Chip,
	Separator,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
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
				`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
					isActive
						? "bg-accent-soft text-accent-soft-foreground"
						: "text-muted hover:bg-default hover:text-foreground"
				}`
			}
		>
			{icon}
			<span className="truncate">{children}</span>
		</NavLink>
	);
}

export function Sidebar() {
	const intl = useIntl();
	const { locale, setLocale } = useLocale();
	const { theme, toggle } = useTheme();

	return (
		<aside className="flex flex-col gap-6 border-separator border-b bg-surface/60 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-dvh lg:w-72 lg:shrink-0 lg:border-r lg:border-b-0 lg:p-6">
			<div className="flex items-center justify-between gap-3">
				<NavLink to="/" className="flex items-center gap-3">
					<Logo />
					<div>
						<p className="font-bold text-lg leading-tight">Shapeshift</p>
						<p className="text-muted text-xs">
							<FormattedMessage id="app.tagline" />
						</p>
					</div>
				</NavLink>
				<Button
					isIconOnly
					variant="ghost"
					size="sm"
					aria-label={intl.formatMessage({ id: "nav.theme" })}
					onPress={toggle}
				>
					{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
				</Button>
			</div>

			<nav className="flex gap-1 overflow-x-auto lg:flex-col">
				<NavItem to="/" icon={<House size={18} />}>
					<FormattedMessage id="nav.home" />
				</NavItem>
				<p className="mt-4 mb-1 hidden px-3 font-semibold text-muted text-xs uppercase tracking-wider lg:block">
					<FormattedMessage id="nav.tools" />
				</p>
				{TOOLS.filter((tool) => tool.available).map((tool) => (
					<NavItem key={tool.id} to={tool.path} icon={<tool.icon size={18} />}>
						<FormattedMessage id={`tool.${tool.id}.name`} />
					</NavItem>
				))}
				<p className="mt-4 mb-1 hidden px-3 font-semibold text-muted text-xs uppercase tracking-wider lg:block">
					<FormattedMessage id="nav.soon" />
				</p>
				{TOOLS.filter((tool) => !tool.available).map((tool) => (
					<div
						key={tool.id}
						className="hidden items-center gap-3 px-3 py-2 text-muted text-sm opacity-60 lg:flex"
					>
						<tool.icon size={18} />
						<span className="truncate">
							<FormattedMessage id={`tool.${tool.id}.name`} />
						</span>
					</div>
				))}
			</nav>

			<div className="mt-auto flex flex-col gap-3">
				<Separator className="hidden lg:block" />
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
		<div className="flex items-center justify-between gap-3">
			<Chip size="sm" variant="soft">
				<FormattedMessage id="nav.language" />
			</Chip>
			<ToggleButtonGroup
				size="sm"
				selectionMode="single"
				disallowEmptySelection
				selectedKeys={new Set([locale])}
				onSelectionChange={(keys) => onChange([...keys][0] as Locale)}
				aria-label={intl.formatMessage({ id: "nav.language" })}
			>
				<ToggleButton id="en">EN</ToggleButton>
				<ToggleButton id="id">ID</ToggleButton>
			</ToggleButtonGroup>
		</div>
	);
}
