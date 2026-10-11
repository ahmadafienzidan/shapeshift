import { Button } from "@heroui/react";
import { Check, Copy } from "lucide-react";
import { FormattedMessage } from "react-intl";
import { useCopy } from "../lib/useCopy";

export function CopyButton({
	text,
	variant = "ghost",
}: {
	text: string;
	variant?: "ghost" | "outline" | "primary";
}) {
	const { copied, copy } = useCopy();
	return (
		<Button
			variant={variant}
			size="sm"
			isDisabled={!text}
			onPress={() => copy(text)}
		>
			{copied ? <Check size={14} /> : <Copy size={14} />}
			<FormattedMessage id={copied ? "data.copied" : "data.copy"} />
		</Button>
	);
}
