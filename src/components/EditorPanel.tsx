import type { ReactNode } from "react";

export const EDITOR_CLASS =
	"min-h-[26rem] w-full flex-1 resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-muted/60";

export function EditorPanel({
	label,
	actions,
	children,
}: {
	label: ReactNode;
	actions: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-separator border-b px-4 py-2">
				<p className="eyebrow text-muted">{label}</p>
				<div className="flex gap-1">{actions}</div>
			</div>
			{children}
		</div>
	);
}
