import { useEffect, useState } from "react";
import { isHeic, isImage } from "../lib/image";

export function Thumbnail({ file }: { file: File }) {
	const [url, setUrl] = useState<string>();
	const previewable = isImage(file) && !isHeic(file);

	useEffect(() => {
		if (!previewable) return;
		const objectUrl = URL.createObjectURL(file);
		setUrl(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [file, previewable]);

	return (
		<div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded bg-default">
			{url ? (
				<img src={url} alt="" className="size-full object-cover" />
			) : (
				<span className="font-mono text-[0.625rem] text-muted uppercase">
					{file.name.split(".").pop()}
				</span>
			)}
		</div>
	);
}
