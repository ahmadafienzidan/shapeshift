import type { CSSProperties, ReactNode } from "react";
import { useReveal } from "../lib/motion";

export function Reveal({
	children,
	className = "",
	delay = 0,
}: {
	children: ReactNode;
	className?: string;
	delay?: number;
}) {
	const { ref, visible } = useReveal<HTMLDivElement>();
	return (
		<div
			ref={ref}
			data-visible={visible}
			className={`reveal ${className}`}
			style={{ "--delay": `${delay}ms` } as CSSProperties}
		>
			{children}
		</div>
	);
}
