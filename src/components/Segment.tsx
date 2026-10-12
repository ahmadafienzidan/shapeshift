import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import type { ReactNode } from "react";

export function Segment<T extends string>({
	label,
	value,
	onChange,
	options,
}: {
	label: ReactNode;
	value: T;
	onChange: (value: T) => void;
	options: { id: T; label: string }[];
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="eyebrow text-[0.6875rem] text-muted">{label}</span>
			<ToggleButtonGroup
				size="sm"
				selectionMode="single"
				disallowEmptySelection
				selectedKeys={new Set([value])}
				onSelectionChange={(keys) => onChange([...keys][0] as T)}
			>
				{options.map((option) => (
					<ToggleButton key={option.id} id={option.id}>
						{option.label}
					</ToggleButton>
				))}
			</ToggleButtonGroup>
		</div>
	);
}
