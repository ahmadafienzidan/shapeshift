import { type ReactNode, useState } from "react";
import { IntlProvider } from "react-intl";
import { type Locale, LocaleContext } from "./locale";
import { MESSAGES } from "./messages";

function initialLocale(): Locale {
	const stored = localStorage.getItem("locale");
	if (stored === "en" || stored === "id") return stored;
	return navigator.language.startsWith("id") ? "id" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState(initialLocale);

	const setLocale = (next: Locale) => {
		localStorage.setItem("locale", next);
		document.documentElement.lang = next;
		setLocaleState(next);
	};

	return (
		<LocaleContext value={{ locale, setLocale }}>
			<IntlProvider
				locale={locale}
				messages={MESSAGES[locale]}
				defaultLocale="en"
			>
				{children}
			</IntlProvider>
		</LocaleContext>
	);
}
