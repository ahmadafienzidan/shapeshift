import { useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() =>
		document.documentElement.classList.contains("dark") ? "dark" : "light",
	);

	const toggle = () => {
		const next = theme === "dark" ? "light" : "dark";
		const root = document.documentElement;
		root.classList.replace(theme, next);
		root.dataset.theme = next;
		localStorage.setItem("theme", next);
		setTheme(next);
	};

	return { theme, toggle };
}
