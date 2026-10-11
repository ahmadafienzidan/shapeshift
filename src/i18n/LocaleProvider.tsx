import { createContext, type ReactNode, useContext, useState } from "react";
import { IntlProvider } from "react-intl";
import en from "./en.json";
import id from "./id.json";

export const MESSAGES = { en, id };

export type Locale = keyof typeof MESSAGES;

const LocaleContext = createContext<{
	locale: Locale;
	setLocale: (locale: Locale) => void;
} | null>(null);

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

export function useLocale() {
	const context = useContext(LocaleContext);
	if (!context) throw new Error("useLocale must be used inside LocaleProvider");
	return context;
}
