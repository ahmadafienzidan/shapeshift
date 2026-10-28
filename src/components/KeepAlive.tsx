import { Activity, type ReactNode, useState } from "react";

// Renders each key once it has been active and keeps it mounted but hidden
// afterwards, so its state survives switching away and back.
export function KeepAlive<Key extends string>({
	active,
	render,
}: {
	active: Key | undefined;
	render: (key: Key) => ReactNode;
}) {
	const [visited, setVisited] = useState<Key[]>([]);
	if (active !== undefined && !visited.includes(active))
		setVisited([...visited, active]);

	return visited.map((key) => (
		<Activity key={key} mode={key === active ? "visible" : "hidden"}>
			{render(key)}
		</Activity>
	));
}
