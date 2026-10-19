import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { redirectTarget } from "./seo/redirect";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

// Applied before the first render, so the wrong language never flashes.
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const target = redirectTarget(
	location.pathname.slice(base.length) || "/",
	location.search,
	localStorage.getItem("locale"),
	navigator.language,
);
if (target) history.replaceState(null, "", `${base}${target}${location.hash}`);

// PageMeta renders these from React; static copies would shadow its updates.
for (const tag of document.head.querySelectorAll(
	'title, meta[name="description"]',
))
	tag.remove();

createRoot(root).render(
	<StrictMode>
		<BrowserRouter basename={import.meta.env.BASE_URL}>
			<LocaleProvider>
				<App />
			</LocaleProvider>
		</BrowserRouter>
	</StrictMode>,
);
