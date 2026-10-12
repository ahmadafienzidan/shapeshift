import {
	Label,
	ListBox,
	Select,
	Slider,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
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

export function RangeSlider({
	labelId,
	value,
	onChange,
	min,
	max,
	isDisabled,
	hint,
	unit = "%",
}: {
	labelId: string;
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	isDisabled?: boolean;
	hint?: ReactNode;
	unit?: string;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Slider
				value={value}
				onChange={(next) => onChange(next as number)}
				minValue={min}
				maxValue={max}
				isDisabled={isDisabled}
			>
				<div className="flex items-center justify-between">
					<Label>
						<FormattedMessage id={labelId} />
					</Label>
					<Slider.Output>
						{({ state }) =>
							`${state.values[0]}${unit === "%" ? "" : " "}${unit}`
						}
					</Slider.Output>
				</div>
				<Slider.Track>
					<Slider.Fill />
					<Slider.Thumb />
				</Slider.Track>
			</Slider>
			{hint && <p className="text-muted text-xs">{hint}</p>}
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
		<RangeSlider
			labelId="options.quality"
			value={value}
			onChange={onChange}
			min={10}
			max={100}
			isDisabled={isDisabled}
			hint={isDisabled && <FormattedMessage id="options.qualityHint" />}
		/>
	);
}

export function ColorInput({
	labelId,
	value,
	onChange,
}: {
	labelId: string;
	value: string;
	onChange: (value: string) => void;
}) {
	const [draft, setDraft] = useState(value);
	const timer = useRef<number>(undefined);

	useEffect(() => () => window.clearTimeout(timer.current), []);

	const change = (next: string) => {
		setDraft(next);
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => onChange(next), 150);
	};

	return (
		<label className="flex items-center justify-between gap-3">
			<span className="font-medium text-sm">
				<FormattedMessage id={labelId} />
			</span>
			<span className="flex items-center gap-2 rounded border border-border bg-field px-2 py-1">
				<span className="font-mono text-muted text-xs uppercase">{draft}</span>
				<input
					type="color"
					value={draft}
					onChange={(event) => change(event.target.value)}
					className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
				/>
			</span>
		</label>
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
