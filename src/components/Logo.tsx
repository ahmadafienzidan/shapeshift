import { Shapes } from "lucide-react";

export function Logo() {
	return (
		<div className="grid size-10 place-items-center rounded-xl bg-linear-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-fuchsia-500/30 shadow-lg">
			<Shapes size={22} />
		</div>
	);
}
