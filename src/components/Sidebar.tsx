import { Button, Kbd, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { House, Moon, Search, Sun } from "lucide-react";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NavLink } from "react-router";
import { type Locale, useLocale, useLocalePath } from "../i18n/locale";
import { useTheme } from "../lib/useTheme";
import { TOOL_GROUPS, TOOLS } from "../tools";
import { CommandPalette } from "./CommandPalette";
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

const MAC = /Mac|iPhone|iPad/.test(navigator.userAgent);

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
	const localize = useLocalePath();
	const { theme, toggle } = useTheme();
	const [searching, setSearching] = useState(false);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((MAC ? event.metaKey : event.ctrlKey) && event.key === "k") {
				event.preventDefault();
				setSearching((open) => !open);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<aside className="z-10 flex flex-col gap-4 border-separator border-b bg-(--sidebar) p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
			<div className="flex items-center justify-between gap-3 px-1">
				<NavLink to={localize("/")} className="flex items-center gap-2.5">
					<Logo />
					<span className="headline text-2xl">Shapeshift</span>
				</NavLink>
				<div className="flex gap-1">
					<Button
						isIconOnly
						variant="ghost"
						size="sm"
						aria-label={intl.formatMessage({ id: "search.label" })}
						onPress={() => setSearching(true)}
						className="lg:hidden"
					>
						<Search size={16} />
					</Button>
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
			</div>

			<Button
				variant="outline"
				onPress={() => setSearching(true)}
				className="group hidden justify-start gap-2 font-normal text-muted transition-colors hover:border-electric/60 hover:text-foreground lg:flex"
			>
				<Search
					size={16}
					className="transition-transform duration-200 group-hover:scale-110"
				/>
				<span className="flex-1 text-left">
					<FormattedMessage id="search.label" />
				</span>
				<Kbd className="text-xs">{MAC ? "⌘K" : "Ctrl K"}</Kbd>
			</Button>
			<CommandPalette isOpen={searching} onOpenChange={setSearching} />

			<nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:gap-0.5">
				<SectionLabel>
					<FormattedMessage id="nav.overview" />
				</SectionLabel>
				<NavItem to={localize("/")} icon={<House size={16} />}>
					<FormattedMessage id="nav.home" />
				</NavItem>
				{TOOL_GROUPS.map((group) => (
					<Fragment key={group}>
						<SectionLabel>
							<FormattedMessage id={`nav.group.${group}`} />
						</SectionLabel>
						{TOOLS.filter((tool) => tool.group === group).map((tool) => (
							<NavItem
								key={tool.id}
								to={localize(tool.path)}
								icon={<tool.icon size={16} />}
							>
								<FormattedMessage id={`tool.${tool.id}.name`} />
							</NavItem>
						))}
					</Fragment>
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
