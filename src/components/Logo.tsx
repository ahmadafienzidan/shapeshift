export function Logo({ className = "size-8" }: { className?: string }) {
	return (
		<svg viewBox="0 0 32 32" className={className} aria-hidden="true">
			<rect
				x="2"
				y="2"
				width="17"
				height="17"
				rx="2"
				className="fill-electric"
			/>
			<circle
				cx="21"
				cy="21"
				r="9"
				className="fill-iris mix-blend-multiply dark:mix-blend-screen"
			/>
		</svg>
	);
}
