import { useState } from "react";
import { useIntl } from "react-intl";
import {
	FormatPicker,
	MaxDimensionSelect,
	QualitySlider,
} from "../components/Options";
import { ToolPage } from "../components/ToolPage";
import {
	decodeImage,
	encodeImage,
	type OutputType,
	renameExtension,
} from "../lib/image";
import { useBatch } from "../lib/useBatch";
import { COMPRESS_TOOL } from "../tools";

const tool = COMPRESS_TOOL;

type CompressFormat = OutputType | "original";

const ENCODABLE: OutputType[] = ["image/jpeg", "image/png", "image/webp"];

function resolveFormat(file: File, format: CompressFormat): OutputType {
	if (format !== "original") return format;
	return ENCODABLE.find((type) => type === file.type) ?? "image/jpeg";
}

export function CompressPage() {
	const intl = useIntl();
	const [format, setFormat] = useState<CompressFormat>("original");
	const [quality, setQuality] = useState(75);
	const [maxDimension, setMaxDimension] = useState(1920);
	const { items, add, clear } = useBatch();

	const handleFiles = (files: File[]) =>
		add(files, async (file) => {
			const type = resolveFormat(file, format);
			return {
				blob: await encodeImage(
					await decodeImage(file),
					type,
					quality / 100,
					maxDimension || undefined,
				),
				name: renameExtension(file.name, type),
			};
		});

	return (
		<ToolPage
			tool={tool}
			items={items}
			onFiles={handleFiles}
			onClear={clear}
			options={
				<>
					<FormatPicker
						value={format}
						onChange={setFormat}
						options={[
							{
								id: "original",
								label: intl.formatMessage({ id: "options.format.original" }),
							},
							{ id: "image/jpeg", label: "JPG" },
							{ id: "image/webp", label: "WEBP" },
						]}
					/>
					<QualitySlider value={quality} onChange={setQuality} />
					<MaxDimensionSelect value={maxDimension} onChange={setMaxDimension} />
				</>
			}
		/>
	);
}
