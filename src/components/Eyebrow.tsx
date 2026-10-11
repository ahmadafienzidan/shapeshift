import type { ReactNode } from "react";

export function Eyebrow({
	children,
	dot = false,
}: {
	children: ReactNode;
	dot?: boolean;
}) {
	return (
		<p className="eyebrow flex items-center gap-2 text-accent-soft-foreground">
			{dot && (
				<span className="size-2 rounded-full bg-electric shadow-[0_0_10px] shadow-electric" />
			)}
			{children}
		</p>
	);
}
