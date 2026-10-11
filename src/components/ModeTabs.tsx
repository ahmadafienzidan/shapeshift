import { Tabs } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { useIntl } from "react-intl";

export function ModeTabs<T extends string>({
	label,
	value,
	onChange,
	modes,
}: {
	label: string;
	value: T;
	onChange: (value: T) => void;
	modes: { id: T; icon: LucideIcon; labelId: string }[];
}) {
	const intl = useIntl();
	return (
		<Tabs selectedKey={value} onSelectionChange={(key) => onChange(key as T)}>
			<Tabs.ListContainer>
				<Tabs.List aria-label={label}>
					{modes.map((mode) => (
						<Tabs.Tab key={mode.id} id={mode.id} className="gap-2">
							<mode.icon size={16} />
							{intl.formatMessage({ id: mode.labelId })}
							<Tabs.Indicator />
						</Tabs.Tab>
					))}
				</Tabs.List>
			</Tabs.ListContainer>
		</Tabs>
	);
}
