import {
	Label,
	ListBox,
	Select,
	Slider,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
import { FormattedMessage, useIntl } from "react-intl";

export function FormatPicker<T extends string>({
	labelId = "options.format",
	value,
	options,
	onChange,
}: {
	labelId?: string;
	value: T;
	options: { id: T; label: string }[];
	onChange: (value: T) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Label>
				<FormattedMessage id={labelId} />
			</Label>
			<ToggleButtonGroup
				fullWidth
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

export function QualitySlider({
	value,
	onChange,
	isDisabled,
}: {
	value: number;
	onChange: (value: number) => void;
	isDisabled?: boolean;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Slider
				value={value}
				onChange={(next) => onChange(next as number)}
				minValue={10}
				maxValue={100}
				isDisabled={isDisabled}
			>
				<div className="flex items-center justify-between">
					<Label>
						<FormattedMessage id="options.quality" />
					</Label>
					<Slider.Output>{({ state }) => `${state.values[0]}%`}</Slider.Output>
				</div>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb />
				</Slider.Track>
			</Slider>
			{isDisabled && (
				<p className="text-muted text-xs">
					<FormattedMessage id="options.qualityHint" />
				</p>
			)}
		</div>
	);
}

const DIMENSIONS = [0, 4096, 2560, 1920, 1280, 1024, 640];

export function MaxDimensionSelect({
	value,
	onChange,
}: {
	value: number;
	onChange: (value: number) => void;
}) {
	const intl = useIntl();
	const label = (size: number) =>
		size === 0
			? intl.formatMessage({ id: "options.maxDimension.none" })
			: intl.formatMessage({ id: "options.maxDimension.value" }, { size });

	return (
		<Select
			selectedKey={String(value)}
			onSelectionChange={(key) => onChange(Number(key))}
		>
			<Label>
				<FormattedMessage id="options.maxDimension" />
			</Label>
			<Select.Trigger>
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox>
					{DIMENSIONS.map((size) => (
						<ListBox.Item key={size} id={String(size)} textValue={label(size)}>
							{label(size)}
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}
