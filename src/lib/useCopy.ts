import { useState } from "react";

export function useCopy() {
	const [copied, setCopied] = useState(false);

	const copy = async (text: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return { copied, copy };
}
